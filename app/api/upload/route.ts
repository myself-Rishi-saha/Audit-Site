

// import { NextResponse } from "next/server";
// import { v2 as cloudinary } from "cloudinary";

// export const runtime = "nodejs";

// // cloudinary.config({
// //   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
// //   api_key: process.env.CLOUDINARY_API_KEY,
// //   api_secret: process.env.CLOUDINARY_API_SECRET,
// // });
// cloudinary.config();
// export async function POST(req: Request) {
//   try {
//     console.log("Cloudinary config:", {
//       cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//       api_key: process.env.CLOUDINARY_API_KEY
//         ? "EXISTS"
//         : "MISSING",
//       api_secret: process.env.CLOUDINARY_API_SECRET
//         ? "EXISTS"
//         : "MISSING",
//     });

//     const form = await req.formData();

//     const file = form.get("file");
//     const reportId = String(form.get("reportId") || "evidence");
//     const type = String(form.get("type") || "photo");

//     console.log("File:", file);

//     if (!(file instanceof File)) {
//       return NextResponse.json(
//         { error: "File required" },
//         { status: 400 }
//       );
//     }

//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);

//     console.log("Uploading to Cloudinary:", {
//       fileName: file.name,
//       size: buffer.length,
//       type: file.type,
//     });

//     const result = await new Promise<any>((resolve, reject) => {
//       const uploadStream = cloudinary.uploader.upload_stream(
//         {
//           folder: `audit-site/${reportId}`,
//           resource_type: "auto",
//         },
//         (error, result) => {
//           if (error) {
//             console.error("Cloudinary error:", error);
//             reject(error);
//           } else {
//             resolve(result);
//           }
//         }
//       );

//       uploadStream.end(buffer);
//     });

//     console.log("Cloudinary success:", result.secure_url);

//     return NextResponse.json({
//       reportId,
//       type,
//       url: result.secure_url,
//       fileName: file.name,
//       capturedAt: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error("Upload error:", error);

//     return NextResponse.json(
//       {
//         error: "Failed to upload file",
//         details:
//           error instanceof Error ? error.message : String(error),
//       },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

import { getDatabase } from "@/lib/db";

export const runtime = "nodejs";

// Maximum upload size: 25 MB
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Only these MIME types are accepted.
const ALLOWED_FILES: Record<
  string,
  { extension: string; type: "image" | "video" }
> = {
  "image/jpeg": { extension: ".jpg", type: "image" },
  "image/png": { extension: ".png", type: "image" },
  "image/webp": { extension: ".webp", type: "image" },
  "image/gif": { extension: ".gif", type: "image" },
  "video/mp4": { extension: ".mp4", type: "video" },
  "video/webm": { extension: ".webm", type: "video" },
  "video/quicktime": { extension: ".mov", type: "video" },
};

// Fixed report mapping. Never use a user-supplied table name.
const REPORT_TYPES = {
  AUD: {
    table: "audits",
    type: "audit",
    permission: "can_access_audit",
  },
  SRV: {
    table: "service_reports",
    type: "service",
    permission: "can_access_service_report",
  },
  DAC: {
    table: "daily_accent_reports",
    type: "daily_accent",
    permission: "can_access_daily_accent_report",
  },
  HOC: {
    table: "handover_certificates",
    type: "handover",
    permission: "can_access_handover_certificate",
  },
} as const;

type ReportPrefix = keyof typeof REPORT_TYPES;

type AuthContext =
  | {
      role: "admin";
      id: string;
    }
  | {
      role: "auditor";
      id: string;
      permissions: Record<string, boolean>;
    };

function getCookie(req: Request, name: string): string | null {
  const cookieHeader = req.headers.get("cookie");

  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const separator = cookie.indexOf("=");

    if (separator === -1) continue;

    const key = cookie.slice(0, separator).trim();

    if (key === name) {
      return decodeURIComponent(cookie.slice(separator + 1).trim());
    }
  }

  return null;
}

async function verifyToken(token: string) {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(secret),
    {
      algorithms: ["HS256"],
    }
  );

  return payload;
}

async function getAuthContext(req: Request): Promise<AuthContext | null> {
  const adminToken = getCookie(req, "auditdesk_admin_session");

  if (adminToken) {
    try {
      const payload = await verifyToken(adminToken);

      if (payload.role === "admin" && payload.id === "ADMIN") {
        return {
          role: "admin",
          id: "ADMIN",
        };
      }
    } catch {
      // Continue to employee authentication if admin token is invalid.
    }
  }

  const employeeToken = getCookie(req, "auditdesk_session");

  if (!employeeToken) return null;

  try {
    const payload = await verifyToken(employeeToken);

    if (
      payload.role !== "auditor" ||
      typeof payload.id !== "string" ||
      !payload.id
    ) {
      return null;
    }

    const db = getDatabase();

    const [rows] = await db.execute<any[]>(
      `SELECT
        id,
        role,
        is_active,
        can_access_audit,
        can_access_service_report,
        can_access_daily_accent_report,
        can_access_handover_certificate
       FROM employees
       WHERE id = ?
       LIMIT 1`,
      [payload.id]
    );

    const employee = rows[0];

    if (
      !employee ||
      Number(employee.is_active) !== 1 ||
      employee.role !== "auditor"
    ) {
      return null;
    }

    return {
      role: "auditor",
      id: String(employee.id),
      permissions: {
        can_access_audit:
          Number(employee.can_access_audit) === 1,
        can_access_service_report:
          Number(employee.can_access_service_report) === 1,
        can_access_daily_accent_report:
          Number(employee.can_access_daily_accent_report) === 1,
        can_access_handover_certificate:
          Number(employee.can_access_handover_certificate) === 1,
      },
    };
  } catch (error) {
    console.error("Employee authentication failed:", error);
    return null;
  }
}

function getReportConfig(reportId: string) {
  const prefix = reportId.split("-")[0].toUpperCase();

  if (prefix in REPORT_TYPES) {
    return REPORT_TYPES[prefix as ReportPrefix];
  }

  return null;
}

async function verifyUploadPermission(
  auth: AuthContext,
  reportId: string
): Promise<boolean> {
  const db = getDatabase();

  // New reports do not have a database ID yet.
  // Their files remain TEMPORARY until the report is created.
  if (reportId.startsWith("new-")) {
    if (auth.role === "admin") {
      return false;
    }

    return Object.values(auth.permissions).some(Boolean);
  }

  const config = getReportConfig(reportId);

  if (!config) {
    return false;
  }

  if (
    auth.role === "auditor" &&
    !auth.permissions[config.permission]
  ) {
    return false;
  }

  const [rows] = await db.execute<any[]>(
    `SELECT id, employee_id, status
     FROM ${config.table}
     WHERE id = ?
     LIMIT 1`,
    [reportId]
  );

  const report = rows[0];

  if (!report) {
    return false;
  }

  // Neither employees nor admins can upload evidence
  // to a completed report.
  if (String(report.status).toUpperCase() !== "DRAFT") {
    return false;
  }

  // Employees can upload only to their own reports.
  if (
    auth.role === "auditor" &&
    String(report.employee_id) !== auth.id
  ) {
    return false;
  }

  return true;
}

export async function POST(req: Request) {
  let savedFilePath: string | null = null;

  try {
    // 1. Authenticate the requester.
    const auth = await getAuthContext(req);

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in again." },
        { status: 401 }
      );
    }

    // 2. Read the upload.
    const form = await req.formData();

    const file = form.get("file");
    const reportId = String(form.get("reportId") || "");
    const requestedType = String(form.get("type") || "image");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File required." },
        { status: 400 }
      );
    }

    if (!reportId || reportId.length > 100) {
      return NextResponse.json(
        { error: "Invalid report ID." },
        { status: 400 }
      );
    }

    // Keep compatibility with clients that use "photo".
    const normalizedRequestedType =
      requestedType === "photo" ? "image" : requestedType;

    if (
      normalizedRequestedType !== "image" &&
      normalizedRequestedType !== "video"
    ) {
      return NextResponse.json(
        { error: "Invalid file type." },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be between 1 byte and 25 MB." },
        { status: 400 }
      );
    }

    const fileConfig = ALLOWED_FILES[file.type];

    if (!fileConfig || fileConfig.type !== normalizedRequestedType) {
      return NextResponse.json(
        { error: "This file format is not supported." },
        { status: 415 }
      );
    }

    // 3. Check report ownership, permission and DRAFT status.
    const allowed = await verifyUploadPermission(auth, reportId);

    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "You cannot upload evidence to this report. Check report ownership, permissions and status.",
        },
        { status: 403 }
      );
    }

    // 4. Validate storage configuration.
    const uploadDir = process.env.UPLOAD_DIR;

    if (!uploadDir || !path.isAbsolute(uploadDir)) {
      throw new Error(
        "UPLOAD_DIR must be configured as an absolute directory path."
      );
    }

    await mkdir(uploadDir, {
      recursive: true,
      mode: 0o700,
    });

    // 5. Generate an unpredictable storage filename.
    const id = randomUUID();
    const storageName = `${id}${fileConfig.extension}`;
    savedFilePath = path.join(uploadDir, storageName);

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.length !== file.size) {
      throw new Error("Uploaded file size validation failed.");
    }

    // 6. Write the file outside public_html.
    await writeFile(savedFilePath, buffer, {
      flag: "wx",
      mode: 0o600,
    });

    // 7. Insert temporary file metadata.
    // Association with the actual report happens during report save.
    const db = getDatabase();

    await db.execute(
      `INSERT INTO report_files (
        id,
        report_type,
        report_id,
        uploaded_by_role,
        uploaded_by_id,
        storage_name,
        original_name,
        mime_type,
        file_size,
        status,
        expires_at
      ) VALUES (
        ?, NULL, NULL, ?, ?, ?, ?, ?, ?, 'TEMPORARY',
        DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 48 HOUR)
      )`,
      [
        id,
        auth.role,
        auth.id,
        storageName,
        file.name.slice(0, 255),
        file.type,
        buffer.length,
      ]
    );

    // 8. Preserve the response shape expected by CameraCapture.
    return NextResponse.json({
      reportId,
      type: fileConfig.type,
      url: `/api/files/${id}`,
      fileName: file.name,
      capturedAt: new Date().toISOString(),
    });
  } catch (error) {
    // Remove the physical file if metadata insertion or another
    // operation fails.
    if (savedFilePath) {
      try {
        await unlink(savedFilePath);
      } catch {
        // The file may not have been created.
      }
    }

    console.error("Local upload error:", error);

    return NextResponse.json(
      {
        error: "Failed to upload file.",
      },
      { status: 500 }
    );
  }
}

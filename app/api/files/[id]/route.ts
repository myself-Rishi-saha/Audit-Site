// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { jwtVerify } from "jose";
// import { readFile } from "node:fs/promises";
// import path from "node:path";
// import type { RowDataPacket } from "mysql2/promise";

// import { getDatabase } from "@/lib/db";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// const EMPLOYEE_COOKIE = "auditdesk_session";
// const ADMIN_COOKIE = "auditdesk_admin_session";

// type RouteContext = {
//   params: Promise<{ id: string }>;
// };

// interface FileRow extends RowDataPacket {
//   id: string;
//   report_type: string | null;
//   report_id: string | null;
//   uploaded_by_role: "admin" | "auditor";
//   uploaded_by_id: string;
//   storage_name: string;
//   original_name: string;
//   mime_type: string;
//   file_size: number | string;
//   status: "TEMPORARY" | "ATTACHED";
// }

// interface EmployeeRow extends RowDataPacket {
//   id: string;
//   role: string;
//   is_active: number | boolean | string;
//   can_access_audit: number | boolean | string;
//   can_access_service_report: number | boolean | string;
//   can_access_daily_accent_report: number | boolean | string;
//   can_access_handover_certificate: number | boolean | string;
// }

// const REPORTS = {
//   audit: {
//     table: "audits",
//     permission: "can_access_audit",
//   },
//   service: {
//     table: "service_reports",
//     permission: "can_access_service_report",
//   },
//   daily_accent: {
//     table: "daily_accent_reports",
//     permission: "can_access_daily_accent_report",
//   },
//   handover: {
//     table: "handover_certificates",
//     permission: "can_access_handover_certificate",
//   },
// } as const;

// function getAuthSecret() {
//   const secret = process.env.AUTH_SECRET;
//   if (!secret) throw new Error("AUTH_SECRET is not configured");
//   return new TextEncoder().encode(secret);
// }

// function enabled(value: unknown) {
//   return value === true || value === 1 || value === "1" || value === "true";
// }

// function unauthorized(message = "Authentication required.") {
//   return NextResponse.json({ error: message }, { status: 401 });
// }

// function forbidden(message = "You cannot access this file.") {
//   return NextResponse.json({ error: message }, { status: 403 });
// }

// export async function GET(
//   _request: Request,
//   { params }: RouteContext,
// ) {
//   try {
//     const { id } = await params;

//     if (
//       !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
//     ) {
//       return NextResponse.json({ error: "Invalid file ID." }, { status: 400 });
//     }

//     const cookieStore = await cookies();
//     const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
//     const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

//     let role: "admin" | "auditor";
//     let userId: string;
//     let employee: EmployeeRow | null = null;

//     if (adminToken) {
//       let payload;

//       try {
//         ({ payload } = await jwtVerify(adminToken, getAuthSecret()));
//       } catch {
//         return unauthorized("Invalid or expired admin session.");
//       }

//       if (payload.role !== "admin" || !payload.id) {
//         return unauthorized("Invalid admin session.");
//       }

//       role = "admin";
//       userId = String(payload.id);
//     } else if (employeeToken) {
//       let payload;

//       try {
//         ({ payload } = await jwtVerify(employeeToken, getAuthSecret()));
//       } catch {
//         return unauthorized("Invalid or expired employee session.");
//       }

//       if (payload.role !== "auditor" || !payload.id) {
//         return unauthorized("Invalid employee session.");
//       }

//       role = "auditor";
//       userId = String(payload.id);

//       const db = getDatabase();
//       const [employees] = await db.execute<EmployeeRow[]>(
//         `SELECT
//            id,
//            role,
//            is_active,
//            can_access_audit,
//            can_access_service_report,
//            can_access_daily_accent_report,
//            can_access_handover_certificate
//          FROM employees
//          WHERE id = ?
//          LIMIT 1`,
//         [userId],
//       );

//       employee = employees[0] ?? null;

//       if (
//         !employee ||
//         !enabled(employee.is_active) ||
//         employee.role !== "auditor"
//       ) {
//         return forbidden("Your employee account is inactive or unauthorized.");
//       }
//     } else {
//       return unauthorized();
//     }

//     const db = getDatabase();

//     const [files] = await db.execute<FileRow[]>(
//       `SELECT
//          id,
//          report_type,
//          report_id,
//          uploaded_by_role,
//          uploaded_by_id,
//          storage_name,
//          original_name,
//          mime_type,
//          file_size,
//          status
//        FROM report_files
//        WHERE id = ?
//        LIMIT 1`,
//       [id],
//     );

//     const file = files[0];

//     if (!file) {
//       return NextResponse.json({ error: "File not found." }, { status: 404 });
//     }

//     if (file.status === "TEMPORARY") {
//       if (
//         file.uploaded_by_role !== role ||
//         file.uploaded_by_id !== userId
//       ) {
//         return forbidden();
//       }
//     } else if (file.status === "ATTACHED") {
//       if (!file.report_type || !file.report_id) {
//         return NextResponse.json(
//           { error: "File attachment metadata is invalid." },
//           { status: 500 },
//         );
//       }

//       const reportConfig =
//         REPORTS[file.report_type as keyof typeof REPORTS];

//       if (!reportConfig) {
//         return NextResponse.json(
//           { error: "Unsupported report type." },
//           { status: 500 },
//         );
//       }

//       // Table and permission names come only from the fixed allowlist above.
//       const [reports] = await db.execute<RowDataPacket[]>(
//         `SELECT id, employee_id
//          FROM ${reportConfig.table}
//          WHERE id = ?
//          LIMIT 1`,
//         [file.report_id],
//       );

//       const report = reports[0];

//       if (!report) {
//         return NextResponse.json(
//           { error: "Associated report not found." },
//           { status: 404 },
//         );
//       }

//       if (role === "auditor") {
//         if (String(report.employee_id) !== userId) {
//           return forbidden();
//         }

//         if (!employee || !enabled(employee[reportConfig.permission])) {
//           return forbidden("You do not have permission to access this report.");
//         }
//       }
//     } else {
//       return NextResponse.json(
//         { error: "Invalid file status." },
//         { status: 500 },
//       );
//     }

//     const uploadDir = process.env.UPLOAD_DIR;

//     if (!uploadDir) {
//       throw new Error("UPLOAD_DIR is not configured.");
//     }

//     // Storage names are generated by the server and must be a single filename.
//     if (
//       !file.storage_name ||
//       path.basename(file.storage_name) !== file.storage_name
//     ) {
//       throw new Error("Invalid stored filename.");
//     }

//     const root = path.resolve(uploadDir);
//     const filePath = path.resolve(root, file.storage_name);

//     if (path.dirname(filePath) !== root) {
//       throw new Error("Invalid file path.");
//     }

//     const buffer = await readFile(filePath);

//     const safeMimeType = /^[\w.+-]+\/[\w.+-]+$/.test(file.mime_type)
//       ? file.mime_type
//       : "application/octet-stream";

//     return new Response(new Uint8Array(buffer), {
//       status: 200,
//       headers: {
//         "Content-Type": safeMimeType,
//         "Content-Length": String(buffer.length),
//         "Content-Disposition": "inline",
//         "Cache-Control": "private, no-store, max-age=0",
//         "X-Content-Type-Options": "nosniff",
//       },
//     });
//   } catch (error) {
//     console.error("GET /api/files/[id] error:", error);

//     return NextResponse.json(
//       { error: "Failed to retrieve file." },
//       { status: 500 },
//     );
//   }
// }

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { RowDataPacket } from "mysql2/promise";

import { getDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMPLOYEE_COOKIE = "auditdesk_session";
const ADMIN_COOKIE = "auditdesk_admin_session";

const FILE_TOKEN_ISSUER = "system-and-solutions";
const FILE_TOKEN_AUDIENCE = "evidence-file-view";
const FILE_TOKEN_LIFETIME = "1825d"; // 5 years

type RouteContext = {
  params: Promise<{ id: string }>;
};

interface FileRow extends RowDataPacket {
  id: string;
  report_type: string | null;
  report_id: string | null;
  uploaded_by_role: "admin" | "auditor";
  uploaded_by_id: string;
  storage_name: string;
  original_name: string;
  mime_type: string;
  file_size: number | string;
  status: "TEMPORARY" | "ATTACHED";
}

interface EmployeeRow extends RowDataPacket {
  id: string;
  role: string;
  is_active: number | boolean | string;
  can_access_audit: number | boolean | string;
  can_access_service_report: number | boolean | string;
  can_access_daily_accent_report: number | boolean | string;
  can_access_handover_certificate: number | boolean | string;
}

type AuthContext = {
  role: "admin" | "auditor";
  userId: string;
  employee: EmployeeRow | null;
};

const REPORTS = {
  audit: {
    table: "audits",
    permission: "can_access_audit",
  },
  service: {
    table: "service_reports",
    permission: "can_access_service_report",
  },
  daily_accent: {
    table: "daily_accent_reports",
    permission: "can_access_daily_accent_report",
  },
  handover: {
    table: "handover_certificates",
    permission: "can_access_handover_certificate",
  },
} as const;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  return new TextEncoder().encode(secret);
}

function enabled(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function unauthorized(message = "Authentication required.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message = "You cannot access this file.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

function validFileId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
}

// ========================================
// AUTHENTICATE ADMIN / EMPLOYEE
// ========================================

async function getAuthenticatedUser(): Promise<AuthContext | NextResponse> {
  const cookieStore = await cookies();

  const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
  const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

  if (adminToken) {
    try {
      const { payload } = await jwtVerify(adminToken, getAuthSecret());

      if (payload.role !== "admin" || !payload.id) {
        return unauthorized("Invalid admin session.");
      }

      return {
        role: "admin",
        userId: String(payload.id),
        employee: null,
      };
    } catch {
      return unauthorized("Invalid or expired admin session.");
    }
  }

  if (employeeToken) {
    try {
      const { payload } = await jwtVerify(employeeToken, getAuthSecret());

      if (payload.role !== "auditor" || !payload.id) {
        return unauthorized("Invalid employee session.");
      }

      const userId = String(payload.id);
      const db = getDatabase();

      const [employees] = await db.execute<EmployeeRow[]>(
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
        [userId],
      );

      const employee = employees[0] ?? null;

      if (
        !employee ||
        !enabled(employee.is_active) ||
        employee.role !== "auditor"
      ) {
        return forbidden("Your employee account is inactive or unauthorized.");
      }

      return {
        role: "auditor",
        userId,
        employee,
      };
    } catch {
      return unauthorized("Invalid or expired employee session.");
    }
  }

  return unauthorized();
}

// ========================================
// FETCH FILE RECORD
// ========================================

async function getFile(id: string): Promise<FileRow | null> {
  const db = getDatabase();

  const [files] = await db.execute<FileRow[]>(
    `SELECT
       id,
       report_type,
       report_id,
       uploaded_by_role,
       uploaded_by_id,
       storage_name,
       original_name,
       mime_type,
       file_size,
       status
     FROM report_files
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  return files[0] ?? null;
}

// ========================================
// CHECK USER FILE PERMISSIONS
// ========================================

async function authorizeFile(
  file: FileRow,
  auth: AuthContext,
): Promise<NextResponse | null> {
  const db = getDatabase();

  if (file.status === "TEMPORARY") {
    if (
      file.uploaded_by_role !== auth.role ||
      file.uploaded_by_id !== auth.userId
    ) {
      return forbidden();
    }

    return null;
  }

  if (file.status !== "ATTACHED") {
    return NextResponse.json(
      { error: "Invalid file status." },
      { status: 500 },
    );
  }

  if (!file.report_type || !file.report_id) {
    return NextResponse.json(
      { error: "File attachment metadata is invalid." },
      { status: 500 },
    );
  }

  const reportConfig = REPORTS[file.report_type as keyof typeof REPORTS];

  if (!reportConfig) {
    return NextResponse.json(
      { error: "Unsupported report type." },
      { status: 500 },
    );
  }

  const [reports] = await db.execute<RowDataPacket[]>(
    `SELECT id, employee_id
     FROM ${reportConfig.table}
     WHERE id = ?
     LIMIT 1`,
    [file.report_id],
  );

  const report = reports[0];

  if (!report) {
    return NextResponse.json(
      { error: "Associated report not found." },
      { status: 404 },
    );
  }

  if (auth.role === "auditor") {
    if (String(report.employee_id) !== auth.userId) {
      return forbidden();
    }

    if (!auth.employee || !enabled(auth.employee[reportConfig.permission])) {
      return forbidden("You do not have permission to access this report.");
    }
  }

  return null;
}

// ========================================
// VERIFY SIGNED FILE TOKEN
// ========================================

async function verifyFileToken(
  token: string,
  fileId: string,
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), {
      issuer: FILE_TOKEN_ISSUER,
      audience: FILE_TOKEN_AUDIENCE,
    });

    return payload.purpose === "file-view" && payload.fileId === fileId;
  } catch {
    return false;
  }
}

// ========================================
// GENERATE SIGNED VIEW URL
// POST /api/files/[id]
// ========================================

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!validFileId(id)) {
      return NextResponse.json({ error: "Invalid file ID." }, { status: 400 });
    }

    // Only logged-in users can create viewing links.
    const auth = await getAuthenticatedUser();

    if (auth instanceof NextResponse) {
      return auth;
    }

    const file = await getFile(id);

    if (!file) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    // Only attached evidence can receive a public viewing URL.
    if (file.status !== "ATTACHED") {
      return forbidden("Only attached report files can receive viewing links.");
    }

    const accessError = await authorizeFile(file, auth);

    if (accessError) {
      return accessError;
    }

    const token = await new SignJWT({
      purpose: "file-view",
      fileId: id,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer(FILE_TOKEN_ISSUER)
      .setAudience(FILE_TOKEN_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(FILE_TOKEN_LIFETIME)
      .sign(getAuthSecret());
    const configuredFrontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL?.trim();

    const requestUrl = new URL(request.url);

    // Use the configured frontend URL in production.
    // In local development, use the actual localhost origin.
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? configuredFrontendUrl
        : requestUrl.origin;

    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_FRONTEND_URL is not configured.");
    }

    const url = new URL(`/api/files/${id}`, baseUrl);

    url.searchParams.set("token", token);

    return NextResponse.json({
      url: url.toString(),
      expiresIn: FILE_TOKEN_LIFETIME,
    });
    // const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;

    // if (!frontendUrl) {
    //   throw new Error("NEXT_PUBLIC_FRONTEND_URL is not configured.");
    // }

    // const baseUrl = frontendUrl.replace(/\/+$/, "");

    // const url = new URL(`${baseUrl}/api/files/${id}`);

    // url.searchParams.set("token", token);

    // return NextResponse.json({
    //   url: url.toString(),
    //   expiresIn: FILE_TOKEN_LIFETIME,
    // });
  } catch (error) {
    console.error("POST /api/files/[id] error:", error);

    return NextResponse.json(
      { error: "Could not create file viewing link." },
      { status: 500 },
    );
  }
}

// ========================================
// SERVE FILE
// GET /api/files/[id]
// ========================================

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!validFileId(id)) {
      return NextResponse.json({ error: "Invalid file ID." }, { status: 400 });
    }

    const file = await getFile(id);

    if (!file) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const url = new URL(request.url);
    const signedToken = url.searchParams.get("token");

    if (signedToken) {
      // Signed links work without an application session.
      const valid = await verifyFileToken(signedToken, id);

      if (!valid) {
        return unauthorized("File viewing link is invalid or expired.");
      }

      // Signed links are only for attached report evidence.
      if (file.status !== "ATTACHED") {
        return forbidden();
      }
    } else {
      // Preserve the original authenticated access behavior
      // for application previews and temporary uploads.
      const auth = await getAuthenticatedUser();

      if (auth instanceof NextResponse) {
        return auth;
      }

      const accessError = await authorizeFile(file, auth);

      if (accessError) {
        return accessError;
      }
    }

    // ========================================
    // READ STORED FILE
    // ========================================

    const uploadDir = process.env.UPLOAD_DIR;

    if (!uploadDir) {
      throw new Error("UPLOAD_DIR is not configured.");
    }

    if (
      !file.storage_name ||
      path.basename(file.storage_name) !== file.storage_name
    ) {
      throw new Error("Invalid stored filename.");
    }

    const root = path.resolve(uploadDir);
    const filePath = path.resolve(root, file.storage_name);

    if (path.dirname(filePath) !== root) {
      throw new Error("Invalid file path.");
    }

    const fileInfo = await stat(filePath);
    const fileSize = fileInfo.size;

    const safeMimeType = /^[\w.+-]+\/[\w.+-]+$/.test(file.mime_type)
      ? file.mime_type
      : "application/octet-stream";

    const range = request.headers.get("range");

    const commonHeaders = {
      "Content-Type": safeMimeType,
      "Accept-Ranges": "bytes",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",

      // Signed URLs are bearer links. Do not cache them publicly.
      "Cache-Control": "private, no-store, max-age=0",
    };

    // ========================================
    // VIDEO RANGE REQUESTS
    // ========================================

    if (range) {
      const match = range.match(/bytes=(\d*)-(\d*)/);

      if (!match) {
        return new Response(null, {
          status: 416,
          headers: {
            ...commonHeaders,
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      let start: number;
      let end: number;

      if (match[1] === "") {
        const suffixLength = Number(match[2]);

        start = Math.max(0, fileSize - suffixLength);
        end = fileSize - 1;
      } else {
        start = Number(match[1]);
        end = match[2] ? Number(match[2]) : fileSize - 1;
      }

      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start < 0 ||
        start >= fileSize ||
        end < start
      ) {
        return new Response(null, {
          status: 416,
          headers: {
            ...commonHeaders,
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      end = Math.min(end, fileSize - 1);

      const buffer = await readFile(filePath);
      const chunk = buffer.subarray(start, end + 1);

      return new Response(new Uint8Array(chunk), {
        status: 206,
        headers: {
          ...commonHeaders,
          "Content-Length": String(chunk.length),
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        },
      });
    }

    // ========================================
    // NORMAL FILE RESPONSE
    // ========================================

    const buffer = await readFile(filePath);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        ...commonHeaders,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("GET /api/files/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve file." },
      { status: 500 },
    );
  }
}

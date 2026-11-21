
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RowDataPacket } from "mysql2/promise";

import { getDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMPLOYEE_COOKIE = "auditdesk_session";
const ADMIN_COOKIE = "auditdesk_admin_session";

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
  if (!secret) throw new Error("AUTH_SECRET is not configured");
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

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ) {
      return NextResponse.json({ error: "Invalid file ID." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
    const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

    let role: "admin" | "auditor";
    let userId: string;
    let employee: EmployeeRow | null = null;

    if (adminToken) {
      let payload;

      try {
        ({ payload } = await jwtVerify(adminToken, getAuthSecret()));
      } catch {
        return unauthorized("Invalid or expired admin session.");
      }

      if (payload.role !== "admin" || !payload.id) {
        return unauthorized("Invalid admin session.");
      }

      role = "admin";
      userId = String(payload.id);
    } else if (employeeToken) {
      let payload;

      try {
        ({ payload } = await jwtVerify(employeeToken, getAuthSecret()));
      } catch {
        return unauthorized("Invalid or expired employee session.");
      }

      if (payload.role !== "auditor" || !payload.id) {
        return unauthorized("Invalid employee session.");
      }

      role = "auditor";
      userId = String(payload.id);

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

      employee = employees[0] ?? null;

      if (
        !employee ||
        !enabled(employee.is_active) ||
        employee.role !== "auditor"
      ) {
        return forbidden("Your employee account is inactive or unauthorized.");
      }
    } else {
      return unauthorized();
    }

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

    const file = files[0];

    if (!file) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    if (file.status === "TEMPORARY") {
      if (
        file.uploaded_by_role !== role ||
        file.uploaded_by_id !== userId
      ) {
        return forbidden();
      }
    } else if (file.status === "ATTACHED") {
      if (!file.report_type || !file.report_id) {
        return NextResponse.json(
          { error: "File attachment metadata is invalid." },
          { status: 500 },
        );
      }

      const reportConfig =
        REPORTS[file.report_type as keyof typeof REPORTS];

      if (!reportConfig) {
        return NextResponse.json(
          { error: "Unsupported report type." },
          { status: 500 },
        );
      }

      // Table and permission names come only from the fixed allowlist above.
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

      if (role === "auditor") {
        if (String(report.employee_id) !== userId) {
          return forbidden();
        }

        if (!employee || !enabled(employee[reportConfig.permission])) {
          return forbidden("You do not have permission to access this report.");
        }
      }
    } else {
      return NextResponse.json(
        { error: "Invalid file status." },
        { status: 500 },
      );
    }

    const uploadDir = process.env.UPLOAD_DIR;

    if (!uploadDir) {
      throw new Error("UPLOAD_DIR is not configured.");
    }

    // Storage names are generated by the server and must be a single filename.
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

    const buffer = await readFile(filePath);

    const safeMimeType = /^[\w.+-]+\/[\w.+-]+$/.test(file.mime_type)
      ? file.mime_type
      : "application/octet-stream";

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": safeMimeType,
        "Content-Length": String(buffer.length),
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
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

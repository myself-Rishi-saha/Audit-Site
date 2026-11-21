

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { attachEvidenceFiles } from "@/lib/report-files";
import { getDatabase } from "@/lib/db";

const EMPLOYEE_COOKIE = "auditdesk_session";
const ADMIN_COOKIE = "auditdesk_admin_session";

interface AuditRow extends RowDataPacket {
  id: string;
  employee_id: string;
  employee_name: string;
  template_id: string;
  template_snapshot: unknown;
  customer_id: string | null;
  customer_name: string | null;
  customer_address: string | null;
  form_data: unknown;
  evidence: unknown;
  signatures: unknown;
  status: string;
  score: number | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  submitted_at: Date | string | null;
  customer_gst_no: string | null;
  customer_contact_number: string | null;
}

interface EmployeeRow extends RowDataPacket {
  id: string;
  name?: string;
  role: string;
  is_active: boolean | number | string;
  can_access_audit: boolean | number | string;
}

interface CounterRow extends RowDataPacket {
  next_number: number | string;
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  let parsed = value;

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return {};
    }
  }

  if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }

  return {};
}

// MariaDB DATETIME values in this app are stored as UTC.
function toIsoString(value: Date | string | null): string | null {
  if (value == null) return null;

  if (value instanceof Date) {
    return value.toISOString();
  }

  const normalized = value.trim().replace(" ", "T");

  // A DATETIME string has no timezone suffix. Interpret it as UTC.
  const withTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized)
    ? normalized
    : `${normalized}Z`;

  const date = new Date(withTimezone);

  return Number.isNaN(date.getTime()) ? normalized : date.toISOString();
}

function mapAudit(row: AuditRow) {
  return {
    id: String(row.id),
    employeeId: String(row.employee_id),
    employeeName: String(row.employee_name),
    customerId: row.customer_id == null ? null : String(row.customer_id),
    customerName: row.customer_name == null ? null : String(row.customer_name),
    customerGstNo: row.customer_gst_no ?? null,
    customerContactNumber: row.customer_contact_number ?? null,
    customerAddress:
      row.customer_address == null ? null : String(row.customer_address),
    templateId: String(row.template_id || ""),
    templateSnapshot: (() => {
      const parsed = parseJsonObject(row.template_snapshot);

      return Object.keys(parsed).length
        ? parsed
        : {
            id: row.template_id || "audit-report",
            type: "AUDIT",
            title: "Audit",
            sections: [],
          };
    })(),
    formData: parseJsonObject(row.form_data),
    evidence: parseJsonObject(row.evidence),
    signatures: parseJsonObject(row.signatures),
    status: String(row.status).toUpperCase(),
    score: row.score == null ? null : Number(row.score),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    submittedAt: toIsoString(row.submitted_at),
  };
}

function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

function validateDate(date: string | null) {
  if (!date) return null;

  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return "Invalid date. Use YYYY-MM-DD.";
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return "Invalid calendar date.";
  }

  return null;
}

// Convert an Asia/Kolkata calendar date to UTC database boundaries.
// The database timestamps are stored in UTC.
function getIndiaDateRange(date: string): { start: string; end: string } {
  const [year, month, day] = date.split("-").map(Number);
  const localMidnightAsUtc = Date.UTC(year, month - 1, day);

  const start = new Date(localMidnightAsUtc - 330 * 60 * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const format = (value: Date) =>
    value.toISOString().slice(0, 23).replace("T", " ");

  return { start: format(start), end: format(end) };
}

async function getCurrentEmployee(
  employeeId: string,
): Promise<EmployeeRow | undefined> {
  const db = getDatabase();

  const [rows] = await db.execute<EmployeeRow[]>(
    `SELECT id, name, role, is_active, can_access_audit
     FROM employees
     WHERE id = ?
     LIMIT 1`,
    [employeeId],
  );

  return rows[0];
}

/**
 * GET /api/audits
 *
 * Admin: completed audits only.
 * Employee: own audits, including drafts.
 * Both support date and search filters.
 */
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
    const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
    const db = getDatabase();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date")?.trim() || null;
    const searchTerm = searchParams.get("search")?.trim() || "";

    const dateError = validateDate(date);

    if (dateError) {
      return NextResponse.json({ error: dateError }, { status: 400 });
    }

    const searchPattern = `%${searchTerm}%`;
    const dateRange = date ? getIndiaDateRange(date) : null;

    // ADMIN: completed reports only.
    if (adminToken) {
      let payload;

      try {
        ({ payload } = await jwtVerify(adminToken, getAuthSecret()));
      } catch {
        return unauthorized("Invalid or expired admin session.");
      }

      if (!payload.id || payload.role !== "admin") {
        return unauthorized();
      }

      const conditions = [
        "UPPER(status) = 'COMPLETED'",
        "submitted_at IS NOT NULL",
      ];
      const values: (string | number | null)[] = [];

      if (dateRange) {
        conditions.push("submitted_at >= ?", "submitted_at < ?");
        values.push(dateRange.start, dateRange.end);
      }

      if (searchTerm) {
        conditions.push(
          "(id LIKE ? OR employee_name LIKE ? OR COALESCE(customer_name, '') LIKE ?)",
        );
        values.push(searchPattern, searchPattern, searchPattern);
      }

      const [rows] = await db.execute<AuditRow[]>(
        `SELECT
           id, employee_id, employee_name, template_id, template_snapshot,
           customer_id, customer_name, customer_address,
customer_gst_no, customer_contact_number,
form_data, evidence,
           signatures, status, score, created_at, updated_at, submitted_at
         FROM audits
         WHERE ${conditions.join(" AND ")}
         ORDER BY submitted_at DESC`,
        values,
      );

      return NextResponse.json(rows.map(mapAudit));
    }

    // EMPLOYEE: validate JWT and current database permissions.
    if (employeeToken) {
      let payload;

      try {
        ({ payload } = await jwtVerify(employeeToken, getAuthSecret()));
      } catch {
        return unauthorized("Invalid or expired employee session.");
      }

      if (!payload.id || payload.role !== "auditor") {
        return unauthorized("Invalid employee session.");
      }

      const employeeId = String(payload.id);
      const employee = await getCurrentEmployee(employeeId);

      if (
        !employee ||
        !toBoolean(employee.is_active) ||
        employee.role !== "auditor"
      ) {
        return forbidden("Your employee account is inactive or unauthorized.");
      }

      if (!toBoolean(employee.can_access_audit)) {
        return forbidden("You do not have permission to access audit reports.");
      }

      const conditions = ["employee_id = ?"];
      const values: (string | number | null)[] = [employeeId];

      if (searchTerm) {
        conditions.push("(id LIKE ? OR COALESCE(customer_name, '') LIKE ?)");
        values.push(searchPattern, searchPattern);
      }

      if (dateRange) {
        conditions.push(
          "COALESCE(submitted_at, created_at) >= ?",
          "COALESCE(submitted_at, created_at) < ?",
        );
        values.push(dateRange.start, dateRange.end);
      }

      const [rows] = await db.execute<AuditRow[]>(
        `SELECT
           id, employee_id, employee_name, template_id, template_snapshot,
           customer_id, customer_name, customer_address,
customer_gst_no, customer_contact_number,
form_data, evidence,
           signatures, status, score, created_at, updated_at, submitted_at
         FROM audits
         WHERE ${conditions.join(" AND ")}
         ORDER BY created_at DESC`,
        values,
      );

      return NextResponse.json(rows.map(mapAudit));
    }

    return unauthorized("Authentication required.");
  } catch (error) {
    console.error("Read audits error:", error);

    return NextResponse.json(
      { error: "Failed to load audits." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/audits
 *
 * Creates a draft for the authenticated, active auditor
 * when audit permission is enabled.
 */
export async function POST(req: Request) {
  let connection: PoolConnection | undefined;

  try {
    const cookieStore = await cookies();
    const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

    if (!employeeToken) {
      return unauthorized("Authentication required.");
    }

    let payload;

    try {
      ({ payload } = await jwtVerify(employeeToken, getAuthSecret()));
    } catch {
      return unauthorized("Invalid or expired employee session.");
    }

    if (!payload.id || payload.role !== "auditor") {
      return forbidden("Only authenticated auditors can create audits.");
    }

    const employeeId = String(payload.id);
    const employee = await getCurrentEmployee(employeeId);

    if (!employee) {
      return NextResponse.json(
        { error: "Employee account not found." },
        { status: 404 },
      );
    }

    if (!toBoolean(employee.is_active) || employee.role !== "auditor") {
      return forbidden("Your employee account is inactive or unauthorized.");
    }

    if (!toBoolean(employee.can_access_audit)) {
      return forbidden("You do not have permission to create audit reports.");
    }

    const body = await req.json();

    const templateId =
      typeof body.templateId === "string" && body.templateId.trim()
        ? body.templateId.trim()
        : "audit-report";

    const templateSnapshot = body.templateSnapshot ?? {
      id: templateId,
      type: "AUDIT",
      title: "Audit Form",
      sections: [],
    };

    const customerId = body.customerId ?? null;
    const customerName = body.customerName ?? null;
    const customerAddress = body.customerAddress ?? null;
    const customerGstNo = body.customerGstNo ?? null;
    const customerContactNumber = body.customerContactNumber ?? null;
    const formData = body.formData ?? {};
    const evidence = body.evidence ?? {};
    const signatures = body.signatures ?? {};

    const db = getDatabase();
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Ensure the AUD counter exists using the actual table schema.
    await connection.execute(
      `INSERT IGNORE INTO report_id_counters (report_type, next_number)
       VALUES ('AUD', 1)`,
    );

    // Lock the counter to prevent concurrent requests generating the same ID.
    const [counterRows] = await connection.execute<CounterRow[]>(
      `SELECT next_number
       FROM report_id_counters
       WHERE report_type = 'AUD'
       FOR UPDATE`,
    );

    if (!counterRows.length) {
      throw new Error("Unable to initialize AUD report ID counter.");
    }

    const [maxRows] = await connection.execute<
      (RowDataPacket & { next_number: number | string })[]
    >(
      `SELECT COALESCE(
         MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)), 0
       ) + 1 AS next_number
       FROM audits
       WHERE id REGEXP '^AUD-[0-9]+$'`,
    );

    // Also account for any existing reports if the counter is behind.
    const nextNumber = Math.max(
      Number(counterRows[0].next_number),
      Number(maxRows[0]?.next_number ?? 1),
    );

    const auditId = `AUD-${String(nextNumber).padStart(3, "0")}`;

    // await connection.execute(
    //   `UPDATE report_id_counters
    //    SET next_number = ?
    //    WHERE report_type = 'AUD'`,
    //   [nextNumber + 1],
    // );

    // await connection.execute(
    //   `INSERT INTO audits (
    //      id,
    //      employee_id,
    //      employee_name,
    //      template_id,
    //      template_snapshot,
    //      customer_id,
    //      customer_name,
    //      customer_address,
    //          customerGstNo,
    // customerContactNumber,
    //      form_data,
    //      evidence,
    //      signatures,
    //      status,
    //      score,
    //      created_at,
    //      updated_at
    //    )
    //    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', NULL,
    //            UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
    //   [
    //     auditId,
    //     employeeId,
    //     String(employee.name ?? ""),
    //     templateId,
    //     JSON.stringify(templateSnapshot),
    //     customerId,
    //     customerName,
    //     customerAddress,

    //     JSON.stringify(formData),
    //     JSON.stringify(evidence),
    //     JSON.stringify(signatures),
    //   ],
    // );

    await connection.execute(
      `INSERT INTO audits (
     id,
     employee_id,
     employee_name,
     template_id,
     template_snapshot,
     customer_id,
     customer_name,
     customer_address,
     customer_gst_no,
     customer_contact_number,
     form_data,
     evidence,
     signatures,
     status,
     score,
     created_at,
     updated_at
   )
   VALUES (
     ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
     'DRAFT', NULL, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3)
   )`,
      [
        auditId,
        employeeId,
        String(employee.name ?? ""),
        templateId,
        JSON.stringify(templateSnapshot),
        customerId,
        customerName,
        customerAddress,
        customerGstNo,
        customerContactNumber,
        JSON.stringify(formData),
        JSON.stringify(evidence),
        JSON.stringify(signatures),
      ],
    );

    const [createdRows] = await connection.execute<AuditRow[]>(
      `SELECT
         id, employee_id, employee_name, template_id, template_snapshot,
         customer_id, customer_name, customer_address,
customer_gst_no, customer_contact_number,
form_data, evidence,
         signatures, status, score, created_at, updated_at, submitted_at
       FROM audits
       WHERE id = ?
       LIMIT 1`,
      [auditId],
    );

    if (!createdRows.length) {
      throw new Error("Audit was inserted but could not be retrieved.");
    }
    await attachEvidenceFiles(connection, {
  evidence,
  reportType: "audit",
  reportId: auditId,
  uploaderRole: "auditor",
  uploaderId: employeeId,
  allowNewFiles: true,
});

    await connection.commit();

    return NextResponse.json(mapAudit(createdRows[0]), { status: 201 });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Audit transaction rollback error:", rollbackError);
      }
    }

    console.error("Create audit error:", error);

    return NextResponse.json(
      { error: "Failed to create audit." },
      { status: 500 },
    );
  } finally {
    connection?.release();
  }
}

// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { jwtVerify } from "jose";
// import { neon } from "@neondatabase/serverless";

// const EMPLOYEE_COOKIE = "auditdesk_session";
// const ADMIN_COOKIE = "auditdesk_admin_session";

// function getAuthSecret() {
//   const secret = process.env.AUTH_SECRET;

//   if (!secret) {
//     throw new Error("AUTH_SECRET is not configured");
//   }

//   return new TextEncoder().encode(secret);
// }

// function getDatabase() {
//   const url = process.env.DATABASE_URL;

//   if (!url) {
//     throw new Error("DATABASE_URL is not configured");
//   }

//   return neon(url);
// }

// function mapAudit(row: any) {
//   return {
//     id: String(row.id),
//     employeeId: String(row.employee_id),
//     employeeName: String(row.employee_name),

//     customerId:
//       row.customer_id == null ? null : String(row.customer_id),

//     customerName:
//       row.customer_name == null ? null : String(row.customer_name),

//     customerAddress:
//       row.customer_address == null
//         ? null
//         : String(row.customer_address),

//     templateId: String(row.template_id || ""),

//     templateSnapshot:
//       row.template_snapshot &&
//       typeof row.template_snapshot === "object" &&
//       !Array.isArray(row.template_snapshot)
//         ? row.template_snapshot
//         : {
//             id: row.template_id || "audit",
//             type: "AUDIT",
//             title: "Audit",
//             sections: [],
//           },

//     formData:
//       row.form_data &&
//       typeof row.form_data === "object" &&
//       !Array.isArray(row.form_data)
//         ? row.form_data
//         : {},

//     evidence:
//       row.evidence &&
//       typeof row.evidence === "object" &&
//       !Array.isArray(row.evidence)
//         ? row.evidence
//         : {},

//     signatures:
//       row.signatures &&
//       typeof row.signatures === "object" &&
//       !Array.isArray(row.signatures)
//         ? row.signatures
//         : {},

//     status: String(row.status).toUpperCase(),

//     score: row.score == null ? null : Number(row.score),

//     createdAt:
//       row.created_at?.toISOString?.() || String(row.created_at),

//     updatedAt:
//       row.updated_at?.toISOString?.() || String(row.updated_at),

//     submittedAt:
//       row.submitted_at == null
//         ? null
//         : row.submitted_at?.toISOString?.() ||
//           String(row.submitted_at),
//   };
// }

// function unauthorized(message = "Unauthorized") {
//   return NextResponse.json({ error: message }, { status: 401 });
// }

// function forbidden(message: string) {
//   return NextResponse.json({ error: message }, { status: 403 });
// }

// function validateDate(date: string | null) {
//   if (!date) return null;

//   const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

//   if (!match) {
//     return "Invalid date. Use YYYY-MM-DD.";
//   }

//   const year = Number(match[1]);
//   const month = Number(match[2]);
//   const day = Number(match[3]);

//   const parsedDate = new Date(Date.UTC(year, month - 1, day));

//   if (
//     parsedDate.getUTCFullYear() !== year ||
//     parsedDate.getUTCMonth() !== month - 1 ||
//     parsedDate.getUTCDate() !== day
//   ) {
//     return "Invalid calendar date.";
//   }

//   return null;
// }

// /**
//  * GET /api/audits
//  *
//  * ADMIN:
//  * - Returns completed audits.
//  * - Supports date and search filters.
//  *
//  * EMPLOYEE:
//  * - Requires an active auditor account and audit permission.
//  * - Returns only the employee's own audits.
//  * - Supports SQL-based date and search filters.
//  */
// export async function GET(request: Request) {
//   try {
//     const cookieStore = await cookies();

//     const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
//     const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

//     const sql = getDatabase();

//     const { searchParams } = new URL(request.url);

//     const date = searchParams.get("date")?.trim() || null;
//     const searchTerm = searchParams.get("search")?.trim() || "";

//     const dateError = validateDate(date);

//     if (dateError) {
//       return NextResponse.json(
//         { error: dateError },
//         { status: 400 },
//       );
//     }

//     const searchPattern = `%${searchTerm}%`;

//     // -----------------------------------------
//     // ADMIN
//     // -----------------------------------------
//     if (adminToken) {
//       try {
//         const { payload } = await jwtVerify(
//           adminToken,
//           getAuthSecret(),
//         );

//         if (!payload.id || payload.role !== "admin") {
//           return unauthorized();
//         }

//         const rows = await sql`
//           SELECT
//             id,
//             employee_id,
//             employee_name,
//             template_id,
//             template_snapshot,
//             customer_id,
//             customer_name,
//             customer_address,
//             form_data,
//             evidence,
//             signatures,
//             status,
//             score,
//             created_at,
//             updated_at,
//             submitted_at
//           FROM audits
//           WHERE UPPER(status) = 'COMPLETED'
//             AND submitted_at IS NOT NULL
//             AND (
//               ${date}::date IS NULL
//               OR (
//                 submitted_at >= (
//                   ${date}::date::timestamp
//                   AT TIME ZONE 'Asia/Kolkata'
//                 )
//                 AND submitted_at < (
//                   (${date}::date + 1)::timestamp
//                   AT TIME ZONE 'Asia/Kolkata'
//                 )
//               )
//             )
//             AND (
//               ${searchTerm} = ''
//               OR id ILIKE ${searchPattern}
//               OR employee_name ILIKE ${searchPattern}
//               OR COALESCE(customer_name, '') ILIKE ${searchPattern}
//             )
//           ORDER BY submitted_at DESC
//         `;

//         return NextResponse.json(rows.map(mapAudit));
//       } catch (error) {
//         console.error("Admin audits GET error:", error);

//         return unauthorized("Invalid or expired admin session.");
//       }
//     }

//     // -----------------------------------------
//     // EMPLOYEE
//     // -----------------------------------------
//     if (employeeToken) {
//       let payload;

//       try {
//         const result = await jwtVerify(
//           employeeToken,
//           getAuthSecret(),
//         );

//         payload = result.payload;
//       } catch {
//         return unauthorized("Invalid or expired employee session.");
//       }

//       if (!payload.id || payload.role !== "auditor") {
//         return unauthorized("Invalid employee session.");
//       }

//       // Employee identity comes from the verified JWT,
//       // never from query parameters.
//       const employeeId = String(payload.id);

//       // Always check current permissions in the database.
//       const employees = await sql`
//         SELECT
//           id,
//           role,
//           is_active,
//           can_access_audit
//         FROM employees
//         WHERE id = ${employeeId}
//         LIMIT 1
//       `;

//       const employee = employees[0];

//       if (
//         !employee ||
//         employee.is_active !== true ||
//         employee.role !== "auditor"
//       ) {
//         return forbidden(
//           "Your employee account is inactive or unauthorized.",
//         );
//       }

//       if (employee.can_access_audit !== true) {
//         return forbidden(
//           "You do not have permission to access audit reports.",
//         );
//       }

//       // SQL-based employee filters:
//       // Search by audit ID/customer name and filter by date.
//       // Employees can see only their own audits.
//       // Drafts remain visible to preserve the existing workflow.
//       const rows = await sql`
//         SELECT
//           id,
//           employee_id,
//           employee_name,
//           template_id,
//           template_snapshot,
//           customer_id,
//           customer_name,
//           customer_address,
//           form_data,
//           evidence,
//           signatures,
//           status,
//           score,
//           created_at,
//           updated_at,
//           submitted_at
//         FROM audits
//         WHERE employee_id = ${employeeId}
//           AND (
//             ${searchTerm} = ''
//             OR id ILIKE ${searchPattern}
//             OR COALESCE(customer_name, '') ILIKE ${searchPattern}
//           )
//           AND (
//             ${date}::date IS NULL
//             OR (
//               COALESCE(submitted_at, created_at) >= (
//                 ${date}::date::timestamp
//                 AT TIME ZONE 'Asia/Kolkata'
//               )
//               AND COALESCE(submitted_at, created_at) < (
//                 (${date}::date + 1)::timestamp
//                 AT TIME ZONE 'Asia/Kolkata'
//               )
//             )
//           )
//         ORDER BY created_at DESC
//       `;

//       return NextResponse.json(rows.map(mapAudit));
//     }

//     return unauthorized("Authentication required.");
//   } catch (error) {
//     console.error("Read audits error:", error);

//     return NextResponse.json(
//       { error: "Failed to load audits." },
//       { status: 500 },
//     );
//   }
// }

// /**
//  * POST /api/audits
//  *
//  * Creates a draft only if the authenticated employee:
//  * - Is an active auditor.
//  * - Has can_access_audit = true.
//  */
// export async function POST(req: Request) {
//   try {
//     const cookieStore = await cookies();
//     const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

//     if (!employeeToken) {
//       return unauthorized("Authentication required.");
//     }

//     let payload;

//     try {
//       const result = await jwtVerify(
//         employeeToken,
//         getAuthSecret(),
//       );

//       payload = result.payload;
//     } catch {
//       return unauthorized("Invalid or expired employee session.");
//     }

//     if (!payload.id || payload.role !== "auditor") {
//       return forbidden("Only authenticated auditors can create audits.");
//     }

//     const employeeId = String(payload.id);

//     const sql = getDatabase();

//     // Verify current employee status and permission.
//     const employeeRows = await sql`
//       SELECT
//         id,
//         name,
//         role,
//         is_active,
//         can_access_audit
//       FROM employees
//       WHERE id = ${employeeId}
//       LIMIT 1
//     `;

//     const employee = employeeRows[0];

//     if (!employee) {
//       return NextResponse.json(
//         { error: "Employee account not found." },
//         { status: 404 },
//       );
//     }

//     if (
//       employee.is_active !== true ||
//       employee.role !== "auditor"
//     ) {
//       return forbidden(
//         "Your employee account is inactive or unauthorized.",
//       );
//     }

//     if (employee.can_access_audit !== true) {
//       return forbidden(
//         "You do not have permission to create audit reports.",
//       );
//     }

//     const body = await req.json();

//     const templateId =
//       body.templateId || "multiplex-fire-safety";

//     const templateSnapshot = body.templateSnapshot || {
//       id: templateId,
//       type: "AUDIT",
//       title: "Audit Form",
//       sections: [],
//     };

//     const customerId = body.customerId ?? null;
//     const customerName = body.customerName ?? null;
//     const customerAddress = body.customerAddress ?? null;

//     const formData = body.formData || {};
//     const evidence = body.evidence || {};
//     const signatures = body.signatures || {};

//     // Generate AUD-001, AUD-002, ...
//     const idRows = await sql`
//       SELECT
//         COALESCE(
//           MAX(
//             CAST(
//               NULLIF(SUBSTRING(id FROM 5), '') AS INTEGER
//             )
//           ),
//           0
//         ) + 1 AS next_number
//       FROM audits
//       WHERE id ~ '^AUD-[0-9]+$'
//     `;

//     const nextNumber = Number(idRows[0]?.next_number || 1);
//     const auditId = `AUD-${String(nextNumber).padStart(3, "0")}`;

//     const rows = await sql`
//       INSERT INTO audits (
//         id,
//         employee_id,
//         employee_name,
//         template_id,
//         template_snapshot,
//         customer_id,
//         customer_name,
//         customer_address,
//         form_data,
//         evidence,
//         signatures,
//         status,
//         score,
//         created_at,
//         updated_at
//       )
//       VALUES (
//         ${auditId},
//         ${employeeId},
//         ${String(employee.name)},
//         ${templateId},
//         ${JSON.stringify(templateSnapshot)}::jsonb,
//         ${customerId},
//         ${customerName},
//         ${customerAddress},
//         ${JSON.stringify(formData)}::jsonb,
//         ${JSON.stringify(evidence)}::jsonb,
//         ${JSON.stringify(signatures)}::jsonb,
//         'DRAFT',
//         NULL,
//         NOW(),
//         NOW()
//       )
//       RETURNING
//         id,
//         employee_id,
//         employee_name,
//         template_id,
//         template_snapshot,
//         customer_id,
//         customer_name,
//         customer_address,
//         form_data,
//         evidence,
//         signatures,
//         status,
//         score,
//         created_at,
//         updated_at,
//         submitted_at
//     `;

//     return NextResponse.json(mapAudit(rows[0]), { status: 201 });
//   } catch (error) {
//     console.error("Create audit error:", error);

//     return NextResponse.json(
//       { error: "Failed to create audit." },
//       { status: 500 },
//     );
//   }
// }

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

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

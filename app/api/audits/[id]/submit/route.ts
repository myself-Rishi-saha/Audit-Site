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

// export async function POST(
//   _request: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const { id } = await params;
//     const cookieStore = await cookies();

//     const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
//     const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

//     const sql = getDatabase();

//     let role: "admin" | "auditor";
//     let employeeId: string | null = null;

//     // -----------------------------------------
//     // VERIFY ADMIN SESSION
//     // -----------------------------------------
//     if (adminToken) {
//       try {
//         const { payload } = await jwtVerify(
//           adminToken,
//           getAuthSecret(),
//         );

//         if (!payload.id || payload.role !== "admin") {
//           return NextResponse.json(
//             { error: "Unauthorized." },
//             { status: 401 },
//           );
//         }

//         role = "admin";
//       } catch {
//         return NextResponse.json(
//           { error: "Invalid or expired admin session." },
//           { status: 401 },
//         );
//       }
//     } else {
//       // -----------------------------------------
//       // VERIFY EMPLOYEE SESSION
//       // -----------------------------------------
//       if (!employeeToken) {
//         return NextResponse.json(
//           { error: "Authentication required." },
//           { status: 401 },
//         );
//       }

//       let payload;

//       try {
//         const result = await jwtVerify(
//           employeeToken,
//           getAuthSecret(),
//         );

//         payload = result.payload;
//       } catch {
//         return NextResponse.json(
//           { error: "Invalid or expired employee session." },
//           { status: 401 },
//         );
//       }

//       if (!payload.id || payload.role !== "auditor") {
//         return NextResponse.json(
//           { error: "Unauthorized." },
//           { status: 401 },
//         );
//       }

//       employeeId = String(payload.id);

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
//         return NextResponse.json(
//           { error: "Your employee account is inactive or unauthorized." },
//           { status: 403 },
//         );
//       }

//       if (employee.can_access_audit !== true) {
//         return NextResponse.json(
//           { error: "You do not have permission to submit audits." },
//           { status: 403 },
//         );
//       }

//       role = "auditor";
//     }

//     // -----------------------------------------
//     // FIND AUDIT
//     // -----------------------------------------
//     const audits = await sql`
//       SELECT
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
//       FROM audits
//       WHERE id = ${id}
//       LIMIT 1
//     `;

//     const audit = audits[0];

//     if (!audit) {
//       return NextResponse.json(
//         { error: "Audit not found." },
//         { status: 404 },
//       );
//     }

//     // -----------------------------------------
//     // EMPLOYEE OWNERSHIP CHECK
//     // -----------------------------------------
//     if (
//       role === "auditor" &&
//       audit.employee_id !== employeeId
//     ) {
//       return NextResponse.json(
//         { error: "You cannot submit another employee's audit." },
//         { status: 403 },
//       );
//     }

//     // -----------------------------------------
//     // PRESERVE EXISTING SUBMISSION
//     // -----------------------------------------
//     const currentStatus = String(audit.status).toUpperCase();

//     if (currentStatus === "COMPLETED") {
//       return NextResponse.json({
//         id: String(audit.id),
//         employeeId: String(audit.employee_id),
//         employeeName: String(audit.employee_name),
//         customerId: audit.customer_id == null
//           ? null
//           : String(audit.customer_id),
//         customerName: audit.customer_name == null
//           ? null
//           : String(audit.customer_name),
//         customerAddress: audit.customer_address == null
//           ? null
//           : String(audit.customer_address),
//         templateId: String(audit.template_id || ""),
//         templateSnapshot: audit.template_snapshot || {},
//         template: audit.template_snapshot || {},
//         formData: audit.form_data || {},
//         evidence: audit.evidence || {},
//         signatures: audit.signatures || {},
//         status: currentStatus,
//         score: audit.score == null ? null : Number(audit.score),
//         createdAt: audit.created_at?.toISOString?.() || String(audit.created_at),
//         updatedAt: audit.updated_at?.toISOString?.() || String(audit.updated_at),
//         submittedAt: audit.submitted_at == null
//           ? null
//           : audit.submitted_at?.toISOString?.() || String(audit.submitted_at),
//       });
//     }

//     // -----------------------------------------
//     // ONLY DRAFTS CAN BE SUBMITTED
//     // -----------------------------------------
//     if (currentStatus !== "DRAFT") {
//       return NextResponse.json(
//         { error: "Only draft audits can be submitted." },
//         { status: 403 },
//       );
//     }

//     // -----------------------------------------
//     // SUBMIT AUDIT
//     // -----------------------------------------
//     const updatedRows = await sql`
//       UPDATE audits
//       SET
//         status = 'COMPLETED',
//         submitted_at = COALESCE(submitted_at, NOW()),
//         updated_at = NOW()
//       WHERE id = ${id}
//         AND UPPER(status) = 'DRAFT'
//         AND (
//           ${role === "admin"}
//           OR employee_id = ${employeeId}
//         )
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

//     if (updatedRows.length === 0) {
//       return NextResponse.json(
//         {
//           error:
//             "The audit could not be submitted. It may already have been submitted.",
//         },
//         { status: 409 },
//       );
//     }

//     const submitted = updatedRows[0];

//     return NextResponse.json({
//       id: String(submitted.id),
//       employeeId: String(submitted.employee_id),
//       employeeName: String(submitted.employee_name),
//       customerId: submitted.customer_id == null
//         ? null
//         : String(submitted.customer_id),
//       customerName: submitted.customer_name == null
//         ? null
//         : String(submitted.customer_name),
//       customerAddress: submitted.customer_address == null
//         ? null
//         : String(submitted.customer_address),
//       templateId: String(submitted.template_id || ""),
//       templateSnapshot: submitted.template_snapshot || {},
//       template: submitted.template_snapshot || {},
//       formData: submitted.form_data || {},
//       evidence: submitted.evidence || {},
//       signatures: submitted.signatures || {},
//       status: String(submitted.status).toUpperCase(),
//       score: submitted.score == null ? null : Number(submitted.score),
//       createdAt:
//         submitted.created_at?.toISOString?.() ||
//         String(submitted.created_at),
//       updatedAt:
//         submitted.updated_at?.toISOString?.() ||
//         String(submitted.updated_at),
//       submittedAt:
//         submitted.submitted_at?.toISOString?.() ||
//         String(submitted.submitted_at),
//     });
//   } catch (error) {
//     console.error("Submit audit error:", error);

//     return NextResponse.json(
//       { error: "Failed to submit audit." },
//       { status: 500 },
//     );
//   }
// }
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

import { getDatabase } from "@/lib/db";

const EMPLOYEE_COOKIE = "auditdesk_session";
const ADMIN_COOKIE = "auditdesk_admin_session";

type EmployeeRow = RowDataPacket & {
  id: string;
  role: string;
  is_active: number | boolean;
  can_access_audit: number | boolean;
};

type AuditRow = RowDataPacket & {
  id: string;
  employee_id: string;
  employee_name: string;
  template_id: string | null;
  template_snapshot: unknown;
  customer_id: string | null;
  customer_name: string | null;
  customer_address: string | null;
  form_data: unknown;
  evidence: unknown;
  signatures: unknown;
  status: string;
  score: number | string | null;
  created_at: string | Date;
  updated_at: string | Date;
  submitted_at: string | Date | null;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

function isEnabled(value: number | boolean | null | undefined) {
  return value === true || value === 1 || value === "1" as unknown;
}

function parseJson(value: unknown, fallback: unknown = {}) {
  if (value == null) return fallback;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return value;
}

function toIsoString(value: string | Date | null | undefined): string | null {
  if (value == null) return null;

  if (value instanceof Date) {
    return value.toISOString();
  }

  // MariaDB dateStrings may return "YYYY-MM-DD HH:mm:ss".
  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;

  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function mapAudit(audit: AuditRow) {
  const templateSnapshot = parseJson(audit.template_snapshot);
  const formData = parseJson(audit.form_data);
  const evidence = parseJson(audit.evidence);
  const signatures = parseJson(audit.signatures);
  const status = String(audit.status).toUpperCase();

  return {
    id: String(audit.id),
    employeeId: String(audit.employee_id),
    employeeName: String(audit.employee_name),
    customerId: audit.customer_id == null ? null : String(audit.customer_id),
    customerName:
      audit.customer_name == null ? null : String(audit.customer_name),
    customerAddress:
      audit.customer_address == null ? null : String(audit.customer_address),
    templateId: String(audit.template_id || ""),
    templateSnapshot,
    template: templateSnapshot,
    formData,
    evidence,
    signatures,
    status,
    score: audit.score == null ? null : Number(audit.score),
    createdAt: toIsoString(audit.created_at),
    updatedAt: toIsoString(audit.updated_at),
    submittedAt: toIsoString(audit.submitted_at),
  };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();

    const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
    const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

    const db = getDatabase();

    let role: "admin" | "auditor";
    let employeeId: string | null = null;

    // Verify admin session.
    if (adminToken) {
      try {
        const { payload } = await jwtVerify(adminToken, getAuthSecret());

        if (!payload.id || payload.role !== "admin") {
          return NextResponse.json(
            { error: "Unauthorized." },
            { status: 401 },
          );
        }

        role = "admin";
      } catch {
        return NextResponse.json(
          { error: "Invalid or expired admin session." },
          { status: 401 },
        );
      }
    } else {
      // Verify employee session.
      if (!employeeToken) {
        return NextResponse.json(
          { error: "Authentication required." },
          { status: 401 },
        );
      }

      let payload;

      try {
        const result = await jwtVerify(employeeToken, getAuthSecret());
        payload = result.payload;
      } catch {
        return NextResponse.json(
          { error: "Invalid or expired employee session." },
          { status: 401 },
        );
      }

      if (!payload.id || payload.role !== "auditor") {
        return NextResponse.json(
          { error: "Unauthorized." },
          { status: 401 },
        );
      }

      employeeId = String(payload.id);

      // Check the current database permissions, not stale JWT claims.
      const [employees] = await db.execute<EmployeeRow[]>(
        `SELECT id, role, is_active, can_access_audit
         FROM employees
         WHERE id = ?
         LIMIT 1`,
        [employeeId],
      );

      const employee = employees[0];

      if (
        !employee ||
        !isEnabled(employee.is_active) ||
        employee.role !== "auditor"
      ) {
        return NextResponse.json(
          { error: "Your employee account is inactive or unauthorized." },
          { status: 403 },
        );
      }

      if (!isEnabled(employee.can_access_audit)) {
        return NextResponse.json(
          { error: "You do not have permission to submit audits." },
          { status: 403 },
        );
      }

      role = "auditor";
    }

    // Fetch the audit.
    const [audits] = await db.execute<AuditRow[]>(
      `SELECT
         id,
         employee_id,
         employee_name,
         template_id,
         template_snapshot,
         customer_id,
         customer_name,
         customer_address,
         form_data,
         evidence,
         signatures,
         status,
         score,
         created_at,
         updated_at,
         submitted_at
       FROM audits
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    const audit = audits[0];

    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found." },
        { status: 404 },
      );
    }

    // Employees may submit only their own audits.
    if (role === "auditor" && audit.employee_id !== employeeId) {
      return NextResponse.json(
        { error: "You cannot submit another employee's audit." },
        { status: 403 },
      );
    }

    const currentStatus = String(audit.status).toUpperCase();

    // Keep repeat submissions idempotent.
    if (currentStatus === "COMPLETED") {
      return NextResponse.json(mapAudit(audit));
    }

    if (currentStatus !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft audits can be submitted." },
        { status: 403 },
      );
    }

    // Conditional update prevents two requests from submitting the same draft.
    const ownershipCondition =
      role === "admin" ? "" : " AND employee_id = ?";

    const updateParams: (string | null)[] =
      role === "admin" ? [id] : [id, employeeId];

    const [updateResult] = await db.execute<ResultSetHeader>(
      `UPDATE audits
       SET
         status = 'COMPLETED',
         submitted_at = COALESCE(submitted_at, UTC_TIMESTAMP()),
         updated_at = UTC_TIMESTAMP()
       WHERE id = ?
         AND UPPER(status) = 'DRAFT'
         ${ownershipCondition}`,
      updateParams,
    );

    if (updateResult.affectedRows === 0) {
      // Another request may have submitted it first. Re-read to confirm.
      const [latestRows] = await db.execute<AuditRow[]>(
        `SELECT
           id,
           employee_id,
           employee_name,
           template_id,
           template_snapshot,
           customer_id,
           customer_name,
           customer_address,
           form_data,
           evidence,
           signatures,
           status,
           score,
           created_at,
           updated_at,
           submitted_at
         FROM audits
         WHERE id = ?
         LIMIT 1`,
        [id],
      );

      const latest = latestRows[0];

      if (latest && String(latest.status).toUpperCase() === "COMPLETED") {
        return NextResponse.json(mapAudit(latest));
      }

      return NextResponse.json(
        {
          error:
            "The audit could not be submitted. It may already have been submitted.",
        },
        { status: 409 },
      );
    }

    // MariaDB does not support PostgreSQL's UPDATE ... RETURNING syntax.
    const [submittedRows] = await db.execute<AuditRow[]>(
      `SELECT
         id,
         employee_id,
         employee_name,
         template_id,
         template_snapshot,
         customer_id,
         customer_name,
         customer_address,
         form_data,
         evidence,
         signatures,
         status,
         score,
         created_at,
         updated_at,
         submitted_at
       FROM audits
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    const submitted = submittedRows[0];

    if (!submitted) {
      return NextResponse.json(
        { error: "Audit was submitted, but could not be reloaded." },
        { status: 500 },
      );
    }

    return NextResponse.json(mapAudit(submitted));
  } catch (error) {
    console.error("Submit audit error:", error);

    return NextResponse.json(
      { error: "Failed to submit audit." },
      { status: 500 },
    );
  }
}
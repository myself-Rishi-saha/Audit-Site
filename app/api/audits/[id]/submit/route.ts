
// import { NextResponse } from "next/server";
// import {
//   readAudits,
//   submitAuditInDatabase,
// } from "@/lib/audit";

// export async function POST(
//   request: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const { id } = await params;
//     const audits = await readAudits();

//     const existingAudit = audits.find(
//       (audit) => audit.id === id,
//     );

//     if (!existingAudit) {
//       return NextResponse.json(
//         { error: "Audit not found" },
//         { status: 404 },
//       );
//     }

//     // Do not overwrite the original submission timestamp.
//     if (existingAudit.status === "COMPLETED") {
//       return NextResponse.json(existingAudit);
//     }

//     const timestamps = await submitAuditInDatabase(id);

//     if (!timestamps) {
//       return NextResponse.json(
//         { error: "Audit not found" },
//         { status: 404 },
//       );
//     }

//     return NextResponse.json({
//       ...existingAudit,
//       status: "COMPLETED",
//       submittedAt: timestamps.submittedAt,
//       updatedAt: timestamps.updatedAt,
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
import { neon } from "@neondatabase/serverless";

const EMPLOYEE_COOKIE = "auditdesk_session";
const ADMIN_COOKIE = "auditdesk_admin_session";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

function getDatabase() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }

  return neon(url);
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

    const sql = getDatabase();

    let role: "admin" | "auditor";
    let employeeId: string | null = null;

    // -----------------------------------------
    // VERIFY ADMIN SESSION
    // -----------------------------------------
    if (adminToken) {
      try {
        const { payload } = await jwtVerify(
          adminToken,
          getAuthSecret(),
        );

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
      // -----------------------------------------
      // VERIFY EMPLOYEE SESSION
      // -----------------------------------------
      if (!employeeToken) {
        return NextResponse.json(
          { error: "Authentication required." },
          { status: 401 },
        );
      }

      let payload;

      try {
        const result = await jwtVerify(
          employeeToken,
          getAuthSecret(),
        );

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

      // Always check current permissions in the database.
      const employees = await sql`
        SELECT
          id,
          role,
          is_active,
          can_access_audit
        FROM employees
        WHERE id = ${employeeId}
        LIMIT 1
      `;

      const employee = employees[0];

      if (
        !employee ||
        employee.is_active !== true ||
        employee.role !== "auditor"
      ) {
        return NextResponse.json(
          { error: "Your employee account is inactive or unauthorized." },
          { status: 403 },
        );
      }

      if (employee.can_access_audit !== true) {
        return NextResponse.json(
          { error: "You do not have permission to submit audits." },
          { status: 403 },
        );
      }

      role = "auditor";
    }

    // -----------------------------------------
    // FIND AUDIT
    // -----------------------------------------
    const audits = await sql`
      SELECT
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
      WHERE id = ${id}
      LIMIT 1
    `;

    const audit = audits[0];

    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found." },
        { status: 404 },
      );
    }

    // -----------------------------------------
    // EMPLOYEE OWNERSHIP CHECK
    // -----------------------------------------
    if (
      role === "auditor" &&
      audit.employee_id !== employeeId
    ) {
      return NextResponse.json(
        { error: "You cannot submit another employee's audit." },
        { status: 403 },
      );
    }

    // -----------------------------------------
    // PRESERVE EXISTING SUBMISSION
    // -----------------------------------------
    const currentStatus = String(audit.status).toUpperCase();

    if (currentStatus === "COMPLETED") {
      return NextResponse.json({
        id: String(audit.id),
        employeeId: String(audit.employee_id),
        employeeName: String(audit.employee_name),
        customerId: audit.customer_id == null
          ? null
          : String(audit.customer_id),
        customerName: audit.customer_name == null
          ? null
          : String(audit.customer_name),
        customerAddress: audit.customer_address == null
          ? null
          : String(audit.customer_address),
        templateId: String(audit.template_id || ""),
        templateSnapshot: audit.template_snapshot || {},
        template: audit.template_snapshot || {},
        formData: audit.form_data || {},
        evidence: audit.evidence || {},
        signatures: audit.signatures || {},
        status: currentStatus,
        score: audit.score == null ? null : Number(audit.score),
        createdAt: audit.created_at?.toISOString?.() || String(audit.created_at),
        updatedAt: audit.updated_at?.toISOString?.() || String(audit.updated_at),
        submittedAt: audit.submitted_at == null
          ? null
          : audit.submitted_at?.toISOString?.() || String(audit.submitted_at),
      });
    }

    // -----------------------------------------
    // ONLY DRAFTS CAN BE SUBMITTED
    // -----------------------------------------
    if (currentStatus !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft audits can be submitted." },
        { status: 403 },
      );
    }

    // -----------------------------------------
    // SUBMIT AUDIT
    // -----------------------------------------
    const updatedRows = await sql`
      UPDATE audits
      SET
        status = 'COMPLETED',
        submitted_at = COALESCE(submitted_at, NOW()),
        updated_at = NOW()
      WHERE id = ${id}
        AND UPPER(status) = 'DRAFT'
        AND (
          ${role === "admin"}
          OR employee_id = ${employeeId}
        )
      RETURNING
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
    `;

    if (updatedRows.length === 0) {
      return NextResponse.json(
        {
          error:
            "The audit could not be submitted. It may already have been submitted.",
        },
        { status: 409 },
      );
    }

    const submitted = updatedRows[0];

    return NextResponse.json({
      id: String(submitted.id),
      employeeId: String(submitted.employee_id),
      employeeName: String(submitted.employee_name),
      customerId: submitted.customer_id == null
        ? null
        : String(submitted.customer_id),
      customerName: submitted.customer_name == null
        ? null
        : String(submitted.customer_name),
      customerAddress: submitted.customer_address == null
        ? null
        : String(submitted.customer_address),
      templateId: String(submitted.template_id || ""),
      templateSnapshot: submitted.template_snapshot || {},
      template: submitted.template_snapshot || {},
      formData: submitted.form_data || {},
      evidence: submitted.evidence || {},
      signatures: submitted.signatures || {},
      status: String(submitted.status).toUpperCase(),
      score: submitted.score == null ? null : Number(submitted.score),
      createdAt:
        submitted.created_at?.toISOString?.() ||
        String(submitted.created_at),
      updatedAt:
        submitted.updated_at?.toISOString?.() ||
        String(submitted.updated_at),
      submittedAt:
        submitted.submitted_at?.toISOString?.() ||
        String(submitted.submitted_at),
    });
  } catch (error) {
    console.error("Submit audit error:", error);

    return NextResponse.json(
      { error: "Failed to submit audit." },
      { status: 500 },
    );
  }
}
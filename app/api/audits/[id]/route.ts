
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

import { getDatabase } from "@/lib/db";

const EMPLOYEE_COOKIE = "auditdesk_session";
const ADMIN_COOKIE = "auditdesk_admin_session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
  customer_gst_no: string | null;
customer_contact_number: string | null;
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
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

function isEnabled(value: number | boolean | null | undefined) {
  return value === true || value === 1;
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
  if (value instanceof Date) return value.toISOString();

  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function mapAudit(row: AuditRow) {
  const snapshot = parseJson(row.template_snapshot, null);
  const templateSnapshot =
    snapshot &&
    typeof snapshot === "object" &&
    !Array.isArray(snapshot)
      ? snapshot
      : {
          id: row.template_id || "audit",
          type: "AUDIT",
          title: "Audit",
          sections: [],
        };

  const objectOrEmpty = (value: unknown) => {
    const parsed = parseJson(value);
    return parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
      ? parsed
      : {};
  };

  return {
    id: String(row.id),
    employeeId: String(row.employee_id),
    employeeName: String(row.employee_name),
    customerId: row.customer_id == null ? null : String(row.customer_id),
    customerName: row.customer_name == null ? null : String(row.customer_name),
    customerAddress:
      row.customer_address == null ? null : String(row.customer_address),
      customerGstNo:
  row.customer_gst_no == null ? null : String(row.customer_gst_no),

customerContactNumber:
  row.customer_contact_number == null
    ? null
    : String(row.customer_contact_number),
    templateId: String(row.template_id || ""),
    templateSnapshot,
    template: templateSnapshot,
    formData: objectOrEmpty(row.form_data),
    evidence: objectOrEmpty(row.evidence),
    signatures: objectOrEmpty(row.signatures),
    status: String(row.status || "").toUpperCase(),
    score: row.score == null ? null : Number(row.score),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    submittedAt: toIsoString(row.submitted_at),
  };
}

async function getAccessContext() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
  const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

  if (adminToken) {
    try {
      const { payload } = await jwtVerify(adminToken, getAuthSecret());

      if (!payload.id || payload.role !== "admin") {
        return {
          error: NextResponse.json(
            { error: "Unauthorized." },
            { status: 401 },
          ),
        };
      }

      return { role: "admin" as const };
    } catch {
      return {
        error: NextResponse.json(
          { error: "Invalid or expired admin session." },
          { status: 401 },
        ),
      };
    }
  }

  if (!employeeToken) {
    return {
      error: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  let payload;

  try {
    const result = await jwtVerify(employeeToken, getAuthSecret());
    payload = result.payload;
  } catch {
    return {
      error: NextResponse.json(
        { error: "Invalid or expired employee session." },
        { status: 401 },
      ),
    };
  }

  if (!payload.id || payload.role !== "auditor") {
    return {
      error: NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      ),
    };
  }

  const db = getDatabase();
  const [employees] = await db.execute<EmployeeRow[]>(
    `SELECT id, role, is_active, can_access_audit
     FROM employees
     WHERE id = ?
     LIMIT 1`,
    [String(payload.id)],
  );

  const employee = employees[0];

  if (
    !employee ||
    !isEnabled(employee.is_active) ||
    employee.role !== "auditor"
  ) {
    return {
      error: NextResponse.json(
        { error: "Your employee account is inactive or unauthorized." },
        { status: 403 },
      ),
    };
  }

  if (!isEnabled(employee.can_access_audit)) {
    return {
      error: NextResponse.json(
        { error: "You do not have permission to access audit reports." },
        { status: 403 },
      ),
    };
  }

  return {
    role: "auditor" as const,
    employeeId: String(employee.id),
  };
}

async function findAudit(id: string) {
  const db = getDatabase();

  // const [rows] = await db.execute<AuditRow[]>(
  //   `SELECT
  //      id, employee_id, employee_name, template_id, template_snapshot,
  //      customer_id, customer_name, customer_address, form_data, evidence,
  //      signatures, status, score, created_at, updated_at, submitted_at
  //    FROM audits
  //    WHERE id = ?
  //    LIMIT 1`,
  //   [id],
  // );
const [rows] = await db.execute<AuditRow[]>(
  `SELECT
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
     updated_at,
     submitted_at
   FROM audits
   WHERE id = ?
   LIMIT 1`,
  [id],
);
  return rows[0] ?? null;
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const access = await getAccessContext();

    if (access.error) return access.error;

    const audit = await findAudit(id);

    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found." },
        { status: 404 },
      );
    }

    if (
      access.role === "auditor" &&
      audit.employee_id !== access.employeeId
    ) {
      return NextResponse.json(
        { error: "You cannot access another employee's audit." },
        { status: 403 },
      );
    }

    return NextResponse.json(mapAudit(audit));
  } catch (error) {
    console.error("Get audit error:", error);

    return NextResponse.json(
      { error: "Failed to get audit." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const access = await getAccessContext();

    if (access.error) return access.error;

    const existing = await findAudit(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Audit not found." },
        { status: 404 },
      );
    }

    if (
      access.role === "auditor" &&
      existing.employee_id !== access.employeeId
    ) {
      return NextResponse.json(
        { error: "You cannot edit another employee's audit." },
        { status: 403 },
      );
    }

    if (
      access.role === "auditor" &&
      String(existing.status).toUpperCase() !== "DRAFT"
    ) {
      return NextResponse.json(
        { error: "Only draft audits can be edited by employees." },
        { status: 403 },
      );
    }

    const body = await request.json();

    const formData = body.formData ?? parseJson(existing.form_data);
    const evidence = body.evidence ?? parseJson(existing.evidence);
    const signatures = body.signatures ?? parseJson(existing.signatures);

    const db = getDatabase();

    // Only update editable content. Preserve employee, customer,
    // template, score, and status.
    const ownershipCondition =
      access.role === "auditor"
        ? " AND employee_id = ? AND UPPER(status) = 'DRAFT'"
        : "";

    const updateParams: (string | number)[] =
      access.role === "auditor"
        ? [
            JSON.stringify(formData),
            JSON.stringify(evidence),
            JSON.stringify(signatures),
            id,
            access.employeeId,
          ]
        : [
            JSON.stringify(formData),
            JSON.stringify(evidence),
            JSON.stringify(signatures),
            id,
          ];

    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE audits
       SET form_data = ?,
           evidence = ?,
           signatures = ?,
           updated_at = UTC_TIMESTAMP()
       WHERE id = ?
       ${ownershipCondition}`,
      updateParams,
    );

    if (result.affectedRows === 0) {
      // A matching draft can report zero affected rows if values did
      // not change. Re-read and verify authorization/status.
      const latest = await findAudit(id);

      if (!latest) {
        return NextResponse.json(
          { error: "Audit not found." },
          { status: 404 },
        );
      }

      if (
        access.role === "auditor" &&
        (latest.employee_id !== access.employeeId ||
          String(latest.status).toUpperCase() !== "DRAFT")
      ) {
        return NextResponse.json(
          { error: "Audit could not be updated." },
          { status: 403 },
        );
      }
    }

    const updated = await findAudit(id);

    if (!updated) {
      return NextResponse.json(
        { error: "Audit could not be reloaded after updating." },
        { status: 500 },
      );
    }

    return NextResponse.json(mapAudit(updated));
  } catch (error) {
    console.error("Update audit error:", error);

    return NextResponse.json(
      { error: "Failed to update audit." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const access = await getAccessContext();

    if (access.error) return access.error;

    const audit = await findAudit(id);

    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found." },
        { status: 404 },
      );
    }

    if (
      access.role === "auditor" &&
      audit.employee_id !== access.employeeId
    ) {
      return NextResponse.json(
        { error: "You cannot delete another employee's audit." },
        { status: 403 },
      );
    }

    if (String(audit.status).toUpperCase() !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft audits can be deleted." },
        { status: 403 },
      );
    }

    const db = getDatabase();

    const ownershipCondition =
      access.role === "auditor"
        ? " AND employee_id = ?"
        : "";

    const deleteParams: string[] =
      access.role === "auditor"
        ? [id, access.employeeId]
        : [id];

    const [result] = await db.execute<ResultSetHeader>(
      `DELETE FROM audits
       WHERE id = ?
         AND UPPER(status) = 'DRAFT'
         ${ownershipCondition}`,
      deleteParams,
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Draft could not be deleted." },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Draft deleted successfully.",
    });
  } catch (error) {
    console.error("Delete audit error:", error);

    return NextResponse.json(
      { error: "Failed to delete draft." },
      { status: 500 },
    );
  }
}

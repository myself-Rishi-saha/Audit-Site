
// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { jwtVerify } from "jose";
// import { neon } from "@neondatabase/serverless";

// const EMPLOYEE_COOKIE = "auditdesk_session";
// const ADMIN_COOKIE = "auditdesk_admin_session";

// type RouteContext = {
//   params: Promise<{ id: string }>;
// };

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

//     template:
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

//     status: String(row.status || "").toUpperCase(),

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

// /**
//  * Verifies the current session and, for employees,
//  * checks current account status and audit permission.
//  */
// async function getAccessContext() {
//   const cookieStore = await cookies();

//   const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
//   const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

//   if (adminToken) {
//     try {
//       const { payload } = await jwtVerify(
//         adminToken,
//         getAuthSecret(),
//       );

//       if (!payload.id || payload.role !== "admin") {
//         return {
//           error: NextResponse.json(
//             { error: "Unauthorized." },
//             { status: 401 },
//           ),
//         };
//       }

//       return { role: "admin" as const };
//     } catch {
//       return {
//         error: NextResponse.json(
//           { error: "Invalid or expired admin session." },
//           { status: 401 },
//         ),
//       };
//     }
//   }

//   if (!employeeToken) {
//     return {
//       error: NextResponse.json(
//         { error: "Authentication required." },
//         { status: 401 },
//       ),
//     };
//   }

//   let payload;

//   try {
//     const result = await jwtVerify(
//       employeeToken,
//       getAuthSecret(),
//     );

//     payload = result.payload;
//   } catch {
//     return {
//       error: NextResponse.json(
//         { error: "Invalid or expired employee session." },
//         { status: 401 },
//       ),
//     };
//   }

//   if (!payload.id || payload.role !== "auditor") {
//     return {
//       error: NextResponse.json(
//         { error: "Unauthorized." },
//         { status: 401 },
//       ),
//     };
//   }

//   const sql = getDatabase();

//   const employees = await sql`
//     SELECT
//       id,
//       role,
//       is_active,
//       can_access_audit
//     FROM employees
//     WHERE id = ${String(payload.id)}
//     LIMIT 1
//   `;

//   const employee = employees[0];

//   if (
//     !employee ||
//     employee.is_active !== true ||
//     employee.role !== "auditor"
//   ) {
//     return {
//       error: NextResponse.json(
//         { error: "Your employee account is inactive or unauthorized." },
//         { status: 403 },
//       ),
//     };
//   }

//   if (employee.can_access_audit !== true) {
//     return {
//       error: NextResponse.json(
//         { error: "You do not have permission to access audit reports." },
//         { status: 403 },
//       ),
//     };
//   }

//   return {
//     role: "auditor" as const,
//     employeeId: String(employee.id),
//   };
// }

// /**
//  * GET /api/audits/[id]
//  *
//  * Admin: can view an audit by ID.
//  * Employee: can view only their own audits and must have audit access.
//  */
// export async function GET(
//   _request: Request,
//   { params }: RouteContext,
// ) {
//   try {
//     const { id } = await params;
//     const access = await getAccessContext();

//     if (access.error) {
//       return access.error;
//     }

//     const sql = getDatabase();

//     const rows = await sql`
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

//     const audit = rows[0];

//     if (!audit) {
//       return NextResponse.json(
//         { error: "Audit not found." },
//         { status: 404 },
//       );
//     }

//     if (
//       access.role === "auditor" &&
//       audit.employee_id !== access.employeeId
//     ) {
//       return NextResponse.json(
//         { error: "You cannot access another employee's audit." },
//         { status: 403 },
//       );
//     }

//     return NextResponse.json(mapAudit(audit));
//   } catch (error) {
//     console.error("Get audit error:", error);

//     return NextResponse.json(
//       { error: "Failed to get audit." },
//       { status: 500 },
//     );
//   }
// }

// /**
//  * PUT /api/audits/[id]
//  *
//  * Admin: can edit audit data while preserving the existing status
//  * and original template information.
//  *
//  * Employee: can edit their own DRAFT audits only.
//  */
// export async function PUT(
//   request: Request,
//   { params }: RouteContext,
// ) {
//   try {
//     const { id } = await params;
//     const access = await getAccessContext();

//     if (access.error) {
//       return access.error;
//     }

//     const sql = getDatabase();

//     const rows = await sql`
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

//     const existing = rows[0];

//     if (!existing) {
//       return NextResponse.json(
//         { error: "Audit not found." },
//         { status: 404 },
//       );
//     }

//     if (
//       access.role === "auditor" &&
//       existing.employee_id !== access.employeeId
//     ) {
//       return NextResponse.json(
//         { error: "You cannot edit another employee's audit." },
//         { status: 403 },
//       );
//     }

//     if (
//       access.role === "auditor" &&
//       String(existing.status).toUpperCase() !== "DRAFT"
//     ) {
//       return NextResponse.json(
//         { error: "Only draft audits can be edited by employees." },
//         { status: 403 },
//       );
//     }

//     const body = await request.json();

//     // Only these fields are editable through this endpoint.
//     // ID, employee, customer, template, and status are preserved.
//     const formData = body.formData ?? existing.form_data ?? {};
//     const evidence = body.evidence ?? existing.evidence ?? {};
//     const signatures = body.signatures ?? existing.signatures ?? {};

//     const updatedRows = await sql`
//       UPDATE audits
//       SET
//         form_data = ${JSON.stringify(formData)}::jsonb,
//         evidence = ${JSON.stringify(evidence)}::jsonb,
//         signatures = ${JSON.stringify(signatures)}::jsonb,
//         updated_at = NOW()
//       WHERE id = ${id}
//         AND (
//           ${access.role === "admin"}
//           OR (
//             employee_id = ${access.role === "auditor" ? access.employeeId : ""}
//             AND UPPER(status) = 'DRAFT'
//           )
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
//         { error: "Audit could not be updated." },
//         { status: 403 },
//       );
//     }

//     return NextResponse.json(mapAudit(updatedRows[0]));
//   } catch (error) {
//     console.error("Update audit error:", error);

//     return NextResponse.json(
//       { error: "Failed to update audit." },
//       { status: 500 },
//     );
//   }
// }

// /**
//  * DELETE /api/audits/[id]
//  *
//  * Only DRAFT audits can be deleted.
//  * Employees can delete only their own drafts.
//  * Admins can delete drafts.
//  */
// export async function DELETE(
//   _request: Request,
//   { params }: RouteContext,
// ) {
//   try {
//     const { id } = await params;
//     const access = await getAccessContext();

//     if (access.error) {
//       return access.error;
//     }

//     const sql = getDatabase();

//     const rows = await sql`
//       SELECT id, employee_id, status
//       FROM audits
//       WHERE id = ${id}
//       LIMIT 1
//     `;

//     const audit = rows[0];

//     if (!audit) {
//       return NextResponse.json(
//         { error: "Audit not found." },
//         { status: 404 },
//       );
//     }

//     if (
//       access.role === "auditor" &&
//       audit.employee_id !== access.employeeId
//     ) {
//       return NextResponse.json(
//         { error: "You cannot delete another employee's audit." },
//         { status: 403 },
//       );
//     }

//     if (String(audit.status).toUpperCase() !== "DRAFT") {
//       return NextResponse.json(
//         { error: "Only draft audits can be deleted." },
//         { status: 403 },
//       );
//     }

//     const deletedRows = await sql`
//       DELETE FROM audits
//       WHERE id = ${id}
//         AND UPPER(status) = 'DRAFT'
//         AND (
//           ${access.role === "admin"}
//           OR employee_id = ${access.role === "auditor" ? access.employeeId : ""}
//         )
//       RETURNING id
//     `;

//     if (deletedRows.length === 0) {
//       return NextResponse.json(
//         { error: "Draft could not be deleted." },
//         { status: 403 },
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       message: "Draft deleted successfully.",
//     });
//   } catch (error) {
//     console.error("Delete audit error:", error);

//     return NextResponse.json(
//       { error: "Failed to delete draft." },
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

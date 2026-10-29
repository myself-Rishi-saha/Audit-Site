

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

// function mapServiceReport(row: any) {
//   const template =
//     row.template_snapshot &&
//     typeof row.template_snapshot === "object" &&
//     !Array.isArray(row.template_snapshot)
//       ? row.template_snapshot
//       : {
//           id: row.template_id || "service-report",
//           type: "SERVICE_REPORT",
//           title: "Equipment Service & Maintenance Report",
//           sections: [],
//         };

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

//     templateId: String(row.template_id || "service-report"),
//     templateSnapshot: template,
//     template,

//     formData:
//       row.form_data &&
//       typeof row.form_data === "object" &&
//       !Array.isArray(row.form_data)
//         ? row.form_data
//         : {},

//     evidence:
//       row.evidence &&
//       typeof row.evidence === "object"
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
//  * Verifies the session and checks current employee status
//  * and service-report permission.
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
//       can_access_service_report
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
//         {
//           error:
//             "Your employee account is inactive or unauthorized.",
//         },
//         { status: 403 },
//       ),
//     };
//   }

//   if (employee.can_access_service_report !== true) {
//     return {
//       error: NextResponse.json(
//         {
//           error:
//             "You do not have permission to access service reports.",
//         },
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
//  * GET /api/service-reports/[id]
//  *
//  * Admin: can view any service report.
//  * Employee: can view only their own reports with permission enabled.
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
//         created_at,
//         updated_at,
//         submitted_at
//       FROM service_reports
//       WHERE id = ${id}
//       LIMIT 1
//     `;

//     const report = rows[0];

//     if (!report) {
//       return NextResponse.json(
//         { error: "Service report not found." },
//         { status: 404 },
//       );
//     }

//     if (
//       access.role === "auditor" &&
//       report.employee_id !== access.employeeId
//     ) {
//       return NextResponse.json(
//         {
//           error:
//             "You cannot access another employee's service report.",
//         },
//         { status: 403 },
//       );
//     }

//     return NextResponse.json(mapServiceReport(report));
//   } catch (error) {
//     console.error("Get service report error:", error);

//     return NextResponse.json(
//       { error: "Failed to get service report." },
//       { status: 500 },
//     );
//   }
// }

// /**
//  * PUT /api/service-reports/[id]
//  *
//  * Admin: can edit service-report data while preserving its status
//  * and original template information.
//  *
//  * Employee: can edit only their own DRAFT reports.
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
//         created_at,
//         updated_at,
//         submitted_at
//       FROM service_reports
//       WHERE id = ${id}
//       LIMIT 1
//     `;

//     const existing = rows[0];

//     if (!existing) {
//       return NextResponse.json(
//         { error: "Service report not found." },
//         { status: 404 },
//       );
//     }

//     if (
//       access.role === "auditor" &&
//       existing.employee_id !== access.employeeId
//     ) {
//       return NextResponse.json(
//         {
//           error:
//             "You cannot edit another employee's service report.",
//         },
//         { status: 403 },
//       );
//     }

//     if (
//       access.role === "auditor" &&
//       String(existing.status).toUpperCase() !== "DRAFT"
//     ) {
//       return NextResponse.json(
//         {
//           error:
//             "Only draft service reports can be edited by employees.",
//         },
//         { status: 403 },
//       );
//     }

//     const body = await request.json();

//     // Preserve ownership, customer, template, and report status.
//     const formData = body.formData ?? existing.form_data ?? {};
//     const evidence = body.evidence ?? existing.evidence ?? {};
//     const signatures = body.signatures ?? existing.signatures ?? {};

//     const updatedRows = await sql`
//       UPDATE service_reports
//       SET
//         form_data = ${JSON.stringify(formData)}::jsonb,
//         evidence = ${JSON.stringify(evidence)}::jsonb,
//         signatures = ${JSON.stringify(signatures)}::jsonb,
//         updated_at = NOW()
//       WHERE id = ${id}
//         AND (
//           ${access.role === "admin"}
//           OR (
//             employee_id = ${
//               access.role === "auditor" ? access.employeeId : ""
//             }
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
//         created_at,
//         updated_at,
//         submitted_at
//     `;

//     if (updatedRows.length === 0) {
//       return NextResponse.json(
//         { error: "Service report could not be updated." },
//         { status: 403 },
//       );
//     }

//     return NextResponse.json(
//       mapServiceReport(updatedRows[0]),
//     );
//   } catch (error) {
//     console.error("Update service report error:", error);

//     return NextResponse.json(
//       { error: "Failed to update service report." },
//       { status: 500 },
//     );
//   }
// }

// /**
//  * DELETE /api/service-reports/[id]
//  *
//  * Only DRAFT service reports can be deleted.
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
//       FROM service_reports
//       WHERE id = ${id}
//       LIMIT 1
//     `;

//     const report = rows[0];

//     if (!report) {
//       return NextResponse.json(
//         { error: "Service report not found." },
//         { status: 404 },
//       );
//     }

//     if (
//       access.role === "auditor" &&
//       report.employee_id !== access.employeeId
//     ) {
//       return NextResponse.json(
//         {
//           error:
//             "You cannot delete another employee's service report.",
//         },
//         { status: 403 },
//       );
//     }

//     if (String(report.status).toUpperCase() !== "DRAFT") {
//       return NextResponse.json(
//         { error: "Only draft service reports can be deleted." },
//         { status: 403 },
//       );
//     }

//     const deletedRows = await sql`
//       DELETE FROM service_reports
//       WHERE id = ${id}
//         AND UPPER(status) = 'DRAFT'
//         AND (
//           ${access.role === "admin"}
//           OR employee_id = ${
//             access.role === "auditor" ? access.employeeId : ""
//           }
//         )
//       RETURNING id
//     `;

//     if (deletedRows.length === 0) {
//       return NextResponse.json(
//         { error: "Draft service report could not be deleted." },
//         { status: 403 },
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       message: "Draft service report deleted successfully.",
//     });
//   } catch (error) {
//     console.error("Delete service report error:", error);

//     return NextResponse.json(
//       { error: "Failed to delete service report." },
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

type ReportRow = RowDataPacket & {
  id: string;
  employee_id: string;
  employee_name: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_address: string | null;
  customer_gst_no: string | null;
customer_contact_number: string | null;
  template_id: string | null;
  template_snapshot: unknown;
  form_data: unknown;
  evidence: unknown;
  signatures: unknown;
  status: string;
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

function parseJson(value: unknown, fallback: unknown = {}) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return value ?? fallback;
}

function parseObject(value: unknown): Record<string, unknown> {
  const parsed = parseJson(value, {});

  return parsed !== null &&
    typeof parsed === "object" &&
    !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

function isEnabled(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function toIsoString(value: string | Date | null | undefined) {
  if (value == null) return null;

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function mapServiceReport(row: ReportRow) {
  const snapshot = parseObject(row.template_snapshot);

  const template =
    Object.keys(snapshot).length > 0
      ? snapshot
      : {
          id: row.template_id || "service-report",
          type: "SERVICE_REPORT",
          title: "Equipment Service & Maintenance Report",
          sections: [],
        };

  return {
    id: String(row.id),
    employeeId: String(row.employee_id),
    employeeName: String(row.employee_name),
    customerId:
      row.customer_id == null ? null : String(row.customer_id),
    customerName: row.customer_name,
    customerAddress: row.customer_address,
    customerGstNo:
  row.customer_gst_no == null
    ? null
    : String(row.customer_gst_no),

customerContactNumber:
  row.customer_contact_number == null
    ? null
    : String(row.customer_contact_number),
    templateId: String(row.template_id || "service-report"),
    templateSnapshot: template,
    template,
    formData: parseObject(row.form_data),
    evidence: parseObject(row.evidence),
    signatures: parseObject(row.signatures),
    status: String(row.status || "").toUpperCase(),
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
      const { payload } = await jwtVerify(
        adminToken,
        getAuthSecret(),
      );

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
    const result = await jwtVerify(
      employeeToken,
      getAuthSecret(),
    );

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

  const [employees] = await db.execute<RowDataPacket[]>(
    `SELECT id, role, is_active, can_access_service_report
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
        {
          error:
            "Your employee account is inactive or unauthorized.",
        },
        { status: 403 },
      ),
    };
  }

  if (!isEnabled(employee.can_access_service_report)) {
    return {
      error: NextResponse.json(
        {
          error:
            "You do not have permission to access service reports.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    role: "auditor" as const,
    employeeId: String(employee.id),
  };
}

// const REPORT_SELECT = `
//   SELECT
//     id,
//     employee_id,
//     employee_name,
//     customer_id,
//     customer_name,
//     customer_address,
//     template_id,
//     template_snapshot,
//     form_data,
//     evidence,
//     signatures,
//     status,
//     created_at,
//     updated_at,
//     submitted_at
//   FROM service_reports
// `;
const REPORT_SELECT = `
  SELECT
    id,
    employee_id,
    employee_name,
    customer_id,
    customer_name,
    customer_address,
    customer_gst_no,
    customer_contact_number,
    template_id,
    template_snapshot,
    form_data,
    evidence,
    signatures,
    status,
    created_at,
    updated_at,
    submitted_at
  FROM service_reports
`;
/**
 * GET /api/service-reports/[id]
 */
export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const access = await getAccessContext();

    if (access.error) return access.error;

    const db = getDatabase();

    const [rows] = await db.execute<ReportRow[]>(
      `${REPORT_SELECT} WHERE id = ? LIMIT 1`,
      [id],
    );

    const report = rows[0];

    if (!report) {
      return NextResponse.json(
        { error: "Service report not found." },
        { status: 404 },
      );
    }

    if (
      access.role === "auditor" &&
      report.employee_id !== access.employeeId
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot access another employee's service report.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(mapServiceReport(report));
  } catch (error) {
    console.error("Get service report error:", error);

    return NextResponse.json(
      { error: "Failed to get service report." },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/service-reports/[id]
 *
 * Admin: may edit report data while preserving ownership,
 * customer details, template, signatures when omitted, and status.
 *
 * Employee: may edit only their own DRAFT reports.
 */
export async function PUT(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const access = await getAccessContext();

    if (access.error) return access.error;

    const db = getDatabase();

    const [rows] = await db.execute<ReportRow[]>(
      `${REPORT_SELECT} WHERE id = ? LIMIT 1`,
      [id],
    );

    const existing = rows[0];

    if (!existing) {
      return NextResponse.json(
        { error: "Service report not found." },
        { status: 404 },
      );
    }

    if (
      access.role === "auditor" &&
      existing.employee_id !== access.employeeId
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot edit another employee's service report.",
        },
        { status: 403 },
      );
    }

    if (
      access.role === "auditor" &&
      String(existing.status).toUpperCase() !== "DRAFT"
    ) {
      return NextResponse.json(
        {
          error:
            "Only draft service reports can be edited by employees.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Preserve stored data if a property is omitted from the request.
    const formData =
      body.formData === undefined
        ? parseObject(existing.form_data)
        : parseObject(body.formData);

    const evidence =
      body.evidence === undefined
        ? parseObject(existing.evidence)
        : parseObject(body.evidence);

    const signatures =
      body.signatures === undefined
        ? parseObject(existing.signatures)
        : parseObject(body.signatures);

    const isAdmin = access.role === "admin";

    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE service_reports
       SET
         form_data = ?,
         evidence = ?,
         signatures = ?,
         updated_at = UTC_TIMESTAMP(3)
       WHERE id = ?
         AND (
           ? = 1
           OR (
             employee_id = ?
             AND UPPER(status) = 'DRAFT'
           )
         )`,
      [
        JSON.stringify(formData),
        JSON.stringify(evidence),
        JSON.stringify(signatures),
        id,
        isAdmin ? 1 : 0,
        access.role === "auditor" ? access.employeeId : "",
      ],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        {
          error:
            "Service report could not be updated. It may have changed or is no longer editable.",
        },
        { status: 409 },
      );
    }

    const [updatedRows] = await db.execute<ReportRow[]>(
      `${REPORT_SELECT} WHERE id = ? LIMIT 1`,
      [id],
    );

    if (!updatedRows[0]) {
      return NextResponse.json(
        { error: "Updated service report could not be retrieved." },
        { status: 500 },
      );
    }

    return NextResponse.json(mapServiceReport(updatedRows[0]));
  } catch (error) {
    console.error("Update service report error:", error);

    return NextResponse.json(
      { error: "Failed to update service report." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/service-reports/[id]
 *
 * Only DRAFT reports can be deleted.
 * Employees may delete only their own drafts.
 */
export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const access = await getAccessContext();

    if (access.error) return access.error;

    const db = getDatabase();

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, employee_id, status
       FROM service_reports
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    const report = rows[0];

    if (!report) {
      return NextResponse.json(
        { error: "Service report not found." },
        { status: 404 },
      );
    }

    if (
      access.role === "auditor" &&
      String(report.employee_id) !== access.employeeId
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot delete another employee's service report.",
        },
        { status: 403 },
      );
    }

    if (String(report.status).toUpperCase() !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft service reports can be deleted." },
        { status: 403 },
      );
    }

    const [result] = await db.execute<ResultSetHeader>(
      `DELETE FROM service_reports
       WHERE id = ?
         AND UPPER(status) = 'DRAFT'
         AND (
           ? = 1
           OR employee_id = ?
         )`,
      [
        id,
        access.role === "admin" ? 1 : 0,
        access.role === "auditor" ? access.employeeId : "",
      ],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Draft service report could not be deleted." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Draft service report deleted successfully.",
    });
  } catch (error) {
    console.error("Delete service report error:", error);

    return NextResponse.json(
      { error: "Failed to delete service report." },
      { status: 500 },
    );
  }
}

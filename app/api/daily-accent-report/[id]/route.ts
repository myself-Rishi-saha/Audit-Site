
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

// // ----------------------------------------------------
// // MAP DATABASE ROW
// // ----------------------------------------------------

// function mapDailyAccentReport(row: any) {
//   const template =
//     row.template_snapshot &&
//     typeof row.template_snapshot === "object" &&
//     !Array.isArray(row.template_snapshot)
//       ? row.template_snapshot
//       : {
//           id: row.template_id || "daily-accent-report",
//           type: "DAILY_ACCENT_REPORT",
//           title: "Daily Accent Report",
//           sections: [],
//         };

//   const toIsoString = (value: unknown) => {
//     if (value == null) return null;

//     const date =
//       value instanceof Date ? value : new Date(String(value));

//     return Number.isNaN(date.getTime())
//       ? String(value)
//       : date.toISOString();
//   };

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

//     templateId: String(row.template_id || "daily-accent-report"),
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
//     createdAt: toIsoString(row.created_at),
//     updatedAt: toIsoString(row.updated_at),
//     submittedAt: toIsoString(row.submitted_at),
//   };
// }

// // ----------------------------------------------------
// // ACCESS CONTEXT
// // ----------------------------------------------------

// type AccessContext =
//   | { role: "admin" }
//   | { role: "auditor"; employeeId: string }
//   | { error: Response };

// async function getAccessContext(): Promise<AccessContext> {
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

//       return { role: "admin" };
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
//       can_access_daily_accent_report
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

//   if (employee.can_access_daily_accent_report !== true) {
//     return {
//       error: NextResponse.json(
//         {
//           error:
//             "You do not have permission to access Daily Accent Reports.",
//         },
//         { status: 403 },
//       ),
//     };
//   }

//   return {
//     role: "auditor",
//     employeeId: String(employee.id),
//   };
// }

// // ----------------------------------------------------
// // GET /api/daily-accent-reports/[id]
// // ----------------------------------------------------

// export async function GET(
//   _request: Request,
//   { params }: RouteContext,
// ) {
//   try {
//     const { id } = await params;
//     const access = await getAccessContext();

//     if ("error" in access) {
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
//       FROM daily_accent_reports
//       WHERE id = ${id}
//       LIMIT 1
//     `;

//     const report = rows[0];

//     if (!report) {
//       return NextResponse.json(
//         { error: "Daily Accent Report not found." },
//         { status: 404 },
//       );
//     }

//     if (
//       access.role === "auditor" &&
//       String(report.employee_id) !== access.employeeId
//     ) {
//       return NextResponse.json(
//         {
//           error:
//             "You cannot access another employee's Daily Accent Report.",
//         },
//         { status: 403 },
//       );
//     }

//     return NextResponse.json(mapDailyAccentReport(report));
//   } catch (error) {
//     console.error("Get Daily Accent Report error:", error);

//     return NextResponse.json(
//       { error: "Failed to get Daily Accent Report." },
//       { status: 500 },
//     );
//   }
// }

// // ----------------------------------------------------
// // PUT /api/daily-accent-reports/[id]
// //
// // Admin: edit report data while preserving report identity/status.
// // Employee: edit only their own drafts.
// // ----------------------------------------------------

// export async function PUT(
//   request: Request,
//   { params }: RouteContext,
// ) {
//   try {
//     const { id } = await params;
//     const access = await getAccessContext();

//     if ("error" in access) {
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
//       FROM daily_accent_reports
//       WHERE id = ${id}
//       LIMIT 1
//     `;

//     const existing = rows[0];

//     if (!existing) {
//       return NextResponse.json(
//         { error: "Daily Accent Report not found." },
//         { status: 404 },
//       );
//     }

//     if (
//       access.role === "auditor" &&
//       String(existing.employee_id) !== access.employeeId
//     ) {
//       return NextResponse.json(
//         {
//           error:
//             "You cannot edit another employee's Daily Accent Report.",
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
//             "Only draft Daily Accent Reports can be edited by employees.",
//         },
//         { status: 403 },
//       );
//     }

//     const body = await request.json();

//     // Do not accept changes to ownership, ID, template or status here.
//     const formData = body.formData ?? existing.form_data ?? {};
//     const evidence = body.evidence ?? existing.evidence ?? {};
//     const signatures = body.signatures ?? existing.signatures ?? {};

//     const updatedRows = await sql`
//       UPDATE daily_accent_reports
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
//         { error: "Daily Accent Report could not be updated." },
//         { status: 403 },
//       );
//     }

//     return NextResponse.json(
//       mapDailyAccentReport(updatedRows[0]),
//     );
//   } catch (error) {
//     console.error("Update Daily Accent Report error:", error);

//     return NextResponse.json(
//       { error: "Failed to update Daily Accent Report." },
//       { status: 500 },
//     );
//   }
// }

// // ----------------------------------------------------
// // DELETE /api/daily-accent-reports/[id]
// //
// // Only drafts can be deleted.
// // ----------------------------------------------------

// export async function DELETE(
//   _request: Request,
//   { params }: RouteContext,
// ) {
//   try {
//     const { id } = await params;
//     const access = await getAccessContext();

//     if ("error" in access) {
//       return access.error;
//     }

//     const sql = getDatabase();

//     const rows = await sql`
//       SELECT id, employee_id, status
//       FROM daily_accent_reports
//       WHERE id = ${id}
//       LIMIT 1
//     `;

//     const report = rows[0];

//     if (!report) {
//       return NextResponse.json(
//         { error: "Daily Accent Report not found." },
//         { status: 404 },
//       );
//     }

//     if (
//       access.role === "auditor" &&
//       String(report.employee_id) !== access.employeeId
//     ) {
//       return NextResponse.json(
//         {
//           error:
//             "You cannot delete another employee's Daily Accent Report.",
//         },
//         { status: 403 },
//       );
//     }

//     if (String(report.status).toUpperCase() !== "DRAFT") {
//       return NextResponse.json(
//         {
//           error:
//             "Only draft Daily Accent Reports can be deleted.",
//         },
//         { status: 403 },
//       );
//     }

//     const deletedRows = await sql`
//       DELETE FROM daily_accent_reports
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
//         {
//           error:
//             "Draft Daily Accent Report could not be deleted.",
//         },
//         { status: 403 },
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       message: "Draft Daily Accent Report deleted successfully.",
//     });
//   } catch (error) {
//     console.error("Delete Daily Accent Report error:", error);

//     return NextResponse.json(
//       { error: "Failed to delete Daily Accent Report." },
//       { status: 500 },
//     );
//   }
// }

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getDatabase } from "@/lib/db";

const EMPLOYEE_COOKIE = "auditdesk_session";
const ADMIN_COOKIE = "auditdesk_admin_session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type AccessContext =
  | { role: "admin" }
  | { role: "auditor"; employeeId: string }
  | { error: Response };

type ReportRow = RowDataPacket & {
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
  created_at: string | Date | null;
  updated_at: string | Date | null;
  submitted_at: string | Date | null;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

function isEnabled(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function parseObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Invalid or empty JSON falls back to an empty object.
    }
  }

  return {};
}

function toIsoString(value: unknown): string | null {
  if (value == null) return null;

  const date = value instanceof Date ? value : new Date(String(value));

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toISOString();
}

function mapDailyAccentReport(row: ReportRow) {
  const templateSnapshot = parseObject(row.template_snapshot);

  const template =
    Object.keys(templateSnapshot).length > 0
      ? templateSnapshot
      : {
          id: row.template_id || "daily-accent-report",
          type: "DAILY_ACCENT_REPORT",
          title: "Daily Accent Report",
          sections: [],
        };

  return {
    id: String(row.id),
    employeeId: String(row.employee_id),
    employeeName: String(row.employee_name),

    customerId:
      row.customer_id == null ? null : String(row.customer_id),

    customerName:
      row.customer_name == null ? null : String(row.customer_name),

    customerAddress:
      row.customer_address == null
        ? null
        : String(row.customer_address),

    templateId: String(row.template_id || "daily-accent-report"),
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

const REPORT_COLUMNS = `
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
  created_at,
  updated_at,
  submitted_at
`;

async function getAccessContext(): Promise<AccessContext> {
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

      return { role: "admin" };
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

  const [employees] = await db.execute<RowDataPacket[]>(
    `SELECT id, role, is_active, can_access_daily_accent_report
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
          error: "Your employee account is inactive or unauthorized.",
        },
        { status: 403 },
      ),
    };
  }

  if (!isEnabled(employee.can_access_daily_accent_report)) {
    return {
      error: NextResponse.json(
        {
          error:
            "You do not have permission to access Daily Accent Reports.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    role: "auditor",
    employeeId: String(employee.id),
  };
}

// ----------------------------------------------------
// GET /api/daily-accent-reports/[id]
// ----------------------------------------------------

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const access = await getAccessContext();

    if ("error" in access) return access.error;

    const db = getDatabase();

    const [rows] = await db.execute<ReportRow[]>(
      `SELECT ${REPORT_COLUMNS}
       FROM daily_accent_reports
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    const report = rows[0];

    if (!report) {
      return NextResponse.json(
        { error: "Daily Accent Report not found." },
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
            "You cannot access another employee's Daily Accent Report.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(mapDailyAccentReport(report));
  } catch (error) {
    console.error("Get Daily Accent Report error:", error);

    return NextResponse.json(
      { error: "Failed to get Daily Accent Report." },
      { status: 500 },
    );
  }
}

// ----------------------------------------------------
// PUT /api/daily-accent-reports/[id]
//
// Admin: edit report data without changing its identity,
// customer, template, ownership, or status.
// Employee: edit only their own drafts.
// ----------------------------------------------------

export async function PUT(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const access = await getAccessContext();

    if ("error" in access) return access.error;

    const db = getDatabase();

    const [rows] = await db.execute<ReportRow[]>(
      `SELECT ${REPORT_COLUMNS}
       FROM daily_accent_reports
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    const existing = rows[0];

    if (!existing) {
      return NextResponse.json(
        { error: "Daily Accent Report not found." },
        { status: 404 },
      );
    }

    if (
      access.role === "auditor" &&
      String(existing.employee_id) !== access.employeeId
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot edit another employee's Daily Accent Report.",
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
            "Only draft Daily Accent Reports can be edited by employees.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Only update editable report content. Preserve existing values
    // whenever the request omits a property.
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

    const whereClause =
      access.role === "admin"
        ? "id = ?"
        : "id = ? AND employee_id = ? AND UPPER(status) = 'DRAFT'";

    const queryParams =
      access.role === "admin"
        ? [
            JSON.stringify(formData),
            JSON.stringify(evidence),
            JSON.stringify(signatures),
            id,
          ]
        : [
            JSON.stringify(formData),
            JSON.stringify(evidence),
            JSON.stringify(signatures),
            id,
            access.employeeId,
          ];

    const [updateResult] = await db.execute<ResultSetHeader>(
      `UPDATE daily_accent_reports
       SET
         form_data = ?,
         evidence = ?,
         signatures = ?,
         updated_at = UTC_TIMESTAMP(3)
       WHERE ${whereClause}`,
      queryParams,
    );

    if (updateResult.affectedRows === 0) {
      // A valid update may report zero changed rows if values are
      // unchanged, so verify that the report still exists and is readable.
      const [checkRows] = await db.execute<ReportRow[]>(
        `SELECT ${REPORT_COLUMNS}
         FROM daily_accent_reports
         WHERE id = ?
         LIMIT 1`,
        [id],
      );

      const current = checkRows[0];

      if (
        !current ||
        (access.role === "auditor" &&
          (String(current.employee_id) !== access.employeeId ||
            String(current.status).toUpperCase() !== "DRAFT"))
      ) {
        return NextResponse.json(
          { error: "Daily Accent Report could not be updated." },
          { status: 403 },
        );
      }

      return NextResponse.json(mapDailyAccentReport(current));
    }

    const [updatedRows] = await db.execute<ReportRow[]>(
      `SELECT ${REPORT_COLUMNS}
       FROM daily_accent_reports
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    if (!updatedRows[0]) {
      return NextResponse.json(
        { error: "Daily Accent Report not found after update." },
        { status: 404 },
      );
    }

    return NextResponse.json(mapDailyAccentReport(updatedRows[0]));
  } catch (error) {
    console.error("Update Daily Accent Report error:", error);

    return NextResponse.json(
      { error: "Failed to update Daily Accent Report." },
      { status: 500 },
    );
  }
}

// ----------------------------------------------------
// DELETE /api/daily-accent-reports/[id]
//
// Only drafts can be deleted.
// ----------------------------------------------------

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const access = await getAccessContext();

    if ("error" in access) return access.error;

    const db = getDatabase();

    const [rows] = await db.execute<
      (RowDataPacket & {
        id: string;
        employee_id: string;
        status: string;
      })[]
    >(
      `SELECT id, employee_id, status
       FROM daily_accent_reports
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    const report = rows[0];

    if (!report) {
      return NextResponse.json(
        { error: "Daily Accent Report not found." },
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
            "You cannot delete another employee's Daily Accent Report.",
        },
        { status: 403 },
      );
    }

    if (String(report.status).toUpperCase() !== "DRAFT") {
      return NextResponse.json(
        {
          error: "Only draft Daily Accent Reports can be deleted.",
        },
        { status: 403 },
      );
    }

    const whereClause =
      access.role === "admin"
        ? "id = ? AND UPPER(status) = 'DRAFT'"
        : "id = ? AND employee_id = ? AND UPPER(status) = 'DRAFT'";

    const queryParams =
      access.role === "admin"
        ? [id]
        : [id, access.employeeId];

    const [deleteResult] = await db.execute<ResultSetHeader>(
      `DELETE FROM daily_accent_reports
       WHERE ${whereClause}`,
      queryParams,
    );

    if (deleteResult.affectedRows === 0) {
      return NextResponse.json(
        {
          error: "Draft Daily Accent Report could not be deleted.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Draft Daily Accent Report deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Daily Accent Report error:", error);

    return NextResponse.json(
      { error: "Failed to delete Daily Accent Report." },
      { status: 500 },
    );
  }
}

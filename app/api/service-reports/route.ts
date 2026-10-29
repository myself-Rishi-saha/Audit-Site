// import { NextResponse } from "next/server";
// import { neon } from "@neondatabase/serverless";
// import { jwtVerify } from "jose";

// const sql = neon(process.env.DATABASE_URL!);

// const AUTH_SECRET = process.env.AUTH_SECRET;

// function isValidDate(value: string) {
//   if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

//   const date = new Date(`${value}T00:00:00.000Z`);

//   return (
//     !Number.isNaN(date.getTime()) &&
//     date.toISOString().slice(0, 10) === value
//   );
// }

// function mapServiceReport(row: any) {
//   return {
//     id: row.id,
//     employeeId: row.employee_id,
//     employeeName: row.employee_name,
//     customerId: row.customer_id,
//     customerName: row.customer_name,
//     customerAddress: row.customer_address,
//     templateId: row.template_id,
//     templateSnapshot: row.template_snapshot,
//     formData: row.form_data,
//     evidence: row.evidence,
//     signatures: row.signatures,
//     status: row.status,
//     createdAt: row.created_at,
//     updatedAt: row.updated_at,
//     submittedAt: row.submitted_at,
//   };
// }

// async function getSession(
//   token: string | undefined,
// ): Promise<Record<string, any> | null> {
//   if (!token || !AUTH_SECRET) return null;

//   try {
//     const secret = new TextEncoder().encode(AUTH_SECRET);
//     const { payload } = await jwtVerify(token, secret);

//     return payload as Record<string, any>;
//   } catch {
//     return null;
//   }
// }

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);

//     const search = (searchParams.get("search") || "").trim();
//     const requestedDate = (searchParams.get("date") || "").trim();

//     if (requestedDate && !isValidDate(requestedDate)) {
//       return NextResponse.json(
//         { error: "Invalid date. Use YYYY-MM-DD." },
//         { status: 400 },
//       );
//     }

//     const searchPattern = `%${search}%`;

//     // Read authentication cookies.
//     const cookieHeader = req.headers.get("cookie") || "";

//     const cookies = Object.fromEntries(
//       cookieHeader.split(";").map((cookie) => {
//         const separatorIndex = cookie.indexOf("=");

//         if (separatorIndex === -1) {
//           return [cookie.trim(), ""];
//         }

//         return [
//           cookie.slice(0, separatorIndex).trim(),
//           decodeURIComponent(cookie.slice(separatorIndex + 1).trim()),
//         ];
//       }),
//     );

//     const adminToken = cookies.auditdesk_admin_session;
//     const employeeToken = cookies.auditdesk_session;

//     // --------------------------------------------------
//     // ADMIN: show completed service reports with filters
//     // --------------------------------------------------
//     if (adminToken) {
//       const adminSession = await getSession(adminToken);

//       if (!adminSession) {
//         return NextResponse.json(
//           { error: "Unauthorized" },
//           { status: 401 },
//         );
//       }

//       const rows = await sql`
//         SELECT
//           id,
//           employee_id,
//           employee_name,
//           customer_id,
//           customer_name,
//           customer_address,
//           template_id,
//           template_snapshot,
//           form_data,
//           evidence,
//           signatures,
//           status,
//           created_at,
//           updated_at,
//           submitted_at
//         FROM service_reports
//         WHERE UPPER(status) = 'COMPLETED'
//           AND (
//             ${search} = ''
//             OR id ILIKE ${searchPattern}
//             OR COALESCE(employee_name, '') ILIKE ${searchPattern}
//             OR COALESCE(customer_name, '') ILIKE ${searchPattern}
//             OR COALESCE(customer_address, '') ILIKE ${searchPattern}
//           )
//           AND (
//             ${requestedDate} = ''
//             OR (
//               created_at >= ${requestedDate}::date
//               AND created_at < (${requestedDate}::date + 1)
//             )
//           )
//         ORDER BY created_at DESC
//       `;

//       return NextResponse.json(rows.map(mapServiceReport));
//     }

//     // --------------------------------------------------
//     // EMPLOYEE: authenticate employee
//     // --------------------------------------------------
//     const employeeSession = await getSession(employeeToken);

//     if (!employeeSession) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 },
//       );
//     }

//     const employeeId =
//       employeeSession.employeeId ??
//       employeeSession.employee_id ??
//       employeeSession.id;

//     if (!employeeId) {
//       return NextResponse.json(
//         { error: "Employee ID missing from session" },
//         { status: 401 },
//       );
//     }

//     // --------------------------------------------------
//     // EMPLOYEE: check service-report permission
//     // --------------------------------------------------
//     const employeeRows = await sql`
//       SELECT *
//       FROM employees
//       WHERE id = ${employeeId}
//       LIMIT 1
//     `;

//     const employee = employeeRows[0];

//     if (!employee) {
//       return NextResponse.json(
//         { error: "Employee not found" },
//         { status: 404 },
//       );
//     }

//     // Keep these permission names aligned with your DB schema.
//     if (
//       employee.can_access_service_report === false ||
//       employee.canAccessServiceReport === false
//     ) {
//       return NextResponse.json(
//         { error: "You do not have permission to access service reports" },
//         { status: 403 },
//       );
//     }

//     // --------------------------------------------------
//     // EMPLOYEE: filter only their own service reports
//     // --------------------------------------------------
//     const rows = await sql`
//       SELECT
//         id,
//         employee_id,
//         employee_name,
//         customer_id,
//         customer_name,
//         customer_address,
//         template_id,
//         template_snapshot,
//         form_data,
//         evidence,
//         signatures,
//         status,
//         created_at,
//         updated_at,
//         submitted_at
//       FROM service_reports
//       WHERE employee_id = ${employeeId}
//         AND (
//           ${search} = ''
//           OR id ILIKE ${searchPattern}
//           OR COALESCE(customer_name, '') ILIKE ${searchPattern}
//           OR COALESCE(customer_address, '') ILIKE ${searchPattern}
//         )
//         AND (
//           ${requestedDate} = ''
//           OR (
//             created_at >= ${requestedDate}::date
//             AND created_at < (${requestedDate}::date + 1)
//           )
//         )
//       ORDER BY created_at DESC
//     `;

//     return NextResponse.json(rows.map(mapServiceReport));
//   } catch (error) {
//     console.error("GET /api/service-reports error:", error);

//     return NextResponse.json(
//       { error: "Failed to fetch service reports" },
//       { status: 500 },
//     );
//   }
// }

// // ----------------------------------------------------
// // POST /api/service-reports
// //
// // Only active auditors with service-report permission
// // can create a draft.
// // ----------------------------------------------------

// export async function POST(req: Request) {
//   try {
//        const cookieHeader = req.headers.get("cookie") || "";

//     const cookies = Object.fromEntries(
//       cookieHeader.split(";").map((cookie) => {
//         const index = cookie.indexOf("=");

//         if (index === -1) {
//           return [cookie.trim(), ""];
//         }

//         return [
//           cookie.slice(0, index).trim(),
//           decodeURIComponent(cookie.slice(index + 1).trim()),
//         ];
//       }),
//     );

//     const employeeToken = cookies.auditdesk_session;
//     const payload = await getSession(employeeToken);

//     if (!payload || payload.role !== "auditor" || !payload.id) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 },
//       );
//     }

//     const employeeId = String(payload.id);
//     //const sql = getDatabase();

//     // Verify account status and current service-report permission.
//     const employeeRows = await sql`
//       SELECT
//         id,
//         name,
//         role,
//         is_active,
//         can_access_service_report
//       FROM employees
//       WHERE id = ${employeeId}
//       LIMIT 1
//     `;

//     const employee = employeeRows[0];

//     if (!employee) {
//       return NextResponse.json(
//         { error: "Employee not found." },
//         { status: 404 },
//       );
//     }

//     if (
//       employee.is_active !== true ||
//       employee.role !== "auditor"
//     ) {
//       return NextResponse.json(
//         { error: "Your employee account is inactive or unauthorized." },
//         { status: 403 },
//       );
//     }

//     if (employee.can_access_service_report !== true) {
//       return NextResponse.json(
//         {
//           error:
//             "You do not have permission to create service reports.",
//         },
//         { status: 403 },
//       );
//     }

//     const body = await req.json();

//     const customerId = body.customerId ?? null;
//     const customerName = body.customerName ?? null;
//     const customerAddress = body.customerAddress ?? null;

//     const templateId = body.templateId ?? "service-report";

//     const templateSnapshot = body.templateSnapshot ?? {
//       id: templateId,
//       type: "SERVICE_REPORT",
//       name: "Equipment Service & Maintenance Report",
//       sections: [],
//     };

//     // Generate the next SRV ID.
//     const idRows = await sql`
//       SELECT
//         COALESCE(
//           MAX(
//             CAST(NULLIF(SUBSTRING(id FROM 5), '') AS INTEGER)
//           ),
//           0
//         ) + 1 AS next_number
//       FROM service_reports
//       WHERE id ~ '^SRV-[0-9]+$'
//     `;

//     const nextNumber = Number(idRows[0]?.next_number || 1);
//     const reportId = `SRV-${String(nextNumber).padStart(3, "0")}`;

//     const rows = await sql`
//       INSERT INTO service_reports (
//         id,
//         employee_id,
//         employee_name,
//         customer_id,
//         customer_name,
//         customer_address,
//         template_id,
//         template_snapshot,
//         form_data,
//         evidence,
//         signatures,
//         status,
//         created_at,
//         updated_at,
//         submitted_at
//       )
//       VALUES (
//         ${reportId},
//         ${employeeId},
//         ${String(employee.name)},
//         ${customerId},
//         ${customerName},
//         ${customerAddress},
//         ${templateId},
//         ${JSON.stringify(templateSnapshot)}::jsonb,
//         ${JSON.stringify(body.formData ?? {})}::jsonb,
//         ${JSON.stringify(body.evidence ?? {})}::jsonb,
//         ${JSON.stringify(body.signatures ?? {})}::jsonb,
//         'DRAFT',
//         NOW(),
//         NOW(),
//         NULL
//       )
//       RETURNING
//         id,
//         employee_id,
//         employee_name,
//         customer_id,
//         customer_name,
//         customer_address,
//         template_id,
//         template_snapshot,
//         form_data,
//         evidence,
//         signatures,
//         status,
//         created_at,
//         updated_at,
//         submitted_at
//     `;

//     return NextResponse.json(
//       mapServiceReport(rows[0]),
//       { status: 201 },
//     );
//   } catch (error) {
//     console.error("Create service report error:", error);

//     return NextResponse.json(
//       { error: "Failed to save service report draft." },
//       { status: 500 },
//     );
//   }
// }
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { RowDataPacket } from "mysql2/promise";

import { getDatabase } from "@/lib/db";

const ADMIN_COOKIE = "auditdesk_admin_session";
const EMPLOYEE_COOKIE = "auditdesk_session";

interface SessionPayload {
  id?: string;
  employeeId?: string;
  employee_id?: string;
  name?: string;
  role?: string;
}

interface EmployeeRow extends RowDataPacket {
  id: string;
  name: string;
  role: string;
  is_active: boolean | number | string;
  can_access_service_report: boolean | number | string;
}

interface CounterRow extends RowDataPacket {
  next_number: number | string;
}

interface ServiceReportRow extends RowDataPacket {
  id: string;
  employee_id: string;
  employee_name: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_address: string | null;
  customer_gst_no: string | null;
  customer_contact_number: string | null;
  template_id: string;
  template_snapshot: unknown;
  form_data: unknown;
  evidence: unknown;
  signatures: unknown;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
  submitted_at: string | Date | null;
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function getIndiaDateRange(date: string): [string, string] {
  // The requested date is a calendar date in Asia/Kolkata.
  // Convert its start and end to UTC for comparison with MariaDB.
  const start = new Date(`${date}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const toMysqlUtc = (value: Date) =>
    value.toISOString().slice(0, 23).replace("T", " ");

  return [toMysqlUtc(start), toMysqlUtc(end)];
}

function toIsoString(value: string | Date | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value)
            ? `${value.replace(" ", "T")}Z`
            : value,
        );

  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function parseJsonObject<T extends Record<string, unknown>>(
  value: unknown,
  fallback: T,
): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);

      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as T;
      }
    } catch {
      // Fall through to the default value.
    }
  }

  return fallback;
}

function mapServiceReport(row: ServiceReportRow) {
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
    templateSnapshot: parseJsonObject<Record<string, unknown>>(
      row.template_snapshot,
      {
        id: row.template_id || "service-report",
        type: "SERVICE_REPORT",
        title: "Service Report",
        sections: [],
      },
    ),
    formData: parseJsonObject<Record<string, unknown>>(row.form_data, {}),
    evidence: parseJsonObject<Record<string, unknown>>(row.evidence, {}),
    signatures: parseJsonObject<Record<string, unknown>>(row.signatures, {}),

    status: String(row.status).toUpperCase() as "DRAFT" | "COMPLETED",

    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    submittedAt: toIsoString(row.submitted_at),
  };
}

function getCookieToken(request: Request, cookieName: string) {
  const cookieHeader = request.headers.get("cookie") || "";

  for (const part of cookieHeader.split(";")) {
    const separatorIndex = part.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const name = part.slice(0, separatorIndex).trim();

    if (name !== cookieName) {
      continue;
    }

    const value = part.slice(separatorIndex + 1).trim();

    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return undefined;
}

async function getSession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

async function getEmployee(employeeId: string): Promise<EmployeeRow | null> {
  const db = getDatabase();

  const [rows] = await db.execute<EmployeeRow[]>(
    `SELECT
       id,
       name,
       role,
       is_active,
       can_access_service_report
     FROM employees
     WHERE id = ?
     LIMIT 1`,
    [employeeId],
  );

  return rows[0] ?? null;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

// ----------------------------------------------------
// GET /api/service-reports
// ----------------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = (searchParams.get("search") || "").trim();
    const requestedDate = (searchParams.get("date") || "").trim();

    if (requestedDate && !isValidDate(requestedDate)) {
      return NextResponse.json(
        { error: "Invalid date. Use YYYY-MM-DD." },
        { status: 400 },
      );
    }

    const db = getDatabase();

    let dateStart: string | null = null;
    let dateEnd: string | null = null;

    if (requestedDate) {
      [dateStart, dateEnd] = getIndiaDateRange(requestedDate);
    }

    // Build optional filters without comparing parameters to empty strings.
    function buildOptionalFilters(includeEmployeeName: boolean): {
      sql: string;
      params: string[];
    } {
      const conditions: string[] = [];
      const params: string[] = [];

      if (search) {
        const pattern = `%${search}%`;
        const searchableColumns = [
          "id",
          ...(includeEmployeeName ? ["employee_name"] : []),
          "customer_name",
          "customer_address",
        ];

        conditions.push(
          `(${searchableColumns
            .map((column) => `COALESCE(${column}, '') LIKE ?`)
            .join(" OR ")})`,
        );

        for (let i = 0; i < searchableColumns.length; i++) {
          params.push(pattern);
        }
      }

      if (dateStart && dateEnd) {
        conditions.push("created_at >= ? AND created_at < ?");
        params.push(dateStart, dateEnd);
      }

      return {
        sql: conditions.length ? ` AND ${conditions.join(" AND ")}` : "",
        params,
      };
    }

    // ADMIN: only completed reports.
    const adminToken = getCookieToken(request, ADMIN_COOKIE);

    if (adminToken) {
      const adminSession = await getSession(adminToken);

      if (!adminSession || adminSession.role !== "admin") {
        return unauthorized();
      }

      const filters = buildOptionalFilters(true);

      const [rows] = await db.execute<ServiceReportRow[]>(
        `SELECT
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
         WHERE UPPER(status) = 'COMPLETED'
         ${filters.sql}
         ORDER BY created_at DESC`,
        filters.params,
      );

      return NextResponse.json(rows.map(mapServiceReport));
    }

    // EMPLOYEE: authenticate and check current database permissions.
    const employeeToken = getCookieToken(request, EMPLOYEE_COOKIE);
    const employeeSession = await getSession(employeeToken);

    if (!employeeSession || employeeSession.role !== "auditor") {
      return unauthorized();
    }

    const employeeId =
      employeeSession.employeeId ??
      employeeSession.employee_id ??
      employeeSession.id;

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID missing from session" },
        { status: 401 },
      );
    }

    const employee = await getEmployee(String(employeeId));

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    if (employee.role !== "auditor" || !toBoolean(employee.is_active)) {
      return forbidden("Your employee account is inactive or unauthorized.");
    }

    if (!toBoolean(employee.can_access_service_report)) {
      return forbidden("You do not have permission to access service reports.");
    }

    const filters = buildOptionalFilters(false);

    const [rows] = await db.execute<ServiceReportRow[]>(
      `SELECT
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
       WHERE employee_id = ?
       ${filters.sql}
       ORDER BY created_at DESC`,
      [String(employeeId), ...filters.params],
    );

    return NextResponse.json(rows.map(mapServiceReport));
  } catch (error) {
    console.error("GET /api/service-reports error:", error);

    return NextResponse.json(
      { error: "Failed to fetch service reports" },
      { status: 500 },
    );
  }
}

// ----------------------------------------------------
// POST /api/service-reports
// Only active auditors with permission can create drafts.
// ----------------------------------------------------

export async function POST(request: Request) {
  try {
    const employeeToken = getCookieToken(request, EMPLOYEE_COOKIE);
    const payload = await getSession(employeeToken);

    if (!payload || payload.role !== "auditor" || !payload.id) {
      return unauthorized();
    }

    const employeeId = String(payload.id);
    const employee = await getEmployee(employeeId);

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found." },
        { status: 404 },
      );
    }

    if (employee.role !== "auditor" || !toBoolean(employee.is_active)) {
      return forbidden("Your employee account is inactive or unauthorized.");
    }

    if (!toBoolean(employee.can_access_service_report)) {
      return forbidden("You do not have permission to create service reports.");
    }

    let body: Record<string, unknown>;

    try {
      const parsed: unknown = await request.json();

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return NextResponse.json(
          { error: "Request body must be a JSON object." },
          { status: 400 },
        );
      }

      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    const customerId =
      typeof body.customerId === "string" && body.customerId.trim()
        ? body.customerId.trim()
        : null;

    const customerName =
      typeof body.customerName === "string" && body.customerName.trim()
        ? body.customerName.trim()
        : null;

    const customerAddress =
      typeof body.customerAddress === "string" && body.customerAddress.trim()
        ? body.customerAddress.trim()
        : null;

    const customerGstNo =
      typeof body.customerGstNo === "string" && body.customerGstNo.trim()
        ? body.customerGstNo.trim()
        : null;

    const customerContactNumber =
      typeof body.customerContactNumber === "string" &&
      body.customerContactNumber.trim()
        ? body.customerContactNumber.trim()
        : null;

    const templateId =
      typeof body.templateId === "string" && body.templateId.trim()
        ? body.templateId.trim()
        : "service-report";

    const templateSnapshot =
      body.templateSnapshot &&
      typeof body.templateSnapshot === "object" &&
      !Array.isArray(body.templateSnapshot)
        ? body.templateSnapshot
        : {
            id: templateId,
            type: "SERVICE_REPORT",
            name: "Equipment Service & Maintenance Report",
            title: "Service Report Form",
            sections: [],
          };

    const formData =
      body.formData &&
      typeof body.formData === "object" &&
      !Array.isArray(body.formData)
        ? body.formData
        : {};

    const evidence =
      body.evidence &&
      typeof body.evidence === "object" &&
      !Array.isArray(body.evidence)
        ? body.evidence
        : {};

    const signatures =
      body.signatures &&
      typeof body.signatures === "object" &&
      !Array.isArray(body.signatures)
        ? body.signatures
        : {};

    const db = getDatabase();
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Initialize the SRV counter if it does not exist.
      await connection.execute(
        `INSERT IGNORE INTO report_id_counters
           (report_type, next_number)
         VALUES ('SRV', 1)`,
      );

      // Lock the counter so simultaneous requests cannot allocate
      // the same service report ID.
      const [counterRows] = await connection.execute<CounterRow[]>(
        `SELECT next_number
         FROM report_id_counters
         WHERE report_type = 'SRV'
         FOR UPDATE`,
      );

      if (counterRows.length === 0) {
        throw new Error("Failed to initialize SRV ID counter");
      }

      const counterValue = Number(counterRows[0].next_number);

      const [maxRows] = await connection.execute<RowDataPacket[]>(
        `SELECT COALESCE(
           MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)),
           0
         ) AS max_number
         FROM service_reports
         WHERE id REGEXP '^SRV-[0-9]+$'`,
      );

      const maxExistingNumber = Number(maxRows[0]?.max_number ?? 0);
      const nextNumber = Math.max(counterValue, maxExistingNumber + 1);

      if (!Number.isSafeInteger(nextNumber) || nextNumber < 1) {
        throw new Error("Invalid SRV ID counter value");
      }

      const reportId = `SRV-${String(nextNumber).padStart(3, "0")}`;

      await connection.execute(
        `UPDATE report_id_counters
         SET next_number = ?
         WHERE report_type = 'SRV'`,
        [nextNumber + 1],
      );

      //       await connection.execute(
      //         `INSERT INTO service_reports (
      //            id,
      //            employee_id,
      //            employee_name,
      //            customer_id,
      //            customer_name,
      //            customer_address,
      //            customer_gst_no,
      // customer_contact_number,
      //            template_id,
      //            template_snapshot,
      //            form_data,
      //            evidence,
      //            signatures,
      //            status,
      //            created_at,
      //            updated_at,
      //            submitted_at
      //          )
      //          VALUES (
      //            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      //            'DRAFT',
      //            UTC_TIMESTAMP(3),
      //            UTC_TIMESTAMP(3),
      //            NULL
      //          )`,
      //         [
      //           reportId,
      //           String(employee.id),
      //           String(employee.name),
      //           customerId,
      //           customerName,
      //           customerAddress,
      //           templateId,
      //           JSON.stringify(templateSnapshot),
      //           JSON.stringify(formData),
      //           JSON.stringify(evidence),
      //           JSON.stringify(signatures),
      //         ],
      //       );
      await connection.execute(
        `INSERT INTO service_reports (
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
   )
   VALUES (
     ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
     'DRAFT',
     UTC_TIMESTAMP(3),
     UTC_TIMESTAMP(3),
     NULL
   )`,
        [
          reportId,
          String(employee.id),
          String(employee.name),
          customerId,
          customerName,
          customerAddress,
          customerGstNo,
          customerContactNumber,
          templateId,
          JSON.stringify(templateSnapshot),
          JSON.stringify(formData),
          JSON.stringify(evidence),
          JSON.stringify(signatures),
        ],
      );
      // const [rows] = await connection.execute<ServiceReportRow[]>(
      //   `SELECT
      //      id,
      //      employee_id,
      //      employee_name,
      //      customer_id,
      //      customer_name,
      //      customer_address,
      //      template_id,
      //      template_snapshot,
      //      form_data,
      //      evidence,
      //      signatures,
      //      status,
      //      created_at,
      //      updated_at,
      //      submitted_at
      //    FROM service_reports
      //    WHERE id = ?
      //    LIMIT 1`,
      //   [reportId],
      // );
      const [rows] = await connection.execute<ServiceReportRow[]>(
        `SELECT
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
   WHERE id = ?
   LIMIT 1`,
        [reportId],
      );
      if (rows.length === 0) {
        throw new Error("Created service report could not be retrieved");
      }

      await connection.commit();

      return NextResponse.json(mapServiceReport(rows[0]), { status: 201 });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Create service report error:", error);

    return NextResponse.json(
      { error: "Failed to save service report draft." },
      { status: 500 },
    );
  }
}

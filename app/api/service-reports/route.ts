// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { jwtVerify } from "jose";
// import { neon } from "@neondatabase/serverless";

// const EMPLOYEE_COOKIE = "auditdesk_session";
// const ADMIN_COOKIE = "auditdesk_admin_session";

// // ----------------------------------------------------
// // DATABASE AND AUTHENTICATION
// // ----------------------------------------------------

// function getDatabase() {
//   const url = process.env.DATABASE_URL;

//   if (!url) {
//     throw new Error("DATABASE_URL is not configured");
//   }

//   return neon(url);
// }

// function getAuthSecret() {
//   const secret = process.env.AUTH_SECRET;

//   if (!secret) {
//     throw new Error("AUTH_SECRET is not configured");
//   }

//   return new TextEncoder().encode(secret);
// }

// // ----------------------------------------------------
// // DATE HELPERS
// // ----------------------------------------------------

// function getTodayDate() {
//   const parts = new Intl.DateTimeFormat("en-GB", {
//     timeZone: "Asia/Kolkata",
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   }).formatToParts(new Date());

//   const part = (type: string) =>
//     parts.find((item) => item.type === type)?.value ?? "";

//   return `${part("year")}-${part("month")}-${part("day")}`;
// }

// function isValidDate(value: string) {
//   const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

//   if (!match) return false;

//   const year = Number(match[1]);
//   const month = Number(match[2]);
//   const day = Number(match[3]);

//   const parsed = new Date(Date.UTC(year, month - 1, day));

//   return (
//     parsed.getUTCFullYear() === year &&
//     parsed.getUTCMonth() === month - 1 &&
//     parsed.getUTCDate() === day
//   );
// }

// function toIsoString(value: unknown): string {
//   if (value == null) return "";

//   const date =
//     value instanceof Date ? value : new Date(String(value));

//   return Number.isNaN(date.getTime())
//     ? String(value)
//     : date.toISOString();
// }

// // ----------------------------------------------------
// // MAP DATABASE ROW
// // ----------------------------------------------------

// function mapServiceReport(row: any) {
//   const templateSnapshot =
//     row.template_snapshot &&
//     typeof row.template_snapshot === "object" &&
//     !Array.isArray(row.template_snapshot)
//       ? row.template_snapshot
//       : {
//           id: row.template_id || "service-report",
//           type: "SERVICE_REPORT",
//           title: "Service Report",
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

//     templateId: String(row.template_id || ""),
//     templateSnapshot,

//     // Compatibility with pages that expect `template`.
//     template: templateSnapshot,

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

//     status: String(row.status ?? "").toUpperCase(),
//     createdAt: toIsoString(row.created_at),
//     updatedAt: toIsoString(row.updated_at),

//     submittedAt:
//       row.submitted_at == null
//         ? null
//         : toIsoString(row.submitted_at),
//   };
// }

// // ----------------------------------------------------
// // GET /api/service-reports
// //
// // Admin:
// //   Completed reports, filtered by submission date/search.
// //
// // Employee:
// //   Only their own reports, if service-report access is enabled.
// // ----------------------------------------------------

// export async function GET(req: Request) {
//   try {
//     const cookieStore = await cookies();

//     const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
//     const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

//     const sql = getDatabase();

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
//           return NextResponse.json(
//             { error: "Unauthorized." },
//             { status: 401 },
//           );
//         }
//       } catch {
//         return NextResponse.json(
//           { error: "Invalid or expired admin session." },
//           { status: 401 },
//         );
//       }

//       const { searchParams } = new URL(req.url);

//       const requestedDate =
//         searchParams.get("date")?.trim() || getTodayDate();

//       const search = (searchParams.get("search") || "").trim();

//       if (!isValidDate(requestedDate)) {
//         return NextResponse.json(
//           { error: "Invalid date. Use YYYY-MM-DD." },
//           { status: 400 },
//         );
//       }

//       const searchPattern = `%${search}%`;

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
//           AND submitted_at IS NOT NULL
//           AND submitted_at >= (
//             ${requestedDate}::date::timestamp
//             AT TIME ZONE 'Asia/Kolkata'
//           )
//           AND submitted_at < (
//             (${requestedDate}::date + 1)::timestamp
//             AT TIME ZONE 'Asia/Kolkata'
//           )
//           AND (
//             ${search} = ''
//             OR id ILIKE ${searchPattern}
//             OR employee_name ILIKE ${searchPattern}
//             OR COALESCE(customer_name, '') ILIKE ${searchPattern}
//           )
//         ORDER BY submitted_at DESC
//       `;

//       return NextResponse.json(rows.map(mapServiceReport));
//     }

//     // -----------------------------------------
//     // EMPLOYEE
//     // -----------------------------------------

//     if (!employeeToken) {
//       return NextResponse.json(
//         { error: "Authentication required." },
//         { status: 401 },
//       );
//     }

//     let payload;

//     try {
//       const result = await jwtVerify(
//         employeeToken,
//         getAuthSecret(),
//       );

//       payload = result.payload;
//     } catch {
//       return NextResponse.json(
//         { error: "Invalid or expired employee session." },
//         { status: 401 },
//       );
//     }

//     if (!payload.id || payload.role !== "auditor") {
//       return NextResponse.json(
//         { error: "Unauthorized." },
//         { status: 401 },
//       );
//     }

//     const employeeId = String(payload.id);

//     // Read current permissions from the database.
//     const employeeRows = await sql`
//       SELECT
//         id,
//         role,
//         is_active,
//         can_access_service_report
//       FROM employees
//       WHERE id = ${employeeId}
//       LIMIT 1
//     `;

//     const employee = employeeRows[0];

//     if (
//       !employee ||
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
//             "You do not have permission to access service reports.",
//         },
//         { status: 403 },
//       );
//     }

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
//       ORDER BY created_at DESC
//     `;

//     return NextResponse.json(rows.map(mapServiceReport));
//   } catch (error) {
//     console.error("Read service reports error:", error);

//     return NextResponse.json(
//       { error: "Failed to load service reports." },
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
//     const cookieStore = await cookies();

//     const employeeToken =
//       cookieStore.get(EMPLOYEE_COOKIE)?.value;

//     if (!employeeToken) {
//       return NextResponse.json(
//         { error: "Authentication required." },
//         { status: 401 },
//       );
//     }

//     let payload;

//     try {
//       const result = await jwtVerify(
//         employeeToken,
//         getAuthSecret(),
//       );

//       payload = result.payload;
//     } catch {
//       return NextResponse.json(
//         { error: "Invalid or expired employee session." },
//         { status: 401 },
//       );
//     }

//     if (!payload.id || payload.role !== "auditor") {
//       return NextResponse.json(
//         {
//           error:
//             "Only authenticated auditors can create service reports.",
//         },
//         { status: 403 },
//       );
//     }

//     const sql = getDatabase();
//     const employeeId = String(payload.id);

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
import { neon } from "@neondatabase/serverless";
import { jwtVerify } from "jose";

const sql = neon(process.env.DATABASE_URL!);

const AUTH_SECRET = process.env.AUTH_SECRET;

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function mapServiceReport(row: any) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerAddress: row.customer_address,
    templateId: row.template_id,
    templateSnapshot: row.template_snapshot,
    formData: row.form_data,
    evidence: row.evidence,
    signatures: row.signatures,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
  };
}

async function getSession(
  token: string | undefined,
): Promise<Record<string, any> | null> {
  if (!token || !AUTH_SECRET) return null;

  try {
    const secret = new TextEncoder().encode(AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return payload as Record<string, any>;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const search = (searchParams.get("search") || "").trim();
    const requestedDate = (searchParams.get("date") || "").trim();

    if (requestedDate && !isValidDate(requestedDate)) {
      return NextResponse.json(
        { error: "Invalid date. Use YYYY-MM-DD." },
        { status: 400 },
      );
    }

    const searchPattern = `%${search}%`;

    // Read authentication cookies.
    const cookieHeader = req.headers.get("cookie") || "";

    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((cookie) => {
        const separatorIndex = cookie.indexOf("=");

        if (separatorIndex === -1) {
          return [cookie.trim(), ""];
        }

        return [
          cookie.slice(0, separatorIndex).trim(),
          decodeURIComponent(cookie.slice(separatorIndex + 1).trim()),
        ];
      }),
    );

    const adminToken = cookies.auditdesk_admin_session;
    const employeeToken = cookies.auditdesk_session;

    // --------------------------------------------------
    // ADMIN: show completed service reports with filters
    // --------------------------------------------------
    if (adminToken) {
      const adminSession = await getSession(adminToken);

      if (!adminSession) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 },
        );
      }

      const rows = await sql`
        SELECT
          id,
          employee_id,
          employee_name,
          customer_id,
          customer_name,
          customer_address,
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
          AND (
            ${search} = ''
            OR id ILIKE ${searchPattern}
            OR COALESCE(employee_name, '') ILIKE ${searchPattern}
            OR COALESCE(customer_name, '') ILIKE ${searchPattern}
            OR COALESCE(customer_address, '') ILIKE ${searchPattern}
          )
          AND (
            ${requestedDate} = ''
            OR (
              created_at >= ${requestedDate}::date
              AND created_at < (${requestedDate}::date + 1)
            )
          )
        ORDER BY created_at DESC
      `;

      return NextResponse.json(rows.map(mapServiceReport));
    }

    // --------------------------------------------------
    // EMPLOYEE: authenticate employee
    // --------------------------------------------------
    const employeeSession = await getSession(employeeToken);

    if (!employeeSession) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
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

    // --------------------------------------------------
    // EMPLOYEE: check service-report permission
    // --------------------------------------------------
    const employeeRows = await sql`
      SELECT *
      FROM employees
      WHERE id = ${employeeId}
      LIMIT 1
    `;

    const employee = employeeRows[0];

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    // Keep these permission names aligned with your DB schema.
    if (
      employee.can_access_service_report === false ||
      employee.canAccessServiceReport === false
    ) {
      return NextResponse.json(
        { error: "You do not have permission to access service reports" },
        { status: 403 },
      );
    }

    // --------------------------------------------------
    // EMPLOYEE: filter only their own service reports
    // --------------------------------------------------
    const rows = await sql`
      SELECT
        id,
        employee_id,
        employee_name,
        customer_id,
        customer_name,
        customer_address,
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
      WHERE employee_id = ${employeeId}
        AND (
          ${search} = ''
          OR id ILIKE ${searchPattern}
          OR COALESCE(customer_name, '') ILIKE ${searchPattern}
          OR COALESCE(customer_address, '') ILIKE ${searchPattern}
        )
        AND (
          ${requestedDate} = ''
          OR (
            created_at >= ${requestedDate}::date
            AND created_at < (${requestedDate}::date + 1)
          )
        )
      ORDER BY created_at DESC
    `;

    return NextResponse.json(rows.map(mapServiceReport));
  } catch (error) {
    console.error("GET /api/service-reports error:", error);

    return NextResponse.json(
      { error: "Failed to fetch service reports" },
      { status: 500 },
    );
  }
}
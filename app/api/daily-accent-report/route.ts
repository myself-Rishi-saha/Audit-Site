// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { jwtVerify } from "jose";
// import { neon } from "@neondatabase/serverless";

// const EMPLOYEE_COOKIE = "auditdesk_session";
// const ADMIN_COOKIE = "auditdesk_admin_session";

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

//   const date = value instanceof Date ? value : new Date(String(value));

//   return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
// }

// // ----------------------------------------------------
// // MAP DATABASE ROW
// // ----------------------------------------------------

// function mapDailyAccentReport(row: any) {
//   const templateSnapshot =
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

//   return {
//     id: String(row.id),
//     employeeId: String(row.employee_id),
//     employeeName: String(row.employee_name),

//     customerId: row.customer_id == null ? null : String(row.customer_id),

//     customerName: row.customer_name == null ? null : String(row.customer_name),

//     customerAddress:
//       row.customer_address == null ? null : String(row.customer_address),

//     templateId: String(row.template_id || "daily-accent-report"),
//     templateSnapshot,
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
//       row.submitted_at == null ? null : toIsoString(row.submitted_at),
//   };
// }

// // ----------------------------------------------------
// // GET /api/daily-accent-reports
// //
// // Admin: completed reports filtered by date/search.
// // Employee: only their own reports, with permission.
// // ----------------------------------------------------

// export async function GET(req: Request) {
//   try {
//     const cookieStore = await cookies();

//     const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
//     const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

//     const sql = getDatabase();

//     // ADMIN
//     if (adminToken) {
//       try {
//         const { payload } = await jwtVerify(adminToken, getAuthSecret());

//         if (!payload.id || payload.role !== "admin") {
//           return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
//         }
//       } catch {
//         return NextResponse.json(
//           { error: "Invalid or expired admin session." },
//           { status: 401 },
//         );
//       }

//       const { searchParams } = new URL(req.url);

//       const requestedDate = searchParams.get("date")?.trim() || getTodayDate();

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
//         FROM daily_accent_reports
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

//       return NextResponse.json(rows.map(mapDailyAccentReport));
//     }

//     // EMPLOYEE
//     if (!employeeToken) {
//       return NextResponse.json(
//         { error: "Authentication required." },
//         { status: 401 },
//       );
//     }

//     let payload;

//     try {
//       const result = await jwtVerify(employeeToken, getAuthSecret());

//       payload = result.payload;
//     } catch {
//       return NextResponse.json(
//         { error: "Invalid or expired employee session." },
//         { status: 401 },
//       );
//     }

//     if (!payload.id || payload.role !== "auditor") {
//       return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
//     }

//     const employeeId = String(payload.id);

//     const employeeRows = await sql`
//       SELECT
//         id,
//         role,
//         is_active,
//         can_access_daily_accent_report
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
//         {
//           error: "Your employee account is inactive or unauthorized.",
//         },
//         { status: 403 },
//       );
//     }

//     if (employee.can_access_daily_accent_report !== true) {
//       return NextResponse.json(
//         {
//           error: "You do not have permission to access Daily Accent Reports.",
//         },
//         { status: 403 },
//       );
//     }
//     const { searchParams } = new URL(req.url);

//     const requestedDate = searchParams.get("date")?.trim() || "";
//     const search = (searchParams.get("search") || "").trim();

//     if (requestedDate && !isValidDate(requestedDate)) {
//       return NextResponse.json(
//         { error: "Invalid date. Use YYYY-MM-DD." },
//         { status: 400 },
//       );
//     }

//     const searchPattern = `%${search}%`;

//     //     const rows = await sql`
//     //   SELECT
//     //     id,
//     //     employee_id,
//     //     employee_name,
//     //     customer_id,
//     //     customer_name,
//     //     customer_address,
//     //     template_id,
//     //     template_snapshot,
//     //     form_data,
//     //     evidence,
//     //     signatures,
//     //     status,
//     //     created_at,
//     //     updated_at,
//     //     submitted_at
//     //   FROM daily_accent_reports
//     //   WHERE employee_id = ${employeeId}
//     //     AND (
//     //       ${requestedDate} = ''
//     //       OR (
//     //         submitted_at IS NOT NULL
//     //         AND submitted_at >= (
//     //           ${requestedDate}::date::timestamp
//     //           AT TIME ZONE 'Asia/Kolkata'
//     //         )
//     //         AND submitted_at < (
//     //           (${requestedDate}::date + 1)::timestamp
//     //           AT TIME ZONE 'Asia/Kolkata'
//     //         )
//     //       )
//     //     )
//     //     AND (
//     //       ${search} = ''
//     //       OR id ILIKE ${searchPattern}
//     //       OR employee_name ILIKE ${searchPattern}
//     //       OR COALESCE(customer_name, '') ILIKE ${searchPattern}
//     //     )
//     //   ORDER BY created_at DESC
//     // `;
//    const rows = await sql`
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
//   FROM daily_accent_reports
//   WHERE employee_id = ${employeeId}
//     AND (
//       ${requestedDate} = ''
//       OR (
//         UPPER(status) = 'DRAFT'
//         AND created_at >= (
//           ${requestedDate}::date::timestamp
//           AT TIME ZONE 'Asia/Kolkata'
//         )
//         AND created_at < (
//           (${requestedDate}::date + 1)::timestamp
//           AT TIME ZONE 'Asia/Kolkata'
//         )
//       )
//       OR (
//         UPPER(status) = 'COMPLETED'
//         AND submitted_at IS NOT NULL
//         AND submitted_at >= (
//           ${requestedDate}::date::timestamp
//           AT TIME ZONE 'Asia/Kolkata'
//         )
//         AND submitted_at < (
//           (${requestedDate}::date + 1)::timestamp
//           AT TIME ZONE 'Asia/Kolkata'
//         )
//       )
//     )
//     AND (
//       ${search} = ''
//       OR id ILIKE ${searchPattern}
//       OR employee_name ILIKE ${searchPattern}
//       OR COALESCE(customer_name, '') ILIKE ${searchPattern}
//     )
//   ORDER BY created_at DESC
// `;
//     return NextResponse.json(rows.map(mapDailyAccentReport));
//     // const rows = await sql`
//     //   SELECT
//     //     id,
//     //     employee_id,
//     //     employee_name,
//     //     customer_id,
//     //     customer_name,
//     //     customer_address,
//     //     template_id,
//     //     template_snapshot,
//     //     form_data,
//     //     evidence,
//     //     signatures,
//     //     status,
//     //     created_at,
//     //     updated_at,
//     //     submitted_at
//     //   FROM daily_accent_reports
//     //   WHERE employee_id = ${employeeId}
//     //   ORDER BY created_at DESC
//     // `;

//     // return NextResponse.json(rows.map(mapDailyAccentReport));
//   } catch (error) {
//     console.error("Read Daily Accent Reports error:", error);

//     return NextResponse.json(
//       { error: "Failed to load Daily Accent Reports." },
//       { status: 500 },
//     );
//   }
// }

// // ----------------------------------------------------
// // POST /api/daily-accent-reports
// //
// // Creates a draft for an authorized employee.
// // ----------------------------------------------------

// export async function POST(req: Request) {
//   try {
//     const cookieStore = await cookies();

//     const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

//     if (!employeeToken) {
//       return NextResponse.json(
//         { error: "Authentication required." },
//         { status: 401 },
//       );
//     }

//     let payload;

//     try {
//       const result = await jwtVerify(employeeToken, getAuthSecret());

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
//           error: "Only authenticated auditors can create Daily Accent Reports.",
//         },
//         { status: 403 },
//       );
//     }

//     const sql = getDatabase();
//     const employeeId = String(payload.id);

//     const employeeRows = await sql`
//       SELECT
//         id,
//         name,
//         role,
//         is_active,
//         can_access_daily_accent_report
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

//     if (employee.is_active !== true || employee.role !== "auditor") {
//       return NextResponse.json(
//         {
//           error: "Your employee account is inactive or unauthorized.",
//         },
//         { status: 403 },
//       );
//     }

//     if (employee.can_access_daily_accent_report !== true) {
//       return NextResponse.json(
//         {
//           error: "You do not have permission to create Daily Accent Reports.",
//         },
//         { status: 403 },
//       );
//     }

//     const body = await req.json();

//     const customerId = body.customerId ?? null;
//     const customerName = body.customerName ?? null;
//     const customerAddress = body.customerAddress ?? null;

//     // This endpoint always creates a Daily Accent Report.
//     const templateId = "daily-accent-report";

//     const submittedTemplate = body.templateSnapshot;

//     const templateSnapshot =
//       submittedTemplate &&
//       typeof submittedTemplate === "object" &&
//       !Array.isArray(submittedTemplate)
//         ? {
//             ...submittedTemplate,
//             id: templateId,
//             type: "DAILY_ACCENT_REPORT",
//           }
//         : {
//             id: templateId,
//             type: "DAILY_ACCENT_REPORT",
//             name: "Daily Accent Report",
//             title: "Daily Accent Report",
//             sections: [],
//           };

//     // Generate the next DAR ID.
//     const idRows = await sql`
//       SELECT
//         COALESCE(
//           MAX(
//             CAST(NULLIF(SUBSTRING(id FROM 5), '') AS INTEGER)
//           ),
//           0
//         ) + 1 AS next_number
//       FROM daily_accent_reports
//       WHERE id ~ '^DAR-[0-9]+$'
//     `;

//     const nextNumber = Number(idRows[0]?.next_number || 1);
//     const reportId = `DAR-${String(nextNumber).padStart(3, "0")}`;

//     const rows = await sql`
//       INSERT INTO daily_accent_reports (
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

//     return NextResponse.json(mapDailyAccentReport(rows[0]), { status: 201 });
//   } catch (error) {
//     console.error("Create Daily Accent Report error:", error);

//     return NextResponse.json(
//       { error: "Failed to save Daily Accent Report draft." },
//       { status: 500 },
//     );
//   }
// }

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

import { getDatabase } from "@/lib/db";

const EMPLOYEE_COOKIE = "auditdesk_session";
const ADMIN_COOKIE = "auditdesk_admin_session";

type EmployeeRow = RowDataPacket & {
  id: string;
  name: string;
  role: string;
  is_active: number | boolean;
  can_access_daily_accent_report: number | boolean;
};

type ReportRow = RowDataPacket & {
  id: string;
  employee_id: string;
  employee_name: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_address: string | null;
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

type CounterRow = RowDataPacket & {
  next_number: number | string;
};

type MaxIdRow = RowDataPacket & {
  max_number: number | string | null;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

function isEnabled(value: number | boolean | null | undefined) {
  return value === true || value === 1;
}

function getTodayDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function isValidDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/**
 * The database stores timestamps in UTC.
 * Convert a Kolkata calendar date into its UTC start and end boundaries.
 */
function getIndiaDateRange(date: string) {
  const start = new Date(`${date}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const toSqlUtc = (value: Date) =>
    value.toISOString().slice(0, 19).replace("T", " ");

  return {
    start: toSqlUtc(start),
    end: toSqlUtc(end),
  };
}

function toIsoString(value: unknown): string {
  if (value == null) return "";

  if (value instanceof Date) return value.toISOString();

  const raw = String(value);
  const normalized = raw.includes("T")
    ? raw
    : `${raw.replace(" ", "T")}Z`;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? raw : date.toISOString();
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return value as T;
}

function mapDailyAccentReport(row: ReportRow) {
  const templateSnapshot = parseJson<Record<string, unknown>>(
    row.template_snapshot,
    {
      id: row.template_id || "daily-accent-report",
      type: "DAILY_ACCENT_REPORT",
      title: "Daily Accent Report",
      sections: [],
    },
  );

  const objectOrEmpty = (value: unknown): Record<string, unknown> => {
    const parsed = parseJson<unknown>(value, {});
    return parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
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
    templateId: String(row.template_id || "daily-accent-report"),
    templateSnapshot,
    template: templateSnapshot,
    formData: objectOrEmpty(row.form_data),
    evidence: objectOrEmpty(row.evidence),
    signatures: objectOrEmpty(row.signatures),
    status: String(row.status ?? "").toUpperCase(),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    submittedAt:
      row.submitted_at == null ? null : toIsoString(row.submitted_at),
  };
}

async function getEmployee(employeeId: string) {
  const db = getDatabase();

  const [rows] = await db.execute<EmployeeRow[]>(
    `SELECT id, name, role, is_active, can_access_daily_accent_report
     FROM employees
     WHERE id = ?
     LIMIT 1`,
    [employeeId],
  );

  return rows[0] ?? null;
}

async function getReportId(connection: PoolConnection): Promise<string> {
  // This must run inside the same transaction as the report INSERT.
  await connection.execute(
    `INSERT INTO report_id_counters (report_type, next_number)
     VALUES ('DAR', 1)
     ON DUPLICATE KEY UPDATE report_type = VALUES(report_type)`,
  );

  const [counterRows] = await connection.execute<CounterRow[]>(
    `SELECT next_number
     FROM report_id_counters
     WHERE report_type = 'DAR'
     FOR UPDATE`,
  );

  if (!counterRows[0]) {
    throw new Error("Daily Accent Report ID counter not found");
  }

  // Also protect against an existing report ID higher than the counter.
  const [maxRows] = await connection.execute<MaxIdRow[]>(
    `SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) AS max_number
     FROM daily_accent_reports
     WHERE id LIKE 'DAR-%'`,
  );

  const counter = Number(counterRows[0].next_number);
  const maximum = Number(maxRows[0]?.max_number ?? 0);
  const nextNumber = Math.max(counter, maximum + 1);

  await connection.execute(
    `UPDATE report_id_counters
     SET next_number = ?
     WHERE report_type = 'DAR'`,
    [nextNumber + 1],
  );

  return `DAR-${String(nextNumber).padStart(3, "0")}`;
}

// ----------------------------------------------------
// GET /api/daily-accent-report
// Admin: completed reports for a date, with optional search.
// Employee: own reports, with optional date and search.
// ----------------------------------------------------

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
    const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
    const db = getDatabase();

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();

    if (adminToken) {
      try {
        const { payload } = await jwtVerify(adminToken, getAuthSecret());

        if (!payload.id || payload.role !== "admin") {
          return NextResponse.json(
            { error: "Unauthorized." },
            { status: 401 },
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid or expired admin session." },
          { status: 401 },
        );
      }

      const requestedDate =
        searchParams.get("date")?.trim() || getTodayDate();

      if (!isValidDate(requestedDate)) {
        return NextResponse.json(
          { error: "Invalid date. Use YYYY-MM-DD." },
          { status: 400 },
        );
      }

      const range = getIndiaDateRange(requestedDate);
      const conditions = [
        "UPPER(status) = 'COMPLETED'",
        "submitted_at IS NOT NULL",
        "submitted_at >= ?",
        "submitted_at < ?",
      ];

      const queryParams: (string | number)[] = [range.start, range.end];

      if (search) {
        conditions.push(
          `(LOWER(CAST(id AS CHAR)) LIKE LOWER(?)
            OR LOWER(CAST(employee_name AS CHAR)) LIKE LOWER(?)
            OR LOWER(CAST(COALESCE(customer_name, '') AS CHAR)) LIKE LOWER(?))`,
        );

        const pattern = `%${search}%`;
        queryParams.push(pattern, pattern, pattern);
      }

      const [rows] = await db.execute<ReportRow[]>(
        `SELECT
           id, employee_id, employee_name, customer_id, customer_name,
           customer_address, template_id, template_snapshot, form_data,
           evidence, signatures, status, created_at, updated_at, submitted_at
         FROM daily_accent_reports
         WHERE ${conditions.join(" AND ")}
         ORDER BY submitted_at DESC`,
        queryParams,
      );

      return NextResponse.json(rows.map(mapDailyAccentReport));
    }

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

    const employeeId = String(payload.id);
    const employee = await getEmployee(employeeId);

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

    if (!isEnabled(employee.can_access_daily_accent_report)) {
      return NextResponse.json(
        { error: "You do not have permission to access Daily Accent Reports." },
        { status: 403 },
      );
    }

    const requestedDate = searchParams.get("date")?.trim() || "";

    if (requestedDate && !isValidDate(requestedDate)) {
      return NextResponse.json(
        { error: "Invalid date. Use YYYY-MM-DD." },
        { status: 400 },
      );
    }

    const conditions = ["employee_id = ?"];
    const queryParams: (string | number)[] = [employeeId];

    if (requestedDate) {
      const range = getIndiaDateRange(requestedDate);

      conditions.push(
        `(
          (UPPER(status) = 'DRAFT'
            AND created_at >= ? AND created_at < ?)
          OR
          (UPPER(status) = 'COMPLETED'
            AND submitted_at IS NOT NULL
            AND submitted_at >= ? AND submitted_at < ?)
        )`,
      );

      queryParams.push(
        range.start,
        range.end,
        range.start,
        range.end,
      );
    }

    if (search) {
      conditions.push(
        `(LOWER(CAST(id AS CHAR)) LIKE LOWER(?)
          OR LOWER(CAST(employee_name AS CHAR)) LIKE LOWER(?)
          OR LOWER(CAST(COALESCE(customer_name, '') AS CHAR)) LIKE LOWER(?))`,
      );

      const pattern = `%${search}%`;
      queryParams.push(pattern, pattern, pattern);
    }

    const [rows] = await db.execute<ReportRow[]>(
      `SELECT
         id, employee_id, employee_name, customer_id, customer_name,
         customer_address, template_id, template_snapshot, form_data,
         evidence, signatures, status, created_at, updated_at, submitted_at
       FROM daily_accent_reports
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC`,
      queryParams,
    );

    return NextResponse.json(rows.map(mapDailyAccentReport));
  } catch (error) {
    console.error("Read Daily Accent Reports error:", error);

    return NextResponse.json(
      { error: "Failed to load Daily Accent Reports." },
      { status: 500 },
    );
  }
}

// ----------------------------------------------------
// POST /api/daily-accent-report
// Creates a draft for an authorized employee.
// ----------------------------------------------------

export async function POST(req: Request) {
  let connection: PoolConnection | undefined;

  try {
    const cookieStore = await cookies();
    const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

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
        { error: "Only authenticated auditors can create Daily Accent Reports." },
        { status: 403 },
      );
    }

    const employeeId = String(payload.id);
    const employee = await getEmployee(employeeId);

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found." },
        { status: 404 },
      );
    }

    if (
      !isEnabled(employee.is_active) ||
      employee.role !== "auditor"
    ) {
      return NextResponse.json(
        { error: "Your employee account is inactive or unauthorized." },
        { status: 403 },
      );
    }

    if (!isEnabled(employee.can_access_daily_accent_report)) {
      return NextResponse.json(
        { error: "You do not have permission to create Daily Accent Reports." },
        { status: 403 },
      );
    }

    const body = await req.json();

    const customerId = body.customerId ?? null;
    const customerName = body.customerName ?? null;
    const customerAddress = body.customerAddress ?? null;

    const templateId = "daily-accent-report";
    const submittedTemplate = body.templateSnapshot;

    const templateSnapshot =
      submittedTemplate &&
      typeof submittedTemplate === "object" &&
      !Array.isArray(submittedTemplate)
        ? {
            ...submittedTemplate,
            id: templateId,
            type: "DAILY_ACCENT_REPORT",
          }
        : {
            id: templateId,
            type: "DAILY_ACCENT_REPORT",
            name: "Daily Accent Report",
            title: "Daily Accent Report",
            sections: [],
          };

    const db = getDatabase();
    connection = await db.getConnection();
    await connection.beginTransaction();

    const reportId = await getReportId(connection);

    await connection.execute<ResultSetHeader>(
      `INSERT INTO daily_accent_reports (
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
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT',
               UTC_TIMESTAMP(), UTC_TIMESTAMP(), NULL)`,
      [
        reportId,
        employeeId,
        String(employee.name),
        customerId,
        customerName,
        customerAddress,
        templateId,
        JSON.stringify(templateSnapshot),
        JSON.stringify(body.formData ?? {}),
        JSON.stringify(body.evidence ?? {}),
        JSON.stringify(body.signatures ?? {}),
      ],
    );

    const [rows] = await connection.execute<ReportRow[]>(
      `SELECT
         id, employee_id, employee_name, customer_id, customer_name,
         customer_address, template_id, template_snapshot, form_data,
         evidence, signatures, status, created_at, updated_at, submitted_at
       FROM daily_accent_reports
       WHERE id = ?
       LIMIT 1`,
      [reportId],
    );

    if (!rows[0]) {
      throw new Error("Created Daily Accent Report could not be reloaded");
    }

    await connection.commit();

    return NextResponse.json(mapDailyAccentReport(rows[0]), {
      status: 201,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Daily Accent Report rollback error:", rollbackError);
      }
    }

    console.error("Create Daily Accent Report error:", error);

    return NextResponse.json(
      { error: "Failed to save Daily Accent Report draft." },
      { status: 500 },
    );
  } finally {
    connection?.release();
  }
}

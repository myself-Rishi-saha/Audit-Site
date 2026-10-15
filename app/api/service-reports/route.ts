

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

// function getTodayDate() {
//   return new Intl.DateTimeFormat("en-CA", {
//     timeZone: "Asia/Kolkata",
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   }).format(new Date());
// }

// function mapServiceReport(row: any) {
//   return {
//     id: String(row.id),
//     employeeId: String(row.employee_id),
//     employeeName: String(row.employee_name),

//     customerId:
//       row.customer_id == null
//         ? null
//         : String(row.customer_id),

//     customerName:
//       row.customer_name == null
//         ? null
//         : String(row.customer_name),

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
//             id: row.template_id || "service-report",
//             type: "SERVICE_REPORT",
//             title: "Service Report",
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

//     status: String(row.status ?? "").toUpperCase(),

//     createdAt:
//       row.created_at?.toISOString?.() ??
//       String(row.created_at),

//     updatedAt:
//       row.updated_at?.toISOString?.() ??
//       String(row.updated_at),
//   };
// }

// /* =====================================================
//    GET

//    Auditor:
//    - Own DRAFT + COMPLETED reports

//    Admin:
//    - Only COMPLETED reports
//    - Filter by date
//    - Search employee name or customer name
//    - Default date: today (Asia/Kolkata)
// ===================================================== */

// export async function GET(req: Request) {
//   try {
//     const cookieStore = await cookies();

//     const adminToken =
//       cookieStore.get(ADMIN_COOKIE)?.value;

//     const employeeToken =
//       cookieStore.get(EMPLOYEE_COOKIE)?.value;

//     const sql = getDatabase();

//     // =================================================
//     // ADMIN
//     // =================================================

//     if (adminToken) {
//       let payload;

//       try {
//         const result = await jwtVerify(
//           adminToken,
//           getAuthSecret(),
//         );

//         payload = result.payload;
//       } catch {
//         return NextResponse.json(
//           { error: "Invalid or expired admin session." },
//           { status: 401 },
//         );
//       }

//       if (payload.role !== "admin") {
//         return NextResponse.json(
//           { error: "Unauthorized." },
//           { status: 401 },
//         );
//       }

//       const { searchParams } = new URL(req.url);

//       const requestedDate =
//         searchParams.get("date") || getTodayDate();

//       const search =
//         (searchParams.get("search") || "").trim();

//       // Validate YYYY-MM-DD and reject impossible dates.
//       const validDate =
//         /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) &&
//         !Number.isNaN(
//           Date.parse(`${requestedDate}T00:00:00Z`),
//         ) &&
//         new Date(`${requestedDate}T00:00:00Z`)
//           .toISOString()
//           .startsWith(requestedDate);

//       if (!validDate) {
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
//           updated_at
//         FROM service_reports
//         WHERE UPPER(status) = 'COMPLETED'
//           AND created_at::date = ${requestedDate}::date
//           AND (
//             ${search} = ''
//             OR employee_name ILIKE ${searchPattern}
//             OR COALESCE(customer_name, '') ILIKE ${searchPattern}
//           )
//         ORDER BY created_at DESC
//       `;

//       return NextResponse.json(
//         rows.map(mapServiceReport),
//       );
//     }

//     // =================================================
//     // AUDITOR
//     // =================================================

//     if (employeeToken) {
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

//       if (payload.role !== "auditor") {
//         return NextResponse.json(
//           { error: "Unauthorized." },
//           { status: 401 },
//         );
//       }

//       if (!payload.id) {
//         return NextResponse.json(
//           { error: "Invalid employee session." },
//           { status: 401 },
//         );
//       }

//       const employeeId = String(payload.id);

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
//           updated_at
//         FROM service_reports
//         WHERE employee_id = ${employeeId}
//         ORDER BY created_at DESC
//       `;

//       return NextResponse.json(
//         rows.map(mapServiceReport),
//       );
//     }

//     // =================================================
//     // NO LOGIN
//     // =================================================

//     return NextResponse.json(
//       { error: "Authentication required." },
//       { status: 401 },
//     );
//   } catch (error) {
//     console.error("Read service reports error:", error);

//     return NextResponse.json(
//       { error: "Failed to load service reports." },
//       { status: 500 },
//     );
//   }
// }

// /* =====================================================
//    POST

//    Only authenticated auditors can create service reports.
//    New reports remain DRAFT until explicitly submitted.
// ===================================================== */

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

//     if (payload.role !== "auditor") {
//       return NextResponse.json(
//         {
//           error:
//             "Only authenticated auditors can create service reports.",
//         },
//         { status: 403 },
//       );
//     }

//     if (!payload.id || !payload.name) {
//       return NextResponse.json(
//         { error: "Invalid employee session." },
//         { status: 401 },
//       );
//     }

//     const body = await req.json();
//     const sql = getDatabase();

//     // =================================================
//     // VERIFY EMPLOYEE
//     // =================================================

//     const employeeRows = await sql`
//       SELECT id, name, is_active, role
//       FROM employees
//       WHERE id = ${String(payload.id)}
//       LIMIT 1
//     `;

//     if (employeeRows.length === 0) {
//       return NextResponse.json(
//         { error: "Employee not found." },
//         { status: 404 },
//       );
//     }

//     const employee = employeeRows[0];

//     if (!employee.is_active) {
//       return NextResponse.json(
//         { error: "Your employee account is inactive." },
//         { status: 403 },
//       );
//     }

//     if (String(employee.role) !== "auditor") {
//       return NextResponse.json(
//         { error: "Only auditors can create service reports." },
//         { status: 403 },
//       );
//     }

//     // =================================================
//     // CUSTOMER
//     // =================================================

//     const customerId = body.customerId ?? null;
//     const customerName = body.customerName ?? null;
//     const customerAddress = body.customerAddress ?? null;

//     // =================================================
//     // GENERATE NEXT SRV ID
//     // =================================================

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
//       FROM service_reports
//       WHERE id ~ '^SRV-[0-9]+$'
//     `;

//     const nextNumber = Number(
//       idRows[0]?.next_number || 1,
//     );

//     const reportId = `SRV-${String(nextNumber).padStart(3, "0")}`;
//     const now = new Date().toISOString();

//     // =================================================
//     // INSERT DRAFT
//     // =================================================

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
//         updated_at
//       )
//       VALUES (
//         ${reportId},
//         ${String(employee.id)},
//         ${String(employee.name)},
//         ${customerId},
//         ${customerName},
//         ${customerAddress},
//         ${body.templateId ?? "service-report"},
//         ${JSON.stringify(
//           body.templateSnapshot ?? {
//             id: body.templateId ?? "service-report",
//             type: "SERVICE_REPORT",
//             name: "Equipment Service & Maintenance Report",
//             sections: [],
//           },
//         )}::jsonb,
//         ${JSON.stringify(body.formData ?? {})}::jsonb,
//         ${JSON.stringify(body.evidence ?? {})}::jsonb,
//         ${JSON.stringify(body.signatures ?? {})}::jsonb,
//         'DRAFT',
//         ${now},
//         ${now}
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
//         updated_at
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
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { neon } from "@neondatabase/serverless";

const EMPLOYEE_COOKIE = "auditdesk_session";
const ADMIN_COOKIE = "auditdesk_admin_session";

// ----------------------------------------------------
// DATABASE
// ----------------------------------------------------

function getDatabase() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }

  return neon(url);
}

// ----------------------------------------------------
// AUTHENTICATION
// ----------------------------------------------------

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

// ----------------------------------------------------
// DATE HELPERS
// ----------------------------------------------------

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

  if (!match) {
    return false;
  }

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

function toIsoString(value: unknown): string {
  if (value == null) {
    return "";
  }

  const date =
    value instanceof Date ? value : new Date(String(value));

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toISOString();
}

// ----------------------------------------------------
// MAP DATABASE ROW
// ----------------------------------------------------

function mapServiceReport(row: any) {
  return {
    id: String(row.id),

    employeeId: String(row.employee_id),
    employeeName: String(row.employee_name),

    customerId:
      row.customer_id == null
        ? null
        : String(row.customer_id),

    customerName:
      row.customer_name == null
        ? null
        : String(row.customer_name),

    customerAddress:
      row.customer_address == null
        ? null
        : String(row.customer_address),

    templateId: String(row.template_id || ""),

    templateSnapshot:
      row.template_snapshot &&
      typeof row.template_snapshot === "object" &&
      !Array.isArray(row.template_snapshot)
        ? row.template_snapshot
        : {
            id: row.template_id || "service-report",
            type: "SERVICE_REPORT",
            title: "Service Report",
            sections: [],
          },

    formData:
      row.form_data &&
      typeof row.form_data === "object" &&
      !Array.isArray(row.form_data)
        ? row.form_data
        : {},

    evidence:
      row.evidence &&
      typeof row.evidence === "object" &&
      !Array.isArray(row.evidence)
        ? row.evidence
        : {},

    signatures:
      row.signatures &&
      typeof row.signatures === "object" &&
      !Array.isArray(row.signatures)
        ? row.signatures
        : {},

    status: String(row.status ?? "").toUpperCase(),

    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),

    submittedAt:
      row.submitted_at == null
        ? null
        : toIsoString(row.submitted_at),
  };
}

/* =====================================================
   GET

   Auditor:
   - Own DRAFT and COMPLETED reports.

   Admin:
   - Only COMPLETED reports with a submission timestamp.
   - Filter by submission date in Asia/Kolkata.
   - Search employee name or customer name.
   - Default date: today in Asia/Kolkata.
===================================================== */

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();

    const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
    const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

    const sql = getDatabase();

    // =================================================
    // ADMIN
    // =================================================

    if (adminToken) {
      let payload;

      try {
        const result = await jwtVerify(
          adminToken,
          getAuthSecret(),
        );

        payload = result.payload;
      } catch {
        return NextResponse.json(
          { error: "Invalid or expired admin session." },
          { status: 401 },
        );
      }

      if (payload.role !== "admin") {
        return NextResponse.json(
          { error: "Unauthorized." },
          { status: 401 },
        );
      }

      const { searchParams } = new URL(req.url);

      const requestedDate =
        searchParams.get("date")?.trim() || getTodayDate();

      const search = (searchParams.get("search") || "").trim();

      if (!isValidDate(requestedDate)) {
        return NextResponse.json(
          { error: "Invalid date. Use YYYY-MM-DD." },
          { status: 400 },
        );
      }

      const searchPattern = `%${search}%`;

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
          AND submitted_at IS NOT NULL
          AND submitted_at >= (
            ${requestedDate}::date::timestamp
            AT TIME ZONE 'Asia/Kolkata'
          )
          AND submitted_at < (
            ((${requestedDate}::date + 1)::timestamp)
            AT TIME ZONE 'Asia/Kolkata'
          )
          AND (
            ${search} = ''
            OR employee_name ILIKE ${searchPattern}
            OR COALESCE(customer_name, '') ILIKE ${searchPattern}
          )
        ORDER BY submitted_at DESC
      `;

      return NextResponse.json(rows.map(mapServiceReport));
    }

    // =================================================
    // AUDITOR
    // =================================================

    if (employeeToken) {
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

      if (payload.role !== "auditor") {
        return NextResponse.json(
          { error: "Unauthorized." },
          { status: 401 },
        );
      }

      if (!payload.id) {
        return NextResponse.json(
          { error: "Invalid employee session." },
          { status: 401 },
        );
      }

      const employeeId = String(payload.id);

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
        ORDER BY created_at DESC
      `;

      return NextResponse.json(rows.map(mapServiceReport));
    }

    // =================================================
    // NO LOGIN
    // =================================================

    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  } catch (error) {
    console.error("Read service reports error:", error);

    return NextResponse.json(
      { error: "Failed to load service reports." },
      { status: 500 },
    );
  }
}

/* =====================================================
   POST

   Only authenticated auditors can create service reports.
   New reports remain DRAFT until explicitly submitted.
===================================================== */

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

    const employeeToken =
      cookieStore.get(EMPLOYEE_COOKIE)?.value;

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

    if (payload.role !== "auditor") {
      return NextResponse.json(
        {
          error:
            "Only authenticated auditors can create service reports.",
        },
        { status: 403 },
      );
    }

    if (!payload.id || !payload.name) {
      return NextResponse.json(
        { error: "Invalid employee session." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const sql = getDatabase();

    // =================================================
    // VERIFY EMPLOYEE
    // =================================================

    const employeeRows = await sql`
      SELECT id, name, is_active, role
      FROM employees
      WHERE id = ${String(payload.id)}
      LIMIT 1
    `;

    if (employeeRows.length === 0) {
      return NextResponse.json(
        { error: "Employee not found." },
        { status: 404 },
      );
    }

    const employee = employeeRows[0];

    if (!employee.is_active) {
      return NextResponse.json(
        { error: "Your employee account is inactive." },
        { status: 403 },
      );
    }

    if (String(employee.role) !== "auditor") {
      return NextResponse.json(
        { error: "Only auditors can create service reports." },
        { status: 403 },
      );
    }

    // =================================================
    // CUSTOMER
    // =================================================

    const customerId = body.customerId ?? null;
    const customerName = body.customerName ?? null;
    const customerAddress = body.customerAddress ?? null;

    // =================================================
    // GENERATE NEXT SRV ID
    // =================================================

    const idRows = await sql`
      SELECT
        COALESCE(
          MAX(
            CAST(
              NULLIF(SUBSTRING(id FROM 5), '') AS INTEGER
            )
          ),
          0
        ) + 1 AS next_number
      FROM service_reports
      WHERE id ~ '^SRV-[0-9]+$'
    `;

    const nextNumber = Number(idRows[0]?.next_number || 1);

    const reportId =
      `SRV-${String(nextNumber).padStart(3, "0")}`;

    const now = new Date().toISOString();

    // =================================================
    // INSERT DRAFT
    // =================================================

    const rows = await sql`
      INSERT INTO service_reports (
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
      VALUES (
        ${reportId},
        ${String(employee.id)},
        ${String(employee.name)},
        ${customerId},
        ${customerName},
        ${customerAddress},
        ${body.templateId ?? "service-report"},
        ${JSON.stringify(
          body.templateSnapshot ?? {
            id: body.templateId ?? "service-report",
            type: "SERVICE_REPORT",
            name: "Equipment Service & Maintenance Report",
            sections: [],
          },
        )}::jsonb,
        ${JSON.stringify(body.formData ?? {})}::jsonb,
        ${JSON.stringify(body.evidence ?? {})}::jsonb,
        ${JSON.stringify(body.signatures ?? {})}::jsonb,
        'DRAFT',
        ${now},
        ${now},
        NULL
      )
      RETURNING
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
    `;

    return NextResponse.json(
      mapServiceReport(rows[0]),
      { status: 201 },
    );
  } catch (error) {
    console.error("Create service report error:", error);

    return NextResponse.json(
      { error: "Failed to save service report draft." },
      { status: 500 },
    );
  }
}

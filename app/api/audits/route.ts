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

// function mapAudit(row: any) {
//   return {
//     id: String(row.id),
//     employeeId: String(row.employee_id),
//     employeeName: String(row.employee_name),

//     customerId: row.customer_id == null ? null : String(row.customer_id),

//     customerName: row.customer_name == null ? null : String(row.customer_name),

//     customerAddress:
//       row.customer_address == null ? null : String(row.customer_address),

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

//     status: String(row.status).toUpperCase(),

//     score: row.score == null ? null : Number(row.score),

//     createdAt: row.created_at?.toISOString?.() || String(row.created_at),

//     updatedAt: row.updated_at?.toISOString?.() || String(row.updated_at),

//     submittedAt:
//       row.submitted_at == null
//         ? null
//         : row.submitted_at?.toISOString?.() || String(row.submitted_at),
//   };
// }

// function unauthorized(message = "Unauthorized") {
//   return NextResponse.json({ error: message }, { status: 401 });
// }

// function forbidden(message: string) {
//   return NextResponse.json({ error: message }, { status: 403 });
// }

// /**
//  * GET /api/audits
//  *
//  * ADMIN:
//  *   Returns completed audits with optional date/search filters.
//  *
//  * EMPLOYEE:
//  *   Requires active auditor account AND audit permission.
//  *   Returns only the employee's own audits.
//  */
// export async function GET(request: Request) {
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
//         const { payload } = await jwtVerify(adminToken, getAuthSecret());

//         if (!payload.id || payload.role !== "admin") {
//           return unauthorized();
//         }

//         const { searchParams } = new URL(request.url);

//         const date = searchParams.get("date")?.trim() || null;
//         const searchTerm = searchParams.get("search")?.trim() || "";

//         if (date) {
//           const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

//           if (!match) {
//             return NextResponse.json(
//               { error: "Invalid date. Use YYYY-MM-DD." },
//               { status: 400 },
//             );
//           }

//           const year = Number(match[1]);
//           const month = Number(match[2]);
//           const day = Number(match[3]);

//           const parsedDate = new Date(Date.UTC(year, month - 1, day));

//           if (
//             parsedDate.getUTCFullYear() !== year ||
//             parsedDate.getUTCMonth() !== month - 1 ||
//             parsedDate.getUTCDate() !== day
//           ) {
//             return NextResponse.json(
//               { error: "Invalid calendar date." },
//               { status: 400 },
//             );
//           }
//         }

//         const searchPattern = `%${searchTerm}%`;

//         const rows = await sql`
//           SELECT
//             id,
//             employee_id,
//             employee_name,
//             template_id,
//             template_snapshot,
//             customer_id,
//             customer_name,
//             customer_address,
//             form_data,
//             evidence,
//             signatures,
//             status,
//             score,
//             created_at,
//             updated_at,
//             submitted_at
//           FROM audits
//           WHERE UPPER(status) = 'COMPLETED'
//             AND submitted_at IS NOT NULL
//             AND (
//               ${date}::date IS NULL
//               OR (
//                 submitted_at >= (
//                   ${date}::date::timestamp
//                   AT TIME ZONE 'Asia/Kolkata'
//                 )
//                 AND submitted_at < (
//                   (${date}::date + 1)::timestamp
//                   AT TIME ZONE 'Asia/Kolkata'
//                 )
//               )
//             )
//             AND (
//               ${searchTerm} = ''
//               OR id ILIKE ${`%${searchPattern}%`}
//               OR employee_name ILIKE ${searchPattern}
//               OR customer_name ILIKE ${searchPattern}
//             )
//           ORDER BY submitted_at DESC
//         `;

//         return NextResponse.json(rows.map(mapAudit));
//       } catch (error) {
//         console.error("Admin audits GET error:", error);

//         return unauthorized("Invalid or expired admin session.");
//       }
//     }

//     // -----------------------------------------
//     // EMPLOYEE
//     // -----------------------------------------
//     if (employeeToken) {
//       let payload;

//       try {
//         const result = await jwtVerify(employeeToken, getAuthSecret());

//         payload = result.payload;
//       } catch {
//         return unauthorized("Invalid or expired employee session.");
//       }

//       if (!payload.id || payload.role !== "auditor") {
//         return unauthorized("Invalid employee session.");
//       }

//       const employeeId = String(payload.id);
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
//         return forbidden("Your employee account is inactive or unauthorized.");
//       }

//       if (employee.can_access_audit !== true) {
//         return forbidden("You do not have permission to access audit reports.");
//       }

//       const rows = await sql`
//         SELECT
//           id,
//           employee_id,
//           employee_name,
//           template_id,
//           template_snapshot,
//           customer_id,
//           customer_name,
//           customer_address,
//           form_data,
//           evidence,
//           signatures,
//           status,
//           score,
//           created_at,
//           updated_at,
//           submitted_at
//         FROM audits
//         WHERE employee_id = ${employeeId}
//         ORDER BY created_at DESC
//       `;

//       return NextResponse.json(rows.map(mapAudit));
//     }

//     return unauthorized("Authentication required.");
//   } catch (error) {
//     console.error("Read audits error:", error);

//     return NextResponse.json(
//       { error: "Failed to load audits." },
//       { status: 500 },
//     );
//   }
// }

// /**
//  * POST /api/audits
//  *
//  * Creates a draft only if the authenticated employee:
//  * - Is an active auditor.
//  * - Has can_access_audit = true.
//  */
// export async function POST(req: Request) {
//   try {
//     const cookieStore = await cookies();
//     const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

//     if (!employeeToken) {
//       return unauthorized("Authentication required.");
//     }

//     let payload;

//     try {
//       const result = await jwtVerify(employeeToken, getAuthSecret());

//       payload = result.payload;
//     } catch {
//       return unauthorized("Invalid or expired employee session.");
//     }

//     if (!payload.id || payload.role !== "auditor") {
//       return forbidden("Only authenticated auditors can create audits.");
//     }

//     const employeeId = String(payload.id);

//     const sql = getDatabase();

//     // Verify the employee's current status and permission.
//     const employeeRows = await sql`
//       SELECT
//         id,
//         name,
//         role,
//         is_active,
//         can_access_audit
//       FROM employees
//       WHERE id = ${employeeId}
//       LIMIT 1
//     `;

//     const employee = employeeRows[0];

//     if (!employee) {
//       return NextResponse.json(
//         { error: "Employee account not found." },
//         { status: 404 },
//       );
//     }

//     if (employee.is_active !== true || employee.role !== "auditor") {
//       return forbidden("Your employee account is inactive or unauthorized.");
//     }

//     if (employee.can_access_audit !== true) {
//       return forbidden("You do not have permission to create audit reports.");
//     }

//     const body = await req.json();

//     const templateId = body.templateId || "multiplex-fire-safety";

//     const templateSnapshot = body.templateSnapshot || {
//       id: templateId,
//       type: "AUDIT",
//       title: "Audit Form",
//       sections: [],
//     };

//     const customerId = body.customerId ?? null;
//     const customerName = body.customerName ?? null;
//     const customerAddress = body.customerAddress ?? null;

//     const formData = body.formData || {};
//     const evidence = body.evidence || {};
//     const signatures = body.signatures || {};

//     // Generate AUD-001, AUD-002, ...
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
//       FROM audits
//       WHERE id ~ '^AUD-[0-9]+$'
//     `;

//     const nextNumber = Number(idRows[0]?.next_number || 1);
//     const auditId = `AUD-${String(nextNumber).padStart(3, "0")}`;

//     const rows = await sql`
//       INSERT INTO audits (
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
//         updated_at
//       )
//       VALUES (
//         ${auditId},
//         ${employeeId},
//         ${String(employee.name)},
//         ${templateId},
//         ${JSON.stringify(templateSnapshot)}::jsonb,
//         ${customerId},
//         ${customerName},
//         ${customerAddress},
//         ${JSON.stringify(formData)}::jsonb,
//         ${JSON.stringify(evidence)}::jsonb,
//         ${JSON.stringify(signatures)}::jsonb,
//         'DRAFT',
//         NULL,
//         NOW(),
//         NOW()
//       )
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

//     return NextResponse.json(mapAudit(rows[0]), { status: 201 });
//   } catch (error) {
//     console.error("Create audit error:", error);

//     return NextResponse.json(
//       { error: "Failed to create audit." },
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

function mapAudit(row: any) {
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

    templateId: String(row.template_id || ""),

    templateSnapshot:
      row.template_snapshot &&
      typeof row.template_snapshot === "object" &&
      !Array.isArray(row.template_snapshot)
        ? row.template_snapshot
        : {
            id: row.template_id || "audit",
            type: "AUDIT",
            title: "Audit",
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

    status: String(row.status).toUpperCase(),

    score: row.score == null ? null : Number(row.score),

    createdAt:
      row.created_at?.toISOString?.() || String(row.created_at),

    updatedAt:
      row.updated_at?.toISOString?.() || String(row.updated_at),

    submittedAt:
      row.submitted_at == null
        ? null
        : row.submitted_at?.toISOString?.() ||
          String(row.submitted_at),
  };
}

function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

function validateDate(date: string | null) {
  if (!date) return null;

  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return "Invalid date. Use YYYY-MM-DD.";
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return "Invalid calendar date.";
  }

  return null;
}

/**
 * GET /api/audits
 *
 * ADMIN:
 * - Returns completed audits.
 * - Supports date and search filters.
 *
 * EMPLOYEE:
 * - Requires an active auditor account and audit permission.
 * - Returns only the employee's own audits.
 * - Supports SQL-based date and search filters.
 */
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();

    const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
    const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

    const sql = getDatabase();

    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date")?.trim() || null;
    const searchTerm = searchParams.get("search")?.trim() || "";

    const dateError = validateDate(date);

    if (dateError) {
      return NextResponse.json(
        { error: dateError },
        { status: 400 },
      );
    }

    const searchPattern = `%${searchTerm}%`;

    // -----------------------------------------
    // ADMIN
    // -----------------------------------------
    if (adminToken) {
      try {
        const { payload } = await jwtVerify(
          adminToken,
          getAuthSecret(),
        );

        if (!payload.id || payload.role !== "admin") {
          return unauthorized();
        }

        const rows = await sql`
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
          WHERE UPPER(status) = 'COMPLETED'
            AND submitted_at IS NOT NULL
            AND (
              ${date}::date IS NULL
              OR (
                submitted_at >= (
                  ${date}::date::timestamp
                  AT TIME ZONE 'Asia/Kolkata'
                )
                AND submitted_at < (
                  (${date}::date + 1)::timestamp
                  AT TIME ZONE 'Asia/Kolkata'
                )
              )
            )
            AND (
              ${searchTerm} = ''
              OR id ILIKE ${searchPattern}
              OR employee_name ILIKE ${searchPattern}
              OR COALESCE(customer_name, '') ILIKE ${searchPattern}
            )
          ORDER BY submitted_at DESC
        `;

        return NextResponse.json(rows.map(mapAudit));
      } catch (error) {
        console.error("Admin audits GET error:", error);

        return unauthorized("Invalid or expired admin session.");
      }
    }

    // -----------------------------------------
    // EMPLOYEE
    // -----------------------------------------
    if (employeeToken) {
      let payload;

      try {
        const result = await jwtVerify(
          employeeToken,
          getAuthSecret(),
        );

        payload = result.payload;
      } catch {
        return unauthorized("Invalid or expired employee session.");
      }

      if (!payload.id || payload.role !== "auditor") {
        return unauthorized("Invalid employee session.");
      }

      // Employee identity comes from the verified JWT,
      // never from query parameters.
      const employeeId = String(payload.id);

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
        return forbidden(
          "Your employee account is inactive or unauthorized.",
        );
      }

      if (employee.can_access_audit !== true) {
        return forbidden(
          "You do not have permission to access audit reports.",
        );
      }

      // SQL-based employee filters:
      // Search by audit ID/customer name and filter by date.
      // Employees can see only their own audits.
      // Drafts remain visible to preserve the existing workflow.
      const rows = await sql`
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
        WHERE employee_id = ${employeeId}
          AND (
            ${searchTerm} = ''
            OR id ILIKE ${searchPattern}
            OR COALESCE(customer_name, '') ILIKE ${searchPattern}
          )
          AND (
            ${date}::date IS NULL
            OR (
              COALESCE(submitted_at, created_at) >= (
                ${date}::date::timestamp
                AT TIME ZONE 'Asia/Kolkata'
              )
              AND COALESCE(submitted_at, created_at) < (
                (${date}::date + 1)::timestamp
                AT TIME ZONE 'Asia/Kolkata'
              )
            )
          )
        ORDER BY created_at DESC
      `;

      return NextResponse.json(rows.map(mapAudit));
    }

    return unauthorized("Authentication required.");
  } catch (error) {
    console.error("Read audits error:", error);

    return NextResponse.json(
      { error: "Failed to load audits." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/audits
 *
 * Creates a draft only if the authenticated employee:
 * - Is an active auditor.
 * - Has can_access_audit = true.
 */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

    if (!employeeToken) {
      return unauthorized("Authentication required.");
    }

    let payload;

    try {
      const result = await jwtVerify(
        employeeToken,
        getAuthSecret(),
      );

      payload = result.payload;
    } catch {
      return unauthorized("Invalid or expired employee session.");
    }

    if (!payload.id || payload.role !== "auditor") {
      return forbidden("Only authenticated auditors can create audits.");
    }

    const employeeId = String(payload.id);

    const sql = getDatabase();

    // Verify current employee status and permission.
    const employeeRows = await sql`
      SELECT
        id,
        name,
        role,
        is_active,
        can_access_audit
      FROM employees
      WHERE id = ${employeeId}
      LIMIT 1
    `;

    const employee = employeeRows[0];

    if (!employee) {
      return NextResponse.json(
        { error: "Employee account not found." },
        { status: 404 },
      );
    }

    if (
      employee.is_active !== true ||
      employee.role !== "auditor"
    ) {
      return forbidden(
        "Your employee account is inactive or unauthorized.",
      );
    }

    if (employee.can_access_audit !== true) {
      return forbidden(
        "You do not have permission to create audit reports.",
      );
    }

    const body = await req.json();

    const templateId =
      body.templateId || "multiplex-fire-safety";

    const templateSnapshot = body.templateSnapshot || {
      id: templateId,
      type: "AUDIT",
      title: "Audit Form",
      sections: [],
    };

    const customerId = body.customerId ?? null;
    const customerName = body.customerName ?? null;
    const customerAddress = body.customerAddress ?? null;

    const formData = body.formData || {};
    const evidence = body.evidence || {};
    const signatures = body.signatures || {};

    // Generate AUD-001, AUD-002, ...
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
      FROM audits
      WHERE id ~ '^AUD-[0-9]+$'
    `;

    const nextNumber = Number(idRows[0]?.next_number || 1);
    const auditId = `AUD-${String(nextNumber).padStart(3, "0")}`;

    const rows = await sql`
      INSERT INTO audits (
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
        updated_at
      )
      VALUES (
        ${auditId},
        ${employeeId},
        ${String(employee.name)},
        ${templateId},
        ${JSON.stringify(templateSnapshot)}::jsonb,
        ${customerId},
        ${customerName},
        ${customerAddress},
        ${JSON.stringify(formData)}::jsonb,
        ${JSON.stringify(evidence)}::jsonb,
        ${JSON.stringify(signatures)}::jsonb,
        'DRAFT',
        NULL,
        NOW(),
        NOW()
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

    return NextResponse.json(mapAudit(rows[0]), { status: 201 });
  } catch (error) {
    console.error("Create audit error:", error);

    return NextResponse.json(
      { error: "Failed to create audit." },
      { status: 500 },
    );
  }
}

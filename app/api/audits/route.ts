
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
//     score:
//       row.score === null || row.score === undefined ? null : Number(row.score),
//     createdAt: row.created_at?.toISOString?.() || String(row.created_at),
//     updatedAt: row.updated_at?.toISOString?.() || String(row.updated_at),
//   };
// }

// /**
//  * GET /api/audits
//  *
//  * ADMIN:
//  *   Returns only COMPLETED audits from all employees.
//  *
//  * AUDITOR:
//  *   Returns only audits belonging to the authenticated employee.
//  *   Both DRAFT and COMPLETED audits are returned.
//  */
// export async function GET() {
//   try {
//     const cookieStore = await cookies();

//     const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
//     const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

//     const sql = getDatabase();

//     // --------------------------------------------------
//     // ADMIN
//     // --------------------------------------------------
//     if (adminToken) {
//       try {
//         const { payload } = await jwtVerify(adminToken, getAuthSecret());

//         if (payload.role !== "admin") {
//           return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//         }

//         const rows = await sql`
//           SELECT
//             id,
//             employee_id,
//             employee_name,
//             template_id,
//             template_snapshot,
//             form_data,
//             evidence,
//             signatures,
//             status,
//             score,
//             created_at,
//             updated_at
//           FROM audits
//           WHERE UPPER(status) = 'COMPLETED'
//           ORDER BY created_at DESC
//         `;

//         return NextResponse.json(rows.map(mapAudit));
//       } catch {
//         return NextResponse.json(
//           { error: "Invalid or expired admin session." },
//           { status: 401 },
//         );
//       }
//     }

//     // --------------------------------------------------
//     // AUDITOR
//     // --------------------------------------------------
//     if (employeeToken) {
//       try {
//         const { payload } = await jwtVerify(employeeToken, getAuthSecret());

//         if (payload.role !== "auditor") {
//           return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//         }

//         if (!payload.id) {
//           return NextResponse.json(
//             { error: "Invalid employee session." },
//             { status: 401 },
//           );
//         }

//         const employeeId = String(payload.id);

//         const rows = await sql`
//           SELECT
//             id,
//             employee_id,
//             employee_name,
//             template_id,
//             template_snapshot,
//             form_data,
//             evidence,
//             signatures,
//             status,
//             score,
//             created_at,
//             updated_at
//           FROM audits
//           WHERE employee_id = ${employeeId}
//           ORDER BY created_at DESC
//         `;

//         return NextResponse.json(rows.map(mapAudit));
//       } catch {
//         return NextResponse.json(
//           { error: "Invalid or expired employee session." },
//           { status: 401 },
//         );
//       }
//     }

//     // --------------------------------------------------
//     // NO AUTHENTICATION
//     // --------------------------------------------------
//     return NextResponse.json(
//       { error: "Authentication required." },
//       { status: 401 },
//     );
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
//  * ONLY authenticated auditors can create audits.
//  *
//  * employeeId and employeeName are taken from the JWT/database.
//  * They are NOT accepted from the frontend.
//  */
// export async function POST(req: Request) {
//   try {
//     const cookieStore = await cookies();

//     const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

//     // --------------------------------------------------
//     // NO EMPLOYEE SESSION
//     // --------------------------------------------------
//     if (!employeeToken) {
//       return NextResponse.json(
//         { error: "Authentication required." },
//         { status: 401 },
//       );
//     }

//     // --------------------------------------------------
//     // VERIFY EMPLOYEE JWT
//     // --------------------------------------------------
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

//     // --------------------------------------------------
//     // ONLY AUDITORS
//     // --------------------------------------------------
//     if (payload.role !== "auditor") {
//       return NextResponse.json(
//         {
//           error: "Only authenticated auditors can create audits.",
//         },
//         { status: 403 },
//       );
//     }

//     // --------------------------------------------------
//     // VALIDATE JWT
//     // --------------------------------------------------
//     if (!payload.id || !payload.name) {
//       return NextResponse.json(
//         { error: "Invalid employee session." },
//         { status: 401 },
//       );
//     }

//     const employeeId = String(payload.id);

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

//     const sql = getDatabase();

//     // --------------------------------------------------
//     // VERIFY EMPLOYEE STILL EXISTS
//     // --------------------------------------------------
//     const employeeRows = await sql`
//       SELECT
//         id,
//         name,
//         is_active,
//         role
//       FROM employees
//       WHERE id = ${employeeId}
//       LIMIT 1
//     `;

//     if (employeeRows.length === 0) {
//       return NextResponse.json(
//         { error: "Employee account not found." },
//         { status: 404 },
//       );
//     }

//     const employee = employeeRows[0];

//     if (!employee.is_active) {
//       return NextResponse.json(
//         {
//           error: "Your employee account is inactive.",
//         },
//         { status: 403 },
//       );
//     }

//     if (String(employee.role) !== "auditor") {
//       return NextResponse.json(
//         {
//           error: "Only auditors can create audits.",
//         },
//         { status: 403 },
//       );
//     }

//     // --------------------------------------------------
//     // GENERATE AUD-001, AUD-002, ...
//     // --------------------------------------------------
//     const idRows = await sql`
//       SELECT
//         COALESCE(
//           MAX(
//             CAST(
//               NULLIF(
//                 SUBSTRING(id FROM 5),
//                 ''
//               ) AS INTEGER
//             )
//           ),
//           0
//         ) + 1 AS next_number
//       FROM audits
//       WHERE id ~ '^AUD-[0-9]+$'
//     `;

//     const nextNumber = Number(idRows[0]?.next_number || 1);

//     const auditId = `AUD-${String(nextNumber).padStart(3, "0")}`;

//     // --------------------------------------------------
//     // INSERT AUDIT
//     //
//     // employee_id and employee_name come from the
//     // authenticated session/database.
//     // They are NOT taken from body.employeeId.
//     // --------------------------------------------------
//     const rows = await sql`
// INSERT INTO audits (
//   id,
//   employee_id,
//   employee_name,
//   template_id,
//   template_snapshot,
//   customer_id,
//   customer_name,
//   customer_address,
//   form_data,
//   evidence,
//   signatures,
//   status,
//   score,
//   created_at,
//   updated_at
// )
// VALUES (
//   ${auditId},
//   ${employeeId},
//   ${String(employee.name)},
//   ${templateId},
//   ${JSON.stringify(templateSnapshot)}::jsonb,
//   ${body.customerId ?? null},
//   ${body.customerName ?? null},
//   ${body.customerAddress ?? null},
//   ${JSON.stringify(formData)}::jsonb,
//   ${JSON.stringify(evidence)}::jsonb,
//   ${JSON.stringify(signatures)}::jsonb,
//   'DRAFT',
//   NULL,
//   NOW(),
//   NOW()
// )
//      RETURNING
//   id,
//   employee_id,
//   employee_name,
//   template_id,
//   template_snapshot,
//   customer_id,
//   customer_name,
//   customer_address,
//   form_data,
//   evidence,
//   signatures,
//   status,
//   score,
//   created_at,
//   updated_at
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

    // Customer is stored in separate database columns
    customerId:
      row.customer_id === null || row.customer_id === undefined
        ? null
        : String(row.customer_id),

    customerName:
      row.customer_name === null || row.customer_name === undefined
        ? null
        : String(row.customer_name),

    customerAddress:
      row.customer_address === null || row.customer_address === undefined
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

    score:
      row.score === null || row.score === undefined
        ? null
        : Number(row.score),

    createdAt:
      row.created_at?.toISOString?.() ||
      String(row.created_at),

    updatedAt:
      row.updated_at?.toISOString?.() ||
      String(row.updated_at),
  };
}

/**
 * GET /api/audits
 *
 * ADMIN:
 *   Returns only COMPLETED audits from all employees.
 *
 * AUDITOR:
 *   Returns only audits belonging to the authenticated employee.
 *   Both DRAFT and COMPLETED audits are returned.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();

    const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
    const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

    const sql = getDatabase();

    // --------------------------------------------------
    // ADMIN
    // --------------------------------------------------
    if (adminToken) {
      try {
        const { payload } = await jwtVerify(
          adminToken,
          getAuthSecret(),
        );

        if (payload.role !== "admin") {
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
          FROM audits
          WHERE UPPER(status) = 'COMPLETED'
          ORDER BY created_at DESC
        `;

        return NextResponse.json(rows.map(mapAudit));
      } catch {
        return NextResponse.json(
          {
            error: "Invalid or expired admin session.",
          },
          { status: 401 },
        );
      }
    }

    // --------------------------------------------------
    // AUDITOR
    // --------------------------------------------------
    if (employeeToken) {
      try {
        const { payload } = await jwtVerify(
          employeeToken,
          getAuthSecret(),
        );

        if (payload.role !== "auditor") {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
          );
        }

        if (!payload.id) {
          return NextResponse.json(
            {
              error: "Invalid employee session.",
            },
            { status: 401 },
          );
        }

        const employeeId = String(payload.id);

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
            updated_at
          FROM audits
          WHERE employee_id = ${employeeId}
          ORDER BY created_at DESC
        `;

        return NextResponse.json(rows.map(mapAudit));
      } catch {
        return NextResponse.json(
          {
            error: "Invalid or expired employee session.",
          },
          { status: 401 },
        );
      }
    }

    // --------------------------------------------------
    // NO AUTHENTICATION
    // --------------------------------------------------
    return NextResponse.json(
      {
        error: "Authentication required.",
      },
      { status: 401 },
    );
  } catch (error) {
    console.error("Read audits error:", error);

    return NextResponse.json(
      {
        error: "Failed to load audits.",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/audits
 *
 * ONLY authenticated auditors can create audits.
 *
 * employeeId and employeeName are taken from the JWT/database.
 * They are NOT accepted from the frontend.
 *
 * Customer information is stored in:
 *   customer_id
 *   customer_name
 *   customer_address
 *
 * Customer information is NOT stored inside form_data.
 */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

    const employeeToken =
      cookieStore.get(EMPLOYEE_COOKIE)?.value;

    // --------------------------------------------------
    // NO EMPLOYEE SESSION
    // --------------------------------------------------
    if (!employeeToken) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        { status: 401 },
      );
    }

    // --------------------------------------------------
    // VERIFY EMPLOYEE JWT
    // --------------------------------------------------
    let payload;

    try {
      const result = await jwtVerify(
        employeeToken,
        getAuthSecret(),
      );

      payload = result.payload;
    } catch {
      return NextResponse.json(
        {
          error: "Invalid or expired employee session.",
        },
        { status: 401 },
      );
    }

    // --------------------------------------------------
    // ONLY AUDITORS
    // --------------------------------------------------
    if (payload.role !== "auditor") {
      return NextResponse.json(
        {
          error:
            "Only authenticated auditors can create audits.",
        },
        { status: 403 },
      );
    }

    // --------------------------------------------------
    // VALIDATE JWT
    // --------------------------------------------------
    if (!payload.id || !payload.name) {
      return NextResponse.json(
        {
          error: "Invalid employee session.",
        },
        { status: 401 },
      );
    }

    const employeeId = String(payload.id);

    const body = await req.json();

    // --------------------------------------------------
    // AUDIT DATA
    // --------------------------------------------------
    const templateId =
      body.templateId || "multiplex-fire-safety";

    const templateSnapshot =
      body.templateSnapshot || {
        id: templateId,
        type: "AUDIT",
        title: "Audit Form",
        sections: [],
      };

    // --------------------------------------------------
    // CUSTOMER DATA
    //
    // These are stored in separate database columns.
    // They are NOT added to formData.
    // --------------------------------------------------
    const customerId =
      body.customerId ?? null;

    const customerName =
      body.customerName ?? null;

    const customerAddress =
      body.customerAddress ?? null;

    // --------------------------------------------------
    // FORM DATA
    //
    // Customer information should NOT be placed here.
    // --------------------------------------------------
    const formData =
      body.formData || {};

    const evidence =
      body.evidence || {};

    const signatures =
      body.signatures || {};

    const sql = getDatabase();

    // --------------------------------------------------
    // VERIFY EMPLOYEE STILL EXISTS
    // --------------------------------------------------
    const employeeRows = await sql`
      SELECT
        id,
        name,
        is_active,
        role
      FROM employees
      WHERE id = ${employeeId}
      LIMIT 1
    `;

    if (employeeRows.length === 0) {
      return NextResponse.json(
        {
          error: "Employee account not found.",
        },
        { status: 404 },
      );
    }

    const employee = employeeRows[0];

    if (!employee.is_active) {
      return NextResponse.json(
        {
          error:
            "Your employee account is inactive.",
        },
        { status: 403 },
      );
    }

    if (String(employee.role) !== "auditor") {
      return NextResponse.json(
        {
          error: "Only auditors can create audits.",
        },
        { status: 403 },
      );
    }

    // --------------------------------------------------
    // GENERATE AUD-001, AUD-002, ...
    // --------------------------------------------------
    const idRows = await sql`
      SELECT
        COALESCE(
          MAX(
            CAST(
              NULLIF(
                SUBSTRING(id FROM 5),
                ''
              ) AS INTEGER
            )
          ),
          0
        ) + 1 AS next_number
      FROM audits
      WHERE id ~ '^AUD-[0-9]+$'
    `;

    const nextNumber =
      Number(idRows[0]?.next_number || 1);

    const auditId =
      `AUD-${String(nextNumber).padStart(3, "0")}`;

    // --------------------------------------------------
    // INSERT AUDIT
    //
    // employee_id and employee_name come from the
    // authenticated session/database.
    //
    // customer_id, customer_name and customer_address
    // come from the selected customer.
    //
    // Customer data is NOT stored inside form_data.
    // --------------------------------------------------
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
        updated_at
    `;

    return NextResponse.json(
      mapAudit(rows[0]),
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Create audit error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to create audit.",
      },
      { status: 500 },
    );
  }
}
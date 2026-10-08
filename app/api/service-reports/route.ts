
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

// function mapServiceReport(row: any) {
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
//             id: row.template_id || "service-report",
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

//     status: String(row.status).toUpperCase(),

//     createdAt:
//       row.created_at?.toISOString?.() ||
//       String(row.created_at),

//     updatedAt:
//       row.updated_at?.toISOString?.() ||
//       String(row.updated_at),
//   };
// }

// /* =====================================================
//    GET
//    Auditor:
//    - Own DRAFT + COMPLETED reports

//    Admin:
//    - All COMPLETED reports
// ===================================================== */

// export async function GET() {
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
//       try {
//         const { payload } = await jwtVerify(
//           adminToken,
//           getAuthSecret(),
//         );

//         if (payload.role !== "admin") {
//           return NextResponse.json(
//             { error: "Unauthorized" },
//             { status: 401 },
//           );
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
//             created_at,
//             updated_at
//           FROM service_reports
//           WHERE UPPER(status) = 'COMPLETED'
//           ORDER BY created_at DESC
//         `;

//         return NextResponse.json(
//           rows.map(mapServiceReport),
//         );
//       } catch {
//         return NextResponse.json(
//           {
//             error:
//               "Invalid or expired admin session.",
//           },
//           { status: 401 },
//         );
//       }
//     }

//     // =================================================
//     // AUDITOR
//     // =================================================

//     if (employeeToken) {
//       try {
//         const { payload } = await jwtVerify(
//           employeeToken,
//           getAuthSecret(),
//         );

//         if (payload.role !== "auditor") {
//           return NextResponse.json(
//             { error: "Unauthorized" },
//             { status: 401 },
//           );
//         }

//         if (!payload.id) {
//           return NextResponse.json(
//             {
//               error:
//                 "Invalid employee session.",
//             },
//             { status: 401 },
//           );
//         }

//         const employeeId = String(
//           payload.id,
//         );

//         // IMPORTANT:
//         // Filter in SQL itself.
//         //
//         // This means EMP001 can NEVER receive
//         // EMP003's reports from this endpoint.
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
//             created_at,
//             updated_at
//           FROM service_reports
//           WHERE employee_id = ${employeeId}
//           ORDER BY created_at DESC
//         `;

//         return NextResponse.json(
//           rows.map(mapServiceReport),
//         );
//       } catch {
//         return NextResponse.json(
//           {
//             error:
//               "Invalid or expired employee session.",
//           },
//           { status: 401 },
//         );
//       }
//     }

//     // =================================================
//     // NO LOGIN
//     // =================================================

//     return NextResponse.json(
//       {
//         error: "Authentication required.",
//       },
//       { status: 401 },
//     );
//   } catch (error) {
//     console.error(
//       "Read service reports error:",
//       error,
//     );

//     return NextResponse.json(
//       {
//         error:
//           "Failed to load service reports.",
//       },
//       { status: 500 },
//     );
//   }
// }

// /* =====================================================
//    POST
//    ONLY authenticated auditor
// ===================================================== */

// export async function POST(req: Request) {
//   try {
//     const cookieStore = await cookies();

//     const employeeToken =
//       cookieStore.get(EMPLOYEE_COOKIE)?.value;

//     if (!employeeToken) {
//       return NextResponse.json(
//         {
//           error: "Authentication required.",
//         },
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
//         {
//           error:
//             "Invalid or expired employee session.",
//         },
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
//         {
//           error:
//             "Invalid employee session.",
//         },
//         { status: 401 },
//       );
//     }

//     const body = await req.json();

//     const sql = getDatabase();

//     /*
//      * Verify that the employee still exists
//      * and is an active auditor.
//      */
//     const employeeRows = await sql`
//       SELECT
//         id,
//         name,
//         is_active,
//         role
//       FROM employees
//       WHERE id = ${String(payload.id)}
//       LIMIT 1
//     `;

//     if (employeeRows.length === 0) {
//       return NextResponse.json(
//         {
//           error: "Employee not found.",
//         },
//         { status: 404 },
//       );
//     }

//     const employee =
//       employeeRows[0];

//     if (!employee.is_active) {
//       return NextResponse.json(
//         {
//           error:
//             "Your employee account is inactive.",
//         },
//         { status: 403 },
//       );
//     }

//     if (
//       String(employee.role) !==
//       "auditor"
//     ) {
//       return NextResponse.json(
//         {
//           error:
//             "Only auditors can create service reports.",
//         },
//         { status: 403 },
//       );
//     }

//     /*
//      * Generate next SRV ID.
//      */
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
//       FROM service_reports
//       WHERE id ~ '^SRV-[0-9]+$'
//     `;

//     const nextNumber = Number(
//       idRows[0]?.next_number || 1,
//     );

//     const reportId =
//       `SRV-${String(nextNumber).padStart(3, "0")}`;

//     const now =
//       new Date().toISOString();

//     /*
//      * employee_id comes ONLY from JWT/database.
//      *
//      * Never use body.employeeId.
//      */
//     const rows = await sql`
//       INSERT INTO service_reports (
//         id,
//         employee_id,
//         employee_name,
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
//         ${body.templateId ?? "service-report"},
//         ${JSON.stringify(
//           body.templateSnapshot ?? {
//             id:
//               body.templateId ??
//               "service-report",
//             type: "SERVICE_REPORT",
//             name:
//               "Equipment Service & Maintenance Report",
//             sections: [],
//           },
//         )}::jsonb,
//         ${JSON.stringify(
//           body.formData ?? {},
//         )}::jsonb,
//         ${JSON.stringify(
//           body.evidence ?? {},
//         )}::jsonb,
//         ${JSON.stringify(
//           body.signatures ?? {},
//         )}::jsonb,
//         'DRAFT',
//         ${now},
//         ${now}
//       )
//       RETURNING
//         id,
//         employee_id,
//         employee_name,
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
//     console.error(
//       "Create service report error:",
//       error,
//     );

//     return NextResponse.json(
//       {
//         error:
//           "Failed to save service report draft.",
//       },
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

function getDatabase() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }

  return neon(url);
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

function mapServiceReport(row: any) {
  return {
    // ------------------------------------------------
    // BASIC
    // ------------------------------------------------

    id: String(row.id),

    employeeId: String(
      row.employee_id,
    ),

    employeeName: String(
      row.employee_name,
    ),

    // ------------------------------------------------
    // CUSTOMER
    // ------------------------------------------------

    customerId:
      row.customer_id === null ||
      row.customer_id === undefined
        ? null
        : String(row.customer_id),

    customerName:
      row.customer_name === null ||
      row.customer_name === undefined
        ? null
        : String(row.customer_name),

    customerAddress:
      row.customer_address === null ||
      row.customer_address === undefined
        ? null
        : String(row.customer_address),

    // ------------------------------------------------
    // TEMPLATE
    // ------------------------------------------------

    templateId: String(
      row.template_id || "",
    ),

    templateSnapshot:
      row.template_snapshot &&
      typeof row.template_snapshot ===
        "object" &&
      !Array.isArray(
        row.template_snapshot,
      )
        ? row.template_snapshot
        : {
            id:
              row.template_id ||
              "service-report",

            type: "SERVICE_REPORT",

            title: "Service Report",

            sections: [],
          },

    // ------------------------------------------------
    // FORM DATA
    // ------------------------------------------------

    formData:
      row.form_data &&
      typeof row.form_data ===
        "object" &&
      !Array.isArray(row.form_data)
        ? row.form_data
        : {},

    // ------------------------------------------------
    // EVIDENCE
    // ------------------------------------------------

    evidence:
      row.evidence &&
      typeof row.evidence ===
        "object" &&
      !Array.isArray(row.evidence)
        ? row.evidence
        : {},

    // ------------------------------------------------
    // SIGNATURES
    // ------------------------------------------------

    signatures:
      row.signatures &&
      typeof row.signatures ===
        "object" &&
      !Array.isArray(row.signatures)
        ? row.signatures
        : {},

    // ------------------------------------------------
    // STATUS
    // ------------------------------------------------

    status:
      String(row.status).toUpperCase(),

    // ------------------------------------------------
    // DATES
    // ------------------------------------------------

    createdAt:
      row.created_at?.toISOString?.() ||
      String(row.created_at),

    updatedAt:
      row.updated_at?.toISOString?.() ||
      String(row.updated_at),
  };
}

/* =====================================================
   GET

   Auditor:
   - Own DRAFT + COMPLETED reports

   Admin:
   - All COMPLETED reports
===================================================== */

export async function GET() {
  try {
    const cookieStore =
      await cookies();

    const adminToken =
      cookieStore.get(
        ADMIN_COOKIE,
      )?.value;

    const employeeToken =
      cookieStore.get(
        EMPLOYEE_COOKIE,
      )?.value;

    const sql = getDatabase();

    // =================================================
    // ADMIN
    // =================================================

    if (adminToken) {
      try {
        const { payload } =
          await jwtVerify(
            adminToken,
            getAuthSecret(),
          );

        if (
          payload.role !== "admin"
        ) {
          return NextResponse.json(
            {
              error:
                "Unauthorized",
            },
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
            updated_at

          FROM service_reports

          WHERE UPPER(status) =
            'COMPLETED'

          ORDER BY created_at DESC
        `;

        return NextResponse.json(
          rows.map(
            mapServiceReport,
          ),
        );
      } catch {
        return NextResponse.json(
          {
            error:
              "Invalid or expired admin session.",
          },
          { status: 401 },
        );
      }
    }

    // =================================================
    // AUDITOR
    // =================================================

    if (employeeToken) {
      try {
        const { payload } =
          await jwtVerify(
            employeeToken,
            getAuthSecret(),
          );

        if (
          payload.role !==
          "auditor"
        ) {
          return NextResponse.json(
            {
              error:
                "Unauthorized",
            },
            { status: 401 },
          );
        }

        if (!payload.id) {
          return NextResponse.json(
            {
              error:
                "Invalid employee session.",
            },
            { status: 401 },
          );
        }

        const employeeId =
          String(payload.id);

        // IMPORTANT:
        // Filter in SQL itself.
        //
        // This means EMP001 can NEVER
        // receive EMP003's reports
        // from this endpoint.

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
            updated_at

          FROM service_reports

          WHERE employee_id =
            ${employeeId}

          ORDER BY created_at DESC
        `;

        return NextResponse.json(
          rows.map(
            mapServiceReport,
          ),
        );
      } catch {
        return NextResponse.json(
          {
            error:
              "Invalid or expired employee session.",
          },
          { status: 401 },
        );
      }
    }

    // =================================================
    // NO LOGIN
    // =================================================

    return NextResponse.json(
      {
        error:
          "Authentication required.",
      },
      { status: 401 },
    );
  } catch (error) {
    console.error(
      "Read service reports error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load service reports.",
      },
      { status: 500 },
    );
  }
}

/* =====================================================
   POST

   ONLY authenticated auditor
===================================================== */

export async function POST(
  req: Request,
) {
  try {
    const cookieStore =
      await cookies();

    const employeeToken =
      cookieStore.get(
        EMPLOYEE_COOKIE,
      )?.value;

    if (!employeeToken) {
      return NextResponse.json(
        {
          error:
            "Authentication required.",
        },
        { status: 401 },
      );
    }

    let payload;

    try {
      const result =
        await jwtVerify(
          employeeToken,
          getAuthSecret(),
        );

      payload = result.payload;
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid or expired employee session.",
        },
        { status: 401 },
      );
    }

    if (
      payload.role !== "auditor"
    ) {
      return NextResponse.json(
        {
          error:
            "Only authenticated auditors can create service reports.",
        },
        { status: 403 },
      );
    }

    if (
      !payload.id ||
      !payload.name
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid employee session.",
        },
        { status: 401 },
      );
    }

    const body =
      await req.json();

    const sql =
      getDatabase();

    // =================================================
    // VERIFY EMPLOYEE
    // =================================================

    const employeeRows =
      await sql`
        SELECT
          id,
          name,
          is_active,
          role

        FROM employees

        WHERE id =
          ${String(payload.id)}

        LIMIT 1
      `;

    if (
      employeeRows.length ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Employee not found.",
        },
        { status: 404 },
      );
    }

    const employee =
      employeeRows[0];

    if (!employee.is_active) {
      return NextResponse.json(
        {
          error:
            "Your employee account is inactive.",
        },
        { status: 403 },
      );
    }

    if (
      String(employee.role) !==
      "auditor"
    ) {
      return NextResponse.json(
        {
          error:
            "Only auditors can create service reports.",
        },
        { status: 403 },
      );
    }

    // =================================================
    // CUSTOMER
    // =================================================

    const customerId =
      body.customerId ??
      null;

    const customerName =
      body.customerName ??
      null;

    const customerAddress =
      body.customerAddress ??
      null;

    // =================================================
    // GENERATE NEXT SRV ID
    // =================================================

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

      FROM service_reports

      WHERE id ~
        '^SRV-[0-9]+$'
    `;

    const nextNumber =
      Number(
        idRows[0]
          ?.next_number || 1,
      );

    const reportId =
      `SRV-${String(
        nextNumber,
      ).padStart(3, "0")}`;

    const now =
      new Date().toISOString();

    // =================================================
    // INSERT
    // =================================================

    /*
     * employee_id and employee_name
     * come ONLY from the authenticated
     * employee/session.
     *
     * Customer information comes from
     * the selected customer in the form.
     *
     * Customer information is stored in
     * dedicated columns, NOT formData.
     */

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
        updated_at
      )

      VALUES (
        ${reportId},

        ${String(
          employee.id,
        )},

        ${String(
          employee.name,
        )},

        ${customerId},

        ${customerName},

        ${customerAddress},

        ${body.templateId ??
        "service-report"},

        ${JSON.stringify(
          body.templateSnapshot ??
            {
              id:
                body.templateId ??
                "service-report",

              type:
                "SERVICE_REPORT",

              name:
                "Equipment Service & Maintenance Report",

              sections: [],
            },
        )}::jsonb,

        ${JSON.stringify(
          body.formData ?? {},
        )}::jsonb,

        ${JSON.stringify(
          body.evidence ?? {},
        )}::jsonb,

        ${JSON.stringify(
          body.signatures ?? {},
        )}::jsonb,

        'DRAFT',

        ${now},

        ${now}
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
        updated_at
    `;

    return NextResponse.json(
      mapServiceReport(
        rows[0],
      ),
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Create service report error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to save service report draft.",
      },
      { status: 500 },
    );
  }
}
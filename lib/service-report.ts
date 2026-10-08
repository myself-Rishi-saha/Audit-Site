

// import { neon } from "@neondatabase/serverless";
// import { cookies } from "next/headers";
// import { jwtVerify } from "jose";

// export type Evidence = {
//   id?: string;
//   reportId: string;
//   type: string;
//   url: string;
//   fileName: string;
//   capturedAt: string;
// };

// export type SignatureData = {
//   signature: string;
//   signedAt: string;
// };

// /*
//  * This is the structure of the template that was used
//  * when the service report was created.
//  *
//  * It is stored inside the report as a snapshot so that
//  * future template changes do not affect old reports.
//  */
// export type TemplateField = {
//   id: string;
//   label: string;
//   type: string;
//   required?: boolean;
//   options?: string[];
//   multiple?: boolean;
// };

// export type TemplateSection = {
//   id: string;
//   name: string;
//   fields: TemplateField[];
// };

// export type TemplateSnapshot = {
//   id: string;
//   type?: string;
//   name?: string;
//   title?: string;
//   sections: TemplateSection[];
// };

// export type ServiceReport = {
//   id: string;
//   employeeId: string;
//   employeeName: string;

//   // Which admin-created template was used
//   templateId: string;

//   /*
//    * Exact template structure used for this report.
//    *
//    * IMPORTANT:
//    * This must never be replaced when the admin later
//    * edits the main template.
//    */
//   templateSnapshot: TemplateSnapshot;

//   // ALL normal form answers are stored here
//   formData: Record<string, unknown>;

//   // Photos/videos
//   evidence: Record<string, Evidence[]>;

//   // Employee/customer signatures
//   signatures: Record<string, SignatureData>;

//   status: "DRAFT" | "COMPLETED";
//   createdAt: string;
//   updatedAt: string;
// };

// function getDatabase() {
//   const url = process.env.DATABASE_URL;

//   if (!url) {
//     throw new Error("DATABASE_URL is not configured");
//   }

//   return neon(url);
// }

// export async function readServiceReports(): Promise<ServiceReport[]> {
//   const sql = getDatabase();

//   const rows = await sql`
//     SELECT
//       id,
//       employee_id,
//       employee_name,
//       template_id,
//       template_snapshot,
//       form_data,
//       evidence,
//       signatures,
//       status,
//       created_at,
//       updated_at
//     FROM service_reports
//     ORDER BY created_at DESC
//   `;

//   return rows.map((row: any) => ({
//     id: row.id,

//     employeeId: row.employee_id,

//     employeeName: row.employee_name,

//     templateId: row.template_id || "",

//     /*
//      * Exact template used by this report.
//      */
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

//     /*
//      * Auditor's actual answers.
//      */
//     formData:
//       row.form_data &&
//       typeof row.form_data === "object" &&
//       !Array.isArray(row.form_data)
//         ? row.form_data
//         : {},

//     /*
//      * Photos/videos.
//      */
//     evidence:
//       row.evidence &&
//       typeof row.evidence === "object" &&
//       !Array.isArray(row.evidence)
//         ? row.evidence
//         : {},

//     /*
//      * Signatures.
//      */
//     signatures:
//       row.signatures &&
//       typeof row.signatures === "object" &&
//       !Array.isArray(row.signatures)
//         ? row.signatures
//         : {},

//     status: row.status,

//     createdAt: row.created_at?.toISOString?.() || String(row.created_at),

//     updatedAt: row.updated_at?.toISOString?.() || String(row.updated_at),
//   }));
// }

// export async function writeServiceReports(items: ServiceReport[]) {
//   const sql = getDatabase();

//   /*
//    * Keeps your existing API structure working:
//    *
//    * const reports = await readServiceReports();
//    * reports.push(report);
//    * await writeServiceReports(reports);
//    *
//    * For this demo, the database is synchronized
//    * with the supplied array.
//    */

//   await sql`DELETE FROM service_reports`;

//   for (const report of items) {
//     await sql`
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
//         ${report.id},
//         ${report.employeeId},
//         ${report.employeeName},
//         ${report.templateId},
//         ${JSON.stringify(report.templateSnapshot)}::jsonb,
//         ${JSON.stringify(report.formData)}::jsonb,
//         ${JSON.stringify(report.evidence)}::jsonb,
//         ${JSON.stringify(report.signatures)}::jsonb,
//         ${report.status},
//         ${report.createdAt},
//         ${report.updatedAt}
//       )
//     `;
//   }
// }

// // export async function currentUser() {
// //   const value = (await cookies())
// //     .get("auditdesk_session")
// //     ?.value;

// //   if (!value) {
// //     return {
// //       id: "EMP001",
// //       name: "S. Roy",
// //     };
// //   }

// //   try {
// //     const secret = process.env.AUTH_SECRET;

// //     if (!secret) {
// //       throw new Error(
// //         "AUTH_SECRET is not configured",
// //       );
// //     }

// //     const secretKey =
// //       new TextEncoder().encode(secret);

// //     const { payload } = await jwtVerify(
// //       value,
// //       secretKey,
// //     );

// //     return {
// //       id: String(
// //         payload.id || "EMP001",
// //       ),
// //       name: String(
// //         payload.name || "S. Roy",
// //       ),
// //     };
// //   } catch (error) {
// //     console.error(
// //       "Invalid auditdesk session:",
// //       error,
// //     );

// //     return {
// //       id: "EMP001",
// //       name: "S. Roy",
// //     };
// //   }
// // }
// export async function currentUser() {
//   const value = (await cookies()).get("auditdesk_session")?.value;

//   if (!value) {
//     throw new Error("Authentication required");
//   }

//   try {
//     const secret = process.env.AUTH_SECRET;

//     if (!secret) {
//       throw new Error("AUTH_SECRET is not configured");
//     }

//     const secretKey = new TextEncoder().encode(secret);

//     const { payload } = await jwtVerify(value, secretKey);

//     if (!payload.id || !payload.name || !payload.role) {
//       throw new Error("Invalid session payload");
//     }

//     if (String(payload.role) !== "auditor") {
//       throw new Error("Only auditors can access service reports");
//     }

//     return {
//       id: String(payload.id),
//       name: String(payload.name),
//       role: String(payload.role),
//     };
//   } catch (error) {
//     console.error("Invalid auditdesk session:", error);

//     throw new Error("Invalid or expired session");
//   }
// }
// export function nextReportId(items: ServiceReport[]) {
//   return `SRV-${String(items.length + 1).padStart(3, "0")}`;
// }

// export function nextEvidenceId(items: Evidence[]) {
//   return `EV-${String(items.length + 1).padStart(3, "0")}`;
// }

// /*
//  * Kept for compatibility with the existing
//  * Cloudinary upload route.
//  */
// export async function ensureUploadDir(_id: string) {
//   return;
// }
import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export type Evidence = {
  id?: string;
  reportId: string;
  type: string;
  url: string;
  fileName: string;
  capturedAt: string;
};

export type SignatureData = {
  signature: string;
  signedAt: string;
};

/*
 * This is the structure of the template that was used
 * when the service report was created.
 *
 * It is stored inside the report as a snapshot so that
 * future template changes do not affect old reports.
 */
export type TemplateField = {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  multiple?: boolean;
};

export type TemplateSection = {
  id: string;
  name: string;
  fields: TemplateField[];
};

export type TemplateSnapshot = {
  id: string;
  type?: string;
  name?: string;
  title?: string;
  sections: TemplateSection[];
};

export type ServiceReport = {
  id: string;
  employeeId: string;
  employeeName: string;

  // --------------------------------------------------
  // CUSTOMER
  // --------------------------------------------------

  customerId: string | null;
  customerName: string | null;
  customerAddress: string | null;

  // --------------------------------------------------
  // TEMPLATE
  // --------------------------------------------------

  templateId: string;

  /*
   * Exact template structure used for this report.
   *
   * IMPORTANT:
   * This must never be replaced when the admin later
   * edits the main template.
   */
  templateSnapshot: TemplateSnapshot;

  // --------------------------------------------------
  // FORM DATA
  // --------------------------------------------------

  // ALL normal form answers are stored here
  formData: Record<string, unknown>;

  // --------------------------------------------------
  // EVIDENCE
  // --------------------------------------------------

  // Photos/videos
  evidence: Record<string, Evidence[]>;

  // --------------------------------------------------
  // SIGNATURES
  // --------------------------------------------------

  // Employee/customer signatures
  signatures: Record<string, SignatureData>;

  // --------------------------------------------------
  // STATUS
  // --------------------------------------------------

  status: "DRAFT" | "COMPLETED";

  createdAt: string;
  updatedAt: string;
};

// ----------------------------------------------------
// DATABASE
// ----------------------------------------------------

function getDatabase() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL is not configured",
    );
  }

  return neon(url);
}

// ----------------------------------------------------
// READ SERVICE REPORTS
// ----------------------------------------------------

export async function readServiceReports(): Promise<
  ServiceReport[]
> {
  const sql = getDatabase();

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

    ORDER BY created_at DESC
  `;

  return rows.map((row: any) => ({
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
        : String(
            row.customer_address,
          ),

    // ------------------------------------------------
    // TEMPLATE
    // ------------------------------------------------

    templateId: String(
      row.template_id || "",
    ),

    /*
     * Exact template used by this report.
     */
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

    /*
     * Auditor's actual answers.
     */
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

    /*
     * Photos/videos.
     */
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

    /*
     * Signatures.
     */
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
      String(row.status).toUpperCase() as
        | "DRAFT"
        | "COMPLETED",

    // ------------------------------------------------
    // DATES
    // ------------------------------------------------

    createdAt:
      row.created_at?.toISOString?.() ||
      String(row.created_at),

    updatedAt:
      row.updated_at?.toISOString?.() ||
      String(row.updated_at),
  }));
}

// ----------------------------------------------------
// WRITE SERVICE REPORTS
// ----------------------------------------------------

export async function writeServiceReports(
  items: ServiceReport[],
) {
  const sql = getDatabase();

  /*
   * Keeps your existing API structure working:
   *
   * const reports = await readServiceReports();
   * reports.push(report);
   * await writeServiceReports(reports);
   *
   * For this demo, the database is synchronized
   * with the supplied array.
   */

  await sql`
    DELETE FROM service_reports
  `;

  for (const report of items) {
    await sql`
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
        ${report.id},
        ${report.employeeId},
        ${report.employeeName},

        ${report.customerId},
        ${report.customerName},
        ${report.customerAddress},

        ${report.templateId},

        ${JSON.stringify(
          report.templateSnapshot,
        )}::jsonb,

        ${JSON.stringify(
          report.formData,
        )}::jsonb,

        ${JSON.stringify(
          report.evidence,
        )}::jsonb,

        ${JSON.stringify(
          report.signatures,
        )}::jsonb,

        ${report.status},

        ${report.createdAt},

        ${report.updatedAt}
      )
    `;
  }
}

// ----------------------------------------------------
// CURRENT USER
// ----------------------------------------------------

export async function currentUser() {
  const value = (await cookies())
    .get("auditdesk_session")
    ?.value;

  if (!value) {
    throw new Error(
      "Authentication required",
    );
  }

  try {
    const secret =
      process.env.AUTH_SECRET;

    if (!secret) {
      throw new Error(
        "AUTH_SECRET is not configured",
      );
    }

    const secretKey =
      new TextEncoder().encode(
        secret,
      );

    const { payload } =
      await jwtVerify(
        value,
        secretKey,
      );

    if (
      !payload.id ||
      !payload.name ||
      !payload.role
    ) {
      throw new Error(
        "Invalid session payload",
      );
    }

    if (
      String(payload.role) !==
      "auditor"
    ) {
      throw new Error(
        "Only auditors can access service reports",
      );
    }

    return {
      id: String(payload.id),

      name: String(
        payload.name,
      ),

      role: String(
        payload.role,
      ),
    };
  } catch (error) {
    console.error(
      "Invalid auditdesk session:",
      error,
    );

    throw new Error(
      "Invalid or expired session",
    );
  }
}

// ----------------------------------------------------
// NEXT REPORT ID
// ----------------------------------------------------

export function nextReportId(
  items: ServiceReport[],
) {
  return `SRV-${String(
    items.length + 1,
  ).padStart(3, "0")}`;
}

// ----------------------------------------------------
// NEXT EVIDENCE ID
// ----------------------------------------------------

export function nextEvidenceId(
  items: Evidence[],
) {
  return `EV-${String(
    items.length + 1,
  ).padStart(3, "0")}`;
}

// ----------------------------------------------------
// CLOUDINARY COMPATIBILITY
// ----------------------------------------------------

/*
 * Kept for compatibility with the
 * existing Cloudinary upload route.
 */
export async function ensureUploadDir(
  _id: string,
) {
  return;
}
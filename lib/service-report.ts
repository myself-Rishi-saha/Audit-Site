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
//  * Exact template structure used when the service report
//  * was created. Stored as a snapshot so later template
//  * edits do not change existing reports.
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

//   // Customer
//   customerId: string | null;
//   customerName: string | null;
//   customerAddress: string | null;

//   // Template
//   templateId: string;
//   templateSnapshot: TemplateSnapshot;

//   // Form answers
//   formData: Record<string, unknown>;

//   // Photos/videos
//   evidence: Record<string, Evidence[]>;

//   // Employee/customer signatures
//   signatures: Record<string, SignatureData>;

//   // Status
//   status: "DRAFT" | "COMPLETED";

//   // Timestamps
//   createdAt: string;
//   updatedAt: string;
//   submittedAt?: string | null;
// };

// // ----------------------------------------------------
// // DATABASE
// // ----------------------------------------------------

// function getDatabase() {
//   const url = process.env.DATABASE_URL;

//   if (!url) {
//     throw new Error("DATABASE_URL is not configured");
//   }

//   return neon(url);
// }

// // ----------------------------------------------------
// // DATE CONVERSION
// // ----------------------------------------------------

// function toIsoString(value: unknown): string {
//   if (value == null) {
//     return "";
//   }

//   const date = value instanceof Date ? value : new Date(String(value));

//   if (Number.isNaN(date.getTime())) {
//     return String(value);
//   }

//   return date.toISOString();
// }

// // ----------------------------------------------------
// // READ SERVICE REPORTS
// // ----------------------------------------------------

// export async function readServiceReports(): Promise<ServiceReport[]> {
//   const sql = getDatabase();

//   const rows = await sql`
//     SELECT
//       id,
//       employee_id,
//       employee_name,
//       customer_id,
//       customer_name,
//       customer_address,
//       template_id,
//       template_snapshot,
//       form_data,
//       evidence,
//       signatures,
//       status,
//       created_at,
//       updated_at,
//       submitted_at
//     FROM service_reports
//     ORDER BY created_at DESC
//   `;

//   return rows.map((row: any) => ({
//     // Basic
//     id: String(row.id),
//     employeeId: String(row.employee_id),
//     employeeName: String(row.employee_name),

//     // Customer
//     customerId: row.customer_id == null ? null : String(row.customer_id),

//     customerName: row.customer_name == null ? null : String(row.customer_name),

//     customerAddress:
//       row.customer_address == null ? null : String(row.customer_address),

//     // Template
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

//     // Form data
//     formData:
//       row.form_data &&
//       typeof row.form_data === "object" &&
//       !Array.isArray(row.form_data)
//         ? row.form_data
//         : {},

//     // Evidence
//     evidence:
//       row.evidence &&
//       typeof row.evidence === "object" &&
//       !Array.isArray(row.evidence)
//         ? row.evidence
//         : {},

//     // Signatures
//     signatures:
//       row.signatures &&
//       typeof row.signatures === "object" &&
//       !Array.isArray(row.signatures)
//         ? row.signatures
//         : {},

//     // Status
//     status: String(row.status).toUpperCase() as "DRAFT" | "COMPLETED",

//     // Dates
//     createdAt: toIsoString(row.created_at),
//     updatedAt: toIsoString(row.updated_at),

//     submittedAt:
//       row.submitted_at == null ? null : toIsoString(row.submitted_at),
//   }));
// }

// // ----------------------------------------------------
// // WRITE SERVICE REPORTS
// // ----------------------------------------------------

// export async function writeServiceReports(
//   items: ServiceReport[],
// ): Promise<void> {
//   const sql = getDatabase();

//   /*
//    * Upsert by report ID instead of deleting the entire
//    * table. Existing submission timestamps are preserved
//    * when the incoming report does not contain one.
//    */

//   for (const report of items) {
//     await sql`
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
//         ${report.id},
//         ${report.employeeId},
//         ${report.employeeName},
//         ${report.customerId},
//         ${report.customerName},
//         ${report.customerAddress},
//         ${report.templateId},
//         ${JSON.stringify(report.templateSnapshot)}::jsonb,
//         ${JSON.stringify(report.formData)}::jsonb,
//         ${JSON.stringify(report.evidence)}::jsonb,
//         ${JSON.stringify(report.signatures)}::jsonb,
//         ${report.status},
//         ${report.createdAt},
//         ${report.updatedAt},
//         COALESCE(
//           ${report.submittedAt ?? null}::timestamptz,
//           CASE
//             WHEN ${report.status} = 'COMPLETED'
//               THEN NOW()
//             ELSE NULL
//           END
//         )
//       )
//       ON CONFLICT (id)
//       DO UPDATE SET
//         employee_id = EXCLUDED.employee_id,
//         employee_name = EXCLUDED.employee_name,
//         customer_id = EXCLUDED.customer_id,
//         customer_name = EXCLUDED.customer_name,
//         customer_address = EXCLUDED.customer_address,
//         template_id = EXCLUDED.template_id,
//         template_snapshot = EXCLUDED.template_snapshot,
//         form_data = EXCLUDED.form_data,
//         evidence = EXCLUDED.evidence,
//         signatures = EXCLUDED.signatures,
//         status = EXCLUDED.status,
//         updated_at = EXCLUDED.updated_at,
//         submitted_at = COALESCE(
//           EXCLUDED.submitted_at,
//           service_reports.submitted_at,
//           CASE
//             WHEN EXCLUDED.status = 'COMPLETED'
//               THEN NOW()
//             ELSE NULL
//           END
//         )
//     `;
//   }
// }

// // ----------------------------------------------------
// // CURRENT USER
// // ----------------------------------------------------

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

// // ----------------------------------------------------
// // NEXT REPORT ID
// // ----------------------------------------------------

// // export function nextReportId(items: ServiceReport[]) {
// //   return `SRV-${String(items.length + 1).padStart(3, "0")}`;
// // }
// export async function nextReportId(): Promise<string> {
//   const sql = getDatabase();

//   const rows = await sql`
//     SELECT nextval('service_report_id_seq') AS next_number
//   `;

//   const nextNumber = Number(rows[0].next_number);

//   return `SRV-${String(nextNumber).padStart(3, "0")}`;
// }
// // ----------------------------------------------------
// // NEXT EVIDENCE ID
// // ----------------------------------------------------

// export function nextEvidenceId(items: Evidence[]) {
//   return `EV-${String(items.length + 1).padStart(3, "0")}`;
// }

// // ----------------------------------------------------
// // CLOUDINARY COMPATIBILITY
// // ----------------------------------------------------

// /*
//  * Kept for compatibility with the existing upload route.
//  */
// export async function ensureUploadDir(_id: string) {
//   return;
// }
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type {
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

import { getDatabase } from "@/lib/db";

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

  customerId: string | null;
  customerName: string | null;
  customerAddress: string | null;

  templateId: string;
  templateSnapshot: TemplateSnapshot;

  formData: Record<string, unknown>;
  evidence: Record<string, Evidence[]>;
  signatures: Record<string, SignatureData>;

  status: "DRAFT" | "COMPLETED";

  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
};

interface ServiceReportRow extends RowDataPacket {
  id: string;
  employee_id: string;
  employee_name: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_address: string | null;
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

interface CounterRow extends RowDataPacket {
  next_number: number | string;
}

// ----------------------------------------------------
// JSON CONVERSION
// ----------------------------------------------------

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

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return parsed as T;
      }
    } catch {
      // Use the fallback if the database value is invalid JSON.
    }
  }

  return fallback;
}

// ----------------------------------------------------
// DATE CONVERSION
// ----------------------------------------------------

function toIsoString(value: string | Date | null | undefined): string {
  if (value == null) {
    return "";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value)
            ? `${value.replace(" ", "T")}Z`
            : value,
        );

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toISOString();
}

// ----------------------------------------------------
// ROW MAPPING
// ----------------------------------------------------

function mapServiceReport(row: ServiceReportRow): ServiceReport {
  const templateSnapshot = parseJsonObject<
    TemplateSnapshot & Record<string, unknown>
  >(row.template_snapshot, {
    id: row.template_id || "service-report",
    type: "SERVICE_REPORT",
    title: "Service Report",
    sections: [],
  });

  const formData = parseJsonObject<Record<string, unknown>>(
    row.form_data,
    {},
  );

  const evidence = parseJsonObject<Record<string, Evidence[]>>(
    row.evidence,
    {},
  );

  const signatures = parseJsonObject<
    Record<string, SignatureData>
  >(row.signatures, {});

  const normalizedStatus =
    String(row.status).toUpperCase() === "COMPLETED"
      ? "COMPLETED"
      : "DRAFT";

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
    templateSnapshot,
    formData,
    evidence,
    signatures,

    status: normalizedStatus,

    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),

    submittedAt:
      row.submitted_at == null
        ? null
        : toIsoString(row.submitted_at),
  };
}

// ----------------------------------------------------
// READ SERVICE REPORTS
// ----------------------------------------------------

export async function readServiceReports(): Promise<ServiceReport[]> {
  const db = getDatabase();

  const [rows] = await db.execute<ServiceReportRow[]>(
    `SELECT
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
     ORDER BY created_at DESC`,
  );

  return rows.map(mapServiceReport);
}

// ----------------------------------------------------
// WRITE SERVICE REPORTS
// ----------------------------------------------------

export async function writeServiceReports(
  items: ServiceReport[],
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const db = getDatabase();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const report of items) {
      await connection.execute<ResultSetHeader>(
        `INSERT INTO service_reports (
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
           ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
           ?, ?,
           CASE
             WHEN ? IS NOT NULL THEN ?
             WHEN ? = 'COMPLETED' THEN UTC_TIMESTAMP(3)
             ELSE NULL
           END
         )
         ON DUPLICATE KEY UPDATE
           employee_id = VALUES(employee_id),
           employee_name = VALUES(employee_name),
           customer_id = VALUES(customer_id),
           customer_name = VALUES(customer_name),
           customer_address = VALUES(customer_address),
           template_id = VALUES(template_id),
           template_snapshot = VALUES(template_snapshot),
           form_data = VALUES(form_data),
           evidence = VALUES(evidence),
           signatures = VALUES(signatures),
           status = VALUES(status),
           updated_at = VALUES(updated_at),
           submitted_at = COALESCE(
             VALUES(submitted_at),
             service_reports.submitted_at,
             CASE
               WHEN VALUES(status) = 'COMPLETED'
                 THEN UTC_TIMESTAMP(3)
               ELSE NULL
             END
           )`,
        [
          report.id,
          report.employeeId,
          report.employeeName,
          report.customerId,
          report.customerName,
          report.customerAddress,
          report.templateId,
          JSON.stringify(report.templateSnapshot),
          JSON.stringify(report.formData),
          JSON.stringify(report.evidence),
          JSON.stringify(report.signatures),
          report.status,
          report.createdAt,
          report.updatedAt,
          report.submittedAt ?? null,
          report.submittedAt ?? null,
          report.status,
        ],
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ----------------------------------------------------
// CURRENT USER
// ----------------------------------------------------

export async function currentUser() {
  const value = (await cookies()).get("auditdesk_session")?.value;

  if (!value) {
    throw new Error("Authentication required");
  }

  try {
    const secret = process.env.AUTH_SECRET;

    if (!secret) {
      throw new Error("AUTH_SECRET is not configured");
    }

    const { payload } = await jwtVerify(
      value,
      new TextEncoder().encode(secret),
    );

    if (!payload.id || !payload.name || !payload.role) {
      throw new Error("Invalid session payload");
    }

    if (String(payload.role) !== "auditor") {
      throw new Error("Only auditors can access service reports");
    }

    return {
      id: String(payload.id),
      name: String(payload.name),
      role: String(payload.role),
    };
  } catch (error) {
    console.error("Invalid auditdesk session:", error);
    throw new Error("Invalid or expired session");
  }
}

// ----------------------------------------------------
// NEXT SERVICE REPORT ID
// ----------------------------------------------------

export async function nextReportId(): Promise<string> {
  const db = getDatabase();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `INSERT IGNORE INTO report_id_counters
         (report_type, next_number)
       VALUES ('SRV', 1)`,
    );

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

    // Also protects against a counter that is behind existing report IDs.
    const nextNumber = Math.max(counterValue, maxExistingNumber + 1);

    if (!Number.isSafeInteger(nextNumber) || nextNumber < 1) {
      throw new Error("Invalid SRV ID counter value");
    }

    await connection.execute(
      `UPDATE report_id_counters
       SET next_number = ?
       WHERE report_type = 'SRV'`,
      [nextNumber + 1],
    );

    await connection.commit();

    return `SRV-${String(nextNumber).padStart(3, "0")}`;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ----------------------------------------------------
// NEXT EVIDENCE ID
// ----------------------------------------------------

export function nextEvidenceId(items: Evidence[]): string {
  return `EV-${String(items.length + 1).padStart(3, "0")}`;
}

// ----------------------------------------------------
// CLOUDINARY COMPATIBILITY
// ----------------------------------------------------

export async function ensureUploadDir(_id: string) {
  return;
}

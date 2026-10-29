
// import { neon } from "@neondatabase/serverless";
// import { cookies } from "next/headers";
// import { jwtVerify } from "jose";

// // ----------------------------------------------------
// // TYPES
// // ----------------------------------------------------

// export type DailyAccentEvidence = {
//   id?: string;
//   reportId: string;
//   type: string;
//   url: string;
//   fileName: string;
//   capturedAt: string;
// };

// export type DailyAccentSignatureData = {
//   signature: string;
//   signedAt: string;
// };

// export type DailyAccentTemplateField = {
//   id: string;
//   label: string;
//   type: string;
//   required?: boolean;
//   options?: string[];
//   multiple?: boolean;
// };

// export type DailyAccentTemplateSection = {
//   id: string;
//   name: string;
//   fields: DailyAccentTemplateField[];
// };

// export type DailyAccentTemplateSnapshot = {
//   id: string;
//   type?: string;
//   name?: string;
//   title?: string;
//   sections: DailyAccentTemplateSection[];
// };

// export type DailyAccentReport = {
//   id: string;
//   employeeId: string;
//   employeeName: string;

//   // Customer
//   customerId: string | null;
//   customerName: string | null;
//   customerAddress: string | null;

//   // Template snapshot
//   templateId: string;
//   templateSnapshot: DailyAccentTemplateSnapshot;

//   // Form answers
//   formData: Record<string, unknown>;

//   // Photos/videos
//   evidence: Record<string, DailyAccentEvidence[]>;

//   // Employee/customer signatures
//   signatures: Record<string, DailyAccentSignatureData>;

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

//   const date =
//     value instanceof Date
//       ? value
//       : new Date(String(value));

//   if (Number.isNaN(date.getTime())) {
//     return String(value);
//   }

//   return date.toISOString();
// }

// // ----------------------------------------------------
// // NORMALIZE DATABASE ROW
// // ----------------------------------------------------

// function mapDailyAccentReport(row: any): DailyAccentReport {
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

//     templateId: String(
//       row.template_id || "daily-accent-report",
//     ),

//     templateSnapshot:
//       row.template_snapshot &&
//       typeof row.template_snapshot === "object" &&
//       !Array.isArray(row.template_snapshot)
//         ? row.template_snapshot
//         : {
//             id: row.template_id || "daily-accent-report",
//             type: "DAILY_ACCENT_REPORT",
//             title: "Daily Accent Report",
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

//     status: String(row.status).toUpperCase() as
//       | "DRAFT"
//       | "COMPLETED",

//     createdAt: toIsoString(row.created_at),
//     updatedAt: toIsoString(row.updated_at),

//     submittedAt:
//       row.submitted_at == null
//         ? null
//         : toIsoString(row.submitted_at),
//   };
// }

// // ----------------------------------------------------
// // READ DAILY ACCENT REPORTS
// // ----------------------------------------------------

// export async function readDailyAccentReports(): Promise<
//   DailyAccentReport[]
// > {
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
//     FROM daily_accent_reports
//     ORDER BY created_at DESC
//   `;

//   return rows.map(mapDailyAccentReport);
// }

// // ----------------------------------------------------
// // WRITE DAILY ACCENT REPORTS
// // ----------------------------------------------------

// export async function writeDailyAccentReports(
//   items: DailyAccentReport[],
// ): Promise<void> {
//   const sql = getDatabase();

//   for (const report of items) {
//     await sql`
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
//           daily_accent_reports.submitted_at,
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
// // CURRENT EMPLOYEE
// // ----------------------------------------------------

// export async function currentDailyAccentReportUser() {
//   const value = (await cookies())
//     .get("auditdesk_session")
//     ?.value;

//   if (!value) {
//     throw new Error("Authentication required");
//   }

//   try {
//     const secret = process.env.AUTH_SECRET;

//     if (!secret) {
//       throw new Error("AUTH_SECRET is not configured");
//     }

//     const secretKey = new TextEncoder().encode(secret);

//     const { payload } = await jwtVerify(
//       value,
//       secretKey,
//     );

//     if (
//       !payload.id ||
//       !payload.name ||
//       String(payload.role) !== "auditor"
//     ) {
//       throw new Error("Invalid employee session");
//     }

//     return {
//       id: String(payload.id),
//       name: String(payload.name),
//       role: String(payload.role),
//     };
//   } catch (error) {
//     console.error(
//       "Invalid daily accent report session:",
//       error,
//     );

//     throw new Error("Invalid or expired session");
//   }
// }

// // ----------------------------------------------------
// // NEXT DAILY ACCENT REPORT ID
// // ----------------------------------------------------

// // export function nextDailyAccentReportId(
// //   items: DailyAccentReport[],
// // ): string {
// //   return `DAR-${String(items.length + 1).padStart(3, "0")}`;
// // }
// export async function nextDailyAccentReportId(): Promise<string> {
//   const sql = getDatabase();

//   const rows = await sql`
//     SELECT nextval('daily_accent_report_id_seq') AS next_number
//   `;

//   const nextNumber = Number(rows[0].next_number);

//   return `DAR-${String(nextNumber).padStart(3, "0")}`;
// }

// // ----------------------------------------------------
// // NEXT EVIDENCE ID
// // ----------------------------------------------------

// export function nextDailyAccentEvidenceId(
//   items: DailyAccentEvidence[],
// ): string {
//   return `EV-${String(items.length + 1).padStart(3, "0")}`;
// }

// // ----------------------------------------------------
// // CLOUDINARY COMPATIBILITY
// // ----------------------------------------------------

// export async function ensureDailyAccentUploadDir(
//   _id: string,
// ) {
//   return;
// }

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type { RowDataPacket } from "mysql2/promise";

import { getDatabase } from "@/lib/db";

// ----------------------------------------------------
// TYPES
// ----------------------------------------------------

export type DailyAccentEvidence = {
  id?: string;
  reportId: string;
  type: string;
  url: string;
  fileName: string;
  capturedAt: string;
};

export type DailyAccentSignatureData = {
  signature: string;
  signedAt: string;
};

export type DailyAccentTemplateField = {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  multiple?: boolean;
};

export type DailyAccentTemplateSection = {
  id: string;
  name: string;
  fields: DailyAccentTemplateField[];
};

export type DailyAccentTemplateSnapshot = {
  id: string;
  type?: string;
  name?: string;
  title?: string;
  sections: DailyAccentTemplateSection[];
};

export type DailyAccentReport = {
  id: string;
  employeeId: string;
  employeeName: string;
  customerId: string | null;
  customerName: string | null;
  customerAddress: string | null;
  templateId: string;
  templateSnapshot: DailyAccentTemplateSnapshot;
  formData: Record<string, unknown>;
  evidence: Record<string, DailyAccentEvidence[]>;
  signatures: Record<string, DailyAccentSignatureData>;
  status: "DRAFT" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
};

type DailyAccentReportRow = RowDataPacket & {
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

// ----------------------------------------------------
// JSON AND DATE HELPERS
// ----------------------------------------------------

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

function toIsoString(value: unknown): string {
  if (value == null) return "";

  if (value instanceof Date) {
    return value.toISOString();
  }

  const raw = String(value);
  const normalized = raw.includes("T")
    ? raw
    : `${raw.replace(" ", "T")}Z`;

  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? raw : date.toISOString();
}

/**
 * Converts a valid date into a UTC SQL DATETIME-compatible string.
 */
function toSqlDateTime(value: string | null | undefined): string | null {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid report timestamp: ${value}`);
  }

  return date.toISOString().slice(0, 23).replace("T", " ");
}

// ----------------------------------------------------
// NORMALIZE DATABASE ROW
// ----------------------------------------------------

function mapDailyAccentReport(
  row: DailyAccentReportRow,
): DailyAccentReport {
  const templateSnapshot = parseJson<DailyAccentTemplateSnapshot>(
    row.template_snapshot,
    {
      id: row.template_id || "daily-accent-report",
      type: "DAILY_ACCENT_REPORT",
      title: "Daily Accent Report",
      sections: [],
    },
  );

  const formData = parseJson<Record<string, unknown>>(
    row.form_data,
    {},
  );

  const evidence = parseJson<Record<string, DailyAccentEvidence[]>>(
    row.evidence,
    {},
  );

  const signatures = parseJson<
    Record<string, DailyAccentSignatureData>
  >(row.signatures, {});

  return {
    id: String(row.id),
    employeeId: String(row.employee_id),
    employeeName: String(row.employee_name),

    customerId:
      row.customer_id == null ? null : String(row.customer_id),

    customerName:
      row.customer_name == null ? null : String(row.customer_name),

    customerAddress:
      row.customer_address == null ? null : String(row.customer_address),

    templateId: String(row.template_id || "daily-accent-report"),
    templateSnapshot,
    formData,
    evidence,
    signatures,

    status: String(row.status).toUpperCase() as
      | "DRAFT"
      | "COMPLETED",

    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),

    submittedAt:
      row.submitted_at == null
        ? null
        : toIsoString(row.submitted_at),
  };
}

// ----------------------------------------------------
// READ DAILY ACCENT REPORTS
// ----------------------------------------------------

export async function readDailyAccentReports(): Promise<
  DailyAccentReport[]
> {
  const db = getDatabase();

  const [rows] = await db.execute<DailyAccentReportRow[]>(
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
     FROM daily_accent_reports
     ORDER BY created_at DESC`,
  );

  return rows.map(mapDailyAccentReport);
}

// ----------------------------------------------------
// WRITE DAILY ACCENT REPORTS
// ----------------------------------------------------

export async function writeDailyAccentReports(
  items: DailyAccentReport[],
): Promise<void> {
  if (items.length === 0) return;

  const db = getDatabase();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const report of items) {
      const createdAt = toSqlDateTime(report.createdAt);
      const updatedAt = toSqlDateTime(report.updatedAt);
      const submittedAt = toSqlDateTime(report.submittedAt);

      await connection.execute(
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
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
           COALESCE(
             ?,
             IF(? = 'COMPLETED', UTC_TIMESTAMP(), NULL)
           )
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
             submitted_at,
             IF(VALUES(status) = 'COMPLETED', UTC_TIMESTAMP(), NULL)
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
          createdAt,
          updatedAt,
          submittedAt,
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
// CURRENT EMPLOYEE
// ----------------------------------------------------

export async function currentDailyAccentReportUser() {
  const value = (await cookies())
    .get("auditdesk_session")
    ?.value;

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

    if (
      !payload.id ||
      !payload.name ||
      String(payload.role) !== "auditor"
    ) {
      throw new Error("Invalid employee session");
    }

    return {
      id: String(payload.id),
      name: String(payload.name),
      role: String(payload.role),
    };
  } catch (error) {
    console.error("Invalid daily accent report session:", error);
    throw new Error("Invalid or expired session");
  }
}

// ----------------------------------------------------
// NEXT DAILY ACCENT REPORT ID
// ----------------------------------------------------

export async function nextDailyAccentReportId(): Promise<string> {
  const db = getDatabase();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Ensure the counter exists. report_type must be unique or primary key.
    await connection.execute(
      `INSERT INTO report_id_counters (report_type, next_number)
       VALUES ('DAR', 1)
       ON DUPLICATE KEY UPDATE report_type = VALUES(report_type)`,
    );

    // Serialize ID allocation so concurrent requests cannot get the same ID.
    const [counterRows] = await connection.execute<CounterRow[]>(
      `SELECT next_number
       FROM report_id_counters
       WHERE report_type = 'DAR'
       FOR UPDATE`,
    );

    if (!counterRows[0]) {
      throw new Error("Daily Accent Report ID counter was not found");
    }

    const [maxRows] = await connection.execute<MaxIdRow[]>(
      `SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) AS max_number
       FROM daily_accent_reports
       WHERE id LIKE 'DAR-%'`,
    );

    const counterNumber = Number(counterRows[0].next_number);
    const maxExistingNumber = Number(maxRows[0]?.max_number ?? 0);

    // Protect against a counter that is behind existing report IDs.
    const nextNumber = Math.max(
      counterNumber,
      maxExistingNumber + 1,
    );

    await connection.execute(
      `UPDATE report_id_counters
       SET next_number = ?
       WHERE report_type = 'DAR'`,
      [nextNumber + 1],
    );

    await connection.commit();

    return `DAR-${String(nextNumber).padStart(3, "0")}`;
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

export function nextDailyAccentEvidenceId(
  items: DailyAccentEvidence[],
): string {
  return `EV-${String(items.length + 1).padStart(3, "0")}`;
}

// ----------------------------------------------------
// CLOUDINARY COMPATIBILITY
// ----------------------------------------------------

export async function ensureDailyAccentUploadDir(
  _id: string,
) {
  return;
}

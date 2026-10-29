

// import { neon } from "@neondatabase/serverless";
// import { cookies } from "next/headers";
// import { jwtVerify } from "jose";

// export type EvidenceItem = {
//   id?: string;
//   reportId?: string;
//   type: "image" | "video";
//   url: string;
//   fileName?: string;
//   capturedAt?: string;
// };

// export type SignatureData = {
//   signature: string;
//   signedAt: string;
// };

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

// export type Audit = {
//   id: string;
//   employeeId: string;
//   employeeName: string;

//   customerId: string | null;
//   customerName: string | null;
//   customerAddress: string | null;

//   templateId: string;
//   templateSnapshot: TemplateSnapshot;

//   formData: Record<string, unknown>;
//   evidence: Record<string, EvidenceItem[]>;
//   signatures: Record<string, SignatureData>;

//   status: "DRAFT" | "COMPLETED";
//   score?: number;

//   createdAt: string;
//   updatedAt: string;
//   submittedAt?: string | null;
// };

// function getDatabase() {
//   const url = process.env.DATABASE_URL;

//   if (!url) {
//     throw new Error("DATABASE_URL is not configured");
//   }

//   return neon(url);
// }

// function toIsoString(value: any): string {
//   if (value instanceof Date) {
//     return value.toISOString();
//   }

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     throw new Error("Invalid database timestamp");
//   }

//   return date.toISOString();
// }

// export async function readAudits(): Promise<Audit[]> {
//   const sql = getDatabase();

//   const rows = await sql`
//     SELECT
//       id,
//       employee_id,
//       employee_name,
//       template_id,
//       template_snapshot,
//       customer_id,
//       customer_name,
//       customer_address,
//       form_data,
//       evidence,
//       signatures,
//       status,
//       score,
//       created_at,
//       updated_at,
//       submitted_at
//     FROM audits
//     ORDER BY created_at DESC
//   `;

//   return rows.map((row: any) => ({
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

//     status: String(row.status).toUpperCase() as
//       | "DRAFT"
//       | "COMPLETED",

//     score:
//       row.score == null
//         ? undefined
//         : Number(row.score),

//     createdAt: toIsoString(row.created_at),
//     updatedAt: toIsoString(row.updated_at),

//     submittedAt:
//       row.submitted_at == null
//         ? null
//         : toIsoString(row.submitted_at),
//   }));
// }

// // export async function generateAuditId(): Promise<string> {
// //   const sql = getDatabase();

// //   const rows = await sql`
// //     SELECT
// //       COALESCE(
// //         MAX(
// //           CAST(
// //             NULLIF(SUBSTRING(id FROM 5), '') AS INTEGER
// //           )
// //         ),
// //         0
// //       ) + 1 AS next_number
// //     FROM audits
// //     WHERE id ~ '^AUD-[0-9]+$'
// //   `;

// //   const nextNumber = Number(rows[0]?.next_number || 1);

// //   return `AUD-${String(nextNumber).padStart(3, "0")}`;
// // }
// export async function generateAuditId(): Promise<string> {
//   const sql = getDatabase();

//   const rows = await sql`
//     SELECT nextval('audit_id_seq') AS next_number
//   `;

//   const nextNumber = Number(rows[0].next_number);

//   return `AUD-${String(nextNumber).padStart(3, "0")}`;
// }

// /**
//  * Insert or update only the supplied audits.
//  * This does not delete unrelated database records.
//  * Existing submission timestamps are preserved when omitted
//  * from an audit object.
//  */
// export async function writeAudits(audits: Audit[]) {
//   const sql = getDatabase();

//   for (const audit of audits) {
//     await sql`
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
//         updated_at,
//         submitted_at
//       )
//       VALUES (
//         ${audit.id},
//         ${audit.employeeId},
//         ${audit.employeeName},
//         ${audit.templateId},
//         ${JSON.stringify(audit.templateSnapshot)}::jsonb,
//         ${audit.customerId},
//         ${audit.customerName},
//         ${audit.customerAddress},
//         ${JSON.stringify(audit.formData)}::jsonb,
//         ${JSON.stringify(audit.evidence)}::jsonb,
//         ${JSON.stringify(audit.signatures)}::jsonb,
//         ${audit.status},
//         ${audit.score ?? null},
//         ${audit.createdAt},
//         ${audit.updatedAt},
//         ${audit.submittedAt ?? null}
//       )
//       ON CONFLICT (id) DO UPDATE SET
//         employee_id = EXCLUDED.employee_id,
//         employee_name = EXCLUDED.employee_name,
//         template_id = EXCLUDED.template_id,
//         template_snapshot = EXCLUDED.template_snapshot,
//         customer_id = EXCLUDED.customer_id,
//         customer_name = EXCLUDED.customer_name,
//         customer_address = EXCLUDED.customer_address,
//         form_data = EXCLUDED.form_data,
//         evidence = EXCLUDED.evidence,
//         signatures = EXCLUDED.signatures,
//         status = EXCLUDED.status,
//         score = EXCLUDED.score,
//         updated_at = EXCLUDED.updated_at,
//         submitted_at = COALESCE(
//           EXCLUDED.submitted_at,
//           audits.submitted_at
//         )
//     `;
//   }
// }

// /**
//  * Submit a draft audit directly in PostgreSQL.
//  * Only DRAFT records can be submitted by this function.
//  * The first submission timestamp is preserved.
//  */
// export async function submitAuditInDatabase(
//   id: string,
// ): Promise<{
//   submittedAt: string;
//   updatedAt: string;
// } | null> {
//   const sql = getDatabase();

//   const rows = await sql`
//     UPDATE audits
//     SET
//       status = 'COMPLETED',
//       submitted_at = COALESCE(submitted_at, NOW()),
//       updated_at = NOW()
//     WHERE id = ${id}
//       AND status = 'DRAFT'
//     RETURNING submitted_at, updated_at
//   `;

//   if (rows.length === 0) {
//     return null;
//   }

//   const row = rows[0];

//   return {
//     submittedAt: toIsoString(row.submitted_at),
//     updatedAt: toIsoString(row.updated_at),
//   };
// }

// export function scoreAudit(audit: Audit) {
//   const values = Object.values(audit.formData)
//     .map((value) => {
//       if (typeof value === "string") {
//         return value;
//       }

//       return undefined;
//     })
//     .filter(Boolean) as string[];

//   const eligible = values.filter(
//     (value) => value !== "N/A",
//   );

//   return eligible.length
//     ? Math.round(
//         (values.filter((value) => value === "PASS").length /
//           eligible.length) *
//           100,
//       )
//     : 0;
// }

// export async function getSession() {
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

//     const { payload } = await jwtVerify(value, secretKey);

//     if (!payload.id || !payload.name || !payload.role) {
//       throw new Error("Invalid session payload");
//     }

//     if (String(payload.role) !== "auditor") {
//       throw new Error("Only auditors can access audits");
//     }

//     return {
//       id: String(payload.id),
//       name: String(payload.name),
//       role: "auditor" as const,
//     };
//   } catch (error) {
//     console.error("Invalid auditdesk session:", error);

//     throw new Error("Invalid or expired session");
//   }
// }

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

import { getDatabase } from "@/lib/db";

export type EvidenceItem = {
  id?: string;
  reportId?: string;
  type: "image" | "video";
  url: string;
  fileName?: string;
  capturedAt?: string;
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

export type Audit = {
  id: string;
  employeeId: string;
  employeeName: string;

  customerId: string | null;
  customerName: string | null;
  customerAddress: string | null;

  templateId: string;
  templateSnapshot: TemplateSnapshot;

  formData: Record<string, unknown>;
  evidence: Record<string, EvidenceItem[]>;
  signatures: Record<string, SignatureData>;

  status: "DRAFT" | "COMPLETED";
  score?: number;

  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
};

type AuditRow = RowDataPacket & {
  id: string;
  employee_id: string;
  employee_name: string;
  template_id: string;
  template_snapshot: unknown;
  customer_id: string | null;
  customer_name: string | null;
  customer_address: string | null;
  form_data: unknown;
  evidence: unknown;
  signatures: unknown;
  status: string;
  score: number | string | null;
  created_at: string | Date;
  updated_at: string | Date;
  submitted_at: string | Date | null;
};

function parseJsonObject<T extends object>(
  value: unknown,
  fallback: T,
): T {
  let parsed = value;

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return fallback;
    }
  }

  if (
    parsed !== null &&
    typeof parsed === "object" &&
    !Array.isArray(parsed)
  ) {
    return parsed as T;
  }

  return fallback;
}

function toIsoString(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  // MariaDB DATETIME values commonly arrive as
  // "YYYY-MM-DD HH:mm:ss". Treat timezone-less values
  // consistently as UTC.
  const normalized =
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)
      ? `${value.replace(" ", "T")}Z`
      : value;

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid database timestamp");
  }

  return date.toISOString();
}

export async function readAudits(): Promise<Audit[]> {
  const db = getDatabase();

  const [rows] = await db.query<AuditRow[]>(`
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
    ORDER BY created_at DESC
  `);

  return rows.map((row) => ({
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

    templateSnapshot: parseJsonObject<TemplateSnapshot>(
      row.template_snapshot,
      {
        id: String(row.template_id || "audit"),
        type: "AUDIT",
        title: "Audit",
        sections: [],
      },
    ),

    formData: parseJsonObject<Record<string, unknown>>(
      row.form_data,
      {},
    ),

    evidence: parseJsonObject<Record<string, EvidenceItem[]>>(
      row.evidence,
      {},
    ),

    signatures: parseJsonObject<Record<string, SignatureData>>(
      row.signatures,
      {},
    ),

    status: String(row.status).toUpperCase() as
      | "DRAFT"
      | "COMPLETED",

    score:
      row.score == null ? undefined : Number(row.score),

    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),

    submittedAt:
      row.submitted_at == null
        ? null
        : toIsoString(row.submitted_at),
  }));
}

/**
 * Generates AUD IDs using the shared report_id_counters table.
 *
 * Expected counter row:
 * prefix = 'AUD', next_number = 1
 *
 * The row lock prevents concurrent requests from receiving
 * the same number.
 */
export async function generateAuditId(): Promise<string> {
  const db = getDatabase();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<
      (RowDataPacket & { next_number: number | string })[]
    >(
      `SELECT next_number
       FROM report_id_counters
       WHERE report_type  = ?
       FOR UPDATE`,
      ["AUD"],
    );

    if (rows.length === 0) {
      throw new Error(
        "AUD counter is missing from report_id_counters",
      );
    }

    const nextNumber = Number(rows[0].next_number);

    if (!Number.isSafeInteger(nextNumber) || nextNumber < 1) {
      throw new Error("Invalid AUD counter value");
    }

    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE report_id_counters
       SET next_number = next_number + 1
       WHERE report_type = ?`,
      ["AUD"],
    );

    if (result.affectedRows !== 1) {
      throw new Error("Failed to update AUD counter");
    }

    await connection.commit();

    return `AUD-${String(nextNumber).padStart(3, "0")}`;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Inserts or updates only the supplied audits.
 * It does not delete unrelated records.
 * An omitted/null submission timestamp does not erase
 * a previously saved submission timestamp.
 */
export async function writeAudits(audits: Audit[]): Promise<void> {
  const db = getDatabase();

  for (const audit of audits) {
    await db.execute(
      `INSERT INTO audits (
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
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        employee_id = VALUES(employee_id),
        employee_name = VALUES(employee_name),
        template_id = VALUES(template_id),
        template_snapshot = VALUES(template_snapshot),
        customer_id = VALUES(customer_id),
        customer_name = VALUES(customer_name),
        customer_address = VALUES(customer_address),
        form_data = VALUES(form_data),
        evidence = VALUES(evidence),
        signatures = VALUES(signatures),
        status = VALUES(status),
        score = VALUES(score),
        updated_at = VALUES(updated_at),
        submitted_at = COALESCE(
          VALUES(submitted_at),
          submitted_at
        )`,
      [
        audit.id,
        audit.employeeId,
        audit.employeeName,
        audit.templateId,
        JSON.stringify(audit.templateSnapshot),
        audit.customerId,
        audit.customerName,
        audit.customerAddress,
        JSON.stringify(audit.formData),
        JSON.stringify(audit.evidence),
        JSON.stringify(audit.signatures),
        audit.status,
        audit.score ?? null,
        audit.createdAt,
        audit.updatedAt,
        audit.submittedAt ?? null,
      ],
    );
  }
}

/**
 * Submits only DRAFT audits.
 * The first submission timestamp is preserved.
 */
export async function submitAuditInDatabase(
  id: string,
): Promise<{
  submittedAt: string;
  updatedAt: string;
} | null> {
  const db = getDatabase();

  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE audits
     SET
       status = 'COMPLETED',
       submitted_at = COALESCE(
         submitted_at,
         UTC_TIMESTAMP(3)
       ),
       updated_at = UTC_TIMESTAMP(3)
     WHERE id = ?
       AND status = 'DRAFT'`,
    [id],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  const [rows] = await db.query<
    (RowDataPacket & {
      submitted_at: string | Date;
      updated_at: string | Date;
    })[]
  >(
    `SELECT submitted_at, updated_at
     FROM audits
     WHERE id = ?`,
    [id],
  );

  if (!rows.length || rows[0].submitted_at == null) {
    throw new Error("Submitted audit timestamps could not be read");
  }

  return {
    submittedAt: toIsoString(rows[0].submitted_at),
    updatedAt: toIsoString(rows[0].updated_at),
  };
}

export function scoreAudit(audit: Audit): number {
  const values = Object.values(audit.formData)
    .filter((value): value is string => typeof value === "string")
    .filter(Boolean);

  const eligible = values.filter((value) => value !== "N/A");

  return eligible.length
    ? Math.round(
        (values.filter((value) => value === "PASS").length /
          eligible.length) *
          100,
      )
    : 0;
}

export async function getSession() {
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

    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(value, secretKey);

    if (!payload.id || !payload.name || !payload.role) {
      throw new Error("Invalid session payload");
    }

    if (String(payload.role) !== "auditor") {
      throw new Error("Only auditors can access audits");
    }

    return {
      id: String(payload.id),
      name: String(payload.name),
      role: "auditor" as const,
    };
  } catch (error) {
    console.error("Invalid auditdesk session:", error);
    throw new Error("Invalid or expired session");
  }
}

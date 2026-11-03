import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type {
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

import { getDatabase } from "@/lib/db";

// ----------------------------------------------------
// TYPES
// ----------------------------------------------------

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

export type HandoverCertificate = {
  id: string;
  employeeId: string;
  employeeName: string;

  // Customer
  customerId: string | null;
  customerName: string | null;
  customerAddress: string | null;

  // Template
  templateId: string;
  templateSnapshot: TemplateSnapshot;

  // Form answers
  formData: Record<string, unknown>;

  // Photos/videos
  evidence: Record<string, Evidence[]>;

  // Employee/customer signatures
  signatures: Record<string, SignatureData>;

  // Status
  status: "DRAFT" | "COMPLETED";

  // Timestamps
  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
};

// ----------------------------------------------------
// DATABASE ROW TYPES
// ----------------------------------------------------

interface HandoverCertificateRow extends RowDataPacket {
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
      // Use fallback if database JSON is invalid.
    }
  }

  return fallback;
}

// ----------------------------------------------------
// DATE CONVERSION
// ----------------------------------------------------

function toIsoString(
  value: string | Date | null | undefined,
): string {
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

function mapHandoverCertificate(
  row: HandoverCertificateRow,
): HandoverCertificate {
  const templateSnapshot = parseJsonObject<
    TemplateSnapshot & Record<string, unknown>
  >(row.template_snapshot, {
    id: row.template_id || "handover-certificate",
    type: "HANDOVER_CERTIFICATE",
    title: "Handover Certificate",
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

    // Customer
    customerId:
      row.customer_id == null ? null : String(row.customer_id),

    customerName:
      row.customer_name == null ? null : String(row.customer_name),

    customerAddress:
      row.customer_address == null
        ? null
        : String(row.customer_address),

    // Template
    templateId: String(row.template_id || "handover-certificate"),
    templateSnapshot,
    formData,
    evidence,
    signatures,

    // Status
    status: normalizedStatus,

    // Dates
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),

    submittedAt:
      row.submitted_at == null
        ? null
        : toIsoString(row.submitted_at),
  };
}

// ----------------------------------------------------
// READ HANDOVER CERTIFICATES
// ----------------------------------------------------

export async function readHandoverCertificates(): Promise<
  HandoverCertificate[]
> {
  const db = getDatabase();

  const [rows] = await db.execute<HandoverCertificateRow[]>(
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
     FROM handover_certificates
     ORDER BY created_at DESC`,
  );

  return rows.map(mapHandoverCertificate);
}

// ----------------------------------------------------
// WRITE HANDOVER CERTIFICATES
// ----------------------------------------------------

export async function writeHandoverCertificates(
  items: HandoverCertificate[],
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const db = getDatabase();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const certificate of items) {
      await connection.execute<ResultSetHeader>(
        `INSERT INTO handover_certificates (
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
             handover_certificates.submitted_at,
             CASE
               WHEN VALUES(status) = 'COMPLETED'
                 THEN UTC_TIMESTAMP(3)
               ELSE NULL
             END
           )`,
        [
          certificate.id,
          certificate.employeeId,
          certificate.employeeName,
          certificate.customerId,
          certificate.customerName,
          certificate.customerAddress,
          certificate.templateId,
          JSON.stringify(certificate.templateSnapshot),
          JSON.stringify(certificate.formData),
          JSON.stringify(certificate.evidence),
          JSON.stringify(certificate.signatures),
          certificate.status,
          certificate.createdAt,
          certificate.updatedAt,
          certificate.submittedAt ?? null,
          certificate.submittedAt ?? null,
          certificate.status,
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
      throw new Error(
        "Only auditors can access handover certificates",
      );
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
// NEXT HANDOVER CERTIFICATE ID
// ----------------------------------------------------

export async function nextHandoverCertificateId(): Promise<string> {
  const db = getDatabase();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `INSERT IGNORE INTO report_id_counters
         (report_type, next_number)
       VALUES ('HOC', 1)`,
    );

    const [counterRows] = await connection.execute<CounterRow[]>(
      `SELECT next_number
       FROM report_id_counters
       WHERE report_type = 'HOC'
       FOR UPDATE`,
    );

    if (counterRows.length === 0) {
      throw new Error("Failed to initialize HOC ID counter");
    }

    const counterValue = Number(counterRows[0].next_number);

    const [maxRows] = await connection.execute<RowDataPacket[]>(
      `SELECT COALESCE(
         MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)),
         0
       ) AS max_number
       FROM handover_certificates
       WHERE id REGEXP '^HOC-[0-9]+$'`,
    );

    const maxExistingNumber = Number(
      maxRows[0]?.max_number ?? 0,
    );

    const nextNumber = Math.max(
      counterValue,
      maxExistingNumber + 1,
    );

    if (!Number.isSafeInteger(nextNumber) || nextNumber < 1) {
      throw new Error("Invalid HOC ID counter value");
    }

    await connection.execute(
      `UPDATE report_id_counters
       SET next_number = ?
       WHERE report_type = 'HOC'`,
      [nextNumber + 1],
    );

    await connection.commit();

    return `HOC-${String(nextNumber).padStart(3, "0")}`;
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
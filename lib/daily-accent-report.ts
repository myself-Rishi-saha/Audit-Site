
import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

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

  // Customer
  customerId: string | null;
  customerName: string | null;
  customerAddress: string | null;

  // Template snapshot
  templateId: string;
  templateSnapshot: DailyAccentTemplateSnapshot;

  // Form answers
  formData: Record<string, unknown>;

  // Photos/videos
  evidence: Record<string, DailyAccentEvidence[]>;

  // Employee/customer signatures
  signatures: Record<string, DailyAccentSignatureData>;

  // Status
  status: "DRAFT" | "COMPLETED";

  // Timestamps
  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
};

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
// DATE CONVERSION
// ----------------------------------------------------

function toIsoString(value: unknown): string {
  if (value == null) {
    return "";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toISOString();
}

// ----------------------------------------------------
// NORMALIZE DATABASE ROW
// ----------------------------------------------------

function mapDailyAccentReport(row: any): DailyAccentReport {
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

    templateId: String(
      row.template_id || "daily-accent-report",
    ),

    templateSnapshot:
      row.template_snapshot &&
      typeof row.template_snapshot === "object" &&
      !Array.isArray(row.template_snapshot)
        ? row.template_snapshot
        : {
            id: row.template_id || "daily-accent-report",
            type: "DAILY_ACCENT_REPORT",
            title: "Daily Accent Report",
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
      updated_at,
      submitted_at
    FROM daily_accent_reports
    ORDER BY created_at DESC
  `;

  return rows.map(mapDailyAccentReport);
}

// ----------------------------------------------------
// WRITE DAILY ACCENT REPORTS
// ----------------------------------------------------

export async function writeDailyAccentReports(
  items: DailyAccentReport[],
): Promise<void> {
  const sql = getDatabase();

  for (const report of items) {
    await sql`
      INSERT INTO daily_accent_reports (
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
        ${report.id},
        ${report.employeeId},
        ${report.employeeName},
        ${report.customerId},
        ${report.customerName},
        ${report.customerAddress},
        ${report.templateId},
        ${JSON.stringify(report.templateSnapshot)}::jsonb,
        ${JSON.stringify(report.formData)}::jsonb,
        ${JSON.stringify(report.evidence)}::jsonb,
        ${JSON.stringify(report.signatures)}::jsonb,
        ${report.status},
        ${report.createdAt},
        ${report.updatedAt},
        COALESCE(
          ${report.submittedAt ?? null}::timestamptz,
          CASE
            WHEN ${report.status} = 'COMPLETED'
              THEN NOW()
            ELSE NULL
          END
        )
      )
      ON CONFLICT (id)
      DO UPDATE SET
        employee_id = EXCLUDED.employee_id,
        employee_name = EXCLUDED.employee_name,
        customer_id = EXCLUDED.customer_id,
        customer_name = EXCLUDED.customer_name,
        customer_address = EXCLUDED.customer_address,
        template_id = EXCLUDED.template_id,
        template_snapshot = EXCLUDED.template_snapshot,
        form_data = EXCLUDED.form_data,
        evidence = EXCLUDED.evidence,
        signatures = EXCLUDED.signatures,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at,
        submitted_at = COALESCE(
          EXCLUDED.submitted_at,
          daily_accent_reports.submitted_at,
          CASE
            WHEN EXCLUDED.status = 'COMPLETED'
              THEN NOW()
            ELSE NULL
          END
        )
    `;
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

    const secretKey = new TextEncoder().encode(secret);

    const { payload } = await jwtVerify(
      value,
      secretKey,
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
    console.error(
      "Invalid daily accent report session:",
      error,
    );

    throw new Error("Invalid or expired session");
  }
}

// ----------------------------------------------------
// NEXT DAILY ACCENT REPORT ID
// ----------------------------------------------------

export function nextDailyAccentReportId(
  items: DailyAccentReport[],
): string {
  return `DAR-${String(items.length + 1).padStart(3, "0")}`;
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

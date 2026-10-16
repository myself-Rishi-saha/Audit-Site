

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
 * Exact template structure used when the service report
 * was created. Stored as a snapshot so later template
 * edits do not change existing reports.
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

  const date = value instanceof Date
    ? value
    : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toISOString();
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
      updated_at,
      submitted_at
    FROM service_reports
    ORDER BY created_at DESC
  `;

  return rows.map((row: any) => ({
    // Basic
    id: String(row.id),
    employeeId: String(row.employee_id),
    employeeName: String(row.employee_name),

    // Customer
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

    // Template
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

    // Form data
    formData:
      row.form_data &&
      typeof row.form_data === "object" &&
      !Array.isArray(row.form_data)
        ? row.form_data
        : {},

    // Evidence
    evidence:
      row.evidence &&
      typeof row.evidence === "object" &&
      !Array.isArray(row.evidence)
        ? row.evidence
        : {},

    // Signatures
    signatures:
      row.signatures &&
      typeof row.signatures === "object" &&
      !Array.isArray(row.signatures)
        ? row.signatures
        : {},

    // Status
    status: String(row.status).toUpperCase() as
      | "DRAFT"
      | "COMPLETED",

    // Dates
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),

    submittedAt:
      row.submitted_at == null
        ? null
        : toIsoString(row.submitted_at),
  }));
}

// ----------------------------------------------------
// WRITE SERVICE REPORTS
// ----------------------------------------------------

export async function writeServiceReports(
  items: ServiceReport[],
): Promise<void> {
  const sql = getDatabase();

  /*
   * Upsert by report ID instead of deleting the entire
   * table. Existing submission timestamps are preserved
   * when the incoming report does not contain one.
   */

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
          service_reports.submitted_at,
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
// CURRENT USER
// ----------------------------------------------------

export async function currentUser() {
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
      throw new Error(
        "Only auditors can access service reports",
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
// NEXT REPORT ID
// ----------------------------------------------------

export function nextReportId(items: ServiceReport[]) {
  return `SRV-${String(items.length + 1).padStart(3, "0")}`;
}

// ----------------------------------------------------
// NEXT EVIDENCE ID
// ----------------------------------------------------

export function nextEvidenceId(items: Evidence[]) {
  return `EV-${String(items.length + 1).padStart(3, "0")}`;
}

// ----------------------------------------------------
// CLOUDINARY COMPATIBILITY
// ----------------------------------------------------

/*
 * Kept for compatibility with the existing upload route.
 */
export async function ensureUploadDir(_id: string) {
  return;
}

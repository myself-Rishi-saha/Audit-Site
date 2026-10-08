

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
// };

// function getDatabase() {
//   const url = process.env.DATABASE_URL;

//   if (!url) {
//     throw new Error("DATABASE_URL is not configured");
//   }

//   return neon(url);
// }

// export async function readAudits(): Promise<Audit[]> {
//   const sql = getDatabase();

//   // const rows = await sql`
//   //   SELECT
//   //     id,
//   //     employee_id,
//   //     employee_name,
//   //     template_id,
//   //     template_snapshot,
//   //     form_data,
//   //     evidence,
//   //     signatures,
//   //     status,
//   //     score,
//   //     created_at,
//   //     updated_at
//   //   FROM audits
//   //   ORDER BY created_at DESC
//   // `;
//   const rows = await sql`
//   SELECT
//     id,
//     employee_id,
//     employee_name,
//     template_id,
//     template_snapshot,
//     customer_id,
//     customer_name,
//     customer_address,
//     form_data,
//     evidence,
//     signatures,
//     status,
//     score,
//     created_at,
//     updated_at
//   FROM audits
//   ORDER BY created_at DESC
// `;
//   return rows.map((row: any) => ({
//     id: row.id,

//     employeeId: row.employee_id,
//     employeeName: row.employee_name,
//     customerId: row.customer_id ? String(row.customer_id) : null,

//     customerName: row.customer_name ? String(row.customer_name) : null,

//     customerAddress: row.customer_address ? String(row.customer_address) : null,
//     templateId: row.template_id || "",

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

//     status: row.status,

//     score:
//       row.score === null || row.score === undefined
//         ? undefined
//         : Number(row.score),

//     createdAt: row.created_at?.toISOString?.() || String(row.created_at),

//     updatedAt: row.updated_at?.toISOString?.() || String(row.updated_at),
//   }));
// }

// export async function generateAuditId(): Promise<string> {
//   const sql = getDatabase();

//   const rows = await sql`
//     SELECT
//       COALESCE(
//         MAX(
//           CAST(
//             NULLIF(SUBSTRING(id FROM 5), '') AS INTEGER
//           )
//         ),
//         0
//       ) + 1 AS next_number
//     FROM audits
//     WHERE id ~ '^AUD-[0-9]+$'
//   `;

//   const nextNumber = Number(rows[0]?.next_number || 1);

//   return `AUD-${String(nextNumber).padStart(3, "0")}`;
// }

// export async function writeAudits(audits: Audit[]) {
//   const sql = getDatabase();

//   await sql`DELETE FROM audits`;

//   for (const audit of audits) {
//     await sql`
//       INSERT INTO audits (
//         id,
//         employee_id,
//         employee_name,
//         template_id,
//         template_snapshot,
//         form_data,
//         evidence,
//         signatures,
//         status,
//         score,
//         created_at,
//         updated_at
//       )
//       VALUES (
//         ${audit.id},
//         ${audit.employeeId},
//         ${audit.employeeName},
//         ${audit.templateId},
//         ${JSON.stringify(audit.templateSnapshot)}::jsonb,
//         ${JSON.stringify(audit.formData)}::jsonb,
//         ${JSON.stringify(audit.evidence)}::jsonb,
//         ${JSON.stringify(audit.signatures)}::jsonb,
//         ${audit.status},
//         ${audit.score ?? null},
//         ${audit.createdAt},
//         ${audit.updatedAt}
//       )
//     `;
//   }
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

//   const eligible = values.filter((value) => value !== "N/A");

//   return eligible.length
//     ? Math.round(
//         (values.filter((value) => value === "PASS").length / eligible.length) *
//           100,
//       )
//     : 0;
// }

// export async function getSession() {
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
import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

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

  // Customer information is stored in separate database columns.
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
};

function getDatabase() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }

  return neon(url);
}

export async function readAudits(): Promise<Audit[]> {
  const sql = getDatabase();

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
    ORDER BY created_at DESC
  `;

  return rows.map((row: any) => ({
    id: String(row.id),

    employeeId: String(row.employee_id),
    employeeName: String(row.employee_name),

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

    status: String(row.status).toUpperCase() as
      | "DRAFT"
      | "COMPLETED",

    score:
      row.score === null ||
      row.score === undefined
        ? undefined
        : Number(row.score),

    createdAt:
      row.created_at?.toISOString?.() ||
      String(row.created_at),

    updatedAt:
      row.updated_at?.toISOString?.() ||
      String(row.updated_at),
  }));
}

export async function generateAuditId(): Promise<string> {
  const sql = getDatabase();

  const rows = await sql`
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
    Number(rows[0]?.next_number || 1);

  return `AUD-${String(nextNumber).padStart(3, "0")}`;
}

export async function writeAudits(audits: Audit[]) {
  const sql = getDatabase();

  await sql`DELETE FROM audits`;

  for (const audit of audits) {
    await sql`
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
        ${audit.id},
        ${audit.employeeId},
        ${audit.employeeName},
        ${audit.templateId},
        ${JSON.stringify(audit.templateSnapshot)}::jsonb,

        ${audit.customerId},
        ${audit.customerName},
        ${audit.customerAddress},

        ${JSON.stringify(audit.formData)}::jsonb,
        ${JSON.stringify(audit.evidence)}::jsonb,
        ${JSON.stringify(audit.signatures)}::jsonb,
        ${audit.status},
        ${audit.score ?? null},
        ${audit.createdAt},
        ${audit.updatedAt}
      )
    `;
  }
}

export function scoreAudit(audit: Audit) {
  const values = Object.values(audit.formData)
    .map((value) => {
      if (typeof value === "string") {
        return value;
      }

      return undefined;
    })
    .filter(Boolean) as string[];

  const eligible = values.filter(
    (value) => value !== "N/A",
  );

  return eligible.length
    ? Math.round(
        (values.filter(
          (value) => value === "PASS",
        ).length /
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
      throw new Error(
        "AUTH_SECRET is not configured",
      );
    }

    const secretKey =
      new TextEncoder().encode(secret);

    const { payload } = await jwtVerify(
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
      String(payload.role) !== "auditor"
    ) {
      throw new Error(
        "Only auditors can access audits",
      );
    }

    return {
      id: String(payload.id),
      name: String(payload.name),
      role: "auditor" as const,
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
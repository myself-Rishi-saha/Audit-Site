
// import { neon } from "@neondatabase/serverless";

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

// export type FormTemplate = {
//   id: string;
//   type: string;
//   name: string;
//   title?: string;
//   sections: TemplateSection[];
//   updatedAt?: string;
// };

// function getDatabase() {
//   const url = process.env.DATABASE_URL;

//   if (!url) {
//     throw new Error("DATABASE_URL is not configured");
//   }

//   return neon(url);
// }

// function mapTemplate(row: Record<string, any>): FormTemplate {
//   return {
//     id: String(row.id),
//     type: String(row.type),
//     name: String(row.name),
//     title: row.title == null ? undefined : String(row.title),
//     sections: Array.isArray(row.sections) ? row.sections : [],
//     updatedAt:
//       row.updated_at?.toISOString?.() ??
//       (row.updated_at ? String(row.updated_at) : undefined),
//   };
// }

// /**
//  * Retrieve a template by its ID.
//  * Example: getTemplate("service-report")
//  */
// export async function getTemplate(
//   id: string,
// ): Promise<FormTemplate | null> {
//   const sql = getDatabase();

//   const rows = await sql`
//     SELECT id, type, name, title, sections, updated_at
//     FROM form_templates
//     WHERE id = ${id}
//     LIMIT 1
//   `;

//   if (rows.length === 0) {
//     return null;
//   }

//   return mapTemplate(rows[0] as Record<string, any>);
// }

// /**
//  * Retrieve all templates.
//  */
// export async function getTemplates(): Promise<FormTemplate[]> {
//   const sql = getDatabase();

//   const rows = await sql`
//     SELECT id, type, name, title, sections, updated_at
//     FROM form_templates
//     ORDER BY name ASC
//   `;

//   return rows.map((row) =>
//     mapTemplate(row as Record<string, any>),
//   );
// }

// /**
//  * Create a template or update an existing template.
//  * Sections are stored as PostgreSQL JSONB.
//  */
// export async function saveTemplate(
//   template: FormTemplate,
// ): Promise<FormTemplate> {
//   if (
//     !template.id?.trim() ||
//     !template.type?.trim() ||
//     !template.name?.trim() ||
//     !Array.isArray(template.sections)
//   ) {
//     throw new Error("Invalid template data");
//   }

//   const sql = getDatabase();

//   const rows = await sql`
//     INSERT INTO form_templates (
//       id,
//       type,
//       name,
//       title,
//       sections,
//       updated_at
//     )
//     VALUES (
//       ${template.id},
//       ${template.type},
//       ${template.name},
//       ${template.title ?? null},
//       ${JSON.stringify(template.sections)}::jsonb,
//       NOW()
//     )
//     ON CONFLICT (id)
//     DO UPDATE SET
//       type = EXCLUDED.type,
//       name = EXCLUDED.name,
//       title = EXCLUDED.title,
//       sections = EXCLUDED.sections,
//       updated_at = NOW()
//     RETURNING id, type, name, title, sections, updated_at
//   `;

//   return mapTemplate(rows[0] as Record<string, any>);
// }

// /**
//  * Update an existing template without creating a new one.
//  * Returns null when the template does not exist.
//  */
// export async function updateTemplate(
//   template: FormTemplate,
// ): Promise<FormTemplate | null> {
//   if (
//     !template.id?.trim() ||
//     !template.type?.trim() ||
//     !template.name?.trim() ||
//     !Array.isArray(template.sections)
//   ) {
//     throw new Error("Invalid template data");
//   }

//   const sql = getDatabase();

//   const rows = await sql`
//     UPDATE form_templates
//     SET
//       type = ${template.type},
//       name = ${template.name},
//       title = ${template.title ?? null},
//       sections = ${JSON.stringify(template.sections)}::jsonb,
//       updated_at = NOW()
//     WHERE id = ${template.id}
//     RETURNING id, type, name, title, sections, updated_at
//   `;

//   if (rows.length === 0) {
//     return null;
//   }

//   return mapTemplate(rows[0] as Record<string, any>);
// }
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getDatabase } from "@/lib/db";

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

export type FormTemplate = {
  id: string;
  type: string;
  name: string;
  title?: string;
  sections: TemplateSection[];
  updatedAt?: string;
};

type TemplateRow = RowDataPacket & {
  id: string;
  type: string;
  name: string;
  title: string | null;
  sections: unknown;
  updated_at: string | Date | null;
};

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) {
    return fallback;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  if (Buffer.isBuffer(value)) {
    try {
      return JSON.parse(value.toString("utf8")) as T;
    } catch {
      return fallback;
    }
  }

  return value as T;
}

function formatDate(value: string | Date | null): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  // MariaDB may return DATETIME as a string when dateStrings is enabled.
  // Keep the database value intact rather than interpreting it in local time.
  return value.replace(" ", "T");
}

function mapTemplate(row: TemplateRow): FormTemplate {
  return {
    id: String(row.id),
    type: String(row.type),
    name: String(row.name),
    title: row.title == null ? undefined : String(row.title),
    sections: parseJson<TemplateSection[]>(row.sections, []),
    updatedAt: formatDate(row.updated_at),
  };
}

function validateTemplate(template: FormTemplate): void {
  if (
    !template.id?.trim() ||
    !template.type?.trim() ||
    !template.name?.trim() ||
    !Array.isArray(template.sections)
  ) {
    throw new Error("Invalid template data");
  }
}

/**
 * Retrieve a template by ID.
 */
export async function getTemplate(
  id: string,
): Promise<FormTemplate | null> {
  const db = getDatabase();

  const [rows] = await db.execute<TemplateRow[]>(
    `SELECT id, type, name, title, sections, updated_at
     FROM form_templates
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  if (rows.length === 0) {
    return null;
  }

  return mapTemplate(rows[0]);
}

/**
 * Retrieve all templates.
 */
export async function getTemplates(): Promise<FormTemplate[]> {
  const db = getDatabase();

  const [rows] = await db.execute<TemplateRow[]>(
    `SELECT id, type, name, title, sections, updated_at
     FROM form_templates
     ORDER BY name ASC`,
  );

  return rows.map(mapTemplate);
}

/**
 * Create a template or update an existing template.
 * The sections column stores JSON in MariaDB.
 */
export async function saveTemplate(
  template: FormTemplate,
): Promise<FormTemplate> {
  validateTemplate(template);

  const db = getDatabase();

  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO form_templates (
       id,
       type,
       name,
       title,
       sections,
       updated_at
     )
     VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(3))
     ON DUPLICATE KEY UPDATE
       type = VALUES(type),
       name = VALUES(name),
       title = VALUES(title),
       sections = VALUES(sections),
       updated_at = UTC_TIMESTAMP(3)`,
    [
      template.id,
      template.type,
      template.name,
      template.title ?? null,
      JSON.stringify(template.sections),
    ],
  );

  // Read back the saved record, including its database timestamp.
  const saved = await getTemplate(template.id);

  if (!saved) {
    throw new Error(
      `Template ${template.id} could not be retrieved after saving`,
    );
  }

  return saved;
}

/**
 * Update an existing template without creating a new one.
 * Returns null if the template does not exist.
 */
export async function updateTemplate(
  template: FormTemplate,
): Promise<FormTemplate | null> {
  validateTemplate(template);

  const db = getDatabase();

  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE form_templates
     SET
       type = ?,
       name = ?,
       title = ?,
       sections = ?,
       updated_at = UTC_TIMESTAMP(3)
     WHERE id = ?`,
    [
      template.type,
      template.name,
      template.title ?? null,
      JSON.stringify(template.sections),
      template.id,
    ],
  );

  // affectedRows can be zero if the values were unchanged.
  // Check existence separately so unchanged templates aren't mistaken
  // for missing templates.
  const saved = await getTemplate(template.id);

  if (!saved) {
    return null;
  }

  return saved;
}
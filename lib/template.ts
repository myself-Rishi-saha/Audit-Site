
import { neon } from "@neondatabase/serverless";

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

function getDatabase() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }

  return neon(url);
}

function mapTemplate(row: Record<string, any>): FormTemplate {
  return {
    id: String(row.id),
    type: String(row.type),
    name: String(row.name),
    title: row.title == null ? undefined : String(row.title),
    sections: Array.isArray(row.sections) ? row.sections : [],
    updatedAt:
      row.updated_at?.toISOString?.() ??
      (row.updated_at ? String(row.updated_at) : undefined),
  };
}

/**
 * Retrieve a template by its ID.
 * Example: getTemplate("service-report")
 */
export async function getTemplate(
  id: string,
): Promise<FormTemplate | null> {
  const sql = getDatabase();

  const rows = await sql`
    SELECT id, type, name, title, sections, updated_at
    FROM form_templates
    WHERE id = ${id}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return null;
  }

  return mapTemplate(rows[0] as Record<string, any>);
}

/**
 * Retrieve all templates.
 */
export async function getTemplates(): Promise<FormTemplate[]> {
  const sql = getDatabase();

  const rows = await sql`
    SELECT id, type, name, title, sections, updated_at
    FROM form_templates
    ORDER BY name ASC
  `;

  return rows.map((row) =>
    mapTemplate(row as Record<string, any>),
  );
}

/**
 * Create a template or update an existing template.
 * Sections are stored as PostgreSQL JSONB.
 */
export async function saveTemplate(
  template: FormTemplate,
): Promise<FormTemplate> {
  if (
    !template.id?.trim() ||
    !template.type?.trim() ||
    !template.name?.trim() ||
    !Array.isArray(template.sections)
  ) {
    throw new Error("Invalid template data");
  }

  const sql = getDatabase();

  const rows = await sql`
    INSERT INTO form_templates (
      id,
      type,
      name,
      title,
      sections,
      updated_at
    )
    VALUES (
      ${template.id},
      ${template.type},
      ${template.name},
      ${template.title ?? null},
      ${JSON.stringify(template.sections)}::jsonb,
      NOW()
    )
    ON CONFLICT (id)
    DO UPDATE SET
      type = EXCLUDED.type,
      name = EXCLUDED.name,
      title = EXCLUDED.title,
      sections = EXCLUDED.sections,
      updated_at = NOW()
    RETURNING id, type, name, title, sections, updated_at
  `;

  return mapTemplate(rows[0] as Record<string, any>);
}

/**
 * Update an existing template without creating a new one.
 * Returns null when the template does not exist.
 */
export async function updateTemplate(
  template: FormTemplate,
): Promise<FormTemplate | null> {
  if (
    !template.id?.trim() ||
    !template.type?.trim() ||
    !template.name?.trim() ||
    !Array.isArray(template.sections)
  ) {
    throw new Error("Invalid template data");
  }

  const sql = getDatabase();

  const rows = await sql`
    UPDATE form_templates
    SET
      type = ${template.type},
      name = ${template.name},
      title = ${template.title ?? null},
      sections = ${JSON.stringify(template.sections)}::jsonb,
      updated_at = NOW()
    WHERE id = ${template.id}
    RETURNING id, type, name, title, sections, updated_at
  `;

  if (rows.length === 0) {
    return null;
  }

  return mapTemplate(rows[0] as Record<string, any>);
}

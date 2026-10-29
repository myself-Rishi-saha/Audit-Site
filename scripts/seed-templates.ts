
import { neon } from "@neondatabase/serverless";
import { loadEnvConfig } from "@next/env";
import fs from "node:fs";
import path from "node:path";

loadEnvConfig(process.cwd());

type Template = {
  id: string;
  type: string;
  name: string;
  title?: string;
  sections: unknown[];
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing from your environment");
  }

  const filePath = path.join(
    process.cwd(),
    "data",
    "templates.json"
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Template JSON file not found: ${filePath}`);
  }

  const templates = JSON.parse(
    fs.readFileSync(filePath, "utf8")
  ) as Template[];

  // Select ONLY the new template.
  const template = templates.find(
    (item) => item.id === "daily-accent-report"
  );

  if (!template) {
    throw new Error(
      'Template "daily-accent-report" was not found in data/templates.json'
    );
  }

  if (
    !template.type ||
    !template.name ||
    !Array.isArray(template.sections)
  ) {
    throw new Error("Daily Accent Report template data is invalid");
  }

  const sql = neon(databaseUrl);

  // Insert only if it does not already exist.
  // Existing templates and existing Daily Accent Report data remain unchanged.
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
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  `;

  if (rows.length > 0) {
    console.log("Inserted new template:", template.id);
  } else {
    console.log(
      "Daily Accent Report already exists. Nothing was changed."
    );
  }
}

main().catch((error) => {
  console.error("Template seeding failed:", error);
  process.exitCode = 1;
});

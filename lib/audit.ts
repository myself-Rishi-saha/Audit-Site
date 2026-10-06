// import fs from "node:fs/promises";
// import path from "node:path";
// export type Answer = { status?: "PASS" | "FAIL" | "N/A"; remarks?: string };
// export type Audit = {
//   id: string;
//   employeeId: string;
//   employeeName: string;
//   customer: string;
//   location: string;
//   date: string;
//   status: string;
//   score?: number;
//   templateId: string;
//   answers: Record<string, Answer>;
// };
// const file = path.join(process.cwd(), "data/audits.json");
// export async function readAudits(): Promise<Audit[]> {
//   return JSON.parse(await fs.readFile(file, "utf8"));
// }
// export async function writeAudits(audits: Audit[]) {
//   await fs.writeFile(file, JSON.stringify(audits, null, 2));
// }
// export function scoreAudit(audit: Audit) {
//   const values = Object.values(audit.answers)
//     .map((a) => a.status)
//     .filter(Boolean);
//   const eligible = values.filter((v) => v !== "N/A");
//   return eligible.length
//     ? Math.round(
//         (values.filter((v) => v === "PASS").length / eligible.length) * 100,
//       )
//     : 0;
// }
// export async function getSession() {
//   return null;
// }

import { neon } from "@neondatabase/serverless";

export type Answer = {
  status?: "PASS" | "FAIL" | "N/A";
  remarks?: string;
  evidence?: Array<{
    reportId: string;
    type: string;
    url: string;
    fileName: string;
    capturedAt: string;
  }>;
};

export type Audit = {
  id: string;
  employeeId: string;
  employeeName: string;
  customer: string;
  location: string;
  date: string;
  status: string;
  score?: number;
  templateId: string;
  answers: Record<string, Answer>;
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
      customer,
      location,
      date,
      status,
      score,
      template_id,
      answers
    FROM audits
    ORDER BY created_at DESC
  `;

  return rows.map((row: any) => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    customer: row.customer,
    location: row.location,
    date: row.date,
    status: row.status,
    score: row.score ?? undefined,
    templateId: row.template_id,
    answers: row.answers || {},
  }));
}

export async function writeAudits(audits: Audit[]) {
  const sql = getDatabase();

  // This keeps your existing API structure working:
  // writeAudits([...audits]) replaces the stored list.
  //
  // For the current demo, we synchronize the database
  // with the supplied audit array.

  await sql`DELETE FROM audits`;

  for (const audit of audits) {
    await sql`
      INSERT INTO audits (
        id,
        employee_id,
        employee_name,
        customer,
        location,
        date,
        status,
        score,
        template_id,
        answers
      )
      VALUES (
        ${audit.id},
        ${audit.employeeId},
        ${audit.employeeName},
        ${audit.customer},
        ${audit.location},
        ${audit.date},
        ${audit.status},
        ${audit.score ?? null},
        ${audit.templateId},
        ${JSON.stringify(audit.answers)}::jsonb
      )
    `;
  }
}

export function scoreAudit(audit: Audit) {
  const values = Object.values(audit.answers)
    .map((a) => a.status)
    .filter(Boolean);

  const eligible = values.filter((v) => v !== "N/A");

  return eligible.length
    ? Math.round(
        (values.filter((v) => v === "PASS").length / eligible.length) * 100,
      )
    : 0;
}

export async function getSession() {
  return null;
}


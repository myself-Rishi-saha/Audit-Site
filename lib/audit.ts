import fs from "node:fs/promises";
import path from "node:path";
export type Answer = { status?: "PASS" | "FAIL" | "N/A"; remarks?: string };
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
const file = path.join(process.cwd(), "data/audits.json");
export async function readAudits(): Promise<Audit[]> {
  return JSON.parse(await fs.readFile(file, "utf8"));
}
export async function writeAudits(audits: Audit[]) {
  await fs.writeFile(file, JSON.stringify(audits, null, 2));
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

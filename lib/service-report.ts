// import fs from "node:fs/promises";
// import path from "node:path";
// export type Evidence = {
//   id: string;
//   reportId: string;
//   type: string;
//   url: string;
//   fileName: string;
//   capturedAt: string;
// };
// export type ServiceReport = {
//   id: string;
//   employeeId: string;
//   employeeName: string;
//   customer: string;
//   address: string;
//   engineer: string;
//   date: string;
//   time: string;
//   equipment: string;
//   serial: string;
//   serviceType: string;
//   systems: string[];
//   reportedFault: string;
//   actions: string[];
//   customerName: string;
//   customerRemarks: string;
//   evidence: Evidence[];
//   status: "DRAFT" | "COMPLETED";
//   createdAt: string;
//   updatedAt: string;
// };
// const file = path.join(process.cwd(), "data/service-reports.json");
// export async function readServiceReports(): Promise<ServiceReport[]> {
//   return JSON.parse(await fs.readFile(file, "utf8"));
// }
// export async function writeServiceReports(items: ServiceReport[]) {
//   await fs.writeFile(file, JSON.stringify(items, null, 2));
// }
// export async function currentUser() {
//   const { cookies } = await import("next/headers");
//   const value = (await cookies()).get("auditdesk_session")?.value;
//   return value ? JSON.parse(value) : { id: "EMP001", name: "S. Roy" };
// }
// export function nextReportId(items: ServiceReport[]) {
//   return `SRV-${String(items.length + 1).padStart(3, "0")}`;
// }
// export function nextEvidenceId(items: Evidence[]) {
//   return `EV-${String(items.length + 1).padStart(3, "0")}`;
// }
// export async function ensureUploadDir(id: string) {
//   await fs.mkdir(path.join(process.cwd(), "public/uploads", id), {
//     recursive: true,
//   });
// }
// export { fs, path };
import fs from "node:fs/promises";
import path from "node:path";
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

export type ServiceReport = {
  id: string;
  employeeId: string;
  employeeName: string;
  customer: string;
  address: string;
  engineer: string;
  date: string;
  time: string;
  equipment: string;
  serial: string;
  serviceType: string;
  systems: string[];
  reportedFault: string;
  actions: string[];
  customerName: string;
  customerRemarks: string;

  // Evidence is stored separately for each camera field
  evidence: Record<string, Evidence[]>;

  status: "DRAFT" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
};

const file = path.join(process.cwd(), "data/service-reports.json");

export async function readServiceReports(): Promise<ServiceReport[]> {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

export async function writeServiceReports(items: ServiceReport[]) {
  await fs.writeFile(file, JSON.stringify(items, null, 2));
}

export async function currentUser() {
  const value = (await cookies()).get("auditdesk_session")?.value;

  if (!value) {
    return {
      id: "EMP001",
      name: "S. Roy",
    };
  }

  try {
    const secret = process.env.AUTH_SECRET;

    if (!secret) {
      throw new Error("AUTH_SECRET is not configured");
    }

    const secretKey = new TextEncoder().encode(secret);

    const { payload } = await jwtVerify(value, secretKey);

    return {
      id: String(payload.id || "EMP001"),
      name: String(payload.name || "S. Roy"),
    };
  } catch (error) {
    console.error("Invalid auditdesk session:", error);

    return {
      id: "EMP001",
      name: "S. Roy",
    };
  }
}

export function nextReportId(items: ServiceReport[]) {
  return `SRV-${String(items.length + 1).padStart(3, "0")}`;
}

export function nextEvidenceId(items: Evidence[]) {
  return `EV-${String(items.length + 1).padStart(3, "0")}`;
}

export async function ensureUploadDir(id: string) {
  await fs.mkdir(path.join(process.cwd(), "public/uploads", id), {
    recursive: true,
  });
}

export { fs, path };

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

  evidence: Record<string, Evidence[]>;

  status: "DRAFT" | "COMPLETED";
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

export async function readServiceReports(): Promise<ServiceReport[]> {
  const sql = getDatabase();

  const rows = await sql`
    SELECT
      id,
      employee_id,
      employee_name,
      customer,
      address,
      engineer,
      date,
      time,
      equipment,
      serial,
      service_type,
      systems,
      reported_fault,
      actions,
      customer_name,
      customer_remarks,
      evidence,
      status,
      created_at,
      updated_at
    FROM service_reports
    ORDER BY created_at DESC
  `;

  return rows.map((row: any) => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    customer: row.customer,
    address: row.address,
    engineer: row.engineer,
    date: row.date,
    time: row.time,
    equipment: row.equipment,
    serial: row.serial,
    serviceType: row.service_type,
    systems: row.systems || [],
    reportedFault: row.reported_fault,
    actions: row.actions || [],
    customerName: row.customer_name,
    customerRemarks: row.customer_remarks,
    evidence: row.evidence || {},
    status: row.status,
    createdAt: row.created_at?.toISOString?.() || String(row.created_at),
    updatedAt: row.updated_at?.toISOString?.() || String(row.updated_at),
  }));
}

export async function writeServiceReports(
  items: ServiceReport[],
) {
  const sql = getDatabase();

  /*
   * This keeps your existing API structure working.
   *
   * Your existing routes call:
   *
   *   const reports = await readServiceReports();
   *   reports.push(report);
   *   await writeServiceReports(reports);
   *
   * For the small demo, synchronize the database with
   * the supplied array.
   */

  await sql`DELETE FROM service_reports`;

  for (const report of items) {
    await sql`
      INSERT INTO service_reports (
        id,
        employee_id,
        employee_name,
        customer,
        address,
        engineer,
        date,
        time,
        equipment,
        serial,
        service_type,
        systems,
        reported_fault,
        actions,
        customer_name,
        customer_remarks,
        evidence,
        status,
        created_at,
        updated_at
      )
      VALUES (
        ${report.id},
        ${report.employeeId},
        ${report.employeeName},
        ${report.customer},
        ${report.address},
        ${report.engineer},
        ${report.date},
        ${report.time},
        ${report.equipment},
        ${report.serial},
        ${report.serviceType},
        ${JSON.stringify(report.systems)}::jsonb,
        ${report.reportedFault},
        ${JSON.stringify(report.actions)}::jsonb,
        ${report.customerName},
        ${report.customerRemarks},
        ${JSON.stringify(report.evidence)}::jsonb,
        ${report.status},
        ${report.createdAt},
        ${report.updatedAt}
      )
    `;
  }
}

export async function currentUser() {
  const value = (await cookies())
    .get("auditdesk_session")
    ?.value;

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

/*
 * Kept for compatibility with your existing upload route.
 *
 * Cloudinary is now handling uploads, so this function
 * no longer needs to create a local directory.
 */
export async function ensureUploadDir(_id: string) {
  return;
}


// export { fs, path };
// import fs from "node:fs/promises";
// import path from "node:path";
// import { cookies } from "next/headers";
// import { jwtVerify } from "jose";

// export type Evidence = {
//   id?: string;
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

//   // Evidence is stored separately for each camera field
//   evidence: Record<string, Evidence[]>;

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
//   const value = (await cookies()).get("auditdesk_session")?.value;

//   if (!value) {
//     return {
//       id: "EMP001",
//       name: "S. Roy",
//     };
//   }

//   try {
//     const secret = process.env.AUTH_SECRET;

//     if (!secret) {
//       throw new Error("AUTH_SECRET is not configured");
//     }

//     const secretKey = new TextEncoder().encode(secret);

//     const { payload } = await jwtVerify(value, secretKey);

//     return {
//       id: String(payload.id || "EMP001"),
//       name: String(payload.name || "S. Roy"),
//     };
//   } catch (error) {
//     console.error("Invalid auditdesk session:", error);

//     return {
//       id: "EMP001",
//       name: "S. Roy",
//     };
//   }
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

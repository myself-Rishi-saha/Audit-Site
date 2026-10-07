// import { NextResponse } from "next/server";
// import {
//   readServiceReports,
//   writeServiceReports,
//   currentUser,
//   nextReportId,
//   ServiceReport,
// } from "@/lib/service-report";
// export async function GET() {
//   return NextResponse.json(await readServiceReports());
// }
// export async function POST(req: Request) {
//   const body = await req.json();
//   const items = await readServiceReports();
//   const user = await currentUser();
//   const now = new Date().toISOString();
//   const item: ServiceReport = {
//     ...body,
//     id: nextReportId(items),
//     employeeId: user.id,
//     employeeName: user.name,
//     status: "DRAFT",
//     evidence: body.evidence || [],
//     actions: body.actions || [""],
//     systems: body.systems || [],
//     createdAt: now,
//     updatedAt: now,
//   };
//   items.push(item);
//   await writeServiceReports(items);
//   return NextResponse.json(item);
// }
import { NextResponse } from "next/server";

import {
  readServiceReports,
  writeServiceReports,
  currentUser,
  nextReportId,
  ServiceReport,
} from "@/lib/service-report";

export async function GET() {
  return NextResponse.json(await readServiceReports());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const items = await readServiceReports();
    const user = await currentUser();
    const now = new Date().toISOString();

    const item: ServiceReport = {
      ...body,

      id: nextReportId(items),
      employeeId: user.id,
      employeeName: user.name,

      // Always save as draft
      status: "DRAFT",

      // DB columns are NOT NULL, so use empty values for drafts
      customer: body.customer ?? "",
      address: body.address ?? "",
      engineer: body.engineer ?? "",
      date: body.date ?? "",
      time: body.time ?? "",
      equipment: body.equipment ?? "",
      serial: body.serial ?? "",
      serviceType: body.serviceType ?? "",
      reportedFault: body.reportedFault ?? "",
      customerName: body.customerName ?? "",
      customerRemarks: body.customerRemarks ?? "",

      // JSONB columns can remain arrays/objects
      evidence: body.evidence ?? {},
      actions: body.actions ?? [""],
      systems: body.systems ?? [],

      createdAt: now,
      updatedAt: now,
    };

    items.push(item);

    await writeServiceReports(items);

    return NextResponse.json(item);
  } catch (error) {
    console.error("Create service report error:", error);

    return NextResponse.json(
      { error: "Failed to save service report draft." },
      { status: 500 },
    );
  }
}
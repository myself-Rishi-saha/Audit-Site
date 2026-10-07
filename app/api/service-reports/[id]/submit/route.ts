// import { NextResponse } from "next/server";

// import {
//   readServiceReports,
//   writeServiceReports,
// } from "@/lib/service-report";

// export async function PUT(
//   request: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const { id } = await params;
//     const body = await request.json();

//     const reports = await readServiceReports();

//     const index = reports.findIndex(
//       (report) => report.id === id,
//     );

//     if (index === -1) {
//       return NextResponse.json(
//         { error: "Service report not found" },
//         { status: 404 },
//       );
//     }

//     const existingReport = reports[index];

//     const updatedReport = {
//       ...existingReport,
//       ...body,

//       // These should not be changed by the edit/submit form
//       id: existingReport.id,
//       employeeId: existingReport.employeeId,
//       employeeName: existingReport.employeeName,

//       // Submit the report
//       status: "COMPLETED",
//       updatedAt: new Date().toISOString(),

//       // Preserve existing evidence if the form doesn't send it
//       evidence: body.evidence || existingReport.evidence,
//     };

//     reports[index] = updatedReport;

//     await writeServiceReports(reports);

//     return NextResponse.json(updatedReport);
//   } catch (error) {
//     console.error("Submit service report error:", error);

//     return NextResponse.json(
//       { error: "Failed to submit service report." },
//       { status: 500 },
//     );
//   }
// }
import { NextResponse } from "next/server";

import {
  readServiceReports,
  writeServiceReports,
  ServiceReport,
} from "@/lib/service-report";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const reports = await readServiceReports();

    const index = reports.findIndex(
      (report) => report.id === id,
    );

    if (index === -1) {
      return NextResponse.json(
        { error: "Service report not found" },
        { status: 404 },
      );
    }

    const existingReport = reports[index];

    const updatedReport: ServiceReport = {
      ...existingReport,
      status: "COMPLETED",
      updatedAt: new Date().toISOString(),
    };

    reports[index] = updatedReport;

    await writeServiceReports(reports);

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error("SUBMIT SERVICE REPORT ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit service report.",
      },
      { status: 500 },
    );
  }
}
// import { NextResponse } from "next/server";

// import {
//   readServiceReports,
//   writeServiceReports,
// } from "@/lib/service-report";

// export async function POST(
//   request: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const { id } = await params;
//     const body = await request.json();

//     const reports = await readServiceReports();

//     const index = reports.findIndex(
//       (report) => report.id === id,
//     );

//     if (index === -1) {
//       return NextResponse.json(
//         { error: "Service report not found" },
//         { status: 404 },
//       );
//     }

//     const existingReport = reports[index];

//     const updatedReport = {
//       ...existingReport,
//       ...body,

//       id: existingReport.id,
//       employeeId: existingReport.employeeId,
//       employeeName: existingReport.employeeName,

//       status: "COMPLETED",
//       updatedAt: new Date().toISOString(),

//       evidence: body.evidence || existingReport.evidence,
//     };

//     reports[index] = updatedReport;

//     await writeServiceReports(reports);

//     return NextResponse.json(updatedReport);
//   } catch (error) {
//     console.error("Submit service report error:", error);

//     return NextResponse.json(
//       { error: "Failed to submit service report." },
//       { status: 500 },
//     );
//   }
// }
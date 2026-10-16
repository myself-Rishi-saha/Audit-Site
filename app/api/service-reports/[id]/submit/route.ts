

// import { NextResponse } from "next/server";

// import {
//   readServiceReports,
//   writeServiceReports,
//   ServiceReport,
// } from "@/lib/service-report";

// export async function POST(
//   _request: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const { id } = await params;

//     const reports = await readServiceReports();

//     const index = reports.findIndex(
//       (report) => report.id === id,
//     );

//     if (index === -1) {
//       return NextResponse.json(
//         { error: "Service report not found." },
//         { status: 404 },
//       );
//     }

//     const existingReport = reports[index];

//     // Do not submit an already-completed report again.
//     if (existingReport.status === "COMPLETED") {
//       return NextResponse.json(existingReport);
//     }

//     const now = new Date().toISOString();

//     const updatedReport: ServiceReport = {
//       ...existingReport,
//       status: "COMPLETED",

//       // Preserve the original creation timestamp.
//       createdAt: existingReport.createdAt,

//       // Update the last-modified timestamp.
//       updatedAt: now,

//       // Set submission time only once.
//       submittedAt: existingReport.submittedAt ?? now,
//     };

//     reports[index] = updatedReport;

//     await writeServiceReports(reports);

//     return NextResponse.json(updatedReport);
//   } catch (error) {
//     console.error("SUBMIT SERVICE REPORT ERROR:", error);

//     return NextResponse.json(
//       {
//         error:
//           error instanceof Error
//             ? error.message
//             : "Failed to submit service report.",
//       },
//       { status: 500 },
//     );
//   }
// }

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { neon } from "@neondatabase/serverless";

const EMPLOYEE_COOKIE = "auditdesk_session";
const ADMIN_COOKIE = "auditdesk_admin_session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

function getDatabase() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }

  return neon(url);
}

function mapServiceReport(row: any) {
  const template =
    row.template_snapshot &&
    typeof row.template_snapshot === "object" &&
    !Array.isArray(row.template_snapshot)
      ? row.template_snapshot
      : {
          id: row.template_id || "service-report",
          type: "SERVICE_REPORT",
          title: "Equipment Service & Maintenance Report",
          sections: [],
        };

  return {
    id: String(row.id),
    employeeId: String(row.employee_id),
    employeeName: String(row.employee_name),

    customerId:
      row.customer_id == null ? null : String(row.customer_id),

    customerName:
      row.customer_name == null ? null : String(row.customer_name),

    customerAddress:
      row.customer_address == null
        ? null
        : String(row.customer_address),

    templateId: String(row.template_id || "service-report"),
    templateSnapshot: template,
    template,

    formData:
      row.form_data &&
      typeof row.form_data === "object" &&
      !Array.isArray(row.form_data)
        ? row.form_data
        : {},

    evidence:
      row.evidence && typeof row.evidence === "object"
        ? row.evidence
        : {},

    signatures:
      row.signatures &&
      typeof row.signatures === "object" &&
      !Array.isArray(row.signatures)
        ? row.signatures
        : {},

    status: String(row.status || "").toUpperCase(),
    score: row.score == null ? null : Number(row.score),

    createdAt:
      row.created_at?.toISOString?.() || String(row.created_at),

    updatedAt:
      row.updated_at?.toISOString?.() || String(row.updated_at),

    submittedAt:
      row.submitted_at == null
        ? null
        : row.submitted_at?.toISOString?.() ||
          String(row.submitted_at),
  };
}

async function getAccessContext() {
  const cookieStore = await cookies();

  const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
  const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

  if (adminToken) {
    try {
      const { payload } = await jwtVerify(
        adminToken,
        getAuthSecret(),
      );

      if (!payload.id || payload.role !== "admin") {
        return {
          error: NextResponse.json(
            { error: "Unauthorized." },
            { status: 401 },
          ),
        };
      }

      return { role: "admin" as const };
    } catch {
      return {
        error: NextResponse.json(
          { error: "Invalid or expired admin session." },
          { status: 401 },
        ),
      };
    }
  }

  if (!employeeToken) {
    return {
      error: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  let payload;

  try {
    const result = await jwtVerify(
      employeeToken,
      getAuthSecret(),
    );

    payload = result.payload;
  } catch {
    return {
      error: NextResponse.json(
        { error: "Invalid or expired employee session." },
        { status: 401 },
      ),
    };
  }

  if (!payload.id || payload.role !== "auditor") {
    return {
      error: NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      ),
    };
  }

  const sql = getDatabase();

  const employees = await sql`
    SELECT id, role, is_active, can_access_service_report
    FROM employees
    WHERE id = ${String(payload.id)}
    LIMIT 1
  `;

  const employee = employees[0];

  if (
    !employee ||
    employee.is_active !== true ||
    employee.role !== "auditor"
  ) {
    return {
      error: NextResponse.json(
        { error: "Your employee account is inactive or unauthorized." },
        { status: 403 },
      ),
    };
  }

  if (employee.can_access_service_report !== true) {
    return {
      error: NextResponse.json(
        {
          error:
            "You do not have permission to access service reports.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    role: "auditor" as const,
    employeeId: String(employee.id),
  };
}

/**
 * POST /api/service-reports/[id]/submit
 *
 * Admin: can submit a draft service report.
 * Employee: can submit only their own draft with service-report access.
 *
 * Completed reports are returned without changing their timestamps.
 */
export async function POST(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    const access = await getAccessContext();

    if (access.error) {
      return access.error;
    }

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
        updated_at,
        submitted_at
      FROM service_reports
      WHERE id = ${id}
      LIMIT 1
    `;

    const report = rows[0];

    if (!report) {
      return NextResponse.json(
        { error: "Service report not found." },
        { status: 404 },
      );
    }

    // Employees may submit only their own reports.
    if (
      access.role === "auditor" &&
      report.employee_id !== access.employeeId
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot submit another employee's service report.",
        },
        { status: 403 },
      );
    }

    const status = String(report.status || "").toUpperCase();

    // Do not submit an already-completed report again.
    if (status === "COMPLETED") {
      return NextResponse.json(mapServiceReport(report));
    }

    if (status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft service reports can be submitted." },
        { status: 409 },
      );
    }

    const updatedRows = await sql`
      UPDATE service_reports
      SET
        status = 'COMPLETED',
        submitted_at = COALESCE(submitted_at, NOW()),
        updated_at = NOW()
      WHERE id = ${id}
        AND UPPER(status) = 'DRAFT'
        AND (
          ${access.role === "admin"}
          OR employee_id = ${
            access.role === "auditor" ? access.employeeId : ""
          }
        )
      RETURNING
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
        updated_at,
        submitted_at
    `;

    if (updatedRows.length === 0) {
      return NextResponse.json(
        {
          error:
            "The service report could not be submitted. It may already have been submitted.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(mapServiceReport(updatedRows[0]));
  } catch (error) {
    console.error("Submit service report error:", error);

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

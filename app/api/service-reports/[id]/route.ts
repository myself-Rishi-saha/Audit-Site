// import { NextResponse } from "next/server";
// import { readServiceReports, writeServiceReports } from "@/lib/service-report";
// export async function GET(
//   _: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   const { id } = await params;
//   const item = (await readServiceReports()).find((x) => x.id === id);
//   console.log("GET SERVICE REPORT ITEM:", item);
//   return item
//     ? NextResponse.json(item)
//     : NextResponse.json({ error: "Not found" }, { status: 404 });
// }
// // export async function PUT(
// //   req: Request,
// //   { params }: { params: Promise<{ id: string }> },
// // ) {
// //   const { id } = await params;
// //   const items = await readServiceReports();
// //   const i = items.findIndex((x) => x.id === id);
// //   if (i < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
// //   items[i] = {
// //     ...items[i],
// //     ...(await req.json()),
// //     updatedAt: new Date().toISOString(),
// //   };
// //   await writeServiceReports(items);
// //   return NextResponse.json(items[i]);
// // }
// export async function PUT(
//   req: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   const { id } = await params;
//   const body = await req.json();

//   console.log("PUT SERVICE REPORT BODY:", body);
//   console.log("SIGNATURES:", body.signatures);

//   const items = await readServiceReports();
//   const i = items.findIndex((x) => x.id === id);

//   if (i < 0) {
//     return NextResponse.json({ error: "Not found" }, { status: 404 });
//   }

//   items[i] = {
//     ...items[i],
//     ...body,
//     updatedAt: new Date().toISOString(),
//   };

//   await writeServiceReports(items);

//   return NextResponse.json(items[i]);
// }
// export async function DELETE(
//   _: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   const { id } = await params;

//   const items = await readServiceReports();

//   const index = items.findIndex((x) => x.id === id);

//   if (index < 0) {
//     return NextResponse.json({ error: "Not found" }, { status: 404 });
//   }

//   items.splice(index, 1);

//   await writeServiceReports(items);

//   return NextResponse.json({
//     success: true,
//     message: "Service report deleted successfully.",
//   });
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
      row.evidence &&
      typeof row.evidence === "object"
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

/**
 * Verifies the session and checks current employee status
 * and service-report permission.
 */
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
    SELECT
      id,
      role,
      is_active,
      can_access_service_report
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
        {
          error:
            "Your employee account is inactive or unauthorized.",
        },
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
 * GET /api/service-reports/[id]
 *
 * Admin: can view any service report.
 * Employee: can view only their own reports with permission enabled.
 */
export async function GET(
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

    if (
      access.role === "auditor" &&
      report.employee_id !== access.employeeId
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot access another employee's service report.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(mapServiceReport(report));
  } catch (error) {
    console.error("Get service report error:", error);

    return NextResponse.json(
      { error: "Failed to get service report." },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/service-reports/[id]
 *
 * Admin: can edit service-report data while preserving its status
 * and original template information.
 *
 * Employee: can edit only their own DRAFT reports.
 */
export async function PUT(
  request: Request,
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
        created_at,
        updated_at,
        submitted_at
      FROM service_reports
      WHERE id = ${id}
      LIMIT 1
    `;

    const existing = rows[0];

    if (!existing) {
      return NextResponse.json(
        { error: "Service report not found." },
        { status: 404 },
      );
    }

    if (
      access.role === "auditor" &&
      existing.employee_id !== access.employeeId
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot edit another employee's service report.",
        },
        { status: 403 },
      );
    }

    if (
      access.role === "auditor" &&
      String(existing.status).toUpperCase() !== "DRAFT"
    ) {
      return NextResponse.json(
        {
          error:
            "Only draft service reports can be edited by employees.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Preserve ownership, customer, template, and report status.
    const formData = body.formData ?? existing.form_data ?? {};
    const evidence = body.evidence ?? existing.evidence ?? {};
    const signatures = body.signatures ?? existing.signatures ?? {};

    const updatedRows = await sql`
      UPDATE service_reports
      SET
        form_data = ${JSON.stringify(formData)}::jsonb,
        evidence = ${JSON.stringify(evidence)}::jsonb,
        signatures = ${JSON.stringify(signatures)}::jsonb,
        updated_at = NOW()
      WHERE id = ${id}
        AND (
          ${access.role === "admin"}
          OR (
            employee_id = ${
              access.role === "auditor" ? access.employeeId : ""
            }
            AND UPPER(status) = 'DRAFT'
          )
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
        created_at,
        updated_at,
        submitted_at
    `;

    if (updatedRows.length === 0) {
      return NextResponse.json(
        { error: "Service report could not be updated." },
        { status: 403 },
      );
    }

    return NextResponse.json(
      mapServiceReport(updatedRows[0]),
    );
  } catch (error) {
    console.error("Update service report error:", error);

    return NextResponse.json(
      { error: "Failed to update service report." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/service-reports/[id]
 *
 * Only DRAFT service reports can be deleted.
 * Employees can delete only their own drafts.
 * Admins can delete drafts.
 */
export async function DELETE(
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
      SELECT id, employee_id, status
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

    if (
      access.role === "auditor" &&
      report.employee_id !== access.employeeId
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot delete another employee's service report.",
        },
        { status: 403 },
      );
    }

    if (String(report.status).toUpperCase() !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft service reports can be deleted." },
        { status: 403 },
      );
    }

    const deletedRows = await sql`
      DELETE FROM service_reports
      WHERE id = ${id}
        AND UPPER(status) = 'DRAFT'
        AND (
          ${access.role === "admin"}
          OR employee_id = ${
            access.role === "auditor" ? access.employeeId : ""
          }
        )
      RETURNING id
    `;

    if (deletedRows.length === 0) {
      return NextResponse.json(
        { error: "Draft service report could not be deleted." },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Draft service report deleted successfully.",
    });
  } catch (error) {
    console.error("Delete service report error:", error);

    return NextResponse.json(
      { error: "Failed to delete service report." },
      { status: 500 },
    );
  }
}

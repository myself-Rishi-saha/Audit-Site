
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

// ----------------------------------------------------
// MAP DATABASE ROW
// ----------------------------------------------------

function mapDailyAccentReport(row: any) {
  const template =
    row.template_snapshot &&
    typeof row.template_snapshot === "object" &&
    !Array.isArray(row.template_snapshot)
      ? row.template_snapshot
      : {
          id: row.template_id || "daily-accent-report",
          type: "DAILY_ACCENT_REPORT",
          title: "Daily Accent Report",
          sections: [],
        };

  const toIsoString = (value: unknown) => {
    if (value == null) return null;

    const date =
      value instanceof Date ? value : new Date(String(value));

    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toISOString();
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

    templateId: String(row.template_id || "daily-accent-report"),
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
      typeof row.evidence === "object" &&
      !Array.isArray(row.evidence)
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
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    submittedAt: toIsoString(row.submitted_at),
  };
}

// ----------------------------------------------------
// ACCESS CONTEXT
// ----------------------------------------------------

type AccessContext =
  | { role: "admin" }
  | { role: "auditor"; employeeId: string }
  | { error: Response };

async function getAccessContext(): Promise<AccessContext> {
  const cookieStore = await cookies();

  const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
  const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

  // ADMIN
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

      return { role: "admin" };
    } catch {
      return {
        error: NextResponse.json(
          { error: "Invalid or expired admin session." },
          { status: 401 },
        ),
      };
    }
  }

  // EMPLOYEE
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
      can_access_daily_accent_report
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

  if (employee.can_access_daily_accent_report !== true) {
    return {
      error: NextResponse.json(
        {
          error:
            "You do not have permission to access Daily Accent Reports.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    role: "auditor",
    employeeId: String(employee.id),
  };
}

// ----------------------------------------------------
// POST /api/daily-accent-reports/[id]/submit
//
// Admin: can submit a draft.
// Employee: can submit only their own draft.
// Completed reports are returned without modification.
// ----------------------------------------------------

export async function POST(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    const access = await getAccessContext();

    if ("error" in access) {
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
      FROM daily_accent_reports
      WHERE id = ${id}
      LIMIT 1
    `;

    const report = rows[0];

    if (!report) {
      return NextResponse.json(
        { error: "Daily Accent Report not found." },
        { status: 404 },
      );
    }

    // Employees may submit only their own reports.
    if (
      access.role === "auditor" &&
      String(report.employee_id) !== access.employeeId
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot submit another employee's Daily Accent Report.",
        },
        { status: 403 },
      );
    }

    const status = String(report.status || "").toUpperCase();

    // Do not change timestamps on an already-completed report.
    if (status === "COMPLETED") {
      return NextResponse.json(
        mapDailyAccentReport(report),
      );
    }

    if (status !== "DRAFT") {
      return NextResponse.json(
        {
          error:
            "Only draft Daily Accent Reports can be submitted.",
        },
        { status: 409 },
      );
    }

    const updatedRows = await sql`
      UPDATE daily_accent_reports
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
        created_at,
        updated_at,
        submitted_at
    `;

    if (updatedRows.length === 0) {
      return NextResponse.json(
        {
          error:
            "The Daily Accent Report could not be submitted. It may already have been submitted.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      mapDailyAccentReport(updatedRows[0]),
    );
  } catch (error) {
    console.error("Submit Daily Accent Report error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit Daily Accent Report.",
      },
      { status: 500 },
    );
  }
}

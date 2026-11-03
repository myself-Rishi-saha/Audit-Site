
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type { RowDataPacket } from "mysql2/promise";
import { getDatabase } from "@/lib/db";

const EMPLOYEE_COOKIE = "auditdesk_session";
const ADMIN_COOKIE = "auditdesk_admin_session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ReportRow = RowDataPacket & {
  id: string;
  employee_id: string;
  employee_name: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_address: string | null;
  template_id: string | null;
  template_snapshot: unknown;
  form_data: unknown;
  evidence: unknown;
  signatures: unknown;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
  submitted_at: string | Date | null;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

function isEnabled(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function parseJson(value: unknown, fallback: unknown = {}) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return value ?? fallback;
}

function parseObject(value: unknown): Record<string, unknown> {
  const parsed = parseJson(value, {});

  return parsed !== null &&
    typeof parsed === "object" &&
    !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

function toIsoString(value: string | Date | null | undefined) {
  if (value == null) return null;

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function mapHandoverCertificate(row: ReportRow) {
  const snapshot = parseObject(row.template_snapshot);

  const template =
    Object.keys(snapshot).length > 0
      ? snapshot
      : {
          id: row.template_id || "handover-certificate",
          type: "HANDOVER_CERTIFICATE",
          title: "HANDOVER CERTIFICATE",
          sections: [],
        };

  return {
    id: String(row.id),
    employeeId: String(row.employee_id),
    employeeName: String(row.employee_name),

    customerId:
      row.customer_id == null ? null : String(row.customer_id),

    customerName: row.customer_name,
    customerAddress: row.customer_address,

    templateId: String(row.template_id || "handover-certificate"),
    templateSnapshot: template,
    template,

    formData: parseObject(row.form_data),
    evidence: parseObject(row.evidence),
    signatures: parseObject(row.signatures),

    status: String(row.status || "").toUpperCase(),

    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    submittedAt: toIsoString(row.submitted_at),
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

  const db = getDatabase();

  const [employees] = await db.execute<RowDataPacket[]>(
    `SELECT id, role, is_active, can_access_handover_certificate
     FROM employees
     WHERE id = ?
     LIMIT 1`,
    [String(payload.id)],
  );

  const employee = employees[0];

  if (
    !employee ||
    !isEnabled(employee.is_active) ||
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

  if (!isEnabled(employee.can_access_handover_certificate)) {
    return {
      error: NextResponse.json(
        {
          error:
            "You do not have permission to access handover certificates.",
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

const REPORT_SELECT = `
  SELECT
    id,
    employee_id,
    employee_name,
    customer_id,
    customer_name,
    customer_address,
    template_id,
    template_snapshot,
    form_data,
    evidence,
    signatures,
    status,
    created_at,
    updated_at,
    submitted_at
  FROM handover_certificates
`;

/**
 * POST /api/handover-certificates/[id]/submit
 *
 * Admin: can submit a draft handover certificate.
 * Employee: can submit only their own draft with permission enabled.
 *
 * Completed certificates are returned without changing timestamps.
 */
export async function POST(
  _request: Request,
  { params }: RouteContext,
) {
  let connection;

  try {
    const { id } = await params;

    const access = await getAccessContext();

    if (access.error) {
      return access.error;
    }

    const db = getDatabase();
    connection = await db.getConnection();

    await connection.beginTransaction();

    // Lock the certificate so simultaneous submission requests
    // cannot both transition the same draft.
    const [rows] = await connection.execute<ReportRow[]>(
      `${REPORT_SELECT} WHERE id = ? LIMIT 1 FOR UPDATE`,
      [id],
    );

    const certificate = rows[0];

    if (!certificate) {
      await connection.rollback();

      return NextResponse.json(
        { error: "Handover certificate not found." },
        { status: 404 },
      );
    }

    if (
      access.role === "auditor" &&
      String(certificate.employee_id) !== access.employeeId
    ) {
      await connection.rollback();

      return NextResponse.json(
        {
          error:
            "You cannot submit another employee's handover certificate.",
        },
        { status: 403 },
      );
    }

    const status = String(certificate.status || "").toUpperCase();

    // An already completed certificate is returned unchanged.
    if (status === "COMPLETED") {
      await connection.commit();
      return NextResponse.json(
        mapHandoverCertificate(certificate),
      );
    }

    if (status !== "DRAFT") {
      await connection.rollback();

      return NextResponse.json(
        {
          error:
            "Only draft handover certificates can be submitted.",
        },
        { status: 409 },
      );
    }

    await connection.execute(
      `UPDATE handover_certificates
       SET
         status = 'COMPLETED',
         submitted_at = UTC_TIMESTAMP(3),
         updated_at = UTC_TIMESTAMP(3)
       WHERE id = ?
         AND UPPER(status) = 'DRAFT'`,
      [id],
    );

    const [updatedRows] = await connection.execute<ReportRow[]>(
      `${REPORT_SELECT} WHERE id = ? LIMIT 1`,
      [id],
    );

    if (!updatedRows[0]) {
      await connection.rollback();

      return NextResponse.json(
        {
          error:
            "Submitted handover certificate could not be retrieved.",
        },
        { status: 500 },
      );
    }

    await connection.commit();

    return NextResponse.json(
      mapHandoverCertificate(updatedRows[0]),
    );
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {
        // Preserve the original error.
      }
    }

    console.error("Submit handover certificate error:", error);

    return NextResponse.json(
      { error: "Failed to submit handover certificate." },
      { status: 500 },
    );
  } finally {
    connection?.release();
  }
}

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { RowDataPacket } from "mysql2/promise";

import { getDatabase } from "@/lib/db";

const ADMIN_COOKIE = "auditdesk_admin_session";
const EMPLOYEE_COOKIE = "auditdesk_session";

interface SessionPayload {
  id?: string;
  employeeId?: string;
  employee_id?: string;
  name?: string;
  role?: string;
}

interface EmployeeRow extends RowDataPacket {
  id: string;
  name: string;
  role: string;
  is_active: boolean | number | string;
  can_access_handover_certificate: boolean | number | string;
}

interface CounterRow extends RowDataPacket {
  next_number: number | string;
}

interface HandoverCertificateRow extends RowDataPacket {
  id: string;
  employee_id: string;
  employee_name: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_address: string | null;
  customer_gst_no: string | null;
  customer_contact_number: string | null;
  template_id: string;
  template_snapshot: unknown;
  form_data: unknown;
  evidence: unknown;
  signatures: unknown;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
  submitted_at: string | Date | null;
}

// ----------------------------------------------------
// AUTHENTICATION
// ----------------------------------------------------

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function getCookieToken(request: Request, cookieName: string) {
  const cookieHeader = request.headers.get("cookie") || "";

  for (const part of cookieHeader.split(";")) {
    const separatorIndex = part.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const name = part.slice(0, separatorIndex).trim();

    if (name !== cookieName) {
      continue;
    }

    const value = part.slice(separatorIndex + 1).trim();

    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return undefined;
}

async function getSession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

async function getEmployee(
  employeeId: string,
): Promise<EmployeeRow | null> {
  const db = getDatabase();

  const [rows] = await db.execute<EmployeeRow[]>(
    `SELECT
       id,
       name,
       role,
       is_active,
       can_access_handover_certificate
     FROM employees
     WHERE id = ?
     LIMIT 1`,
    [employeeId],
  );

  return rows[0] ?? null;
}

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 },
  );
}

function forbidden(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 403 },
  );
}

// ----------------------------------------------------
// DATE FILTERING
// ----------------------------------------------------

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function getIndiaDateRange(date: string): [string, string] {
  const start = new Date(`${date}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const toMysqlUtc = (value: Date) =>
    value.toISOString().slice(0, 23).replace("T", " ");

  return [toMysqlUtc(start), toMysqlUtc(end)];
}

function toIsoString(
  value: string | Date | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value)
            ? `${value.replace(" ", "T")}Z`
            : value,
        );

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toISOString();
}

// ----------------------------------------------------
// JSON CONVERSION
// ----------------------------------------------------

function parseJsonObject<T extends Record<string, unknown>>(
  value: unknown,
  fallback: T,
): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return parsed as T;
      }
    } catch {
      // Use fallback.
    }
  }

  return fallback;
}

// ----------------------------------------------------
// MAP HANDOVER CERTIFICATE
// ----------------------------------------------------

function mapHandoverCertificate(row: HandoverCertificateRow) {
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

    customerGstNo:
      row.customer_gst_no == null
        ? null
        : String(row.customer_gst_no),

    customerContactNumber:
      row.customer_contact_number == null
        ? null
        : String(row.customer_contact_number),

    templateId: String(
      row.template_id || "handover-certificate",
    ),

    templateSnapshot: parseJsonObject<Record<string, unknown>>(
      row.template_snapshot,
      {
        id: row.template_id || "handover-certificate",
        type: "HANDOVER_CERTIFICATE",
        title: "Handover Certificate",
        sections: [],
      },
    ),

    formData: parseJsonObject<Record<string, unknown>>(
      row.form_data,
      {},
    ),

    evidence: parseJsonObject<Record<string, unknown>>(
      row.evidence,
      {},
    ),

    signatures: parseJsonObject<Record<string, unknown>>(
      row.signatures,
      {},
    ),

    status:
      String(row.status).toUpperCase() === "COMPLETED"
        ? "COMPLETED"
        : "DRAFT",

    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    submittedAt: toIsoString(row.submitted_at),
  };
}

// ----------------------------------------------------
// GET /api/handover-certificates
// ----------------------------------------------------

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = (searchParams.get("search") || "").trim();
    const requestedDate = (searchParams.get("date") || "").trim();

    if (requestedDate && !isValidDate(requestedDate)) {
      return NextResponse.json(
        { error: "Invalid date. Use YYYY-MM-DD." },
        { status: 400 },
      );
    }

    const db = getDatabase();

    let dateStart: string | null = null;
    let dateEnd: string | null = null;

    if (requestedDate) {
      [dateStart, dateEnd] = getIndiaDateRange(requestedDate);
    }

    function buildOptionalFilters(
      includeEmployeeName: boolean,
    ): {
      sql: string;
      params: string[];
    } {
      const conditions: string[] = [];
      const params: string[] = [];

      if (search) {
        const pattern = `%${search}%`;

        const searchableColumns = [
          "id",
          ...(includeEmployeeName ? ["employee_name"] : []),
          "customer_name",
          "customer_address",
        ];

        conditions.push(
          `(${searchableColumns
            .map(
              (column) =>
                `COALESCE(${column}, '') LIKE ?`,
            )
            .join(" OR ")})`,
        );

        for (let i = 0; i < searchableColumns.length; i++) {
          params.push(pattern);
        }
      }

      if (dateStart && dateEnd) {
        conditions.push(
          "created_at >= ? AND created_at < ?",
        );

        params.push(dateStart, dateEnd);
      }

      return {
        sql: conditions.length
          ? ` AND ${conditions.join(" AND ")}`
          : "",
        params,
      };
    }

    // ------------------------------------------------
    // ADMIN: ONLY COMPLETED CERTIFICATES
    // ------------------------------------------------

    const adminToken = getCookieToken(
      request,
      ADMIN_COOKIE,
    );

    if (adminToken) {
      const adminSession = await getSession(adminToken);

      if (
        !adminSession ||
        adminSession.role !== "admin"
      ) {
        return unauthorized();
      }

      const filters = buildOptionalFilters(true);

      const [rows] =
        await db.execute<HandoverCertificateRow[]>(
          `SELECT
             id,
             employee_id,
             employee_name,
             customer_id,
             customer_name,
             customer_address,
             customer_gst_no,
             customer_contact_number,
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
           WHERE UPPER(status) = 'COMPLETED'
           ${filters.sql}
           ORDER BY created_at DESC`,
          filters.params,
        );

      return NextResponse.json(
        rows.map(mapHandoverCertificate),
      );
    }

    // ------------------------------------------------
    // EMPLOYEE: AUTHENTICATION AND PERMISSIONS
    // ------------------------------------------------

    const employeeToken = getCookieToken(
      request,
      EMPLOYEE_COOKIE,
    );

    const employeeSession = await getSession(employeeToken);

    if (
      !employeeSession ||
      employeeSession.role !== "auditor"
    ) {
      return unauthorized();
    }

    const employeeId =
      employeeSession.employeeId ??
      employeeSession.employee_id ??
      employeeSession.id;

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID missing from session" },
        { status: 401 },
      );
    }

    const employee = await getEmployee(
      String(employeeId),
    );

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    if (
      employee.role !== "auditor" ||
      !toBoolean(employee.is_active)
    ) {
      return forbidden(
        "Your employee account is inactive or unauthorized.",
      );
    }

    if (
      !toBoolean(employee.can_access_handover_certificate)
    ) {
      return forbidden(
        "You do not have permission to access handover certificates.",
      );
    }

    const filters = buildOptionalFilters(false);

    const [rows] =
      await db.execute<HandoverCertificateRow[]>(
        `SELECT
           id,
           employee_id,
           employee_name,
           customer_id,
           customer_name,
           customer_address,
           customer_gst_no,
           customer_contact_number,
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
         WHERE employee_id = ?
         ${filters.sql}
         ORDER BY created_at DESC`,
        [String(employeeId), ...filters.params],
      );

    return NextResponse.json(
      rows.map(mapHandoverCertificate),
    );
  } catch (error) {
    console.error(
      "GET /api/handover-certificates error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to fetch handover certificates" },
      { status: 500 },
    );
  }
}

// ----------------------------------------------------
// POST /api/handover-certificates
// Create a Handover Certificate draft
// ----------------------------------------------------

export async function POST(request: Request) {
  try {
    const employeeToken = getCookieToken(
      request,
      EMPLOYEE_COOKIE,
    );

    const payload = await getSession(employeeToken);

    if (
      !payload ||
      payload.role !== "auditor" ||
      !payload.id
    ) {
      return unauthorized();
    }

    const employeeId = String(payload.id);
    const employee = await getEmployee(employeeId);

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found." },
        { status: 404 },
      );
    }

    if (
      employee.role !== "auditor" ||
      !toBoolean(employee.is_active)
    ) {
      return forbidden(
        "Your employee account is inactive or unauthorized.",
      );
    }

    if (
      !toBoolean(employee.can_access_handover_certificate)
    ) {
      return forbidden(
        "You do not have permission to create handover certificates.",
      );
    }

    // -----------------------------------------------
    // REQUEST BODY
    // -----------------------------------------------

    let body: Record<string, unknown>;

    try {
      const parsed: unknown = await request.json();

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        return NextResponse.json(
          { error: "Request body must be a JSON object." },
          { status: 400 },
        );
      }

      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    const customerId =
      typeof body.customerId === "string" &&
      body.customerId.trim()
        ? body.customerId.trim()
        : null;

    const customerName =
      typeof body.customerName === "string" &&
      body.customerName.trim()
        ? body.customerName.trim()
        : null;

    const customerAddress =
      typeof body.customerAddress === "string" &&
      body.customerAddress.trim()
        ? body.customerAddress.trim()
        : null;

    const customerGstNo =
      typeof body.customerGstNo === "string" &&
      body.customerGstNo.trim()
        ? body.customerGstNo.trim()
        : null;

    const customerContactNumber =
      typeof body.customerContactNumber === "string" &&
      body.customerContactNumber.trim()
        ? body.customerContactNumber.trim()
        : null;

    const templateId =
      typeof body.templateId === "string" &&
      body.templateId.trim()
        ? body.templateId.trim()
        : "handover-certificate";

    const templateSnapshot =
      body.templateSnapshot &&
      typeof body.templateSnapshot === "object" &&
      !Array.isArray(body.templateSnapshot)
        ? body.templateSnapshot
        : {
            id: templateId,
            type: "HANDOVER_CERTIFICATE",
            name: "Handover Certificate",
            title: "HANDOVER CERTIFICATE",
            sections: [],
          };

    const formData =
      body.formData &&
      typeof body.formData === "object" &&
      !Array.isArray(body.formData)
        ? body.formData
        : {};

    const evidence =
      body.evidence &&
      typeof body.evidence === "object" &&
      !Array.isArray(body.evidence)
        ? body.evidence
        : {};

    const signatures =
      body.signatures &&
      typeof body.signatures === "object" &&
      !Array.isArray(body.signatures)
        ? body.signatures
        : {};

    // -----------------------------------------------
    // DATABASE TRANSACTION
    // -----------------------------------------------

    const db = getDatabase();
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Initialize HOC counter if it does not exist.
      await connection.execute(
        `INSERT IGNORE INTO report_id_counters
           (report_type, next_number)
         VALUES ('HOC', 1)`,
      );

      // Lock counter to prevent duplicate IDs.
      const [counterRows] =
        await connection.execute<CounterRow[]>(
          `SELECT next_number
           FROM report_id_counters
           WHERE report_type = 'HOC'
           FOR UPDATE`,
        );

      if (counterRows.length === 0) {
        throw new Error(
          "Failed to initialize HOC ID counter",
        );
      }

      const counterValue = Number(
        counterRows[0].next_number,
      );

      // Check existing HOC IDs as an additional safeguard.
      const [maxRows] =
        await connection.execute<RowDataPacket[]>(
          `SELECT COALESCE(
             MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)),
             0
           ) AS max_number
           FROM handover_certificates
           WHERE id REGEXP '^HOC-[0-9]+$'`,
        );

      const maxExistingNumber = Number(
        maxRows[0]?.max_number ?? 0,
      );

      const nextNumber = Math.max(
        counterValue,
        maxExistingNumber + 1,
      );

      if (
        !Number.isSafeInteger(nextNumber) ||
        nextNumber < 1
      ) {
        throw new Error("Invalid HOC ID counter value");
      }

      const certificateId =
        `HOC-${String(nextNumber).padStart(3, "0")}`;

      await connection.execute(
        `UPDATE report_id_counters
         SET next_number = ?
         WHERE report_type = 'HOC'`,
        [nextNumber + 1],
      );

      // ---------------------------------------------
      // INSERT DRAFT
      // ---------------------------------------------

      await connection.execute(
        `INSERT INTO handover_certificates (
           id,
           employee_id,
           employee_name,
           customer_id,
           customer_name,
           customer_address,
           customer_gst_no,
           customer_contact_number,
           template_id,
           template_snapshot,
           form_data,
           evidence,
           signatures,
           status,
           created_at,
           updated_at,
           submitted_at
         )
         VALUES (
           ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
           'DRAFT',
           UTC_TIMESTAMP(3),
           UTC_TIMESTAMP(3),
           NULL
         )`,
        [
          certificateId,
          String(employee.id),
          String(employee.name),
          customerId,
          customerName,
          customerAddress,
          customerGstNo,
          customerContactNumber,
          templateId,
          JSON.stringify(templateSnapshot),
          JSON.stringify(formData),
          JSON.stringify(evidence),
          JSON.stringify(signatures),
        ],
      );

      // ---------------------------------------------
      // READ CREATED CERTIFICATE
      // ---------------------------------------------

      const [rows] =
        await connection.execute<HandoverCertificateRow[]>(
          `SELECT
             id,
             employee_id,
             employee_name,
             customer_id,
             customer_name,
             customer_address,
             customer_gst_no,
             customer_contact_number,
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
           WHERE id = ?
           LIMIT 1`,
          [certificateId],
        );

      if (rows.length === 0) {
        throw new Error(
          "Created handover certificate could not be retrieved",
        );
      }

      await connection.commit();

      return NextResponse.json(
        mapHandoverCertificate(rows[0]),
        { status: 201 },
      );
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(
      "Create handover certificate error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to save handover certificate draft." },
      { status: 500 },
    );
  }
}

// import { NextRequest, NextResponse } from "next/server";
// import { jwtVerify } from "jose";
// import { neon } from "@neondatabase/serverless";

// const ADMIN_COOKIE = "auditdesk_admin_session";

// function getAuthSecret() {
//   const secret = process.env.AUTH_SECRET;

//   if (!secret) {
//     throw new Error("AUTH_SECRET is not configured");
//   }

//   return new TextEncoder().encode(secret);
// }

// async function verifyAdmin(request: NextRequest) {
//   const token = request.cookies.get(ADMIN_COOKIE)?.value;

//   if (!token) {
//     return false;
//   }

//   try {
//     const { payload } = await jwtVerify(token, getAuthSecret());

//     return payload.role === "admin";
//   } catch {
//     return false;
//   }
// }

// export async function PATCH(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     // 1. Verify admin authentication.
//     const isAdmin = await verifyAdmin(request);

//     if (!isAdmin) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 },
//       );
//     }

//     // 2. Read the employee ID from the URL.
//     const { id } = await params;

//     if (!id?.trim()) {
//       return NextResponse.json(
//         { error: "Employee ID is required" },
//         { status: 400 },
//       );
//     }

//     // 3. Validate the request body.
//     const body = await request.json();

//     const { canAccessAudit, canAccessServiceReport } = body;

//     if (
//       typeof canAccessAudit !== "boolean" ||
//       typeof canAccessServiceReport !== "boolean"
//     ) {
//       return NextResponse.json(
//         {
//           error:
//             "canAccessAudit and canAccessServiceReport must be boolean values",
//         },
//         { status: 400 },
//       );
//     }

//     // An employee must have at least one report permission.
//     if (!canAccessAudit && !canAccessServiceReport) {
//       return NextResponse.json(
//         {
//           error:
//             "Enable at least one permission: Audit Report or Service Report",
//         },
//         { status: 400 },
//       );
//     }

//     // 4. Connect to Neon PostgreSQL.
//     const databaseUrl = process.env.DATABASE_URL;

//     if (!databaseUrl) {
//       return NextResponse.json(
//         { error: "DATABASE_URL is not configured" },
//         { status: 500 },
//       );
//     }

//     const sql = neon(databaseUrl);

//     // 5. Update the employee's report permissions.
//     const updatedEmployees = await sql`
//       UPDATE employees
//       SET
//         can_access_audit = ${canAccessAudit},
//         can_access_service_report = ${canAccessServiceReport},
//         updated_at = NOW()
//       WHERE id = ${id}
//       RETURNING
//         id,
//         name,
//         email,
//         username,
//         is_active,
//         can_access_audit,
//         can_access_service_report,
//         updated_at
//     `;

//     if (updatedEmployees.length === 0) {
//       return NextResponse.json(
//         { error: "Employee not found" },
//         { status: 404 },
//       );
//     }

//     const employee = updatedEmployees[0];

//     // 6. Return the updated employee.
//     return NextResponse.json({
//       message: "Employee report access updated successfully",
//       employee: {
//         id: String(employee.id),
//         name: employee.name,
//         email: employee.email,
//         username: employee.username,
//         isActive: employee.is_active,
//         canAccessAudit: employee.can_access_audit,
//         canAccessServiceReport:
//           employee.can_access_service_report,
//         updatedAt: employee.updated_at,
//       },
//     });
//   } catch (error) {
//     console.error("Update employee access error:", error);

//     return NextResponse.json(
//       { error: "Failed to update employee report access" },
//       { status: 500 },
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { neon } from "@neondatabase/serverless";

const ADMIN_COOKIE = "auditdesk_admin_session";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;

  if (!token) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Verify admin authentication.
    const isAdmin = await verifyAdmin(request);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Read employee ID.
    const { id } = await params;

    if (!id?.trim()) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 },
      );
    }

    // 3. Validate permissions.
    const body = await request.json();

    const {
      canAccessAudit,
      canAccessServiceReport,
      canAccessDailyAccentReport,
    } = body;

    if (
      typeof canAccessAudit !== "boolean" ||
      typeof canAccessServiceReport !== "boolean" ||
      typeof canAccessDailyAccentReport !== "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "canAccessAudit, canAccessServiceReport, and canAccessDailyAccentReport must be boolean values",
        },
        { status: 400 },
      );
    }

    // Require at least one report permission.
    if (
      !canAccessAudit &&
      !canAccessServiceReport &&
      !canAccessDailyAccentReport
    ) {
      return NextResponse.json(
        {
          error:
            "Enable at least one permission: Audit Report, Service Report, or Daily Accent Report",
        },
        { status: 400 },
      );
    }

    // 4. Connect to Neon PostgreSQL.
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return NextResponse.json(
        { error: "DATABASE_URL is not configured" },
        { status: 500 },
      );
    }

    const sql = neon(databaseUrl);

    // 5. Update employee permissions.
    const updatedEmployees = await sql`
      UPDATE employees
      SET
        can_access_audit = ${canAccessAudit},
        can_access_service_report = ${canAccessServiceReport},
        can_access_daily_accent_report = ${canAccessDailyAccentReport},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING
        id,
        name,
        email,
        username,
        is_active,
        can_access_audit,
        can_access_service_report,
        can_access_daily_accent_report,
        updated_at
    `;

    if (updatedEmployees.length === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    const employee = updatedEmployees[0];

    // 6. Return updated employee.
    return NextResponse.json({
      message: "Employee report access updated successfully",
      employee: {
        id: String(employee.id),
        name: employee.name,
        email: employee.email,
        username: employee.username,
        isActive: employee.is_active,
        canAccessAudit: employee.can_access_audit,
        canAccessServiceReport:
          employee.can_access_service_report,
        canAccessDailyAccentReport:
          employee.can_access_daily_accent_report,
        updatedAt: employee.updated_at,
      },
    });
  } catch (error) {
    console.error("Update employee access error:", error);

    return NextResponse.json(
      { error: "Failed to update employee report access" },
      { status: 500 },
    );
  }
}

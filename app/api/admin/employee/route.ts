import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import {
  createEmployee,
  findEmployeeByUsernameOrEmail,
  readEmployees,
} from "@/lib/employees";

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

/**
 * GET /api/admin/employee
 * Returns all employees and their report permissions.
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employees = await readEmployees();

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Get employees error:", error);

    return NextResponse.json(
      { error: "Failed to load employees" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/employee
 * Creates an employee with selected report permissions.
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const username =
      typeof body.username === "string"
        ? body.username.trim().toLowerCase()
        : "";

    const password = typeof body.password === "string" ? body.password : "";

    const isActive = typeof body.isActive === "boolean" ? body.isActive : true;

    const canAccessAudit = body.canAccessAudit;
    const canAccessServiceReport = body.canAccessServiceReport;
    const canAccessDailyAccentReport = body.canAccessDailyAccentReport;

    // Validate required fields.
    if (!name || !email || !username || !password) {
      return NextResponse.json(
        {
          error: "Name, email, username, and password are required",
        },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    // Validate all three permission values.
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
            "At least one report permission is required: Audit Report, Service Report, or Daily Accent Report",
        },
        { status: 400 },
      );
    }

    // Check for duplicate username or email.
    const existingEmployee = await findEmployeeByUsernameOrEmail(
      username,
      email,
    );

    if (existingEmployee) {
      const usernameExists =
        String(existingEmployee.username).toLowerCase() ===
        username.toLowerCase();

      return NextResponse.json(
        {
          error: usernameExists
            ? "An employee with this username already exists"
            : "An employee with this email already exists",
        },
        { status: 409 },
      );
    }

    // Create employee with all selected permissions.
    const employee = await createEmployee({
      name,
      email,
      username,
      password,
      isActive,
      canAccessAudit,
      canAccessServiceReport,
      canAccessDailyAccentReport,
    });

    return NextResponse.json(
      {
        message: "Employee created successfully",
        employee,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Create employee error:", error);

    // const dbError = error as { code?: string };

    // if (dbError.code === "23505") {
    //   return NextResponse.json(
    //     {
    //       error: "An employee with this username or email already exists",
    //     },
    //     { status: 409 },
    //   );
    // }

    const dbError = error as { code?: string; errno?: number };

    if (dbError.code === "ER_DUP_ENTRY" || dbError.errno === 1062) {
      return NextResponse.json(
        {
          error: "An employee with this username or email already exists",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 },
    );
  }
}

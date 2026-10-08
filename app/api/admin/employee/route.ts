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

/**
 * Make sure the request comes from an authenticated admin.
 */
async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;

  if (!token) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      getAuthSecret(),
    );

    return payload.role === "admin";
  } catch (error) {
    console.error("Invalid admin session:", error);
    return false;
  }
}

/**
 * GET /api/admin/employees
 *
 * Returns all employees.
 *
 * password_hash is never returned by lib/employees.ts.
 */
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);

    if (!isAdmin) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const employees = await readEmployees();

    return NextResponse.json({
      employees,
    });
  } catch (error) {
    console.error("Get employees error:", error);

    return NextResponse.json(
      {
        error: "Failed to load employees",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * POST /api/admin/employees
 *
 * Creates a new employee.
 */
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);

    if (!isAdmin) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const username =
      typeof body.username === "string"
        ? body.username.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const isActive =
      typeof body.isActive === "boolean"
        ? body.isActive
        : true;

    // -----------------------------
    // Validation
    // -----------------------------

    if (!name) {
      return NextResponse.json(
        {
          error: "Employee name is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error: "Email is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!username) {
      return NextResponse.json(
        {
          error: "Username is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          error: "Password is required",
        },
        {
          status: 400,
        },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 6 characters long",
        },
        {
          status: 400,
        },
      );
    }

    // Basic email validation
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: "Please enter a valid email address",
        },
        {
          status: 400,
        },
      );
    }

    // -----------------------------
    // Duplicate check
    // -----------------------------

    const existingEmployee =
      await findEmployeeByUsernameOrEmail(
        username,
        email,
      );

    if (existingEmployee) {
      const existingUsername =
        String(existingEmployee.username).toLowerCase() ===
        username.toLowerCase();

      if (existingUsername) {
        return NextResponse.json(
          {
            error:
              "An employee with this username already exists",
          },
          {
            status: 409,
          },
        );
      }

      return NextResponse.json(
        {
          error:
            "An employee with this email already exists",
        },
        {
          status: 409,
        },
      );
    }

    // -----------------------------
    // Create employee
    // -----------------------------

    const employee = await createEmployee({
      name,
      email,
      username,
      password,
      isActive,
    });

    return NextResponse.json(
      {
        message: "Employee created successfully",
        employee,
      },
      {
        status: 201,
      },
    );
  } catch (error: any) {
    console.error("Create employee error:", error);

    // PostgreSQL unique constraint fallback.
    // This also protects against two simultaneous
    // requests creating the same username/email.
    if (error?.code === "23505") {
      return NextResponse.json(
        {
          error:
            "An employee with this username or email already exists",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create employee",
      },
      {
        status: 500,
      },
    );
  }
}
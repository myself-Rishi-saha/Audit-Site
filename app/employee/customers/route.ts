import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

import { readCustomers } from "@/lib/customers";

const EMPLOYEE_COOKIE = "auditdesk_session";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

async function verifyEmployee() {
  const cookieStore = await cookies();

  const token = cookieStore.get(EMPLOYEE_COOKIE)?.value;

  if (!token) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      getAuthSecret(),
    );

    return (
      payload.role === "auditor" &&
      Boolean(payload.id)
    );
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const isEmployee = await verifyEmployee();

    if (!isEmployee) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const customers = await readCustomers();

    return NextResponse.json(
      customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        address: customer.address,
        gstNo: customer.gstNo,
        contactNumber: customer.contactNumber,
      })),
    );
  } catch (error) {
    console.error(
      "Read employee customers error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to load customers." },
      { status: 500 },
    );
  }
}
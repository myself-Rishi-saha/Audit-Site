import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

import {
  createCustomer,
  readCustomers,
} from "@/lib/customers";

const ADMIN_COOKIE = "auditdesk_admin_session";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;

  if (!token) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      getAuthSecret(),
    );

    return payload.role === "admin";
  } catch {
    return false;
  }
}

/**
 * GET /api/admin/customers
 *
 * Returns all customers.
 */
export async function GET() {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const customers = await readCustomers();

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Read customers error:", error);

    return NextResponse.json(
      { error: "Failed to load customers." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/customers
 *
 * Creates a new customer.
 */
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const address =
      typeof body.address === "string"
        ? body.address.trim()
        : "";

    const gstNo =
      typeof body.gstNo === "string"
        ? body.gstNo.trim()
        : "";

    const contactNumber =
      typeof body.contactNumber === "string"
        ? body.contactNumber.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        { error: "Customer name is required." },
        { status: 400 },
      );
    }

    if (!address) {
      return NextResponse.json(
        { error: "Address is required." },
        { status: 400 },
      );
    }

    if (!contactNumber) {
      return NextResponse.json(
        { error: "Contact number is required." },
        { status: 400 },
      );
    }

    const customer = await createCustomer({
      name,
      address,
      gstNo: gstNo || null,
      contactNumber,
    });

    return NextResponse.json(
      customer,
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Create customer error:", error);

    return NextResponse.json(
      { error: "Failed to create customer." },
      { status: 500 },
    );
  }
}
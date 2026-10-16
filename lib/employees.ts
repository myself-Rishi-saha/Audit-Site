
// import { neon } from "@neondatabase/serverless";
// import bcrypt from "bcryptjs";

// export type Employee = {
//   id: string;
//   name: string;
//   email: string;
//   username: string;
//   isActive: boolean;
//   role: "auditor";
//   canAccessAudit: boolean;
//   canAccessServiceReport: boolean;
//   createdAt: string;
//   updatedAt: string;
// };

// export type CreateEmployeeInput = {
//   name: string;
//   email: string;
//   username: string;
//   password: string;
//   isActive?: boolean;
//   canAccessAudit: boolean;
//   canAccessServiceReport: boolean;
// };

// function getDatabase() {
//   const url = process.env.DATABASE_URL;

//   if (!url) {
//     throw new Error("DATABASE_URL is not configured");
//   }

//   return neon(url);
// }

// function mapEmployee(row: any): Employee {
//   return {
//     id: String(row.id),
//     name: String(row.name),
//     email: String(row.email),
//     username: String(row.username),
//     isActive: Boolean(row.is_active),
//     role: "auditor",
//     canAccessAudit: Boolean(row.can_access_audit),
//     canAccessServiceReport: Boolean(
//       row.can_access_service_report,
//     ),
//     createdAt:
//       row.created_at?.toISOString?.() ??
//       String(row.created_at),
//     updatedAt:
//       row.updated_at?.toISOString?.() ??
//       String(row.updated_at),
//   };
// }

// /**
//  * Get all employees, including report permissions.
//  * Password hashes are never selected or returned.
//  */
// export async function readEmployees(): Promise<Employee[]> {
//   const sql = getDatabase();

//   const rows = await sql`
//     SELECT
//       id,
//       name,
//       email,
//       username,
//       is_active,
//       role,
//       can_access_audit,
//       can_access_service_report,
//       created_at,
//       updated_at
//     FROM employees
//     ORDER BY created_at DESC
//   `;

//   return rows.map(mapEmployee);
// }

// /**
//  * Generate the next employee ID.
//  *
//  * Example: EMP001, EMP002, EMP003
//  */
// export async function generateEmployeeId(): Promise<string> {
//   const sql = getDatabase();

//   const rows = await sql`
//     SELECT
//       COALESCE(
//         MAX(
//           CAST(
//             NULLIF(SUBSTRING(id FROM 4), '') AS INTEGER
//           )
//         ),
//         0
//       ) + 1 AS next_number
//     FROM employees
//     WHERE id ~ '^EMP[0-9]+$'
//   `;

//   const nextNumber = Number(rows[0]?.next_number || 1);

//   return `EMP${String(nextNumber).padStart(3, "0")}`;
// }

// /**
//  * Create an employee with selected report permissions.
//  * Only the bcrypt password hash is stored.
//  */
// export async function createEmployee(
//   input: CreateEmployeeInput,
// ): Promise<Employee> {
//   if (!input.canAccessAudit && !input.canAccessServiceReport) {
//     throw new Error(
//       "At least one report permission is required",
//     );
//   }

//   const sql = getDatabase();

//   const passwordHash = await bcrypt.hash(
//     input.password,
//     10,
//   );

//   const id = await generateEmployeeId();
//   const now = new Date().toISOString();
//   const isActive = input.isActive ?? true;

//   const rows = await sql`
//     INSERT INTO employees (
//       id,
//       name,
//       email,
//       username,
//       password_hash,
//       is_active,
//       role,
//       can_access_audit,
//       can_access_service_report,
//       created_at,
//       updated_at
//     )
//     VALUES (
//       ${id},
//       ${input.name},
//       ${input.email},
//       ${input.username},
//       ${passwordHash},
//       ${isActive},
//       'auditor',
//       ${input.canAccessAudit},
//       ${input.canAccessServiceReport},
//       ${now},
//       ${now}
//     )
//     RETURNING
//       id,
//       name,
//       email,
//       username,
//       is_active,
//       role,
//       can_access_audit,
//       can_access_service_report,
//       created_at,
//       updated_at
//   `;

//   return mapEmployee(rows[0]);
// }

// /**
//  * Check whether a username or email already exists.
//  */
// export async function findEmployeeByUsernameOrEmail(
//   username: string,
//   email: string,
// ) {
//   const sql = getDatabase();

//   const rows = await sql`
//     SELECT
//       id,
//       username,
//       email
//     FROM employees
//     WHERE LOWER(username) = LOWER(${username})
//        OR LOWER(email) = LOWER(${email})
//     LIMIT 1
//   `;

//   return rows[0] || null;
// }
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export type Employee = {
  id: string;
  name: string;
  email: string;
  username: string;
  isActive: boolean;
  role: "auditor";
  canAccessAudit: boolean;
  canAccessServiceReport: boolean;
  canAccessDailyAccentReport: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateEmployeeInput = {
  name: string;
  email: string;
  username: string;
  password: string;
  isActive?: boolean;
  canAccessAudit: boolean;
  canAccessServiceReport: boolean;
  canAccessDailyAccentReport: boolean;
};

function getDatabase() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }

  return neon(url);
}

function mapEmployee(row: any): Employee {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    username: String(row.username),
    isActive: Boolean(row.is_active),
    role: "auditor",
    canAccessAudit: Boolean(row.can_access_audit),
    canAccessServiceReport: Boolean(
      row.can_access_service_report,
    ),
    canAccessDailyAccentReport: Boolean(
      row.can_access_daily_accent_report,
    ),
    createdAt:
      row.created_at?.toISOString?.() ??
      String(row.created_at),
    updatedAt:
      row.updated_at?.toISOString?.() ??
      String(row.updated_at),
  };
}

/**
 * Get all employees, including report permissions.
 * Password hashes are never selected or returned.
 */
export async function readEmployees(): Promise<Employee[]> {
  const sql = getDatabase();

  const rows = await sql`
    SELECT
      id,
      name,
      email,
      username,
      is_active,
      role,
      can_access_audit,
      can_access_service_report,
      can_access_daily_accent_report,
      created_at,
      updated_at
    FROM employees
    ORDER BY created_at DESC
  `;

  return rows.map(mapEmployee);
}

/**
 * Generate the next employee ID.
 *
 * Example: EMP001, EMP002, EMP003
 */
export async function generateEmployeeId(): Promise<string> {
  const sql = getDatabase();

  const rows = await sql`
    SELECT
      COALESCE(
        MAX(
          CAST(
            NULLIF(SUBSTRING(id FROM 4), '') AS INTEGER
          )
        ),
        0
      ) + 1 AS next_number
    FROM employees
    WHERE id ~ '^EMP[0-9]+$'
  `;

  const nextNumber = Number(rows[0]?.next_number || 1);

  return `EMP${String(nextNumber).padStart(3, "0")}`;
}

/**
 * Create an employee with selected report permissions.
 * Only the bcrypt password hash is stored.
 */
export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<Employee> {
  if (
    !input.canAccessAudit &&
    !input.canAccessServiceReport &&
    !input.canAccessDailyAccentReport
  ) {
    throw new Error(
      "At least one report permission is required",
    );
  }

  const sql = getDatabase();

  const passwordHash = await bcrypt.hash(
    input.password,
    10,
  );

  const id = await generateEmployeeId();
  const now = new Date().toISOString();
  const isActive = input.isActive ?? true;

  const rows = await sql`
    INSERT INTO employees (
      id,
      name,
      email,
      username,
      password_hash,
      is_active,
      role,
      can_access_audit,
      can_access_service_report,
      can_access_daily_accent_report,
      created_at,
      updated_at
    )
    VALUES (
      ${id},
      ${input.name},
      ${input.email},
      ${input.username},
      ${passwordHash},
      ${isActive},
      'auditor',
      ${input.canAccessAudit},
      ${input.canAccessServiceReport},
      ${input.canAccessDailyAccentReport},
      ${now},
      ${now}
    )
    RETURNING
      id,
      name,
      email,
      username,
      is_active,
      role,
      can_access_audit,
      can_access_service_report,
      can_access_daily_accent_report,
      created_at,
      updated_at
  `;

  return mapEmployee(rows[0]);
}

/**
 * Check whether a username or email already exists.
 */
export async function findEmployeeByUsernameOrEmail(
  username: string,
  email: string,
) {
  const sql = getDatabase();

  const rows = await sql`
    SELECT
      id,
      username,
      email
    FROM employees
    WHERE LOWER(username) = LOWER(${username})
       OR LOWER(email) = LOWER(${email})
    LIMIT 1
  `;

  return rows[0] || null;
}

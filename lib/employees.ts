// import { neon } from "@neondatabase/serverless";
// import bcrypt from "bcryptjs";

// export type Employee = {
//   id: string;
//   name: string;
//   email: string;
//   username: string;
//   isActive: boolean;
//   role: "auditor";
//   createdAt: string;
//   updatedAt: string;
// };

// export type CreateEmployeeInput = {
//   name: string;
//   email: string;
//   username: string;
//   password: string;
//   isActive?: boolean;
// };

// function getDatabase() {
//   const url = process.env.DATABASE_URL;

//   if (!url) {
//     throw new Error("DATABASE_URL is not configured");
//   }

//   return neon(url);
// }

// /**
//  * Get all employees.
//  *
//  * IMPORTANT:
//  * password_hash is never selected, so the password
//  * can never accidentally be returned to the admin UI.
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
//       created_at,
//       updated_at
//     FROM employees
//     ORDER BY created_at DESC
//   `;

//   return rows.map((row: any) => ({
//     id: String(row.id),
//     name: String(row.name),
//     email: String(row.email),
//     username: String(row.username),
//     isActive: Boolean(row.is_active),
//     role: "auditor",
//     createdAt:
//       row.created_at?.toISOString?.() ||
//       String(row.created_at),
//     updatedAt:
//       row.updated_at?.toISOString?.() ||
//       String(row.updated_at),
//   }));
// }

// /**
//  * Generate the next employee ID.
//  *
//  * Example:
//  * EMP001
//  * EMP002
//  * EMP003
//  */
// export async function generateEmployeeId(): Promise<string> {
//   const sql = getDatabase();

//   const rows = await sql`
//     SELECT
//       COALESCE(
//         MAX(
//           CAST(
//             NULLIF(SUBSTRING(id FROM 5), '') AS INTEGER
//           )
//         ),
//         0
//       ) + 1 AS next_number
//     FROM employees
//     WHERE id ~ '^EMP-[0-9]+$'
//   `;

//   const nextNumber = Number(
//     rows[0]?.next_number || 1,
//   );

//   return `EMP-${String(nextNumber).padStart(3, "0")}`;
// }

// /**
//  * Create a new employee.
//  *
//  * The supplied password is immediately converted
//  * to a bcrypt hash. Plaintext password is never stored.
//  */
// export async function createEmployee(
//   input: CreateEmployeeInput,
// ): Promise<Employee> {
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
//       ${true},
//       'auditor',
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
//       created_at,
//       updated_at
//   `;

//   const row: any = rows[0];

//   return {
//     id: String(row.id),
//     name: String(row.name),
//     email: String(row.email),
//     username: String(row.username),
//     isActive: Boolean(row.is_active),
//     mustChangePassword: Boolean(
//       row.must_change_password,
//     ),
//     role: "auditor",
//     createdAt:
//       row.created_at?.toISOString?.() ||
//       String(row.created_at),
//     updatedAt:
//       row.updated_at?.toISOString?.() ||
//       String(row.updated_at),
//   };
// }

// /**
//  * Check whether an employee already exists
//  * with the supplied username or email.
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
  createdAt: string;
  updatedAt: string;
};

export type CreateEmployeeInput = {
  name: string;
  email: string;
  username: string;
  password: string;
  isActive?: boolean;
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
    createdAt:
      row.created_at?.toISOString?.() ||
      String(row.created_at),
    updatedAt:
      row.updated_at?.toISOString?.() ||
      String(row.updated_at),
  };
}

/**
 * Get all employees.
 *
 * password_hash is intentionally never selected.
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
 * Example:
 * EMP001
 * EMP002
 * EMP003
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

  const nextNumber = Number(
    rows[0]?.next_number || 1,
  );

  return `EMP${String(nextNumber).padStart(3, "0")}`;
}

/**
 * Create a new employee.
 *
 * The plain password is never stored.
 * Only the bcrypt hash is saved.
 */
export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<Employee> {
  const sql = getDatabase();

  const passwordHash = await bcrypt.hash(
    input.password,
    10,
  );

  const id = await generateEmployeeId();

  const now = new Date().toISOString();

  const isActive =
    input.isActive ?? true;

  const rows = await sql`
    INSERT INTO employees (
      id,
      name,
      email,
      username,
      password_hash,
      is_active,
      role,
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
      created_at,
      updated_at
  `;

  const row = rows[0];

  return mapEmployee(row);
}

/**
 * Check whether username or email
 * already belongs to an employee.
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
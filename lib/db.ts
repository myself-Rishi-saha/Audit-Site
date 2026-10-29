
import mysql, { type Pool } from "mysql2/promise";

let pool: Pool | undefined;

export function getDatabase(): Pool {
  if (pool) {
    return pool;
  }

  const uri = process.env.DATABASE_URL;

  if (!uri) {
    throw new Error("DATABASE_URL is not configured");
  }

  const parsed = new URL(uri);

  if (parsed.protocol !== "mysql:") {
    throw new Error(
      "DATABASE_URL must be a MySQL/MariaDB connection URL",
    );
  }

  pool = mysql.createPool({
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.slice(1)),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "Z",
    dateStrings: true,
  });

  return pool;
}

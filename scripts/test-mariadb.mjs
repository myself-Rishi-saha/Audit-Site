import mysql from "mysql2/promise";

async function main() {
  let connection;

  try {
    const url = process.env.DATABASE_URL;

    if (!url?.startsWith("mysql://")) {
      throw new Error("DATABASE_URL is missing or is not a MySQL URL.");
    }

    const parsed = new URL(url);

    connection = await mysql.createConnection({
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: decodeURIComponent(parsed.pathname.slice(1)),
      connectTimeout: 10000,
    });

    const [rows] = await connection.query(
      "SELECT DATABASE() AS database_name, VERSION() AS server_version"
    );

    console.log("MariaDB connection successful!");
    console.log(rows[0]);
  } catch (error) {
    console.error("MariaDB connection failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
}

main();
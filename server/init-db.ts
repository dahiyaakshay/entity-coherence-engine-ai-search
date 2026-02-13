import fs from "fs";
import path from "path";
import pool from "./db.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initDb = async () => {
  const client = await pool.connect();

  try {
    const schemaPath = path.join(__dirname, "../db/schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    console.log("🚀 Running schema migration...");

    await client.query("BEGIN");
    await client.query(schemaSql);
    await client.query("COMMIT");

    console.log("✅ Database initialized successfully.");
    process.exit(0);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error initializing database:", err);
    process.exit(1);

  } finally {
    client.release();
  }
};

initDb();

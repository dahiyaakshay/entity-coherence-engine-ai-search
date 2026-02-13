import pg, { Pool, PoolClient, QueryResult } from "pg";
import dotenv from "dotenv";

dotenv.config();

/* =========================================================
   ENV VALIDATION
========================================================= */

const REQUIRED_ENV = ["DB_HOST", "DB_NAME", "DB_USER"];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.warn(`⚠️  Missing environment variable: ${key}`);
  }
}

/* =========================================================
   POOL CONFIGURATION
========================================================= */

const pool: Pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  port: Number(process.env.DB_PORT || 5432),

  ssl:
    process.env.DB_SSL === "true"
      ? { rejectUnauthorized: false }
      : false,

  // Production tuning
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

/* =========================================================
   INITIAL CONNECTION TEST
========================================================= */

async function testConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    console.log("✅ PostgreSQL connected successfully");
    client.release();
  } catch (err: unknown) {
    console.error("❌ PostgreSQL connection failed");
    console.error(err);
  }
}

testConnection();

/* =========================================================
   SAFE QUERY WRAPPER
========================================================= */

export async function query<T = any>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();

  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    if (process.env.DB_DEBUG === "true") {
      console.log("📊 Query Executed:", {
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    return result;
  } catch (error) {
    console.error("❌ Query Error");
    console.error({
      text,
      error: (error as Error).message,
    });
    throw error;
  }
}

/* =========================================================
   TRANSACTION HELPER
========================================================= */

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Transaction rolled back");
    throw error;
  } finally {
    client.release();
  }
}

/* =========================================================
   HEALTH CHECK
========================================================= */

export async function healthCheck(): Promise<{
  status: "healthy" | "unhealthy";
  poolStats: {
    total: number;
    idle: number;
    waiting: number;
  };
}> {
  try {
    await pool.query("SELECT 1");

    return {
      status: "healthy",
      poolStats: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      },
    };
  } catch {
    return {
      status: "unhealthy",
      poolStats: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      },
    };
  }
}

/* =========================================================
   POOL ERROR LISTENER
========================================================= */

pool.on("error", (err) => {
  console.error("🚨 Unexpected PostgreSQL pool error:");
  console.error(err);
});

/* =========================================================
   GRACEFUL SHUTDOWN
========================================================= */

async function shutdown(): Promise<void> {
  console.log("🔌 Closing PostgreSQL pool...");
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default pool;

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    max: Number(process.env.DB_POOL_MAX || (process.env.NODE_ENV === "production" ? 1 : 10)),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    // Prevent runaway queries from holding connections forever
    statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS || 15_000),
  });

if (!globalForDb.__arenaNextJsPostgresqlPool) {
  // An idle client error must not crash the process
  pool.on("error", (err) => {
    console.error(JSON.stringify({ level: "error", scope: "db-pool", message: err.message, time: new Date().toISOString() }));
  });
}

globalForDb.__arenaNextJsPostgresqlPool = pool;

export const db = drizzle(pool);

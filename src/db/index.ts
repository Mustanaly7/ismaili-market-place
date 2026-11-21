import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * A single, lazily-created connection pool shared across hot reloads in dev.
 * Creating the pool does NOT open a connection; the first query does. This
 * keeps `next build` fast and server startup resilient if the DB is briefly
 * unavailable.
 */
const globalForDb = globalThis as unknown as {
  __ismailiPool?: Pool;
  __ismailiDb?: ReturnType<typeof drizzle<typeof schema>>;
};

function getPool(): Pool {
  if (!globalForDb.__ismailiPool) {
    globalForDb.__ismailiPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return globalForDb.__ismailiPool;
}

export const pool = getPool();

export const db =
  globalForDb.__ismailiDb ?? (globalForDb.__ismailiDb = drizzle(pool, { schema }));

export { schema };

/**
 * Wrap a database call so pages can render a friendly "setup needed" state
 * instead of a hard crash when Postgres is not yet reachable.
 */
export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[db] query failed:", (err as Error).message);
    }
    return fallback;
  }
}
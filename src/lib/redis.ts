import Redis from "ioredis";
import { env, isRedisConfigured } from "./env";

/**
 * Lightweight rate-limiting / caching helper.
 * Uses Redis when configured (production stack) and transparently falls back
 * to an in-process Map so the app still works without Redis running.
 */

let client: Redis | null | undefined;

function getRedis(): Redis | null {
  if (client !== undefined) return client;
  if (!isRedisConfigured()) {
    client = null;
    return null;
  }
  const c = new Redis(env.redisUrl, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null,
  });
  c.on("error", () => {
    /* swallow; we fall back to memory below */
  });
  client = c;
  return c;
}

type MemEntry = { count: number; expiresAt: number };
const memory = new Map<string, MemEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (redis) {
    try {
      if (redis.status === "wait") await redis.connect();
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSeconds);
      return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
    } catch {
      /* fall through to memory */
    }
  }
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.expiresAt < now) {
    memory.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }
  entry.count += 1;
  return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count) };
}
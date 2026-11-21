import bcrypt from "bcryptjs";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, safeQuery } from "@/db";
import { users, type User } from "@/db/schema";
import { getSessionUserId } from "./session";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Load the signed-in user for the current request. Memoized per-request via
 * React `cache` so multiple components share one query.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const rows = await safeQuery(
    () => db.select().from(users).where(eq(users.id, userId)).limit(1),
    [],
  );
  const user = rows[0];
  if (!user || user.suspended) return null;
  return user;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireSeller(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "seller" && user.role !== "admin") redirect("/seller/onboarding");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
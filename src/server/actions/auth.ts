"use server";

import { eq, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/redis";
import { clearSession, setSession } from "@/lib/session";
import { loginSchema, signupSchema } from "@/lib/validation";
import { getStr, normalizePhone, redirectError } from "./_helpers";

export async function signupAction(formData: FormData): Promise<void> {
  const parsed = signupSchema.safeParse({
    name: getStr(formData, "name"),
    identifier: getStr(formData, "identifier"),
    password: getStr(formData, "password"),
    role: getStr(formData, "role") === "seller" ? "seller" : "buyer",
  });
  if (!parsed.success) {
    redirectError("/signup", parsed.error.issues[0]?.message ?? "Please check your details.");
  }
  const data = parsed.data;

  const rl = await rateLimit(`signup:${data.identifier.toLowerCase()}`, 8, 300);
  if (!rl.allowed) {
    redirectError("/signup", "Too many attempts. Please wait a few minutes and try again.");
  }

  const isEmail = data.identifier.includes("@");
  const email = isEmail ? data.identifier.toLowerCase() : null;
  const phone = isEmail ? null : normalizePhone(data.identifier);

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(or(email ? eq(users.email, email) : undefined, phone ? eq(users.phone, phone) : undefined))
    .limit(1);
  if (existing[0]) {
    redirectError("/signup", "An account with that email or phone already exists. Please log in.");
  }

  const passwordHash = await hashPassword(data.password);
  const inserted = await db
    .insert(users)
    .values({ name: data.name, email, phone, passwordHash, role: data.role })
    .returning({ id: users.id });
  const userId = inserted[0]?.id;
  if (!userId) redirectError("/signup", "Something went wrong. Please try again.");

  await setSession(userId);
  if (data.role === "seller") {
    redirect("/seller/onboarding?ok=Welcome! Let us set up your shop.");
  }
  redirect("/account?ok=Welcome to ISMAILI Market Place!");
}

export async function loginAction(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({
    identifier: getStr(formData, "identifier"),
    password: getStr(formData, "password"),
  });
  if (!parsed.success) {
    redirectError("/login", parsed.error.issues[0]?.message ?? "Please check your details.");
  }
  const data = parsed.data;

  const rl = await rateLimit(`login:${data.identifier.toLowerCase()}`, 12, 300);
  if (!rl.allowed) {
    redirectError("/login", "Too many attempts. Please wait a few minutes and try again.");
  }

  const isEmail = data.identifier.includes("@");
  const email = isEmail ? data.identifier.toLowerCase() : null;
  const phone = isEmail ? null : normalizePhone(data.identifier);

  const rows = await db
    .select()
    .from(users)
    .where(or(email ? eq(users.email, email) : undefined, phone ? eq(users.phone, phone) : undefined))
    .limit(1);
  const user = rows[0];
  if (!user) {
    redirectError("/login", "That email/phone and password do not match. Please try again.");
  }
  const ok = await verifyPassword(data.password, user.passwordHash);
  if (!ok) {
    redirectError("/login", "That email/phone and password do not match. Please try again.");
  }
  if (user.suspended) {
    redirectError("/login", "This account is suspended. Please contact support.");
  }

  await setSession(user.id);

  const next = getStr(formData, "next");
  if (next && next.startsWith("/")) redirect(next);
  if (user.role === "admin") redirect("/admin");
  if (user.role === "seller") redirect("/seller/dashboard?ok=Welcome back!");
  redirect("/account?ok=Welcome back!");
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/");
}
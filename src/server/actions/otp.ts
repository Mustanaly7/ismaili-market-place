"use server";

import { and, desc, eq, isNull, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { otpCodes, users } from "@/db/schema";
import { rateLimit } from "@/lib/redis";
import { setSession } from "@/lib/session";
import {
  generateOtp,
  hashOtp,
  otpExpiry,
  otpMatches,
  OTP_MAX_ATTEMPTS,
} from "@/lib/otp";
import { getStr, normalizePhone, redirectError } from "./_helpers";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^[+()\-\s0-9]{6,}$/;

function canonicalIdentifier(raw: string): string | null {
  const value = raw.trim();
  if (EMAIL_RE.test(value)) return value.toLowerCase();
  if (PHONE_RE.test(value)) return normalizePhone(value);
  return null;
}

export async function requestOtpAction(formData: FormData): Promise<void> {
  const identifier = canonicalIdentifier(getStr(formData, "identifier"));
  const purpose = getStr(formData, "purpose") === "signup" ? "signup" : "login";
  const role = getStr(formData, "role") === "seller" ? "seller" : "buyer";
  if (!identifier) {
    redirectError("/login/code", "Enter a valid email or phone number.");
  }

  const rl = await rateLimit(`otp:${identifier}`, 5, 600);
  if (!rl.allowed) {
    redirectError("/login/code", "Too many codes requested. Please wait a few minutes.");
  }

  const code = generateOtp();
  await db.insert(otpCodes).values({
    identifier,
    codeHash: hashOtp(code),
    purpose,
    expiresAt: otpExpiry(),
  });

  // No SMS/email provider is wired in this build — log the code. In a real
  // deployment, hand `code` to your SMS/email gateway here instead.
  console.log(`[otp] ${identifier} (${purpose}) → ${code}`);

  const params = new URLSearchParams({ step: "verify", identifier, purpose, role });
  if (process.env.NODE_ENV !== "production") params.set("devCode", code);
  redirect(`/login/code?${params.toString()}`);
}

export async function verifyOtpAction(formData: FormData): Promise<void> {
  const identifier = canonicalIdentifier(getStr(formData, "identifier"));
  const code = getStr(formData, "code");
  const purpose = getStr(formData, "purpose") === "signup" ? "signup" : "login";
  const role = getStr(formData, "role") === "seller" ? "seller" : "buyer";
  const next = getStr(formData, "next");

  const backParams = new URLSearchParams({ step: "verify", identifier: identifier ?? "", purpose, role });
  const back = `/login/code?${backParams.toString()}`;
  if (!identifier) redirectError("/login/code", "Enter a valid email or phone number.");

  const rows = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.identifier, identifier),
        eq(otpCodes.purpose, purpose),
        isNull(otpCodes.consumedAt),
      ),
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  const record = rows[0];
  if (!record) redirectError(back, "That code is no longer valid. Please request a new one.");
  if (record.expiresAt.getTime() < Date.now()) {
    redirectError(back, "That code has expired. Please request a new one.");
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    redirectError(back, "Too many tries. Please request a new code.");
  }
  if (!otpMatches(code, record.codeHash)) {
    await db
      .update(otpCodes)
      .set({ attempts: record.attempts + 1 })
      .where(eq(otpCodes.id, record.id));
    redirectError(back, "That code is not correct. Please check and try again.");
  }

  await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, record.id));

  const isEmail = identifier.includes("@");
  const email = isEmail ? identifier : null;
  const phone = isEmail ? null : identifier;

  const existingRows = await db
    .select()
    .from(users)
    .where(
      or(
        email ? eq(users.email, email) : undefined,
        phone ? eq(users.phone, phone) : undefined,
      ),
    )
    .limit(1);
  let user = existingRows[0];

  if (!user) {
    const inserted = await db
      .insert(users)
      .values({
        email,
        phone,
        role,
        verificationLevel: phone ? "phone" : "none",
        phoneVerifiedAt: phone ? new Date() : null,
        emailVerifiedAt: email ? new Date() : null,
      })
      .returning();
    user = inserted[0];
  } else {
    const patch: Record<string, unknown> = {};
    if (email) patch.emailVerifiedAt = user.emailVerifiedAt ?? new Date();
    if (phone) {
      patch.phoneVerifiedAt = user.phoneVerifiedAt ?? new Date();
      if (user.verificationLevel === "none") patch.verificationLevel = "phone";
    }
    if (Object.keys(patch).length) {
      await db.update(users).set(patch).where(eq(users.id, user.id));
    }
  }

  if (!user) redirectError("/login/code", "Something went wrong. Please try again.");
  if (user.suspended) redirectError("/login/code", "This account is suspended. Contact support.");
  await setSession(user.id);

  if (next && next.startsWith("/")) redirect(next);
  if (user.role === "admin") redirect("/admin");
  if (user.role === "seller") redirect("/seller/dashboard?ok=Welcome back!");
  redirect("/account?ok=You are signed in.");
}
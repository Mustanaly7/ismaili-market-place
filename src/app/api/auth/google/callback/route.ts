import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { env, isGoogleEnabled } from "@/lib/env";
import { setSession } from "@/lib/session";

export const dynamic = "force-dynamic";

interface GoogleInfo {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

function fail(request: Request, message: string) {
  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
  );
}

export async function GET(request: Request) {
  if (!isGoogleEnabled()) return fail(request, "Google sign-in is not configured.");

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)g_state=([^;]+)/)?.[1];

  if (!code || !state || !cookieState || state !== decodeURIComponent(cookieState)) {
    return fail(request, "Google sign-in failed. Please try again.");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      redirect_uri: `${env.appUrl}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return fail(request, "Could not verify your Google sign-in.");
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) return fail(request, "Google did not return an access token.");

  const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!infoRes.ok) return fail(request, "Could not read your Google profile.");
  const info = (await infoRes.json()) as GoogleInfo;
  if (!info.email) return fail(request, "Your Google account has no email address.");

  const email = info.email.toLowerCase();
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  let user = existing[0];

  if (!user) {
    const inserted = await db
      .insert(users)
      .values({
        name: info.name ?? "",
        email,
        avatarUrl: info.picture ?? null,
        role: "buyer",
        emailVerifiedAt: info.email_verified ? new Date() : null,
      })
      .returning();
    user = inserted[0];
  } else if (user.suspended) {
    return fail(request, "This account is suspended. Please contact support.");
  } else if ((!user.avatarUrl && info.picture) || (!user.name && info.name)) {
    await db
      .update(users)
      .set({ avatarUrl: user.avatarUrl ?? info.picture ?? null, name: user.name || (info.name ?? "") })
      .where(eq(users.id, user.id));
  }

  if (!user) return fail(request, "Something went wrong signing you in.");

  await setSession(user.id);
  const res = NextResponse.redirect(new URL("/account?ok=Signed in with Google.", request.url));
  res.cookies.delete("g_state");
  return res;
}
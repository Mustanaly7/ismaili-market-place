import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { env, isGoogleEnabled } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isGoogleEnabled()) {
    return NextResponse.redirect(
      new URL("/login?error=Google sign-in is not configured on this server.", request.url),
    );
  }
  const state = randomUUID();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", env.google.clientId);
  authUrl.searchParams.set("redirect_uri", `${env.appUrl}/api/auth/google/callback`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set("g_state", state, {
    httpOnly: true,
    path: "/",
    maxAge: 600,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
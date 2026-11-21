"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUserId } from "@/lib/session";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  toLocale,
} from "@/lib/i18n";

/**
 * Persist the visitor's language choice in a cookie (and on their profile when
 * logged in), then re-render so the new locale/RTL direction takes effect.
 */
export async function setLocaleAction(formData: FormData): Promise<void> {
  const raw = formData.get("locale");
  const locale = toLocale(typeof raw === "string" ? raw : undefined);

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const userId = await getSessionUserId();
  if (userId) {
    try {
      await db.update(users).set({ locale }).where(eq(users.id, userId));
    } catch {
      // Best effort — the cookie alone still drives the UI language.
    }
  }

  revalidatePath("/", "layout");
}
"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, verificationRequests } from "@/db/schema";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { notify } from "@/server/notifications";
import { getStr, redirectError, redirectOk } from "./_helpers";

const LEVELS = ["id", "community"] as const;
type Level = (typeof LEVELS)[number];

export async function submitVerificationAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirectError("/login", "Please log in first.");

  const levelRaw = getStr(formData, "level");
  if (!LEVELS.includes(levelRaw as Level)) {
    redirectError("/account/verification", "Choose a verification type.");
  }
  const level = levelRaw as Level;

  const docs = {
    idDocUrl: getStr(formData, "idDocUrl") || null,
    selfieUrl: getStr(formData, "selfieUrl") || null,
    communityRef: getStr(formData, "communityRef") || null,
    note: getStr(formData, "note") || null,
  };
  if (level === "id" && !docs.idDocUrl) {
    redirectError("/account/verification", "Please upload a photo of your ID.");
  }
  if (level === "community" && !docs.communityRef) {
    redirectError("/account/verification", "Tell us who can vouch for you in the community.");
  }

  await db.insert(verificationRequests).values({ userId: user.id, level, docs, status: "pending" });
  revalidatePath("/account/verification");
  redirectOk("/account/verification", "Thank you! Our team will review your request.");
}

export async function reviewVerificationAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const requestId = getStr(formData, "requestId");
  const decision = getStr(formData, "decision") === "approve" ? "approved" : "rejected";
  const note = getStr(formData, "note") || null;

  const rows = await db
    .select()
    .from(verificationRequests)
    .where(eq(verificationRequests.id, requestId))
    .limit(1);
  const request = rows[0];
  if (!request) redirectError("/admin/verifications", "That request was not found.");

  await db
    .update(verificationRequests)
    .set({ status: decision, reviewerId: admin.id, reviewNote: note, reviewedAt: new Date() })
    .where(eq(verificationRequests.id, requestId));

  if (decision === "approved") {
    await db
      .update(users)
      .set({ verificationLevel: request.level, verified: true })
      .where(eq(users.id, request.userId));
    await notify(request.userId, "verification.approved", { level: request.level });
  } else {
    await notify(request.userId, "verification.rejected", { level: request.level, note });
  }

  revalidatePath("/admin/verifications");
  redirectOk("/admin/verifications", decision === "approved" ? "Verification approved." : "Request rejected.");
}
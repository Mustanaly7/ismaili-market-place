"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { dataRequests } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { hasPendingDataRequest } from "@/server/privacy";
import { redirectError, redirectOk } from "./_helpers";

const PRIVACY_PATH = "/account/privacy";

export async function requestDataExportAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirectError("/login", "Please sign in first.");

  if (await hasPendingDataRequest(user.id, "export")) {
    redirectError(PRIVACY_PATH, "You already have an export in progress.");
  }

  await db.insert(dataRequests).values({
    userId: user.id,
    type: "export",
    status: "pending",
  });

  revalidatePath(PRIVACY_PATH);
  redirectOk(PRIVACY_PATH, "Export requested. We will prepare your data and notify you.");
}

export async function requestDataDeleteAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirectError("/login", "Please sign in first.");

  if (await hasPendingDataRequest(user.id, "delete")) {
    redirectError(PRIVACY_PATH, "You already have a deletion request in progress.");
  }

  await db.insert(dataRequests).values({
    userId: user.id,
    type: "delete",
    status: "pending",
  });

  revalidatePath(PRIVACY_PATH);
  redirectOk(
    PRIVACY_PATH,
    "Deletion requested. Our team will review and confirm before removing your account.",
  );
}
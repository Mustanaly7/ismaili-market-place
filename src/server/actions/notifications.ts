"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { markAllNotificationsRead } from "@/server/notifications";

export async function markNotificationsReadAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await markAllNotificationsRead(user.id);
  revalidatePath("/notifications");
  redirect("/notifications");
}
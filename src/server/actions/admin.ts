"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bannedKeywords, businesses, campaigns, categories, collections, mentorshipGuides, payouts, platformSettings, products, reports, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { categorySchema, settingsSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { getBool, getStr, redirectError } from "./_helpers";

export async function approveProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const productId = getStr(formData, "productId");
  await db.update(products).set({ status: "active", updatedAt: new Date() }).where(eq(products.id, productId));
  revalidatePath("/admin/moderation");
  redirect("/admin/moderation?ok=Listing approved.");
}

export async function rejectProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const productId = getStr(formData, "productId");
  await db.update(products).set({ status: "archived", updatedAt: new Date() }).where(eq(products.id, productId));
  revalidatePath("/admin/moderation");
  redirect("/admin/moderation?ok=Listing rejected.");
}

export async function approveBusinessAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const businessId = getStr(formData, "businessId");
  await db.update(businesses).set({ status: "active", updatedAt: new Date() }).where(eq(businesses.id, businessId));
  revalidatePath("/admin/moderation");
  redirect("/admin/moderation?ok=Business approved.");
}

export async function rejectBusinessAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const businessId = getStr(formData, "businessId");
  await db.update(businesses).set({ status: "archived", updatedAt: new Date() }).where(eq(businesses.id, businessId));
  revalidatePath("/admin/moderation");
  redirect("/admin/moderation?ok=Business rejected.");
}

export async function toggleSuspendUserAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = getStr(formData, "userId");
  if (userId === admin.id) redirectError("/admin/users", "You cannot suspend your own account.");
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const target = rows[0];
  if (!target) redirectError("/admin/users", "User not found.");
  if (target.role === "admin") redirectError("/admin/users", "Admins cannot be suspended here.");
  await db.update(users).set({ suspended: !target.suspended }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
  redirect(`/admin/users?ok=${encodeURIComponent(target.suspended ? "User reinstated." : "User suspended.")}`);
}

export async function resolveReportAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const reportId = getStr(formData, "reportId");
  const status = getStr(formData, "status") === "dismissed" ? "dismissed" : "resolved";
  await db
    .update(reports)
    .set({ status, resolutionNote: getStr(formData, "note") || null })
    .where(eq(reports.id, reportId));
  revalidatePath("/admin/reports");
  redirect("/admin/reports?ok=Report updated.");
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    name: getStr(formData, "name"),
    parentId: getStr(formData, "parentId") || null,
  });
  if (!parsed.success) {
    redirectError("/admin/categories", parsed.error.issues[0]?.message ?? "Please check the category.");
  }
  const base = slugify(parsed.data.name) || "category";
  const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, base)).limit(1);
  const slug = existing[0] ? `${base}-${randomUUID().slice(0, 4)}` : base;
  await db.insert(categories).values({
    name: parsed.data.name,
    slug,
    parentId: parsed.data.parentId ?? null,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/browse");
  redirect("/admin/categories?ok=Category added.");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const categoryId = getStr(formData, "categoryId");
  await db.delete(categories).where(eq(categories.id, categoryId));
  revalidatePath("/admin/categories");
  revalidatePath("/browse");
  redirect("/admin/categories?ok=Category removed.");
}

export async function updateSettingsAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse({
    commissionPct: getStr(formData, "commissionPct"),
    autoApprove: getBool(formData, "autoApprove"),
    currency: getStr(formData, "currency") || "USD",
  });
  if (!parsed.success) {
    redirectError("/admin/categories", parsed.error.issues[0]?.message ?? "Please check the settings.");
  }
  const data = parsed.data;
  const commissionBps = Math.round(data.commissionPct * 100);
  await db
    .insert(platformSettings)
    .values({
      id: "default",
      commissionBps,
      autoApprove: data.autoApprove,
      currency: data.currency,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: platformSettings.id,
      set: {
        commissionBps,
        autoApprove: data.autoApprove,
        currency: data.currency,
        updatedAt: new Date(),
      },
    });
  revalidatePath("/admin/categories");
  redirect("/admin/categories?ok=Settings saved.");
}

export async function addBannedKeywordAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const term = getStr(formData, "term").toLowerCase();
  const action = getStr(formData, "action") === "block" ? "block" : "flag";
  if (term.length < 2) redirectError("/admin/moderation", "Enter a word or phrase to block.");
  await db.insert(bannedKeywords).values({ term, action }).onConflictDoNothing();
  revalidatePath("/admin/moderation");
  redirect("/admin/moderation?ok=Banned word added.");
}

export async function removeBannedKeywordAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = getStr(formData, "id");
  await db.delete(bannedKeywords).where(eq(bannedKeywords.id, id));
  revalidatePath("/admin/moderation");
  redirect("/admin/moderation?ok=Word removed.");
}

export async function createCollectionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const title = getStr(formData, "title");
  const description = getStr(formData, "description");
  const kind = getStr(formData, "kind") || "custom";
  const imageUrl = getStr(formData, "imageUrl") || null;
  if (!title) redirectError("/admin/collections", "Give the collection a title.");
  await db.insert(collections).values({
    title,
    slug: slugify(title) || "collection-" + randomUUID().slice(0, 6),
    description,
    kind,
    imageUrl,
  });
  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  redirect("/admin/collections?ok=Collection created.");
}

export async function toggleCollectionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = getStr(formData, "id");
  const active = getBool(formData, "active");
  await db.update(collections).set({ active }).where(eq(collections.id, id));
  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  redirect("/admin/collections?ok=Collection updated.");
}

export async function deleteCollectionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = getStr(formData, "id");
  await db.delete(collections).where(eq(collections.id, id));
  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  redirect("/admin/collections?ok=Collection deleted.");
}

export async function createCampaignAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const title = getStr(formData, "title");
  const body = getStr(formData, "body");
  const audience = getStr(formData, "audience") || "all";
  const status = getStr(formData, "status") || "draft";
  if (!title) redirectError("/admin/campaigns", "Give the campaign a title.");
  await db.insert(campaigns).values({ title, body, audience, status, createdBy: admin.id });
  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns?ok=Campaign created.");
}

export async function setCampaignStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = getStr(formData, "id");
  const status = getStr(formData, "status");
  await db.update(campaigns).set({ status }).where(eq(campaigns.id, id));
  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns?ok=Campaign updated.");
}

export async function createGuideAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const title = getStr(formData, "title");
  const summary = getStr(formData, "summary");
  const videoUrl = getStr(formData, "videoUrl") || null;
  const category = getStr(formData, "category") || "";
  if (!title) redirectError("/admin/campaigns", "Give the guide a title.");
  await db.insert(mentorshipGuides).values({ title, summary, videoUrl, category });
  revalidatePath("/admin/campaigns");
  revalidatePath("/guides");
  redirect("/admin/campaigns?ok=Guide added.");
}

export async function markPayoutPaidAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = getStr(formData, "id");
  await db.update(payouts).set({ status: "paid" }).where(eq(payouts.id, id));
  revalidatePath("/admin/payouts");
  redirect("/admin/payouts?ok=Payout marked paid.");
}

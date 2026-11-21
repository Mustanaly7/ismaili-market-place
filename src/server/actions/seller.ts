"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { businesses, orders, productImages, products, reviews, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getPlatformSettings } from "@/server/admin";
import { getBusinessByOwner } from "@/server/seller";
import { notify } from "@/server/notifications";
import { recordOrderEvent } from "@/server/orders";
import { onboardingSchema, productSchema } from "@/lib/validation";
import { parsePriceToCents, slugify } from "@/lib/utils";
import { getBool, getList, getStr, redirectError } from "./_helpers";

async function requireBusiness() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const biz = await getBusinessByOwner(user.id);
  if (!biz) redirect("/seller/onboarding");
  return { user, biz };
}

function onboardingValues(formData: FormData) {
  const contactMethodRaw = getStr(formData, "contactMethod");
  const paymentModeRaw = getStr(formData, "paymentMode");
  return onboardingSchema.safeParse({
    name: getStr(formData, "name"),
    category: getStr(formData, "category"),
    description: getStr(formData, "description"),
    location: getStr(formData, "location"),
    contactMethod: ["message", "phone", "email"].includes(contactMethodRaw)
      ? contactMethodRaw
      : "message",
    contactPhone: getStr(formData, "contactPhone"),
    contactEmail: getStr(formData, "contactEmail"),
    businessHours: getStr(formData, "businessHours"),
    logoUrl: getStr(formData, "logoUrl"),
    coverUrl: getStr(formData, "coverUrl"),
    paymentMode: paymentModeRaw === "contact" ? "contact" : "online",
  });
}

export async function completeOnboardingAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = onboardingValues(formData);
  if (!parsed.success) {
    redirectError("/seller/onboarding", parsed.error.issues[0]?.message ?? "Please check your details.");
  }
  const data = parsed.data;

  const values = {
    name: data.name,
    category: data.category,
    description: data.description,
    location: data.location,
    contactMethod: data.contactMethod,
    contactPhone: data.contactPhone || null,
    contactEmail: data.contactEmail || null,
    businessHours: data.businessHours || null,
    logoUrl: data.logoUrl || null,
    coverUrl: data.coverUrl || null,
    paymentMode: data.paymentMode,
    updatedAt: new Date(),
  };

  const existing = await getBusinessByOwner(user.id);
  if (existing) {
    await db.update(businesses).set(values).where(eq(businesses.id, existing.id));
  } else {
    const settings = await getPlatformSettings();
    const slug = `${slugify(data.name) || "shop"}-${randomUUID().slice(0, 6)}`;
    await db.insert(businesses).values({
      ...values,
      ownerUserId: user.id,
      slug,
      status: settings.autoApprove ? "active" : "pending",
      commissionBps: settings.commissionBps,
    });
  }

  if (user.role !== "seller") {
    await db.update(users).set({ role: "seller", name: user.name || data.name }).where(eq(users.id, user.id));
  }

  revalidatePath("/");
  redirect("/seller/dashboard?ok=Your shop is ready. Add your first product below.");
}

export async function updateBusinessAction(formData: FormData): Promise<void> {
  const { biz } = await requireBusiness();
  const parsed = onboardingValues(formData);
  if (!parsed.success) {
    redirectError("/seller/settings", parsed.error.issues[0]?.message ?? "Please check your details.");
  }
  const data = parsed.data;
  await db
    .update(businesses)
    .set({
      name: data.name,
      category: data.category,
      description: data.description,
      location: data.location,
      contactMethod: data.contactMethod,
      contactPhone: data.contactPhone || null,
      contactEmail: data.contactEmail || null,
      businessHours: data.businessHours || null,
      logoUrl: data.logoUrl || null,
      coverUrl: data.coverUrl || null,
      paymentMode: data.paymentMode,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, biz.id));
  revalidatePath("/seller/settings");
  redirect("/seller/settings?ok=Your business details were saved.");
}

function productValues(formData: FormData) {
  return productSchema.safeParse({
    name: getStr(formData, "name"),
    priceCents: parsePriceToCents(getStr(formData, "price")),
    quantity: Number(getStr(formData, "quantity") || "0"),
    description: getStr(formData, "description"),
    category: getStr(formData, "category"),
    allowBackorder: getBool(formData, "allowBackorder"),
    images: getList(formData, "images"),
  });
}

export async function createProductAction(formData: FormData): Promise<void> {
  const { biz } = await requireBusiness();
  const parsed = productValues(formData);
  if (!parsed.success) {
    redirectError("/seller/products/new", parsed.error.issues[0]?.message ?? "Please check the product.");
  }
  const data = parsed.data;
  const settings = await getPlatformSettings();
  const status =
    data.quantity <= 0 && !data.allowBackorder
      ? "sold_out"
      : settings.autoApprove
        ? "active"
        : "pending";

  const inserted = await db
    .insert(products)
    .values({
      businessId: biz.id,
      name: data.name,
      description: data.description,
      priceCents: data.priceCents,
      quantity: data.quantity,
      status,
      allowBackorder: data.allowBackorder,
      category: data.category || biz.category,
    })
    .returning({ id: products.id });
  const productId = inserted[0]?.id;
  if (!productId) redirectError("/seller/products/new", "Could not save the product. Please try again.");

  if (data.images.length) {
    await db
      .insert(productImages)
      .values(data.images.map((url, i) => ({ productId, url, sort: i })));
  }

  revalidatePath("/");
  revalidatePath("/seller/products");
  redirect("/seller/products?ok=Product added.");
}

export async function updateProductAction(formData: FormData): Promise<void> {
  const { biz } = await requireBusiness();
  const productId = getStr(formData, "productId");
  const existing = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.businessId, biz.id)))
    .limit(1);
  if (!existing[0]) redirectError("/seller/products", "That product was not found.");

  const parsed = productValues(formData);
  if (!parsed.success) {
    redirectError(`/seller/products/${productId}/edit`, parsed.error.issues[0]?.message ?? "Please check the product.");
  }
  const data = parsed.data;
  const status = data.quantity <= 0 && !data.allowBackorder ? "sold_out" : "active";

  await db
    .update(products)
    .set({
      name: data.name,
      description: data.description,
      priceCents: data.priceCents,
      quantity: data.quantity,
      status,
      allowBackorder: data.allowBackorder,
      category: data.category,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));

  await db.delete(productImages).where(eq(productImages.productId, productId));
  if (data.images.length) {
    await db
      .insert(productImages)
      .values(data.images.map((url, i) => ({ productId, url, sort: i })));
  }

  revalidatePath("/");
  revalidatePath("/seller/products");
  redirect(`/seller/products/${productId}/edit?ok=Product saved.`);
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const { biz } = await requireBusiness();
  const productId = getStr(formData, "productId");
  await db
    .delete(products)
    .where(and(eq(products.id, productId), eq(products.businessId, biz.id)));
  revalidatePath("/");
  revalidatePath("/seller/products");
  redirect("/seller/products?ok=Product deleted.");
}

export async function duplicateProductAction(formData: FormData): Promise<void> {
  const { biz } = await requireBusiness();
  const productId = getStr(formData, "productId");
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.businessId, biz.id)))
    .limit(1);
  const src = rows[0];
  if (!src) redirectError("/seller/products", "That product was not found.");

  const inserted = await db
    .insert(products)
    .values({
      businessId: biz.id,
      name: `${src.name} (copy)`,
      description: src.description,
      priceCents: src.priceCents,
      quantity: src.quantity,
      status: src.quantity > 0 ? "active" : "sold_out",
      allowBackorder: src.allowBackorder,
      category: src.category,
    })
    .returning({ id: products.id });
  const newId = inserted[0]?.id;

  const imgs = await db
    .select({ url: productImages.url, sort: productImages.sort })
    .from(productImages)
    .where(eq(productImages.productId, productId));
  if (newId && imgs.length) {
    await db.insert(productImages).values(imgs.map((i) => ({ productId: newId, url: i.url, sort: i.sort })));
  }

  revalidatePath("/");
  revalidatePath("/seller/products");
  redirect("/seller/products?ok=Product duplicated.");
}

export async function bulkProductAction(formData: FormData): Promise<void> {
  const { biz } = await requireBusiness();
  const action = getStr(formData, "action");
  const ids = getList(formData, "ids");
  if (ids.length === 0) redirectError("/seller/products", "Please select at least one product first.");

  if (action === "delete") {
    await db.delete(products).where(and(eq(products.businessId, biz.id), inArray(products.id, ids)));
  } else if (action === "out_of_stock") {
    await db
      .update(products)
      .set({ status: "sold_out", updatedAt: new Date() })
      .where(and(eq(products.businessId, biz.id), inArray(products.id, ids)));
  }

  revalidatePath("/");
  revalidatePath("/seller/products");
  redirect("/seller/products?ok=Products updated.");
}

export async function startOverAction(formData: FormData): Promise<void> {
  const { biz } = await requireBusiness();
  if (getStr(formData, "confirm") !== "yes") {
    redirectError("/seller/start-over", "Please tick the box to confirm you understand.");
  }
  const mode = getStr(formData, "mode") === "delete" ? "delete" : "archive";

  if (mode === "archive") {
    await db
      .update(businesses)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(businesses.id, biz.id));
    await db.update(products).set({ status: "archived" }).where(eq(products.businessId, biz.id));
  } else {
    await db.delete(businesses).where(eq(businesses.id, biz.id));
  }

  revalidatePath("/");
  redirect("/seller/onboarding?ok=Your business was removed. You can start a new one now.");
}

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  const { biz } = await requireBusiness();
  const orderId = getStr(formData, "orderId");
  const status = getStr(formData, "status");
  const allowed = ["confirmed", "shipped", "completed", "cancelled"];
  if (!allowed.includes(status)) redirectError("/seller/orders", "Unknown order status.");

  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.businessId, biz.id)))
    .limit(1);
  const order = rows[0];
  if (!order) redirectError("/seller/orders", "That order was not found.");

  const patch: {
    status: string;
    updatedAt: Date;
    paymentStatus?: string;
    escrowStatus?: string;
    shippedAt?: Date;
    completedAt?: Date;
  } = { status, updatedAt: new Date() };
  if (status === "completed" && order.paymentMode === "online") patch.paymentStatus = "paid";
  if (status === "shipped") patch.shippedAt = new Date();
  if (status === "completed") {
    patch.completedAt = new Date();
    if (order.escrowStatus === "held") patch.escrowStatus = "released";
  }
  if (status === "cancelled" && order.escrowStatus === "held") patch.escrowStatus = "refunded";

  await db.update(orders).set(patch).where(eq(orders.id, orderId));
  await recordOrderEvent(orderId, status, `Seller marked the order ${status}`, biz.ownerUserId);
  await notify(order.buyerId, `order.${status}`, { orderId, status });
  revalidatePath("/seller/orders");
  redirect("/seller/orders?ok=Order updated.");
}

export async function markOrderPaidAction(formData: FormData): Promise<void> {
  const { biz } = await requireBusiness();
  const orderId = getStr(formData, "orderId");
  await db
    .update(orders)
    .set({ paymentStatus: "paid", updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.businessId, biz.id)));
  await recordOrderEvent(orderId, "paid", "Seller marked the order as paid", biz.ownerUserId);
  revalidatePath("/seller/orders");
  redirect("/seller/orders?ok=Marked as paid.");
}
export async function replyToReviewAction(formData: FormData): Promise<void> {
  const { biz } = await requireBusiness();
  const reviewId = getStr(formData, "reviewId");
  const reply = getStr(formData, "reply");
  if (reply.length < 2) redirectError("/seller/reviews", "Please write a short reply.");
  await db
    .update(reviews)
    .set({ sellerReply: reply })
    .where(and(eq(reviews.id, reviewId), eq(reviews.businessId, biz.id)));
  revalidatePath("/seller/reviews");
  redirect("/seller/reviews?ok=Reply posted.");
}

export async function connectStripeAction(): Promise<void> {
  const { user, biz } = await requireBusiness();
  const { createConnectAccount, createAccountLink } = await import("@/lib/stripe");
  const { isStripeEnabled } = await import("@/lib/env");

  let accountId = biz.stripeAccountId;
  if (!accountId) {
    const account = await createConnectAccount(user.email, biz.name);
    accountId = account.accountId;
    await db
      .update(businesses)
      .set({ stripeAccountId: accountId, updatedAt: new Date() })
      .where(eq(businesses.id, biz.id));
  }

  if (!isStripeEnabled()) {
    revalidatePath("/seller/payouts");
    redirect(
      "/seller/payouts?ok=Stripe is not configured on this server, so payouts are handled manually by the platform team.",
    );
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = await createAccountLink(
    accountId,
    `${origin}/seller/payouts`,
    `${origin}/seller/payouts`,
  );
  if (!link.url) {
    redirect("/seller/payouts?ok=Payout account created. Finish setup in Stripe.");
  }
  redirect(link.url);
}
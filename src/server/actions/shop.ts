"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  businesses,
  favorites,
  messages,
  orderItems,
  orders,
  payments,
  productImages,
  products,
  reports,
  reviews,
  threads,
  welfareContributions,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { createPaymentIntent, createRefund } from "@/lib/stripe";
import { getPlatformSettings } from "@/server/admin";
import { notify } from "@/server/notifications";
import { recordOrderEvent } from "@/server/orders";
import { translateText } from "@/lib/translate";
import { getLocale } from "@/lib/locale-server";
import { checkoutSchema, messageSchema, reportSchema, reviewSchema } from "@/lib/validation";
import { getStr, redirectError, redirectOk } from "./_helpers";

interface CartLineInput {
  productId: string;
  qty: number;
}

export async function placeOrderAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");

  const parsed = checkoutSchema.safeParse({
    shippingName: getStr(formData, "shippingName"),
    shippingPhone: getStr(formData, "shippingPhone"),
    shippingAddress: getStr(formData, "shippingAddress"),
    note: getStr(formData, "note"),
    paymentMode: getStr(formData, "paymentMode") === "contact" ? "contact" : "online",
  });
  if (!parsed.success) {
    redirectError("/checkout", parsed.error.issues[0]?.message ?? "Please check your details.");
  }
  const data = parsed.data;

  let lines: CartLineInput[] = [];
  try {
    const raw = JSON.parse(getStr(formData, "items") || "[]");
    if (!Array.isArray(raw)) throw new Error("bad");
    lines = raw
      .map((r) => ({ productId: String(r.productId), qty: Math.max(1, Number(r.qty) || 1) }))
      .filter((r) => r.productId);
  } catch {
    redirectError("/checkout", "Your cart could not be read. Please try again.");
  }
  if (lines.length === 0) redirectError("/checkout", "Your cart is empty.");

  const productIds = lines.map((l) => l.productId);
  const rows = await db
    .select({ product: products, business: businesses })
    .from(products)
    .innerJoin(businesses, eq(products.businessId, businesses.id))
    .where(inArray(products.id, productIds));

  if (rows.length === 0) redirectError("/checkout", "The items in your cart are no longer available.");

  const businessIds = Array.from(new Set(rows.map((r) => r.business.id)));
  if (businessIds.length > 1) {
    redirectError(
      "/checkout",
      "Please check out one seller at a time. Try removing items from other sellers, or message them to combine an order.",
    );
  }
  const business = rows[0].business;
  const byId = new Map(rows.map((r) => [r.product.id, r.product]));

  const imageRows = await db
    .select({ productId: productImages.productId, url: productImages.url })
    .from(productImages)
    .where(inArray(productImages.productId, productIds));
  const imageMap = new Map<string, string>();
  for (const img of imageRows) if (!imageMap.has(img.productId)) imageMap.set(img.productId, img.url);

  let subtotalCents = 0;
  const resolved: { product: typeof products.$inferSelect; qty: number }[] = [];
  for (const line of lines) {
    const product = byId.get(line.productId);
    if (!product || product.status !== "active") {
      redirectError("/checkout", "An item in your cart is no longer available. Please review your cart.");
    }
    if (!product.allowBackorder && product.quantity < line.qty) {
      redirectError("/checkout", `Only ${product.quantity} left of "${product.name}". Please update the quantity.`);
    }
    subtotalCents += product.priceCents * line.qty;
    resolved.push({ product, qty: line.qty });
  }

  const settings = await getPlatformSettings();
  const currency = settings.currency || "USD";

  const PROVIDERS = ["stripe", "cod", "bank", "jazzcash", "easypaisa", "razorpay", "mpesa"];
  const providerRaw = getStr(formData, "paymentProvider") || "stripe";
  const paymentProvider = PROVIDERS.includes(providerRaw) ? providerRaw : "stripe";
  const deliveryRaw = getStr(formData, "deliveryMethod");
  const deliveryMethod = ["shipping", "pickup", "digital"].includes(deliveryRaw)
    ? deliveryRaw
    : "shipping";

  const commissionCents = Math.round((subtotalCents * business.commissionBps) / 10000);
  const effectiveMode =
    business.paymentMode === "contact" ? "contact" : data.paymentMode === "contact" ? "contact" : "online";

  const processingFeeCents =
    effectiveMode === "online" && paymentProvider === "stripe"
      ? Math.round(subtotalCents * 0.029) + 30
      : 0;

  const wantsRoundUp = getStr(formData, "welfareRoundUp") === "on" || getStr(formData, "welfareRoundUp") === "true";
  const roundUpAllowed = Boolean(settings.roundUpEnabled) && Boolean(business.welfareRoundUpEnabled);
  const welfareRoundUpCents =
    wantsRoundUp && roundUpAllowed
      ? Math.ceil((subtotalCents + 1) / 100) * 100 - subtotalCents
      : 0;

  const totalCents = subtotalCents + welfareRoundUpCents;
  const sellerPayoutCents = Math.max(0, subtotalCents - commissionCents);

  let paymentStatus = "unpaid";
  let orderStatus = "pending";
  let escrowStatus = "none";
  let paymentRef: string | null = null;

  if (effectiveMode === "online" && paymentProvider === "stripe") {
    const intent = await createPaymentIntent(totalCents, { businessId: business.id });
    paymentRef = intent.id;
    if (intent.simulated) {
      paymentStatus = "paid";
      orderStatus = "confirmed";
      escrowStatus = "held";
    }
  } else if (effectiveMode === "online") {
    paymentRef = `${paymentProvider}_${Date.now()}`;
  }

  const inserted = await db
    .insert(orders)
    .values({
      buyerId: user.id,
      businessId: business.id,
      status: orderStatus,
      paymentStatus,
      paymentMode: effectiveMode,
      deliveryMethod,
      escrowStatus,
      paymentProvider,
      paymentRef,
      currency,
      subtotalCents,
      totalCents,
      commissionCents,
      processingFeeCents,
      sellerPayoutCents,
      welfareRoundUpCents,
      shippingName: data.shippingName,
      shippingPhone: data.shippingPhone,
      shippingAddress: data.shippingAddress,
      note: data.note,
      paidAt: paymentStatus === "paid" ? new Date() : null,
    })
    .returning({ id: orders.id });
  const orderId = inserted[0]?.id;
  if (!orderId) redirectError("/checkout", "We could not place your order. Please try again.");

  await db.insert(orderItems).values(
    resolved.map((r) => ({
      orderId,
      productId: r.product.id,
      nameSnapshot: r.product.name,
      imageSnapshot: imageMap.get(r.product.id) ?? null,
      kindSnapshot: r.product.kind,
      currency,
      priceCents: r.product.priceCents,
      qty: r.qty,
      commissionBps: business.commissionBps,
    })),
  );

  if (effectiveMode === "online") {
    await db.insert(payments).values({
      orderId,
      provider: paymentProvider,
      providerRef: paymentRef,
      amountCents: totalCents,
      currency,
      status: paymentStatus === "paid" ? "succeeded" : "pending",
      raw: { simulated: Boolean(paymentRef?.startsWith("sim_")) },
    });
  }
  if (welfareRoundUpCents > 0) {
    await db.insert(welfareContributions).values({
      orderId,
      businessId: business.id,
      amountCents: welfareRoundUpCents,
      currency,
    });
  }

  await recordOrderEvent(
    orderId,
    orderStatus,
    effectiveMode === "online" ? "Payment received" : "Order placed — pay the seller directly",
    user.id,
  );
  if (escrowStatus === "held") {
    await recordOrderEvent(orderId, "escrow_held", "Payment held safely in escrow until delivery", user.id);
  }
  await notify(business.ownerUserId, "order.new", {
    orderId,
    totalCents,
    buyerName: user.name || "A buyer",
  });

  for (const r of resolved) {
    if (r.product.allowBackorder) {
      await db
        .update(products)
        .set({ soldCount: sql`${products.soldCount} + ${r.qty}`, updatedAt: new Date() })
        .where(eq(products.id, r.product.id));
    } else {
      await db
        .update(products)
        .set({
          quantity: sql`greatest(${products.quantity} - ${r.qty}, 0)`,
          status: sql`case when ${products.quantity} - ${r.qty} <= 0 then 'sold_out' else ${products.status} end`,
          soldCount: sql`${products.soldCount} + ${r.qty}`,
          updatedAt: new Date(),
        })
        .where(eq(products.id, r.product.id));
    }
  }

  revalidatePath("/");
  revalidatePath("/seller/orders");
  redirect(`/order/${orderId}`);
}

export async function toggleFavoriteAction(formData: FormData): Promise<void> {
  const next = getStr(formData, "next") || "/account/favorites";
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  const productId = getStr(formData, "productId");

  const existing = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.productId, productId)))
    .limit(1);
  if (existing[0]) {
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
  } else {
    await db.insert(favorites).values({ userId: user.id, productId });
  }
  revalidatePath("/account/favorites");
  redirect(next);
}

export async function submitReviewAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const orderId = getStr(formData, "orderId");
  const parsed = reviewSchema.safeParse({
    rating: getStr(formData, "rating"),
    comment: getStr(formData, "comment"),
  });
  if (!parsed.success) {
    redirectError(`/account/orders/${orderId}`, "Please choose a star rating.");
  }
  const data = parsed.data;

  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.buyerId, user.id)))
    .limit(1);
  const order = rows[0];
  if (!order) redirectError("/account/orders", "That order was not found.");
  if (order.status !== "completed") {
    redirectError(`/account/orders/${orderId}`, "You can review an order once it is completed.");
  }
  const existing = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.orderId, orderId)).limit(1);
  if (existing[0]) redirectError(`/account/orders/${orderId}`, "You already reviewed this order.");

  await db.insert(reviews).values({
    orderId,
    buyerId: user.id,
    businessId: order.businessId,
    rating: data.rating,
    comment: data.comment,
  });
  revalidatePath(`/account/orders/${orderId}`);
  redirectOk(`/account/orders/${orderId}`, "Thank you for your review!");
}

export async function submitReportAction(formData: FormData): Promise<void> {
  const next = getStr(formData, "next") || "/";
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  const parsed = reportSchema.safeParse({
    targetType: getStr(formData, "targetType"),
    targetId: getStr(formData, "targetId"),
    reason: getStr(formData, "reason"),
  });
  if (!parsed.success) {
    redirectError(next, parsed.error.issues[0]?.message ?? "Please tell us what is wrong.");
  }
  await db.insert(reports).values({
    reporterId: user.id,
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
    reason: parsed.data.reason,
  });
  redirectOk(next, "Thanks. Our team will take a look.");
}

export async function startThreadAction(formData: FormData): Promise<void> {
  const next = getStr(formData, "next") || "/";
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);

  const businessId = getStr(formData, "businessId");
  const productId = getStr(formData, "productId") || null;
  const subject = getStr(formData, "subject") || "Question about your shop";
  const body = getStr(formData, "message");

  const parsed = messageSchema.safeParse({ body });
  if (!parsed.success) redirectError(next, "Please type a message to the seller.");

  const inserted = await db
    .insert(threads)
    .values({ buyerId: user.id, businessId, productId, subject, lastMessageAt: new Date() })
    .returning({ id: threads.id });
  const threadId = inserted[0]?.id;
  if (!threadId) redirectError(next, "Could not start the conversation. Please try again.");

  const bodyLang = await getLocale();
  await db.insert(messages).values({ threadId, senderId: user.id, body: parsed.data.body, bodyOriginal: parsed.data.body, bodyLang });
  redirect(`/messages/${threadId}`);
}

export async function replyAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const threadId = getStr(formData, "threadId");
  const parsed = messageSchema.safeParse({ body: getStr(formData, "body") });
  if (!parsed.success) redirectError(`/messages/${threadId}`, "Please type a message.");

  const rows = await db
    .select({ thread: threads, business: businesses })
    .from(threads)
    .innerJoin(businesses, eq(threads.businessId, businesses.id))
    .where(eq(threads.id, threadId))
    .limit(1);
  const row = rows[0];
  if (!row) redirectError("/messages", "That conversation was not found.");
  const allowed = row.thread.buyerId === user.id || row.business.ownerUserId === user.id || user.role === "admin";
  if (!allowed) redirectError("/messages", "You cannot reply to this conversation.");

  const bodyLang = await getLocale();
  await db
    .insert(messages)
    .values({ threadId, senderId: user.id, body: parsed.data.body, bodyOriginal: parsed.data.body, bodyLang });
  await db.update(threads).set({ lastMessageAt: new Date() }).where(eq(threads.id, threadId));
  revalidatePath(`/messages/${threadId}`);
  redirect(`/messages/${threadId}`);
}

export async function translateMessageAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const threadId = getStr(formData, "threadId");
  const messageId = getStr(formData, "messageId");

  const rows = await db
    .select({ thread: threads, business: businesses })
    .from(threads)
    .innerJoin(businesses, eq(threads.businessId, businesses.id))
    .where(eq(threads.id, threadId))
    .limit(1);
  const row = rows[0];
  if (!row) redirectError("/messages", "That conversation was not found.");
  const allowed =
    row.thread.buyerId === user.id || row.business.ownerUserId === user.id || user.role === "admin";
  if (!allowed) redirectError("/messages", "You cannot translate this conversation.");

  const msgRows = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
  const msg = msgRows[0];
  if (!msg) redirectError(`/messages/${threadId}`, "That message was not found.");

  const target = await getLocale();
  const source = msg.bodyLang || undefined;
  const translated = await translateText(msg.body, target, source);
  if (!translated) {
    redirectError(`/messages/${threadId}`, "Translation is not available right now.");
  }
  await db
    .update(messages)
    .set({ bodyTranslated: translated, translatedLang: target })
    .where(eq(messages.id, messageId));
  revalidatePath(`/messages/${threadId}`);
  redirect(`/messages/${threadId}`);
}


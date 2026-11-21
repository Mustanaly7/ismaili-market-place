"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, disputes, orders, payments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { createRefund } from "@/lib/stripe";
import { notify } from "@/server/notifications";
import { recordOrderEvent } from "@/server/orders";
import { getStr, redirectError, redirectOk } from "./_helpers";

export async function openDisputeAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const orderId = getStr(formData, "orderId");
  const reason = getStr(formData, "reason");
  if (reason.length < 5) {
    redirectError(`/account/orders/${orderId}`, "Please describe the problem in a little more detail.");
  }

  const rows = await db
    .select({ order: orders, business: businesses })
    .from(orders)
    .innerJoin(businesses, eq(orders.businessId, businesses.id))
    .where(and(eq(orders.id, orderId), eq(orders.buyerId, user.id)))
    .limit(1);
  const row = rows[0];
  if (!row) redirectError("/account/orders", "That order was not found.");

  const existing = await db
    .select({ id: disputes.id })
    .from(disputes)
    .where(and(eq(disputes.orderId, orderId), eq(disputes.status, "open")))
    .limit(1);
  if (existing[0]) {
    redirectError(`/account/orders/${orderId}`, "You already have an open case for this order.");
  }

  await db.insert(disputes).values({ orderId, openedBy: user.id, reason, status: "open" });
  await recordOrderEvent(orderId, "dispute_opened", "Buyer opened a dispute", user.id);
  await notify(row.business.ownerUserId, "dispute.opened", { orderId, reason });
  revalidatePath(`/account/orders/${orderId}`);
  redirectOk(`/account/orders/${orderId}`, "Your case has been opened. Our team will help resolve it.");
}

export async function refundOrderAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const orderId = getStr(formData, "orderId");
  const back = getStr(formData, "back") || "/admin/disputes";

  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = rows[0];
  if (!order) redirectError(back, "Order not found.");

  const bizRows = await db
    .select({ ownerUserId: businesses.ownerUserId })
    .from(businesses)
    .where(eq(businesses.id, order.businessId))
    .limit(1);
  const isOwner = bizRows[0]?.ownerUserId === user.id;
  if (user.role !== "admin" && !isOwner) redirectError(back, "You cannot refund this order.");

  const paymentRows = await db
    .select({ providerRef: payments.providerRef, amountCents: payments.amountCents })
    .from(payments)
    .where(and(eq(payments.orderId, orderId), eq(payments.status, "succeeded")))
    .limit(1);

  try {
    const ref = paymentRows[0]?.providerRef;
    if (ref) await createRefund(ref, order.totalCents);
  } catch {
    // Refund provider failures should not block marking the order refunded in-app.
  }

  await db
    .update(orders)
    .set({
      paymentStatus: "refunded",
      escrowStatus: "refunded",
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  await db
    .update(disputes)
    .set({ status: "refunded", resolvedAt: new Date(), resolution: "Refunded to buyer" })
    .where(and(eq(disputes.orderId, orderId), eq(disputes.status, "open")));

  await recordOrderEvent(orderId, "refunded", "Order refunded", user.id);
  await notify(order.buyerId, "order.refunded", { orderId });
  revalidatePath(back);
  revalidatePath(`/account/orders/${orderId}`);
  redirectOk(back, "Order refunded and the buyer has been notified.");
}

export async function resolveDisputeAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");
  const disputeId = getStr(formData, "disputeId");
  const resolution = getStr(formData, "resolution");
  const status = getStr(formData, "status") === "rejected" ? "rejected" : "resolved";

  const rows = await db.select().from(disputes).where(eq(disputes.id, disputeId)).limit(1);
  const dispute = rows[0];
  if (!dispute) redirectError("/admin/disputes", "Dispute not found.");

  await db
    .update(disputes)
    .set({ status, resolution, adminNote: resolution, resolvedAt: new Date() })
    .where(eq(disputes.id, disputeId));
  await notify(dispute.openedBy, "dispute.resolved", { disputeId, status });
  revalidatePath("/admin/disputes");
  redirectOk("/admin/disputes", "Dispute updated.");
}

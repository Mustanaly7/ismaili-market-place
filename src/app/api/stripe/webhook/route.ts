import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { verifyStripeSignature } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Optional Stripe webhook receiver. Verifies the signature and marks a matching
 * order as paid when Stripe confirms the payment intent succeeded. Safe to leave
 * unused when running with simulated payments.
 */
export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  if (!verifyStripeSignature(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const metadata = (event.data?.object?.metadata ?? {}) as Record<string, string>;
    const orderId = metadata.orderId;
    if (orderId) {
      const existing = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, orderId)).limit(1);
      if (existing[0]) {
        await db
          .update(orders)
          .set({ paymentStatus: "paid", status: "confirmed", updatedAt: new Date() })
          .where(eq(orders.id, orderId));
      }
    }
  }

  return NextResponse.json({ received: true });
}
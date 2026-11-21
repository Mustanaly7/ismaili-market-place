import { asc, eq } from "drizzle-orm";
import { db, safeQuery } from "@/db";
import { orderEvents } from "@/db/schema";

export interface OrderEventRow {
  id: string;
  orderId: string;
  status: string;
  note: string;
  actorId: string | null;
  createdAt: Date;
}

/** Append an immutable entry to an order's timeline. Never throws. */
export async function recordOrderEvent(
  orderId: string,
  status: string,
  note = "",
  actorId: string | null = null,
): Promise<void> {
  await safeQuery(async () => {
    await db.insert(orderEvents).values({ orderId, status, note, actorId });
    return true;
  }, false);
}

export async function getOrderEvents(orderId: string): Promise<OrderEventRow[]> {
  return safeQuery(
    () =>
      db
        .select()
        .from(orderEvents)
        .where(eq(orderEvents.orderId, orderId))
        .orderBy(asc(orderEvents.createdAt)),
    [],
  );
}
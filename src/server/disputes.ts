import { and, desc, eq } from "drizzle-orm";
import { db, safeQuery } from "@/db";
import { businesses, disputes, orders, users } from "@/db/schema";

export interface DisputeRow {
  dispute: typeof disputes.$inferSelect;
  order: typeof orders.$inferSelect;
  businessName: string;
  openedByName: string;
}

export async function getDisputeForOrder(orderId: string, openerId: string) {
  return safeQuery(
    async () => {
      const rows = await db
        .select()
        .from(disputes)
        .where(and(eq(disputes.orderId, orderId), eq(disputes.openedBy, openerId)))
        .orderBy(desc(disputes.createdAt))
        .limit(1);
      return rows[0] ?? null;
    },
    null,
  );
}

export async function listDisputes(status?: string): Promise<DisputeRow[]> {
  return safeQuery(async () => {
    const rows = await db
      .select({
        dispute: disputes,
        order: orders,
        businessName: businesses.name,
        openedByName: users.name,
      })
      .from(disputes)
      .innerJoin(orders, eq(disputes.orderId, orders.id))
      .innerJoin(businesses, eq(orders.businessId, businesses.id))
      .leftJoin(users, eq(disputes.openedBy, users.id))
      .where(status ? eq(disputes.status, status) : undefined)
      .orderBy(desc(disputes.createdAt));
    return rows.map((r) => ({
      dispute: r.dispute,
      order: r.order,
      businessName: r.businessName,
      openedByName: r.openedByName || "Buyer",
    }));
  }, []);
}

export async function listDisputesForBusiness(businessId: string): Promise<DisputeRow[]> {
  return safeQuery(async () => {
    const rows = await db
      .select({
        dispute: disputes,
        order: orders,
        businessName: businesses.name,
        openedByName: users.name,
      })
      .from(disputes)
      .innerJoin(orders, eq(disputes.orderId, orders.id))
      .innerJoin(businesses, eq(orders.businessId, businesses.id))
      .leftJoin(users, eq(disputes.openedBy, users.id))
      .where(eq(orders.businessId, businessId))
      .orderBy(desc(disputes.createdAt));
    return rows.map((r) => ({
      dispute: r.dispute,
      order: r.order,
      businessName: r.businessName,
      openedByName: r.openedByName || "Buyer",
    }));
  }, []);
}

export async function getDisputeById(id: string) {
  return safeQuery(
    async () => {
      const rows = await db.select().from(disputes).where(eq(disputes.id, id)).limit(1);
      return rows[0] ?? null;
    },
    null,
  );
}
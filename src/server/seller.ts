import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db, safeQuery } from "@/db";
import {
  businesses,
  messages,
  orderItems,
  orders,
  payouts,
  productImages,
  products,
  reviews,
  threads,
  users,
} from "@/db/schema";

export async function getBusinessByOwner(
  userId: string,
): Promise<typeof businesses.$inferSelect | null> {
  return safeQuery(async () => {
    const rows = await db
      .select()
      .from(businesses)
      .where(and(eq(businesses.ownerUserId, userId), ne(businesses.status, "archived")))
      .orderBy(desc(businesses.createdAt))
      .limit(1);
    return rows[0] ?? null;
  }, null);
}

export interface SellerStats {
  productCount: number;
  pendingOrders: number;
  completedOrders: number;
  revenueCents: number;
  totalViews: number;
  unreadMessages: number;
}

export async function getSellerStats(businessId: string): Promise<SellerStats> {
  return safeQuery(async () => {
    const [productCount, orderAgg, viewAgg] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(eq(products.businessId, businessId), ne(products.status, "archived"))),
      db
        .select({
          pending: sql<number>`count(*) filter (where ${orders.status} in ('pending','confirmed'))`,
          completed: sql<number>`count(*) filter (where ${orders.status} = 'completed')`,
          revenue: sql<number>`coalesce(sum(${orders.totalCents}) filter (where ${orders.status} in ('confirmed','shipped','completed')), 0)`,
        })
        .from(orders)
        .where(eq(orders.businessId, businessId)),
      db
        .select({ views: sql<number>`coalesce(sum(${products.viewCount}), 0)` })
        .from(products)
        .where(eq(products.businessId, businessId)),
    ]);

    const unread = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .innerJoin(threads, eq(messages.threadId, threads.id))
      .where(and(eq(threads.businessId, businessId), ne(messages.senderId, ""), sql`${messages.readAt} is null`));

    return {
      productCount: Number(productCount[0]?.count) || 0,
      pendingOrders: Number(orderAgg[0]?.pending) || 0,
      completedOrders: Number(orderAgg[0]?.completed) || 0,
      revenueCents: Number(orderAgg[0]?.revenue) || 0,
      totalViews: Number(viewAgg[0]?.views) || 0,
      unreadMessages: Number(unread[0]?.count) || 0,
    };
  }, {
    productCount: 0,
    pendingOrders: 0,
    completedOrders: 0,
    revenueCents: 0,
    totalViews: 0,
    unreadMessages: 0,
  });
}

export interface SellerProductRow {
  id: string;
  name: string;
  priceCents: number;
  quantity: number;
  status: string;
  category: string;
  image: string | null;
  viewCount: number;
  soldCount: number;
  createdAt: Date;
}

export async function listBusinessProducts(
  businessId: string,
): Promise<SellerProductRow[]> {
  return safeQuery(async () => {
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.businessId, businessId), ne(products.status, "archived")))
      .orderBy(desc(products.createdAt));
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const images = await db
      .select({ productId: productImages.productId, url: productImages.url })
      .from(productImages)
      .where(inArray(productImages.productId, ids));
    const map = new Map<string, string>();
    for (const img of images) if (!map.has(img.productId)) map.set(img.productId, img.url);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      priceCents: r.priceCents,
      quantity: r.quantity,
      status: r.status,
      category: r.category,
      image: map.get(r.id) ?? null,
      viewCount: r.viewCount,
      soldCount: r.soldCount,
      createdAt: r.createdAt,
    }));
  }, []);
}

export interface SellerOrderRow {
  order: typeof orders.$inferSelect;
  buyerName: string;
  items: (typeof orderItems.$inferSelect)[];
}

export async function getBusinessOrders(businessId: string): Promise<SellerOrderRow[]> {
  return safeQuery(async () => {
    const rows = await db
      .select({ order: orders, buyerName: users.name })
      .from(orders)
      .innerJoin(users, eq(orders.buyerId, users.id))
      .where(eq(orders.businessId, businessId))
      .orderBy(desc(orders.createdAt));
    if (rows.length === 0) return [];
    const orderIds = rows.map((r) => r.order.id);
    const items = await db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));
    const byOrder = new Map<string, typeof items>();
    for (const it of items) {
      const list = byOrder.get(it.orderId) ?? [];
      list.push(it);
      byOrder.set(it.orderId, list);
    }
    return rows.map((r) => ({
      order: r.order,
      buyerName: r.buyerName || "Buyer",
      items: byOrder.get(r.order.id) ?? [],
    }));
  }, []);
}

export interface SellerReviewRow {
  id: string;
  rating: number;
  comment: string;
  sellerReply: string | null;
  createdAt: Date;
  buyerName: string;
  orderId: string;
}

export async function listBusinessReviews(businessId: string): Promise<SellerReviewRow[]> {
  return safeQuery(async () => {
    const rows = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        sellerReply: reviews.sellerReply,
        createdAt: reviews.createdAt,
        buyerName: users.name,
        orderId: reviews.orderId,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.buyerId, users.id))
      .where(eq(reviews.businessId, businessId))
      .orderBy(desc(reviews.createdAt));
    return rows.map((r) => ({ ...r, buyerName: r.buyerName || "Buyer" }));
  }, []);
}

export interface PayoutSummary {
  lifetimeEarnedCents: number;
  heldCents: number;
  availableCents: number;
  paidOutCents: number;
  commissionCents: number;
  currency: string;
  history: (typeof payouts.$inferSelect)[];
}

export async function getPayoutSummary(businessId: string): Promise<PayoutSummary> {
  return safeQuery(async () => {
    const agg = await db
      .select({
        lifetime: sql<number>`coalesce(sum(${orders.sellerPayoutCents}) filter (where ${orders.paymentStatus} in ('paid','partially_refunded')), 0)`,
        held: sql<number>`coalesce(sum(${orders.sellerPayoutCents}) filter (where ${orders.escrowStatus} = 'held'), 0)`,
        released: sql<number>`coalesce(sum(${orders.sellerPayoutCents}) filter (where ${orders.escrowStatus} = 'released'), 0)`,
        commission: sql<number>`coalesce(sum(${orders.commissionCents}), 0)`,
      })
      .from(orders)
      .where(eq(orders.businessId, businessId));

    const payoutRows = await db
      .select({ paid: sql<number>`coalesce(sum(${payouts.amountCents}) filter (where ${payouts.status} = 'paid'), 0)` })
      .from(payouts)
      .where(eq(payouts.businessId, businessId));

    const history = await db
      .select()
      .from(payouts)
      .where(eq(payouts.businessId, businessId))
      .orderBy(desc(payouts.createdAt))
      .limit(50);


    const released = Number(agg[0]?.released) || 0;
    const paidOut = Number(payoutRows[0]?.paid) || 0;

    return {
      lifetimeEarnedCents: Number(agg[0]?.lifetime) || 0,
      heldCents: Number(agg[0]?.held) || 0,
      availableCents: Math.max(0, released - paidOut),
      paidOutCents: paidOut,
      commissionCents: Number(agg[0]?.commission) || 0,
      currency: "USD",
      history,
    };
  }, {
    lifetimeEarnedCents: 0,
    heldCents: 0,
    availableCents: 0,
    paidOutCents: 0,
    commissionCents: 0,
    currency: "USD",
    history: [],
  });
}

export interface BusinessAnalytics {
  totalViews: number;
  messagesReceived: number;
  itemsSold: number;
  revenueCents: number;
  ordersByDay: { day: string; count: number }[];
}

export async function getBusinessAnalytics(
  businessId: string,
): Promise<BusinessAnalytics> {
  return safeQuery(async () => {
    const viewAgg = await db
      .select({ views: sql<number>`coalesce(sum(${products.viewCount}), 0)` })
      .from(products)
      .where(eq(products.businessId, businessId));

    const msgAgg = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .innerJoin(threads, eq(messages.threadId, threads.id))
      .where(eq(threads.businessId, businessId));

    const soldAgg = await db
      .select({
        items: sql<number>`coalesce(sum(${orderItems.qty}), 0)`,
        revenue: sql<number>`coalesce(sum(${orderItems.priceCents} * ${orderItems.qty}), 0)`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(eq(orders.businessId, businessId), eq(orders.status, "completed")));

    const dayRows = await db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'Mon DD')`,
        bucket: sql<string>`date_trunc('day', ${orders.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .where(eq(orders.businessId, businessId))
      .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
      .orderBy(sql`date_trunc('day', ${orders.createdAt}) asc`)
      .limit(14);

    return {
      totalViews: Number(viewAgg[0]?.views) || 0,
      messagesReceived: Number(msgAgg[0]?.count) || 0,
      itemsSold: Number(soldAgg[0]?.items) || 0,
      revenueCents: Number(soldAgg[0]?.revenue) || 0,
      ordersByDay: dayRows.map((d) => ({ day: d.day, count: Number(d.count) || 0 })),
    };
  }, {
    totalViews: 0,
    messagesReceived: 0,
    itemsSold: 0,
    revenueCents: 0,
    ordersByDay: [],
  });
}
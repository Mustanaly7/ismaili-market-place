import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, safeQuery } from "@/db";
import {
  businesses,
  favorites,
  orderItems,
  orders,
  productImages,
  products,
  reviews,
} from "@/db/schema";

export interface OrderSummary {
  id: string;
  status: string;
  paymentStatus: string;
  totalCents: number;
  createdAt: Date;
  businessId: string;
  businessName: string;
  itemCount: number;
  firstImage: string | null;
}

export async function getBuyerOrders(buyerId: string): Promise<OrderSummary[]> {
  return safeQuery(async () => {
    const rows = await db
      .select({
        order: orders,
        businessName: businesses.name,
      })
      .from(orders)
      .innerJoin(businesses, eq(orders.businessId, businesses.id))
      .where(eq(orders.buyerId, buyerId))
      .orderBy(desc(orders.createdAt));

    if (rows.length === 0) return [];
    const orderIds = rows.map((r) => r.order.id);
    const itemRows = await db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    const byOrder = new Map<string, typeof itemRows>();
    for (const it of itemRows) {
      const list = byOrder.get(it.orderId) ?? [];
      list.push(it);
      byOrder.set(it.orderId, list);
    }

    return rows.map((r) => {
      const items = byOrder.get(r.order.id) ?? [];
      return {
        id: r.order.id,
        status: r.order.status,
        paymentStatus: r.order.paymentStatus,
        totalCents: r.order.totalCents,
        createdAt: r.order.createdAt,
        businessId: r.order.businessId,
        businessName: r.businessName,
        itemCount: items.reduce((n, i) => n + i.qty, 0),
        firstImage: items[0]?.imageSnapshot ?? null,
      };
    });
  }, []);
}

export interface OrderDetailForBuyer {
  order: typeof orders.$inferSelect;
  business: typeof businesses.$inferSelect;
  items: (typeof orderItems.$inferSelect)[];
  hasReview: boolean;
}

export async function getOrderForBuyer(
  orderId: string,
  buyerId: string,
): Promise<OrderDetailForBuyer | null> {
  return safeQuery(async () => {
    const rows = await db
      .select({ order: orders, business: businesses })
      .from(orders)
      .innerJoin(businesses, eq(orders.businessId, businesses.id))
      .where(and(eq(orders.id, orderId), eq(orders.buyerId, buyerId)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
    const reviewRows = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.orderId, orderId))
      .limit(1);

    return {
      order: row.order,
      business: row.business,
      items,
      hasReview: reviewRows.length > 0,
    };
  }, null);
}

export interface FavoriteItem {
  id: string;
  name: string;
  priceCents: number;
  image: string | null;
  businessId: string;
  businessName: string;
  businessSlug: string;
  status: string;
  quantity: number;
  category: string;
  paymentMode: "online" | "contact";
}

export async function getFavorites(userId: string): Promise<FavoriteItem[]> {
  return safeQuery(async () => {
    const rows = await db
      .select({
        product: products,
        businessName: businesses.name,
        businessSlug: businesses.slug,
        paymentMode: businesses.paymentMode,
      })
      .from(favorites)
      .innerJoin(products, eq(favorites.productId, products.id))
      .innerJoin(businesses, eq(products.businessId, businesses.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.product.id);
    const imageRows = await db
      .select({ productId: productImages.productId, url: productImages.url })
      .from(productImages)
      .where(inArray(productImages.productId, ids));
    const imageMap = new Map<string, string>();
    for (const img of imageRows) if (!imageMap.has(img.productId)) imageMap.set(img.productId, img.url);

    return rows.map((r) => ({
      id: r.product.id,
      name: r.product.name,
      priceCents: r.product.priceCents,
      image: imageMap.get(r.product.id) ?? null,
      businessId: r.product.businessId,
      businessName: r.businessName,
      businessSlug: r.businessSlug,
      status: r.product.status,
      quantity: r.product.quantity,
      category: r.product.category,
      paymentMode: (r.paymentMode === "contact" ? "contact" : "online") as
        | "online"
        | "contact",
    }));
  }, []);
}

export async function isFavorite(userId: string, productId: string): Promise<boolean> {
  return safeQuery(async () => {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)));
    return (Number(rows[0]?.count) || 0) > 0;
  }, false);
}
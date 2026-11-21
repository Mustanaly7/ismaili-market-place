import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { db, safeQuery } from "@/db";
import {
  businesses,
  messages,
  products,
  threads,
  users,
  type User,
} from "@/db/schema";

export interface ThreadSummary {
  id: string;
  counterpartName: string;
  businessName: string;
  buyerName: string;
  productName: string | null;
  subject: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}

export async function listThreadsForUser(user: User): Promise<ThreadSummary[]> {
  return safeQuery(async () => {
    const base =
      user.role === "buyer"
        ? await db
            .select({ thread: threads, businessName: businesses.name })
            .from(threads)
            .innerJoin(businesses, eq(threads.businessId, businesses.id))
            .where(eq(threads.buyerId, user.id))
            .orderBy(desc(threads.lastMessageAt))
        : await db
            .select({ thread: threads, businessName: businesses.name })
            .from(threads)
            .innerJoin(businesses, eq(threads.businessId, businesses.id))
            .where(eq(businesses.ownerUserId, user.id))
            .orderBy(desc(threads.lastMessageAt));

    if (base.length === 0) return [];

    const threadIds = base.map((b) => b.thread.id);
    const buyerIds = Array.from(new Set(base.map((b) => b.thread.buyerId)));
    const productIds = Array.from(
      new Set(base.map((b) => b.thread.productId).filter((x): x is string => Boolean(x))),
    );

    const [msgRows, buyerRows, productRows] = await Promise.all([
      db
        .select({
          threadId: messages.threadId,
          body: messages.body,
          senderId: messages.senderId,
          createdAt: messages.createdAt,
          readAt: messages.readAt,
        })
        .from(messages)
        .where(inArray(messages.threadId, threadIds))
        .orderBy(desc(messages.createdAt)),
      db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, buyerIds)),
      productIds.length
        ? db
            .select({ id: products.id, name: products.name })
            .from(products)
            .where(inArray(products.id, productIds))
        : Promise.resolve([] as { id: string; name: string }[]),
    ]);

    const buyerName = new Map(buyerRows.map((u) => [u.id, u.name || "Buyer"]));
    const productName = new Map(productRows.map((p) => [p.id, p.name]));
    const lastByThread = new Map<string, string>();
    const lastAtByThread = new Map<string, Date>();
    const unreadByThread = new Map<string, number>();

    for (const m of msgRows) {
      if (!lastByThread.has(m.threadId)) {
        lastByThread.set(m.threadId, m.body);
        lastAtByThread.set(m.threadId, m.createdAt);
      }
      if (m.senderId !== user.id && !m.readAt) {
        unreadByThread.set(m.threadId, (unreadByThread.get(m.threadId) ?? 0) + 1);
      }
    }

    return base.map((b) => {
      const t = b.thread;
      const buyer = buyerName.get(t.buyerId) ?? "Buyer";
      return {
        id: t.id,
        counterpartName: user.role === "buyer" ? b.businessName : buyer,
        businessName: b.businessName,
        buyerName: buyer,
        productName: t.productId ? productName.get(t.productId) ?? null : null,
        subject: t.subject,
        lastMessage: lastByThread.get(t.id) ?? "",
        lastMessageAt: lastAtByThread.get(t.id) ?? t.lastMessageAt,
        unreadCount: unreadByThread.get(t.id) ?? 0,
      };
    });
  }, []);
}

export interface ThreadDetail {
  thread: typeof threads.$inferSelect;
  business: typeof businesses.$inferSelect;
  buyerName: string;
  productName: string | null;
  messages: (typeof messages.$inferSelect)[];
}

export async function getThreadDetail(
  threadId: string,
  user: User,
): Promise<ThreadDetail | null> {
  return safeQuery(async () => {
    const rows = await db
      .select({ thread: threads, business: businesses })
      .from(threads)
      .innerJoin(businesses, eq(threads.businessId, businesses.id))
      .where(eq(threads.id, threadId))
      .limit(1);
    const row = rows[0];
    if (!row) return null;

    const isOwner = row.business.ownerUserId === user.id;
    const isBuyer = row.thread.buyerId === user.id;
    if (!isOwner && !isBuyer && user.role !== "admin") return null;

    const [msgRows, buyerRow, productRow] = await Promise.all([
      db
        .select()
        .from(messages)
        .where(eq(messages.threadId, threadId))
        .orderBy(asc(messages.createdAt)),
      db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, row.thread.buyerId))
        .limit(1),
      row.thread.productId
        ? db
            .select({ name: products.name })
            .from(products)
            .where(eq(products.id, row.thread.productId))
            .limit(1)
        : Promise.resolve([] as { name: string }[]),
    ]);

    return {
      thread: row.thread,
      business: row.business,
      buyerName: buyerRow[0]?.name || "Buyer",
      productName: productRow[0]?.name ?? null,
      messages: msgRows,
    };
  }, null);
}

export async function markThreadRead(threadId: string, userId: string): Promise<void> {
  await safeQuery(async () => {
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(messages.threadId, threadId),
          ne(messages.senderId, userId),
          isNull(messages.readAt),
        ),
      );
    return true;
  }, false);
}

export async function unreadMessageCount(user: User): Promise<number> {
  return safeQuery(async () => {
    const threadIdsSubquery =
      user.role === "buyer"
        ? db.select({ id: threads.id }).from(threads).where(eq(threads.buyerId, user.id))
        : db
            .select({ id: threads.id })
            .from(threads)
            .innerJoin(businesses, eq(threads.businessId, businesses.id))
            .where(eq(businesses.ownerUserId, user.id));
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          inArray(messages.threadId, threadIdsSubquery),
          ne(messages.senderId, user.id),
          isNull(messages.readAt),
        ),
      );
    return Number(rows[0]?.count) || 0;
  }, 0);
}
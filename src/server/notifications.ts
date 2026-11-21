import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db, safeQuery } from "@/db";
import { notifications, type Notification } from "@/db/schema";

export type NotificationChannel = "inapp" | "whatsapp" | "sms" | "email";

/**
 * Queue (or send) a notification. In-app notifications are marked `sent`
 * immediately; outbound channels stay `queued` for a worker/delivery job.
 * Never throws — safe to call from order/message flows.
 */
export async function notify(
  userId: string,
  template: string,
  payload?: Record<string, unknown>,
  channel: NotificationChannel = "inapp",
): Promise<void> {
  await safeQuery(async () => {
    await db.insert(notifications).values({
      userId,
      template,
      payload: payload ?? null,
      channel,
      status: channel === "inapp" ? "sent" : "queued",
      sentAt: channel === "inapp" ? new Date() : null,
      readAt: null,
    });
    return true;
  }, false);
}

export async function listNotifications(
  userId: string,
  limit = 50,
): Promise<Notification[]> {
  return safeQuery(
    () =>
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit),
    [],
  );
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  return safeQuery(async () => {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.channel, "inapp"),
          isNull(notifications.readAt),
        ),
      );
    return Number(rows[0]?.count) || 0;
  }, 0);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await safeQuery(async () => {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return true;
  }, false);
}
import { desc, eq } from "drizzle-orm";
import { db, safeQuery } from "@/db";
import { users, verificationRequests } from "@/db/schema";

export interface VerificationRow {
  request: typeof verificationRequests.$inferSelect;
  userName: string;
  userEmail: string | null;
  userPhone: string | null;
}

export async function getLatestVerification(userId: string) {
  return safeQuery(
    () =>
      db
        .select()
        .from(verificationRequests)
        .where(eq(verificationRequests.userId, userId))
        .orderBy(desc(verificationRequests.createdAt))
        .limit(1)
        .then((rows) => rows[0] ?? null),
    null,
  );
}

export async function listMyVerifications(userId: string) {
  return safeQuery(
    () =>
      db
        .select()
        .from(verificationRequests)
        .where(eq(verificationRequests.userId, userId))
        .orderBy(desc(verificationRequests.createdAt))
        .limit(10),
    [],
  );
}

export async function listVerifications(status?: string): Promise<VerificationRow[]> {
  return safeQuery(async () => {
    const base = db
      .select({
        request: verificationRequests,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
      })
      .from(verificationRequests)
      .innerJoin(users, eq(verificationRequests.userId, users.id));
    const rows = status
      ? await base.where(eq(verificationRequests.status, status)).orderBy(desc(verificationRequests.createdAt))
      : await base.orderBy(desc(verificationRequests.createdAt)).limit(200);
    return rows;
  }, []);
}
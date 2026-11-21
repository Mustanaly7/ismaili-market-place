import { and, desc, eq } from "drizzle-orm";
import { db, safeQuery } from "@/db";
import { dataRequests, type DataRequest } from "@/db/schema";

export async function listMyDataRequests(userId: string): Promise<DataRequest[]> {
  return safeQuery(
    () =>
      db
        .select()
        .from(dataRequests)
        .where(eq(dataRequests.userId, userId))
        .orderBy(desc(dataRequests.createdAt))
        .limit(20),
    [],
  );
}

export async function hasPendingDataRequest(
  userId: string,
  type: "export" | "delete",
): Promise<boolean> {
  return safeQuery(
    async () => {
      const rows = await db
        .select({ id: dataRequests.id })
        .from(dataRequests)
        .where(
          and(
            eq(dataRequests.userId, userId),
            eq(dataRequests.type, type),
            eq(dataRequests.status, "pending"),
          ),
        )
        .limit(1);
      return rows.length > 0;
    },
    false,
  );
}
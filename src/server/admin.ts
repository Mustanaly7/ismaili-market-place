import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db, safeQuery } from "@/db";
import {
  bannedKeywords,
  businesses,
  campaigns,
  collections,
  mentorshipGuides,
  orders,
  payouts,
  platformSettings,
  products,
  reports,
  users,
  welfareContributions,
} from "@/db/schema";

export interface AdminStats {
  totalUsers: number;
  sellers: number;
  buyers: number;
  activeBusinesses: number;
  totalProducts: number;
  totalOrders: number;
  gmvCents: number;
  pendingReports: number;
  pendingListings: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  return safeQuery(async () => {
    const [userAgg, businessAgg, productAgg, orderAgg, reportAgg, pendingProductAgg, pendingBizAgg, topCat] =
      await Promise.all([
        db
          .select({
            total: sql<number>`count(*)`,
            sellers: sql<number>`count(*) filter (where ${users.role} = 'seller')`,
            buyers: sql<number>`count(*) filter (where ${users.role} = 'buyer')`,
          })
          .from(users),
        db
          .select({ count: sql<number>`count(*)` })
          .from(businesses)
          .where(eq(businesses.status, "active")),
        db.select({ count: sql<number>`count(*)` }).from(products),
        db
          .select({
            count: sql<number>`count(*)`,
            gmv: sql<number>`coalesce(sum(${orders.totalCents}) filter (where ${orders.status} <> 'cancelled'), 0)`,
          })
          .from(orders),
        db
          .select({ count: sql<number>`count(*)` })
          .from(reports)
          .where(eq(reports.status, "open")),
        db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(eq(products.status, "pending")),
        db
          .select({ count: sql<number>`count(*)` })
          .from(businesses)
          .where(eq(businesses.status, "pending")),
        db
          .select({
            category: products.category,
            count: sql<number>`count(*)`,
          })
          .from(products)
          .groupBy(products.category)
          .orderBy(desc(sql`count(*)`))
          .limit(6),
      ]);

    return {
      totalUsers: Number(userAgg[0]?.total) || 0,
      sellers: Number(userAgg[0]?.sellers) || 0,
      buyers: Number(userAgg[0]?.buyers) || 0,
      activeBusinesses: Number(businessAgg[0]?.count) || 0,
      totalProducts: Number(productAgg[0]?.count) || 0,
      totalOrders: Number(orderAgg[0]?.count) || 0,
      gmvCents: Number(orderAgg[0]?.gmv) || 0,
      pendingReports: Number(reportAgg[0]?.count) || 0,
      pendingListings:
        (Number(pendingProductAgg[0]?.count) || 0) + (Number(pendingBizAgg[0]?.count) || 0),
    };
  }, {
    totalUsers: 0,
    sellers: 0,
    buyers: 0,
    activeBusinesses: 0,
    totalProducts: 0,
    totalOrders: 0,
    gmvCents: 0,
    pendingReports: 0,
    pendingListings: 0,
  });
}

export async function getTopCategories() {
  return safeQuery(
    () =>
      db
        .select({ category: products.category, count: sql<number>`count(*)` })
        .from(products)
        .where(ne(products.category, ""))
        .groupBy(products.category)
        .orderBy(desc(sql`count(*)`))
        .limit(6)
        .then((rows) => rows.map((r) => ({ category: r.category, count: Number(r.count) || 0 }))),
    [],
  );
}

export async function getRecentOrders() {
  return safeQuery(async () => {
    const rows = await db
      .select({
        id: orders.id,
        status: orders.status,
        totalCents: orders.totalCents,
        createdAt: orders.createdAt,
        businessName: businesses.name,
        buyerName: users.name,
      })
      .from(orders)
      .innerJoin(businesses, eq(orders.businessId, businesses.id))
      .innerJoin(users, eq(orders.buyerId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(10);
    return rows;
  }, []);
}

export async function listPendingProducts() {
  return safeQuery(async () => {
    const rows = await db
      .select({ product: products, businessName: businesses.name })
      .from(products)
      .innerJoin(businesses, eq(products.businessId, businesses.id))
      .where(eq(products.status, "pending"))
      .orderBy(desc(products.createdAt));
    return rows;
  }, []);
}

export async function listPendingBusinesses() {
  return safeQuery(
    () =>
      db
        .select()
        .from(businesses)
        .where(eq(businesses.status, "pending"))
        .orderBy(desc(businesses.createdAt)),
    [],
  );
}

export async function listAllUsers() {
  return safeQuery(
    () =>
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          verified: users.verified,
          suspended: users.suspended,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(200),
    [],
  );
}

export async function listReports() {
  return safeQuery(
    () =>
      db
        .select()
        .from(reports)
        .orderBy(desc(reports.createdAt))
        .limit(100),
    [],
  );
}

export async function getPlatformSettings() {
  return safeQuery(async () => {
    const rows = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.id, "default"))
      .limit(1);
    return (
      rows[0] ?? {
        id: "default",
        commissionBps: 500,
        autoApprove: true,
        currency: "USD",
        supportedCurrencies: null,
        supportedLocales: null,
        roundUpEnabled: true,
        welfareFundName: "Community Welfare Fund",
        bannedItems: "",
        impactBaseline: null,
        supportPhone: "",
        supportWhatsapp: "",
        updatedAt: new Date(),
      }
    );
  }, {
    id: "default",
    commissionBps: 500,
    autoApprove: true,
    currency: "USD",
    supportedCurrencies: null,
    supportedLocales: null,
    roundUpEnabled: true,
    welfareFundName: "Community Welfare Fund",
    bannedItems: "",
    impactBaseline: null,
    supportPhone: "",
    supportWhatsapp: "",
    updatedAt: new Date(),
  });
}
export async function listPayoutQueue() {
  return safeQuery(
    () =>
      db
        .select({ payout: payouts, businessName: businesses.name })
        .from(payouts)
        .innerJoin(businesses, eq(payouts.businessId, businesses.id))
        .orderBy(desc(payouts.createdAt))
        .limit(200),
    [],
  );
}

export async function getWelfareTotals() {
  return safeQuery(
    async () => {
      const rows = await db
        .select({
          totalCents: sql<number>`coalesce(sum(${welfareContributions.amountCents}), 0)`,
          count: sql<number>`count(*)`,
        })
        .from(welfareContributions);
      return {
        totalCents: Number(rows[0]?.totalCents) || 0,
        count: Number(rows[0]?.count) || 0,
      };
    },
    { totalCents: 0, count: 0 },
  );
}

export async function listWelfareContributions() {
  return safeQuery(
    () =>
      db
        .select({ contribution: welfareContributions, businessName: businesses.name })
        .from(welfareContributions)
        .innerJoin(businesses, eq(welfareContributions.businessId, businesses.id))
        .orderBy(desc(welfareContributions.createdAt))
        .limit(200),
    [],
  );
}

export async function listBannedKeywords() {
  return safeQuery(
    () => db.select().from(bannedKeywords).orderBy(desc(bannedKeywords.createdAt)),
    [],
  );
}

export async function listCollections() {
  return safeQuery(
    () => db.select().from(collections).orderBy(collections.sort, desc(collections.createdAt)),
    [],
  );
}

export async function listCampaigns() {
  return safeQuery(() => db.select().from(campaigns).orderBy(desc(campaigns.createdAt)), []);
}

export async function listMentorshipGuides() {
  return safeQuery(
    () =>
      db
        .select()
        .from(mentorshipGuides)
        .orderBy(mentorshipGuides.sort, desc(mentorshipGuides.createdAt)),
    [],
  );
}
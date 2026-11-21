import { asc, desc, eq, sql } from "drizzle-orm";
import { db, safeQuery } from "@/db";
import {
  businesses,
  collectionItems,
  collections,
  mentorshipGuides,
  platformSettings,
  welfareContributions,
  type Collection,
  type MentorshipGuide,
} from "@/db/schema";
import {
  listProductCards,
  listShops,
  type ProductCardData,
  type ShopCardData,
} from "@/server/catalog";

export interface CollectionSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  kind: string;
}

export async function listActiveCollections(): Promise<CollectionSummary[]> {
  return safeQuery(
    () =>
      db
        .select({
          id: collections.id,
          slug: collections.slug,
          title: collections.title,
          description: collections.description,
          imageUrl: collections.imageUrl,
          kind: collections.kind,
        })
        .from(collections)
        .where(eq(collections.active, true))
        .orderBy(asc(collections.sort), desc(collections.createdAt)),
    [],
  );
}

export interface CollectionDetail {
  collection: Collection;
  products: ProductCardData[];
  shops: ShopCardData[];
}

export async function getCollectionBySlug(slug: string): Promise<CollectionDetail | null> {
  return safeQuery(async () => {
    const rows = await db.select().from(collections).where(eq(collections.slug, slug)).limit(1);
    const collection = rows[0];
    if (!collection) return null;

    const items = await db
      .select()
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, collection.id))
      .orderBy(asc(collectionItems.sort));

    const productIds = items
      .map((i) => i.productId)
      .filter((x): x is string => Boolean(x));
    const businessIds = items
      .map((i) => i.businessId)
      .filter((x): x is string => Boolean(x));

    const [products, shops] = await Promise.all([
      productIds.length ? listProductCards({ ids: productIds, limit: 48 }) : Promise.resolve([]),
      businessIds.length ? listShops({ ids: businessIds }) : Promise.resolve([]),
    ]);

    return { collection, products, shops };
  }, null);
}

export async function listActiveGuides(): Promise<MentorshipGuide[]> {
  return safeQuery(
    () =>
      db
        .select()
        .from(mentorshipGuides)
        .where(eq(mentorshipGuides.active, true))
        .orderBy(asc(mentorshipGuides.sort), desc(mentorshipGuides.createdAt)),
    [],
  );
}

export interface ImpactSummary {
  welfareTotalCents: number;
  contributionCount: number;
  sellerCount: number;
  fundName: string;
  baseline: Record<string, unknown> | null;
}

export async function getImpactSummary(): Promise<ImpactSummary> {
  return safeQuery(
    async () => {
      const [settingsRows, welfareRows, sellerRows] = await Promise.all([
        db.select().from(platformSettings).where(eq(platformSettings.id, "default")).limit(1),
        db
          .select({
            totalCents: sql<number>`coalesce(sum(${welfareContributions.amountCents}), 0)`,
            count: sql<number>`count(*)`,
          })
          .from(welfareContributions),
        db
          .select({ count: sql<number>`count(*)` })
          .from(businesses)
          .where(eq(businesses.status, "active")),
      ]);

      const settings = settingsRows[0];
      return {
        welfareTotalCents: Number(welfareRows[0]?.totalCents) || 0,
        contributionCount: Number(welfareRows[0]?.count) || 0,
        sellerCount: Number(sellerRows[0]?.count) || 0,
        fundName: settings?.welfareFundName || "Community Welfare Fund",
        baseline: (settings?.impactBaseline as Record<string, unknown> | null) ?? null,
      };
    },
    {
      welfareTotalCents: 0,
      contributionCount: 0,
      sellerCount: 0,
      fundName: "Community Welfare Fund",
      baseline: null,
    },
  );
}
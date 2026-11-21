import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { db, safeQuery } from "@/db";
import {
  businesses,
  categories,
  productImages,
  products,
  reviews,
} from "@/db/schema";

export interface ProductCardData {
  id: string;
  name: string;
  priceCents: number;
  image: string | null;
  businessId: string;
  businessName: string;
  businessSlug: string;
  rating: number;
  ratingCount: number;
  location: string;
  category: string;
  paymentMode: "online" | "contact";
  quantity: number;
  status: string;
  kind: string;
  verified: boolean;
}

export interface ProductListFilter {
  q?: string;
  category?: string;
  businessId?: string;
  country?: string;
  city?: string;
  kind?: string;
  ids?: string[];
  minCents?: number;
  maxCents?: number;
  minRating?: number;
  sort?: "new" | "price_asc" | "price_desc" | "rating";
  limit?: number;
  offset?: number;
}

async function buildCards(
  rows: {
    id: string;
    name: string;
    priceCents: number;
    businessId: string;
    businessName: string;
    businessSlug: string;
    location: string;
    category: string;
    paymentMode: string;
    quantity: number;
    status: string;
    kind: string;
    verification: string;
  }[],
): Promise<ProductCardData[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const bizIds = Array.from(new Set(rows.map((r) => r.businessId)));

  const [imageRows, ratingRows] = await Promise.all([
    db
      .select({ productId: productImages.productId, url: productImages.url })
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(asc(productImages.sort)),
    db
      .select({
        businessId: reviews.businessId,
        avg: sql<number>`avg(${reviews.rating})`,
        count: sql<number>`count(*)`,
      })
      .from(reviews)
      .where(inArray(reviews.businessId, bizIds))
      .groupBy(reviews.businessId),
  ]);

  const imageMap = new Map<string, string>();
  for (const img of imageRows) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, img.url);
  }
  const ratingMap = new Map<string, { avg: number; count: number }>();
  for (const r of ratingRows) {
    ratingMap.set(r.businessId, {
      avg: Number(r.avg) || 0,
      count: Number(r.count) || 0,
    });
  }

  return rows.map((r) => {
    const rate = ratingMap.get(r.businessId);
    return {
      id: r.id,
      name: r.name,
      priceCents: r.priceCents,
      image: imageMap.get(r.id) ?? null,
      businessId: r.businessId,
      businessName: r.businessName,
      businessSlug: r.businessSlug,
      rating: rate?.avg ?? 0,
      ratingCount: rate?.count ?? 0,
      location: r.location,
      category: r.category,
      paymentMode: (r.paymentMode === "contact" ? "contact" : "online") as
        | "online"
        | "contact",
      quantity: r.quantity,
      status: r.status,
      kind: r.kind,
      verified: Boolean(r.verification && r.verification !== "unverified"),
    };
  });
}

export async function listProductCards(
  filter: ProductListFilter = {},
): Promise<ProductCardData[]> {
  return safeQuery(async () => {
    const conditions = [eq(products.status, "active"), eq(businesses.status, "active")];

    if (filter.q) {
      const like = `%${filter.q.trim()}%`;
      const clause = or(
        ilike(products.name, like),
        ilike(products.description, like),
        ilike(businesses.name, like),
        ilike(products.category, like),
      );
      if (clause) conditions.push(clause);
    }
    if (filter.category) conditions.push(eq(products.category, filter.category));
    if (filter.businessId) conditions.push(eq(products.businessId, filter.businessId));
    if (filter.country) conditions.push(eq(businesses.country, filter.country));
    if (filter.city) conditions.push(eq(businesses.city, filter.city));
    if (filter.kind) conditions.push(eq(products.kind, filter.kind));
    if (filter.ids && filter.ids.length) conditions.push(inArray(products.id, filter.ids));
    if (typeof filter.minCents === "number")
      conditions.push(gte(products.priceCents, filter.minCents));
    if (typeof filter.maxCents === "number")
      conditions.push(lte(products.priceCents, filter.maxCents));

    const orderBy =
      filter.sort === "price_asc"
        ? asc(products.priceCents)
        : filter.sort === "price_desc"
          ? desc(products.priceCents)
          : desc(products.createdAt);

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        priceCents: products.priceCents,
        businessId: products.businessId,
        businessName: businesses.name,
        businessSlug: businesses.slug,
        location: businesses.location,
        category: products.category,
        paymentMode: businesses.paymentMode,
        quantity: products.quantity,
        status: products.status,
        kind: products.kind,
        verification: businesses.verification,
      })
      .from(products)
      .innerJoin(businesses, eq(products.businessId, businesses.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(filter.limit ?? 48)
      .offset(filter.offset ?? 0);

    let cards = await buildCards(rows);
    if (typeof filter.minRating === "number") {
      cards = cards.filter((c) => c.rating >= filter.minRating!);
    }
    if (filter.sort === "rating") {
      cards.sort((a, b) => b.rating - a.rating);
    }
    return cards;
  }, []);
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  return safeQuery(async () => {
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        priceCents: products.priceCents,
        businessId: products.businessId,
        businessName: businesses.name,
        businessSlug: businesses.slug,
        location: businesses.location,
        category: products.category,
        paymentMode: businesses.paymentMode,
        quantity: products.quantity,
        status: products.status,
        kind: products.kind,
        verification: businesses.verification,
      })
      .from(products)
      .innerJoin(businesses, eq(products.businessId, businesses.id))
      .where(and(eq(products.status, "active"), eq(businesses.status, "active")))
      .orderBy(desc(products.soldCount), desc(products.createdAt))
      .limit(limit);
    return buildCards(rows);
  }, []);
}

export interface ProductDetail {
  product: typeof products.$inferSelect;
  business: typeof businesses.$inferSelect;
  images: string[];
  rating: number;
  ratingCount: number;
}

export async function getProductDetail(id: string): Promise<ProductDetail | null> {
  return safeQuery(async () => {
    const rows = await db
      .select({ product: products, business: businesses })
      .from(products)
      .innerJoin(businesses, eq(products.businessId, businesses.id))
      .where(eq(products.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) return null;

    const images = await db
      .select({ url: productImages.url })
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.sort));

    const ratingRow = await db
      .select({
        avg: sql<number>`avg(${reviews.rating})`,
        count: sql<number>`count(*)`,
      })
      .from(reviews)
      .where(eq(reviews.businessId, row.business.id));

    // Best-effort view counter (never blocks rendering).
    db.update(products)
      .set({ viewCount: sql`${products.viewCount} + 1` })
      .where(eq(products.id, id))
      .catch(() => undefined);

    return {
      product: row.product,
      business: row.business,
      images: images.map((i) => i.url),
      rating: Number(ratingRow[0]?.avg) || 0,
      ratingCount: Number(ratingRow[0]?.count) || 0,
    };
  }, null);
}

export interface Storefront {
  business: typeof businesses.$inferSelect;
  products: ProductCardData[];
  rating: number;
  ratingCount: number;
}

export async function getStorefrontBySlug(slug: string): Promise<Storefront | null> {
  return safeQuery(async () => {
    const rows = await db
      .select()
      .from(businesses)
      .where(and(eq(businesses.slug, slug), eq(businesses.status, "active")))
      .limit(1);
    const business = rows[0];
    if (!business) return null;

    const productRows = await db
      .select({
        id: products.id,
        name: products.name,
        priceCents: products.priceCents,
        businessId: products.businessId,
        businessName: businesses.name,
        businessSlug: businesses.slug,
        location: businesses.location,
        category: products.category,
        paymentMode: businesses.paymentMode,
        quantity: products.quantity,
        status: products.status,
        kind: products.kind,
        verification: businesses.verification,
      })
      .from(products)
      .innerJoin(businesses, eq(products.businessId, businesses.id))
      .where(and(eq(products.businessId, business.id), eq(products.status, "active")))
      .orderBy(desc(products.createdAt));

    const ratingRow = await db
      .select({
        avg: sql<number>`avg(${reviews.rating})`,
        count: sql<number>`count(*)`,
      })
      .from(reviews)
      .where(eq(reviews.businessId, business.id));

    return {
      business,
      products: await buildCards(productRows),
      rating: Number(ratingRow[0]?.avg) || 0,
      ratingCount: Number(ratingRow[0]?.count) || 0,
    };
  }, null);
}

export async function listCategories(): Promise<(typeof categories.$inferSelect)[]> {
  return safeQuery(
    () => db.select().from(categories).orderBy(asc(categories.sort), asc(categories.name)),
    [],
  );
}

export async function getBusinessReviews(businessId: string) {
  return safeQuery(
    () =>
      db
        .select()
        .from(reviews)
        .where(eq(reviews.businessId, businessId))
        .orderBy(desc(reviews.createdAt))
        .limit(20),
    [],
  );
}
export interface ShopCardData {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string;
  country: string;
  city: string;
  location: string;
  rating: number;
  ratingCount: number;
  productCount: number;
  verified: boolean;
  lat: number | null;
  lng: number | null;
}

export interface ShopListFilter {
  country?: string;
  city?: string;
  q?: string;
  ids?: string[];
  limit?: number;
}

export async function listShops(
  filter: ShopListFilter = {},
): Promise<ShopCardData[]> {
  return safeQuery(async () => {
    const conditions = [eq(businesses.status, "active")];
    if (filter.ids && filter.ids.length) conditions.push(inArray(businesses.id, filter.ids));
    if (filter.country) conditions.push(eq(businesses.country, filter.country));
    if (filter.city) conditions.push(eq(businesses.city, filter.city));
    if (filter.q) {
      const like = `%${filter.q.trim()}%`;
      const clause = or(
        ilike(businesses.name, like),
        ilike(businesses.description, like),
        ilike(businesses.city, like),
        ilike(businesses.country, like),
      );
      if (clause) conditions.push(clause);
    }

    const rows = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        logoUrl: businesses.logoUrl,
        description: businesses.description,
        country: businesses.country,
        city: businesses.city,
        location: businesses.location,
        ratingSum: businesses.ratingSum,
        ratingCount: businesses.ratingCount,
        productCount: businesses.productCount,
        verification: businesses.verification,
        lat: businesses.lat,
        lng: businesses.lng,
      })
      .from(businesses)
      .where(and(...conditions))
      .orderBy(desc(businesses.ratingSum), desc(businesses.createdAt))
      .limit(filter.limit ?? 60);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      logoUrl: r.logoUrl,
      description: r.description,
      country: r.country,
      city: r.city,
      location: r.location || [r.city, r.country].filter(Boolean).join(", "),
      rating: r.ratingCount ? r.ratingSum / r.ratingCount : 0,
      ratingCount: r.ratingCount,
      productCount: r.productCount,
      verified: Boolean(r.verification && r.verification !== "unverified"),
      lat: r.lat ? Number(r.lat) : null,
      lng: r.lng ? Number(r.lng) : null,
    }));
  }, []);
}

export interface ShopLocation {
  country: string;
  city: string;
}

export async function listShopLocations(): Promise<ShopLocation[]> {
  return safeQuery(
    async () => {
      const rows = await db
        .select({ country: businesses.country, city: businesses.city })
        .from(businesses)
        .where(eq(businesses.status, "active"));
      const seen = new Set<string>();
      const out: ShopLocation[] = [];
      for (const r of rows) {
        if (!r.country && !r.city) continue;
        const key = `${r.country}::${r.city}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ country: r.country || "", city: r.city || "" });
      }
      return out.sort((a, b) => a.country.localeCompare(b.country) || a.city.localeCompare(b.city));
    },
    [],
  );
}
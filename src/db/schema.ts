import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/**
 * Data model for ISMAILI Market Place — Phase 1.
 *
 * Conventions:
 *  - Money is always stored as integer *cents* to avoid floating point errors.
 *  - Commission is stored as integer *basis points* (500 = 5.00%).
 *  - Loose / evolving data (settings, docs, delivery options, AI metadata) uses jsonb.
 *  - Table names are kept stable (e.g. `businesses`) so existing queries keep working;
 *    a "shop" in the UI is a row in `businesses`.
 */

const money = (name: string) => integer(name).notNull().default(0);

// ─────────────────────────────────────────────────────────────────────────────
// Identity & access
// ─────────────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().default(""),
    email: text("email"),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull().default(""),
    // buyer | seller | admin
    role: text("role").notNull().default("buyer"),
    // legacy single flag; kept for back-compat. Prefer verificationLevel.
    verified: boolean("verified").notNull().default(false),
    suspended: boolean("suspended").notNull().default(false),
    // none | phone | id | community
    verificationLevel: text("verification_level").notNull().default("none"),
    avatarUrl: text("avatar_url"),
    country: text("country").notNull().default(""),
    city: text("city").notNull().default(""),
    locale: text("locale").notNull().default("en"),
    currency: text("currency").notNull().default("USD"),
    stripeCustomerId: text("stripe_customer_id"),
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_key").on(t.email),
    uniqueIndex("users_phone_key").on(t.phone),
  ],
);

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // phone number or email the code was sent to
    identifier: text("identifier").notNull(),
    codeHash: text("code_hash").notNull(),
    // signup | login | verify
    purpose: text("purpose").notNull().default("login"),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("otp_identifier_idx").on(t.identifier, t.purpose)],
);

export const verificationRequests = pgTable(
  "verification_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // id | community
    level: text("level").notNull(),
    // { idDocUrl, selfieUrl, communityRef, note }
    docs: jsonb("docs"),
    // pending | approved | rejected
    status: text("status").notNull().default("pending"),
    reviewerId: uuid("reviewer_id"),
    reviewNote: text("review_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (t) => [index("verification_status_idx").on(t.status)],
);

// ─────────────────────────────────────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────────────────────────────────────

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    parentId: uuid("parent_id"),
    icon: text("icon"),
    imageUrl: text("image_url"),
    featured: boolean("featured").notNull().default(false),
    sort: integer("sort").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("categories_slug_key").on(t.slug)],
);

export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    logoUrl: text("logo_url"),
    coverUrl: text("cover_url"),
    description: text("description").notNull().default(""),
    category: text("category").notNull().default(""),
    location: text("location").notNull().default(""),
    country: text("country").notNull().default(""),
    city: text("city").notNull().default(""),
    lat: numeric("lat", { precision: 9, scale: 6 }),
    lng: numeric("lng", { precision: 9, scale: 6 }),
    contactMethod: text("contact_method").notNull().default("message"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    businessHours: text("business_hours"),
    // what this shop sells
    sellsPhysical: boolean("sells_physical").notNull().default(true),
    sellsDigital: boolean("sells_digital").notNull().default(false),
    sellsServices: boolean("sells_services").notNull().default(false),
    // { shipping: bool, pickup: bool, digital: bool, note: string }
    deliveryOptions: jsonb("delivery_options"),
    // active | archived | pending | suspended
    status: text("status").notNull().default("active"),
    // unverified | phone | email | id | community
    verification: text("verification").notNull().default("unverified"),
    // online | contact
    paymentMode: text("payment_mode").notNull().default("online"),
    commissionBps: integer("commission_bps").notNull().default(500),
    // Stripe Connect
    stripeAccountId: text("stripe_account_id"),
    stripeChargesEnabled: boolean("stripe_charges_enabled").notNull().default(false),
    // denormalised counters for fast listings
    ratingCount: integer("rating_count").notNull().default(0),
    ratingSum: integer("rating_sum").notNull().default(0),
    productCount: integer("product_count").notNull().default(0),
    welfareRoundUpEnabled: boolean("welfare_round_up_enabled").notNull().default(false),
    suspendedReason: text("suspended_reason"),
    reviewedBy: uuid("reviewed_by"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("businesses_slug_key").on(t.slug),
    index("businesses_owner_idx").on(t.ownerUserId),
    index("businesses_status_idx").on(t.status),
    index("businesses_location_idx").on(t.country, t.city),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    priceCents: money("price_cents"),
    quantity: integer("quantity").notNull().default(0),
    // physical | digital | service
    kind: text("kind").notNull().default("physical"),
    currency: text("currency").notNull().default("USD"),
    // new | used | refurbished | made_to_order
    condition: text("condition").notNull().default("new"),
    sku: text("sku"),
    // active | sold_out | archived | pending | draft
    status: text("status").notNull().default("active"),
    allowBackorder: boolean("allow_backorder").notNull().default(false),
    category: text("category").notNull().default(""),
    // { size, colour, material, ... } anything type-specific
    attributes: jsonb("attributes"),
    // true when a seller used the AI listing assistant
    aiGenerated: boolean("ai_generated").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    featuredUntil: timestamp("featured_until", { withTimezone: true }),
    viewCount: integer("view_count").notNull().default(0),
    soldCount: integer("sold_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("products_business_idx").on(t.businessId),
    index("products_status_idx").on(t.status),
    index("products_category_idx").on(t.category),
    index("products_kind_idx").on(t.kind),
    index("products_name_idx").on(t.name),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt"),
    width: integer("width"),
    height: integer("height"),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

// ─────────────────────────────────────────────────────────────────────────────
// Orders, payments, escrow
// ─────────────────────────────────────────────────────────────────────────────

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    // pending | confirmed | shipped | completed | cancelled
    status: text("status").notNull().default("pending"),
    // unpaid | paid | refunded | partially_refunded
    paymentStatus: text("payment_status").notNull().default("unpaid"),
    // online | contact
    paymentMode: text("payment_mode").notNull().default("online"),
    // shipping | pickup | digital
    deliveryMethod: text("delivery_method").notNull().default("shipping"),
    // none | held | released | refunded
    escrowStatus: text("escrow_status").notNull().default("none"),
    // stripe | jazzcash | easypaisa | razorpay | mpesa | bank | cod
    paymentProvider: text("payment_provider").notNull().default("stripe"),
    paymentRef: text("payment_ref"),
    currency: text("currency").notNull().default("USD"),
    subtotalCents: money("subtotal_cents"),
    totalCents: money("total_cents"),
    commissionCents: money("commission_cents"),
    processingFeeCents: money("processing_fee_cents"),
    sellerPayoutCents: money("seller_payout_cents"),
    welfareRoundUpCents: money("welfare_round_up_cents"),
    shippingName: text("shipping_name").notNull().default(""),
    shippingPhone: text("shipping_phone").notNull().default(""),
    shippingAddress: text("shipping_address").notNull().default(""),
    trackingCode: text("tracking_code"),
    shippingCarrier: text("shipping_carrier"),
    note: text("note").notNull().default(""),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("orders_buyer_idx").on(t.buyerId),
    index("orders_business_idx").on(t.businessId),
    index("orders_status_idx").on(t.status),
    index("orders_escrow_idx").on(t.escrowStatus),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull(),
    nameSnapshot: text("name_snapshot").notNull(),
    imageSnapshot: text("image_snapshot"),
    kindSnapshot: text("kind_snapshot").notNull().default("physical"),
    currency: text("currency").notNull().default("USD"),
    priceCents: integer("price_cents").notNull(),
    qty: integer("qty").notNull(),
    commissionBps: integer("commission_bps").notNull().default(0),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

/** Immutable order timeline used by order tracking. */
export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    note: text("note").notNull().default(""),
    actorId: uuid("actor_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("stripe"),
    providerRef: text("provider_ref"),
    amountCents: money("amount_cents"),
    currency: text("currency").notNull().default("USD"),
    // pending | succeeded | failed | refunded
    status: text("status").notNull().default("pending"),
    raw: jsonb("raw"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payments_order_idx").on(t.orderId)],
);

export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    amountCents: money("amount_cents"),
    currency: text("currency").notNull().default("USD"),
    // pending | paid | failed
    status: text("status").notNull().default("pending"),
    provider: text("provider").notNull().default("stripe"),
    providerRef: text("provider_ref"),
    periodStart: timestamp("period_start", { withTimezone: true }),
    periodEnd: timestamp("period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payouts_business_idx").on(t.businessId)],
);

export const disputes = pgTable(
  "disputes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    openedBy: uuid("opened_by").notNull(),
    reason: text("reason").notNull(),
    // open | resolved | refunded | rejected
    status: text("status").notNull().default("open"),
    resolution: text("resolution"),
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [index("disputes_status_idx").on(t.status)],
);

/** Ledger of round-up / donation contributions to the welfare fund. */
export const welfareContributions = pgTable(
  "welfare_contributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    amountCents: money("amount_cents"),
    currency: text("currency").notNull().default("USD"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("welfare_business_idx").on(t.businessId)],
);

// ─────────────────────────────────────────────────────────────────────────────
// Messaging & reviews
// ─────────────────────────────────────────────────────────────────────────────

export const threads = pgTable(
  "threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    productId: uuid("product_id"),
    subject: text("subject").notNull().default(""),
    lastMessagePreview: text("last_message_preview").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("threads_buyer_idx").on(t.buyerId),
    index("threads_business_idx").on(t.businessId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id").notNull(),
    body: text("body").notNull(),
    // auto-translation fields: original text, its language, and machine translation
    bodyOriginal: text("body_original").notNull().default(""),
    bodyLang: text("body_lang").notNull().default(""),
    bodyTranslated: text("body_translated"),
    translatedLang: text("translated_lang"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [index("messages_thread_idx").on(t.threadId)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    buyerId: uuid("buyer_id").notNull(),
    businessId: uuid("business_id").notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull().default(""),
    sellerReply: text("seller_reply"),
    images: jsonb("images"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reviews_business_idx").on(t.businessId),
    uniqueIndex("reviews_order_key").on(t.orderId),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// Engagement: wishlist (favourites), reports, activity
// ─────────────────────────────────────────────────────────────────────────────

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("favorites_user_product_key").on(t.userId, t.productId)],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id"),
    // product | message | profile | listing | seller
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    reason: text("reason").notNull(),
    // low | medium | high
    severity: text("severity").notNull().default("medium"),
    autoFlagged: boolean("auto_flagged").notNull().default(false),
    // open | resolved | dismissed
    status: text("status").notNull().default("open"),
    resolutionNote: text("resolution_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reports_status_idx").on(t.status)],
);

/** Generic feed of notable actions, powers the activity feed. */
export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id"),
    // listing_created | seller_joined | review_posted | order_completed | collection_added | ...
    type: text("type").notNull(),
    targetType: text("target_type"),
    targetId: uuid("target_id"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activity_events_created_idx").on(t.createdAt)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // whatsapp | sms | email | inapp
    channel: text("channel").notNull().default("inapp"),
    template: text("template").notNull(),
    payload: jsonb("payload"),
    // queued | sent | failed
    status: text("status").notNull().default("queued"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId)],
);

/** GDPR data export / deletion requests. */
export const dataRequests = pgTable(
  "data_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // export | delete
    type: text("type").notNull(),
    // pending | completed | rejected
    status: text("status").notNull().default("pending"),
    fileUrl: text("file_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("data_requests_user_idx").on(t.userId)],
);

// ─────────────────────────────────────────────────────────────────────────────
// Community & content
// ─────────────────────────────────────────────────────────────────────────────

/** Featured collections such as Women Entrepreneurs, Youth Startups, etc. */
export const collections = pgTable(
  "collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url"),
    // women | youth | heritage | farmers | custom
    kind: text("kind").notNull().default("custom"),
    sort: integer("sort").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("collections_slug_key").on(t.slug)],
);

export const collectionItems = pgTable(
  "collection_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("collection_items_collection_idx").on(t.collectionId)],
);

/** Announcements / campaigns shown to users. */
export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    // all | buyers | sellers
    audience: text("audience").notNull().default("all"),
    // draft | scheduled | active | ended
    status: text("status").notNull().default("draft"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("campaigns_status_idx").on(t.status)],
);

/** Moderation rules: terms that are blocked or flagged. */
export const bannedKeywords = pgTable(
  "banned_keywords",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    term: text("term").notNull(),
    // block | flag
    action: text("action").notNull().default("flag"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("banned_keywords_term_key").on(t.term)],
);

/** Mentorship guides with optional video. */
export const mentorshipGuides = pgTable(
  "mentorship_guides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    videoUrl: text("video_url"),
    category: text("category").notNull().default(""),
    sort: integer("sort").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Platform configuration
// ─────────────────────────────────────────────────────────────────────────────

export const platformSettings = pgTable("platform_settings", {
  id: text("id").primaryKey().default("default"),
  commissionBps: integer("commission_bps").notNull().default(500),
  autoApprove: boolean("auto_approve").notNull().default(true),
  currency: text("currency").notNull().default("USD"),
  // e.g. ["USD","PKR","AED","GBP","EUR","INR","KES","CAD"]
  supportedCurrencies: jsonb("supported_currencies"),
  // e.g. ["en","ur"]
  supportedLocales: jsonb("supported_locales"),
  roundUpEnabled: boolean("round_up_enabled").notNull().default(true),
  welfareFundName: text("welfare_fund_name").notNull().default("Community Welfare Fund"),
  bannedItems: text("banned_items").notNull().default(""),
  impactBaseline: jsonb("impact_baseline"),
  supportPhone: text("support_phone").notNull().default(""),
  supportWhatsapp: text("support_whatsapp").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Inferred types
// ─────────────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type OtpCode = typeof otpCodes.$inferSelect;
export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
export type Dispute = typeof disputes.$inferSelect;
export type Thread = typeof threads.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type ActivityEvent = typeof activityEvents.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type DataRequest = typeof dataRequests.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type CollectionItem = typeof collectionItems.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type BannedKeyword = typeof bannedKeywords.$inferSelect;
export type MentorshipGuide = typeof mentorshipGuides.$inferSelect;
export type PlatformSettings = typeof platformSettings.$inferSelect;
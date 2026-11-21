/**
 * Seed the ISMAILI Market Place database with realistic demo data.
 *
 *   npm run db:seed
 *
 * Safe to re-run: it TRUNCATEs the demo tables first, then inserts a fresh set.
 * Demo logins (password for all): password123
 *   buyer@demo.test  · seller@demo.test  · seller2@demo.test  · admin@demo.test
 */
import bcrypt from "bcryptjs";
import { db, pool } from "./index";
import {
  bannedKeywords,
  businesses,
  categories,
  collectionItems,
  collections,
  favorites,
  mentorshipGuides,
  messages,
  orderItems,
  orders,
  platformSettings,
  productImages,
  products,
  reviews,
  threads,
  users,
} from "./schema";

const PASSWORD = "password123";
const PH = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env and start Postgres first.");
    process.exit(1);
  }

  console.log("Clearing existing demo data…");
  await pool.query(
    `TRUNCATE TABLE messages, threads, order_items, order_events, payments, payouts, disputes, welfare_contributions,
       activity_events, notifications, data_requests, verification_requests, otp_codes,
       collection_items, collections, campaigns, banned_keywords, mentorship_guides,
       orders, reviews, favorites, product_images, products, businesses, categories, reports, users, platform_settings
     RESTART IDENTITY CASCADE`,
  );

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  console.log("Creating users…");
  const [admin] = await db
    .insert(users)
    .values({
      name: "Platform Admin",
      email: "admin@demo.test",
      passwordHash,
      role: "admin",
      verified: true,
    })
    .returning({ id: users.id });

  const [buyer] = await db
    .insert(users)
    .values({
      name: "Sara Ahmed",
      email: "buyer@demo.test",
      phone: "+923001112233",
      passwordHash,
      role: "buyer",
      verified: true,
    })
    .returning({ id: users.id });

  const [seller] = await db
    .insert(users)
    .values({
      name: "Amina Khan",
      email: "seller@demo.test",
      phone: "+923004445566",
      passwordHash,
      role: "seller",
      verified: true,
    })
    .returning({ id: users.id });

  const [seller2] = await db
    .insert(users)
    .values({
      name: "Yusuf Ali",
      email: "seller2@demo.test",
      phone: "+923007778899",
      passwordHash,
      role: "seller",
      verified: true,
    })
    .returning({ id: users.id });

  console.log("Creating categories…");
  const categorySeeds: { name: string; slug: string }[] = [
    { name: "Baked Goods", slug: "baked-goods" },
    { name: "Fresh Produce", slug: "fresh-produce" },
    { name: "Clothing & Accessories", slug: "clothing-accessories" },
    { name: "Home & Garden", slug: "home-garden" },
    { name: "Handmade & Crafts", slug: "handmade-crafts" },
    { name: "Electronics", slug: "electronics" },
    { name: "Beauty & Care", slug: "beauty-care" },
    { name: "Services", slug: "services" },
  ];
  await db.insert(categories).values(categorySeeds.map((c, i) => ({ ...c, sort: i })));

  console.log("Creating businesses…");
  const [aminaShop] = await db
    .insert(businesses)
    .values({
      ownerUserId: seller.id,
      name: "Amina's Kitchen",
      slug: "aminas-kitchen",
      description:
        "Home-baked breads, cakes and treats made fresh every morning with simple, honest ingredients.",
      category: "Baked Goods",
      location: "Karachi, Block 7",
      country: "Pakistan",
      city: "Karachi",
      sellsPhysical: true,
      sellsDigital: false,
      sellsServices: false,
      deliveryOptions: { shipping: true, pickup: true, digital: false, note: "Local pickup in Block 7" },
      contactMethod: "message",
      contactPhone: "+923004445566",
      contactEmail: "amina@demo.test",
      businessHours: "Mon–Sat, 8am–6pm",
      status: "active",
      verification: "phone",
      paymentMode: "online",
      commissionBps: 500,
      coverUrl: PH("aminas-cover"),
      logoUrl: PH("aminas-logo"),
    })
    .returning({ id: businesses.id });

  const [yusufShop] = await db
    .insert(businesses)
    .values({
      ownerUserId: seller2.id,
      name: "Yusuf Handmade",
      slug: "yusuf-handmade",
      description: "Hand-knitted scarves, beanies and small leather goods, made one at a time.",
      category: "Handmade & Crafts",
      location: "Lahore",
      country: "Pakistan",
      city: "Lahore",
      sellsPhysical: true,
      sellsDigital: false,
      sellsServices: true,
      deliveryOptions: { shipping: true, pickup: false, digital: false, note: "Ships nationwide" },
      contactMethod: "phone",
      contactPhone: "+923007778899",
      businessHours: "Mon–Fri, 10am–5pm",
      status: "active",
      verification: "email",
      paymentMode: "contact",
      commissionBps: 500,
      coverUrl: PH("yusuf-cover"),
      logoUrl: PH("yusuf-logo"),
    })
    .returning({ id: businesses.id });

  console.log("Creating products…");
  type ProductSeed = {
    businessId: string;
    name: string;
    description: string;
    priceCents: number;
    quantity: number;
    status: string;
    category: string;
    allowBackorder?: boolean;
    kind?: string;
    imageSeed: string;
  };

  const productSeeds: ProductSeed[] = [
    {
      businessId: aminaShop.id,
      name: "Fresh Sourdough Loaf",
      description: "A crusty, tangy loaf baked this morning. Made with flour, water, salt and time.",
      priceCents: 650,
      quantity: 20,
      status: "active",
      category: "Baked Goods",
      imageSeed: "sourdough",
    },
    {
      businessId: aminaShop.id,
      name: "Cinnamon Rolls (6 pack)",
      description: "Soft rolls with cinnamon sugar and a light glaze. Perfect with tea.",
      priceCents: 900,
      quantity: 15,
      status: "active",
      category: "Baked Goods",
      imageSeed: "cinnamon",
    },
    {
      businessId: aminaShop.id,
      name: "Banana Bread",
      description: "Moist banana bread made with ripe bananas and walnuts.",
      priceCents: 500,
      quantity: 8,
      status: "active",
      category: "Baked Goods",
      imageSeed: "bananabread",
    },
    {
      businessId: aminaShop.id,
      name: "Special Date Cake",
      description: "Rich date cake, a family favourite. Made to order.",
      priceCents: 1200,
      quantity: 0,
      status: "sold_out",
      category: "Baked Goods",
      imageSeed: "datecake",
    },
    {
      businessId: yusufShop.id,
      name: "Hand-knitted Wool Scarf",
      description: "Warm, soft wool scarf knitted by hand. Choose from several colours on request.",
      priceCents: 2500,
      quantity: 5,
      status: "active",
      category: "Handmade & Crafts",
      imageSeed: "scarf",
    },
    {
      businessId: yusufShop.id,
      name: "Wool Beanie",
      description: "Cozy knitted beanie, one size fits most.",
      priceCents: 1800,
      quantity: 10,
      status: "active",
      category: "Handmade & Crafts",
      imageSeed: "beanie",
    },
    {
      businessId: yusufShop.id,
      name: "Leather Card Wallet",
      description: "Hand-stitched leather wallet that holds your cards and a little cash.",
      priceCents: 3500,
      quantity: 3,
      status: "active",
      category: "Handmade & Crafts",
      imageSeed: "wallet",
    },
    {
      businessId: yusufShop.id,
      name: "Embroidered Cushion Cover",
      description: "Cotton cushion cover with hand embroidery. 45cm x 45cm.",
      priceCents: 2200,
      quantity: 12,
      status: "active",
      category: "Home & Garden",
      imageSeed: "cushion",
    },
  ];

  const insertedProducts = await db
    .insert(products)
    .values(
      productSeeds.map((p) => ({
        businessId: p.businessId,
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        quantity: p.quantity,
        status: p.status,
        allowBackorder: p.allowBackorder ?? false,
        category: p.category,
        kind: p.kind ?? "physical",
        currency: "USD",
        viewCount: Math.floor(Math.random() * 120) + 10,
        soldCount: Math.floor(Math.random() * 15),
      })),
    )
    .returning({ id: products.id, name: products.name });

  const productIdByName = new Map(insertedProducts.map((p) => [p.name, p.id]));

  await db.insert(productImages).values(
    productSeeds.map((p, i) => ({
      productId: insertedProducts[i].id,
      url: PH(p.imageSeed),
      sort: 0,
    })),
  );

  console.log("Creating orders…");
  const breadId = productIdByName.get("Fresh Sourdough Loaf")!;
  const cinnamonId = productIdByName.get("Cinnamon Rolls (6 pack)")!;
  const bananaId = productIdByName.get("Banana Bread")!;
  const scarfId = productIdByName.get("Hand-knitted Wool Scarf")!;

  async function makeOrder(opts: {
    businessId: string;
    status: string;
    paymentStatus: string;
    paymentMode: string;
    createdAt: Date;
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    items: { productId: string; name: string; imageSeed: string; priceCents: number; qty: number }[];
  }) {
    const subtotal = opts.items.reduce((s, it) => s + it.priceCents * it.qty, 0);
    const commission = Math.round((subtotal * 500) / 10000);
    const [order] = await db
      .insert(orders)
      .values({
        buyerId: buyer.id,
        businessId: opts.businessId,
        status: opts.status,
        paymentStatus: opts.paymentStatus,
        paymentMode: opts.paymentMode,
        deliveryMethod: "shipping",
        escrowStatus: opts.paymentStatus === "paid" ? "released" : "none",
        paymentProvider: opts.paymentMode === "contact" ? "cod" : "stripe",
        currency: "USD",
        subtotalCents: subtotal,
        totalCents: subtotal,
        commissionCents: commission,
        sellerPayoutCents: subtotal - commission,
        shippingName: opts.shippingName,
        shippingPhone: opts.shippingPhone,
        shippingAddress: opts.shippingAddress,
        createdAt: opts.createdAt,
        updatedAt: opts.createdAt,
      })
      .returning({ id: orders.id });
    await db.insert(orderItems).values(
      opts.items.map((it) => ({
        orderId: order.id,
        productId: it.productId,
        nameSnapshot: it.name,
        imageSnapshot: PH(it.imageSeed),
        priceCents: it.priceCents,
        qty: it.qty,
      })),
    );
    return order.id;
  }

  const completedOrderId = await makeOrder({
    businessId: aminaShop.id,
    status: "completed",
    paymentStatus: "paid",
    paymentMode: "online",
    createdAt: daysAgo(6),
    shippingName: "Sara Ahmed",
    shippingPhone: "+923001112233",
    shippingAddress: "12 Garden Road, Karachi",
    items: [
      { productId: breadId, name: "Fresh Sourdough Loaf", imageSeed: "sourdough", priceCents: 650, qty: 1 },
      { productId: cinnamonId, name: "Cinnamon Rolls (6 pack)", imageSeed: "cinnamon", priceCents: 900, qty: 2 },
    ],
  });

  await makeOrder({
    businessId: aminaShop.id,
    status: "pending",
    paymentStatus: "unpaid",
    paymentMode: "online",
    createdAt: daysAgo(1),
    shippingName: "Sara Ahmed",
    shippingPhone: "+923001112233",
    shippingAddress: "12 Garden Road, Karachi",
    items: [{ productId: bananaId, name: "Banana Bread", imageSeed: "bananabread", priceCents: 500, qty: 1 }],
  });

  await makeOrder({
    businessId: yusufShop.id,
    status: "confirmed",
    paymentStatus: "unpaid",
    paymentMode: "contact",
    createdAt: daysAgo(2),
    shippingName: "Sara Ahmed",
    shippingPhone: "+923001112233",
    shippingAddress: "12 Garden Road, Karachi",
    items: [{ productId: scarfId, name: "Hand-knitted Wool Scarf", imageSeed: "scarf", priceCents: 2500, qty: 1 }],
  });

  console.log("Creating a conversation…");
  const [thread] = await db
    .insert(threads)
    .values({
      buyerId: buyer.id,
      businessId: aminaShop.id,
      productId: breadId,
      subject: "Question about the sourdough",
      lastMessageAt: daysAgo(1),
      createdAt: daysAgo(2),
    })
    .returning({ id: threads.id });

  await db.insert(messages).values([
    {
      threadId: thread.id,
      senderId: buyer.id,
      body: "Hi! Is the sourdough very sour, or mild? I am new to it.",
      createdAt: daysAgo(2),
      readAt: daysAgo(2),
    },
    {
      threadId: thread.id,
      senderId: seller.id,
      body: "Hello! It is mild and a little tangy — perfect for toast. Fresh batches every morning.",
      createdAt: daysAgo(1),
    },
  ]);

  console.log("Creating a review…");
  await db.insert(reviews).values({
    orderId: completedOrderId,
    buyerId: buyer.id,
    businessId: aminaShop.id,
    rating: 5,
    comment: "The bread was still warm when it arrived. Absolutely lovely.",
  });

  console.log("Saving a favourite…");
  await db.insert(favorites).values({ userId: buyer.id, productId: scarfId });

  console.log("Writing platform settings…");
  await db.insert(platformSettings).values({
    id: "default",
    commissionBps: 500,
    autoApprove: true,
    currency: "USD",
    supportPhone: "+10000000000",
    supportWhatsapp: "10000000000",
  });

  console.log("Creating community content…");
  const insertedCollections = await db
    .insert(collections)
    .values([
      { slug: "women-entrepreneurs", title: "Women Entrepreneurs", description: "Businesses built and run by women in our community.", kind: "women", sort: 0 },
      { slug: "youth-startups", title: "Youth Startups", description: "Fresh ideas from the next generation of makers.", kind: "youth", sort: 1 },
      { slug: "handmade-heritage", title: "Handmade Heritage", description: "Crafts passed down through generations.", kind: "heritage", sort: 2 },
      { slug: "local-farmers", title: "Local Farmers", description: "Fresh produce straight from nearby farms.", kind: "farmers", sort: 3 },
    ])
    .returning({ id: collections.id, slug: collections.slug });

  const colBySlug = new Map(insertedCollections.map((c) => [c.slug, c.id]));
  await db.insert(collectionItems).values([
    { collectionId: colBySlug.get("women-entrepreneurs")!, businessId: aminaShop.id },
    { collectionId: colBySlug.get("handmade-heritage")!, businessId: yusufShop.id },
  ]);

  await db.insert(bannedKeywords).values([
    { term: "counterfeit", action: "block" },
    { term: "weapon", action: "block" },
    { term: "replica", action: "flag" },
  ]);

  await db.insert(mentorshipGuides).values([
    { title: "Photographing your products with a phone", summary: "Simple tips for bright, honest photos using just your phone and daylight.", category: "Getting started", sort: 0 },
    { title: "Writing a product description that sells", summary: "What to include so buyers feel confident.", category: "Getting started", sort: 1 },
    { title: "Setting fair prices", summary: "Cover your costs and value your time.", category: "Pricing", sort: 2 },
  ]);

  console.log("\nDone! Demo accounts (password: password123):");
  console.log(`  Buyer  : buyer@demo.test`);
  console.log(`  Seller : seller@demo.test  (Amina's Kitchen)`);
  console.log(`  Seller : seller2@demo.test (Yusuf Handmade)`);
  console.log(`  Admin  : admin@demo.test`);
  console.log(`  Admin id: ${admin.id}`);
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Seed failed:", err);
    await pool.end();
    process.exit(1);
  });
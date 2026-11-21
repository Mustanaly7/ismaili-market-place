# ISMAILI Market Place

A multi-vendor marketplace built for real people — with a hard focus on **simplicity for older, non-technical sellers**. Buyers browse, message sellers directly, and check out in a few taps. Sellers open a shop in four short steps, add products with their phone camera, and manage orders with clear, single-action buttons. Admins moderate listings, users, reports, and platform fees.

> **Design north star — the “90-Year-Old Test”.** Every screen must be usable by a 70–90-year-old with a phone and no technical background. That drives concrete rules baked into this codebase:
> - Body text ≥ 16px, primary actions ≥ 20px, and a one-tap **larger-text mode**.
> - Tap targets ≥ 44×44px (`min-h-touch`).
> - One primary action per screen.
> - Plain language everywhere (no “SKU”, no “fulfilment”, no jargon).
> - Step-by-step wizards with **“Step N of M”** and a Back button.
> - Confirmation before anything destructive.
> - A persistent **“Need help?”** button on every page (call / WhatsApp).
> - Mobile-first, lightweight pages, forgiving inputs.

## Features

**Buyers**
- Home, browse, category, and keyword search with filters and sorting
- Product detail with gallery, schema.org Product JSON-LD, stock status, reviews
- Storefront pages per seller
- Cart, checkout (online payment **or** “contact to order”), order confirmation
- Account: orders, saved favourites, messages

**Sellers**
- Four-step onboarding wizard with progress and Back
- Dashboard with sales, views, and message counters
- Product CRUD, bulk actions, duplicate, and per-item delete with confirmation
- Orders screen with clear status buttons and “mark as paid”
- Insights (views, messages, items sold, revenue, orders over time)
- Shop settings and a guarded **Start over** flow (hide vs. permanent delete)

**Admins**
- Marketplace overview (users, shops, products, orders, GMV)
- Moderation queue for pending products and shops
- User management (suspend / reinstate)
- Reports inbox (resolve / dismiss)
- Category CRUD and platform settings (commission %, auto-approve, currency)

**Platform**
- Email-or-phone sign-up/login with bcrypt-hashed passwords and rate limiting
- Postgres + Drizzle ORM; money stored as integer cents, commission as basis points
- S3/MinIO image uploads with on-upload compression (falls back to local disk)
- Stripe payment intents via REST (simulated automatically when no key is set)
- Redis-backed rate limiting with an in-memory fallback
- SSR/SEO metadata, WCAG 2.1 AA-minded UI, and translation-ready copy (`src/lib/i18n.ts`)

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 |
| Database | PostgreSQL 16 via Drizzle ORM |
| Cache / limits | Redis 7 (ioredis) with in-memory fallback |
| Files | S3 / MinIO (AWS SDK v3) with local `/public/uploads` fallback |
| Payments | Stripe REST API (simulated when unconfigured) |
| Auth | `jose` JWT in an httpOnly cookie + `bcryptjs` |
| Tests | Vitest |

## Quick start

**Prerequisites:** Node 18+, npm, and Docker (for Postgres and Redis).

```bash
# 1. Install dependencies
npm install

# 2. Start local services (Postgres + Redis)
docker compose up -d

# 3. Create the database schema and load demo data
npm run db:push
npm run db:seed

# 4. Run the app
npm run dev
```

Open <http://localhost:3000>.

> Configuration is read from `.env`. Copy `.env.example` to `.env` if it does not exist; the defaults already match `docker-compose.yml`. If you skip Docker, point `DATABASE_URL` at any Postgres instance.

> **Product images** are stored on local disk (`public/uploads`) by default — no object storage is required. The local stack is just Postgres + Redis. To use S3/MinIO instead, set `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` and `S3_PUBLIC_URL` in `.env`. (Note: MinIO images are no longer on Docker Hub, so point at any reachable S3/MinIO endpoint.)

### Demo accounts

All demo passwords are **`password123`**.

| Role | Email | Notes |
| --- | --- | --- |
| Buyer | `buyer@demo.test` | Has orders, a favourite, and a conversation |
| Seller | `seller@demo.test` | “Amina’s Kitchen” (online payments) |
| Seller | `seller2@demo.test` | “Yusuf Handmade” (contact to order) |
| Admin | `admin@demo.test` | Full moderation and settings access |

## Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public base URL | `http://localhost:3000` |
| `DATABASE_URL` | Postgres connection string | `postgres://ismaili:ismaili@localhost:5433/ismaili` |
| `REDIS_URL` | Redis URL (optional) | `redis://localhost:6379` |
| `SESSION_SECRET` | Signs session cookies — **change in production** | dev default |
| `S3_ENDPOINT` / `S3_REGION` / `S3_BUCKET` | Object storage | MinIO defaults |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` / `S3_PUBLIC_URL` | Object storage | MinIO defaults |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Real payments (optional) | empty → simulated |
| `NEXT_PUBLIC_SUPPORT_PHONE` / `NEXT_PUBLIC_SUPPORT_WHATSAPP` | “Need help?” contacts | sample values |

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint (`next lint`) |
| `npm test` | Run Vitest unit tests |
| `npm run db:push` | Apply schema to the database |
| `npm run db:seed` | Load demo data (truncates demo tables first) |
| `npm run db:setup` | `db:push` + `db:seed` |

> Note: `npm run lint` requires `eslint` and `eslint-config-next` to be installed (`npm i -D eslint eslint-config-next`). Type-checking and the production build are the primary checks and run without extra setup.

## Project structure

```
src/
  app/            # Routes (App Router). Buyer, seller, admin, api, help/terms/privacy
  components/     # UI kit (ui/), layout, cart, product, seller, forms
  db/             # Drizzle schema, pooled client, seed script
  lib/            # env, auth, session, redis, storage, stripe, validation, i18n, utils
  server/         # Read helpers (queries) and `actions/` (mutations)
test/             # Vitest unit tests (utils, validation, i18n)
```

Data-access queries live in `src/server/*` and are wrapped in `safeQuery`, so pages render a friendly state instead of crashing if the database is not reachable. Mutations live in `src/server/actions/*` as server actions with Zod validation.

## Accessibility & UX notes

- Skip link, visible focus rings, semantic landmarks, and `aria-*` where state is conveyed.
- The larger-text toggle persists in `localStorage` and bumps the base size; a small inline script applies it before paint to avoid layout shift.
- Destructive actions (delete product, bulk delete, start over) require explicit confirmation.
- All money display goes through `formatMoney` (integer cents) to avoid rounding surprises.

## Payments

- With `STRIPE_SECRET_KEY` set, checkout creates real Stripe PaymentIntents; the webhook at `/api/stripe/webhook` marks orders paid on `payment_intent.succeeded`.
- Without keys, checkout runs in **simulated mode** and always succeeds — perfect for demos.
- Sellers set to “contact to order” skip online payment entirely; buyers and sellers arrange payment directly.

## Deployment notes

1. Provision Postgres, Redis, and an S3 bucket; set the environment variables.
2. Set a strong `SESSION_SECRET`.
3. Run `npm run db:push` against the production database.
4. `npm run build` then `npm start` (or deploy to your platform of choice).
5. Point `S3_PUBLIC_URL` at the bucket/CDN and configure the Stripe webhook endpoint.
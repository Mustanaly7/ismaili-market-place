import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ShoppingBag,
  Store,
  MessageCircle,
  ShieldCheck,
  Truck,
  Languages,
  BadgeCheck,
  ArrowRight,
  Sprout,
  Heart,
  Users,
  Sparkles,
  ImageOff,
} from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getFeaturedProducts, listCategories } from "@/server/catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ISMAILI Market Place — simple local shopping",
  description:
    "Browse local sellers, message them directly, and buy simply. No complicated steps.",
};

const collections = [
  {
    title: "Women Entrepreneurs",
    blurb: "Businesses built and run by women in our community.",
    icon: Heart,
    className: "from-rose-500/90 to-rose-700",
  },
  {
    title: "Youth Startups",
    blurb: "Fresh ideas from the next generation of makers.",
    icon: Sparkles,
    className: "from-brand-500/90 to-brand-800",
  },
  {
    title: "Handmade Heritage",
    blurb: "Crafts passed down through generations.",
    icon: Users,
    className: "from-accent-400 to-accent-700",
  },
  {
    title: "Local Farmers",
    blurb: "Fresh produce straight from nearby farms.",
    icon: Sprout,
    className: "from-emerald-500/90 to-brand-800",
  },
];

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(8),
    listCategories(),
  ]);
  const collage = featured.slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-stone-200/70 bg-gradient-to-b from-brand-50/80 via-[#fbf9f6] to-[#fbf9f6]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent-200/40 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 xl:grid-cols-2 xl:py-20">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand-800 shadow-soft ring-1 ring-brand-100">
              <Store aria-hidden className="h-4 w-4" />
              Local sellers, real people
            </span>
            <h1 className="mt-5 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
              Find something made{" "}
              <span className="relative whitespace-nowrap">
                with care
                <span
                  aria-hidden
                  className="absolute inset-x-0 -bottom-1 h-2 rounded-full bg-accent-300/70"
                />
              </span>
              .
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-600 sm:text-xl">
              Browse local shops, message sellers directly, and buy in a few taps. Simple
              for everyone — even if you have never shopped online before.
            </p>

            <form action="/search" className="mt-7 flex max-w-lg items-center">
              <div className="relative w-full">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute start-5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="search"
                  name="q"
                  placeholder="What are you looking for?"
                  aria-label="Search products"
                  className="h-14 w-full rounded-full border border-stone-200 bg-white ps-14 pe-24 text-base text-stone-900 shadow-soft transition placeholder:text-stone-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 sm:pe-36 sm:text-lg"
                />
                <button
                  type="submit"
                  className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 sm:px-6 sm:text-base"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/browse" variant="primary" size="lg">
                <ShoppingBag aria-hidden className="h-5 w-5" />
                Browse products
              </LinkButton>
              <LinkButton href="/sell" variant="secondary" size="lg">
                Start selling
              </LinkButton>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-stone-500">
              <li className="flex items-center gap-1.5">
                <BadgeCheck aria-hidden className="h-4 w-4 text-brand-600" />
                Verified sellers
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck aria-hidden className="h-4 w-4 text-brand-600" />
                Secure escrow
              </li>
              <li className="flex items-center gap-1.5">
                <Truck aria-hidden className="h-4 w-4 text-brand-600" />
                Delivery or pickup
              </li>
              <li className="flex items-center gap-1.5">
                <Languages aria-hidden className="h-4 w-4 text-brand-600" />
                English &amp; Urdu
              </li>
            </ul>
          </div>

          {/* Featured collage */}
          <div className="relative mx-auto w-full max-w-md animate-fade-in xl:max-w-none">
            <div className="relative aspect-[4/5] w-full sm:aspect-[5/4] xl:aspect-[4/5]">
              <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-3 sm:gap-4">
                {collage.slice(0, 3).map((p, i) => (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                    className={`group relative overflow-hidden rounded-3xl border border-white/60 bg-white shadow-card ${
                      i === 0 ? "row-span-2" : ""
                    }`}
                  >
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="(max-width: 1280px) 50vw, 25vw"
                        priority={i === 0}
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-300">
                        <ImageOff aria-hidden className="h-10 w-10" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3">
                      <p className="line-clamp-1 text-sm font-semibold text-white">{p.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
              {collage.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center rounded-3xl border-2 border-dashed border-stone-200 bg-white p-8 text-center text-stone-500">
                  Shops are just opening. Be one of the first to sell here!
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Shop by category</h2>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/browse?category=${encodeURIComponent(c.name)}`}
                className="inline-flex min-h-touch items-center rounded-full border border-stone-200 bg-white px-5 py-2 text-base font-semibold text-stone-700 shadow-soft transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Popular right now</h2>
            <p className="mt-1 text-base text-stone-500">Hand-picked from local shops.</p>
          </div>
          <Link
            href="/browse"
            className="inline-flex items-center gap-1 text-base font-semibold text-brand-700 transition hover:gap-2 hover:text-brand-800"
          >
            See all
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
        <ProductGrid
          products={featured}
          emptyTitle="No products yet"
          emptyDescription="Once sellers add products they will show up here."
          emptyAction={<LinkButton href="/sell">Be the first seller</LinkButton>}
        />
      </section>

      {/* Community collections */}
      <section className="border-y border-stone-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Community collections</h2>
            <p className="mt-1 text-base text-stone-500">Celebrating the people behind the shops.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {collections.map((col) => (
              <Link
                key={col.title}
                href="/browse"
                className={`group relative flex aspect-[5/4] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br ${col.className} p-5 text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lift`}
              >
                <col.icon aria-hidden className="absolute right-4 top-4 h-7 w-7 text-white/80" />
                <h3 className="text-lg font-bold leading-tight">{col.title}</h3>
                <p className="mt-1 text-sm text-white/85">{col.blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Buying is this simple
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: ShoppingBag,
              title: "1. Browse freely",
              text: "Look around without an account. Search or explore categories.",
            },
            {
              icon: MessageCircle,
              title: "2. Ask anything",
              text: "Message the seller directly if you have a question before buying.",
            },
            {
              icon: Store,
              title: "3. Buy in a few taps",
              text: "Check out simply, or arrange payment with the seller directly.",
            },
          ].map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-card"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <step.icon aria-hidden className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
              <p className="mt-1.5 text-base leading-relaxed text-stone-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Seller CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-6 py-12 text-center text-white shadow-lift sm:px-12 sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent-300/25 blur-3xl"
          />
          <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">
            Have something to sell?
          </h2>
          <p className="relative mx-auto mt-3 max-w-2xl text-lg text-brand-100 sm:text-xl">
            Open your shop in minutes. Add a photo, a name, a price — that is all you need to start.
          </p>
          <div className="relative mt-7 flex justify-center">
            <LinkButton href="/sell" variant="secondary" size="lg">
              Start selling today
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
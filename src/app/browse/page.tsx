import Link from "next/link";
import { SlidersHorizontal, Store } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { listCategories, listProductCards, listShopLocations } from "@/server/catalog";

export const dynamic = "force-dynamic";

export const metadata = { title: "Browse" };

const SORTS = [
  { key: "new", label: "Newest" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
  { key: "rating", label: "Top rated" },
] as const;

const KINDS = [
  { key: "", label: "All types" },
  { key: "physical", label: "Physical" },
  { key: "digital", label: "Digital" },
  { key: "service", label: "Services" },
] as const;

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    country?: string;
    city?: string;
    kind?: string;
    min?: string;
    max?: string;
  }>;
}) {
  const sp = await searchParams;
  const category = sp.category?.trim() || "";
  const country = sp.country?.trim() || "";
  const city = sp.city?.trim() || "";
  const kind = sp.kind?.trim() || "";
  const minCents = sp.min && !Number.isNaN(Number(sp.min)) ? Math.round(Number(sp.min) * 100) : undefined;
  const maxCents = sp.max && !Number.isNaN(Number(sp.max)) ? Math.round(Number(sp.max) * 100) : undefined;
  const sort = (SORTS.find((s) => s.key === sp.sort)?.key ?? "new") as
    | "new"
    | "price_asc"
    | "price_desc"
    | "rating";

  const [products, categories, locations] = await Promise.all([
    listProductCards({
      category: category || undefined,
      country: country || undefined,
      city: city || undefined,
      kind: kind || undefined,
      minCents,
      maxCents,
      sort,
      limit: 60,
    }),
    listCategories(),
    listShopLocations(),
  ]);

  const countries = Array.from(new Set(locations.map((l) => l.country).filter(Boolean))).sort();
  const cities = Array.from(
    new Set(
      locations
        .filter((l) => !country || l.country === country)
        .map((l) => l.city)
        .filter(Boolean),
    ),
  ).sort();

  const buildHref = (s: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (country) params.set("country", country);
    if (city) params.set("city", city);
    if (kind) params.set("kind", kind);
    if (sp.min) params.set("min", sp.min);
    if (sp.max) params.set("max", sp.max);
    params.set("sort", s);
    return `/browse?${params.toString()}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Browse products</h1>
          <p className="mt-1 text-lg text-stone-600">
            {products.length} {products.length === 1 ? "item" : "items"}
            {category ? ` in ${category}` : ""}
            {city || country ? ` · ${[city, country].filter(Boolean).join(", ")}` : ""}
          </p>
        </div>
        <Link
          href="/shops"
          className="inline-flex min-h-touch items-center gap-2 rounded-xl border-2 border-brand-200 bg-brand-50 px-4 font-bold text-brand-800 hover:bg-brand-100"
        >
          <Store aria-hidden className="h-5 w-5" /> Shops near me
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/browse"
          className={`inline-flex min-h-touch items-center rounded-full px-4 py-1.5 text-base font-semibold ${
            category ? "border-2 border-stone-200 bg-white text-stone-700" : "bg-brand-600 text-white"
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/browse?category=${encodeURIComponent(c.name)}`}
            className={`inline-flex min-h-touch items-center rounded-full px-4 py-1.5 text-base font-semibold ${
              category === c.name
                ? "bg-brand-600 text-white"
                : "border-2 border-stone-200 bg-white text-stone-700 hover:border-brand-300"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <form
        method="get"
        action="/browse"
        className="mt-4 grid grid-cols-2 items-end gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-card sm:grid-cols-3 lg:grid-cols-6"
      >
        <input type="hidden" name="category" value={category} />
        <input type="hidden" name="sort" value={sort} />
        <div className="col-span-2 flex items-center gap-2 text-base font-bold text-stone-700 sm:col-span-3 lg:col-span-6">
          <SlidersHorizontal aria-hidden className="h-5 w-5 text-brand-600" /> Filters
        </div>
        <label className="flex flex-col gap-1 text-sm font-semibold text-stone-600">
          Country
          <select
            name="country"
            defaultValue={country}
            className="min-h-touch rounded-xl border-2 border-stone-300 px-2 text-base"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-stone-600">
          City
          <select
            name="city"
            defaultValue={city}
            className="min-h-touch rounded-xl border-2 border-stone-300 px-2 text-base"
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-stone-600">
          Type
          <select
            name="kind"
            defaultValue={kind}
            className="min-h-touch rounded-xl border-2 border-stone-300 px-2 text-base"
          >
            {KINDS.map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-stone-600">
          Min price
          <input
            type="number"
            name="min"
            min={0}
            defaultValue={sp.min ?? ""}
            placeholder="0"
            className="min-h-touch w-full rounded-xl border-2 border-stone-300 px-2 text-base"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-stone-600">
          Max price
          <input
            type="number"
            name="max"
            min={0}
            defaultValue={sp.max ?? ""}
            placeholder="Any"
            className="min-h-touch w-full rounded-xl border-2 border-stone-300 px-2 text-base"
          />
        </label>
        <button
          type="submit"
          className="col-span-2 inline-flex min-h-touch w-full items-center justify-center rounded-xl bg-brand-600 px-4 text-base font-bold text-white hover:bg-brand-700 sm:col-span-1"
        >
          Apply
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-y border-stone-200 py-2">
        <span className="text-base font-semibold text-stone-500">Sort:</span>
        {SORTS.map((s) => (
          <Link
            key={s.key}
            href={buildHref(s.key)}
            className={`inline-flex min-h-touch items-center rounded-lg px-3 py-1 text-base font-medium ${
              sort === s.key ? "bg-brand-100 text-brand-800" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <ProductGrid
          products={products}
          emptyTitle="No products here yet"
          emptyDescription="Try another filter or check back soon."
        />
      </div>
    </div>
  );
}
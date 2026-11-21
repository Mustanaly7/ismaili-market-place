import { ProductGrid } from "@/components/product/ProductGrid";
import { Search } from "lucide-react";
import { listCategories, listProductCards } from "@/server/catalog";

export const dynamic = "force-dynamic";

export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    min?: string;
    max?: string;
    sort?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const category = sp.category?.trim() ?? "";
  const minCents = sp.min ? Math.round(Number(sp.min) * 100) : undefined;
  const maxCents = sp.max ? Math.round(Number(sp.max) * 100) : undefined;
  const sort = (["new", "price_asc", "price_desc", "rating"].includes(sp.sort ?? "")
    ? sp.sort
    : "new") as "new" | "price_asc" | "price_desc" | "rating";

  const [products, categories] = await Promise.all([
    q || category || minCents || maxCents
      ? listProductCards({
          q: q || undefined,
          category: category || undefined,
          minCents,
          maxCents,
          sort,
          limit: 60,
        })
      : Promise.resolve([]),
    listCategories(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">
        {q ? `Results for “${q}”` : "Search the marketplace"}
      </h1>

      <form
        method="get"
        action="/search"
        className="mt-4 rounded-2xl border border-stone-200 bg-white p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
            />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search products, sellers, or categories"
              aria-label="Search"
              className="min-h-touch w-full rounded-xl border-2 border-stone-300 pl-10 pr-3 py-2 text-lg focus:border-brand-500 focus:outline-none"
            />
          </div>
          <select
            name="category"
            defaultValue={category}
            aria-label="Category"
            className="min-h-touch rounded-xl border-2 border-stone-300 px-3 text-lg"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="min"
            defaultValue={sp.min ?? ""}
            placeholder="Min $"
            min={0}
            aria-label="Minimum price"
            className="min-h-touch w-full rounded-xl border-2 border-stone-300 px-3 text-lg sm:w-24"
          />
          <input
            type="number"
            name="max"
            defaultValue={sp.max ?? ""}
            placeholder="Max $"
            min={0}
            aria-label="Maximum price"
            className="min-h-touch w-full rounded-xl border-2 border-stone-300 px-3 text-lg sm:w-24"
          />
          <button
            type="submit"
            className="inline-flex min-h-touch w-full items-center justify-center rounded-xl bg-brand-600 px-6 text-lg font-bold text-white hover:bg-brand-700 sm:w-auto"
          >
            Search
          </button>
        </div>
      </form>

      <p className="mt-4 text-lg text-stone-600">
        {products.length} {products.length === 1 ? "result" : "results"}
      </p>

      <div className="mt-4">
        <ProductGrid
          products={products}
          emptyTitle={q ? "No matches found" : "Start your search"}
          emptyDescription={
            q
              ? "Try fewer or different words, or browse a category instead."
              : "Type what you are looking for, or browse by category."
          }
        />
      </div>
    </div>
  );
}
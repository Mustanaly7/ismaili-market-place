import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Store, Sparkles } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ShopCard } from "@/components/shop/ShopCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { listActiveCollections, getCollectionBySlug } from "@/server/community";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = await getCollectionBySlug(slug);
  return { title: detail?.collection.title ?? "Collection" };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getCollectionBySlug(slug);
  if (!detail) notFound();

  const { collection, products, shops } = detail;
  const all = await listActiveCollections();
  const others = all.filter((c) => c.slug !== collection.slug).slice(0, 4);
  const isEmpty = products.length === 0 && shops.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link
        href="/collections"
        className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-brand-700"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" /> All collections
      </Link>

      <header className="mt-4 rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-8 text-white sm:p-10">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-brand-100 ring-1 ring-white/20">
          <Sparkles aria-hidden className="h-4 w-4" /> Featured collection
        </p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{collection.title}</h1>
        {collection.description ? (
          <p className="mt-3 max-w-2xl text-lg text-brand-100">{collection.description}</p>
        ) : null}
      </header>

      {isEmpty ? (
        <div className="mt-8">
          <EmptyState
            title="Nothing here just yet"
            description="Sellers are being added to this collection. Please check back soon."
            action={
              <Link href="/browse" className="font-semibold text-brand-700 hover:underline">
                Browse all products
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {shops.length > 0 ? (
            <section>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-stone-900">
                <Store aria-hidden className="h-6 w-6 text-brand-700" /> Shops in this collection
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {shops.map((s) => (
                  <ShopCard key={s.id} shop={s} />
                ))}
              </div>
            </section>
          ) : null}

          {products.length > 0 ? (
            <section>
              <h2 className="text-2xl font-bold text-stone-900">Products</h2>
              <div className="mt-4">
                <ProductGrid products={products} />
              </div>
            </section>
          ) : null}
        </div>
      )}

      {others.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-stone-900">More collections</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {others.map((c) => (
              <Link
                key={c.id}
                href={`/collections/${c.slug}`}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
              >
                {c.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
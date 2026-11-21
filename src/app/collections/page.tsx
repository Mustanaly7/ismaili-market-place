import Link from "next/link";
import { HeartHandshake, Rocket, Palette, Sprout, Sparkles, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { listActiveCollections } from "@/server/community";

export const dynamic = "force-dynamic";
export const metadata = { title: "Featured collections" };

const KIND_ICON: Record<string, typeof Sparkles> = {
  women: HeartHandshake,
  youth: Rocket,
  heritage: Palette,
  farmers: Sprout,
};

const KIND_LABEL: Record<string, string> = {
  women: "Women Entrepreneurs",
  youth: "Youth Startups",
  heritage: "Handmade Heritage",
  farmers: "Local Farmers",
  custom: "Community",
};

export default async function CollectionsPage() {
  const collections = await listActiveCollections();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="max-w-2xl">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 ring-1 ring-brand-200">
          <Sparkles aria-hidden className="h-4 w-4" /> Community spotlights
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-stone-900">
          Featured collections
        </h1>
        <p className="mt-3 text-lg text-stone-600">
          Discover sellers and products from across our community — women-led businesses, young
          founders, heritage crafts, and local farmers.
        </p>
      </header>

      {collections.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No collections yet"
            description="Community collections will appear here soon."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => {
            const Icon = KIND_ICON[c.kind] ?? Sparkles;
            return (
              <Link
                key={c.id}
                href={`/collections/${c.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="flex items-center gap-3 bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
                    <Icon aria-hidden className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">
                      {KIND_LABEL[c.kind] ?? "Community"}
                    </p>
                    <h2 className="text-xl font-bold leading-tight">{c.title}</h2>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="line-clamp-3 text-base text-stone-600">{c.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-brand-700 group-hover:gap-2.5">
                    Explore collection
                    <ArrowRight aria-hidden className="h-4 w-4 transition-all" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
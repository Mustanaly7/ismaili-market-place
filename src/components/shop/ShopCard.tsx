import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, MapPin, Store } from "lucide-react";
import { Stars } from "@/components/ui/Stars";
import type { ShopCardData } from "@/server/catalog";

export function ShopCard({ shop }: { shop: ShopCardData }) {
  return (
    <Link
      href={`/store/${shop.slug}`}
      className="group flex gap-4 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100">
        {shop.logoUrl ? (
          <Image
            src={shop.logoUrl}
            alt={shop.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <Store aria-hidden className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="flex items-center gap-1.5 truncate text-lg font-bold text-stone-900">
          {shop.name}
          {shop.verified ? (
            <BadgeCheck aria-label="Verified seller" className="h-4 w-4 shrink-0 text-brand-600" />
          ) : null}
        </h3>
        {shop.description ? (
          <p className="line-clamp-1 text-sm text-stone-500">{shop.description}</p>
        ) : null}
        {shop.location ? (
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-stone-400">
            <MapPin aria-hidden className="h-3.5 w-3.5 shrink-0" />
            {shop.location}
          </p>
        ) : null}
        <div className="mt-1.5 flex items-center gap-3">
          <Stars rating={shop.rating} count={shop.ratingCount} size={14} />
          <span className="text-xs font-medium text-stone-400">
            {shop.productCount} item{shop.productCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </Link>
  );
}
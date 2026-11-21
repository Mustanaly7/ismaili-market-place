import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, ImageOff, MapPin, Package, Sparkles } from "lucide-react";
import { Stars } from "@/components/ui/Stars";
import { formatMoney } from "@/lib/utils";
import type { ProductCardData } from "@/server/catalog";

const KIND_LABEL: Record<string, string> = {
  physical: "Physical",
  digital: "Digital",
  service: "Service",
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const soldOut = product.status === "sold_out" || (product.quantity <= 0 && product.status !== "active");
  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative aspect-square bg-stone-100">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <ImageOff aria-hidden className="h-12 w-12" />
          </div>
        )}
        {soldOut ? (
          <span className="absolute left-3 top-3 rounded-full bg-stone-900/85 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            Sold out
          </span>
        ) : product.paymentMode === "contact" ? (
          <span className="absolute left-3 top-3 rounded-full bg-accent-400/95 px-3 py-1 text-xs font-bold text-brand-950 backdrop-blur">
            Contact to order
          </span>
        ) : null}
        {product.kind !== "physical" ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-brand-800 backdrop-blur">
            {product.kind === "digital" ? (
              <Sparkles aria-hidden className="h-3.5 w-3.5" />
            ) : (
              <Package aria-hidden className="h-3.5 w-3.5" />
            )}
            {KIND_LABEL[product.kind] ?? product.kind}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-stone-900">
          {product.name}
        </h3>
        <p className="flex items-center gap-1 truncate text-sm text-stone-500">
          {product.businessName}
          {product.verified ? (
            <BadgeCheck aria-label="Verified seller" className="h-4 w-4 shrink-0 text-brand-600" />
          ) : null}
        </p>
        {product.location ? (
          <p className="flex items-center gap-1 truncate text-xs text-stone-400">
            <MapPin aria-hidden className="h-3.5 w-3.5 shrink-0" />
            {product.location}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-2">
          <span className="whitespace-nowrap text-lg font-bold tracking-tight text-brand-700">
            {formatMoney(product.priceCents)}
          </span>
          <Stars rating={product.rating} count={product.ratingCount} size={14} />
        </div>
      </div>
    </Link>
  );
}
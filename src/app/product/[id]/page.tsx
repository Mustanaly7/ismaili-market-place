import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Store, MapPin, ShieldCheck, MessageCircle } from "lucide-react";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddToCartPanel } from "@/components/product/AddToCartPanel";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { ContactSellerForm } from "@/components/product/ContactSellerForm";
import { ReportForm } from "@/components/product/ReportForm";
import { Badge } from "@/components/ui/Badge";
import { Stars } from "@/components/ui/Stars";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/utils";
import { getProductDetail, getBusinessReviews } from "@/server/catalog";
import { isFavorite } from "@/server/account";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProductDetail(id);
  if (!data) return { title: "Product not found" };
  return {
    title: data.product.name,
    description: data.product.description.slice(0, 160) || `${data.product.name} on ISMAILI Market Place`,
    openGraph: { images: data.images.slice(0, 1) },
  };
}

function verificationLabel(v: string) {
  if (v === "id") return "ID verified";
  if (v === "phone") return "Phone verified";
  if (v === "email") return "Email verified";
  return null;
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProductDetail(id);
  if (!data) notFound();

  const { product, business, images, rating, ratingCount } = data;
  const [user, reviews] = await Promise.all([
    getCurrentUser(),
    getBusinessReviews(business.id),
  ]);
  const favorited = user ? await isFavorite(user.id, product.id) : false;

  const soldOut = product.status !== "active";
  const stockText = product.allowBackorder
    ? "Available — made to order"
    : product.quantity > 0
      ? `${product.quantity} in stock`
      : "Sold out";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images,
    description: product.description,
    brand: { "@type": "Brand", name: business.name },
    offers: {
      "@type": "Offer",
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: "USD",
      availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <nav className="mb-4 text-base text-stone-500">
        <Link href="/browse" className="hover:text-brand-700 hover:underline">
          Browse
        </Link>
        {product.category ? (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/browse?category=${encodeURIComponent(product.category)}`}
              className="hover:text-brand-700 hover:underline"
            >
              {product.category}
            </Link>
          </>
        ) : null}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={images} alt={product.name} />

        <div>
          {product.category ? <Badge tone="brand">{product.category}</Badge> : null}
          {product.kind !== "physical" ? (
            <Badge tone="accent">{product.kind === "digital" ? "Digital product" : "Service"}</Badge>
          ) : null}
          <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">{product.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-3xl font-extrabold text-brand-700">
              {formatMoney(product.priceCents)}
            </span>
            <Stars rating={rating} count={ratingCount} />
          </div>

          <p className="mt-3">
            <Badge tone={soldOut ? "danger" : product.allowBackorder ? "warning" : "success"}>
              {stockText}
            </Badge>
          </p>

          <div className="mt-5">
            <AddToCartPanel
              item={{
                productId: product.id,
                name: product.name,
                priceCents: product.priceCents,
                image: images[0] ?? null,
                businessId: business.id,
                businessName: business.name,
                paymentMode: business.paymentMode === "contact" ? "contact" : "online",
                kind: product.kind === "digital" ? "digital" : product.kind === "service" ? "service" : "physical",
              }}
              maxQty={product.quantity}
              soldOut={soldOut}
              allowBackorder={product.allowBackorder}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <FavoriteButton productId={product.id} isFavorited={favorited} next={`/product/${product.id}`} />
          </div>

          {(() => {
            const d = (business.deliveryOptions ?? {}) as {
              shipping?: boolean;
              pickup?: boolean;
              digital?: boolean;
              note?: string;
            };
            const opts: string[] = [];
            if (d.shipping) opts.push("Ships to you");
            if (d.pickup) opts.push("Local pickup");
            if (d.digital) opts.push("Instant digital delivery");
            if (opts.length === 0 && !d.note) return null;
            return (
              <div className="mt-4 rounded-xl bg-stone-50 p-3">
                <p className="text-sm font-bold uppercase tracking-wide text-stone-500">Delivery</p>
                {opts.length ? (
                  <p className="mt-1 text-base text-stone-700">{opts.join(" · ")}</p>
                ) : null}
                {d.note ? <p className="mt-1 text-sm text-stone-500">{d.note}</p> : null}
              </div>
            );
          })()}

          {product.description ? (
            <div className="mt-6">
              <h2 className="text-xl font-bold">Details</h2>
              <p className="mt-1 whitespace-pre-line text-lg text-stone-700">{product.description}</p>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-4">
            <Link href={`/store/${business.slug}`} className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-brand-100 text-xl font-bold text-brand-700">
                {business.logoUrl ? (
                  <Image src={business.logoUrl} alt={business.name} fill sizes="48px" className="object-cover" />
                ) : (
                  business.name.charAt(0)
                )}
              </div>
              <div>
                <p className="flex items-center gap-2 text-lg font-bold text-stone-900">
                  {business.name}
                  {verificationLabel(business.verification) ? (
                    <ShieldCheck aria-label={verificationLabel(business.verification)!} className="h-5 w-5 text-brand-600" />
                  ) : null}
                </p>
                <p className="flex items-center gap-1 text-base text-stone-500">
                  <MapPin aria-hidden className="h-4 w-4" />
                  {business.location || "Local seller"}
                </p>
              </div>
              <span className="ml-auto text-base font-semibold text-brand-700">Visit shop →</span>
            </Link>
          </div>

          <div className="mt-6">
            <ContactSellerForm
              businessId={business.id}
              productId={product.id}
              next={`/product/${product.id}`}
              sellerName={business.name}
            />
          </div>

          <div className="mt-4">
            <ReportForm targetType="product" targetId={product.id} next={`/product/${product.id}`} />
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Reviews from buyers</h2>
        {reviews.length === 0 ? (
          <p className="mt-2 text-lg text-stone-600">
            No reviews yet. Reviews can only be left after a completed order.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <Stars rating={r.rating} />
                  <span className="text-sm text-stone-400">{formatDate(r.createdAt)}</span>
                </div>
                {r.comment ? <p className="mt-2 text-lg text-stone-700">{r.comment}</p> : null}
                {r.sellerReply ? (
                  <div className="mt-2 rounded-xl border-s-4 border-brand-400 bg-brand-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Seller reply</p>
                    <p className="mt-1 text-base text-brand-900">{r.sellerReply}</p>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10 flex items-center gap-2 rounded-xl bg-stone-100 p-3 text-base text-stone-500">
        <MessageCircle aria-hidden className="h-5 w-5" />
        Questions? Use the message box above — sellers reply in the app and by email.
      </div>
    </div>
  );
}
import { notFound } from "next/navigation";
import Image from "next/image";
import { MapPin, Clock, ShieldCheck, Store } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ContactSellerForm } from "@/components/product/ContactSellerForm";
import { ReportForm } from "@/components/product/ReportForm";
import { ShareShop } from "@/components/shop/ShareShop";
import { Stars } from "@/components/ui/Stars";
import { Badge } from "@/components/ui/Badge";
import { getStorefrontBySlug } from "@/server/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getStorefrontBySlug(slug);
  if (!data) return { title: "Shop not found" };
  return {
    title: data.business.name,
    description: data.business.description.slice(0, 160) || `${data.business.name} on ISMAILI Market Place`,
  };
}

function verificationLabel(v: string) {
  if (v === "id") return "ID verified";
  if (v === "phone") return "Phone verified";
  if (v === "email") return "Email verified";
  return null;
}

/** Demo seed images point at random placeholder photos — treat them as "no image". */
function isPlaceholderImage(url?: string | null) {
  if (!url) return true;
  return url.includes("picsum.photos") || url.includes("placehold");
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getStorefrontBySlug(slug);
  if (!data) notFound();
  const { business, products, rating, ratingCount } = data;
  const verified = verificationLabel(business.verification);
  const hasCover = !isPlaceholderImage(business.coverUrl);
  const hasLogo = !isPlaceholderImage(business.logoUrl);
  const initial = business.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div>
      <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 sm:h-52">
        {hasCover ? (
          <>
            <Image
              src={business.coverUrl as string}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center"
              priority
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent"
            />
          </>
        ) : (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute -right-4 -top-10 select-none text-[8rem] font-black leading-none text-white/10 sm:-right-6 sm:text-[11rem]"
            >
              {initial}
            </div>
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.20),transparent_55%)]"
            />
          </>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-start gap-4 pt-4 sm:pt-6">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-brand-600 text-3xl font-black text-white shadow-lg ring-1 ring-black/5 sm:h-24 sm:w-24">
            {hasLogo ? (
              <Image src={business.logoUrl as string} alt={business.name} fill sizes="96px" className="object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-x-2 gap-y-1 break-words text-2xl font-extrabold leading-tight text-stone-900 sm:text-3xl">
              <span className="min-w-0 break-words">{business.name}</span>
              {verified ? (
                <ShieldCheck aria-label={verified} className="h-6 w-6 shrink-0 text-brand-600" />
              ) : null}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-stone-600">
              <Stars rating={rating} count={ratingCount} />
              {business.location ? (
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin aria-hidden className="h-4 w-4 shrink-0" /> {business.location}
                </span>
              ) : null}
              {business.businessHours ? (
                <span className="flex min-w-0 items-center gap-1">
                  <Clock aria-hidden className="h-4 w-4 shrink-0" /> {business.businessHours}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {business.category ? <Badge tone="brand">{business.category}</Badge> : null}
          {business.paymentMode === "contact" ? (
            <Badge tone="accent">Contact to order</Badge>
          ) : (
            <Badge tone="success">Online checkout</Badge>
          )}
          {business.sellsPhysical ? <Badge tone="neutral">Physical goods</Badge> : null}
          {business.sellsDigital ? <Badge tone="neutral">Digital goods</Badge> : null}
          {business.sellsServices ? <Badge tone="neutral">Services</Badge> : null}
        </div>

        <div className="mt-4">
          <ShareShop name={business.name} />
        </div>

        {business.description ? (
          <p className="mt-4 max-w-3xl whitespace-pre-line text-lg text-stone-700">
            {business.description}
          </p>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">
              <Store aria-hidden className="h-6 w-6 text-brand-600" />
              Products
            </h2>
            <ProductGrid
              products={products}
              emptyTitle="No products yet"
              emptyDescription="This shop has not added products yet."
            />
          </div>

          <aside className="flex flex-col gap-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <ContactSellerForm
                businessId={business.id}
                next={`/store/${business.slug}`}
                sellerName={business.name}
              />
            </div>
            <ReportForm targetType="profile" targetId={business.id} next={`/store/${business.slug}`} />
          </aside>
        </div>
      </div>
    </div>
  );
}
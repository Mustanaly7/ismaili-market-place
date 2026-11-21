import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Package,
  ShoppingBag,
  Eye,
  MessageCircle,
  Plus,
  ExternalLink,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { getBusinessByOwner, getSellerStats, getBusinessOrders } from "@/server/seller";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller dashboard" };

export default async function SellerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { ok, error } = await searchParams;
  const business = await getBusinessByOwner(user.id);
  if (!business) redirect("/seller/onboarding");

  const [stats, orders] = await Promise.all([
    getSellerStats(business.id),
    getBusinessOrders(business.id),
  ]);
  const recent = orders.slice(0, 5);

  const tiles = [
    { label: "Products", value: stats.productCount, icon: Package, href: "/seller/products" },
    { label: "New orders", value: stats.pendingOrders, icon: ShoppingBag, href: "/seller/orders" },
    { label: "Messages waiting", value: stats.unreadMessages, icon: MessageCircle, href: "/messages" },
    { label: "Item views", value: stats.totalViews, icon: Eye, href: "/seller/analytics" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-brand-700">{business.name}</p>
          <h1 className="text-3xl font-extrabold">Welcome back{user.name ? `, ${user.name}` : ""}</h1>
          <p className="text-lg text-stone-600">Here is how your shop is doing today.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={`/store/${business.slug}`} variant="outline">
            <ExternalLink aria-hidden className="h-5 w-5" />
            View my shop
          </LinkButton>
          <LinkButton href="/seller/products/new">
            <Plus aria-hidden className="h-5 w-5" />
            Add a product
          </LinkButton>
        </div>
      </div>

      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      {business.status === "pending" ? (
        <div className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-lg text-amber-800">
          Your shop is waiting for approval. You can still add products; they will go live once approved.
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="rounded-2xl border border-stone-200 bg-white p-5 hover:border-brand-300 hover:shadow-sm"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <t.icon aria-hidden className="h-6 w-6" />
            </span>
            <span className="mt-3 block text-4xl font-black">{t.value}</span>
            <span className="block text-base text-stone-600">{t.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/seller/payouts"
          className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 hover:border-brand-300 hover:shadow-sm"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <Wallet aria-hidden className="h-6 w-6" />
          </span>
          <div>
            <p className="text-base text-stone-600">Money earned</p>
            <p className="text-3xl font-black">{formatMoney(stats.revenueCents)}</p>
          </div>
        </Link>
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
            <ShoppingBag aria-hidden className="h-6 w-6" />
          </span>
          <div>
            <p className="text-base text-stone-600">Completed orders</p>
            <p className="text-3xl font-black">{stats.completedOrders}</p>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent orders</h2>
          <Link href="/seller/orders" className="text-lg font-semibold text-brand-700 hover:underline">
            See all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-2xl border border-stone-200 bg-white p-5 text-lg text-stone-600">
            No orders yet. Share your shop link with customers to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((o) => (
              <li
                key={o.order.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-4"
              >
                <span>
                  <span className="block text-lg font-semibold">{o.buyerName}</span>
                  <span className="block text-base text-stone-500">
                    {o.items.reduce((n, it) => n + it.qty, 0)} item(s) · {formatDateTime(o.order.createdAt)}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <Badge tone={o.order.status === "completed" ? "success" : "warning"}>
                    {o.order.status}
                  </Badge>
                  <span className="font-bold text-brand-700">{formatMoney(o.order.totalCents)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href="/seller/products"
        className="mt-8 flex items-center justify-between rounded-2xl bg-brand-600 p-6 text-white hover:bg-brand-700"
      >
        <span>
          <span className="block text-xl font-bold">Grow your shop</span>
          <span className="block text-brand-50">Add more products with clear photos and honest prices.</span>
        </span>
        <ArrowRight aria-hidden className="h-7 w-7" />
      </Link>
    </div>
  );
}
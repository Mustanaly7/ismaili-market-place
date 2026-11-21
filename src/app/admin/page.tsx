import Link from "next/link";
import { Users, Store, Package, ShoppingBag, Wallet, Flag, ArrowRight } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { getAdminStats, getRecentOrders, getTopCategories } from "@/server/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin overview" };

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const [stats, orders, topCategories] = await Promise.all([
    getAdminStats(),
    getRecentOrders(),
    getTopCategories(),
  ]);

  const tiles = [
    { label: "Total users", value: stats.totalUsers, icon: Users },
    { label: "Active shops", value: stats.activeBusinesses, icon: Store },
    { label: "Products", value: stats.totalProducts, icon: Package },
    { label: "Orders", value: stats.totalOrders, icon: ShoppingBag },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Marketplace overview</h1>
      <p className="text-lg text-stone-600">A snapshot of everything happening across ISMAILI.</p>
      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-stone-200 bg-white p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <t.icon aria-hidden className="h-6 w-6" />
            </span>
            <p className="mt-3 text-4xl font-black">{t.value}</p>
            <p className="text-base text-stone-600">{t.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <span className="flex items-center gap-2 text-base text-stone-600">
            <Wallet aria-hidden className="h-5 w-5 text-green-600" /> Gross merchandise value
          </span>
          <p className="mt-2 text-3xl font-black">{formatMoney(stats.gmvCents)}</p>
        </div>
        <Link
          href="/admin/moderation"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-5 hover:bg-amber-100"
        >
          <span className="flex items-center gap-2 text-base text-amber-800">
            <Package aria-hidden className="h-5 w-5" /> Waiting for review
          </span>
          <p className="mt-2 text-3xl font-black text-amber-900">{stats.pendingListings}</p>
        </Link>
        <Link
          href="/admin/reports"
          className="rounded-2xl border border-danger-200 bg-danger-50 p-5 hover:bg-danger-100"
        >
          <span className="flex items-center gap-2 text-base text-danger-800">
            <Flag aria-hidden className="h-5 w-5" /> Open reports
          </span>
          <p className="mt-2 text-3xl font-black text-danger-900">{stats.pendingReports}</p>
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent orders</h2>
          </div>
          {orders.length === 0 ? (
            <p className="rounded-2xl border border-stone-200 bg-white p-5 text-lg text-stone-600">No orders yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-4"
                >
                  <span>
                    <span className="block text-base font-semibold">{o.businessName}</span>
                    <span className="block text-sm text-stone-500">
                      {o.buyerName} · {formatDateTime(o.createdAt)}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Badge tone={o.status === "completed" ? "success" : "warning"}>{o.status}</Badge>
                    <span className="font-bold text-brand-700">{formatMoney(o.totalCents)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold">Top categories</h2>
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            {topCategories.length === 0 ? (
              <p className="text-base text-stone-500">No products yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {topCategories.map((c) => (
                  <li key={c.category} className="flex items-center justify-between text-lg">
                    <span className="text-stone-700">{c.category || "Uncategorised"}</span>
                    <span className="font-bold">{c.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link
            href="/admin/moderation"
            className="mt-3 flex items-center justify-between rounded-2xl bg-brand-600 p-5 text-white hover:bg-brand-700"
          >
            <span className="font-bold">Review submissions</span>
            <ArrowRight aria-hidden className="h-6 w-6" />
          </Link>
        </section>
      </div>
    </div>
  );
}
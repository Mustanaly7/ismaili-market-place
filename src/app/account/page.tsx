import Link from "next/link";
import { Package, Heart, MessageCircle, LogOut, ChevronRight, ShieldCheck, Lock } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/utils";
import { getBuyerOrders, getFavorites } from "@/server/account";
import { unreadMessageCount } from "@/server/messaging";
import { logoutAction } from "@/server/actions/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "My account" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { ok, error } = await searchParams;
  const [orders, favorites, unread] = await Promise.all([
    getBuyerOrders(user.id),
    getFavorites(user.id),
    unreadMessageCount(user),
  ]);

  const tiles = [
    { href: "/account/orders", label: "My orders", value: orders.length, icon: Package },
    { href: "/account/favorites", label: "Saved items", value: favorites.length, icon: Heart },
    { href: "/messages", label: "Messages", value: unread, icon: MessageCircle },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Hi {user.name || "there"} 👋</h1>
          <p className="text-lg text-stone-600">Here is your account.</p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="subtle">
            <LogOut aria-hidden className="h-5 w-5" />
            Log out
          </Button>
        </form>
      </div>

      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 hover:border-brand-300 hover:shadow-sm"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <t.icon aria-hidden className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-3xl font-extrabold">{t.value}</span>
              <span className="block text-base text-stone-600">{t.label}</span>
            </span>
          </Link>
        ))}
      </div>


      {user.role === "seller" || user.role === "admin" ? (
        <Link
          href="/seller/dashboard"
          className="mt-3 flex items-center justify-between rounded-2xl border border-brand-200 bg-brand-50 p-5 text-brand-800 hover:bg-brand-100"
        >
          <span className="text-lg font-bold">Go to your seller dashboard</span>
          <ChevronRight aria-hidden className="h-6 w-6" />
        </Link>
      ) : null}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent orders</h2>
          <Link href="/account/orders" className="text-lg font-semibold text-brand-700 hover:underline">
            See all
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="rounded-2xl border border-stone-200 bg-white p-5 text-lg text-stone-600">
            You have not ordered anything yet.{" "}
            <Link href="/browse" className="font-semibold text-brand-700 hover:underline">
              Start shopping
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {orders.slice(0, 3).map((o) => (
              <li key={o.id}>
                <Link
                  href={`/account/orders/${o.id}`}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 hover:border-brand-300"
                >
                  <span>
                    <span className="block text-lg font-semibold">{o.businessName}</span>
                    <span className="block text-base text-stone-500">
                      {o.itemCount} item{o.itemCount === 1 ? "" : "s"} · {formatDate(o.createdAt)}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Badge tone={o.status === "completed" ? "success" : "warning"}>{o.status}</Badge>
                    <span className="font-bold text-brand-700">{formatMoney(o.totalCents)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
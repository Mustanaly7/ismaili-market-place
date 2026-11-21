import { redirect } from "next/navigation";
import { Eye, MessageCircle, ShoppingBag, Wallet } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/utils";
import { getBusinessByOwner, getBusinessAnalytics } from "@/server/seller";

export const dynamic = "force-dynamic";
export const metadata = { title: "Insights" };

export default async function SellerAnalyticsPage() {
  const user = await requireUser();
  const business = await getBusinessByOwner(user.id);
  if (!business) redirect("/seller/onboarding");

  const a = await getBusinessAnalytics(business.id);
  const maxDay = Math.max(1, ...a.ordersByDay.map((d) => d.count));

  const tiles = [
    { label: "Item views", value: String(a.totalViews), icon: Eye },
    { label: "Messages received", value: String(a.messagesReceived), icon: MessageCircle },
    { label: "Items sold", value: String(a.itemsSold), icon: ShoppingBag },
    { label: "Revenue (completed)", value: formatMoney(a.revenueCents), icon: Wallet },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Insights</h1>
      <p className="text-lg text-stone-600">A simple look at how your shop is doing.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-stone-200 bg-white p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <t.icon aria-hidden className="h-6 w-6" />
            </span>
            <p className="mt-3 text-3xl font-black">{t.value}</p>
            <p className="text-base text-stone-600">{t.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-2xl font-bold">Orders over time</h2>
        {a.ordersByDay.length === 0 ? (
          <EmptyState title="No order history yet" description="Once you get orders, you will see them charted here." />
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex h-48 items-end gap-2">
              {a.ordersByDay.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-sm font-semibold text-stone-600">{d.count}</span>
                  <div
                    className="w-full rounded-t-lg bg-brand-500"
                    style={{ height: `${Math.max(6, (d.count / maxDay) * 100)}%` }}
                    role="img"
                    aria-label={`${d.day}: ${d.count} orders`}
                  />
                  <span className="text-xs text-stone-500">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <p className="mt-6 rounded-xl bg-stone-100 p-4 text-base text-stone-600">
        Tip: products with clear, bright photos and honest descriptions get more views and sell faster.
      </p>
    </div>
  );
}
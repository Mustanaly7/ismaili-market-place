import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/utils";
import { getBuyerOrders } from "@/server/account";

export const dynamic = "force-dynamic";
export const metadata = { title: "My orders" };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await getBuyerOrders(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-extrabold">My orders</h1>
        <Link href="/account" className="text-lg font-semibold text-brand-700 hover:underline">
          Back to account
        </Link>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you buy something, it will show up here."
          icon={<Package aria-hidden className="h-12 w-12" />}
          action={<LinkButton href="/browse">Browse products</LinkButton>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((o) => (
            <li key={o.id} className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-stone-100">
                    {o.firstImage ? (
                      <Image src={o.firstImage} alt="" fill sizes="64px" className="object-cover" />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{o.businessName}</p>
                    <p className="text-base text-stone-500">
                      {o.itemCount} item{o.itemCount === 1 ? "" : "s"} · {formatDate(o.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={o.status === "completed" ? "success" : o.status === "cancelled" ? "danger" : "warning"}>
                    {o.status}
                  </Badge>
                  <span className="text-lg font-bold text-brand-700">{formatMoney(o.totalCents)}</span>
                  <Link
                    href={`/account/orders/${o.id}`}
                    className="inline-flex min-h-touch items-center rounded-xl border-2 border-brand-600 px-4 py-1 text-base font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    View
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
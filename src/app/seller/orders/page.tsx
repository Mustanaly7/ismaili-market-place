import { redirect } from "next/navigation";
import Image from "next/image";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { getBusinessByOwner, getBusinessOrders } from "@/server/seller";
import { markOrderPaidAction, updateOrderStatusAction } from "@/server/actions/seller";
import { refundOrderAction } from "@/server/actions/disputes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders" };

const NEXT: Record<string, { value: string; label: string }[]> = {
  pending: [
    { value: "confirmed", label: "Confirm order" },
    { value: "cancelled", label: "Cancel order" },
  ],
  confirmed: [
    { value: "shipped", label: "Mark as shipped" },
    { value: "cancelled", label: "Cancel order" },
  ],
  shipped: [{ value: "completed", label: "Mark as completed" }],
  completed: [],
  cancelled: [],
};

const tone: Record<string, "success" | "warning" | "danger" | "brand" | "neutral"> = {
  pending: "warning",
  confirmed: "brand",
  shipped: "brand",
  completed: "success",
  cancelled: "danger",
};

export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { ok, error } = await searchParams;
  const business = await getBusinessByOwner(user.id);
  if (!business) redirect("/seller/onboarding");

  const orders = await getBusinessOrders(business.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Orders</h1>
      <p className="text-lg text-stone-600">Keep buyers updated by moving each order along.</p>
      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      <div className="mt-6">
        {orders.length === 0 ? (
          <EmptyState title="No orders yet" description="When a buyer orders, it will appear here with a clear next step." />
        ) : (
          <ul className="flex flex-col gap-4">
            {orders.map(({ order, buyerName, items }) => (
              <li key={order.id} className="rounded-2xl border border-stone-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold">Order {order.id.slice(0, 8)}</p>
                    <p className="text-base text-stone-500">
                      {buyerName} · {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={tone[order.status] ?? "neutral"}>{order.status}</Badge>
                    <Badge tone={order.paymentStatus === "paid" ? "success" : "neutral"}>
                      {order.paymentMode === "online" ? "Online" : "Direct"} · {order.paymentStatus}
                    </Badge>
                  </div>
                </div>

                <ul className="mt-3 divide-y divide-stone-100 rounded-xl border border-stone-100">
                  {items.map((it) => (
                    <li key={it.id} className="flex items-center justify-between gap-3 p-3">
                      <span className="flex items-center gap-3">
                        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                          {it.imageSnapshot ? (
                            <Image src={it.imageSnapshot} alt="" fill sizes="48px" className="object-cover" />
                          ) : null}
                        </span>
                        <span>
                          <span className="block text-base font-semibold">{it.nameSnapshot}</span>
                          <span className="block text-sm text-stone-500">
                            {formatMoney(it.priceCents)} × {it.qty}
                          </span>
                        </span>
                      </span>
                      <span className="font-semibold">{formatMoney(it.priceCents * it.qty)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 rounded-xl bg-stone-50 p-3 text-base text-stone-700">
                  <p className="font-semibold">Deliver to</p>
                  <p>{order.shippingName} · {order.shippingPhone}</p>
                  <p>{order.shippingAddress}</p>
                  {order.note ? <p className="mt-1 text-stone-600">Note: {order.note}</p> : null}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xl font-black text-brand-700">{formatMoney(order.totalCents)}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {order.paymentMode === "contact" && order.paymentStatus !== "paid" ? (
                      <form action={markOrderPaidAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <Button type="submit" variant="subtle" size="sm">
                          Mark as paid
                        </Button>
                      </form>
                    ) : null}
                    {(NEXT[order.status] ?? []).map((a) => (
                      <form key={a.value} action={updateOrderStatusAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="status" value={a.value} />
                        <Button
                          type="submit"
                          variant={a.value === "cancelled" ? "danger" : "primary"}
                          size="sm"
                        >
                          {a.label}
                        </Button>
                      </form>
                    ))}
                    {order.paymentStatus === "paid" && order.status !== "cancelled" ? (
                      <form action={refundOrderAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="back" value="/seller/orders" />
                        <Button type="submit" variant="outline" size="sm">
                          Refund buyer
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
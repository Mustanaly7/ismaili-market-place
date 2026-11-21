import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { StarPicker } from "@/components/ui/StarPicker";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { getOrderForBuyer } from "@/server/account";
import { getDisputeForOrder } from "@/server/disputes";
import { submitReviewAction } from "@/server/actions/shop";
import { openDisputeAction } from "@/server/actions/disputes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order detail" };

export default async function BuyerOrderDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const { ok, error } = await searchParams;
  const data = await getOrderForBuyer(id, user.id);
  if (!data) notFound();
  const { order, business, items, hasReview } = data;
  const dispute = await getDisputeForOrder(order.id, user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Order details</h1>
        <Link href="/account/orders" className="text-lg font-semibold text-brand-700 hover:underline">
          All orders
        </Link>
      </div>
      <Alert type="success" message={ok} />
      <Alert type="error" message={error} />

      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-base text-stone-500">Order</p>
            <p className="text-lg font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div>
            <p className="text-base text-stone-500">Placed</p>
            <p className="text-base">{formatDateTime(order.createdAt)}</p>
          </div>
          <Badge tone={order.status === "completed" ? "success" : order.status === "cancelled" ? "danger" : "warning"}>
            {order.status}
          </Badge>
        </div>

        <ul className="mt-4 flex flex-col divide-y divide-stone-100">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 py-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-stone-100">
                {it.imageSnapshot ? (
                  <Image src={it.imageSnapshot} alt={it.nameSnapshot} fill sizes="64px" className="object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold">{it.nameSnapshot}</p>
                <p className="text-base text-stone-500">Qty {it.qty}</p>
              </div>
              <span className="font-semibold">{formatMoney(it.priceCents * it.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-stone-200 pt-3 text-xl">
          <span className="font-bold">Total</span>
          <span className="font-extrabold text-brand-700">{formatMoney(order.totalCents)}</span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
        <p className="text-lg font-bold">Delivering to</p>
        <p className="mt-1 text-base text-stone-600">
          {order.shippingName} · {order.shippingPhone}
          <br />
          {order.shippingAddress}
        </p>
        <p className="mt-3 text-base text-stone-600">
          Seller:{" "}
          <Link href={`/store/${business.slug}`} className="font-semibold text-brand-700 hover:underline">
            {business.name}
          </Link>
        </p>
      </div>

      {order.status === "completed" ? (
        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-bold">Leave a review</h2>
          {hasReview ? (
            <p className="mt-2 text-lg text-green-700">Thanks — you already reviewed this order.</p>
          ) : (
            <form action={submitReviewAction} className="mt-3 flex flex-col gap-3">
              <input type="hidden" name="orderId" value={order.id} />
              <StarPicker />
              <Textarea name="comment" placeholder="Tell other buyers about your experience (optional)" />
              <Button type="submit" size="lg" className="self-start">
                Submit review
              </Button>
            </form>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-stone-100 p-4 text-base text-stone-600">
          You can leave a review once the seller marks this order as completed.
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-xl font-bold">Something wrong with this order?</h2>
        {dispute ? (
          <div className="mt-2">
            <Badge tone={dispute.status === "refunded" || dispute.status === "resolved" ? "success" : "warning"}>
              Case {dispute.status}
            </Badge>
            <p className="mt-2 text-base text-stone-600">You reported: {dispute.reason}</p>
            {dispute.resolution ? (
              <p className="mt-1 text-base text-stone-600">Resolution: {dispute.resolution}</p>
            ) : (
              <p className="mt-1 text-base text-stone-500">Our team is looking into it.</p>
            )}
          </div>
        ) : order.status === "cancelled" ? (
          <p className="mt-2 text-base text-stone-600">This order was cancelled and refunded.</p>
        ) : (
          <form action={openDisputeAction} className="mt-3 flex flex-col gap-3">
            <input type="hidden" name="orderId" value={order.id} />
            <p className="text-base text-stone-600">
              If something went wrong, open a case and our team will help. Payment stays safe in escrow.
            </p>
            <Textarea name="reason" required placeholder="Describe the problem (for example: item not received, not as described)" />
            <Button type="submit" variant="outline" size="lg" className="self-start">
              Open a case
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
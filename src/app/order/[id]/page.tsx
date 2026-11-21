import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Truck, Store, MessageCircle, ShieldCheck, PackageCheck, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { getOrderForBuyer } from "@/server/account";
import { getOrderEvents } from "@/server/orders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order confirmation" };

const STATUS_TONE: Record<string, "warning" | "brand" | "success" | "danger" | "neutral"> = {
  pending: "warning",
  confirmed: "brand",
  shipped: "brand",
  completed: "success",
  cancelled: "danger",
};

const ESCROW_COPY: Record<string, string> = {
  none: "No escrow",
  held: "Held in escrow",
  released: "Released to seller",
  refunded: "Refunded",
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/order/${id}`);
  const data = await getOrderForBuyer(id, user.id);
  if (!data) notFound();
  const { order, business, items } = data;
  const events = await getOrderEvents(order.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 aria-hidden className="mx-auto h-12 w-12 text-green-600" />
        <h1 className="mt-2 text-3xl font-extrabold text-green-900">
          {order.paymentStatus === "paid" ? "Payment received — thank you!" : "Thank you! Your order is placed."}
        </h1>
        <p className="mt-1 text-lg text-green-800">
          Order #{order.id.slice(0, 8).toUpperCase()} · {formatDateTime(order.createdAt)}
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <p className="text-base text-stone-500">Status</p>
            <Badge tone={STATUS_TONE[order.status] ?? "neutral"}>{order.status}</Badge>
          </div>
          <div>
            <p className="text-base text-stone-500">Payment</p>
            <Badge tone={order.paymentStatus === "paid" ? "success" : order.paymentStatus === "refunded" ? "neutral" : "warning"}>
              {order.paymentStatus === "paid" ? "Paid" : order.paymentStatus === "refunded" ? "Refunded" : "To arrange"}
            </Badge>
          </div>
          <div>
            <p className="text-base text-stone-500">Escrow</p>
            <Badge tone={order.escrowStatus === "held" ? "brand" : order.escrowStatus === "released" ? "success" : "neutral"}>
              {ESCROW_COPY[order.escrowStatus] ?? order.escrowStatus}
            </Badge>
          </div>
          <div>
            <p className="text-base text-stone-500">Method</p>
            <Badge tone="neutral">
              {order.paymentMode === "contact" ? "With seller" : order.paymentProvider.toUpperCase()}
            </Badge>
          </div>
        </div>

        <ul className="mt-5 flex flex-col divide-y divide-stone-100">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 py-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-stone-100">
                {it.imageSnapshot ? (
                  <Image src={it.imageSnapshot} alt={it.nameSnapshot} fill sizes="64px" className="object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold">{it.nameSnapshot}</p>
                <p className="text-base text-stone-500">
                  Qty {it.qty} · {it.kindSnapshot}
                </p>
              </div>
              <span className="font-semibold">{formatMoney(it.priceCents * it.qty, it.currency)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex flex-col gap-1 border-t border-stone-200 pt-3 text-base">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotalCents, order.currency)}</span>
          </div>
          {order.welfareRoundUpCents > 0 ? (
            <div className="flex justify-between text-brand-700">
              <span>Welfare round-up</span>
              <span>{formatMoney(order.welfareRoundUpCents, order.currency)}</span>
            </div>
          ) : null}
          <div className="mt-1 flex items-center justify-between text-xl">
            <span className="font-bold">Total</span>
            <span className="font-extrabold text-brand-700">{formatMoney(order.totalCents, order.currency)}</span>
          </div>
        </div>
      </div>

      {events.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <PackageCheck aria-hidden className="h-5 w-5 text-brand-700" /> Order timeline
          </h2>
          <ol className="mt-4 flex flex-col gap-3">
            {events.map((ev) => (
              <li key={ev.id} className="flex gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500 ring-4 ring-brand-100" />
                <div>
                  <p className="text-base font-semibold capitalize text-stone-800">{ev.status.replace(/_/g, " ")}</p>
                  {ev.note ? <p className="text-base text-stone-600">{ev.note}</p> : null}
                  <p className="text-sm text-stone-400">{formatDateTime(ev.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="flex items-center gap-2 text-lg font-bold">
            <Truck aria-hidden className="h-5 w-5" /> Delivering to
          </p>
          <p className="mt-1 text-base text-stone-600">
            {order.shippingName}
            <br />
            {order.shippingAddress}
            <br />
            {order.shippingPhone}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="flex items-center gap-2 text-lg font-bold">
            <Store aria-hidden className="h-5 w-5" /> Seller
          </p>
          <p className="mt-1 text-base text-stone-600">{business.name}</p>
          <Link href={`/store/${business.slug}`} className="text-base font-semibold text-brand-700 hover:underline">
            Visit shop →
          </Link>
        </div>
      </div>

      {order.escrowStatus === "held" ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-base text-brand-900">
          <ShieldCheck aria-hidden className="h-5 w-5 shrink-0" />
          Your payment is safe. We release it to the seller only after you confirm delivery.
        </p>
      ) : null}
      {order.sellerPayoutCents > 0 ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-stone-500">
          <Wallet aria-hidden className="h-4 w-4" /> Seller payout: {formatMoney(order.sellerPayoutCents, order.currency)} (after{" "}
          {formatMoney(order.commissionCents, order.currency)} platform fee)
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <LinkButton href="/account/orders" variant="outline">
          View all my orders
        </LinkButton>
        <LinkButton href={`/store/${business.slug}`} variant="secondary">
          <MessageCircle aria-hidden className="h-5 w-5" />
          Message seller
        </LinkButton>
        <LinkButton href="/browse">Keep shopping</LinkButton>
      </div>
    </div>
  );
}
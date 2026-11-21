import { redirect } from "next/navigation";
import Link from "next/link";
import { Banknote, Clock, Wallet, TrendingUp, CreditCard, ShieldCheck } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/utils";
import { getBusinessByOwner, getPayoutSummary } from "@/server/seller";
import { connectStripeAction } from "@/server/actions/seller";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payouts" };

export default async function SellerPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireUser();
  const business = await getBusinessByOwner(user.id);
  if (!business) redirect("/seller/onboarding");

  const { ok, error } = await searchParams;
  const summary = await getPayoutSummary(business.id);

  const cards = [
    {
      label: "Available to pay out",
      value: formatMoney(summary.availableCents),
      icon: Wallet,
      tone: "bg-brand-100 text-brand-700",
    },
    {
      label: "Held in escrow",
      value: formatMoney(summary.heldCents),
      icon: ShieldCheck,
      tone: "bg-accent-100 text-accent-700",
    },
    {
      label: "Paid out to you",
      value: formatMoney(summary.paidOutCents),
      icon: Banknote,
      tone: "bg-green-100 text-green-700",
    },
    {
      label: "Total earned",
      value: formatMoney(summary.lifetimeEarnedCents),
      icon: TrendingUp,
      tone: "bg-stone-100 text-stone-700",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Payouts &amp; earnings</h1>
      <p className="mt-1 text-lg text-stone-600">
        Money from completed orders, held safely in escrow until delivery is confirmed.
      </p>

      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-stone-200 bg-white p-5">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.tone}`}>
              <c.icon aria-hidden className="h-6 w-6" />
            </span>
            <span className="mt-3 block text-2xl font-black">{c.value}</span>
            <span className="block text-sm text-stone-600">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <CreditCard aria-hidden className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-bold">Payout method</p>
              <p className="text-base text-stone-600">
                {business.stripeAccountId && business.stripeChargesEnabled
                  ? "Stripe Connect is active. Payouts go to your connected bank account."
                  : "Connect Stripe to receive automatic payouts, or the platform team can pay you manually."}
              </p>
            </div>
          </div>
          <Badge tone={business.stripeChargesEnabled ? "success" : "warning"}>
            {business.stripeChargesEnabled ? "Connected" : "Not connected"}
          </Badge>
        </div>
        {!business.stripeChargesEnabled ? (
          <form action={connectStripeAction} className="mt-4">
            <Button type="submit" variant="outline">
              Set up payouts
            </Button>
          </form>
        ) : null}
      </div>

      <section className="mt-8">
        <h2 className="text-2xl font-bold">Payout history</h2>
        {summary.history.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-stone-200 bg-white p-5 text-lg text-stone-600">
            No payouts yet. As orders complete and escrow releases, your payouts will appear here.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {summary.history.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-4"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
                    <Clock aria-hidden className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-lg font-semibold">{formatMoney(p.amountCents)}</span>
                    <span className="block text-sm text-stone-500">
                      {p.periodStart && p.periodEnd
                        ? `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}`
                        : `Requested ${formatDate(p.createdAt)}`}
                    </span>
                  </span>
                </span>
                <Badge
                  tone={p.status === "paid" ? "success" : p.status === "failed" ? "danger" : "warning"}
                >
                  {p.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-base text-stone-500">
        Commission of {(business.commissionBps / 100).toFixed(1)}% applies to each sale.{" "}
        <Link href="/help" className="font-semibold text-brand-700 hover:underline">
          Learn how payouts work
        </Link>
        .
      </p>
    </div>
  );
}
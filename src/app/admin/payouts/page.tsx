import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatMoney } from "@/lib/utils";
import { listPayoutQueue } from "@/server/admin";
import { markPayoutPaidAction } from "@/server/actions/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payouts" };

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const queue = await listPayoutQueue();
  const pending = queue.filter((q) => q.payout.status === "pending");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Payouts</h1>
      <p className="mt-1 text-lg text-stone-600">
        {pending.length} payout{pending.length === 1 ? "" : "s"} waiting to be paid.
      </p>
      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      {queue.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 text-lg text-stone-600">
          No payouts yet. Escrow releases create payout records automatically.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {queue.map(({ payout, businessName }) => (
            <li
              key={payout.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4"
            >
              <span>
                <span className="block text-lg font-semibold">{businessName}</span>
                <span className="block text-sm text-stone-500">
                  {formatMoney(payout.amountCents)} · {payout.provider} · {formatDate(payout.createdAt)}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <Badge tone={payout.status === "paid" ? "success" : payout.status === "failed" ? "danger" : "warning"}>
                  {payout.status}
                </Badge>
                {payout.status === "pending" ? (
                  <form action={markPayoutPaidAction}>
                    <input type="hidden" name="id" value={payout.id} />
                    <Button type="submit" size="sm">
                      Mark paid
                    </Button>
                  </form>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
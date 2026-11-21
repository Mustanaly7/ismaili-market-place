import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { formatDate, formatMoney } from "@/lib/utils";
import { listDisputes } from "@/server/disputes";
import { refundOrderAction, resolveDisputeAction } from "@/server/actions/disputes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Disputes" };

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const disputes = await listDisputes();
  const open = disputes.filter((d) => d.dispute.status === "open");
  const closed = disputes.filter((d) => d.dispute.status !== "open");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Disputes &amp; refunds</h1>
      <p className="mt-1 text-lg text-stone-600">
        {open.length} open case{open.length === 1 ? "" : "s"} need attention.
      </p>
      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      <section className="mt-6">
        <h2 className="text-2xl font-bold">Open cases</h2>
        {open.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-stone-200 bg-white p-5 text-lg text-stone-600">
            Nothing open. Nice work.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {open.map((d) => (
              <li key={d.dispute.id} className="rounded-2xl border border-amber-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-lg font-bold">{d.businessName}</span>
                  <Badge tone="warning">Open</Badge>
                </div>
                <p className="mt-1 text-base text-stone-500">
                  Order #{d.order.id.slice(0, 8).toUpperCase()} · {formatMoney(d.order.totalCents)} ·{" "}
                  {formatDate(d.dispute.createdAt)}
                </p>
                <p className="mt-2 text-base text-stone-700">
                  <span className="font-semibold">{d.openedByName}:</span> {d.dispute.reason}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={refundOrderAction}>
                    <input type="hidden" name="orderId" value={d.order.id} />
                    <input type="hidden" name="back" value="/admin/disputes" />
                    <Button type="submit" variant="danger">
                      Refund buyer
                    </Button>
                  </form>
                  <form action={resolveDisputeAction} className="flex flex-1 flex-col gap-2">
                    <input type="hidden" name="disputeId" value={d.dispute.id} />
                    <input type="hidden" name="status" value="resolved" />
                    <Textarea name="resolution" required placeholder="Resolution note for the buyer…" className="min-h-[64px]" />
                    <Button type="submit" variant="outline" className="self-start">
                      Mark resolved (no refund)
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-bold">Closed cases</h2>
        {closed.length === 0 ? (
          <p className="mt-2 text-base text-stone-500">No closed cases yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {closed.map((d) => (
              <li
                key={d.dispute.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-4"
              >
                <span>
                  <span className="block text-base font-semibold">{d.businessName}</span>
                  <span className="block text-sm text-stone-500">
                    Order #{d.order.id.slice(0, 8).toUpperCase()} · {d.dispute.reason.slice(0, 80)}
                  </span>
                  {d.dispute.resolution ? (
                    <span className="block text-sm text-stone-400">Resolution: {d.dispute.resolution}</span>
                  ) : null}
                </span>
                <Badge tone={d.dispute.status === "refunded" || d.dispute.status === "resolved" ? "success" : "danger"}>
                  {d.dispute.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-base text-stone-500">
        Need a wider view?{" "}
        <Link href="/admin/reports" className="font-semibold text-brand-700 hover:underline">
          See reported content
        </Link>
        .
      </p>
    </div>
  );
}
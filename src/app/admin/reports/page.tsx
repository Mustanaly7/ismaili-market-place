import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Field";
import { formatDateTime } from "@/lib/utils";
import { listReports } from "@/server/admin";
import { resolveReportAction } from "@/server/actions/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports" };

const tone: Record<string, "danger" | "success" | "neutral"> = {
  open: "danger",
  resolved: "success",
  dismissed: "neutral",
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const reports = await listReports();
  const open = reports.filter((r) => r.status === "open");
  const closed = reports.filter((r) => r.status !== "open");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Reports</h1>
      <p className="text-lg text-stone-600">Things buyers have flagged for review.</p>
      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-2xl font-bold">Open ({open.length})</h2>
        {open.length === 0 ? (
          <EmptyState title="Nothing to review" description="Great — no open reports right now." />
        ) : (
          <ul className="flex flex-col gap-3">
            {open.map((r) => (
              <li key={r.id}>
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge tone={tone[r.status]}>{r.status}</Badge>
                    <span className="text-base text-stone-500">
                      {r.targetType} · {formatDateTime(r.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-lg text-stone-800">{r.reason}</p>
                  <p className="mt-1 text-sm text-stone-400">Report ID: {r.id}</p>
                  <form action={resolveReportAction} className="mt-3 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="reportId" value={r.id} />
                    <Input
                      name="note"
                      placeholder="Optional note about what you did"
                      className="min-w-[240px] flex-1"
                    />
                    <Button type="submit" name="status" value="resolved" size="sm">
                      Resolve
                    </Button>
                    <Button type="submit" name="status" value="dismissed" size="sm" variant="subtle">
                      Dismiss
                    </Button>
                  </form>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {closed.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-2xl font-bold">Handled ({closed.length})</h2>
          <ul className="flex flex-col gap-2">
            {closed.map((r) => (
              <li key={r.id} className="rounded-xl border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base text-stone-700">{r.reason}</p>
                  <Badge tone={tone[r.status]}>{r.status}</Badge>
                </div>
                {r.resolutionNote ? (
                  <p className="mt-1 text-sm text-stone-500">Note: {r.resolutionNote}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
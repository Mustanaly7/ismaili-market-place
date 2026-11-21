import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { formatDate } from "@/lib/utils";
import { listVerifications } from "@/server/verification";
import { reviewVerificationAction } from "@/server/actions/verification";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verifications" };

type Docs = {
  idDocUrl?: string | null;
  selfieUrl?: string | null;
  communityRef?: string | null;
  note?: string | null;
};

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const [pending, all] = await Promise.all([
    listVerifications("pending"),
    listVerifications(),
  ]);
  const done = all.filter((r) => r.request.status !== "pending");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Verification requests</h1>
      <p className="mt-1 text-lg text-stone-600">Verify sellers' identity and community references.</p>
      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      <section className="mt-6">
        <h2 className="text-2xl font-bold">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-stone-200 bg-white p-5 text-lg text-stone-600">
            No requests waiting. All caught up.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {pending.map(({ request, userName, userEmail, userPhone }) => {
              const docs = (request.docs ?? {}) as Docs;
              return (
                <li key={request.id} className="rounded-2xl border border-stone-200 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-lg font-bold">{userName || "Member"}</span>
                    <Badge tone="brand">{request.level === "id" ? "ID check" : "Community"}</Badge>
                  </div>
                  <p className="mt-1 text-base text-stone-500">
                    {userEmail || userPhone || "No contact"} · submitted {formatDate(request.createdAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-base text-stone-700">
                    {docs.idDocUrl ? (
                      <a href={docs.idDocUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">
                        View ID document
                      </a>
                    ) : null}
                    {docs.selfieUrl ? (
                      <a href={docs.selfieUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">
                        View selfie
                      </a>
                    ) : null}
                    {docs.communityRef ? <span>Reference: {docs.communityRef}</span> : null}
                  </div>
                  {docs.note ? <p className="mt-1 text-base text-stone-600">Note: {docs.note}</p> : null}

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <form action={reviewVerificationAction} className="flex flex-1 items-end gap-2">
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="decision" value="approve" />
                      <div className="flex-1">
                        <Input name="note" placeholder="Optional note" aria-label="Review note" />
                      </div>
                      <Button type="submit">Approve</Button>
                    </form>
                    <form action={reviewVerificationAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="decision" value="reject" />
                      <Button type="submit" variant="danger">
                        Reject
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-bold">Recent decisions</h2>
        {done.length === 0 ? (
          <p className="mt-2 text-base text-stone-500">No decisions yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {done.slice(0, 30).map(({ request, userName }) => (
              <li key={request.id} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4">
                <span className="text-base">
                  <span className="font-semibold">{userName || "Member"}</span> · {request.level}
                </span>
                <Badge tone={request.status === "approved" ? "success" : "danger"}>{request.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
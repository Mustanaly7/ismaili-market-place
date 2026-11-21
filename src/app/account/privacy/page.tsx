import Link from "next/link";
import { ArrowLeft, Download, Trash2, ShieldCheck, Clock } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { listMyDataRequests } from "@/server/privacy";
import {
  requestDataDeleteAction,
  requestDataExportAction,
} from "@/server/actions/privacy";

export const dynamic = "force-dynamic";
export const metadata = { title: "Privacy & my data" };

const STATUS_TONE: Record<string, "warning" | "success" | "danger" | "neutral"> = {
  pending: "warning",
  completed: "success",
  rejected: "danger",
};

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { ok, error } = await searchParams;
  const requests = await listMyDataRequests(user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-brand-700"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" /> Back to account
      </Link>

      <header className="mt-4">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 ring-1 ring-brand-200">
          <ShieldCheck aria-hidden className="h-4 w-4" /> Your privacy
        </p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-stone-900">
          Privacy & my data
        </h1>
        <p className="mt-2 text-lg text-stone-600">
          You are in control of your information. Download a copy of your data, or ask us to delete
          your account and personal data.
        </p>
      </header>

      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="flex flex-col rounded-2xl border border-stone-200/80 bg-white p-6 shadow-card">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Download aria-hidden className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-stone-900">Download my data</h2>
          <p className="mt-1 flex-1 text-base text-stone-600">
            Get a copy of your profile, orders, messages, and reviews in a portable format.
          </p>
          <form action={requestDataExportAction} className="mt-4">
            <Button type="submit" variant="outline" fullWidth>
              <Download aria-hidden className="h-5 w-5" /> Request export
            </Button>
          </form>
        </section>

        <section className="flex flex-col rounded-2xl border border-danger-200 bg-danger-50/40 p-6 shadow-card">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-100 text-danger-700">
            <Trash2 aria-hidden className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-stone-900">Delete my account</h2>
          <p className="mt-1 flex-1 text-base text-stone-600">
            Ask us to permanently delete your account and personal data. This cannot be undone.
          </p>
          <form action={requestDataDeleteAction} className="mt-4">
            <Button type="submit" variant="danger" fullWidth>
              <Trash2 aria-hidden className="h-5 w-5" /> Request deletion
            </Button>
          </form>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="text-2xl font-bold text-stone-900">Your requests</h2>
        {requests.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-stone-200 bg-white p-5 text-lg text-stone-600">
            You have not made any privacy requests yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {requests.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
                    <Clock aria-hidden className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-semibold capitalize text-stone-900">
                      {r.type === "export" ? "Data export" : "Account deletion"}
                    </span>
                    <span className="block text-sm text-stone-500">
                      Requested {formatDateTime(r.createdAt)}
                    </span>
                  </span>
                </span>
                <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-sm text-stone-500">
        Read more in our{" "}
        <Link href="/privacy" className="font-semibold text-brand-700 hover:underline">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
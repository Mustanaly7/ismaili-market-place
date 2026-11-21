import Link from "next/link";
import { ShieldCheck, IdCard, Users, Clock, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "@/components/forms/ImageUploader";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { listMyVerifications } from "@/server/verification";
import { submitVerificationAction } from "@/server/actions/verification";

export const dynamic = "force-dynamic";
export const metadata = { title: "Get verified" };

const LEVEL_INFO: Record<string, { label: string; blurb: string; icon: typeof ShieldCheck }> = {
  none: { label: "Not verified", blurb: "Add a phone number or upload an ID to build buyer trust.", icon: ShieldCheck },
  phone: { label: "Phone verified", blurb: "Your phone is confirmed. Add an ID or community reference for more trust.", icon: CheckCircle2 },
  id: { label: "ID verified", blurb: "Your identity is confirmed. You can also add a community reference.", icon: IdCard },
  community: { label: "Community verified", blurb: "You are trusted by the community. Thank you!", icon: Users },
};

const STATUS_TONE: Record<string, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { ok, error } = await searchParams;
  const requests = await listMyVerifications(user.id);
  const info = LEVEL_INFO[user.verificationLevel] ?? LEVEL_INFO.none;
  const Icon = info.icon;

  const hasPending = requests.some((r) => r.status === "pending");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/account" className="mb-3 inline-flex items-center gap-1 text-base font-semibold text-brand-700 hover:underline">
        <ArrowLeft aria-hidden className="h-4 w-4" /> Back to account
      </Link>

      <div className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-brand-700 ring-1 ring-brand-200">
            <Icon aria-hidden className="h-6 w-6" />
          </span>
          <div>
            <p className="text-base text-brand-800">Your verification level</p>
            <p className="text-xl font-extrabold text-brand-900">{info.label}</p>
          </div>
        </div>
        <p className="mt-3 text-base text-brand-800">{info.blurb}</p>
      </div>

      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      {hasPending ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-base text-amber-900">
          <Clock aria-hidden className="h-5 w-5" /> You have a request awaiting review. We usually reply within 2 days.
        </p>
      ) : null}

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <IdCard aria-hidden className="h-5 w-5 text-brand-700" /> Verify your identity (ID)
        </h2>
        <p className="mt-1 text-base text-stone-600">
          Upload a clear photo of your ID. Only our trust &amp; safety team will see it.
        </p>
        <form action={submitVerificationAction} className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="level" value="id" />
          <div>
            <p className="mb-1.5 text-base font-semibold text-stone-800">Photo of your ID</p>
            <ImageUploader name="idDocUrl" buttonLabel="Add ID" />
          </div>
          <div>
            <p className="mb-1.5 text-base font-semibold text-stone-800">A selfie holding your ID (optional)</p>
            <ImageUploader name="selfieUrl" buttonLabel="Add selfie" />
          </div>
          <Field label="Anything to add? (optional)" htmlFor="id-note">
            <Textarea id="id-note" name="note" />
          </Field>
          <Button type="submit" variant="outline">
            Send for ID review
          </Button>
        </form>
      </section>

      <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Users aria-hidden className="h-5 w-5 text-brand-700" /> Community verification
        </h2>
        <p className="mt-1 text-base text-stone-600">
          Get a reference from a local council or community leader who knows you.
        </p>
        <form action={submitVerificationAction} className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="level" value="community" />
          <Field label="Who can vouch for you?" htmlFor="communityRef" required>
            <Input id="communityRef" name="communityRef" placeholder="Name / council / reference contact" />
          </Field>
          <Field label="Anything to add? (optional)" htmlFor="community-note">
            <Textarea id="community-note" name="note" />
          </Field>
          <Button type="submit" variant="outline">
            Send for community review
          </Button>
        </form>
      </section>

      {requests.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-bold">Your requests</h2>
          <ul className="flex flex-col gap-2">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-3">
                <span className="flex items-center gap-2 text-base">
                  {r.level === "id" ? <IdCard aria-hidden className="h-4 w-4" /> : <Users aria-hidden className="h-4 w-4" />}
                  {r.level === "id" ? "ID verification" : "Community verification"}
                  <span className="text-stone-400">· {formatDate(r.createdAt)}</span>
                </span>
                <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
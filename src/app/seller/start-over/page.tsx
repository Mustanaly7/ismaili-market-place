import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button, LinkButton } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth";
import { getBusinessByOwner } from "@/server/seller";
import { startOverAction } from "@/server/actions/seller";

export const dynamic = "force-dynamic";
export const metadata = { title: "Start over" };

export default async function StartOverPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;
  const business = await getBusinessByOwner(user.id);
  if (!business) redirect("/seller/onboarding");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-100 text-danger-700">
          <AlertTriangle aria-hidden className="h-7 w-7" />
        </span>
        <h1 className="text-3xl font-extrabold">Start over</h1>
      </div>
      <p className="mt-3 text-lg text-stone-700">
        This closes <strong>{business.name}</strong> and takes it off the market. Please read carefully —
        this is not something to do by accident.
      </p>
      <Alert type="error" message={error} />

      <form action={startOverAction} className="mt-6 flex flex-col gap-4">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-lg font-semibold text-stone-800">What should happen?</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-stone-300 p-4 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
            <input type="radio" name="mode" value="archive" defaultChecked className="mt-1 h-5 w-5" />
            <span>
              <span className="block text-lg font-semibold text-stone-900">Hide my shop (recommended)</span>
              <span className="block text-base text-stone-600">
                Your shop stops showing, but nothing is deleted. We keep it safe.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-danger-300 p-4 has-[:checked]:border-danger-500 has-[:checked]:bg-danger-50">
            <input type="radio" name="mode" value="delete" className="mt-1 h-5 w-5" />
            <span>
              <span className="block text-lg font-semibold text-stone-900">Delete everything permanently</span>
              <span className="block text-base text-stone-600">
                Your shop, products, and photos are removed for good. This cannot be undone.
              </span>
            </span>
          </label>
        </fieldset>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-stone-100 p-4">
          <input type="checkbox" name="confirm" value="yes" className="mt-1 h-6 w-6" />
          <span className="text-lg font-semibold text-stone-900">
            Yes, I understand. Close my shop and let me start over.
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="danger" size="lg">
            Start over
          </Button>
          <LinkButton href="/seller/settings" variant="ghost">
            No, go back
          </LinkButton>
        </div>
      </form>

      <p className="mt-6 text-base text-stone-500">
        Need to talk first?{" "}
        <Link href="/help" className="font-semibold text-brand-700 hover:underline">
          Visit the help centre
        </Link>
        .
      </p>
    </div>
  );
}
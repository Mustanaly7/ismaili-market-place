import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { OnboardingWizard } from "@/components/seller/OnboardingWizard";
import { requireUser } from "@/lib/auth";
import { listCategories } from "@/server/catalog";
import { getBusinessByOwner } from "@/server/seller";
import { completeOnboardingAction } from "@/server/actions/seller";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set up your shop" };

const FALLBACK = [
  "Food & Drink",
  "Clothing & Accessories",
  "Home & Garden",
  "Handmade & Crafts",
  "Electronics",
  "Beauty & Care",
  "Services",
  "Other",
];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { ok, error } = await searchParams;

  const business = await getBusinessByOwner(user.id);
  if (business) redirect("/seller/dashboard");

  const categories = await listCategories();
  const names = categories.map((c) => c.name);
  const options = names.length ? names : FALLBACK;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Let&apos;s open your shop</h1>
      <p className="mt-1 mb-4 text-lg text-stone-600">
        Four short steps. You can go back at any time, and change everything later.
      </p>
      <Alert type="success" message={ok} />
      <Alert type="error" message={error} />
      <OnboardingWizard action={completeOnboardingAction} categories={options} />
    </div>
  );
}
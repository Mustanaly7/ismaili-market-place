import { redirect } from "next/navigation";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { ImageUploader } from "@/components/forms/ImageUploader";
import { requireUser } from "@/lib/auth";
import { listCategories } from "@/server/catalog";
import { getBusinessByOwner } from "@/server/seller";
import { updateBusinessAction } from "@/server/actions/seller";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shop settings" };

export default async function SellerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { ok, error } = await searchParams;
  const business = await getBusinessByOwner(user.id);
  if (!business) redirect("/seller/onboarding");

  const categories = await listCategories();
  const options = categories.map((c) => c.name);
  if (business.category && !options.includes(business.category)) options.unshift(business.category);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Shop settings</h1>
      <p className="mb-4 text-lg text-stone-600">Change how your shop looks and how buyers reach you.</p>
      <Alert type="success" message={ok} />
      <Alert type="error" message={error} />

      <form action={updateBusinessAction} className="flex flex-col gap-5">
        <Field label="Shop name" htmlFor="name" required>
          <Input id="name" name="name" required defaultValue={business.name} />
        </Field>
        <Field label="Category" htmlFor="category" required>
          <Select id="category" name="category" required defaultValue={business.category || ""}>
            <option value="" disabled>
              Choose one
            </option>
            {options.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="About your shop" htmlFor="description">
          <Textarea id="description" name="description" defaultValue={business.description} />
        </Field>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Location" htmlFor="location">
            <Input id="location" name="location" defaultValue={business.location} />
          </Field>
          <Field label="Opening hours" htmlFor="businessHours">
            <Input id="businessHours" name="businessHours" defaultValue={business.businessHours ?? ""} />
          </Field>
        </div>
        <Field label="How should buyers contact you?" htmlFor="contactMethod">
          <Select id="contactMethod" name="contactMethod" defaultValue={business.contactMethod}>
            <option value="message">Through the website messages</option>
            <option value="phone">By phone call</option>
            <option value="email">By email</option>
          </Select>
        </Field>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Phone number" htmlFor="contactPhone">
            <Input id="contactPhone" name="contactPhone" inputMode="tel" defaultValue={business.contactPhone ?? ""} />
          </Field>
          <Field label="Email" htmlFor="contactEmail">
            <Input id="contactEmail" name="contactEmail" type="email" defaultValue={business.contactEmail ?? ""} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-lg font-semibold text-stone-800">Logo</p>
            <ImageUploader name="logoUrl" initial={business.logoUrl ? [business.logoUrl] : []} buttonLabel="Change logo" />
          </div>
          <div>
            <p className="mb-2 text-lg font-semibold text-stone-800">Cover photo</p>
            <ImageUploader name="coverUrl" initial={business.coverUrl ? [business.coverUrl] : []} buttonLabel="Change cover" />
          </div>
        </div>

        <Field label="How do you get paid?" htmlFor="paymentMode">
          <Select id="paymentMode" name="paymentMode" defaultValue={business.paymentMode}>
            <option value="online">Accept online payments</option>
            <option value="contact">Arrange payment directly with buyers</option>
          </Select>
        </Field>

        <div className="flex items-center gap-3">
          <Button type="submit">Save changes</Button>
        </div>
      </form>

      <section className="mt-10 rounded-2xl border-2 border-danger-200 bg-danger-50 p-5">
        <h2 className="text-xl font-bold text-danger-800">Start over</h2>
        <p className="mt-1 text-base text-danger-700">
          Want to close this shop and start fresh? This is a big step, so we will ask you to confirm.
        </p>
        <Link href="/seller/start-over" className="mt-3 inline-block font-semibold text-danger-800 underline">
          Go to start over
        </Link>
      </section>
    </div>
  );
}
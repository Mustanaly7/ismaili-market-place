import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { ProductForm } from "@/components/seller/ProductForm";
import { requireUser } from "@/lib/auth";
import { listCategories } from "@/server/catalog";
import { getBusinessByOwner } from "@/server/seller";
import { createProductAction } from "@/server/actions/seller";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add a product" };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;
  const business = await getBusinessByOwner(user.id);
  if (!business) redirect("/seller/onboarding");

  const categories = await listCategories();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Add a product</h1>
      <p className="mb-4 text-lg text-stone-600">Just the basics. You can change anything later.</p>
      <Alert type="error" message={error} />
      <ProductForm
        action={createProductAction}
        categories={categories.map((c) => c.name)}
        submitLabel="Add product"
      />
    </div>
  );
}
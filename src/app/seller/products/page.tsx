import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { ProductsManager } from "@/components/seller/ProductsManager";
import { requireUser } from "@/lib/auth";
import { getBusinessByOwner, listBusinessProducts } from "@/server/seller";

export const dynamic = "force-dynamic";
export const metadata = { title: "My products" };

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { ok, error } = await searchParams;
  const business = await getBusinessByOwner(user.id);
  if (!business) redirect("/seller/onboarding");

  const products = await listBusinessProducts(business.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">My products</h1>
          <p className="text-lg text-stone-600">Add, edit, or hide the things you sell.</p>
        </div>
        <LinkButton href="/seller/products/new">
          <Plus aria-hidden className="h-5 w-5" />
          Add a product
        </LinkButton>
      </div>

      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      <div className="mt-6">
        {products.length === 0 ? (
          <EmptyState
            title="No products yet"
            description="Add your first product with a clear photo and an honest price. It only takes a minute."
            action={
              <LinkButton href="/seller/products/new" size="lg">
                <Plus aria-hidden className="h-6 w-6" />
                Add my first product
              </LinkButton>
            }
          />
        ) : (
          <ProductsManager products={products} />
        )}
      </div>
    </div>
  );
}
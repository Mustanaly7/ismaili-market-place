import { redirect, notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { Alert } from "@/components/ui/Alert";
import { ProductForm } from "@/components/seller/ProductForm";
import { db, safeQuery } from "@/db";
import { productImages, products } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { centsToInput } from "@/lib/utils";
import { listCategories } from "@/server/catalog";
import { getBusinessByOwner } from "@/server/seller";
import { updateProductAction } from "@/server/actions/seller";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { ok, error } = await searchParams;
  const business = await getBusinessByOwner(user.id);
  if (!business) redirect("/seller/onboarding");

  const data = await safeQuery(async () => {
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.businessId, business.id)))
      .limit(1);
    const product = rows[0];
    if (!product) return null;
    const images = await db
      .select({ url: productImages.url })
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.sort));
    return { product, images: images.map((i) => i.url) };
  }, null);

  if (!data) notFound();
  const categories = await listCategories();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Edit product</h1>
      <p className="mb-4 text-lg text-stone-600">{data.product.name}</p>
      <Alert type="success" message={ok} />
      <Alert type="error" message={error} />
      <ProductForm
        action={updateProductAction}
        categories={categories.map((c) => c.name)}
        submitLabel="Save changes"
        cancelHref="/seller/products"
        defaults={{
          id: data.product.id,
          name: data.product.name,
          priceInput: centsToInput(data.product.priceCents),
          quantity: data.product.quantity,
          description: data.product.description,
          category: data.product.category,
          allowBackorder: data.product.allowBackorder,
          images: data.images,
        }}
      />
    </div>
  );
}
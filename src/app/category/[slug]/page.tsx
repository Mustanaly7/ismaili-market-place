import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product/ProductGrid";
import { listCategories, listProductCards } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = await listCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const products = await listProductCards({ category: category.name, limit: 60 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">{category.name}</h1>
      <p className="mt-1 text-lg text-stone-600">{products.length} items</p>
      <div className="mt-6">
        <ProductGrid
          products={products}
          emptyTitle="Nothing here yet"
          emptyDescription="This category is new — check back soon."
        />
      </div>
    </div>
  );
}
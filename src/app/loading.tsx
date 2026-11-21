import { Skeleton, ProductGridSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <section className="border-b border-stone-200/70 bg-gradient-to-b from-brand-50/80 to-[#fbf9f6]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div className="space-y-4">
            <Skeleton className="h-7 w-48 rounded-full" />
            <Skeleton className="h-12 w-full max-w-md" />
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-6 w-full max-w-lg" />
            <Skeleton className="h-14 w-full max-w-lg rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="aspect-square rounded-3xl" />
            <Skeleton className="aspect-square rounded-3xl" />
            <Skeleton className="aspect-square rounded-3xl" />
            <Skeleton className="aspect-square rounded-3xl" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <Skeleton className="mb-6 h-8 w-56" />
        <ProductGridSkeleton count={8} />
      </section>
    </div>
  );
}
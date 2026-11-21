import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button, LinkButton } from "@/components/ui/Button";
import { toggleFavoriteAction } from "@/server/actions/shop";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/utils";
import { getFavorites } from "@/server/account";

export const dynamic = "force-dynamic";
export const metadata = { title: "Saved items" };

export default async function FavoritesPage() {
  const user = await requireUser();
  const favorites = await getFavorites(user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-extrabold">Saved items</h1>
        <Link href="/account" className="text-lg font-semibold text-brand-700 hover:underline">
          Back to account
        </Link>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description="Tap the heart on any product to save it here."
          icon={<Heart aria-hidden className="h-12 w-12" />}
          action={<LinkButton href="/browse">Find something you love</LinkButton>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {favorites.map((f) => (
            <div key={f.id} className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white">
              <Link href={`/product/${f.id}`} className="relative block aspect-square bg-stone-100">
                {f.image ? (
                  <Image src={f.image} alt={f.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                ) : null}
              </Link>
              <div className="flex flex-1 flex-col p-3">
                <Link href={`/product/${f.id}`} className="line-clamp-2 text-base font-semibold hover:underline">
                  {f.name}
                </Link>
                <p className="text-sm text-stone-500">{f.businessName}</p>
                <p className="mt-1 text-lg font-bold text-brand-700">{formatMoney(f.priceCents)}</p>
                <form action={toggleFavoriteAction} className="mt-auto pt-2">
                  <input type="hidden" name="productId" value={f.id} />
                  <input type="hidden" name="next" value="/account/favorites" />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="justify-start px-2 text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                  >
                    <Heart aria-hidden className="h-4 w-4 fill-current" />
                    Remove
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
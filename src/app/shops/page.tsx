import { ShopDirectory } from "@/components/shop/ShopDirectory";
import { listShopLocations, listShops } from "@/server/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shops" };

export default async function ShopsPage() {
  const [shops, locations] = await Promise.all([listShops({ limit: 120 }), listShopLocations()]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Shops near you</h1>
      <p className="mt-1 text-lg text-stone-600">
        Browse trusted Jamat sellers worldwide. Tap “Shops near me” to sort by distance.
      </p>
      <div className="mt-5">
        <ShopDirectory shops={shops} locations={locations} />
      </div>
    </div>
  );
}
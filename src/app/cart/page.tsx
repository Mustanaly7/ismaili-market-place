import { CartView } from "@/components/cart/CartView";

export const metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold">Your cart</h1>
      <CartView />
    </div>
  );
}
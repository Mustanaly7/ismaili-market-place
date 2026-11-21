"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart, type CartItem } from "@/components/cart/CartProvider";

export function AddToCartPanel({
  item,
  maxQty,
  soldOut,
  allowBackorder,
}: {
  item: Omit<CartItem, "qty">;
  maxQty: number;
  soldOut: boolean;
  allowBackorder: boolean;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const limit = allowBackorder ? 99 : Math.max(1, maxQty);

  if (item.paymentMode === "contact") {
    return (
      <a
        href="#contact"
        className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-600 px-6 text-xl font-bold text-brand-700 hover:bg-brand-50"
      >
        Contact to order
      </a>
    );
  }

  if (soldOut) {
    return (
      <div className="rounded-xl bg-stone-100 px-4 py-4 text-center text-lg font-semibold text-stone-500">
        This item is sold out.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold text-stone-700">How many?</span>
        <div className="flex items-center rounded-xl border-2 border-stone-300">
          <button
            type="button"
            aria-label="Fewer"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex min-h-touch min-w-touch items-center justify-center rounded-l-xl hover:bg-stone-100"
          >
            <Minus aria-hidden className="h-5 w-5" />
          </button>
          <span className="min-w-[3rem] text-center text-xl font-bold" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            aria-label="More"
            onClick={() => setQty((q) => Math.min(limit, q + 1))}
            className="flex min-h-touch min-w-touch items-center justify-center rounded-r-xl hover:bg-stone-100"
          >
            <Plus aria-hidden className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            add(item, qty);
            setAdded(true);
            setTimeout(() => setAdded(false), 1800);
          }}
          className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-xl font-bold text-white hover:bg-brand-700"
        >
          <ShoppingCart aria-hidden className="h-5 w-5" />
          {added ? "Added to cart \u2713" : "Add to cart"}
        </button>
        <button
          type="button"
          onClick={() => {
            add(item, qty);
            router.push("/checkout");
          }}
          className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-accent-500 px-6 text-xl font-bold text-white hover:bg-accent-600"
        >
          Buy now
        </button>
      </div>
    </div>
  );
}
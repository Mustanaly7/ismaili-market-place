"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

export function CartBadge() {
  const { count, ready } = useCart();
  return (
    <span className="inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-accent-500 px-1.5 text-[0.72rem] font-bold leading-none text-white">
      {ready ? count : 0}
    </span>
  );
}

/** Add-to-cart button used on product cards and detail pages. */
export function AddToCartButton({
  item,
  qty = 1,
  className = "",
  label = "Add to cart",
}: {
  item: {
    productId: string;
    name: string;
    priceCents: number;
    image: string | null;
    businessId: string;
    businessName: string;
    paymentMode: "online" | "contact";
  };
  qty?: number;
  className?: string;
  label?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  if (item.paymentMode === "contact") {
    return (
      <a
        href={`/product/${item.productId}#contact`}
        className={`inline-flex min-h-touch items-center justify-center rounded-xl border border-brand-600 px-5 py-2 text-base font-semibold text-brand-700 transition hover:bg-brand-50 ${className}`}
      >
        Contact to order
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        add(item, qty);
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
      }}
      className={`inline-flex min-h-touch items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98] ${className}`}
    >
      {added ? "Added \u2713" : label}
    </button>
  );
}
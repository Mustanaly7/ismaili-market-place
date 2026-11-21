"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { formatMoney } from "@/lib/utils";

export function CartView() {
  const { items, subtotalCents, setQty, remove, ready } = useCart();

  if (!ready) {
    return <p className="py-10 text-center text-lg text-stone-500">Loading your cart…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-white px-6 py-16 text-center">
        <ShoppingBag aria-hidden className="mx-auto h-12 w-12 text-stone-300" />
        <h2 className="mt-4 text-2xl font-bold">Your cart is empty</h2>
        <p className="mt-2 text-lg text-stone-600">Add something you love to get started.</p>
        <Link
          href="/browse"
          className="mt-6 inline-flex min-h-touch items-center rounded-xl bg-brand-600 px-6 py-2 text-lg font-bold text-white hover:bg-brand-700"
        >
          Browse products
        </Link>
      </div>
    );
  }

  const businesses = new Set(items.map((i) => i.businessId));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-3"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100 sm:h-24 sm:w-24">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
              ) : null}
            </div>
            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="break-words text-lg font-semibold text-stone-900">{item.name}</p>
                  <p className="text-base text-stone-500">{item.businessName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.productId)}
                  aria-label={`Remove ${item.name}`}
                  className="flex min-h-touch min-w-touch items-center justify-center rounded-lg text-stone-400 hover:bg-danger-50 hover:text-danger-600"
                >
                  <Trash2 aria-hidden className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center rounded-xl border-2 border-stone-300">
                  <button
                    type="button"
                    aria-label="Fewer"
                    onClick={() => setQty(item.productId, item.qty - 1)}
                    className="flex min-h-touch min-w-touch items-center justify-center rounded-l-xl hover:bg-stone-100"
                  >
                    <Minus aria-hidden className="h-4 w-4" />
                  </button>
                  <span className="min-w-[2.5rem] text-center text-lg font-bold">{item.qty}</span>
                  <button
                    type="button"
                    aria-label="More"
                    onClick={() => setQty(item.productId, item.qty + 1)}
                    className="flex min-h-touch min-w-touch items-center justify-center rounded-r-xl hover:bg-stone-100"
                  >
                    <Plus aria-hidden className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-lg font-bold text-brand-700">
                  {formatMoney(item.priceCents * item.qty)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-xl font-bold">Order summary</h2>
        <div className="mt-3 flex items-center justify-between text-lg">
          <span className="text-stone-600">Items</span>
          <span className="font-semibold">{items.length}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xl">
          <span className="font-semibold">Subtotal</span>
          <span className="font-extrabold text-brand-700">{formatMoney(subtotalCents)}</span>
        </div>
        {businesses.size > 1 ? (
          <p className="mt-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">
            You have items from more than one seller. Please check out one seller at a time.
          </p>
        ) : null}
        <Link
          href="/checkout"
          className="mt-4 flex min-h-[52px] items-center justify-center rounded-xl bg-brand-600 px-6 text-xl font-bold text-white hover:bg-brand-700"
        >
          Go to checkout
        </Link>
        <Link
          href="/browse"
          className="mt-2 flex min-h-touch items-center justify-center rounded-xl px-4 text-lg font-semibold text-brand-700 hover:bg-brand-50"
        >
          Keep shopping
        </Link>
      </aside>
    </div>
  );
}
"use client";

import Link from "next/link";
import { useState } from "react";
import { CreditCard, HandCoins, Truck, Store, Download, HeartHandshake } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { placeOrderAction } from "@/server/actions/shop";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils";

const PROVIDERS = [
  { value: "stripe", label: "Card (Stripe)" },
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "Easypaisa" },
  { value: "razorpay", label: "UPI / Razorpay" },
  { value: "mpesa", label: "M-Pesa" },
  { value: "bank", label: "Bank transfer" },
  { value: "cod", label: "Cash on delivery" },
];

export function CheckoutForm() {
  const { items, subtotalCents, ready } = useCart();
  const [mode, setMode] = useState<"online" | "contact">("online");
  const [delivery, setDelivery] = useState<"shipping" | "pickup" | "digital">("shipping");
  const [provider, setProvider] = useState("stripe");
  const [roundUp, setRoundUp] = useState(false);

  if (!ready) {
    return <p className="py-10 text-center text-lg text-stone-500">Loading…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-white px-6 py-16 text-center">
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <p className="mt-2 text-lg text-stone-600">Add something before checking out.</p>
        <Link
          href="/browse"
          className="mt-6 inline-flex min-h-touch items-center rounded-xl bg-brand-600 px-6 py-2 text-lg font-bold text-white hover:bg-brand-700"
        >
          Browse products
        </Link>
      </div>
    );
  }

  const contactOnly = items.some((i) => i.paymentMode === "contact");
  const allDigital = items.every((i) => i.kind === "digital");
  const payload = JSON.stringify(items.map((i) => ({ productId: i.productId, qty: i.qty })));

  const roundUpCents =
    roundUp && subtotalCents > 0 ? Math.ceil((subtotalCents + 1) / 100) * 100 - subtotalCents : 0;
  const totalCents = subtotalCents + roundUpCents;

  const deliveryOptions = [
    { value: "shipping", label: "Deliver to me", icon: Truck },
    { value: "pickup", label: "I will collect", icon: Store },
    { value: "digital", label: "Digital / online", icon: Download },
  ] as const;

  return (
    <form action={placeOrderAction} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <input type="hidden" name="items" value={payload} />
      <input type="hidden" name="deliveryMethod" value={allDigital ? "digital" : delivery} />
      <input type="hidden" name="paymentProvider" value={mode === "online" ? provider : "cod"} />
      {roundUp ? <input type="hidden" name="welfareRoundUp" value="on" /> : null}

      <div className="flex flex-col gap-5">
        {!allDigital ? (
          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="text-xl font-bold">How should it reach you?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {deliveryOptions
                .filter((o) => o.value !== "digital")
                .map((o) => {
                  const active = delivery === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setDelivery(o.value)}
                      className={`flex min-h-touch items-center gap-2 rounded-xl border-2 p-3 text-base font-semibold ${
                        active ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 text-stone-700"
                      }`}
                    >
                      <o.icon aria-hidden className="h-5 w-5" />
                      {o.label}
                    </button>
                  );
                })}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-bold">Where should it go?</h2>
          <div className="mt-4 flex flex-col gap-4">
            <Field label="Your name" htmlFor="shippingName" required>
              <Input id="shippingName" name="shippingName" autoComplete="name" required />
            </Field>
            <Field label="Phone number" htmlFor="shippingPhone" required hint="So the seller can reach you.">
              <Input id="shippingPhone" name="shippingPhone" type="tel" autoComplete="tel" required />
            </Field>
            {delivery !== "pickup" && !allDigital ? (
              <Field label="Delivery address" htmlFor="shippingAddress" required>
                <Textarea id="shippingAddress" name="shippingAddress" autoComplete="street-address" required />
              </Field>
            ) : (
              <input type="hidden" name="shippingAddress" value="Pickup / digital" />
            )}
            <Field label="Anything to add? (optional)" htmlFor="note">
              <Textarea id="note" name="note" placeholder="Delivery notes, gift message, etc." />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-bold">How would you like to pay?</h2>
          <div className="mt-4 flex flex-col gap-3">
            {!contactOnly ? (
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 ${
                  mode === "online" ? "border-brand-600 bg-brand-50" : "border-stone-200"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  value="online"
                  checked={mode === "online"}
                  onChange={() => setMode("online")}
                  className="mt-1 h-5 w-5"
                />
                <span className="flex-1">
                  <span className="flex items-center gap-2 text-lg font-semibold">
                    <CreditCard aria-hidden className="h-5 w-5" /> Pay now
                  </span>
                  <span className="text-base text-stone-600">
                    Pay securely. Your money is held in escrow until you receive your order.
                  </span>
                  {mode === "online" ? (
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="mt-3 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-base font-semibold text-stone-800"
                      aria-label="Payment provider"
                    >
                      {PROVIDERS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </span>
              </label>
            ) : null}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 ${
                mode === "contact" || contactOnly ? "border-brand-600 bg-brand-50" : "border-stone-200"
              }`}
            >
              <input
                type="radio"
                name="paymentMode"
                value="contact"
                checked={mode === "contact" || contactOnly}
                onChange={() => setMode("contact")}
                className="mt-1 h-5 w-5"
              />
              <span>
                <span className="flex items-center gap-2 text-lg font-semibold">
                  <HandCoins aria-hidden className="h-5 w-5" /> Arrange with seller
                </span>
                <span className="text-base text-stone-600">
                  Send an order request. The seller confirms and you arrange payment and delivery together.
                </span>
              </span>
            </label>
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-xl font-bold">Your order</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-2 text-base">
              <span className="text-stone-700">
                {i.name} <span className="text-stone-400">× {i.qty}</span>
              </span>
              <span className="font-semibold">{formatMoney(i.priceCents * i.qty)}</span>
            </li>
          ))}
        </ul>

        <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/60 p-3 text-sm text-brand-900">
          <input
            type="checkbox"
            checked={roundUp}
            onChange={(e) => setRoundUp(e.target.checked)}
            className="mt-0.5 h-5 w-5"
          />
          <span className="flex-1">
            <span className="flex items-center gap-1.5 font-semibold">
              <HeartHandshake aria-hidden className="h-4 w-4" /> Round up for the welfare fund
            </span>
            <span className="text-brand-700">
              Add {formatMoney(roundUpCents || (Math.ceil((subtotalCents + 1) / 100) * 100 - subtotalCents))} to help
              families in need.
            </span>
          </span>
        </label>

        <div className="mt-3 flex flex-col gap-1 border-t border-stone-200 pt-3 text-base">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span>{formatMoney(subtotalCents)}</span>
          </div>
          {roundUpCents > 0 ? (
            <div className="flex justify-between text-brand-700">
              <span>Welfare round-up</span>
              <span>{formatMoney(roundUpCents)}</span>
            </div>
          ) : null}
          <div className="mt-1 flex items-center justify-between text-xl">
            <span className="font-bold">Total</span>
            <span className="font-extrabold text-brand-700">{formatMoney(totalCents)}</span>
          </div>
        </div>
        <Button type="submit" size="lg" fullWidth pendingText="Placing order…">
          Place order
        </Button>
        <p className="mt-2 text-center text-sm text-stone-500">
          You will see a confirmation right after.
        </p>
      </aside>
    </form>
  );
}
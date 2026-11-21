import { createHmac, timingSafeEqual } from "node:crypto";
import { env, isStripeEnabled } from "./env";

/**
 * Stripe integration via the REST API (no SDK dependency).
 * When STRIPE_SECRET_KEY is set we create real PaymentIntents in test/live mode;
 * otherwise we return a simulated intent so the checkout flow works locally.
 * Swapping in the official `stripe` SDK later is a drop-in change.
 */
export interface PaymentIntentResult {
  simulated: boolean;
  id: string;
  clientSecret: string | null;
}

export async function createPaymentIntent(
  amountCents: number,
  metadata: Record<string, string>,
): Promise<PaymentIntentResult> {
  if (!isStripeEnabled()) {
    return { simulated: true, id: `sim_${Date.now()}`, clientSecret: null };
  }

  const body = new URLSearchParams();
  body.set("amount", String(amountCents));
  body.set("currency", "usd");
  body.set("automatic_payment_methods[enabled]", "true");
  for (const [k, v] of Object.entries(metadata)) body.set(`metadata[${k}]`, v);

  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.stripe.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stripe error ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { id: string; client_secret: string | null };
  return { simulated: false, id: json.id, clientSecret: json.client_secret ?? null };
}

/**
 * Refund (part of) a PaymentIntent. Returns whether the refund was simulated.
 * Falls back to a no-op simulation when Stripe is not configured.
 */
export async function createRefund(
  paymentIntentId: string,
  amountCents?: number,
): Promise<{ simulated: boolean; id: string }> {
  if (!isStripeEnabled() || paymentIntentId.startsWith("sim_")) {
    return { simulated: true, id: `rfd_sim_${Date.now()}` };
  }
  const body = new URLSearchParams();
  body.set("payment_intent", paymentIntentId);
  if (typeof amountCents === "number") body.set("amount", String(amountCents));

  const res = await fetch("https://api.stripe.com/v1/refunds", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.stripe.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stripe refund error ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { id: string };
  return { simulated: false, id: json.id };
}

/**
 * Verify a Stripe webhook signature header ("t=timestamp,v1=signature").
 * Returns true when the payload is authentic and fresh.
 */
export function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
): boolean {
  const secret = env.stripe.webhookSecret;
  if (!secret) return false;
  const parts = signatureHeader.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
export interface ConnectAccountResult {
  simulated: boolean;
  accountId: string;
}

/**
 * Create a Stripe Connect Express account for a seller. Simulated when Stripe
 * is not configured so the UI flow still works locally.
 */
export async function createConnectAccount(
  email: string | null,
  businessName: string,
): Promise<ConnectAccountResult> {
  if (!isStripeEnabled()) {
    return { simulated: true, accountId: `acct_sim_${Date.now()}` };
  }
  const body = new URLSearchParams();
  body.set("type", "express");
  if (email) body.set("email", email);
  body.set("business_profile[name]", businessName);
  body.set("capabilities[transfers][requested]", "true");

  const res = await fetch("https://api.stripe.com/v1/accounts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.stripe.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stripe connect error ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { id: string };
  return { simulated: false, accountId: json.id };
}

/**
 * Create an account onboarding link the seller is redirected to. Returns null
 * when Stripe is not configured (caller should fall back to manual messaging).
 */
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string,
): Promise<{ simulated: boolean; url: string | null }> {
  if (!isStripeEnabled() || accountId.startsWith("acct_sim_")) {
    return { simulated: true, url: null };
  }
  const body = new URLSearchParams();
  body.set("account", accountId);
  body.set("refresh_url", refreshUrl);
  body.set("return_url", returnUrl);
  body.set("type", "account_onboarding");

  const res = await fetch("https://api.stripe.com/v1/account_links", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.stripe.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stripe account link error ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { url: string };
  return { simulated: false, url: json.url };
}
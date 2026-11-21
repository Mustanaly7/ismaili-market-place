import Link from "next/link";
import { Phone, MessageCircle, Mail } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";

export const metadata = { title: "Help centre" };

const faqs: { q: string; a: string }[] = [
  {
    q: "How do I buy something?",
    a: "Open a product, tap \"Add to cart\", then tap the cart to check out. You can pay online or ask to arrange payment with the seller.",
  },
  {
    q: "How do I start selling?",
    a: "Tap \"Sell\" at the top of the page. We will walk you through four short steps. You can stop and come back any time.",
  },
  {
    q: "How do I change the language?",
    a: "Tap the language menu in the top bar to switch between English and Urdu. Urdu reads right-to-left, and the whole page flips to match automatically.",
  },
  {
    q: "How do I talk to a seller?",
    a: "On a product page, tap \"Contact seller\" and type your question. Their reply appears in \"Messages\".",
  },
  {
    q: "What if something is wrong with my order?",
    a: "Open the order in your account and choose \"Something wrong with this order?\". You can message the seller or open a case, and we can step in to help with a refund.",
  },
  {
    q: "I made a mistake — can I start over?",
    a: "Yes. Sellers can go to Settings and choose \"Start over\". We ask you to confirm before anything changes.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-black">How can we help?</h1>
      <p className="mt-2 text-xl text-stone-600">Plain answers, no jargon. If you are stuck, reach out — a real person will help.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <LinkButton href="tel:+10000000000" variant="outline">
          <Phone aria-hidden className="h-5 w-5" />
          Call us
        </LinkButton>
        <LinkButton href="https://wa.me/10000000000" variant="secondary">
          <MessageCircle aria-hidden className="h-5 w-5" />
          Message on WhatsApp
        </LinkButton>
        <LinkButton href="mailto:help@ismailimarketplace.example" variant="ghost">
          <Mail aria-hidden className="h-5 w-5" />
          Email
        </LinkButton>
      </div>

      <div className="mt-10 flex flex-col gap-3">
        {faqs.map((f) => (
          <details key={f.q} className="rounded-2xl border border-stone-200 bg-white p-5">
            <summary className="cursor-pointer text-xl font-bold text-stone-900">{f.q}</summary>
            <p className="mt-3 text-lg text-stone-700">{f.a}</p>
          </details>
        ))}
      </div>

      <p className="mt-10 text-lg text-stone-600">
        Still need a hand?{" "}
        <Link href="/messages" className="font-semibold text-brand-700 hover:underline">
          Send us a message
        </Link>{" "}
        or use the green “Need help?” button on any page.
      </p>
    </div>
  );
}
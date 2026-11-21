import Link from "next/link";
import { ArrowRight, Check, Store, Camera, MessagesSquare, Wallet } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";
import { getBusinessByOwner } from "@/server/seller";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Sell your things",
  description: "Open a simple online shop in minutes. No technical skills needed.",
};

export default async function SellLandingPage() {
  const user = await getCurrentUser();
  const business = user ? await getBusinessByOwner(user.id) : null;

  const cta = !user
    ? { href: "/signup?role=seller", label: "Start selling" }
    : business
      ? { href: "/seller/dashboard", label: "Go to your dashboard" }
      : { href: "/seller/onboarding", label: "Open my shop" };

  const steps = [
    { icon: Store, title: "Name your shop", body: "Tell us what you sell and where you are. 2 minutes." },
    { icon: Camera, title: "Add a few photos", body: "Snap pictures on your phone. We make them look sharp." },
    { icon: Wallet, title: "Choose how you get paid", body: "Online payments, or arrange it directly with buyers." },
    { icon: MessagesSquare, title: "Start selling", body: "Buyers message you or pay on the site. You are in control." },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <section className="rounded-3xl bg-brand-600 px-6 py-12 text-center text-white sm:px-12">
        <h1 className="text-4xl font-black sm:text-5xl">Selling made simple</h1>
        <p className="mx-auto mt-3 max-w-xl text-xl text-brand-50">
          If you can send a text message, you can sell here. Big buttons, plain words, no confusing forms.
        </p>
        <div className="mt-8 flex justify-center">
          <LinkButton href={cta.href} variant="secondary" size="lg">
            {cta.label}
            <ArrowRight aria-hidden className="h-6 w-6" />
          </LinkButton>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-center text-3xl font-extrabold">Four easy steps</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {steps.map((s, i) => (
            <div key={s.title} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                <s.icon aria-hidden className="h-7 w-7" />
              </span>
              <div>
                <h3 className="text-xl font-bold">
                  <span className="text-brand-600">{i + 1}. </span>
                  {s.title}
                </h3>
                <p className="mt-1 text-lg text-stone-600">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-2xl font-bold">What you get</h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            "Your own shop page with a simple web address",
            "Easy product list — add, edit, or hide items anytime",
            "Messages from buyers in one inbox",
            "Simple orders screen with clear status buttons",
            "See how many people viewed your items",
            "Change your mind? Start over in one tap",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-lg text-stone-700">
              <Check aria-hidden className="mt-1 h-5 w-5 shrink-0 text-green-600" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-center text-lg text-stone-600">
        Already selling?{" "}
        <Link href={cta.href} className="font-semibold text-brand-700 hover:underline">
          {cta.label}
        </Link>
        .
      </p>
    </div>
  );
}
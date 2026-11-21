import Link from "next/link";
import { HeartHandshake, Store, Receipt, Sparkles } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { getImpactSummary } from "@/server/community";

export const dynamic = "force-dynamic";
export const metadata = { title: "Community impact" };

export default async function ImpactPage() {
  const impact = await getImpactSummary();

  const stats = [
    {
      label: "Raised for the fund",
      value: formatMoney(impact.welfareTotalCents),
      icon: HeartHandshake,
    },
    { label: "Contributions", value: impact.contributionCount.toLocaleString(), icon: Receipt },
    { label: "Active sellers", value: impact.sellerCount.toLocaleString(), icon: Store },
  ];

  const baselineEntries = impact.baseline
    ? Object.entries(impact.baseline).filter(([, v]) => v !== null && v !== undefined)
    : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-8 text-white sm:p-12">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-brand-100 ring-1 ring-white/20">
          <Sparkles aria-hidden className="h-4 w-4" /> Giving back
        </p>
        <h1 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          Every order can support the {impact.fundName}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-brand-100">
          Buyers can round up their total at checkout. Those small amounts add up to real support for
          our community — and we publish the totals openly.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <s.icon aria-hidden className="h-6 w-6" />
            </span>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-stone-900">{s.value}</p>
            <p className="text-base text-stone-600">{s.label}</p>
          </div>
        ))}
      </div>

      {baselineEntries.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-card">
          <h2 className="text-2xl font-bold text-stone-900">Where your support goes</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {baselineEntries.map(([key, value]) => (
              <div key={key} className="rounded-xl bg-stone-50 p-4">
                <dt className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                  {key.replace(/[_-]/g, " ")}
                </dt>
                <dd className="mt-1 text-xl font-bold text-stone-900">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-stone-200/80 bg-white p-6 text-center shadow-card">
          <p className="text-lg text-stone-600">
            We share a transparent breakdown of how round-up funds are used. Contributions are
            tracked on every order and reported openly to the community.
          </p>
          <Link
            href="/browse"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Start shopping
          </Link>
        </section>
      )}
    </div>
  );
}
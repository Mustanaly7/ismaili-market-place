import { HeartHandshake, Users, Coins } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/utils";
import { getPlatformSettings, getWelfareTotals, listWelfareContributions } from "@/server/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Community impact" };

export default async function AdminImpactPage() {
  const [totals, contributions, settings] = await Promise.all([
    getWelfareTotals(),
    listWelfareContributions(),
    getPlatformSettings(),
  ]);

  const cards = [
    {
      label: "Raised for the welfare fund",
      value: formatMoney(totals.totalCents),
      icon: HeartHandshake,
      tone: "bg-brand-100 text-brand-700",
    },
    { label: "Contributions", value: String(totals.count), icon: Coins, tone: "bg-accent-100 text-accent-700" },
    {
      label: "Contributing shops",
      value: String(new Set(contributions.map((c) => c.contribution.businessId)).size),
      icon: Users,
      tone: "bg-stone-100 text-stone-700",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Community impact</h1>
      <p className="mt-1 text-lg text-stone-600">
        Round-ups from buyers that support the {settings.welfareFundName}.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-stone-200 bg-white p-5">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.tone}`}>
              <c.icon aria-hidden className="h-6 w-6" />
            </span>
            <span className="mt-3 block text-3xl font-black">{c.value}</span>
            <span className="block text-sm text-stone-600">{c.label}</span>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-2xl font-bold">Latest contributions</h2>
        {contributions.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-stone-200 bg-white p-5 text-lg text-stone-600">
            No contributions yet. Buyers can round up their total at checkout to support the fund.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
            {contributions.map(({ contribution, businessName }) => (
              <li key={contribution.id} className="flex items-center justify-between p-4">
                <span>
                  <span className="block text-base font-semibold">{businessName}</span>
                  <span className="block text-sm text-stone-500">{formatDate(contribution.createdAt)}</span>
                </span>
                <span className="font-bold text-brand-700">{formatMoney(contribution.amountCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
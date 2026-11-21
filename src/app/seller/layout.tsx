import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const nav: { href: string; label: string }[] = [
  { href: "/seller/dashboard", label: "Dashboard" },
  { href: "/seller/products", label: "My products" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/payouts", label: "Payouts" },
  { href: "/seller/reviews", label: "Reviews" },
  { href: "/messages", label: "Messages" },
  { href: "/seller/analytics", label: "Insights" },
  { href: "/seller/settings", label: "Settings" },
];

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="border-b border-stone-200 bg-white">
        <nav
          aria-label="Seller tools"
          className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2"
        >
          <span className="mr-2 hidden shrink-0 text-base font-bold text-brand-800 sm:inline">
            Your shop
          </span>
          {nav.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "inline-flex min-h-touch items-center whitespace-nowrap rounded-xl px-3 py-2 text-base font-semibold text-stone-700 hover:bg-stone-100",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
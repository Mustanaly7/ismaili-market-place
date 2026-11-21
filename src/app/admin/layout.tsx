import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const nav: { href: string; label: string }[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/verifications", label: "Verifications" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/campaigns", label: "Campaigns" },
  { href: "/admin/impact", label: "Impact" },
  { href: "/admin/categories", label: "Categories & fees" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="border-b border-stone-200 bg-white">
        <nav aria-label="Admin tools" className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2">
          <span className="mr-2 hidden shrink-0 text-base font-bold text-brand-800 sm:inline">Admin</span>
          {nav.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex min-h-touch items-center whitespace-nowrap rounded-xl px-3 py-2 text-base font-semibold text-stone-700 hover:bg-stone-100"
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
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Menu,
  X,
  User,
  LogIn,
  Bell,
  ShieldCheck,
  LayoutDashboard,
  ShoppingCart,
} from "lucide-react";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import type { LocaleCode } from "@/lib/i18n";

type NavLink = { href: string; label: string };
type UserSummary = { name: string | null; role: string } | null;

export function MobileMenu({
  links,
  user,
  locale,
  unread,
  labels,
}: {
  links: NavLink[];
  user: UserSummary;
  locale: LocaleCode;
  unread: number;
  labels: {
    menu: string;
    close: string;
    account: string;
    login: string;
    notifications: string;
    cart: string;
    dashboard: string;
    admin: string;
    language: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.menu}
        aria-expanded={open}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
      >
        <Menu aria-hidden className="h-5 w-5" />
      </button>

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={labels.menu}>
          <button
            type="button"
            aria-label={labels.close}
            className="absolute inset-0 h-full w-full bg-stone-900/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 end-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
              <span className="text-lg font-extrabold text-stone-900">ISMAILI</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={labels.close}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <nav className="flex flex-col gap-1" aria-label="Mobile">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex min-h-touch items-center rounded-xl px-3 text-base font-semibold text-stone-700 hover:bg-brand-50 hover:text-brand-800"
                  >
                    {l.label}
                  </Link>
                ))}
                {user?.role === "seller" || user?.role === "admin" ? (
                  <Link
                    href="/seller/dashboard"
                    className="flex min-h-touch items-center gap-2 rounded-xl px-3 text-base font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    <LayoutDashboard aria-hidden className="h-5 w-5" />
                    {labels.dashboard}
                  </Link>
                ) : null}
                {user?.role === "admin" ? (
                  <Link
                    href="/admin"
                    className="flex min-h-touch items-center gap-2 rounded-xl px-3 text-base font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    <ShieldCheck aria-hidden className="h-5 w-5" />
                    {labels.admin}
                  </Link>
                ) : null}
              </nav>

              <div className="my-3 border-t border-stone-200" />

              <div className="flex flex-col gap-1">
                <Link
                  href="/cart"
                  className="flex min-h-touch items-center gap-2 rounded-xl px-3 text-base font-semibold text-stone-700 hover:bg-stone-100"
                >
                  <ShoppingCart aria-hidden className="h-5 w-5" />
                  {labels.cart}
                </Link>
                {user ? (
                  <Link
                    href="/notifications"
                    className="flex min-h-touch items-center gap-2 rounded-xl px-3 text-base font-semibold text-stone-700 hover:bg-stone-100"
                  >
                    <Bell aria-hidden className="h-5 w-5" />
                    {labels.notifications}
                    {unread > 0 ? (
                      <span className="ms-auto inline-flex min-w-5 items-center justify-center rounded-full bg-danger-600 px-1.5 text-xs font-bold text-white">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    ) : null}
                  </Link>
                ) : null}
                {user ? (
                  <Link
                    href="/account"
                    className="flex min-h-touch items-center gap-2 rounded-xl bg-brand-600 px-3 text-base font-semibold text-white hover:bg-brand-700"
                  >
                    <User aria-hidden className="h-5 w-5" />
                    {user.name || labels.account}
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="flex min-h-touch items-center gap-2 rounded-xl border border-brand-600 px-3 text-base font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    <LogIn aria-hidden className="h-5 w-5" />
                    {labels.login}
                  </Link>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2">
                <span className="text-sm font-semibold text-stone-600">{labels.language}</span>
                <LocaleSwitcher locale={locale} />
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )
        : null}
    </div>
  );
}
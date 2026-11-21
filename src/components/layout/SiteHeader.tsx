import Link from "next/link";
import { Search, ShoppingCart, User, LogIn, LayoutDashboard, ShieldCheck, Bell } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { CartBadge } from "@/components/cart/CartBadge";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { getTranslator } from "@/lib/locale-server";
import { unreadNotificationCount } from "@/server/notifications";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const { locale, t } = await getTranslator();
  const unreadNotifications = user ? await unreadNotificationCount(user.id) : 0;

  const navLinks: { href: string; label: string }[] = [
    { href: "/browse", label: t("nav.browse") },
    { href: "/collections", label: "Collections" },
    { href: "/guides", label: "Guides" },
    { href: "/sell", label: t("nav.sell") },
    { href: "/messages", label: t("nav.messages") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 glass">
      <div className="h-0.5 w-full bg-gradient-to-r from-brand-700 via-accent-400 to-brand-700" />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
        <Link href="/" className="order-1 flex items-center gap-2.5" aria-label="ISMAILI Market Place home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-black text-white shadow-sm ring-1 ring-brand-900/10">
            I
          </span>
          <span className="text-[1.05rem] font-extrabold leading-none tracking-tight text-stone-900">
            ISMAILI
            <span className="mt-1 block text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-brand-700">
              Market Place
            </span>
          </span>
        </Link>

        <form action="/search" className="order-3 w-full sm:order-2 sm:w-auto sm:max-w-xl sm:flex-1">
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
            />
            <input
              type="search"
              name="q"
              placeholder={t("search.placeholder")}
              aria-label={t("nav.search")}
              className="h-11 w-full rounded-full border border-stone-200 bg-white ps-11 pe-24 text-base text-stone-900 shadow-sm transition placeholder:text-stone-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
            <button
              type="submit"
              className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {t("action.search")}
            </button>
          </div>
        </form>

        <div className="order-2 ms-auto flex items-center gap-2 sm:order-3">
          <span className="hidden sm:inline-flex">
            <LocaleSwitcher locale={locale} />
          </span>
          <Link
            href="/cart"
            className="relative inline-flex h-11 items-center gap-2 rounded-full border border-stone-200 bg-white px-3.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
          >
            <ShoppingCart aria-hidden className="h-5 w-5" />
            <span className="hidden sm:inline">{t("nav.cart")}</span>
            <CartBadge />
          </Link>
          {user ? (
            <Link
              href="/notifications"
              aria-label={t("nav.notifications")}
              className="relative hidden h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700 sm:inline-flex"
            >
              <Bell aria-hidden className="h-5 w-5" />
              {unreadNotifications > 0 ? (
                <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-600 px-1 text-[0.7rem] font-bold text-white">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              ) : null}
            </Link>
          ) : null}
          {user ? (
            <Link
              href="/account"
              className="hidden h-11 items-center gap-2 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 sm:inline-flex"
            >
              <User aria-hidden className="h-5 w-5" />
              <span className="hidden max-w-[9rem] truncate sm:inline">{user.name || t("nav.account")}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden h-11 items-center gap-2 rounded-full border border-brand-600 px-4 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 sm:inline-flex"
            >
              <LogIn aria-hidden className="h-5 w-5" />
              <span className="hidden sm:inline">{t("nav.login")}</span>
            </Link>
          )}
          <MobileMenu
            links={navLinks}
            user={user ? { name: user.name ?? null, role: user.role } : null}
            locale={locale}
            unread={unreadNotifications}
            labels={{
              menu: t("nav.menu"),
              close: "Close",
              account: t("nav.account"),
              login: t("nav.login"),
              notifications: t("nav.notifications"),
              cart: t("nav.cart"),
              dashboard: t("nav.dashboard"),
              admin: t("nav.admin"),
              language: t("nav.language"),
            }}
          />
        </div>
      </div>

      <div className="border-t border-stone-200/60">
        <nav className="mx-auto hidden max-w-6xl items-center gap-1 overflow-x-auto px-4 py-1.5 sm:flex" aria-label="Main">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex h-9 items-center whitespace-nowrap rounded-full px-3.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-brand-800"
            >
              {l.label}
            </Link>
          ))}
          {user?.role === "seller" || user?.role === "admin" ? (
            <Link
              href="/seller/dashboard"
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              <LayoutDashboard aria-hidden className="h-4 w-4" />
              {t("nav.dashboard")}
            </Link>
          ) : null}
          {user?.role === "admin" ? (
            <Link
              href="/admin"
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              <ShieldCheck aria-hidden className="h-4 w-4" />
              {t("nav.admin")}
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
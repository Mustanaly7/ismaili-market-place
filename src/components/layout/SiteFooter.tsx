import Link from "next/link";
import { getTranslator } from "@/lib/locale-server";

export async function SiteFooter() {
  const { t } = await getTranslator();

  return (
    <footer className="mt-16 bg-brand-950 text-brand-100">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-lg font-black text-white ring-1 ring-white/15">
                I
              </span>
              <span className="text-[1.05rem] font-extrabold leading-none tracking-tight text-white">
                ISMAILI
                <span className="mt-1 block text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-accent-300">
                  Market Place
                </span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-200">
              {t("footer.about")}
            </p>
          </div>
          <FooterCol
            title={t("footer.shop")}
            links={[
              { href: "/browse", label: t("footer.browseAll") },
              { href: "/collections", label: "Collections" },
              { href: "/search", label: t("nav.search") },
              { href: "/cart", label: t("footer.yourCart") },
            ]}
          />
          <FooterCol
            title={t("footer.sell")}
            links={[
              { href: "/sell", label: t("footer.startSelling") },
              { href: "/seller/dashboard", label: t("footer.sellerDashboard") },
              { href: "/guides", label: "Mentorship guides" },
              { href: "/messages", label: t("nav.messages") },
            ]}
          />
          <FooterCol
            title={t("footer.help")}
            links={[
              { href: "/help", label: t("footer.helpCentre") },
              { href: "/impact", label: "Community impact" },
              { href: "/terms", label: t("footer.terms") },
              { href: "/privacy", label: t("footer.privacy") },
            ]}
          />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-center text-sm text-brand-200/80 sm:flex-row sm:text-start">
          <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
          <p>{t("footer.trust")}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wide text-white">{title}</h3>
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-brand-200 transition hover:text-white"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
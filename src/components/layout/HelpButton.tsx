import { MessageCircle, Phone } from "lucide-react";
import { getTranslator } from "@/lib/locale-server";

/**
 * Persistent, always-visible help. Plain HTML <details> so it works with no
 * JavaScript and is reachable by keyboard & screen readers.
 */
export async function HelpButton() {
  const { t } = await getTranslator();
  const phone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "";
  const whatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "";

  return (
    <details className="help fixed bottom-5 end-5 z-40">
      <summary className="flex min-h-touch items-center gap-2 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 px-5 py-3 text-base font-bold text-brand-950 shadow-lift transition hover:from-accent-300 hover:to-accent-500">
        <MessageCircle aria-hidden className="h-5 w-5" />
        {t("action.needHelp")}
      </summary>
      <div className="mt-2 w-72 rounded-2xl border border-stone-200 bg-white p-4 shadow-lift">
        <p className="mb-3 text-base font-semibold text-stone-800">
          {t("help.prompt")}
        </p>
        <div className="flex flex-col gap-2">
          {phone ? (
            <a
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="flex min-h-touch items-center gap-3 rounded-xl bg-brand-600 px-4 py-2 text-base font-semibold text-white transition hover:bg-brand-700"
            >
              <Phone aria-hidden className="h-5 w-5" />
              {t("help.call", { phone })}
            </a>
          ) : null}
          {whatsapp ? (
            <a
              href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
              className="flex min-h-touch items-center gap-3 rounded-xl border border-brand-600 px-4 py-2 text-base font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              <MessageCircle aria-hidden className="h-5 w-5" />
              {t("help.whatsapp")}
            </a>
          ) : null}
          {!phone && !whatsapp ? (
            <p className="text-base text-stone-600">{t("help.email")}</p>
          ) : null}
        </div>
      </div>
    </details>
  );
}
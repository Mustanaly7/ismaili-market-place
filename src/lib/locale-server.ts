import { cookies } from "next/headers";
import {
  LOCALE_COOKIE,
  toLocale,
  createTranslator,
  dirFor,
  type LocaleCode,
  type TranslateFn,
} from "./i18n";

/** Resolve the active locale from the locale cookie. */
export async function getLocale(): Promise<LocaleCode> {
  const store = await cookies();
  return toLocale(store.get(LOCALE_COOKIE)?.value);
}

/** Active locale plus a translate function bound to it. */
export async function getTranslator(): Promise<{
  locale: LocaleCode;
  dir: "ltr" | "rtl";
  t: TranslateFn;
}> {
  const locale = await getLocale();
  return { locale, dir: dirFor(locale), t: createTranslator(locale) };
}
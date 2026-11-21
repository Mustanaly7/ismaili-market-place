"use client";

import { useEffect, useState, useTransition } from "react";
import { Languages } from "lucide-react";
import { setLocaleAction } from "@/server/actions/locale";
import { locales, toLocale, type LocaleCode } from "@/lib/i18n";

export function LocaleSwitcher({ locale }: { locale: LocaleCode }) {
  const [current, setCurrent] = useState<LocaleCode>(locale);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCurrent(locale);
  }, [locale]);

  function handleChange(next: LocaleCode) {
    if (next === current) return;
    setCurrent(next);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("locale", next);
      await setLocaleAction(fd);
    });
  }

  return (
    <form action={setLocaleAction} className="inline-flex items-center">
      <label htmlFor="locale-select" className="sr-only">
        Language
      </label>
      <div className="relative inline-flex items-center">
        <Languages
          aria-hidden
          className="pointer-events-none absolute left-2.5 h-4 w-4 text-stone-500"
        />
        <select
          id="locale-select"
          name="locale"
          value={current}
          disabled={isPending}
          onChange={(e) => handleChange(toLocale(e.target.value))}
          className="h-10 appearance-none rounded-full border border-stone-200 bg-white pl-8 pr-7 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:opacity-60"
        >
          {locales.map((l) => (
            <option key={l.code} value={l.code} lang={l.code}>
              {l.nativeName}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-2 text-[0.6rem] text-stone-400"
        >
          ▾
        </span>
      </div>
      <noscript>
        <button
          type="submit"
          className="ml-1 rounded-full border border-stone-200 px-3 py-2 text-sm font-semibold"
        >
          Set
        </button>
      </noscript>
    </form>
  );
}
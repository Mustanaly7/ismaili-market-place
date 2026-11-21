"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  getMessages,
  interpolate,
  dirFor,
  type LocaleCode,
  type Direction,
  type TranslateFn,
  type Vars,
} from "@/lib/i18n";

interface I18nContextValue {
  locale: LocaleCode;
  dir: Direction;
  t: TranslateFn;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: LocaleCode;
  children: ReactNode;
}) {
  const value = useMemo<I18nContextValue>(() => {
    const dict = getMessages(locale);
    return {
      locale,
      dir: dirFor(locale),
      t: (key: string, vars?: Vars) => interpolate(dict[key] ?? key, vars),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}
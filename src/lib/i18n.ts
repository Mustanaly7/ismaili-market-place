/**
 * Internationalization core. Pure / isomorphic — no Node or Next.js imports so
 * it can be used on both the server and the client. Server-only helpers (cookie
 * reading) live in `./locale-server`.
 *
 * Shipping locales: English and Urdu. Urdu is right-to-left.
 */

export type LocaleCode = "en" | "ur";

export type Direction = "ltr" | "rtl";

export interface LocaleMeta {
  code: LocaleCode;
  /** English label, used in admin / analytics. */
  label: string;
  /** Name of the language written in that language, shown in the switcher. */
  nativeName: string;
  dir: Direction;
}

export const locales: LocaleMeta[] = [
  { code: "en", label: "English", nativeName: "English", dir: "ltr" },
  { code: "ur", label: "Urdu", nativeName: "اردو", dir: "rtl" },
];

export const defaultLocale: LocaleCode = "en";

export const localeCodes: LocaleCode[] = locales.map((l) => l.code);

export function isLocale(value: unknown): value is LocaleCode {
  return typeof value === "string" && (localeCodes as string[]).includes(value);
}

export function localeMeta(code: LocaleCode): LocaleMeta {
  return locales.find((l) => l.code === code) ?? locales[0];
}

export function dirFor(code: LocaleCode): Direction {
  return localeMeta(code).dir;
}

export const LOCALE_COOKIE = "ismaili_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Coerce an arbitrary value into a supported locale code. */
export function toLocale(value: unknown): LocaleCode {
  if (isLocale(value)) return value;
  if (typeof value === "string") {
    const base = value.toLowerCase().split(/[-_]/)[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}

export type Messages = Record<string, string>;

/**
 * Source of truth for shared UI copy. Urdu is a partial override and falls back
 * to these English strings for any key it does not translate.
 */
const en: Messages = {
  "app.name": "ISMAILI Market Place",
  "app.tagline": "Local sellers, real people, simple shopping.",

  "nav.home": "Home",
  "nav.browse": "Browse",
  "nav.search": "Search",
  "nav.cart": "Cart",
  "nav.messages": "Messages",
  "nav.account": "My account",
  "nav.sell": "Sell your things",
  "nav.login": "Log in",
  "nav.signup": "Sign up",
  "nav.logout": "Log out",
  "nav.dashboard": "Dashboard",
  "nav.admin": "Admin",
  "nav.language": "Language",
  "nav.menu": "Menu",
  "nav.notifications": "Notifications",

  "action.continue": "Continue",
  "action.back": "Back",
  "action.save": "Save",
  "action.cancel": "Cancel",
  "action.delete": "Delete",
  "action.search": "Search",
  "action.addToCart": "Add to cart",
  "action.buyNow": "Buy now",
  "action.contactSeller": "Contact seller",
  "action.needHelp": "Need help?",

  "search.placeholder": "Search products, sellers, or categories",

  "label.price": "Price",
  "label.quantity": "How many do you have?",
  "label.productName": "Product name",
  "label.description": "Description",

  "empty.products": "No products yet.",
  "empty.results": "Nothing matched your search. Try different words.",

  "common.loading": "Loading…",

  "footer.rights": "All rights reserved.",

  "a11y.skip": "Skip to main content",
};

const ur: Messages = {
  "app.tagline": "مقامی بیچنے والے، حقیقی لوگ، آسان خریداری۔",
  "nav.home": "ہوم",
  "nav.browse": "براؤز کریں",
  "nav.search": "تلاش",
  "nav.cart": "کارٹ",
  "nav.messages": "پیغامات",
  "nav.account": "میرا اکاؤنٹ",
  "nav.sell": "اپنی چیزیں بیچیں",
  "nav.login": "لاگ ان",
  "nav.signup": "سائن اپ",
  "nav.logout": "لاگ آؤٹ",
  "nav.dashboard": "ڈیش بورڈ",
  "nav.admin": "ایڈمن",
  "nav.language": "زبان",
  "nav.menu": "مینو",
  "nav.notifications": "اطلاعات",
  "action.continue": "جاری رکھیں",
  "action.back": "واپس",
  "action.save": "محفوظ کریں",
  "action.cancel": "منسوخ کریں",
  "action.delete": "حذف کریں",
  "action.search": "تلاش",
  "action.addToCart": "کارٹ میں شامل کریں",
  "action.buyNow": "ابھی خریدیں",
  "action.contactSeller": "بیچنے والے سے رابطہ کریں",
  "action.needHelp": "مدد کی ضرورت ہے؟",
  "search.placeholder": "مصنوعات، بیچنے والے، یا زمرے تلاش کریں",
  "label.price": "قیمت",
  "label.quantity": "آپ کے پاس کتنے ہیں؟",
  "label.productName": "مصنوعات کا نام",
  "label.description": "تفصیل",
  "empty.products": "ابھی کوئی مصنوعات نہیں۔",
  "empty.results": "آپ کی تلاش سے کچھ نہیں ملا۔ مختلف الفاظ آزمائیں۔",
  "common.loading": "لوڈ ہو رہا ہے…",
  "footer.rights": "جملہ حقوق محفوظ ہیں۔",
};

const overrides: Record<LocaleCode, Messages> = { en, ur };

/** Shared-shell strings (footer + help) kept in a separate block for clarity. */
const extra: Record<LocaleCode, Messages> = {
  en: {
    "footer.about":
      "A community-run marketplace connecting local sellers with the people who love what they make.",
    "footer.shop": "Shop",
    "footer.browseAll": "Browse all",
    "footer.yourCart": "Your cart",
    "footer.sell": "Sell",
    "footer.startSelling": "Start selling",
    "footer.sellerDashboard": "Seller dashboard",
    "footer.help": "Help",
    "footer.helpCentre": "Help centre",
    "footer.terms": "Terms of Service",
    "footer.privacy": "Privacy Policy",
    "footer.copyright": "© {year} ISMAILI Market Place. Made with care for every seller.",
    "footer.trust": "Community-run · Verified sellers · Secure payments",
    "help.prompt": "We are happy to help you.",
    "help.call": "Call {phone}",
    "help.whatsapp": "Message on WhatsApp",
    "help.email": "Email us at help@ismailimarket.example and we will reply the same day.",
  },
  ur: {
    "footer.about":
      "ایک کمیونٹی کے زیرِانتظام بازار جو مقامی بیچنے والوں کو ان لوگوں سے جوڑتا ہے جو ان کی بنائی چیزوں کو پسند کرتے ہیں۔",
    "footer.shop": "خریداری",
    "footer.browseAll": "سب دیکھیں",
    "footer.yourCart": "آپ کا کارٹ",
    "footer.sell": "فروخت",
    "footer.startSelling": "فروخت شروع کریں",
    "footer.sellerDashboard": "بیچنے والے کا ڈیش بورڈ",
    "footer.help": "مدد",
    "footer.helpCentre": "مدد مرکز",
    "footer.terms": "شرائطِ خدمت",
    "footer.privacy": "رازداری کی پالیسی",
    "footer.copyright": "© {year} اسماعیلی مارکیٹ پلیس۔ ہر بیچنے والے کے لیے محبت سے بنایا گیا۔",
    "footer.trust": "کمیونٹی کے زیرِانتظام · تصدیق شدہ بیچنے والے · محفوظ ادائیگیاں",
    "help.prompt": "ہمیں آپ کی مدد کرکے خوشی ہوگی۔",
    "help.call": "{phone} پر کال کریں",
    "help.whatsapp": "واٹس ایپ پر پیغام بھیجیں",
    "help.email": "ہمیں help@ismailimarket.example پر ای میل کریں، ہم اسی دن جواب دیں گے۔",
  },
};

/** Fully-resolved dictionary for a locale (its own strings + English fallback). */
export function getMessages(code: LocaleCode): Messages {
  return { ...en, ...extra.en, ...overrides[code], ...extra[code] };
}

export type Vars = Record<string, string | number>;

/** Interpolate `{name}` placeholders. */
export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match,
  );
}

export type TranslateFn = (key: string, vars?: Vars) => string;

/** Build a translate function bound to a locale. */
export function createTranslator(code: LocaleCode): TranslateFn {
  const dict = getMessages(code);
  return (key: string, vars?: Vars) => interpolate(dict[key] ?? key, vars);
}

/** One-off translation for a locale. */
export function translate(code: LocaleCode, key: string, vars?: Vars): string {
  return createTranslator(code)(key, vars);
}

/** Translate using the default locale (kept for backwards compatibility). */
export function t(key: string, vars?: Vars): string {
  return translate(defaultLocale, key, vars);
}

export function formatStep(step: number, total: number): string {
  return `Step ${step} of ${total}`;
}
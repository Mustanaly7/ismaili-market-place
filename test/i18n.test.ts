import { describe, expect, it } from "vitest";
import {
  createTranslator,
  dirFor,
  formatStep,
  getMessages,
  interpolate,
  locales,
  t,
  toLocale,
  translate,
} from "@/lib/i18n";

describe("i18n", () => {
  it("returns the copy for a known key", () => {
    expect(t("nav.home")).toBe("Home");
    expect(t("action.addToCart")).toBe("Add to cart");
  });

  it("formats step text consistently", () => {
    expect(formatStep(2, 4)).toBe("Step 2 of 4");
  });

  it("marks Urdu as right-to-left and English as left-to-right", () => {
    expect(dirFor("ur")).toBe("rtl");
    expect(dirFor("en")).toBe("ltr");
  });

  it("exposes only the two shipping locales", () => {
    expect(locales.map((l) => l.code).sort()).toEqual(["en", "ur"]);
  });

  it("translates a known key per locale", () => {
    expect(translate("ur", "nav.browse")).toBe("براؤز کریں");
    expect(translate("ur", "nav.cart")).toBe("کارٹ");
    expect(translate("en", "nav.login")).toBe("Log in");
  });

  it("falls back to English for untranslated keys", () => {
    const dict = getMessages("ur");
    expect(dict["app.name"]).toBe("ISMAILI Market Place");
  });

  it("returns the key itself when it is unknown", () => {
    expect(createTranslator("en")("does.not.exist")).toBe("does.not.exist");
  });

  it("interpolates variables", () => {
    expect(interpolate("© {year} ISMAILI", { year: 2026 })).toBe("© 2026 ISMAILI");
    expect(createTranslator("en")("help.call", { phone: "+1 555" })).toBe(
      "Call +1 555",
    );
  });

  it("coerces arbitrary values into a supported locale", () => {
    expect(toLocale("ur-PK")).toBe("ur");
    expect(toLocale("en_US")).toBe("en");
    expect(toLocale("fr-CA")).toBe("en");
    expect(toLocale("de")).toBe("en");
    expect(toLocale(undefined)).toBe("en");
    expect(toLocale(42)).toBe("en");
  });
});
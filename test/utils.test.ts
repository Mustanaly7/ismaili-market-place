import { describe, expect, it } from "vitest";
import {
  centsToInput,
  cn,
  formatMoney,
  initials,
  normalizeSearch,
  parsePriceToCents,
  slugify,
  truncate,
} from "@/lib/utils";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Amina's Kitchen")).toBe("aminas-kitchen");
  });
  it("trims stray hyphens and collapses spaces", () => {
    expect(slugify("  Fresh   Bread!! ")).toBe("fresh-bread");
  });
  it("limits length to 60 characters", () => {
    expect(slugify("a".repeat(120)).length).toBe(60);
  });
});

describe("formatMoney", () => {
  it("formats integer cents as currency", () => {
    expect(formatMoney(650)).toBe("$6.50");
  });
  it("treats missing or zero values as $0.00", () => {
    expect(formatMoney(0)).toBe("$0.00");
    expect(formatMoney(Number.NaN)).toBe("$0.00");
  });
});

describe("parsePriceToCents", () => {
  it("parses a decimal price string", () => {
    expect(parsePriceToCents("12.50")).toBe(1250);
  });
  it("ignores currency symbols and commas", () => {
    expect(parsePriceToCents("$1,234.99")).toBe(123499);
  });
  it("returns 0 for empty or invalid input", () => {
    expect(parsePriceToCents("abc")).toBe(0);
    expect(parsePriceToCents("")).toBe(0);
  });
  it("rounds to the nearest cent", () => {
    expect(parsePriceToCents(9.999)).toBe(1000);
  });
});

describe("centsToInput", () => {
  it("renders cents as a two-decimal string for form inputs", () => {
    expect(centsToInput(1250)).toBe("12.50");
    expect(centsToInput(0)).toBe("0.00");
  });
});

describe("initials", () => {
  it("uses the first letters of the first two words", () => {
    expect(initials("Sara Ahmed")).toBe("SA");
  });
  it("handles a single name", () => {
    expect(initials("Amina")).toBe("A");
  });
});

describe("truncate", () => {
  it("leaves short text unchanged", () => {
    expect(truncate("hi", 5)).toBe("hi");
  });
  it("adds an ellipsis when text is too long", () => {
    expect(truncate("hello world", 8)).toBe("hello w\u2026");
  });
});

describe("normalizeSearch", () => {
  it("lowercases, trims, and collapses whitespace", () => {
    expect(normalizeSearch("  Fresh   Bread ")).toBe("fresh bread");
  });
});

describe("cn", () => {
  it("joins truthy class names and drops falsy ones", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
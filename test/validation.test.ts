import { describe, expect, it } from "vitest";
import {
  checkoutSchema,
  loginSchema,
  productSchema,
  settingsSchema,
  signupSchema,
} from "@/lib/validation";

describe("signupSchema", () => {
  it("accepts an email identifier", () => {
    const r = signupSchema.safeParse({ identifier: "buyer@demo.test", password: "password123" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.role).toBe("buyer");
  });

  it("accepts a phone identifier", () => {
    const r = signupSchema.safeParse({ identifier: "+92 300 1112233", password: "password123" });
    expect(r.success).toBe(true);
  });

  it("rejects a bad identifier", () => {
    const r = signupSchema.safeParse({ identifier: "abc", password: "password123" });
    expect(r.success).toBe(false);
  });

  it("rejects a short password", () => {
    const r = signupSchema.safeParse({ identifier: "buyer@demo.test", password: "123" });
    expect(r.success).toBe(false);
  });

  it("rejects an unknown role", () => {
    const r = signupSchema.safeParse({
      identifier: "buyer@demo.test",
      password: "password123",
      role: "superuser",
    });
    expect(r.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires a password", () => {
    expect(loginSchema.safeParse({ identifier: "x@y.com", password: "" }).success).toBe(false);
  });
  it("accepts valid credentials", () => {
    expect(loginSchema.safeParse({ identifier: "x@y.com", password: "pw" }).success).toBe(true);
  });
});

describe("productSchema", () => {
  const base = { name: "Sourdough", priceCents: 650, quantity: 10 };

  it("applies defaults for optional fields", () => {
    const r = productSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.allowBackorder).toBe(false);
      expect(r.data.images).toEqual([]);
    }
  });

  it("rejects a negative quantity", () => {
    expect(productSchema.safeParse({ ...base, quantity: -1 }).success).toBe(false);
  });

  it("rejects a too-short name", () => {
    expect(productSchema.safeParse({ ...base, name: "x" }).success).toBe(false);
  });

  it("rejects more than 8 images", () => {
    const images = Array.from({ length: 9 }, (_, i) => `u${i}`);
    expect(productSchema.safeParse({ ...base, images }).success).toBe(false);
  });
});

describe("checkoutSchema", () => {
  const valid = {
    shippingName: "Sara Ahmed",
    shippingPhone: "+923001112233",
    shippingAddress: "12 Garden Road, Karachi",
  };

  it("defaults the payment mode to online", () => {
    const r = checkoutSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.paymentMode).toBe("online");
  });

  it("rejects a missing address", () => {
    expect(checkoutSchema.safeParse({ ...valid, shippingAddress: "" }).success).toBe(false);
  });
});

describe("settingsSchema", () => {
  it("accepts a commission within range", () => {
    expect(settingsSchema.safeParse({ commissionPct: 5, currency: "USD" }).success).toBe(true);
  });
  it("rejects a commission above 50 percent", () => {
    expect(settingsSchema.safeParse({ commissionPct: 60, currency: "USD" }).success).toBe(false);
  });
});
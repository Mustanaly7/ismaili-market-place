import { z } from "zod";

const identifier = z
  .string()
  .trim()
  .min(3, "Enter your email or phone number.")
  .max(120)
  .refine(
    (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || /^[+()\-\s0-9]{6,}$/.test(v),
    "Enter a valid email or phone number.",
  );

export const signupSchema = z.object({
  name: z.string().trim().max(80).optional().default(""),
  identifier,
  password: z.string().min(6, "Use at least 6 characters.").max(100),
  role: z.enum(["buyer", "seller"]).default("buyer"),
});

export const loginSchema = z.object({
  identifier,
  password: z.string().min(1, "Enter your password."),
});

export const onboardingSchema = z.object({
  name: z.string().trim().min(2, "What is your business called?").max(80),
  category: z.string().trim().min(1, "Choose a category."),
  description: z.string().trim().max(600).optional().default(""),
  location: z.string().trim().max(120).optional().default(""),
  contactMethod: z.enum(["message", "phone", "email"]).default("message"),
  contactPhone: z.string().trim().max(40).optional().default(""),
  contactEmail: z.string().trim().max(120).optional().default(""),
  businessHours: z.string().trim().max(120).optional().default(""),
  logoUrl: z.string().trim().max(500).optional().default(""),
  coverUrl: z.string().trim().max(500).optional().default(""),
  paymentMode: z.enum(["online", "contact"]).default("online"),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "What is this product called?").max(120),
  priceCents: z.coerce.number().int().min(0, "Enter a price.").max(100_000_000),
  quantity: z.coerce.number().int().min(0, "How many do you have?").max(1_000_000),
  description: z.string().trim().max(2000).optional().default(""),
  category: z.string().trim().max(80).optional().default(""),
  allowBackorder: z.coerce.boolean().optional().default(false),
  images: z.array(z.string().trim().min(1)).max(8).optional().default([]),
});

export const checkoutSchema = z.object({
  shippingName: z.string().trim().min(2, "Enter the name for delivery.").max(120),
  shippingPhone: z.string().trim().min(6, "Enter a phone number.").max(40),
  shippingAddress: z.string().trim().min(5, "Enter the delivery address.").max(400),
  note: z.string().trim().max(500).optional().default(""),
  paymentMode: z.enum(["online", "contact"]).default("online"),
});

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Type a message.").max(2000),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().default(""),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Enter a category name.").max(60),
  parentId: z.string().uuid().optional().nullable(),
});

export const settingsSchema = z.object({
  commissionPct: z.coerce.number().min(0).max(50),
  autoApprove: z.coerce.boolean().optional().default(true),
  currency: z.string().trim().min(1).max(8).default("USD"),
});

export const reportSchema = z.object({
  targetType: z.enum(["product", "message", "profile"]),
  targetId: z.string().uuid(),
  reason: z.string().trim().min(5, "Tell us what is wrong.").max(500),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
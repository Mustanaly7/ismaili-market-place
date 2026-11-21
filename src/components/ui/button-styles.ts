import { cn } from "@/lib/utils";

export type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "subtle";
export type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-md",
  secondary:
    "bg-accent-400 text-brand-950 shadow-sm hover:bg-accent-300 hover:shadow-md",
  outline:
    "border border-stone-300 bg-white text-stone-800 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50/60",
  ghost: "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
  danger: "bg-danger-600 text-white shadow-sm hover:bg-danger-700 hover:shadow-md",
  subtle: "bg-stone-100 text-stone-800 hover:bg-stone-200",
};

const sizes: Record<Size, string> = {
  sm: "min-h-touch px-3.5 text-[15px]",
  md: "min-h-touch px-5 text-base",
  lg: "min-h-[52px] px-7 text-lg",
};

export function buttonClass(
  variant: Variant = "primary",
  size: Size = "md",
  extra = "",
): string {
  return cn(base, variants[variant], sizes[size], extra);
}
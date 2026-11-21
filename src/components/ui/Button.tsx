"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClass, type Size, type Variant } from "./button-styles";

export { buttonClass };
export type { Size, Variant };

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  /** Optional label shown while a form submission is in flight. */
  pendingText?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  disabled,
  pendingText,
  ...props
}: ButtonProps) {
  const { pending } = useFormStatus();
  const busy = pending && props.type !== "button";

  return (
    <button
      className={buttonClass(variant, size, cn(fullWidth && "w-full", className))}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      {busy ? <Loader2 aria-hidden className="h-5 w-5 animate-spin" /> : null}
      {busy && pendingText ? pendingText : children}
    </button>
  );
}

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={buttonClass(variant, size, cn(fullWidth && "w-full", className))}
      {...props}
    />
  );
}
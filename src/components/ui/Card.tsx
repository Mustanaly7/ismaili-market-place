import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card",
        className,
      )}
      {...props}
    />
  );
}
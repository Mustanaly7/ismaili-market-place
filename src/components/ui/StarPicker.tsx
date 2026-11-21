"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Large, tappable 1-5 rating picker. Writes the value into a hidden input. */
export function StarPicker({ name = "rating", defaultValue = 0 }: { name?: string; defaultValue?: number }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      <input type="hidden" name={name} value={value} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => setValue(n)}
          className="flex min-h-touch min-w-touch items-center justify-center rounded-lg hover:bg-stone-100"
        >
          <Star
            width={32}
            height={32}
            className={cn(
              n <= value ? "fill-accent-400 text-accent-400" : "text-stone-300",
            )}
          />
        </button>
      ))}
    </div>
  );
}
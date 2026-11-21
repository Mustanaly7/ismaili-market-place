import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({
  rating,
  count,
  size = 18,
}: {
  rating: number;
  count?: number;
  size?: number;
}) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className="inline-flex max-w-full items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      <span className="flex shrink-0" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            width={size}
            height={size}
            className={cn(
              n <= rounded ? "fill-accent-400 text-accent-400" : "text-stone-300",
            )}
          />
        ))}
      </span>
      {typeof count === "number" ? (
        <span className="whitespace-nowrap text-sm text-stone-500">
          {rating > 0 ? rating.toFixed(1) : "New"}
          {count > 0 ? ` (${count})` : ""}
        </span>
      ) : null}
    </span>
  );
}
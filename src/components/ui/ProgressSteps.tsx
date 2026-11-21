import { cn } from "@/lib/utils";

/** Accessible progress indicator: shows "Step N of M" plus a visible bar. */
export function ProgressSteps({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  const total = steps.length;
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-lg font-bold text-brand-800">
          Step {current} of {total}
        </p>
        <p className="text-base text-stone-600">{steps[current - 1]}</p>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-stone-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={`Step ${current} of ${total}`}
      >
        <div
          className={cn("h-full rounded-full bg-brand-600 transition-all")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="mt-3 hidden gap-2 text-sm text-stone-500 sm:flex">
        {steps.map((label, i) => (
          <li
            key={label}
            className={cn(
              "flex-1 border-t-2 pt-1",
              i + 1 <= current ? "border-brand-600 text-brand-800" : "border-stone-200",
            )}
          >
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}
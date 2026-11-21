import { Flag } from "lucide-react";
import { submitReportAction } from "@/server/actions/shop";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function ReportForm({
  targetType,
  targetId,
  next,
}: {
  targetType: "product" | "message" | "profile";
  targetId: string;
  next: string;
}) {
  return (
    <details className="rounded-xl border border-stone-200 bg-white p-3">
      <summary className="flex cursor-pointer items-center gap-2 text-base font-medium text-stone-500">
        <Flag aria-hidden className="h-4 w-4" />
        Report this {targetType}
      </summary>
      <form action={submitReportAction} className="mt-3 flex flex-col gap-2">
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <input type="hidden" name="next" value={next} />
        <Textarea
          name="reason"
          required
          minLength={5}
          placeholder="Tell us what is wrong so we can review it."
          className="min-h-[90px]"
          aria-label="Reason for report"
        />
        <Button type="submit" variant="danger" size="sm">
          Send report
        </Button>
      </form>
    </details>
  );
}
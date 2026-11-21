import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function Alert({
  type = "info",
  message,
}: {
  type?: "error" | "success" | "info";
  message?: string | null;
}) {
  if (!message) return null;
  const styles =
    type === "error"
      ? "border-danger-500 bg-danger-50 text-danger-700"
      : type === "success"
        ? "border-green-500 bg-green-50 text-green-800"
        : "border-brand-400 bg-brand-50 text-brand-800";
  const Icon = type === "error" ? AlertTriangle : type === "success" ? CheckCircle2 : Info;
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={cn("mb-4 flex items-start gap-3 rounded-xl border-2 p-4 text-lg", styles)}
    >
      <Icon aria-hidden className="mt-0.5 h-6 w-6 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
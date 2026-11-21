import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-white px-6 py-14 text-center">
      {icon ? <div className="mb-4 text-stone-400">{icon}</div> : null}
      <h3 className="text-2xl font-bold text-stone-800">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-lg text-stone-600">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
import Link from "next/link";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { listNotifications } from "@/server/notifications";
import { markNotificationsReadAction } from "@/server/actions/notifications";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications" };

function describe(template: string, payload: Record<string, unknown> | null): { text: string; href?: string } {
  const orderId = typeof payload?.orderId === "string" ? payload.orderId : undefined;
  switch (template) {
    case "order.pending":
    case "order.confirmed":
    case "order.shipped":
    case "order.completed":
    case "order.cancelled":
      return { text: `Order update: ${template.split(".")[1]}`, href: orderId ? `/account/orders/${orderId}` : "/account/orders" };
    case "order.paid":
      return { text: "Payment received for your order.", href: orderId ? `/account/orders/${orderId}` : "/account/orders" };
    case "order.refunded":
      return { text: "Your order was refunded.", href: "/account/orders" };
    case "dispute.opened":
      return { text: "A buyer opened a case on an order.", href: "/seller/orders" };
    case "dispute.resolved":
      return { text: "A case you opened has been resolved.", href: "/account/orders" };
    case "verification.approved":
      return { text: "Your verification was approved.", href: "/account/verification" };
    case "verification.rejected":
      return { text: "Your verification was not approved.", href: "/account/verification" };
    default:
      return { text: template.replace(/[._]/g, " ") };
  }
}

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await listNotifications(user.id, 50);
  const hasUnread = items.some((n) => n.channel === "inapp" && !n.readAt);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Notifications</h1>
        {items.length > 0 ? (
          <form action={markNotificationsReadAction}>
            <Button type="submit" variant="subtle">
              Mark all read
            </Button>
          </form>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No notifications yet"
            description="Order updates, messages, and verification results will appear here."
            action={
              <Link href="/browse" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white">
                <Bell aria-hidden className="h-5 w-5" /> Start shopping
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {items.map((n) => {
            const d = describe(n.template, (n.payload ?? null) as Record<string, unknown> | null);
            const unread = n.channel === "inapp" && !n.readAt;
            return (
              <li
                key={n.id}
                className={`rounded-xl border bg-white p-4 ${
                  unread ? "border-brand-200 bg-brand-50/40" : "border-stone-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                    <Bell aria-hidden className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    {d.href ? (
                      <Link href={d.href} className="text-base font-semibold text-stone-900 hover:text-brand-700">
                        {d.text}
                      </Link>
                    ) : (
                      <p className="text-base font-semibold text-stone-900">{d.text}</p>
                    )}
                    <p className="text-sm text-stone-500">{formatDateTime(n.createdAt)}</p>
                  </div>
                  {unread ? (
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-danger-600" aria-label="Unread" />
                  ) : null}
                  <span className="text-xs font-semibold uppercase text-stone-400">{n.channel}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {items.length > 0 && !hasUnread ? (
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-stone-400">
          <BellOff aria-hidden className="h-4 w-4" /> All caught up
        </p>
      ) : null}
    </div>
  );
}
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { listThreadsForUser } from "@/server/messaging";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireUser();
  const threads = await listThreadsForUser(user);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold">Messages</h1>

      {threads.length === 0 ? (
        <EmptyState
          title="No messages yet"
          description="Message a seller from any product to start a conversation."
          icon={<MessageCircle aria-hidden className="h-12 w-12" />}
          action={<LinkButton href="/browse">Browse products</LinkButton>}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                href={`/messages/${t.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 hover:border-brand-300"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-lg font-semibold">{t.counterpartName}</p>
                    {t.unreadCount > 0 ? (
                      <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-accent-500 px-1.5 text-sm font-bold text-white">
                        {t.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-base text-stone-500">
                    {t.productName ? `${t.productName} · ` : ""}
                    {t.lastMessage || "No messages yet"}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-stone-400">{formatDateTime(t.lastMessageAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
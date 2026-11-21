import Link from "next/link";
import { notFound } from "next/navigation";
import { Send, ArrowLeft, Languages } from "lucide-react";
import { Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { getThreadDetail, markThreadRead } from "@/server/messaging";
import { replyAction, translateMessageAction } from "@/server/actions/shop";
import { isTranslationEnabled } from "@/lib/translate";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conversation" };

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const data = await getThreadDetail(id, user);
  if (!data) notFound();

  await markThreadRead(id, user.id);
  const { thread, business, buyerName, productName, messages } = data;
  const counterpart = user.role === "buyer" ? business.name : buyerName;
  const { error } = await searchParams;
  const canTranslate = isTranslationEnabled();

  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 py-6">
      <Link href="/messages" className="mb-3 inline-flex items-center gap-1 text-base font-semibold text-brand-700 hover:underline">
        <ArrowLeft aria-hidden className="h-4 w-4" /> All messages
      </Link>

      <div className="rounded-t-2xl border border-b-0 border-stone-200 bg-white p-4">
        <h1 className="text-xl font-bold">{counterpart}</h1>
        <p className="text-base text-stone-500">
          {productName ? `About: ${productName}` : thread.subject}
          {" · "}
          <Link href={`/store/${business.slug}`} className="font-semibold text-brand-700 hover:underline">
            Visit shop
          </Link>
        </p>
      </div>

      <div className="flex min-h-[320px] flex-col gap-3 border-x border-stone-200 bg-stone-50 p-4">
        <Alert type="error" message={error} />
        {messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div key={m.id} className={mine ? "self-end" : "self-start"}>
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2 text-lg ${
                  mine ? "bg-brand-600 text-white" : "bg-white text-stone-800 border border-stone-200"
                }`}
              >
                {m.body}
              </div>
              {m.bodyTranslated ? (
                <div
                  className={`mt-1 max-w-[85%] rounded-xl border border-dashed border-brand-300 bg-brand-50 px-3 py-2 text-base text-brand-900 ${
                    mine ? "ms-auto" : ""
                  }`}
                >
                  <span className="mb-0.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-brand-600">
                    <Languages aria-hidden className="h-3.5 w-3.5" /> Translated
                  </span>
                  {m.bodyTranslated}
                </div>
              ) : canTranslate && !mine ? (
                <form action={translateMessageAction} className={mine ? "text-right" : ""}>
                  <input type="hidden" name="threadId" value={thread.id} />
                  <input type="hidden" name="messageId" value={m.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    pendingText="Translating…"
                    className="mt-1 h-auto min-h-0 gap-1 px-1 py-0 text-xs text-brand-700 hover:bg-transparent hover:underline"
                  >
                    <Languages aria-hidden className="h-3.5 w-3.5" /> Translate
                  </Button>
                </form>
              ) : null}
              <p className={`mt-1 text-xs text-stone-400 ${mine ? "text-right" : ""}`}>
                {formatDateTime(m.createdAt)}
              </p>
            </div>
          );
        })}
      </div>

      <form action={replyAction} className="flex flex-col gap-2 rounded-b-2xl border border-t-0 border-stone-200 bg-white p-3">
        <input type="hidden" name="threadId" value={thread.id} />
        <label htmlFor="reply" className="sr-only">
          Your message
        </label>
        <Textarea
          id="reply"
          name="body"
          required
          placeholder="Type your message…"
          className="min-h-[90px]"
        />
        <Button type="submit" className="self-end" pendingText="Sending…">
          <Send aria-hidden className="h-5 w-5" /> Send
        </Button>
      </form>
    </div>
  );
}
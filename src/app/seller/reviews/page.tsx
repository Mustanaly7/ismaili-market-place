import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Stars } from "@/components/ui/Stars";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { getBusinessByOwner, listBusinessReviews } from "@/server/seller";
import { replyToReviewAction } from "@/server/actions/seller";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews" };

export default async function SellerReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireUser();
  const business = await getBusinessByOwner(user.id);
  if (!business) redirect("/seller/onboarding");

  const { ok, error } = await searchParams;
  const reviews = await listBusinessReviews(business.id);
  const avg =
    reviews.length > 0 ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Buyer reviews</h1>
      <div className="mt-2 flex items-center gap-3">
        <Stars rating={avg} count={reviews.length} />
        <span className="text-lg text-stone-600">
          {reviews.length} review{reviews.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      {reviews.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 text-lg text-stone-600">
          No reviews yet. Reviews appear after buyers complete an order.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      aria-hidden
                      className={`h-5 w-5 ${i < r.rating ? "fill-accent-400 text-accent-400" : "text-stone-300"}`}
                    />
                  ))}
                </span>
                <span className="text-sm text-stone-400">
                  {r.buyerName} · {formatDate(r.createdAt)}
                </span>
              </div>
              {r.comment ? <p className="mt-2 text-lg text-stone-700">{r.comment}</p> : null}

              {r.sellerReply ? (
                <div className="mt-3 rounded-xl border-s-4 border-brand-400 bg-brand-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Your reply</p>
                  <p className="mt-1 text-base text-brand-900">{r.sellerReply}</p>
                </div>
              ) : (
                <form action={replyToReviewAction} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="reviewId" value={r.id} />
                  <Textarea name="reply" required placeholder="Thank the buyer or reply publicly…" className="min-h-[80px]" />
                  <Button type="submit" variant="outline" className="self-start">
                    Post reply
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
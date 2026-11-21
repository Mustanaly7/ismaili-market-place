import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Field";
import { formatDate, formatMoney } from "@/lib/utils";
import { listBannedKeywords, listPendingBusinesses, listPendingProducts } from "@/server/admin";
import {
  addBannedKeywordAction,
  approveBusinessAction,
  approveProductAction,
  rejectBusinessAction,
  rejectProductAction,
  removeBannedKeywordAction,
} from "@/server/actions/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Moderation" };

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const [products, businesses] = await Promise.all([listPendingProducts(), listPendingBusinesses()]);
  const banned = await listBannedKeywords();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Moderation</h1>
      <p className="text-lg text-stone-600">Approve or reject new products and shops.</p>
      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-2xl font-bold">Products waiting ({products.length})</h2>
        {products.length === 0 ? (
          <EmptyState title="No products to review" description="New products that need approval will show up here." />
        ) : (
          <ul className="flex flex-col gap-3">
            {products.map(({ product, businessName }) => (
              <li key={product.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-bold">{product.name}</p>
                    <p className="text-base text-stone-500">
                      {businessName} · {formatMoney(product.priceCents)} · {product.quantity} in stock ·{" "}
                      {formatDate(product.createdAt)}
                    </p>
                    {product.description ? (
                      <p className="mt-1 line-clamp-2 max-w-xl text-base text-stone-600">{product.description}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <form action={approveProductAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <Button type="submit" size="sm">
                        Approve
                      </Button>
                    </form>
                    <form action={rejectProductAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <Button type="submit" size="sm" variant="danger">
                        Reject
                      </Button>
                    </form>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-2xl font-bold">Shops waiting ({businesses.length})</h2>
        {businesses.length === 0 ? (
          <EmptyState title="No shops to review" description="New shop applications will show up here." />
        ) : (
          <ul className="flex flex-col gap-3">
            {businesses.map((b) => (
              <li key={b.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-bold">{b.name}</p>
                    <p className="text-base text-stone-500">
                      {b.category} · {b.location || "No location"} · applied {formatDate(b.createdAt)}
                    </p>
                    <Badge tone="warning">{b.status}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <form action={approveBusinessAction}>
                      <input type="hidden" name="businessId" value={b.id} />
                      <Button type="submit" size="sm">
                        Approve
                      </Button>
                    </form>
                    <form action={rejectBusinessAction}>
                      <input type="hidden" name="businessId" value={b.id} />
                      <Button type="submit" size="sm" variant="danger">
                        Reject
                      </Button>
                    </form>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-2xl font-bold">Blocked words &amp; phrases</h2>
        <p className="mb-3 text-base text-stone-600">
          Listings containing these terms are blocked or flagged automatically.
        </p>
        <form action={addBannedKeywordAction} className="flex flex-wrap items-end gap-2 rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex-1">
            <Input name="term" placeholder="e.g. replica, ivory" aria-label="Banned term" required />
          </div>
          <Select name="action" defaultValue="flag" aria-label="Action" className="w-40">
            <option value="flag">Flag for review</option>
            <option value="block">Block outright</option>
          </Select>
          <Button type="submit">Add</Button>
        </form>
        {banned.length === 0 ? (
          <p className="mt-3 text-base text-stone-500">No blocked words yet.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {banned.map((k) => (
              <li key={k.id} className="flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1 ps-3 pe-1">
                <span className="text-base font-semibold">{k.term}</span>
                <Badge tone={k.action === "block" ? "danger" : "warning"}>{k.action}</Badge>
                <form action={removeBannedKeywordAction}>
                  <input type="hidden" name="id" value={k.id} />
                  <button
                    type="submit"
                    aria-label={`Remove ${k.term}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
                  >
                    ×
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { formatDate } from "@/lib/utils";
import { listCampaigns, listMentorshipGuides } from "@/server/admin";
import {
  createCampaignAction,
  createGuideAction,
  setCampaignStatusAction,
} from "@/server/actions/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campaigns & guides" };

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const [campaigns, guides] = await Promise.all([listCampaigns(), listMentorshipGuides()]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Campaigns &amp; guides</h1>
      <p className="mt-1 text-lg text-stone-600">Announcements and mentorship videos for the community.</p>
      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      <form action={createCampaignAction} className="mt-6 flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-xl font-bold">New campaign</h2>
        <Field label="Title" htmlFor="title" required>
          <Input id="title" name="title" required placeholder="Ramadan Bazaar is live" />
        </Field>
        <Field label="Message" htmlFor="body">
          <Textarea id="body" name="body" placeholder="What do you want to announce?" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Audience" htmlFor="audience">
            <Select id="audience" name="audience" defaultValue="all">
              <option value="all">Everyone</option>
              <option value="buyers">Buyers</option>
              <option value="sellers">Sellers</option>
            </Select>
          </Field>
          <Field label="Status" htmlFor="status">
            <Select id="status" name="status" defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
            </Select>
          </Field>
        </div>
        <Button type="submit" className="self-start">
          Create campaign
        </Button>
      </form>

      <section className="mt-8">
        <h2 className="text-2xl font-bold">Campaigns ({campaigns.length})</h2>
        {campaigns.length === 0 ? (
          <p className="mt-2 text-base text-stone-500">No campaigns yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {campaigns.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
                <span className="min-w-0">
                  <span className="block text-lg font-semibold">{c.title}</span>
                  <span className="block text-sm text-stone-500">
                    {c.audience} · {formatDate(c.createdAt)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Badge tone={c.status === "active" ? "success" : "neutral"}>{c.status}</Badge>
                  {c.status !== "active" ? (
                    <form action={setCampaignStatusAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="status" value="active" />
                      <Button type="submit" size="sm" variant="subtle">
                        Activate
                      </Button>
                    </form>
                  ) : (
                    <form action={setCampaignStatusAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="status" value="ended" />
                      <Button type="submit" size="sm" variant="subtle">
                        End
                      </Button>
                    </form>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={createGuideAction} className="mt-10 flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-xl font-bold">New mentorship guide</h2>
        <Field label="Title" htmlFor="gtitle" required>
          <Input id="gtitle" name="title" required placeholder="How to price your handmade goods" />
        </Field>
        <Field label="Summary" htmlFor="gsummary">
          <Textarea id="gsummary" name="summary" placeholder="What will sellers learn?" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Video URL (optional)" htmlFor="videoUrl">
            <Input id="videoUrl" name="videoUrl" placeholder="https://youtube.com/…" />
          </Field>
          <Field label="Category" htmlFor="gcategory">
            <Input id="gcategory" name="category" placeholder="Pricing" />
          </Field>
        </div>
        <Button type="submit" className="self-start">
          Add guide
        </Button>
      </form>

      <section className="mt-8">
        <h2 className="text-2xl font-bold">Guides ({guides.length})</h2>
        {guides.length === 0 ? (
          <p className="mt-2 text-base text-stone-500">No guides yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {guides.map((g) => (
              <li key={g.id} className="rounded-xl border border-stone-200 bg-white p-4">
                <span className="block text-lg font-semibold">{g.title}</span>
                <span className="block text-sm text-stone-500">
                  {g.category || "General"}
                  {g.videoUrl ? " · has video" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
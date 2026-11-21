import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { listCollections } from "@/server/admin";
import {
  createCollectionAction,
  deleteCollectionAction,
  toggleCollectionAction,
} from "@/server/actions/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Collections" };

const KINDS = [
  { value: "women", label: "Women Entrepreneurs" },
  { value: "youth", label: "Youth Startups" },
  { value: "heritage", label: "Handmade Heritage" },
  { value: "farmers", label: "Local Farmers" },
  { value: "custom", label: "Custom" },
];

export default async function AdminCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const collections = await listCollections();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Featured collections</h1>
      <p className="mt-1 text-lg text-stone-600">
        Curate the community showcases shown on the home page.
      </p>
      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      <form action={createCollectionAction} className="mt-6 flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-xl font-bold">Add a collection</h2>
        <Field label="Title" htmlFor="title" required>
          <Input id="title" name="title" required placeholder="Women Entrepreneurs" />
        </Field>
        <Field label="Description" htmlFor="description">
          <Textarea id="description" name="description" placeholder="A short line about this collection" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Type" htmlFor="kind">
            <Select id="kind" name="kind" defaultValue="custom">
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Image URL (optional)" htmlFor="imageUrl">
            <Input id="imageUrl" name="imageUrl" placeholder="https://…" />
          </Field>
        </div>
        <Button type="submit" className="self-start">
          Create collection
        </Button>
      </form>

      <section className="mt-8">
        <h2 className="text-2xl font-bold">All collections ({collections.length})</h2>
        {collections.length === 0 ? (
          <p className="mt-2 text-base text-stone-500">No collections yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {collections.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
                <span>
                  <span className="block text-lg font-semibold">{c.title}</span>
                  <span className="block text-sm text-stone-500">/{c.slug} · {c.kind}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Badge tone={c.active ? "success" : "neutral"}>{c.active ? "Active" : "Hidden"}</Badge>
                  <form action={toggleCollectionAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="active" value={c.active ? "false" : "true"} />
                    <Button type="submit" size="sm" variant="subtle">
                      {c.active ? "Hide" : "Show"}
                    </Button>
                  </form>
                  <form action={deleteCollectionAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <Button type="submit" size="sm" variant="danger">
                      Delete
                    </Button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
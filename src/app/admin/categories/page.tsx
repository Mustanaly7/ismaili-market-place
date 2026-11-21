import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { listCategories } from "@/server/catalog";
import { getPlatformSettings } from "@/server/admin";
import { createCategoryAction, deleteCategoryAction, updateSettingsAction } from "@/server/actions/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories & fees" };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const [categories, settings] = await Promise.all([listCategories(), getPlatformSettings()]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Categories &amp; fees</h1>
      <p className="text-lg text-stone-600">Manage the shop categories and marketplace-wide settings.</p>
      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-bold">Add a category</h2>
          <form action={createCategoryAction} className="mt-3 flex flex-col gap-4">
            <Field label="Category name" htmlFor="cat-name" required>
              <Input id="cat-name" name="name" required placeholder="e.g. Fresh Produce" />
            </Field>
            <Field label="Parent category (optional)" htmlFor="cat-parent">
              <Select id="cat-parent" name="parentId" defaultValue="">
                <option value="">None — top level</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit">Add category</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold">Platform settings</h2>
          <form action={updateSettingsAction} className="mt-3 flex flex-col gap-4">
            <Field label="Commission (%)" htmlFor="commission" required hint="Your cut of each sale, e.g. 5">
              <Input
                id="commission"
                name="commissionPct"
                type="number"
                step="0.01"
                min={0}
                max={50}
                required
                defaultValue={(settings.commissionBps / 100).toFixed(2)}
              />
            </Field>
            <Field label="Currency code" htmlFor="currency" required>
              <Select id="currency" name="currency" defaultValue={settings.currency}>
                <option value="USD">USD — US Dollar</option>
                <option value="PKR">PKR — Pakistani Rupee</option>
                <option value="INR">INR — Indian Rupee</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="EUR">EUR — Euro</option>
                <option value="AED">AED — UAE Dirham</option>
              </Select>
            </Field>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-stone-300 p-4">
              <input
                type="checkbox"
                name="autoApprove"
                defaultChecked={settings.autoApprove}
                className="mt-1 h-5 w-5"
              />
              <span>
                <span className="block text-lg font-semibold text-stone-900">Auto-approve new listings</span>
                <span className="block text-base text-stone-600">
                  When on, new products and shops go live immediately. When off, you review them first.
                </span>
              </span>
            </label>
            <Button type="submit">Save settings</Button>
          </form>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-2xl font-bold">All categories ({categories.length})</h2>
        {categories.length === 0 ? (
          <p className="rounded-2xl border border-stone-200 bg-white p-5 text-lg text-stone-600">
            No categories yet. Add your first one above.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {categories.map((c) => {
              const parent = categories.find((p) => p.id === c.parentId);
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-3"
                >
                  <span>
                    <span className="block text-base font-semibold text-stone-900">{c.name}</span>
                    <span className="block text-sm text-stone-500">
                      /{c.slug}
                      {parent ? ` · under ${parent.name}` : ""}
                    </span>
                  </span>
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="categoryId" value={c.id} />
                    <Button type="submit" size="sm" variant="danger">
                      Delete
                    </Button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
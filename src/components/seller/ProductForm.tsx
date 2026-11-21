import { Button, LinkButton } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { ImageUploader } from "@/components/forms/ImageUploader";

export interface ProductFormDefaults {
  id?: string;
  name?: string;
  priceInput?: string;
  quantity?: number;
  description?: string;
  category?: string;
  allowBackorder?: boolean;
  images?: string[];
}

export function ProductForm({
  action,
  categories,
  defaults = {},
  submitLabel = "Save product",
  cancelHref = "/seller/products",
}: {
  action: (formData: FormData) => void | Promise<void>;
  categories: string[];
  defaults?: ProductFormDefaults;
  submitLabel?: string;
  cancelHref?: string;
}) {
  return (
    <form action={action} className="flex max-w-2xl flex-col gap-5">
      {defaults.id ? <input type="hidden" name="productId" value={defaults.id} /> : null}

      <Field label="What is this product called?" htmlFor="name" required>
        <Input id="name" name="name" required defaultValue={defaults.name} placeholder="e.g. Fresh sourdough loaf" />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Price" htmlFor="price" required hint="Enter in your local currency, e.g. 12.50">
          <Input
            id="price"
            name="price"
            inputMode="decimal"
            required
            defaultValue={defaults.priceInput}
            placeholder="0.00"
          />
        </Field>
        <Field label="How many do you have?" htmlFor="quantity" required>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            inputMode="numeric"
            min={0}
            required
            defaultValue={defaults.quantity ?? 0}
          />
        </Field>
      </div>

      <Field label="Category" htmlFor="category">
        <Select id="category" name="category" defaultValue={defaults.category ?? ""}>
          <option value="">Use my shop&apos;s category</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Description (optional)" htmlFor="description" hint="What is it? Size, colour, condition — anything helpful.">
        <Textarea id="description" name="description" defaultValue={defaults.description} />
      </Field>

      <div>
        <p className="mb-2 text-lg font-semibold text-stone-800">Photos</p>
        <p className="mb-2 text-base text-stone-500">Add up to 8 photos. The first one is shown first.</p>
        <ImageUploader name="images" multiple max={8} initial={defaults.images ?? []} buttonLabel="Add photo" />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-stone-300 p-4">
        <input
          type="checkbox"
          name="allowBackorder"
          defaultChecked={defaults.allowBackorder}
          className="mt-1 h-5 w-5"
        />
        <span>
          <span className="block text-lg font-semibold text-stone-900">Keep taking orders when sold out</span>
          <span className="block text-base text-stone-600">
            Buyers can order and you make more. Leave unticked if you only sell what you have.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit">{submitLabel}</Button>
        <LinkButton href={cancelHref} variant="ghost">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
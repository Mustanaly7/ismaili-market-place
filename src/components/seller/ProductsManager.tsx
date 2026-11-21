"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Copy, Pencil, Trash2, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatMoney } from "@/lib/utils";
import type { SellerProductRow } from "@/server/seller";
import { bulkProductAction, deleteProductAction, duplicateProductAction } from "@/server/actions/seller";

const statusTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  pending: "warning",
  sold_out: "danger",
  archived: "neutral",
};

const statusLabel: Record<string, string> = {
  active: "Live",
  pending: "Waiting for approval",
  sold_out: "Sold out",
  archived: "Hidden",
};

export function ProductsManager({ products }: { products: SellerProductRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allSelected = products.length > 0 && selected.size === products.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)));
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        id="bulk-form"
        action={bulkProductAction}
        className="sticky top-28 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-sm"
      >
        <label className="flex items-center gap-2 text-lg font-semibold">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-5 w-5"
            aria-label="Select all products"
          />
          Select all
        </label>
        <span className="text-base text-stone-500">{selected.size} selected</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            type="submit"
            name="action"
            value="out_of_stock"
            variant="subtle"
            size="sm"
            disabled={selected.size === 0}
          >
            <EyeOff aria-hidden className="h-4 w-4" />
            Mark sold out
          </Button>
          <Button
            type="submit"
            name="action"
            value="delete"
            variant="danger"
            size="sm"
            disabled={selected.size === 0}
            onClick={(e) => {
              if (!confirm(`Delete ${selected.size} product(s)? This cannot be undone.`)) {
                e.preventDefault();
              }
            }}
          >
            <Trash2 aria-hidden className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </form>

      <ul className="flex flex-col gap-3">
        {products.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4"
          >
            <input
              type="checkbox"
              form="bulk-form"
              name="ids"
              value={p.id}
              checked={selected.has(p.id)}
              onChange={() => toggle(p.id)}
              className="h-5 w-5"
              aria-label={`Select ${p.name}`}
            />
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
              {p.image ? (
                <Image src={p.image} alt="" fill sizes="64px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-stone-400">No photo</div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold">{p.name}</p>
              <p className="text-base text-stone-500">
                {formatMoney(p.priceCents)} · {p.quantity} in stock · added {formatDate(p.createdAt)}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge tone={statusTone[p.status] ?? "neutral"}>{statusLabel[p.status] ?? p.status}</Badge>
                <span className="text-sm text-stone-500">
                  {p.viewCount} views · {p.soldCount} sold
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/seller/products/${p.id}/edit`}
                className="inline-flex min-h-touch items-center gap-1 rounded-xl border-2 border-stone-300 px-3 text-base font-semibold text-stone-700 hover:bg-stone-100"
              >
                <Pencil aria-hidden className="h-4 w-4" />
                Edit
              </Link>
              <form action={duplicateProductAction}>
                <input type="hidden" name="productId" value={p.id} />
                <Button type="submit" variant="outline" size="sm" pendingText="Copying…">
                  <Copy aria-hidden className="h-4 w-4" />
                  Copy
                </Button>
              </form>
              <form action={deleteProductAction}>
                <input type="hidden" name="productId" value={p.id} />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="border-danger-300 text-danger-700 hover:border-danger-400 hover:bg-danger-50 hover:text-danger-700"
                  onClick={(e) => {
                    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) e.preventDefault();
                  }}
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                  Delete
                </Button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
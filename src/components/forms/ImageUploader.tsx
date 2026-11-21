"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";

/**
 * Uploads images to /api/upload and stores the resulting URLs in hidden inputs
 * so they submit with the surrounding (server action) form.
 */
export function ImageUploader({
  name,
  multiple = false,
  max = 8,
  initial = [],
  buttonLabel = "Add photo",
}: {
  name: string;
  multiple?: boolean;
  max?: number;
  initial?: string[];
  buttonLabel?: string;
}) {
  const [urls, setUrls] = useState<string[]>(initial.filter(Boolean).slice(0, multiple ? max : 1));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const room = multiple ? max - urls.length : 1;
      const chosen = files.slice(0, Math.max(0, room));
      const uploaded: string[] = [];
      for (const file of chosen) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Upload failed");
        }
        const data = (await res.json()) as { url: string };
        uploaded.push(data.url);
      }
      setUrls((prev) => (multiple ? [...prev, ...uploaded].slice(0, max) : uploaded.slice(0, 1)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(url: string) {
    setUrls((prev) => prev.filter((u) => u !== url));
  }

  const canAdd = multiple ? urls.length < max : urls.length < 1;

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {urls.map((url) => (
          <div key={url} className="relative h-24 w-24 overflow-hidden rounded-xl border border-stone-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Upload preview" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(url)}
              aria-label="Remove photo"
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-stone-900/70 text-white hover:bg-stone-900"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </div>
        ))}

        {canAdd ? (
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stone-300 text-stone-500 hover:border-brand-400 hover:bg-brand-50">
            {uploading ? (
              <Loader2 aria-hidden className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Camera aria-hidden className="h-6 w-6" />
                <span className="text-xs font-semibold">{buttonLabel}</span>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple={multiple}
              onChange={onFiles}
              className="sr-only"
              disabled={uploading}
            />
          </label>
        ) : null}
      </div>

      {urls.map((url) => (
        <input key={url} type="hidden" name={name} value={url} />
      ))}

      {error ? <p className="mt-2 text-base font-medium text-danger-600">{error}</p> : null}
    </div>
  );
}
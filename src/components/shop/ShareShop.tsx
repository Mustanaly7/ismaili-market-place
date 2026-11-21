"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";

export function ShareShop({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);

  function shareUrl() {
    return typeof window !== "undefined" ? window.location.href : "";
  }

  const waHref = () => {
    const url = shareUrl();
    const text = `Check out ${name} on ISMAILI Market Place: ${url}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={waHref()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-touch items-center gap-2 rounded-xl bg-[#25D366] px-4 text-base font-bold text-white hover:brightness-95"
      >
        <Share2 aria-hidden className="h-5 w-5" /> Share on WhatsApp
      </a>
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-touch items-center gap-2 rounded-xl border-2 border-stone-300 bg-white px-4 text-base font-semibold text-stone-700 hover:border-brand-400"
      >
        {copied ? <Check aria-hidden className="h-5 w-5 text-brand-600" /> : <Link2 aria-hidden className="h-5 w-5" />}
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
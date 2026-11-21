import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
        <WifiOff aria-hidden className="h-8 w-8" />
      </span>
      <h1 className="mt-4 text-3xl font-extrabold">You are offline</h1>
      <p className="mt-2 text-lg text-stone-600">
        Check your internet connection. Pages you visited before may still open.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-touch items-center rounded-xl bg-brand-600 px-6 text-lg font-bold text-white hover:bg-brand-700"
      >
        Try again
      </Link>
    </div>
  );
}
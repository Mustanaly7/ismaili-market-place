import { LinkButton } from "@/components/ui/Button";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center">
      <p className="text-7xl font-black text-brand-600">404</p>
      <h1 className="mt-4 text-3xl font-extrabold">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-xl text-stone-600">
        The page may have moved, or the link may be wrong. Let&apos;s get you back on track.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href="/" size="lg">
          Go to the home page
        </LinkButton>
        <LinkButton href="/browse" variant="outline" size="lg">
          Browse products
        </LinkButton>
      </div>
    </div>
  );
}
import { GraduationCap, PlayCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { listActiveGuides } from "@/server/community";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mentorship guides" };

export default async function GuidesPage() {
  const guides = await listActiveGuides();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="max-w-2xl">
        <p className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-sm font-semibold text-accent-700 ring-1 ring-accent-200">
          <GraduationCap aria-hidden className="h-4 w-4" /> Learn and grow
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-stone-900">
          Mentorship guides
        </h1>
        <p className="mt-3 text-lg text-stone-600">
          Short, practical guides and videos to help you start and grow your business — written for
          our community, by our community.
        </p>
      </header>

      {guides.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Guides coming soon"
            description="We are preparing helpful guides for sellers. Please check back shortly."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {guides.map((g) => (
            <article
              key={g.id}
              className="flex flex-col rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card"
            >
              <div className="flex items-center gap-2">
                {g.category ? <Badge tone="brand">{g.category}</Badge> : null}
                {g.videoUrl ? (
                  <Badge tone="accent">
                    <PlayCircle aria-hidden className="h-3.5 w-3.5" /> Video
                  </Badge>
                ) : null}
              </div>
              <h2 className="mt-3 text-xl font-bold leading-snug text-stone-900">{g.title}</h2>
              {g.summary ? (
                <p className="mt-2 flex-1 text-base text-stone-600">{g.summary}</p>
              ) : <div className="flex-1" />}
              {g.videoUrl ? (
                <a
                  href={g.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 font-semibold text-brand-700 hover:underline"
                >
                  <PlayCircle aria-hidden className="h-5 w-5" /> Watch the video
                </a>
              ) : (
                <span className="mt-4 inline-flex items-center gap-2 text-sm text-stone-400">
                  <Sparkles aria-hidden className="h-4 w-4" /> Quick read
                </span>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
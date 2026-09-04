import Link from "next/link";
import { normalizeTopicSlug, relatedStories, seriesNeighbors, type PublicationStory } from "@/lib/publication";
import { PublicationCard } from "./PublicationCard";
import journal from "./journal.module.css";

export function ArticleDiscovery({ current, stories }: { current: PublicationStory; stories: PublicationStory[] }) {
  const related = relatedStories(current, stories, 3);
  const series = seriesNeighbors(current, stories);
  const seriesHref = current.series === "GaitAI Foundations"
    ? "/insights/start-here"
    : current.series
      ? `/insights/series/${normalizeTopicSlug(current.series)}`
      : undefined;

  return (
    <section className={`${journal.journal} border-t border-white/[0.07] bg-obsidian-300/25 py-16 sm:py-20`}>
      <div className="container-wide">
        {current.series && series.ordered.length > 0 && (
          <div className="mb-16 border-b border-white/10 pb-10">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300">{current.series}</p>
                <p className="mt-3 font-display text-2xl text-soft-white">{current.seriesOrder} of {series.ordered.length}</p>
              </div>
              {seriesHref && <Link href={seriesHref} className="text-sm text-cyan-300 hover:text-soft-white">View reading path →</Link>}
            </div>
            <nav aria-label={`${current.series} series navigation`} className="mt-7 grid gap-3 sm:grid-cols-2">
              <span>
                {series.previous && <Link href={series.previous.href} className="group block rounded-xl border border-white/10 p-4 text-sm text-soft-gray hover:border-white/20 hover:text-soft-white"><span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-soft-mute">← Previous</span><span className="mt-2 block">{series.previous.title}</span></Link>}
              </span>
              <span>
                {series.next && <Link href={series.next.href} className="group block rounded-xl border border-white/10 p-4 text-right text-sm text-soft-gray hover:border-white/20 hover:text-soft-white"><span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-soft-mute">Next →</span><span className="mt-2 block">{series.next.title}</span></Link>}
              </span>
            </nav>
          </div>
        )}

        {related.length > 0 && (
          <div>
            <div className="flex items-baseline justify-between gap-5 border-b border-white/10 pb-4">
              <h2 className="font-display text-2xl text-soft-white">Related stories</h2>
              <Link href="/insights" className="font-mono text-[9px] uppercase tracking-[0.16em] text-soft-mute hover:text-cyan-300">All stories →</Link>
            </div>
            <div className={`${journal.indexGrid} mt-7`}>
              {related.map((story) => <PublicationCard key={story.id} story={story} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


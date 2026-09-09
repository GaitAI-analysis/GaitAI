import Link from "next/link";
import { TrackedLink } from "./experience/TrackedLink";
import {
  relatedStories,
  seriesNeighbors,
  topicLabel,
  type PublicationStory,
} from "@/lib/publication";
import { seriesHref as seriesHrefFor } from "@/data/insight-series";
import journal from "./journal.module.css";

/**
 * CONTINUE EXPLORING — the quiet tail of an article.
 *
 * The strong recommendation is made higher up by the Foundations bridge, so
 * this section does not repeat it as a card. It offers two things, set as
 * type on the page rather than as a row of identical cards:
 *
 *   · where this story sits in its reading path, with the previous and next
 *     titles as plain links
 *   · two or three related stories as rows — title, one line, an arrow —
 *     excluding the next Foundation, which the bridge already offers
 */
export function ArticleDiscovery({ current, stories }: { current: PublicationStory; stories: PublicationStory[] }) {
  const series = seriesNeighbors(current, stories);
  const related = relatedStories(current, stories, 4)
    .filter((story) => story.id !== series.next?.id)
    .slice(0, 3);
  const seriesHref = current.series ? seriesHrefFor(current.series) : undefined;

  return (
    <section className={`${journal.journal} border-t border-white/[0.07] py-14 sm:py-16`}>
      <div className="container-wide">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          {current.series && series.ordered.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300">
                {current.series} · {current.seriesOrder} of {series.ordered.length}
              </p>
              <nav aria-label={`${current.series} series navigation`} className="mt-5 grid gap-3">
                {series.previous && (
                  <TrackedLink href={series.previous.href} event="next_story_clicked" props={{ article_slug: current.slug, to_slug: series.previous.slug, via: "series" }} className="group flex items-baseline gap-3 text-[0.9375rem] text-soft-gray transition-colors hover:text-soft-white">
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-soft-mute">← Previous</span>
                    <span className="underline decoration-white/15 underline-offset-4 group-hover:decoration-cyan-300">{series.previous.title}</span>
                  </TrackedLink>
                )}
                {series.next && (
                  <TrackedLink href={series.next.href} event="next_story_clicked" props={{ article_slug: current.slug, to_slug: series.next.slug, via: "series" }} className="group flex items-baseline gap-3 text-[0.9375rem] text-soft-gray transition-colors hover:text-soft-white">
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-soft-mute">Next →</span>
                    <span className="underline decoration-white/15 underline-offset-4 group-hover:decoration-cyan-300">{series.next.title}</span>
                  </TrackedLink>
                )}
              </nav>
              {seriesHref && (
                <Link href={seriesHref} className="group mt-5 inline-flex min-h-[40px] items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300 transition-colors hover:text-soft-white focus-visible:text-soft-white">
                  View the reading path{" "}
                  <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1">→</span>
                </Link>
              )}
            </div>
          )}

          {related.length > 0 && (
            <div>
              <h2 className="font-display text-xl text-soft-white sm:text-2xl">Continue exploring</h2>
              <ol className="mt-4">
                {related.map((story) => (
                  <li key={story.id} className="border-t border-white/[0.07] last:border-b">
                    <TrackedLink href={story.href} event="next_story_clicked" props={{ article_slug: current.slug, to_slug: story.slug, via: "related" }} className="group flex items-start gap-4 py-4 transition-colors">
                      <span className="mt-1 w-7 shrink-0 font-mono text-[9.5px] tracking-[0.14em] text-violet-300">
                        {typeof story.seriesOrder === "number" ? String(story.seriesOrder).padStart(2, "0") : ""}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[1rem] font-medium leading-snug text-soft-white transition-colors group-hover:text-cyan-300">
                          {story.title}
                        </span>
                        <span className="mt-1 block text-[0.8125rem] leading-relaxed text-soft-mute">
                          {story.topics[0] ? topicLabel(story.topics[0]) : story.type}
                          {" · "}
                          {story.description.length > 110 ? `${story.description.slice(0, 110).trim()}…` : story.description}
                        </span>
                      </span>
                      <span aria-hidden="true" className="mt-1 text-soft-mute transition-transform group-hover:translate-x-1 group-hover:text-cyan-300">→</span>
                    </TrackedLink>
                  </li>
                ))}
              </ol>
              <Link href="/insights" className="group mt-5 inline-flex min-h-[40px] items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-soft-mute transition-colors hover:text-cyan-300 focus-visible:text-cyan-300">
                All stories{" "}
                <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1">→</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

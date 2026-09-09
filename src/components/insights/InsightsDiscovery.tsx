import Link from "next/link";
import { publicationTopics, type PublicationStory } from "@/lib/publication";
import { SubscribeForm } from "@/components/subscribe/SubscribeForm";

/**
 * The lower half of /insights (and of every paginated feed page): what a
 * reader does once the feed has run out.
 *
 * TWO MOVES, SET ON THE PAGE GROUND RATHER THAN IN BOXES.
 *
 *   1. Browse Insights — the topics as one line of links with their counts,
 *      and the complete archive as a plain link beside them. The previous
 *      version drew a bordered topic matrix and a bordered archive panel here;
 *      on a page whose stories are already cards, two more boxes made the tail
 *      of the journal read as a settings screen.
 *   2. Stay close to the signal — the real subscription form, unchanged.
 *
 * The Foundations gateway that used to open this section now sits inside
 * the story composition above (see HubComposition), beside the last story,
 * where a first-time reader meets it in the flow of the page.
 *
 * NO RSS HERE, ON PURPOSE. The feed at /insights/rss.xml is announced in this
 * page's <head>; a visible link would send ordinary visitors to raw XML.
 */
export function InsightsDiscovery({ stories }: { stories: PublicationStory[] }) {
  const topics = publicationTopics(stories).slice(0, 6);
  return (
    <>
      <section className="py-16 sm:py-20">
        <div className="container-wide">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-soft-mute">Browse Insights</p>
              <h2 className="mt-3 font-display text-2xl text-soft-white">By subject</h2>
              <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
                {topics.map((topic) => (
                  <li key={topic.slug}>
                    <Link
                      href={`/insights/topic/${topic.slug}`}
                      className="group inline-flex min-h-[40px] items-baseline gap-2 text-[0.9375rem] text-soft-gray transition-colors hover:text-soft-white focus-visible:text-soft-white focus-visible:outline-none"
                    >
                      <span className="underline decoration-white/15 underline-offset-4 transition-colors group-hover:decoration-cyan-300">
                        {topic.label}
                      </span>
                      <span className="font-mono text-[10px] text-soft-mute">{topic.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-soft-mute">Everything published</p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-soft-gray">
                Every article, research note, product update and story, by year and month.
              </p>
              <Link
                href="/insights/archive"
                className="mt-4 inline-flex min-h-[40px] items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300 transition-colors hover:text-soft-white"
              >
                View the archive <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.07] py-14 sm:py-16">
        <div className="container-wide">
          <SubscribeForm variant="blog" />
        </div>
      </section>
    </>
  );
}

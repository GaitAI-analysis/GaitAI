import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { publicationTopics, type PublicationStory } from "@/lib/publication";
import { SubscribeForm } from "@/components/subscribe/SubscribeForm";

/**
 * The lower half of /insights (and of every paginated feed page): what a
 * reader does once the feed has run out.
 *
 * THREE MOVES, IN THE ORDER A NEW READER NEEDS THEM.
 *
 *   1. The Foundations gateway — one large editorial link, not a card. It is
 *      the site's answer to "where do I start?", so it gets the width of the
 *      page and appears here ONCE. It used to be repeated as a small card a
 *      few hundred pixels lower, which said the same thing twice and made the
 *      second saying look like filler.
 *   2. Browse the Blog — publication discovery, named for what it is rather
 *      than "explore more". Topics on the left, as whole clickable rows with
 *      their counts; the complete archive on the right as one clickable panel
 *      with enough copy to balance the topic matrix. Nothing decorative in
 *      either: no icons, no illustration.
 *   3. Stay close to the signal — the real subscription form, in its own
 *      section directly under discovery. The previous arrangement wrapped it
 *      in a second section AND gave the block its own rule, margin and
 *      padding, which stacked into ~240px of nothing between the two on a
 *      desktop. One section, one rule, one measure of padding.
 *
 * NO RSS HERE, ON PURPOSE. The feed at /insights/rss.xml is for readers and
 * crawlers and is announced in this page's <head> (rel="alternate", see
 * app/insights/page.tsx). A visible link would send ordinary visitors to raw
 * XML, so the visible UI does not carry one.
 *
 * The utilities used are the ones the rest of the journal uses (border-white,
 * text-soft-*, bg-obsidian-400), all of which the light theme remaps in
 * globals.css, and the hover systems are the shared ones in interactions.css
 * (`card-link`, `card-cue`, `--hit-*`) so both themes and reduced motion are
 * already handled.
 */
export function InsightsDiscovery({ stories }: { stories: PublicationStory[] }) {
  const topics = publicationTopics(stories).slice(0, 6);
  return (
    <>
      <section className="border-t border-white/[0.07] py-16 sm:py-20">
        <div className="container-wide">
          {/* ── 1 · The gateway ── */}
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-soft-mute">
            New to GaitAI?
          </p>
          {/* The whole surface is the link. On hover the rule beneath it
              lights (the theme-aware `--hit-line`), the headline brightens and
              the arrow steps toward its corner — the same three signals the
              site's rows give, and nothing that turns it into a box. */}
          <Link
            href="/insights/start-here"
            className="group mt-4 flex items-end justify-between gap-6 border-b border-white/10 pb-7 transition-colors hover:border-[var(--hit-line)] focus-visible:border-[var(--hit-line)] focus-visible:outline-none"
          >
            <span>
              <span className="block font-display text-2xl text-soft-white transition-colors group-hover:text-cyan-300 group-focus-visible:text-cyan-300 sm:text-4xl">
                Explore the GaitAI Foundations
              </span>
              <span className="mt-3 block max-w-2xl text-sm leading-relaxed text-soft-gray">
                A curated five-story path through movement intelligence, responsible AI, mobility and evidence.
              </span>
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="mb-1 h-5 w-5 shrink-0 text-cyan-300 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-focus-visible:-translate-y-1 group-focus-visible:translate-x-1"
            />
          </Link>

          {/* ── 2 · Browse the Blog ── */}
          <div className="mt-14">
            <h2 className="font-display text-2xl text-soft-white">Browse the Blog</h2>

            {/* Single column until lg, so a phone reads gateway → topics →
                archive → newsletter. On a desktop the archive panel stretches
                to the height of the topic block, which is what keeps the row
                from reading as one tall thing beside two short ones. */}
            <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-soft-mute">
                  Topics
                </p>
                <h3 className="mt-2 font-display text-lg text-soft-white">Browse by subject</h3>
                <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2">
                  {topics.map((topic) => (
                    <Link
                      key={topic.slug}
                      href={`/insights/topic/${topic.slug}`}
                      className="group flex items-center justify-between bg-obsidian-400/80 px-5 py-4 text-sm text-soft-gray transition-colors hover:bg-white/[0.04] hover:text-soft-white focus-visible:bg-white/[0.04] focus-visible:text-soft-white"
                    >
                      <span>{topic.label}</span>
                      <span className="font-mono text-[10px] text-soft-mute">{topic.count}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* The archive, as one clickable panel. `card-link` is the shared
                  whole-card behaviour: lift, border, tint, focus ring; the cue
                  and its arrow brighten and nudge with it. */}
              <Link
                href="/insights/archive"
                className="card-link flex flex-col justify-between gap-8 rounded-xl border border-white/10 p-6"
              >
                <span className="relative">
                  <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                    Complete archive
                  </span>
                  <span className="mt-3 block max-w-sm text-sm leading-relaxed text-soft-gray">
                    Browse every article, research note, product update and story published by GaitAI.
                  </span>
                </span>
                <span className="card-cue relative uppercase tracking-[0.16em] text-soft-white">
                  View archive
                  <ArrowUpRight aria-hidden="true" className="card-cue-arrow h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 · The newsletter ── one section, one rule, one padding. */}
      <section className="border-t border-white/[0.07] py-14 sm:py-16">
        <div className="container-wide">
          <SubscribeForm variant="blog" />
        </div>
      </section>
    </>
  );
}

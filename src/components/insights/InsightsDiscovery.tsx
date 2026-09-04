import Link from "next/link";
import { ArrowUpRight, Archive, Compass, Rss } from "lucide-react";
import { publicationTopics, type PublicationStory } from "@/lib/publication";
import { SubscribeForm } from "@/components/subscribe/SubscribeForm";

export function InsightsDiscovery({ stories }: { stories: PublicationStory[] }) {
  const topics = publicationTopics(stories).slice(0, 6);
  return (
    <>
      <section className="border-t border-white/[0.07] py-16 sm:py-20">
        <div className="container-wide">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-soft-mute">New to GaitAI?</p>
          <Link href="/insights/start-here" className="group mt-4 flex items-end justify-between gap-6 border-b border-white/10 pb-7">
            <span>
              <span className="block font-display text-2xl text-soft-white transition-colors group-hover:text-cyan-300 sm:text-4xl">Explore the GaitAI Foundations</span>
              <span className="mt-3 block max-w-2xl text-sm leading-relaxed text-soft-gray">A curated five-story path through movement intelligence, responsible AI, mobility and evidence.</span>
            </span>
            <ArrowUpRight className="mb-1 h-5 w-5 shrink-0 text-cyan-300 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>
          <div className="mt-14 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="font-display text-2xl text-soft-white">Explore more</h2>
              <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2">
                {topics.map((topic) => (
                  <Link key={topic.slug} href={`/insights/topic/${topic.slug}`} className="group flex items-center justify-between bg-obsidian-400/80 px-5 py-4 text-sm text-soft-gray transition-colors hover:bg-white/[0.04] hover:text-soft-white">
                    <span>{topic.label}</span><span className="font-mono text-[10px] text-soft-mute">{topic.count}</span>
                  </Link>
                ))}
              </div>
            </div>
            <nav aria-label="Publication resources" className="grid content-start gap-3">
              <Link href="/insights/archive" className="card-cue flex items-center justify-between rounded-xl border border-white/10 px-5 py-4 text-sm text-soft-white"><span className="flex items-center gap-3"><Archive className="h-4 w-4 text-cyan-300" />Complete archive</span><ArrowUpRight className="card-cue-arrow h-4 w-4" /></Link>
              <Link href="/insights/start-here" className="card-cue flex items-center justify-between rounded-xl border border-white/10 px-5 py-4 text-sm text-soft-white"><span className="flex items-center gap-3"><Compass className="h-4 w-4 text-violet-300" />Foundations</span><ArrowUpRight className="card-cue-arrow h-4 w-4" /></Link>
              <Link href="/insights/rss.xml" className="card-cue flex items-center justify-between rounded-xl border border-white/10 px-5 py-4 text-sm text-soft-white"><span className="flex items-center gap-3"><Rss className="h-4 w-4 text-amber-300" />RSS feed</span><ArrowUpRight className="card-cue-arrow h-4 w-4" /></Link>
            </nav>
          </div>
        </div>
      </section>
      <section className="border-t border-white/[0.07] pb-20 pt-12 sm:pb-24 sm:pt-16"><div className="container-wide"><SubscribeForm variant="blog" /></div></section>
    </>
  );
}

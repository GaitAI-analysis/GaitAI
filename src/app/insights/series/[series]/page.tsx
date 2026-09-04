import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicationCard } from "@/components/insights/PublicationCard";
import { readPublicationStories } from "@/lib/publication-store";
import { normalizeTopicSlug } from "@/lib/publication";
import journal from "@/components/insights/journal.module.css";

export const dynamicParams = false;

export async function generateStaticParams() {
  const stories = await readPublicationStories();
  return [...new Set(stories.map((story) => story.series).filter((value): value is string => Boolean(value)))]
    .map((series) => ({ series: normalizeTopicSlug(series) }));
}

async function findSeries(slug: string) {
  const stories = await readPublicationStories();
  const selected = stories.filter((story) => story.series && normalizeTopicSlug(story.series) === slug);
  return selected.sort((a, b) => (a.seriesOrder ?? Number.MAX_SAFE_INTEGER) - (b.seriesOrder ?? Number.MAX_SAFE_INTEGER) || a.date.localeCompare(b.date));
}

export async function generateMetadata({ params }: { params: { series: string } }): Promise<Metadata> {
  const stories = await findSeries(params.series);
  const name = stories[0]?.series;
  if (!name) return { title: "Series not found" };
  if (name === "GaitAI Foundations") {
    return {
      title: "GaitAI Foundations",
      description: "The curated GaitAI Foundations reading path.",
      alternates: { canonical: "/insights/start-here" },
      robots: { index: false, follow: true },
    };
  }
  return {
    title: `${name} — GaitAI Insights`,
    description: `${stories.length} stories in the ${name} reading sequence.`,
    alternates: { canonical: `/insights/series/${params.series}` },
  };
}

export default async function SeriesPage({ params }: { params: { series: string } }) {
  const stories = await findSeries(params.series);
  if (stories.length === 0) notFound();
  const name = stories[0].series!;
  return (
    <div className={journal.journal}>
      <header className="site-page-intro-compact container-wide pb-12 sm:pb-16">
        <Link href="/insights" className="font-mono text-[10px] uppercase tracking-[0.18em] text-soft-mute hover:text-soft-white">← Blog &amp; updates</Link>
        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300">Reading path</p>
        <h1 className="mt-4 max-w-4xl font-display text-display-xl text-balance text-soft-white">{name}</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-soft-gray">{stories.length} stories, arranged in editorial sequence.</p>
      </header>
      <main className="container-wide pb-20 sm:pb-24">
        <ol className={journal.indexGrid}>
          {stories.map((story, index) => (
            <li key={story.id} className="relative pt-9">
              <span className="absolute left-0 top-0 font-mono text-[10px] uppercase tracking-[0.18em] text-violet-300">{String(story.seriesOrder ?? index + 1).padStart(2, "0")}</span>
              <PublicationCard story={story} />
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}

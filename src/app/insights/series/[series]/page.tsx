import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicationCard } from "@/components/insights/PublicationCard";
import { readPublicationStories } from "@/lib/publication-store";
import { FOUNDATIONS_SERIES, seriesByName, seriesSlug } from "@/data/insight-series";
import journal from "@/components/insights/journal.module.css";

/**
 * A series page: the strand's stories in editorial order, under one line of
 * description from the series registry. Lightweight on purpose — a shelf, not
 * a dashboard. The route exists for every series with at least one published
 * story; the Foundations have their own page at /insights/start-here and are
 * only aliased here.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  const stories = await readPublicationStories();
  return [...new Set(stories.map((story) => story.series).filter((value): value is string => Boolean(value)))]
    .map((series) => ({ series: seriesSlug(series) }));
}

async function findSeries(slug: string) {
  const stories = await readPublicationStories();
  const selected = stories.filter((story) => story.series && seriesSlug(story.series) === slug);
  return selected.sort(
    (a, b) =>
      (a.seriesOrder ?? Number.MAX_SAFE_INTEGER) - (b.seriesOrder ?? Number.MAX_SAFE_INTEGER) ||
      a.date.localeCompare(b.date),
  );
}

export async function generateMetadata({ params }: { params: { series: string } }): Promise<Metadata> {
  const stories = await findSeries(params.series);
  const name = stories[0]?.series;
  if (!name) return { title: "Series not found" };
  if (name === FOUNDATIONS_SERIES) {
    return {
      title: "GaitAI Foundations",
      description: "The curated GaitAI Foundations reading path.",
      alternates: { canonical: "/insights/start-here" },
      robots: { index: false, follow: true },
    };
  }
  const series = seriesByName(name);
  const description =
    series?.description ?? `${stories.length} ${stories.length === 1 ? "story" : "stories"} in the ${name} series.`;
  return {
    title: `${name} — GaitAI Insights`,
    description,
    alternates: { canonical: `/insights/series/${params.series}` },
    openGraph: {
      type: "website",
      url: `/insights/series/${params.series}`,
      siteName: "GaitAI",
      title: `${name} — GaitAI Insights`,
      description,
    },
  };
}

export default async function SeriesPage({ params }: { params: { series: string } }) {
  const stories = await findSeries(params.series);
  if (stories.length === 0) notFound();
  const name = stories[0].series!;
  const series = seriesByName(name);
  const kind = series?.kind ?? "strand";
  const kicker = kind === "path" ? "Reading path" : kind === "notes" ? "Notes" : "Series";
  const count = `${stories.length} ${stories.length === 1 ? "story" : "stories"}`;

  return (
    <div className={`${journal.journal} insights-page`}>
      <header className="site-page-intro-compact container-wide pb-12 sm:pb-16">
        <Link
          href="/insights"
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-soft-mute transition-colors hover:text-soft-white"
        >
          ← Back to Blog
        </Link>
        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300">{kicker}</p>
        <h1 className="mt-4 max-w-4xl font-display text-display-xl text-balance text-soft-white">{name}</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-soft-gray">
          {series?.description ?? `${count}, arranged in editorial sequence.`}
        </p>
        <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-soft-mute">
          {count}
          {kind === "path" ? " · in order" : " · newest last"}
        </p>
      </header>
      <main className="container-wide pb-20 sm:pb-24">
        <ol className={journal.indexGrid}>
          {stories.map((story, index) => (
            <li key={story.id} className="relative pt-9">
              <span className="absolute left-0 top-0 font-mono text-[10px] uppercase tracking-[0.18em] text-violet-300">
                {String(story.seriesOrder ?? index + 1).padStart(2, "0")}
              </span>
              <PublicationCard story={story} />
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}

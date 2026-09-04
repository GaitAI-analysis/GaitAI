import type { Metadata } from "next";
import Link from "next/link";
import { PublicationBrowser } from "@/components/insights/PublicationBrowser";
import { InsightsDiscovery } from "@/components/insights/InsightsDiscovery";
import { readPublicationStories } from "@/lib/publication-store";
import { HOME_LATEST_SIZE, progressivePageCount, selectCoverStory } from "@/lib/publication";
import styles from "@/components/insights/journal.module.css";

export const dynamicParams = false;

async function countPages() {
  const stories = await readPublicationStories();
  const cover = selectCoverStory(stories);
  const feedCount = cover ? stories.length - 1 : stories.length;
  return progressivePageCount(feedCount, HOME_LATEST_SIZE);
}

export async function generateStaticParams() {
  const total = await countPages();
  const pages = Array.from({ length: Math.max(0, total - 1) }, (_, index) => ({ page: String(index + 2) }));
  // Next static export rejects a dynamic route whose build-time param list is
  // empty. The sentinel is immediately notFound() below and emits no page.
  return pages.length > 0 ? pages : [{ page: "2" }];
}

export async function generateMetadata({ params }: { params: { page: string } }): Promise<Metadata> {
  const page = Number(params.page);
  const total = await countPages();
  if (!Number.isInteger(page) || page < 2 || page > total) {
    return { title: "No older stories", alternates: { canonical: "/insights" }, robots: { index: false, follow: true } };
  }
  return {
    title: `Blog & Updates — Page ${page}`,
    description: `Older ideas, research, product stories and updates from GaitAI. Page ${page}.`,
    alternates: { canonical: `/insights/page/${page}` },
  };
}

export default async function InsightsPaginationPage({ params }: { params: { page: string } }) {
  const page = Number(params.page);
  const stories = await readPublicationStories();
  const total = await countPages();
  if (!Number.isInteger(page) || page < 2 || page > total) {
    return <div className="site-page-intro-roomy container-wide pb-24"><h1 className="font-display text-4xl text-soft-white">You&apos;re up to date.</h1><p className="mt-4 text-soft-gray">There are no older story pages yet.</p><Link href="/insights" className="btn-ghost mt-8">Return to Blog &amp; updates</Link></div>;
  }
  return (
    <div className={styles.journal}>
      <PublicationBrowser stories={stories} initialPage={page} />
      <InsightsDiscovery stories={stories} />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PublicationBrowser } from "@/components/insights/PublicationBrowser";
import { readPublicationStories } from "@/lib/publication-store";
import { PUBLICATION_PAGE_SIZE, pageCount, publicationTopics, topicDescription, topicLabel } from "@/lib/publication";
import styles from "@/components/insights/journal.module.css";

export const dynamicParams = false;

export async function generateStaticParams() {
  const stories = await readPublicationStories();
  const topics = publicationTopics(stories);
  const pages = topics.flatMap((topic) => {
    const total = pageCount(stories.filter((story) => story.topics.includes(topic.slug)).length, PUBLICATION_PAGE_SIZE);
    return Array.from({ length: Math.max(0, total - 1) }, (_, index) => ({ topic: topic.slug, page: String(index + 2) }));
  });
  return pages.length > 0 ? pages : topics.slice(0, 1).map((topic) => ({ topic: topic.slug, page: "2" }));
}

export async function generateMetadata({ params }: { params: { topic: string; page: string } }): Promise<Metadata> {
  const page = Number(params.page);
  const stories = (await readPublicationStories()).filter((story) => story.topics.includes(params.topic));
  const total = pageCount(stories.length, PUBLICATION_PAGE_SIZE);
  if (!Number.isInteger(page) || page < 2 || page > total) {
    return { title: "No older stories", alternates: { canonical: `/insights/topic/${params.topic}` }, robots: { index: false, follow: true } };
  }
  return {
    title: `${topicLabel(params.topic)} — Page ${page}`,
    description: `${topicDescription(params.topic)} Page ${page}.`,
    alternates: { canonical: `/insights/topic/${params.topic}/page/${page}` },
  };
}

export default async function TopicPaginationPage({ params }: { params: { topic: string; page: string } }) {
  const page = Number(params.page);
  const all = await readPublicationStories();
  const stories = all.filter((story) => story.topics.includes(params.topic));
  const total = pageCount(stories.length, PUBLICATION_PAGE_SIZE);
  if (!Number.isInteger(page) || page < 2 || page > total) {
    return <div className="site-page-intro-roomy container-wide pb-24"><h1 className="font-display text-4xl text-soft-white">You&apos;re up to date.</h1><p className="mt-4 text-soft-gray">There are no older stories in this topic yet.</p><Link href={`/insights/topic/${params.topic}`} className="btn-ghost mt-8">Return to {topicLabel(params.topic)}</Link></div>;
  }
  return (
    <div className={styles.journal}>
      <PublicationBrowser
        stories={stories}
        initialPage={page}
        fixedTopic={params.topic}
        basePath={`/insights/topic/${params.topic}`}
        kicker="Insights topic"
        title={topicLabel(params.topic)}
        description={topicDescription(params.topic)}
        showCover={false}
      />
    </div>
  );
}

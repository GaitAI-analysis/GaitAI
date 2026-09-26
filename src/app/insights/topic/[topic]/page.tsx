import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicationBrowser } from "@/components/insights/PublicationBrowser";
import { readPublicationStories } from "@/lib/publication-store";
import { publicationTopics, topicDescription, topicLabel } from "@/lib/publication";
import styles from "@/components/insights/journal.module.css";

export const dynamicParams = false;

export async function generateStaticParams() {
  return publicationTopics(await readPublicationStories()).map((topic) => ({ topic: topic.slug }));
}
export async function generateMetadata({ params }: { params: { topic: string } }): Promise<Metadata> {
  const stories = await readPublicationStories();
  if (!publicationTopics(stories).some((topic) => topic.slug === params.topic)) return { title: "Topic not found" };
  const title = topicLabel(params.topic);
  const description = topicDescription(params.topic);
  return {
    title: `${title} — GaitAI Blog`,
    description,
    alternates: { canonical: `/insights/topic/${params.topic}` },
    openGraph: { type: "website", url: `/insights/topic/${params.topic}`, title: `${title} — GaitAI Blog`, description },
  };
}

export default async function TopicPage({ params }: { params: { topic: string } }) {
  const all = await readPublicationStories();
  const stories = all.filter((story) => story.topics.includes(params.topic));
  if (stories.length === 0) notFound();
  return (
    <div className={styles.journal}>
      <PublicationBrowser
        stories={stories}
        fixedTopic={params.topic}
        basePath={`/insights/topic/${params.topic}`}
        kicker="Blog topic"
        title={topicLabel(params.topic)}
        description={topicDescription(params.topic)}
        showCover={false}
      />
    </div>
  );
}

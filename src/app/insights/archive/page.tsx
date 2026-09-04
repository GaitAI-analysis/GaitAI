import type { Metadata } from "next";
import Link from "next/link";
import { readPublicationStories } from "@/lib/publication-store";
import { buildArchiveGroups, formatPublicationDate, publicationTopics, publicationTypeLabel, topicLabel } from "@/lib/publication";
import styles from "@/components/insights/archive-page.module.css";

export const metadata: Metadata = {
  title: "Blog Archive — Everything GaitAI Has Published",
  description: "The complete GaitAI publication archive, organised by year and month.",
  alternates: { canonical: "/insights/archive" },
  openGraph: { type: "website", url: "/insights/archive", title: "GaitAI Blog Archive", description: "Every story, research note and update from GaitAI." },
};

export default async function InsightsArchivePage() {
  const stories = await readPublicationStories();
  const years = buildArchiveGroups(stories);
  const topics = publicationTopics(stories);
  return (
    <div className={styles.archive}>
      <header className="site-page-intro-compact container-wide pb-12 sm:pb-16">
        <Link href="/insights" className={styles.back}>← Blog &amp; updates</Link>
        <p className={styles.kicker}>Archive</p>
        <h1 className={styles.title}>Everything GaitAI has published.</h1>
        <p className={styles.deck}>{stories.length} stories, organised for retrieval rather than display.</p>
      </header>

      <div className="container-wide pb-20 sm:pb-24">
        <nav className={styles.topicIndex} aria-label="Browse archive by topic">
          <span className={styles.topicIndexLabel}>Topics</span>
          {topics.map((topic) => <Link key={topic.slug} href={`/insights/topic/${topic.slug}`}>{topic.label} <span>{topic.count}</span></Link>)}
        </nav>

        <div className={styles.years}>
          {years.map((group, yearIndex) => (
            <details key={group.year} open={yearIndex === 0} className={styles.year}>
              <summary><span>{group.year}</span><span>{group.months.reduce((sum, month) => sum + month.stories.length, 0)} stories</span></summary>
              <div className={styles.months}>
                {group.months.map((month) => (
                  <section key={month.key} id={month.key} className={styles.month}>
                    <h2><span>{month.label}</span><span>{month.stories.length}</span></h2>
                    <ol>
                      {month.stories.map((story) => (
                        <li key={story.id}>
                          <Link href={story.href} className={styles.storyRow}>
                            <time dateTime={story.date}>{formatPublicationDate(story.date)}</time>
                            <span className={styles.storyTitle}>{story.title}</span>
                            <span className={styles.storyMeta}>{publicationTypeLabel(story.type)} · {story.topics.slice(0, 2).map(topicLabel).join(" · ")}</span>
                            <span aria-hidden="true" className={styles.arrow}>→</span>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </section>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

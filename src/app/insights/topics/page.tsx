/**
 * THE TOPIC DIRECTORY — the Blog dropdown's "Topics" destination.
 *
 * The publication had per-topic routes (`/insights/topic/<slug>/`) and two
 * places that happened to list them — a strip on the archive and a panel at
 * the foot of the feed — but no route of its own that answers "what subjects
 * does GaitAI write about?". The navbar needs one: a dropdown entry has to
 * point somewhere, and pointing "Topics" at the archive would make two menu
 * rows land on the same page.
 *
 * NOTHING HERE IS A TOPIC REGISTRY. The list is derived from story metadata by
 * `publicationTopics`, the same call the filters and the archive use, so a new
 * topic on a new post appears here with no edit — and a topic whose last post
 * is unpublished disappears. `INSIGHT_TOPIC_CONFIG` only supplies nicer copy
 * where an editor has written some; it never decides what exists.
 *
 * ORDERED BY EDITORIAL PRIORITY, THEN BY VOLUME, which is the order the feed's
 * filter chips already use. A directory sorted alphabetically would put
 * whatever begins with "A" above the subject the publication is actually
 * about.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { readPublicationStories } from "@/lib/publication-store";
import {
  publicationTopics,
  sortNewest,
  topicDescription,
  formatPublicationDate,
} from "@/lib/publication";
import styles from "@/components/insights/archive-page.module.css";

export const metadata: Metadata = {
  title: "Blog Topics — What GaitAI Writes About",
  description:
    "Browse the GaitAI blog by subject: movement intelligence, responsible AI, mobility, research and engineering.",
  alternates: { canonical: "/insights/topics" },
  openGraph: {
    type: "website",
    url: "/insights/topics",
    title: "GaitAI Blog Topics",
    description: "Every subject GaitAI writes about, and how much there is to read.",
  },
};

export default async function InsightsTopicsPage() {
  const stories = await readPublicationStories();
  const topics = publicationTopics(stories);

  /* The most recent story in each topic, so a row says what is actually
     behind it rather than only how many things are. */
  const newestIn = new Map(
    topics.map((topic) => [
      topic.slug,
      sortNewest(stories.filter((story) => story.topics.includes(topic.slug)))[0],
    ]),
  );

  return (
    <div className={styles.archive}>
      <header className="site-page-intro-compact container-wide pb-12 sm:pb-16">
        <Link href="/insights" className={styles.back}>← Blog &amp; updates</Link>
        <p className={styles.kicker}>Topics</p>
        <h1 className={styles.title}>Browse the writing by subject.</h1>
        <p className={styles.deck}>
          {topics.length} {topics.length === 1 ? "subject" : "subjects"} across{" "}
          {stories.length} {stories.length === 1 ? "story" : "stories"}. Every topic
          is derived from what has been published, not from a fixed list.
        </p>
      </header>

      <div className="container-wide pb-20 sm:pb-24">
        <ul className={styles.topicCards}>
          {topics.map((topic) => {
            const newest = newestIn.get(topic.slug);
            return (
              <li key={topic.slug}>
                <Link href={`/insights/topic/${topic.slug}`} className={styles.topicCard}>
                  <span className={styles.topicCardHead}>
                    <span className={styles.topicCardName}>{topic.label}</span>
                    <span className={styles.topicCardCount}>
                      {topic.count} {topic.count === 1 ? "story" : "stories"}
                    </span>
                  </span>
                  <span className={styles.topicCardBlurb}>{topicDescription(topic.slug)}</span>
                  {newest && (
                    <span className={styles.topicCardLatest}>
                      <span>Latest</span>
                      <span className={styles.topicCardLatestTitle}>{newest.title}</span>
                      <time dateTime={newest.date}>{formatPublicationDate(newest.date)}</time>
                    </span>
                  )}
                  <span aria-hidden="true" className={styles.arrow}>→</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className={styles.topicsFoot}>
          Looking for everything at once? The{" "}
          <Link href="/insights/archive">complete archive</Link> lists every story by
          year and month.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { InsightArticle, InsightTopic } from "@/data/insights";
import { TOPIC_FILTERS } from "@/data/insights";
import { StoryCard, type StoryVariant } from "./StoryCard";
import styles from "./journal.module.css";

/**
 * The library below the featured story.
 *
 * Two layouts, chosen by intent rather than by breakpoint:
 *
 *   browsing   an editorial arrangement where the stories deliberately carry
 *              different weight — a large piece beside a taller one, then a
 *              wide narrative, then a full-width research feature. Each is
 *              introduced by the question it answers, set beside it rather
 *              than inside it.
 *   filtering  a uniform three-column grid. Once a reader has asked for one
 *              topic they are looking at results, and an arbitrary hierarchy
 *              over results is just noise.
 *
 * The topic index is a row of editorial labels with counts, not a bank of
 * buttons: each is a real `<button>` with `aria-pressed`, so it is keyboard
 * operable and announces its state, but it reads as a masthead index.
 */

/** Footprints for the browsing layout, in order. */
const LAYOUT: Array<{ variant: StoryVariant; slot: string }> = [
  { variant: "tall", slot: styles.slotA },
  { variant: "standard", slot: styles.slotB },
  { variant: "wide", slot: styles.slotWide },
  { variant: "full", slot: styles.slotWide },
];

export function JournalLibrary({ articles }: { articles: InsightArticle[] }) {
  const [topic, setTopic] = useState<InsightTopic | "all">("all");

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    map.set("all", articles.length);
    for (const article of articles) {
      for (const t of article.topics) map.set(t, (map.get(t) ?? 0) + 1);
    }
    return map;
  }, [articles]);

  const filtered = useMemo(
    () =>
      topic === "all"
        ? articles
        : articles.filter((article) => article.topics.includes(topic)),
    [articles, topic],
  );

  const browsing = topic === "all";

  return (
    <div>
      <div className={styles.topicIndex} role="group" aria-label="Filter by topic">
        {TOPIC_FILTERS.map((filter) => {
          const count = counts.get(filter.key) ?? 0;
          if (count === 0 && filter.key !== "all") return null;
          const active = filter.key === topic;
          return (
            <button
              key={filter.key}
              type="button"
              aria-pressed={active}
              onClick={() => setTopic(filter.key)}
              className={`${styles.topicButton} ${
                active ? styles.topicButtonActive : ""
              }`}
            >
              {filter.label}
              <span className={styles.topicCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className={styles.emptyNote}>
          Nothing under this topic yet — the other essays are still one click
          away.
        </p>
      ) : browsing ? (
        <div className={`${styles.storyGrid} mt-8 sm:mt-10`}>
          {filtered.map((article, i) => {
            const layout = LAYOUT[i % LAYOUT.length];
            return (
              <div key={article.slug} className={`${layout.slot} min-w-0`}>
                {/* The question is the hook; the card is the answer. */}
                <p className={styles.question}>{article.question}</p>
                <StoryCard article={article} variant={layout.variant} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`${styles.uniformGrid} mt-8 sm:mt-10`}>
          {filtered.map((article) => (
            <StoryCard key={article.slug} article={article} variant="standard" />
          ))}
        </div>
      )}
    </div>
  );
}

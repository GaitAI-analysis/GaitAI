"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import {
  INSIGHTS_AUTHOR,
  TOPIC_FILTERS,
  formatInsightDate,
  insightArticles,
  insightHref,
  type InsightTopic,
} from "@/data/insights";
import { StoryCard } from "./StoryCard";
import styles from "./archive.module.css";

/**
 * THE ARCHIVE — the part of the journal that says "these are articles".
 *
 * The page below this is a single continuous signal narrative, and it is the
 * strongest idea on the route. It is also, on its own, unreadable as an
 * archive: it carries one question and one title per essay, no excerpt, no
 * date, no author, no read time and no way to filter. A reader who arrives
 * wanting to know what there is to read has to infer it from a scroll-driven
 * illustration.
 *
 * So this sits ABOVE the narrative rather than replacing it. Masthead, one
 * featured story at cover size, then every article as a dated card with an
 * author and a read time, behind a topic filter, a search field and a sort.
 * The narrative keeps its job — showing what the essays are ABOUT — and this
 * one does the job it was never meant to: showing what they ARE.
 *
 * Every value is a field on the article record. Nothing here is a metric:
 * there are no views, no likes and no popularity sort, because the repository
 * has none and inventing them is the one thing an editorial surface must not
 * do. "Newest" and "Reading order" are both real orderings of real fields.
 */

type Sort = "newest" | "series";

/** Only topics that actually match an article are offered. */
const ACTIVE_TOPICS = TOPIC_FILTERS.filter(
  (topic) =>
    topic.key === "all" ||
    insightArticles.some((article) =>
      article.topics.includes(topic.key as InsightTopic),
    ),
);

export function JournalIndex() {
  const [topic, setTopic] = useState<InsightTopic | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");

  /** Title, deck, excerpt, category and topics — what a reader would search. */
  const haystacks = useMemo(() => {
    const map = new Map<string, string>();
    for (const article of insightArticles) {
      map.set(
        article.slug,
        [
          article.title,
          article.subtitle ?? "",
          article.deck,
          article.excerpt,
          article.category,
          article.question,
          ...article.tags,
          ...article.topics,
        ]
          .join(" ")
          .toLowerCase(),
      );
    }
    return map;
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = insightArticles.filter((article) => {
      if (topic !== "all" && !article.topics.includes(topic)) return false;
      if (q && !(haystacks.get(article.slug) ?? "").includes(q)) return false;
      return true;
    });
    return [...list].sort((a, b) =>
      sort === "newest"
        ? b.date.localeCompare(a.date)
        : a.seriesStep - b.seriesStep,
    );
  }, [topic, query, sort, haystacks]);

  const dirty = topic !== "all" || query !== "";
  const reset = () => {
    setTopic("all");
    setQuery("");
  };

  /* The cover story is the newest piece, and it is only the cover when the
     reader has not started filtering — a "featured" card inside a filtered
     result set is just the first result wearing a bigger frame. */
  const featured = !dirty && sort === "newest" ? matches[0] : undefined;
  const rest = featured ? matches.slice(1) : matches;

  const newest = [...insightArticles].sort((a, b) =>
    b.date.localeCompare(a.date),
  )[0];

  return (
    <section id="archive" className={styles.archive}>
      <div className="container-wide">
        {/* ── Masthead ── */}
        <header className={styles.masthead}>
          <p className={styles.mastheadKicker}>The GaitAI Journal</p>
          <h1 className={styles.mastheadTitle}>
            Ideas, explainers and research notes on{" "}
            <span className={styles.mastheadAccent}>movement intelligence.</span>
          </h1>
          <p className={styles.mastheadDeck}>
            Technical essays, research translation and responsible-AI
            perspectives from the systems behind GaitAI — written by the team
            that builds them.
          </p>
          <p className={styles.mastheadMeta}>
            {insightArticles.length} essays · {INSIGHTS_AUTHOR} · Latest{" "}
            {formatInsightDate(newest.date)}
          </p>
        </header>

        {/* ── Controls ── */}
        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <Search aria-hidden="true" className={styles.searchIcon} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search insights…"
              aria-label="Search insights"
              className={styles.search}
            />
          </div>

          <div className={styles.topics} role="group" aria-label="Filter by topic">
            {ACTIVE_TOPICS.map((option) => {
              const on = topic === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTopic(option.key as InsightTopic | "all")}
                  className={`${styles.topicChip} ${on ? styles.topicChipOn : ""}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className={styles.sortWrap}>
            <label htmlFor="journal-sort" className={styles.sortLabel}>
              Sort
            </label>
            <select
              id="journal-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
              className={styles.sort}
            >
              <option value="newest">Newest first</option>
              <option value="series">Reading order</option>
            </select>
          </div>
        </div>

        <div className={styles.resultRow} aria-live="polite">
          <span>
            {matches.length === insightArticles.length
              ? `${insightArticles.length} essays`
              : `${matches.length} of ${insightArticles.length} essays`}
          </span>
          {dirty && (
            <button type="button" onClick={reset} className={styles.clear}>
              <X aria-hidden="true" className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>

        {/* ── Cover story ── */}
        {featured && (
          <div className={styles.featured}>
            <p className={styles.featuredLabel}>Cover story</p>
            <StoryCard article={featured} variant="full" priority />
          </div>
        )}

        {/* ── The rest ── */}
        {rest.length > 0 && (
          <>
            <h2 className={styles.gridHeading}>
              {featured ? "More from the journal" : "Results"}
            </h2>
            <div className={styles.archiveGrid}>
              {rest.map((article) => (
                <StoryCard key={article.slug} article={article} variant="tall" />
              ))}
            </div>
          </>
        )}

        {matches.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No essay matches that.</p>
            <p className={styles.emptyBody}>
              Try a different topic, or clear the filters to see all{" "}
              {insightArticles.length}.
            </p>
            <button type="button" onClick={reset} className="btn-ghost mt-6">
              Clear filters
            </button>
          </div>
        )}

        {/* ── The series, which is a real one: five essays in order ── */}
        {!dirty && (
          <div className={styles.series}>
            <div className={styles.seriesHead}>
              <p className={styles.seriesKicker}>Reading path</p>
              <h2 className={styles.seriesTitle}>
                GaitAI Foundations — five essays, in order
              </h2>
              <p className={styles.seriesDeck}>
                Each one builds on the last, from a walking video to an audited
                multimodal claim.
              </p>
            </div>
            <ol className={styles.seriesList}>
              {[...insightArticles]
                .sort((a, b) => a.seriesStep - b.seriesStep)
                .map((article) => (
                  <li key={article.slug} className={styles.seriesItem}>
                    <Link
                      href={insightHref(article.slug)}
                      className={styles.seriesLink}
                    >
                      <span className={styles.seriesStep}>
                        {String(article.seriesStep).padStart(2, "0")}
                      </span>
                      <span className="min-w-0">
                        <span className={styles.seriesName}>
                          {article.seriesTitle}
                        </span>
                        <span className={styles.seriesMeta}>
                          {article.category} · {article.readMinutes} min read
                        </span>
                      </span>
                      <span aria-hidden="true" className={styles.seriesArrow}>
                        →
                      </span>
                    </Link>
                  </li>
                ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}

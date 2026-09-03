"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import {
  INSIGHTS_AUTHOR,
  POST_TYPE_PLURAL,
  TOPIC_FILTERS,
  activePostTypes,
  formatInsightDate,
  insightArticles,
  insightHref,
  type InsightTopic,
  type PostType,
} from "@/data/insights";
import { StoryCard } from "./StoryCard";
import { useCommentCounts } from "./useCommentCounts";
import { JournalBackdrop } from "./JournalBackdrop";
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

/* The journal's remit is wider than its archive: product, engineering and
   company writing all belong here, and none of it is published yet. So the
   type row is derived from what exists rather than declared — an empty
   "Product updates" chip would be a promise the archive cannot keep. */
const ACTIVE_TYPES = activePostTypes();

/** Small counts read better spelled out in a display heading. */
const COUNT_WORD = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const spell = (n: number) => COUNT_WORD[n] ?? String(n);

export function JournalIndex() {
  const [type, setType] = useState<PostType | "all">("all");
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
      if (type !== "all" && article.postType !== type) return false;
      if (topic !== "all" && !article.topics.includes(topic)) return false;
      if (q && !(haystacks.get(article.slug) ?? "").includes(q)) return false;
      return true;
    });
    return [...list].sort((a, b) =>
      sort === "newest"
        ? b.date.localeCompare(a.date)
        : a.seriesStep - b.seriesStep,
    );
  }, [type, topic, query, sort, haystacks]);

  const dirty = type !== "all" || topic !== "all" || query !== "";
  const reset = () => {
    setType("all");
    setTopic("all");
    setQuery("");
  };

  /* Real approved-comment counts for every article on screen, in one query.
     Empty until it resolves, and empty if Firestore is unreachable — the
     cards then simply show no comment metadata rather than a fabricated one. */
  const commentCounts = useCommentCounts(insightArticles.map((a) => a.slug));

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
      {/* The publication's own atmosphere: a drawn page — column rules, a
          baseline grid, two blocks of set type — crossed by movement
          trajectories. The masthead used to sit on flat dark ground, which
          read as a listing rather than as a journal. Nothing in it exceeds
          0.16 alpha and it is masked out of the left third, so the headline's
          contrast is unchanged. */}
      <JournalBackdrop />

      <div className="container-wide">
        {/* ── Masthead ── */}
        <header className={styles.masthead}>
          <p className={styles.mastheadKicker}>The GaitAI Journal</p>
          <h1 className={styles.mastheadTitle}>
            Ideas, research, product notes and updates from{" "}
            <span className={styles.mastheadAccent}>GaitAI.</span>
          </h1>
          <p className={styles.mastheadDeck}>
            Technical essays, research translation, engineering stories and
            updates from the team building GaitAI.
          </p>
          {/* Both lines are counted and dated from the records themselves: the
              coverage line names only the kinds of writing that exist, and the
              date is the newest article's own. */}
          <p className={styles.mastheadMeta}>
            {insightArticles.length} stories ·{" "}
            {ACTIVE_TYPES.map((key) => POST_TYPE_PLURAL[key]).join(" · ")}
          </p>
          <p className={styles.mastheadMeta}>
            Latest · {formatInsightDate(newest.date)} · {INSIGHTS_AUTHOR}
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
              placeholder="Search the journal…"
              aria-label="Search the journal"
              className={styles.search}
            />
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

        {/* ── Filters: what kind of piece, then what it is about ── */}
        <div className={styles.filters}>
          <div className={styles.filterRow}>
            <span className={styles.filterLabel} id="journal-type-label">
              Type
            </span>
            <div
              className={styles.topics}
              role="group"
              aria-labelledby="journal-type-label"
            >
              <button
                type="button"
                aria-pressed={type === "all"}
                onClick={() => setType("all")}
                className={`${styles.topicChip} ${type === "all" ? styles.topicChipOn : ""}`}
              >
                All
              </button>
              {ACTIVE_TYPES.map((key) => {
                const on = type === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setType(key)}
                    className={`${styles.topicChip} ${on ? styles.topicChipOn : ""}`}
                  >
                    {POST_TYPE_PLURAL[key]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.filterRow}>
            <span className={styles.filterLabel} id="journal-topic-label">
              Topic
            </span>
            <div
              className={styles.topics}
              role="group"
              aria-labelledby="journal-topic-label"
            >
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
          </div>
        </div>

        <div className={styles.resultRow} aria-live="polite">
          <span>
            {matches.length === insightArticles.length
              ? `${insightArticles.length} stories`
              : `${matches.length} of ${insightArticles.length} stories`}
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
            <StoryCard
              article={featured}
              variant="full"
              priority
              commentCount={commentCounts[featured.slug]}
            />
          </div>
        )}

        {/* ── The rest ── */}
        {rest.length > 0 && (
          <>
            <h2 className={styles.gridHeading}>
              {featured
                ? "Latest stories"
                : type !== "all"
                  ? POST_TYPE_PLURAL[type]
                  : "Results"}
            </h2>
            <div className={styles.archiveGrid}>
              {rest.map((article) => (
                <StoryCard
                  key={article.slug}
                  article={article}
                  variant="tall"
                  commentCount={commentCounts[article.slug]}
                />
              ))}
            </div>
          </>
        )}

        {matches.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No story matches that.</p>
            <p className={styles.emptyBody}>
              Try a different type or topic, or clear the filters to see all{" "}
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
                GaitAI Foundations — {spell(insightArticles.length)} stories, in order
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

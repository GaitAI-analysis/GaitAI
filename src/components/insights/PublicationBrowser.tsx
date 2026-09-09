"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import {
  HOME_LATEST_SIZE,
  PUBLICATION_PAGE_SIZE,
  VISIBLE_TOPIC_COUNT,
  filterPublicationStories,
  formatPublicationDate,
  pageCount,
  pageHref,
  paginate,
  progressivePage,
  progressivePageCount,
  publicationMatch,
  publicationTopics,
  publicationTypeLabel,
  publicationTypes,
  selectCoverStory,
  sortNewest,
  sortOldest,
  type PublicationStory,
} from "@/lib/publication";
import { useArticleStats } from "./useArticleStats";
import { JournalBackdrop } from "./JournalBackdrop";
import { InsightCard } from "./hub/InsightCard";
import { InsightFeatureStory } from "./hub/InsightFeatureStory";
import { HubComposition } from "./hub/HubComposition";
import { LiveSignalMark } from "./hub/LiveSignalMark";
import styles from "./archive.module.css";
import journal from "./journal.module.css";
import hub from "./hub/hub.module.css";

type Sort = "newest" | "oldest" | "views";

function navPages(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const values = new Set([1, total, current - 1, current, current + 1]);
  const ordered = [...values].filter((value) => value > 0 && value <= total).sort((a, b) => a - b);
  const output: Array<number | "ellipsis"> = [];
  ordered.forEach((value, index) => {
    if (index > 0 && value - ordered[index - 1] > 1) output.push("ellipsis");
    output.push(value);
  });
  return output;
}

export function PublicationBrowser({
  stories,
  initialPage = 1,
  basePath = "/insights",
  fixedTopic,
  /* The journal's identity. "GaitAI Insights" is the publication; the navbar
     tab is still "Blog", and the metadata title still says "Blog & Updates",
     so nothing a search engine or a returning reader relies on has moved. */
  kicker = "GaitAI Insights",
  title = "Ideas in motion.",
  /* One line on what the publication is FOR, not a list of formats — the type
     and topic filters directly below already say what kinds of writing are
     here. */
  description = "Research, engineering and perspective on how machines understand human movement. Every story can be explored, not just read.",
  showCover = true,
}: {
  stories: PublicationStory[];
  initialPage?: number;
  basePath?: string;
  fixedTopic?: string;
  kicker?: string;
  title?: string;
  description?: string;
  showCover?: boolean;
}) {
  const [type, setType] = useState("all");
  const [topic, setTopic] = useState(fixedTopic ?? "all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(initialPage);
  const { stats, loaded: statsLoaded } = useArticleStats();

  const allTopics = useMemo(() => publicationTopics(stories), [stories]);
  const newest = useMemo(() => sortNewest(stories)[0], [stories]);
  const allTypes = useMemo(() => publicationTypes(stories), [stories]);
  const cover = useMemo(() => (showCover ? selectCoverStory(stories) : undefined), [showCover, stories]);
  const activeTopic = fixedTopic ?? topic;
  const clean = !query.trim() && type === "all" && activeTopic === (fixedTopic ?? "all") && sort === "newest";

  const matches = useMemo(() => {
    const filtered = filterPublicationStories(stories, { query, type, topic: activeTopic });
    if (sort === "oldest") return sortOldest(filtered);
    if (sort === "views") {
      return [...filtered].sort((a, b) => {
        const difference = (stats[b.slug]?.views ?? 0) - (stats[a.slug]?.views ?? 0);
        return difference || b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug);
      });
    }
    return sortNewest(filtered);
  }, [activeTopic, query, sort, stats, stories, type]);

  const coverVisible = Boolean(showCover && cover && clean && page === 1);
  const feed = clean && showCover && cover
    ? matches.filter((story) => story.id !== cover.id)
    : matches;
  const routedPagination = clean;
  const totalPages = routedPagination
    ? progressivePageCount(feed.length, showCover ? HOME_LATEST_SIZE : PUBLICATION_PAGE_SIZE)
    : pageCount(feed.length, PUBLICATION_PAGE_SIZE);
  const visible = routedPagination
    ? progressivePage(feed, page, showCover ? HOME_LATEST_SIZE : PUBLICATION_PAGE_SIZE)
    : paginate(feed, page, PUBLICATION_PAGE_SIZE);

  const visibleTopics = allTopics.slice(0, VISIBLE_TOPIC_COUNT);
  const moreTopics = allTopics.slice(VISIBLE_TOPIC_COUNT);

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    document.getElementById("latest")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const reset = () => {
    setType("all");
    if (!fixedTopic) setTopic("all");
    setQuery("");
    setSort("newest");
    setPage(1);
  };

  return (
    <section className={styles.archive}>
      <JournalBackdrop />
      <div className="container-wide">
        <header className={styles.masthead}>
          <p className={styles.mastheadKicker}>
            {kicker}
            {/* The publication's mark: one gait cycle with a signal moving
                through it. It moves only while on screen. */}
            {showCover && <LiveSignalMark />}
          </p>
          <h1 className={styles.mastheadTitle}>{title}</h1>
          <p className={styles.mastheadDeck}>{description}</p>
          <p className={styles.mastheadMeta}>
            {stories.length} stories
            {newest ? ` · Latest ${formatPublicationDate(newest.date)}` : ""}
          </p>
        </header>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <Search aria-hidden="true" className={styles.searchIcon} />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search stories, ideas and research…"
              aria-label="Search stories, ideas and research"
              className={styles.search}
            />
          </div>
          <div className={styles.sortWrap}>
            <label htmlFor="publication-sort" className={styles.sortLabel}>Sort</label>
            <select
              id="publication-sort"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as Sort);
                setPage(1);
              }}
              className={styles.sort}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              {statsLoaded && <option value="views">Most viewed</option>}
            </select>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>Type</span>
            <div className={styles.topics} role="group" aria-label="Filter by type">
              <FilterButton active={type === "all"} onClick={() => { setType("all"); setPage(1); }}>All</FilterButton>
              {allTypes.map((value) => (
                <FilterButton key={value} active={type === value} onClick={() => { setType(value); setPage(1); }}>
                  {publicationTypeLabel(value, true)}
                </FilterButton>
              ))}
            </div>
          </div>

          {!fixedTopic && (
            <div className={styles.filterRow}>
              <span className={styles.filterLabel}>Topic</span>
              <div className={styles.topics} role="group" aria-label="Filter by topic">
                <FilterButton active={topic === "all"} onClick={() => { setTopic("all"); setPage(1); }}>All</FilterButton>
                {visibleTopics.map((value) => (
                  <FilterButton key={value.slug} active={topic === value.slug} onClick={() => { setTopic(value.slug); setPage(1); }}>
                    {value.label}
                  </FilterButton>
                ))}
                {moreTopics.length > 0 && (
                  <details className={styles.moreTopics}>
                    <summary className={`${styles.topicChip} ${moreTopics.some((item) => item.slug === topic) ? styles.topicChipOn : ""}`}>
                      More <span aria-hidden="true">▾</span>
                    </summary>
                    <div className={styles.moreMenu}>
                      {moreTopics.map((value) => (
                        <button
                          key={value.slug}
                          type="button"
                          aria-pressed={topic === value.slug}
                          onClick={() => { setTopic(value.slug); setPage(1); }}
                          className={styles.moreOption}
                        >
                          <span>{value.label}</span><span>{value.count}</span>
                        </button>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.resultRow} aria-live="polite">
          <span>{matches.length === stories.length ? `${stories.length} stories` : `${matches.length} of ${stories.length} stories`}</span>
          {!clean && (
            <button type="button" onClick={reset} className={styles.clear}>
              <X aria-hidden="true" className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {coverVisible && cover && (
          <div className={styles.featured}>
            <h2 className={styles.featuredLabel}>Cover story</h2>
            <InsightFeatureStory story={cover} views={stats[cover.slug]?.views} />
          </div>
        )}

        {visible.length > 0 && (
          <div id="latest" className={styles.latestSection}>
            <h2 className={styles.gridHeading}>
              {fixedTopic
                ? `Latest in ${allTopics.find((item) => item.slug === fixedTopic)?.label ?? "this topic"}`
                : query.trim()
                  ? `Stories matching “${query.trim()}”`
                  : "Latest from GaitAI"}
            </h2>
            {/* Untouched by any filter, the feed is an editorial composition —
                half, half, wide — so the stories carry different weight. Once a
                reader filters or searches it becomes a plain grid of results,
                each saying where it matched. The key is the FILTER signature,
                so changing a chip replays the settle while typing narrows the
                same grid in place without a flash. */}
            {coverVisible ? (
              <div key="composition" className={journal.gridEnter}>
                <HubComposition stories={visible} stats={stats} />
              </div>
            ) : (
              <div
                key={`${type}|${activeTopic}|${sort}|${page}`}
                className={`${journal.indexGrid} ${journal.gridEnter}`}
              >
                {visible.map((story) => (
                  <InsightCard
                    key={story.id}
                    story={story}
                    views={stats[story.slug]?.views}
                    match={publicationMatch(story, query)}
                    query={query}
                    step={story.series === "GaitAI Foundations" ? story.seriesOrder : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {matches.length === 0 && (
          <div className={styles.empty}>
            <svg aria-hidden="true" viewBox="0 0 120 20" className={hub.emptyLine}>
              <path className={hub.emptyPath} d="M0 10 C20 10 24 3 34 3 S50 17 60 17 S76 3 86 3 S104 10 120 10" />
            </svg>
            <p className={styles.emptyTitle}>No signal found for this combination.</p>
            <p className={styles.emptyBody}>
              Try another word, type or topic — or clear everything and browse the whole journal.
            </p>
            <button type="button" onClick={reset} className="btn-ghost mt-6">Clear filters</button>
          </div>
        )}

        {visible.length > 0 && totalPages > 1 && (
          <nav className={styles.pagination} aria-label="Publication pages">
            {page > 1 && (
              routedPagination ? (
                <Link href={pageHref(basePath, page - 1)} className={styles.pageDirection}>← Newer</Link>
              ) : (
                <button type="button" onClick={() => changePage(page - 1)} className={styles.pageDirection}>← Newer</button>
              )
            )}
            <div className={styles.pageNumbers}>
              {navPages(page, totalPages).map((value, index) =>
                value === "ellipsis" ? (
                  <span key={`ellipsis-${index}`} className={styles.pageEllipsis}>…</span>
                ) : routedPagination ? (
                  <Link
                    key={value}
                    href={pageHref(basePath, value)}
                    aria-current={page === value ? "page" : undefined}
                    className={`${styles.pageNumber} ${page === value ? styles.pageNumberOn : ""}`}
                  >{value}</Link>
                ) : (
                  <button
                    key={value}
                    type="button"
                    onClick={() => changePage(value)}
                    aria-current={page === value ? "page" : undefined}
                    className={`${styles.pageNumber} ${page === value ? styles.pageNumberOn : ""}`}
                  >{value}</button>
                ),
              )}
            </div>
            {page < totalPages && (
              routedPagination ? (
                <Link href={pageHref(basePath, page + 1)} className={styles.pageDirection}>Older →</Link>
              ) : (
                <button type="button" onClick={() => changePage(page + 1)} className={styles.pageDirection}>Older →</button>
              )
            )}
          </nav>
        )}
      </div>
    </section>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`${styles.topicChip} ${active ? styles.topicChipOn : ""}`}
    >
      {children}
    </button>
  );
}

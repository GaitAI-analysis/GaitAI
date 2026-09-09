"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import {
  HOME_LATEST_SIZE,
  PUBLICATION_PAGE_SIZE,
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
import { trackInsightEvent } from "@/lib/insight-events";
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

/**
 * THE INSIGHTS HUB.
 *
 * CONTENT BEFORE UTILITIES. The order on the page is the order a reader
 * wants: a short masthead, then the cover story with its interaction, then
 * one quiet row of utilities — search, Topics, sort — then the remaining
 * stories in an editorial composition. The type and topic filters still
 * exist in full; they live behind "Topics ▾" until a reader wants them,
 * because five stories do not need two rows of pills standing in front of
 * them. When the archive grows the same menu simply has more entries.
 *
 * The masthead sits under the fixed header through the site's own spacing
 * system (`site-page-intro-compact`), never a hand-picked padding.
 *
 * NAMES. The navigation category is "Blog" (tab, footer, breadcrumb, back
 * links). What the reader arrives at is the publication, "GaitAI Insights".
 */
export function PublicationBrowser({
  stories,
  initialPage = 1,
  basePath = "/insights",
  fixedTopic,
  kicker = "GaitAI Insights",
  title = "Ideas in motion.",
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { stats, loaded: statsLoaded } = useArticleStats();

  const allTopics = useMemo(() => publicationTopics(stories), [stories]);
  const newest = useMemo(() => sortNewest(stories)[0], [stories]);
  const allTypes = useMemo(() => publicationTypes(stories), [stories]);
  const cover = useMemo(() => (showCover ? selectCoverStory(stories) : undefined), [showCover, stories]);
  const activeTopic = fixedTopic ?? topic;
  const filtering = type !== "all" || activeTopic !== (fixedTopic ?? "all");
  const clean = !query.trim() && !filtering && sort === "newest";

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

  /* The Topics menu closes on an outside press or Escape, like any menu. */
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  /* Filters and sort are recorded once per distinct choice, as names only. */
  useEffect(() => {
    if (type === "all" && (fixedTopic || topic === "all") && sort === "newest") return;
    trackInsightEvent("filter_used", { type, topic: fixedTopic ?? topic, sort }, { once: `${type}|${topic}|${sort}` });
  }, [fixedTopic, sort, topic, type]);

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

  const activeTopicLabel = allTopics.find((item) => item.slug === activeTopic)?.label;
  const menuLabel = !fixedTopic && activeTopic !== "all" ? activeTopicLabel ?? "Topics" : "Topics";
  const resultText = clean
    ? ""
    : matches.length === stories.length
      ? `${stories.length} stories`
      : `${matches.length} of ${stories.length} stories`;

  return (
    <section className={`${styles.archive} site-page-intro-compact`}>
      <JournalBackdrop quiet />
      <div className="container-wide">
        {/* ── Masthead: short, then straight into the cover ── */}
        <header className={styles.masthead}>
          <p className={styles.mastheadKicker}>
            {kicker}
            {showCover && <LiveSignalMark />}
          </p>
          <h1 className={styles.mastheadTitle}>{title}</h1>
          <p className={styles.mastheadDeck}>{description}</p>
          <p className={styles.mastheadMeta}>
            {stories.length} stories
            {newest ? ` · Latest ${formatPublicationDate(newest.date)}` : ""}
          </p>
        </header>

        {/* ── Cover story ── */}
        {coverVisible && cover && (
          <div className={styles.featured}>
            <h2 className={styles.featuredLabel}>Cover story</h2>
            <InsightFeatureStory story={cover} views={stats[cover.slug]?.views} />
          </div>
        )}

        {/* ── Utilities: search · Topics ▾ · Newest ▾ ── */}
        <div id="latest" className={`${styles.utilities} ${coverVisible ? styles.utilitiesAfterCover : ""}`}>
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

          <div ref={menuRef} className={styles.menuWrap}>
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-controls="insights-filter-menu"
              onClick={() => setMenuOpen((open) => !open)}
              className={`${styles.menuButton} ${filtering ? styles.menuButtonOn : ""}`}
            >
              {menuLabel}
              <span aria-hidden="true" className={styles.menuChevron}>▾</span>
            </button>
            {menuOpen && (
              <div id="insights-filter-menu" className={styles.menuPanel}>
                {!fixedTopic && (
                  <div className={styles.menuGroup}>
                    <span className={styles.menuGroupLabel}>Topic</span>
                    <div className={styles.topics} role="group" aria-label="Filter by topic">
                      <FilterButton active={topic === "all"} onClick={() => { setTopic("all"); setPage(1); }}>All</FilterButton>
                      {allTopics.map((value) => (
                        <FilterButton key={value.slug} active={topic === value.slug} onClick={() => { setTopic(value.slug); setPage(1); }}>
                          {value.label} <span className={styles.menuCount}>{value.count}</span>
                        </FilterButton>
                      ))}
                    </div>
                  </div>
                )}
                <div className={styles.menuGroup}>
                  <span className={styles.menuGroupLabel}>Type</span>
                  <div className={styles.topics} role="group" aria-label="Filter by type">
                    <FilterButton active={type === "all"} onClick={() => { setType("all"); setPage(1); }}>All</FilterButton>
                    {allTypes.map((value) => (
                      <FilterButton key={value} active={type === value} onClick={() => { setType(value); setPage(1); }}>
                        {publicationTypeLabel(value, true)}
                      </FilterButton>
                    ))}
                  </div>
                </div>
                {filtering && (
                  <button type="button" onClick={() => { setType("all"); if (!fixedTopic) setTopic("all"); setPage(1); }} className={styles.menuClear}>
                    <X aria-hidden="true" className="h-3 w-3" /> Clear filters
                  </button>
                )}
              </div>
            )}
          </div>

          <select
            aria-label="Sort stories"
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

        {/* Active filters, as removable chips, only when there are any. */}
        {(filtering || query.trim()) && (
          <div className={styles.activeRow}>
            {type !== "all" && (
              <button type="button" onClick={() => { setType("all"); setPage(1); }} className={styles.activeChip}>
                {publicationTypeLabel(type, true)} <X aria-hidden="true" className="h-3 w-3" />
              </button>
            )}
            {!fixedTopic && activeTopic !== "all" && (
              <button type="button" onClick={() => { setTopic("all"); setPage(1); }} className={styles.activeChip}>
                {activeTopicLabel} <X aria-hidden="true" className="h-3 w-3" />
              </button>
            )}
            <span className={styles.resultQuiet} aria-live="polite">{resultText}</span>
            <button type="button" onClick={reset} className={styles.clear}>
              Clear all
            </button>
          </div>
        )}
        {!(filtering || query.trim()) && (
          <span className="sr-only" aria-live="polite">{resultText}</span>
        )}

        {visible.length > 0 && (
          <div className={styles.latestSection}>
            {(fixedTopic || !coverVisible) && (
              <h2 className={styles.gridHeading}>
                {fixedTopic
                  ? `Latest in ${allTopics.find((item) => item.slug === fixedTopic)?.label ?? "this topic"}`
                  : query.trim()
                    ? `Stories matching “${query.trim()}”`
                    : "Stories"}
              </h2>
            )}
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
            <p className={styles.emptyTitle}>No stories match this signal.</p>
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

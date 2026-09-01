"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, Rows3, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { allPublications, type Publication } from "@/data/publications";
import {
  allPublishers,
  allTopics,
  allYears,
  dateSortKey,
  topicsFor,
} from "./topics";
import { PublicationCard } from "./PublicationCard";
import { PublicationListItem } from "./PublicationListItem";

type View = "grid" | "list";
type Sort = "newest" | "oldest";

/**
 * The research library: search + topic/year/publisher filters, a
 * newest-first LATEST RESEARCH strip, and the full collection in either the
 * visual grid (default) or the compact scholarly list. The active view is
 * mirrored into ?view= so back/forward navigation restores it.
 */
export function PublicationLibrary() {
  const [view, setView] = useState<View>("grid");
  const [sort, setSort] = useState<Sort>("newest");
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [year, setYear] = useState("all");
  const [publisher, setPublisher] = useState("all");

  // Restore the view from the URL on mount; keep it there on change.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("view");
    if (fromUrl === "list" || fromUrl === "grid") setView(fromUrl);
  }, []);

  const changeView = (next: View) => {
    setView(next);
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    window.history.replaceState(null, "", url.toString());
  };

  const filtersActive =
    query.trim() !== "" || topic !== "all" || year !== "all" || publisher !== "all";

  const clearFilters = () => {
    setQuery("");
    setTopic("all");
    setYear("all");
    setPublisher("all");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = allPublications.filter((p) => {
      if (topic !== "all" && !topicsFor(p).includes(topic)) return false;
      if (year !== "all" && String(p.year) !== year) return false;
      if (publisher !== "all" && p.publisher !== publisher) return false;
      if (q) {
        const haystack = [
          p.title,
          p.venue,
          p.publisher,
          ...p.authors,
          ...(p.keywords ?? []),
          ...topicsFor(p),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return matches.sort((a, b) =>
      sort === "newest"
        ? dateSortKey(b) - dateSortKey(a)
        : dateSortKey(a) - dateSortKey(b)
    );
  }, [query, topic, year, publisher, sort]);

  // Latest three by real publication date — shown only in the unfiltered view.
  const latest = useMemo(
    () =>
      [...allPublications]
        .sort((a, b) => dateSortKey(b) - dateSortKey(a))
        .slice(0, 3),
    []
  );
  const rest = useMemo(
    () => filtered.filter((p) => !latest.some((l) => l.id === p.id)),
    [filtered, latest]
  );
  const showLatest = !filtersActive && sort === "newest";

  return (
    <div>
      {/* ---------------- control bar ---------------- */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <div className="relative min-w-0 flex-1 sm:max-w-[300px] sm:flex-none sm:basis-[300px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-soft-mute" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search publications…"
            aria-label="Search publications"
            className="publib-input w-full pl-10"
          />
        </div>

        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          aria-label="Filter by topic"
          className="publib-select"
        >
          <option value="all">All topics</option>
          {allTopics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          aria-label="Filter by year"
          className="publib-select"
        >
          <option value="all">All years</option>
          {allYears.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={publisher}
          onChange={(e) => setPublisher(e.target.value)}
          aria-label="Filter by publisher"
          className="publib-select"
        >
          <option value="all">All publishers</option>
          {allPublishers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Sort order"
          className="publib-select"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-soft-mute/80">
            View
          </span>
          <div
            className="inline-flex items-center gap-0.5 rounded-full border border-white/12 bg-white/[0.02] p-1"
            role="tablist"
            aria-label="Library view"
          >
            <button
              role="tab"
              aria-selected={view === "grid"}
              onClick={() => changeView("grid")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                view === "grid"
                  ? "bg-cyan-300/12 text-cyan-200"
                  : "text-soft-mute hover:text-soft-white"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Grid
            </button>
            <button
              role="tab"
              aria-selected={view === "list"}
              onClick={() => changeView("list")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                view === "list"
                  ? "bg-cyan-300/12 text-cyan-200"
                  : "text-soft-mute hover:text-soft-white"
              )}
            >
              <Rows3 className="h-3.5 w-3.5" />
              List
            </button>
          </div>
        </div>
      </div>

      {/* result count */}
      <div className="mt-4 text-xs text-soft-mute" aria-live="polite">
        {filtered.length}{" "}
        {filtered.length === 1 ? "publication" : "publications"}
        {filtersActive && (
          <>
            {" · "}
            <button
              onClick={clearFilters}
              className="font-semibold text-cyan-300 transition-colors hover:text-cyan-200"
            >
              Clear filters
            </button>
          </>
        )}
      </div>

      {/* ---------------- empty state ---------------- */}
      {filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-12 text-center">
          <div className="text-sm text-soft-gray">
            No publications match these filters.
          </div>
          <button
            onClick={clearFilters}
            className="mt-4 inline-flex items-center rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-1.5 text-xs font-semibold text-cyan-200 transition-all hover:border-cyan-300/60 hover:bg-cyan-300/15"
          >
            Clear filters
          </button>
        </div>
      ) : view === "grid" ? (
        <>
          {showLatest && (
            <LibrarySection label="Latest research">
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {latest.map((p, i) => (
                  <PublicationCard key={p.id} publication={p} priority={i === 0} />
                ))}
              </div>
            </LibrarySection>
          )}
          <LibrarySection
            label={showLatest ? "All publications" : "Results"}
          >
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {(showLatest ? rest : filtered).map((p) => (
                <PublicationCard key={p.id} publication={p} />
              ))}
            </div>
          </LibrarySection>
        </>
      ) : (
        <LibrarySection label="All publications">
          <div className="border-t border-white/[0.06]">
            {filtered.map((p) => (
              <PublicationListItem key={p.id} publication={p} />
            ))}
          </div>
        </LibrarySection>
      )}
    </div>
  );
}

function LibrarySection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-soft-mute">
        {label}
      </h2>
      {children}
    </section>
  );
}

export type { Publication };

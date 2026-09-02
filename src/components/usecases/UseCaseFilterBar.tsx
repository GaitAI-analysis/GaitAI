"use client";

import { Search, X } from "lucide-react";
import { activeFacets, type UseCaseFacet } from "@/data/usecase-facets";
import styles from "./usecases.module.css";

export type FamilyFilter = "all" | "mobilitycare" | "securevision";

/**
 * Discovery controls: a search field, the two family tabs and the facet
 * chips. Presentational — the explorer owns the state.
 *
 * The chips are `aria-pressed` buttons in a group rather than a listbox: they
 * are one-at-a-time filters over a visible grid, and a reader needs to hear
 * which one is on, not navigate a widget.
 */
export function UseCaseFilterBar({
  query,
  onQuery,
  family,
  onFamily,
  facet,
  onFacet,
  counts,
  shown,
  total,
  onReset,
}: {
  query: string;
  onQuery: (v: string) => void;
  family: FamilyFilter;
  onFamily: (v: FamilyFilter) => void;
  facet: UseCaseFacet | "all";
  onFacet: (v: UseCaseFacet | "all") => void;
  counts: { mobilitycare: number; securevision: number; all: number };
  shown: number;
  total: number;
  onReset: () => void;
}) {
  const dirty = query !== "" || family !== "all" || facet !== "all";

  const families: Array<{ id: FamilyFilter; label: string; n: number }> = [
    { id: "all", label: "All environments", n: counts.all },
    { id: "mobilitycare", label: "MobilityCare", n: counts.mobilitycare },
    { id: "securevision", label: "SecureVision", n: counts.securevision },
  ];

  return (
    <div className={styles.filterBar}>
      <div className={styles.filterTop}>
        <div className={styles.searchWrap}>
          <Search aria-hidden="true" className={styles.searchIcon} />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search environments, products or outputs…"
            aria-label="Search environments"
            className={styles.search}
          />
        </div>

        <div className={styles.familyTabs} role="group" aria-label="Product family">
          {families.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFamily(f.id)}
              aria-pressed={family === f.id}
              className={`${styles.familyTab} ${
                family === f.id ? styles.familyTabOn : ""
              }`}
            >
              {f.label}
              <span className={styles.familyCount}>{f.n}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.chipsRow} role="group" aria-label="Filter by type">
        <button
          type="button"
          onClick={() => onFacet("all")}
          aria-pressed={facet === "all"}
          className={`${styles.facetChip} ${
            facet === "all" ? styles.facetChipOn : ""
          }`}
        >
          All
        </button>
        {activeFacets.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFacet(f)}
            aria-pressed={facet === f}
            className={`${styles.facetChip} ${
              facet === f ? styles.facetChipOn : ""
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className={styles.resultRow} aria-live="polite">
        <span>
          {shown === total
            ? `${total} environments`
            : `${shown} of ${total} environments`}
        </span>
        {dirty && (
          <button type="button" onClick={onReset} className={styles.clear}>
            <X aria-hidden="true" className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

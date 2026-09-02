"use client";

import { useMemo, useState } from "react";
import { InsightCard } from "./InsightCard";
import {
  TOPIC_FILTERS,
  type InsightArticle,
  type InsightTopic,
} from "@/data/insights";

/**
 * The Insights landing library.
 *
 * Newest article is presented as a wide featured card; the rest fall into a
 * 2 × 2 grid. Topic filters are compact and few on purpose — the section is an
 * editorial index, not a taxonomy browser. When a filter is applied the
 * featured treatment is dropped so results read as one uniform set.
 */
export function InsightsLibrary({ articles }: { articles: InsightArticle[] }) {
  const [active, setActive] = useState<InsightTopic | "all">("all");

  const filtered = useMemo(
    () =>
      active === "all"
        ? articles
        : articles.filter((article) => article.topics.includes(active)),
    [articles, active],
  );

  const showFeatured = active === "all" && filtered.length > 1;
  const featured = showFeatured ? filtered[0] : null;
  const rest = showFeatured ? filtered.slice(1) : filtered;

  return (
    <div>
      {/* ── Topic filters ── */}
      <div
        role="group"
        aria-label="Filter insights by topic"
        className="flex flex-wrap items-center gap-2"
      >
        {TOPIC_FILTERS.map((filter) => {
          const isActive = active === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActive(filter.key)}
              aria-pressed={isActive}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-300 ${
                isActive
                  ? "border-cyan-300/50 bg-cyan-300/[0.08] text-cyan-300"
                  : "border-white/10 bg-white/[0.02] text-soft-mute hover:border-white/20 hover:text-soft-white"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* ── Featured ── */}
      {featured && (
        <div className="mt-10">
          <InsightCard article={featured} featured eager />
        </div>
      )}

      {/* ── Grid ── */}
      {rest.length > 0 && (
        <>
          {showFeatured && (
            <div className="mt-20 flex items-center gap-5">
              <h2 className="font-display text-xl text-soft-white sm:text-2xl">
                Latest from the lab
              </h2>
              <span
                aria-hidden
                className="h-px flex-1 bg-gradient-to-r from-soft-mute/25 to-transparent"
              />
            </div>
          )}
          <div
            className={`grid gap-5 sm:gap-6 lg:grid-cols-2 ${
              showFeatured ? "mt-8" : "mt-10"
            }`}
          >
            {rest.map((article) => (
              <InsightCard key={article.slug} article={article} />
            ))}
          </div>
        </>
      )}

      {filtered.length === 0 && (
        <p className="mt-12 rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center text-sm text-soft-mute">
          Nothing under this topic yet. Choose{" "}
          <button
            type="button"
            onClick={() => setActive("all")}
            className="font-medium text-cyan-300 underline decoration-cyan-300/40 underline-offset-4"
          >
            All
          </button>{" "}
          to see every article.
        </p>
      )}
    </div>
  );
}

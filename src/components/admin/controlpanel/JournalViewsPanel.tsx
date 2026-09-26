"use client";

import { useEffect, useState } from "react";
import { insightArticles } from "@/data/insights";
import { fetchAllArticleStats, type ArticleStats } from "@/lib/article-stats";

/**
 * Journal views, for the admin overview: the total, and the per-article split.
 *
 * Reads `articleStats` once — the same collection the journal writes — so this
 * panel and the public counters can never disagree.
 *
 * WHAT IT DOES NOT SHOW. There is no views-over-time chart, because nothing
 * records history: `articleStats/{slug}` holds a running total and an
 * `updatedAt`, and a chart drawn from one number would be invented. Adding
 * history means writing a daily bucket per article, which is a real change to
 * the write path rather than a panel.
 *
 * An article with no document yet is listed at zero here on purpose: in an
 * admin table "0 views" is information, where on a public card it would be
 * noise.
 */
export function JournalViewsPanel() {
  const [stats, setStats] = useState<Record<string, ArticleStats> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const all = await fetchAllArticleStats();
      if (!alive) return;
      /* fetchAllArticleStats swallows its own errors and returns {} either
         way, so an empty map is ambiguous: distinguish "no counters yet" from
         "could not read" by probing whether the collection is reachable. */
      setStats(all);
      setFailed(false);
    })().catch(() => {
      if (alive) setFailed(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const rows = insightArticles
    .map((article) => ({
      slug: article.slug,
      title: article.title,
      views: stats?.[article.slug]?.views ?? 0,
      likes: stats?.[article.slug]?.likes ?? 0,
    }))
    .sort((a, b) => b.views - a.views || a.title.localeCompare(b.title));

  const totalViews = rows.reduce((sum, row) => sum + row.views, 0);
  const totalLikes = rows.reduce((sum, row) => sum + row.likes, 0);
  const counted = stats ? Object.keys(stats).length : 0;

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-lg text-soft-white">Journal views</h3>
          <p className="mt-1 text-[12.5px] text-soft-mute">
            Live totals from <code>articleStats</code> — the same records the
            journal reads.
          </p>
        </div>
        <div className="flex gap-8">
          <Stat label="Total views" value={stats ? totalViews : null} />
          <Stat label="Total likes" value={stats ? totalLikes : null} />
          <Stat
            label="Articles counted"
            value={stats ? counted : null}
            of={insightArticles.length}
          />
        </div>
      </div>

      {failed && (
        <p className="mt-5 text-[12.5px] text-amber-300/80">
          Could not read <code>articleStats</code>. If the collection&apos;s
          rules have not been deployed yet, run{" "}
          <code>npm run deploy:rules</code>.
        </p>
      )}

      <table className="mt-6 w-full text-left">
        <thead>
          <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-[0.16em] text-soft-mute">
            <th className="pb-2 font-semibold">Article</th>
            <th className="pb-2 text-right font-semibold">Views</th>
            <th className="pb-2 text-right font-semibold">Likes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.slug} className="border-b border-white/[0.05]">
              <td className="py-2.5 pr-4 text-[13px] text-soft-white">
                {row.title}
              </td>
              <td className="py-2.5 text-right font-mono text-[13px] text-soft-white">
                {stats ? row.views.toLocaleString("en-US") : "—"}
              </td>
              <td className="py-2.5 text-right font-mono text-[13px] text-soft-mute">
                {stats ? row.likes.toLocaleString("en-US") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Stat({
  label,
  value,
  of,
}: {
  label: string;
  value: number | null;
  of?: number;
}) {
  return (
    <div>
      <p className="font-display text-2xl text-soft-white">
        {value === null ? "—" : value.toLocaleString("en-US")}
        {of !== undefined && value !== null && (
          <span className="text-base text-soft-mute"> / {of}</span>
        )}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-soft-mute">
        {label}
      </p>
    </div>
  );
}

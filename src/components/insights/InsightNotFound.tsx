"use client";

import Link from "next/link";
import { insightArticles, insightHref } from "@/data/insights";
import { SEARCH_EVENT } from "@/components/search/IntelligenceSearch";
import styles from "./journal.module.css";

/**
 * The editorial recovery for an Insights slug that no longer resolves.
 *
 *   This signal left the archive.
 *
 * Then the three ways back a reader actually wants: the journal, the
 * Foundations path, and search. Rendered by the global not-found page when
 * the path looks like /insights/<slug>/; nothing here is a generic 404 icon.
 */
export function InsightNotFound({ slug }: { slug: string }) {
  const foundations = [...insightArticles].sort((a, b) => a.seriesStep - b.seriesStep);
  const openSearch = () => {
    window.dispatchEvent(new CustomEvent(SEARCH_EVENT));
  };

  return (
    <div className={`${styles.journal} site-page-intro-roomy container-wide pb-24`}>
      <div className="max-w-3xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300">GaitAI Insights · 404</p>
        <svg aria-hidden="true" viewBox="0 0 320 24" className="mt-6 h-6 w-80 max-w-full overflow-visible">
          <path
            d="M0 12 C10 12 12 4 20 4 S32 20 40 20 S52 4 60 4 S72 20 80 20 S92 4 100 4 S112 20 120 20 S132 12 140 12 H170"
            fill="none"
            stroke="#4fd1ff"
            strokeWidth="1.4"
          />
          {[186, 206, 228, 252, 280].map((x, i) => (
            <circle key={x} cx={x} cy={12 + (i % 2 ? 3 : -3) * (i + 1) * 0.6} r={1.8 - i * 0.25} fill="#94a3b8" opacity={0.9 - i * 0.16} />
          ))}
        </svg>
        <h1 className="mt-6 font-display text-display-md text-balance text-soft-white">This story left the archive.</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-soft-gray">
          There is no story at <span className="font-mono text-[0.85em] text-soft-white">/insights/{slug}/</span>. It
          may have moved, or the link may have been mistyped. Every published story is still one of these.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/insights" className="btn-primary">
            Return to Blog
          </Link>
          <Link href="/insights/start-here" className="btn-ghost">
            Explore Foundations
          </Link>
          <button type="button" onClick={openSearch} className="btn-ghost">
            Search stories
          </button>
        </div>
      </div>

      <div className="mt-14 border-t border-white/[0.07] pt-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300">Current Foundations</p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {foundations.map((article) => (
            <li key={article.slug}>
              <Link
                href={insightHref(article.slug)}
                className="group block h-full rounded-xl border border-white/10 p-4 transition-colors hover:border-cyan-300/50 focus-visible:border-cyan-300/50 focus-visible:outline-none"
              >
                <span className="font-mono text-[10px] tracking-[0.18em] text-violet-300">
                  {String(article.seriesStep).padStart(2, "0")}
                </span>
                <span className="mt-2 block text-[0.9375rem] font-medium leading-snug text-soft-white group-hover:text-cyan-300">
                  {article.title}
                </span>
                <span className="mt-1.5 block text-[0.8125rem] text-soft-mute">{article.seriesTitle}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

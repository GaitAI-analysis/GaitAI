import Link from "next/link";
import type { InsightArticle } from "@/data/insights";
import { insightHref } from "@/data/insights";
import styles from "./journal.module.css";

/**
 * "New to GaitAI? Start here." — the five essays as a reading path.
 *
 * The five pieces do build an argument in order — how movement becomes
 * intelligence, what a walk carries beyond identity, why privacy sits in the
 * architecture, why change over time matters, how to audit a multimodal claim
 * — so the path is offered as a route rather than five more cards. Each step
 * is titled by what it teaches, not by its headline.
 *
 * Nothing here implies the essays depend on each other academically: they are
 * readable in any order, and the path is a suggestion for a first visit.
 *
 * A drawn track connects the steps — horizontal from 900px, vertical below,
 * which is the only honest way to show a sequence on a phone.
 */
export function StartHere({ articles }: { articles: InsightArticle[] }) {
  const path = [...articles].sort((a, b) => a.seriesStep - b.seriesStep);

  return (
    <ol className={styles.pathRail}>
      {path.map((article) => (
        <li key={article.slug} className={styles.pathStep}>
          <span aria-hidden="true" className={styles.pathNode} />
          <Link href={insightHref(article.slug)} className="block">
            <span className={styles.pathIndex}>
              {String(article.seriesStep).padStart(2, "0")}
            </span>
            <span className={styles.pathTitle}>{article.seriesTitle}</span>
            <span className={styles.pathMeta}>
              {article.category} · {article.readMinutes} min
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

import Link from "next/link";
import {
  FusionVisual,
  IdentityFieldVisual,
  PrivacyLayersVisual,
  TrajectoryVisual,
} from "./StoryVisuals";
import styles from "./landing.module.css";

/**
 * The remaining four essays as four editorial modules — not four cards.
 *
 * A 2×2 of equal rectangles makes four different arguments look like four
 * instances of one thing, which is exactly what made the old index
 * predictable. Each story here gets its own composition and its own drawn
 * visual of its own thesis: the identity field, the privacy transformation,
 * the longitudinal trend, the fusion audit. Read with the type covered, the
 * four pictures still tell four different stories.
 *
 * The layout alternates and the weights differ — the first module runs wide,
 * the next two share a row, the last runs wide again — so the section has a
 * rhythm instead of a grid. No panel, no border, no button: the whole module
 * is the link.
 */

export type ModuleArticle = {
  slug: string;
  step: number;
  issueLabel: string;
  title: string;
  question: string;
  excerpt: string;
  readMinutes: number;
  ctaLabel: string;
};

const SCENE: Record<string, () => React.ReactElement> = {
  "your-walk-is-more-than-a-biometric": IdentityFieldVisual,
  "movement-intelligence-without-identification": PrivacyLayersVisual,
  "fall-risk-is-a-trend-not-a-number": TrajectoryVisual,
  "when-fusion-looks-better-than-it-is": FusionVisual,
};

/** Wide, pair, pair, wide — the rhythm of the section. */
const SPAN = ["wide", "half", "half", "wide"] as const;

export function StoryModules({ articles }: { articles: ModuleArticle[] }) {
  return (
    <div className={styles.modules}>
      {articles.map((article, i) => {
        const Scene = SCENE[article.slug];
        const span = SPAN[i] ?? "half";
        return (
          <article
            key={article.slug}
            className={`${styles.module} ${
              span === "wide" ? styles.moduleWide : styles.moduleHalf
            } ${i % 2 === 1 ? styles.moduleFlip : ""}`}
          >
            <Link href={`/insights/${article.slug}/`} className={styles.moduleLink}>
              <div className={styles.moduleCopy}>
                <p className={styles.moduleIssue}>
                  <span className={styles.moduleIssueNo}>
                    {String(article.step).padStart(2, "0")}
                  </span>
                  <span aria-hidden="true">/</span>
                  {article.issueLabel}
                  <span aria-hidden="true" className={styles.moduleIssueRule} />
                  <span className={styles.moduleTime}>
                    {article.readMinutes} min
                  </span>
                </p>

                <h3 className={styles.moduleTitle}>{article.title}</h3>
                <p className={styles.moduleQuestion}>{article.question}</p>
                <p className={styles.moduleExcerpt}>{article.excerpt}</p>

                <span className={styles.moduleCta}>
                  {article.ctaLabel}
                  <span aria-hidden="true" className={styles.moduleCtaArrow}>
                    →
                  </span>
                </span>
              </div>

              {Scene && (
                <figure className={styles.moduleStage}>
                  <Scene />
                </figure>
              )}
            </Link>
          </article>
        );
      })}
    </div>
  );
}

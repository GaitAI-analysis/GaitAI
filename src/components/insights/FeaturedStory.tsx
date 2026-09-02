/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import type { InsightArticle } from "@/data/insights";
import { insightHref } from "@/data/insights";
import { assetPath } from "@/lib/paths";
import styles from "./journal.module.css";

/**
 * The featured story: the first thing under the masthead, and the reason to
 * stay.
 *
 * The image runs the full width of the container at 21:9 and carries the type
 * inside it — a scrim, not a panel, so nothing sits in a box on top of a
 * picture. The right column answers "why should I read this?" before the
 * reader has to guess: three things they will learn, drawn from the article's
 * own sections.
 *
 * The whole surface is one link; the visible headline is its accessible name.
 * The image loads eagerly and is the page's LCP candidate, so it is the only
 * eager image on the route.
 */
export function FeaturedStory({
  article,
  chain,
}: {
  article: InsightArticle;
  /** The article's own argument as a chain of stages, e.g. capture → pose. */
  chain?: string[];
}) {
  return (
    <article className={styles.feature}>
      <div className={styles.featureMedia}>
        <img
          src={assetPath(article.hero.src)}
          alt={article.hero.alt}
          width={article.hero.width}
          height={article.hero.height}
          loading="eager"
          // eslint-disable-next-line react/no-unknown-property
          fetchPriority="high"
          decoding="async"
          sizes="100vw"
        />
        <span aria-hidden="true" className={styles.featureScrim} />
      </div>

      <div className={styles.featureBody}>
        <div className="min-w-0">
          <p className={styles.kicker}>
            <span aria-hidden="true" className={styles.kickerRule} />
            Featured · {article.category} · {article.readMinutes} min
          </p>

          <h2 className={styles.featureTitle}>
            <Link href={insightHref(article.slug)} className={styles.cardLink}>
              {article.title}
            </Link>
          </h2>

          {article.subtitle && <p className={styles.featureSub}>{article.subtitle}</p>}

          {chain && chain.length > 0 && (
            <p className={styles.featureChain}>
              {chain.map((step, i) => (
                <span key={step}>
                  {i > 0 && (
                    <span aria-hidden="true" className={styles.featureChainArrow}>
                      {" → "}
                    </span>
                  )}
                  {step}
                </span>
              ))}
            </p>
          )}

          <div className={styles.featureCta}>
            <span className={styles.featureCtaLabel}>
              {article.ctaLabel}
              <span aria-hidden="true" className={styles.featureCtaArrow}>
                →
              </span>
            </span>
          </div>
        </div>

        <div className={styles.hooks}>
          <p className={styles.hooksLabel}>You&apos;ll learn</p>
          <ul className={styles.hookList}>
            {article.hooks.map((hook) => (
              <li key={hook} className={styles.hookItem}>
                <span aria-hidden="true" className={styles.hookMark} />
                <span>{hook}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

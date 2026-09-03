/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import type { InsightArticle } from "@/data/insights";
import {
  INSIGHTS_AUTHOR,
  POST_TYPE_LABEL,
  formatInsightDate,
  insightHref,
} from "@/data/insights";
import { assetPath } from "@/lib/paths";
import styles from "./journal.module.css";

/**
 * One story, in one of four footprints.
 *
 * The variants exist so the index can give stories different weight without
 * four different components: `tall` and `standard` sit side by side, `wide`
 * runs across two columns with the image beside the copy, and `full` takes the
 * whole row for the piece that deserves it. Everything else — the accent, the
 * metadata line, the hooks, the contextual call to action — is shared, so the
 * grid varies in proportion without varying in language.
 *
 * The card is one link target: an absolutely positioned anchor covers the
 * surface, and the visible heading carries the accessible name. Hover moves
 * the image 1.5%, lifts the card 2px and brightens the topic accent. Nothing
 * tilts, nothing glows.
 */

export type StoryVariant = "standard" | "tall" | "wide" | "full";

const TOPIC_CLASS: Record<string, string> = {
  "movement-intelligence": styles.tMovement,
  "responsible-ai": styles.tResponsible,
  mobility: styles.tMobility,
  research: styles.tResearch,
};

const VARIANT_CLASS: Record<StoryVariant, string> = {
  standard: "",
  tall: styles.cardTall,
  wide: styles.cardWide,
  full: styles.cardFull,
};

/** How many hooks each footprint has room for. */
const HOOKS: Record<StoryVariant, number> = {
  standard: 0,
  tall: 2,
  wide: 2,
  full: 3,
};

export function StoryCard({
  article,
  variant = "standard",
  priority = false,
  commentCount,
}: {
  article: InsightArticle;
  variant?: StoryVariant;
  /**
   * Real approved-comment count, or undefined. Undefined and zero both render
   * nothing: a count that is really a loading state would be a false statement
   * about a record, and "0 comments" on every card in a young journal is noise.
   */
  commentCount?: number;
  /** Above-the-fold cards load eagerly; everything else waits. */
  priority?: boolean;
}) {
  const topic = TOPIC_CLASS[article.topics[0]] ?? styles.tMovement;
  const hookCount = HOOKS[variant];

  /* The card leads with what the piece IS — the taxonomy a reader of a
     publication scans for. The subject label follows only where it says
     something the type does not; on "Technical Essay" pieces filed under
     "Technical Essay" it would just be the same words twice. */
  const typeLabel = POST_TYPE_LABEL[article.postType];
  const subject = article.category === typeLabel ? null : article.category;

  return (
    <article className={`${styles.card} ${VARIANT_CLASS[variant]} ${topic}`}>
      <span aria-hidden="true" className={styles.cardAccent} />

      <div className={styles.cardMedia}>
        <img
          src={assetPath(article.hero.src)}
          alt=""
          width={article.hero.width}
          height={article.hero.height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          sizes="(min-width: 1024px) 45vw, (min-width: 640px) 50vw, 100vw"
        />
        <span aria-hidden="true" className={styles.cardMediaScrim} />
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span className={styles.cardCategory}>{typeLabel}</span>
          {subject && (
            <>
              <span aria-hidden="true">·</span>
              <span>{subject}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <time dateTime={article.date}>{formatInsightDate(article.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{article.readMinutes} min read</span>
          {typeof commentCount === "number" && commentCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {commentCount} {commentCount === 1 ? "comment" : "comments"}
              </span>
            </>
          )}
        </div>

        <h3 className={styles.cardTitle}>
          <Link href={insightHref(article.slug)} className={styles.cardLink}>
            {article.title}
          </Link>
        </h3>

        <p className={styles.cardByline}>{INSIGHTS_AUTHOR}</p>

        {variant !== "standard" && (
          <p className={styles.cardExcerpt}>{article.excerpt}</p>
        )}

        {hookCount > 0 && (
          <ul className={styles.cardHooks}>
            {article.hooks.slice(0, hookCount).map((hook) => (
              <li key={hook} className={styles.cardHook}>
                <span aria-hidden="true" className={styles.hookMark} />
                <span>{hook}</span>
              </li>
            ))}
          </ul>
        )}

        <span className={styles.cardCta}>
          {article.ctaLabel}
          <span aria-hidden="true" className={styles.cardCtaArrow}>
            →
          </span>
        </span>
      </div>
    </article>
  );
}

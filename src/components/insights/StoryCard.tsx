/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { formatCount } from "@/lib/article-stats";
import type { InsightArticle } from "@/data/insights";
import {
  INSIGHTS_AUTHOR,
  POST_TYPE_LABEL,
  formatInsightDate,
  insightHref,
} from "@/data/insights";
import { CardStats } from "./CardStats";
import { JournalCover } from "./JournalCover";
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
  views,
  likes,
  liveStats = false,
}: {
  article: InsightArticle;
  variant?: StoryVariant;
  /**
   * Real approved-comment count, or undefined. Undefined and zero both render
   * nothing: a count that is really a loading state would be a false statement
   * about a record, and "0 comments" on every card in a young journal is noise.
   */
  commentCount?: number;
  /** Real view and like counts, or undefined while unknown. A view count of
      zero IS shown once known; an unknown one is not. Likes show above zero
      only — see ArticleEngagementMeta for why. */
  views?: number;
  likes?: number;
  /** Fetch this card's own counters instead of being handed them. For cards
      outside the archive listing — the two at the foot of an article — which
      have no page-level stats hook above them. */
  liveStats?: boolean;
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

      {/* The essay's own drawn cover. It was the raster hero, and four of the
          five rasters were the same glowing walker — side by side in this grid
          the archive read as a template. These are five different
          compositions, and being vector they cost no image request and cannot
          arrive blurry or badly cropped at any card width. */}
      <div className={styles.cardMedia}>
        <JournalCover concept={article.cover.concept} />
        <span aria-hidden="true" className={styles.cardMediaScrim} />
      </div>

      <div className={styles.cardBody}>
{/* Date first, then the subject, then whatever engagement is real. The
            type label ("Technical Essay") and the read time were removed from
            every card: the type is already what the filter chips select on, and
            a read time is a promise about the reader rather than a fact about
            the piece. */}
        <div className={styles.cardMeta}>
          <time className={styles.cardCategory} dateTime={article.date}>
            {formatInsightDate(article.date)}
          </time>
          {subject && (
            <>
              <span aria-hidden="true">·</span>
              <span>{subject}</span>
            </>
          )}
          {/* A genuine zero is shown as "0 views", not hidden: on a card the
              reader is not the subject, so nought is a true and useful
              number. The field is absent only when the count is unknown —
              which is what `undefined` means here, Firestore being
              unreachable or not yet answered. */}
          {typeof views === "number" ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatCount(views, "view")}</span>
            </>
          ) : (
            liveStats && <CardStats slug={article.slug} />
          )}
          {typeof likes === "number" && likes > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatCount(likes, "like")}</span>
            </>
          )}
          {typeof commentCount === "number" && commentCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatCount(commentCount, "comment")}</span>
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

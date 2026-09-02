import Image from "next/image";
import Link from "next/link";
import { assetPath } from "@/lib/paths";
import styles from "./landing.module.css";

/**
 * The lead essay as a cover, not a card.
 *
 * Full measure, type on the left, the artwork bleeding off the right edge
 * behind a soft mask so it reads as a printed cover rather than as a
 * thumbnail in a frame. The issue line, the read time and the essay's own
 * call to action sit on the type side; the contents of the story sit under
 * them, so a reader can see what they are about to learn before opening it.
 *
 * "Inside this story" is the article's own section list — numbers and nav
 * labels straight off `sections` — so it cannot drift from the essay.
 */

export type CoverArticle = {
  slug: string;
  step: number;
  issueLabel: string;
  title: string;
  titleAccent: string;
  subtitle?: string;
  question: string;
  deck: string;
  readMinutes: number;
  ctaLabel: string;
  hero: { src: string; alt: string };
  contents: { number: string; label: string }[];
};

export function FeatureCover({ article }: { article: CoverArticle }) {
  /* The accent is a trailing fragment of the title, so the head splits into
     the part set in ink and the part set in the spectrum. */
  const head = article.title.endsWith(article.titleAccent)
    ? article.title.slice(0, -article.titleAccent.length).trimEnd()
    : article.title;
  const accent = head === article.title ? "" : article.titleAccent;

  return (
    <article className={styles.cover}>
      <div className={styles.coverArt}>
        <Image
          src={assetPath(article.hero.src)}
          alt={article.hero.alt}
          fill
          sizes="(min-width: 1100px) 58vw, 100vw"
          className={styles.coverImg}
          priority
        />
        <span aria-hidden="true" className={styles.coverScrim} />
      </div>

      <div className={styles.coverBody}>
        <p className={styles.coverIssue}>
          <span className={styles.coverIssueNo}>
            Issue {String(article.step).padStart(2, "0")}
          </span>
          <span aria-hidden="true" className={styles.coverIssueRule} />
          {article.issueLabel}
        </p>

        <h3 className={styles.coverTitle}>
          {head}
          {accent && (
            <>
              {" "}
              <span className={styles.coverTitleAccent}>{accent}</span>
            </>
          )}
        </h3>

        {article.subtitle && (
          <p className={styles.coverSub}>{article.subtitle}</p>
        )}

        <p className={styles.coverDeck}>{article.deck}</p>

        <div className={styles.coverFoot}>
          <Link href={`/insights/${article.slug}/`} className={styles.coverCta}>
            {article.ctaLabel}
            <span aria-hidden="true" className={styles.coverCtaArrow}>
              →
            </span>
          </Link>
          <span className={styles.coverTime}>
            {article.readMinutes} min read
          </span>
        </div>

        <div className={styles.coverContents}>
          <p className={styles.coverContentsLabel}>Inside this story</p>
          <ol className={styles.coverContentsList}>
            {article.contents.map((item) => (
              <li key={item.number} className={styles.coverContentsItem}>
                <span className={styles.coverContentsNo}>{item.number}</span>
                {item.label}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  );
}

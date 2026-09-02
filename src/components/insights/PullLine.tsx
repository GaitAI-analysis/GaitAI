import Link from "next/link";
import styles from "./landing.module.css";

/**
 * An editorial pacing moment: one line from one essay, at size, alone.
 *
 * These are the page's quiet beats — a big moment, then a still one, then an
 * interaction. No card, no quotation glyph, no attribution block: just the
 * sentence, a hairline, and where it came from.
 *
 * Every line passed in is lifted verbatim from a `quote` block inside the
 * essay it credits, so the index never puts words in an article's mouth.
 */
export function PullLine({
  text,
  source,
  slug,
}: {
  text: string;
  source: string;
  slug: string;
}) {
  return (
    <figure className={styles.pull}>
      <blockquote className={styles.pullText}>{text}</blockquote>
      <figcaption className={styles.pullFrom}>
        <span aria-hidden="true" className={styles.pullRule} />
        <Link href={`/insights/${slug}/`} className={styles.pullLink}>
          {source}
        </Link>
      </figcaption>
    </figure>
  );
}

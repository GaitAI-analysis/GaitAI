import Link from "next/link";
import styles from "./signal.module.css";

/**
 * The journal's editorial furniture: the opening, the two pauses, and the
 * close. Small pieces, kept together because they share one voice — no cards,
 * no borders, no boxes, and type doing the work.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   THE OPENING
   The first viewport is one question and one figure. No lede, no strap line,
   no filter chips, no explanation of what a journal is — the reader gets a
   question they cannot answer, and an invitation to follow it. The context
   the old hero opened with ("research notes, technical essays and…") now
   lives at the foot of the page, where a reader who wants it will look.
   ═══════════════════════════════════════════════════════════════════════════ */

export function JournalOpening({ children }: { children: React.ReactNode }) {
  return (
    <section className={styles.opening} aria-labelledby="journal-question">
      <div className="container-wide">
        <div className={styles.openingGrid}>
          <div className={styles.openingCopy}>
            <p className={styles.masthead}>
              <span aria-hidden="true" className={styles.mastheadRule} />
              GaitAI Journal
              <span className={styles.mastheadSub}>Intelligence in motion</span>
            </p>

            {/* h2, not h1: the archive masthead above now opens the page
                and owns its single h1. This is the narrative section's
                heading, and the section is aria-labelledby it either way. */}
            <h2 id="journal-question" className={styles.openingQuestion}>
              <span className={styles.openingLine}>What does AI</span>
              <span className={styles.openingLine}>see when</span>
              <span className={`${styles.openingLine} ${styles.spectrum}`}>
                you walk?
              </span>
            </h2>

            <Link href="#story-01" className={styles.openingScroll}>
              Scroll to follow the signal
              <span aria-hidden="true" className={styles.openingScrollArrow}>
                ↓
              </span>
            </Link>
          </div>

          <div className={styles.openingStage}>{children}</div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   AN EDITORIAL PAUSE
   One line from one essay, at cover size, on open ground. The signal thread
   runs through it, which is the whole reason it works as a pause rather than
   as an interruption: the page keeps moving while the reader stops.
   ═══════════════════════════════════════════════════════════════════════════ */

export function EditorialPause({
  lines,
  source,
  href,
}: {
  /** Broken into lines by hand: this is typesetting, not a paragraph. */
  lines: string[];
  source: string;
  href: string;
}) {
  return (
    <section className={styles.pause}>
      <div className="container-wide">
        <figure className={styles.pauseFigure}>
          <blockquote className={styles.pauseQuote}>
            {lines.map((line) => (
              <span key={line} className={styles.pauseLine}>
                {line}
              </span>
            ))}
          </blockquote>
          <figcaption className={styles.pauseSource}>
            <Link href={href} className={styles.pauseSourceLink}>
              {source}
            </Link>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE CLOSE
   A journal ends by telling you the signal continues and handing you the
   index. Not a footer grid of cards, and not a newsletter box.
   ═══════════════════════════════════════════════════════════════════════════ */

export function JournalClose({
  entries,
  latestHref,
  latestTitle,
}: {
  entries: { step: number; theme: string; href: string; title: string }[];
  latestHref: string;
  latestTitle: string;
}) {
  return (
    <section className={styles.close} aria-labelledby="journal-close">
      <div className="container-wide">
        <h2 id="journal-close" className={styles.closeTitle}>
          The signal <span className={styles.spectrum}>continues.</span>
        </h2>

        <p className={styles.closeLede}>
          The GaitAI Journal follows the signals: how movement becomes
          evidence, where AI should be trusted, and where it should be
          questioned. Technical essays, research notes, engineering stories and
          updates from the team building GaitAI.
        </p>

        <div className={styles.closeActions}>
          <Link href={entries[0].href} className={styles.closeAction}>
            Start at 01
            <span aria-hidden="true" className={styles.closeActionArrow}>
              →
            </span>
          </Link>
          <Link
            href={latestHref}
            className={`${styles.closeAction} ${styles.closeActionQuiet}`}
            title={latestTitle}
          >
            Enter the latest story
            <span aria-hidden="true" className={styles.closeActionArrow}>
              →
            </span>
          </Link>
        </div>

        {/* The index. A horizontal list of five, not five more cards. */}
        <nav className={styles.index} aria-label="The journal">
          <p className={styles.indexLabel}>The journal</p>
          <ol className={styles.indexList}>
            {entries.map((entry) => (
              <li key={entry.step} className={styles.indexItem}>
                <Link href={entry.href} className={styles.indexLink}>
                  <span className={styles.indexNo}>
                    {String(entry.step).padStart(2, "0")}
                  </span>
                  <span className={styles.indexTheme}>{entry.theme}</span>
                  <span className={styles.indexTitle}>{entry.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
}

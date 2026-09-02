import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./signal.module.css";

/**
 * ONE STORY MOMENT — a near-full-viewport transformation of the signal.
 *
 * Five of these carry the journal. Each is the same three things in the same
 * order, so the reader learns the rhythm once and then reads ideas instead of
 * interfaces:
 *
 *   the question   asked at cover size, in the reader's own words, before
 *                  the essay is named
 *   the naming     issue number, theme, title, and one line of hook
 *   the signal     what the transformation does to the movement signal,
 *                  as a chain of stages rather than a paragraph
 *
 * COMPOSITION. `side` alternates the visual field left and right down the
 * page, which is what lets the signal thread weave between them. There is no
 * card: the field and the copy sit on open ground, separated by space rather
 * than by a border.
 *
 * ACCESSIBILITY. The whole moment is one link, implemented as a stretched
 * pseudo-element on the title's anchor — so the accessible name is the essay's
 * title, the hit area is the section, and there is exactly one tab stop per
 * story. Nothing here depends on hover or on animation: with motion disabled
 * and JavaScript off, every moment is a complete static composition.
 */

export interface StoryMomentProps {
  /** Issue number, 1-based. */
  step: number;
  /** Editorial theme for this issue — a label for the collection. */
  theme: string;
  /** The reader's question, asked before the essay is named. */
  question: string;
  /** Optional accent phrase inside the question, set in the spectrum. */
  questionAccent?: string;
  title: string;
  /** One short line. Never an excerpt, never a bullet list. */
  hook: string;
  /** The transformation, as stages of the signal. */
  chain: string[];
  cta: string;
  href: string;
  /** Which side the visual field sits on. */
  side: "left" | "right";
  /** The drawn transformation. */
  children: ReactNode;
  id: string;
}

/** Splits the question so an accent phrase can be set in the spectrum. */
function Question({ text, accent }: { text: string; accent?: string }) {
  if (!accent) return <>{text}</>;
  const at = text.indexOf(accent);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className={styles.spectrum}>{accent}</span>
      {text.slice(at + accent.length)}
    </>
  );
}

export function StoryMoment({
  step,
  theme,
  question,
  questionAccent,
  title,
  hook,
  chain,
  cta,
  href,
  side,
  children,
  id,
}: StoryMomentProps) {
  const index = String(step).padStart(2, "0");

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`${styles.moment} ${
        side === "left" ? styles.momentLeft : styles.momentRight
      }`}
    >
      <div className="container-wide">
        <div className={styles.momentGrid}>
          {/* ── The visual field ── */}
          <div className={styles.momentStage}>{children}</div>

          {/* ── The editorial column ── */}
          <div className={styles.momentCopy}>
            <h2 className={styles.momentQuestion}>
              <Question text={question} accent={questionAccent} />
            </h2>

            <p className={styles.momentIssue}>
              <span className={styles.momentIssueNo}>{index}</span>
              <span aria-hidden="true" className={styles.momentIssueRule} />
              {theme}
            </p>

            <h3 id={`${id}-title`} className={styles.momentTitle}>
              <Link href={href} className={styles.momentLink}>
                {title}
              </Link>
            </h3>

            <p className={styles.momentHook}>{hook}</p>

            {/* The transformation, named. Stages, not sentences. */}
            <ol className={styles.momentChain}>
              {chain.map((stage, i) => (
                <li key={stage} className={styles.momentChainStep}>
                  {i > 0 && (
                    <span aria-hidden="true" className={styles.momentChainArrow}>
                      ↓
                    </span>
                  )}
                  {stage}
                </li>
              ))}
            </ol>

            <p className={styles.momentCta}>
              {cta}
              <span aria-hidden="true" className={styles.momentCtaArrow}>
                →
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

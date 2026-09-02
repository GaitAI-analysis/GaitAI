import Link from "next/link";
import { ResearchHeroLab } from "./ResearchHeroLab";
import styles from "./observatory.module.css";

/**
 * The research hero.
 *
 * Two earlier versions of this hero were a heading, a paragraph and two
 * buttons — first over an instrument view held inside a card, then over
 * nothing at all beside a cluster of summary cards. Both read as a document
 * masthead. The page claims a published record about human movement, so the
 * first screen now IS that subject: a motion-capture lab running full-bleed
 * behind the type, with the headline set on the cleared left third.
 *
 * The copy is unchanged — eyebrow, headline, lede and both calls to action.
 * The capture caption under them names what the lab is showing, which is the
 * only text the visual needs: HUMAN GAIT → TEMPORAL SIGNAL → REPRESENTATION.
 *
 * The four foundation cards that used to sit on the right moved to their own
 * section, where they can be the four visual labs they describe rather than
 * four boxes of prose competing with the hero.
 */
export function ResearchHero() {
  return (
    <section className={`site-page-intro ${styles.heroLab} pb-16 sm:pb-20`}>
      <div className={styles.heroLabStage}>
        <ResearchHeroLab />
      </div>

      <div className="container-wide">
        <div className={styles.heroLabGrid}>
          <div className="min-w-0">
            <span className={styles.eyebrow}>
              <span aria-hidden="true" className={styles.eyebrowRule} />
              Research at GaitAI
            </span>

            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleLine}>Built on a</span>
              <span className={`${styles.heroTitleLine} ${styles.heroSpectrum}`}>
                published research record.
              </span>
            </h1>

            <p className={styles.heroLede}>
              A traceable research foundation spanning gait biometrics,
              pose-based movement analysis, privacy-aware gait data and edge
              intelligence.
            </p>

            <div className={styles.heroActions}>
              <Link href="#evidence-map" className="btn-primary">
                Explore evidence
              </Link>
              <Link href="/publications" className="btn-ghost">
                Browse publications
              </Link>
            </div>

            {/* What the lab behind this is showing. */}
            <div className={styles.labCaption}>
              {["Human gait", "Temporal signal", "Representation"].map(
                (step, i) => (
                  <span key={step} className={styles.labCaptionStep}>
                    {i > 0 && (
                      <span aria-hidden="true" className={styles.labCaptionArrow}>
                        →
                      </span>
                    )}
                    {step}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { ObservatoryVisual } from "./ObservatoryVisual";
import styles from "./observatory.module.css";

/**
 * The research hero.
 *
 * Copy is unchanged from the page it replaces — eyebrow, headline, lede and
 * both calls to action. What changed is the composition: the headline sits in
 * its own column against a full instrument view of a captured stride, and the
 * spectrum falls on one phrase rather than washing the whole heading.
 */
export function ResearchHero() {
  return (
    <section className={`site-page-intro ${styles.hero} pb-14 sm:pb-16`}>
      <div className="container-wide">
        <div className={styles.heroGrid}>
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
          </div>

          <figure className={`${styles.heroStage} min-w-0`}>
            <span aria-hidden="true" className={styles.stageFrame} />
            <ObservatoryVisual />
            <figcaption className={styles.stageCaption}>
              <span>Captured stride</span>
              <span aria-hidden="true" className={styles.stageCaptionRule} />
              <span>Joint trajectory</span>
              <span aria-hidden="true" className={styles.stageCaptionRule} />
              <span>Temporal signal</span>
              <span aria-hidden="true" className={styles.stageCaptionRule} />
              <span>Feature vector</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

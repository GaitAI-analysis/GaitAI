import Link from "next/link";
import {
  ResearchFoundations,
  type FoundationCard,
} from "./ResearchFoundations";
import styles from "./observatory.module.css";

/**
 * The research hero.
 *
 * The headline, lede and both calls to action are unchanged. What changed is
 * what sits beside them: the column used to hold a full instrument view of a
 * captured stride, which is a picture of the *subject*. The headline claims a
 * published record, so the first screen now shows that record — the four
 * research foundations and how much published work backs each — and the
 * captured-stride language moved down into the capture-to-capabilities
 * pipeline, where it belongs to a stage rather than standing alone.
 *
 * The eyebrow says what the page is a basis for. Nothing here states a count:
 * the foundation cards take theirs from `researchAreas`.
 */
export function ResearchHero({ areas }: { areas: FoundationCard[] }) {
  return (
    <section className={`site-page-intro ${styles.hero} pb-14 sm:pb-16`}>
      <div className="container-wide">
        <div className={styles.heroGrid}>
          <div className="min-w-0">
            <span className={styles.eyebrow}>
              <span aria-hidden="true" className={styles.eyebrowRule} />
              Research basis · Responsible AI
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

          <ResearchFoundations areas={areas} />
        </div>
      </div>
    </section>
  );
}

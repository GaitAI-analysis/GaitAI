import Link from "next/link";
import {
  ResearchFoundations,
  type FoundationCard,
} from "./ResearchFoundations";
import { ResearchHeroScene } from "./ResearchHeroScene";
import { DiagramField } from "@/components/visuals/DiagramField";
import styles from "./observatory.module.css";

/**
 * The research hero.
 *
 * The headline, lede and both calls to action are unchanged. What sits beside
 * them has changed twice: it was an instrument view of a captured stride,
 * then the four foundation cards, and it is now the pipeline the page is
 * actually about — capture, pose, features, representation — drawn as one
 * continuous labelled figure.
 *
 * The foundations moved DOWN, out of the hero column and into a four-across
 * row under it, which is where the reference composition puts its pillars and
 * where four cards can carry a visual each instead of being squeezed into a
 * two-by-two beside a headline.
 *
 * The section carries the shared research field: contour bands running left to
 * right and a node lattice that thickens toward the right, echoing the
 * figure's own signal-to-representation direction.
 *
 * Nothing here states a count: the foundation cards take theirs from
 * `researchAreas`.
 */
export function ResearchHero({ areas }: { areas: FoundationCard[] }) {
  return (
    <section className={`site-page-intro ${styles.hero} pb-12 sm:pb-16`}>
      <DiagramField variant="research" gridMask="maskRight" className="-z-10" />

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

          {/* Capture → pose → features → representation, as one figure. */}
          <div className={styles.heroScene}>
            <ResearchHeroScene />
          </div>
        </div>

        {/* The four pillars, each with the motif of what it studies. */}
        <div className={styles.heroFoundations}>
          <ResearchFoundations areas={areas} />
        </div>
      </div>
    </section>
  );
}

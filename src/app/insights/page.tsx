import type { Metadata } from "next";
import Link from "next/link";
import { LivePostsMount } from "@/components/posts/LivePostsMount";
import { FeaturedStory } from "@/components/insights/FeaturedStory";
import { JournalLibrary } from "@/components/insights/JournalLibrary";
import { StartHere } from "@/components/insights/StartHere";
import { insightsByDate, TOPIC_FILTERS } from "@/data/insights";
import styles from "@/components/insights/journal.module.css";

export const metadata: Metadata = {
  title: "Insights — Research notes & technical essays",
  description:
    "Research notes, technical essays and responsible-AI perspectives from the systems behind GaitAI — movement intelligence, multimodal AI, privacy and the evidence behind what we build.",
  alternates: { canonical: "/insights" },
};

/**
 * GaitAI Insights — the journal.
 *
 * The page has one job: make a first-time reader want to open an essay. So it
 * is built as a publication rather than as a card grid —
 *
 *   masthead   what this section publishes, and a standing index of its
 *              subjects, with the featured story immediately below the fold
 *              line rather than a screen of empty dark
 *   featured   the lead essay at full width, its own imagery carrying the
 *              type, and three things the reader will learn
 *   library    the remaining essays at deliberately different weights, each
 *              introduced by the question it answers
 *   start here the five pieces as a reading path for a first visit
 *
 * Two content sources still sit on this page. The editorial library
 * (`data/insights`) is versioned with the codebase and statically rendered.
 * Below it, any post marked verified in Firestore is surfaced through the live
 * list — which renders nothing when there is none, so the index is never
 * interrupted by an empty state.
 */

/** The lead essay's argument, as the chain it actually follows. */
const FEATURE_CHAIN = ["Capture", "Pose", "Gait", "Fusion", "Intelligence"];

export default function InsightsPage() {
  const [featured, ...rest] = insightsByDate;
  const subjects = TOPIC_FILTERS.filter((filter) => filter.key !== "all").map(
    (filter) => ({
      label: filter.label,
      count: insightsByDate.filter((article) =>
        article.topics.includes(filter.key as never),
      ).length,
    }),
  );

  return (
    <div className={styles.journal}>
      {/* ─────────── MASTHEAD ─────────── */}
      <section className={`site-page-intro ${styles.hero} pb-10 sm:pb-12`}>
        <span aria-hidden="true" className={`${styles.heroField} -z-10`} />
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-[6%] top-[2%] h-[420px] w-[720px] rounded-full opacity-45 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(79,209,255,0.13), transparent 70%)",
            }}
          />
        </div>

        <div className="container-wide">
          <div className={styles.heroGrid}>
            <div className="min-w-0">
              <p className={styles.kicker}>
                <span aria-hidden="true" className={styles.kickerRule} />
                GaitAI Insights
              </p>

              <h1 className={styles.heroTitle}>
                <span className={styles.heroTitleLine}>Ideas at the</span>
                <span className={styles.heroTitleLine}>intersection of</span>
                <span className={`${styles.heroTitleLine} ${styles.heroSpectrum}`}>
                  movement, intelligence
                </span>
                <span className={styles.heroTitleLine}>and human life.</span>
              </h1>

              <p className={styles.heroLede}>
                Research notes, technical essays and responsible-AI perspectives
                from the systems behind GaitAI.
              </p>

              <div className={styles.heroFoot}>
                <Link href="#featured" className={styles.heroJump}>
                  Start here
                  <span aria-hidden="true" className={styles.heroJumpArrow}>
                    ↓
                  </span>
                </Link>
                <span className={styles.meta}>
                  {insightsByDate.length} essays · updated regularly
                </span>
              </div>
            </div>

            {/* A standing index of what the journal covers. */}
            <div className={styles.heroIndex}>
              {subjects.map((subject) => (
                <div key={subject.label} className={styles.heroIndexRow}>
                  <span>{subject.label}</span>
                  <span className={styles.heroIndexCount}>
                    {String(subject.count).padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── FEATURED ─────────── */}
      <section id="featured" className="pb-16 sm:pb-20">
        <div className="container-wide">
          <FeaturedStory article={featured} chain={FEATURE_CHAIN} />
        </div>
      </section>

      {/* ─────────── LIBRARY ─────────── */}
      <section className="pb-16 sm:pb-20">
        <div className="container-wide">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionHeadTitle}>Latest from the lab</h2>
            <span className={styles.sectionHeadNote}>
              {rest.length} more essays
            </span>
          </div>
          <div className="mt-8">
            <JournalLibrary articles={rest} />
          </div>
        </div>
      </section>

      {/* ─────────── START HERE ─────────── */}
      <section className="border-t border-white/[0.07] bg-obsidian-300/25 py-16 sm:py-20">
        <div className="container-wide">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionHeadTitle}>
              New to GaitAI? Start here.
            </h2>
            <span className={styles.sectionHeadNote}>
              A reading path · {insightsByDate.length} steps
            </span>
          </div>
          <StartHere articles={insightsByDate} />
        </div>
      </section>

      {/* Verified Firestore posts, when any exist. Silent otherwise. */}
      <section className="py-4">
        <div className="container-wide">
          <LivePostsMount hideWhenEmpty />
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { LivePostsMount } from "@/components/posts/LivePostsMount";
import { JournalHeroVisual } from "@/components/insights/JournalHeroVisual";
import { ThoughtStream } from "@/components/insights/ThoughtStream";
import { PullLine } from "@/components/insights/PullLine";
import { FeatureCover } from "@/components/insights/FeatureCover";
import { StoryModules } from "@/components/insights/StoryModules";
import { insightArticles } from "@/data/insights";
import styles from "@/components/insights/landing.module.css";

export const metadata: Metadata = {
  title: "Insights — Research notes & technical essays",
  description:
    "Research notes, technical essays and responsible-AI perspectives from the systems behind GaitAI — movement intelligence, multimodal AI, privacy and the evidence behind what we build.",
  alternates: { canonical: "/insights" },
};

/**
 * THE GAITAI JOURNAL — /insights
 *
 * The index was a masthead, a featured card and a 2×2 grid of four
 * near-identical rectangles. It was tidy and it was a blog. This is a
 * publication:
 *
 *   opening      one question at full height over one movement visual — a
 *                reader should know what this is about before reading a
 *                sentence of body copy
 *   stream       the five essays introduced by the five questions they
 *                answer, one story surfacing at a time
 *   pull         a line from an essay, alone, as a pacing beat
 *   cover        the lead essay at full measure with its own contents list
 *   stories      the other four as four different compositions, each with a
 *                drawn visual of its own argument
 *   constellation the five themes and the fact that no essay sits under just
 *                one of them
 *   lab          five ideas in about a minute each, for a reader not ready
 *                to start a nine-minute essay
 *   foundations  the five as one intentional collection, in reading order
 *
 * WHERE THE WORDS COME FROM
 * Every question, hook, section list, call to action, series title and pull
 * quote on this page is a field on the article it belongs to. The index never
 * writes a question an essay does not answer, and the two pull lines are
 * verbatim `quote` blocks from the essays they credit.
 *
 * The live Firestore list stays at the foot, rendering nothing when there are
 * no verified posts, so the journal is never interrupted by an empty state.
 */

/**
 * Editorial theme per issue. These are labels for the collection, not new
 * claims: each one names the subject its essay already covers, and the two
 * that are not literal topic labels ("Movement & Identity", "AI Evidence")
 * describe essays about exactly that.
 */
/**
 * ONE signature interaction, not four.
 *
 * This page briefly carried a question stream, a theme constellation, a
 * five-minute lab and an ordered foundations path — four interactive surfaces
 * competing to be the way into five essays, on a page whose problem was never
 * too little to do. The question stream stays, because it is the one that does
 * the reader's actual job: it introduces each essay by the question that essay
 * answers, from the article's own `question` field, so scanning it is deciding
 * rather than browsing. The constellation, the lab and the foundations path
 * are unmounted; their components are still in the tree.
 *
 * What is left: an opening, the question stream, a pull line, one featured
 * story, the four others as editorial modules, and live posts when any exist.
 * Everything except the stream is calm on purpose.
 */
const ISSUE_THEME: Record<string, string> = {
  "from-walking-video-to-movement-intelligence": "Movement Intelligence",
  "your-walk-is-more-than-a-biometric": "Movement & Identity",
  "movement-intelligence-without-identification": "Responsible AI",
  "fall-risk-is-a-trend-not-a-number": "Mobility",
  "when-fusion-looks-better-than-it-is": "AI Evidence",
};

const bySeries = [...insightArticles].sort((a, b) => a.seriesStep - b.seriesStep);
const lead = bySeries[0];
const others = bySeries.slice(1);

export default function InsightsPage() {
  return (
    <div className={styles.journal}>
      {/* ═══════════ THE OPENING ═══════════ */}
      <section className={styles.open}>
        <div className="container-wide">
          <div className={styles.openGrid}>
            <div className="min-w-0">
              <p className={styles.kicker}>
                <span aria-hidden="true" className={styles.kickerRule} />
                The GaitAI Journal
              </p>

              {/* The lead essay's own question, asked at cover size. */}
              <h1 className={styles.openTitle}>
                <span className={styles.openTitleLine}>What does an AI</span>
                <span className={styles.openTitleLine}>system </span>
                <span className={`${styles.openTitleLine} ${styles.spectrum}`}>
                  actually see
                </span>
                <span className={styles.openTitleLine}>when you walk?</span>
              </h1>

              <p className={styles.openLede}>
                Ideas about movement, intelligence and the evidence between
                them.
              </p>

              <p className={styles.openStrap}>
                <span>Research notes</span>
                <span aria-hidden="true" className={styles.openStrapDot}>
                  ·
                </span>
                <span>Technical essays</span>
                <span aria-hidden="true" className={styles.openStrapDot}>
                  ·
                </span>
                <span>Responsible AI</span>
              </p>

              <Link href="#stream" className={styles.openScroll}>
                Scroll to explore
                <span aria-hidden="true" className={styles.openScrollArrow}>
                  ↓
                </span>
              </Link>
            </div>

            <div className={styles.openStage}>
              <JournalHeroVisual />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ THE THOUGHT STREAM ═══════════ */}
      <section id="stream" className="py-20 sm:py-24">
        <div className="container-wide">
          <div className={styles.sectionLead}>
            <p className={styles.sectionLabel}>What we&apos;re thinking about</p>
            <h2 className={styles.sectionTitle}>
              Five questions,{" "}
              <span className={styles.spectrum}>five essays.</span>
            </h2>
          </div>

          <div className="mt-12 sm:mt-14">
            <ThoughtStream
              items={bySeries.map((article) => ({
                slug: article.slug,
                step: article.seriesStep,
                question: article.question,
                title: article.title,
                category: article.category,
                readMinutes: article.readMinutes,
                ctaLabel: article.ctaLabel,
                hero: { src: article.hero.src, alt: article.hero.alt },
              }))}
            />
          </div>
        </div>
      </section>

      {/* ═══════════ PACING ═══════════ */}
      <section className="py-16 sm:py-20">
        <div className="container-wide">
          <PullLine
            text="A single frame shows a posture. Only a sequence shows a gait."
            source="From Walking Video to Movement Intelligence"
            slug="from-walking-video-to-movement-intelligence"
          />
        </div>
      </section>

      {/* ═══════════ THE COVER ═══════════ */}
      <section id="feature" className="pb-20 sm:pb-24">
        <div className="container-wide">
          <p className={styles.sectionLabel}>Feature story</p>
          <div className="mt-8 sm:mt-10">
            <FeatureCover
              article={{
                slug: lead.slug,
                step: lead.seriesStep,
                issueLabel: ISSUE_THEME[lead.slug] ?? lead.category,
                title: lead.title,
                titleAccent: lead.titleAccent,
                subtitle: lead.subtitle,
                question: lead.question,
                deck: lead.deck,
                readMinutes: lead.readMinutes,
                ctaLabel: lead.ctaLabel,
                hero: { src: lead.hero.src, alt: lead.hero.alt },
                contents: lead.sections.map((section) => ({
                  number: section.number,
                  label: section.navLabel,
                })),
              }}
            />
          </div>
        </div>
      </section>

      {/* ═══════════ THE OTHER FOUR ═══════════ */}
      <section className="border-y border-white/[0.07]">
        <div className="container-wide">
          <div className="py-14 sm:py-16">
            <p className={styles.sectionLabel}>In this issue</p>
            <h2 className={styles.sectionTitle}>
              Four more{" "}
              <span className={styles.spectrum}>lines of enquiry.</span>
            </h2>
          </div>
        </div>
        <div className="container-wide">
          <StoryModules
            articles={others.map((article) => ({
              slug: article.slug,
              step: article.seriesStep,
              issueLabel: ISSUE_THEME[article.slug] ?? article.category,
              title: article.title,
              question: article.question,
              excerpt: article.excerpt,
              readMinutes: article.readMinutes,
              ctaLabel: article.ctaLabel,
            }))}
          />
        </div>
      </section>

      {/* ═══════════ PACING ═══════════ */}
      <section className="py-20 sm:py-24">
        <div className="container-wide">
          <PullLine
            text="Two people can share a score and have entirely different trajectories."
            source="A Fall-Risk Score Is Not Enough"
            slug="fall-risk-is-a-trend-not-a-number"
          />
        </div>
      </section>

      {/* Verified Firestore posts, when any exist. Silent otherwise. */}
      <section className="pb-4">
        <div className="container-wide">
          <LivePostsMount hideWhenEmpty />
        </div>
      </section>
    </div>
  );
}

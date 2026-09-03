import type { Metadata } from "next";
import { LivePostsMount } from "@/components/posts/LivePostsMount";
import { SignalThread } from "@/components/insights/SignalThread";
import { OpeningWalker } from "@/components/insights/OpeningWalker";
import { StoryMoment } from "@/components/insights/StoryMoment";
import { StoryIndex } from "@/components/insights/StoryIndex";
import { JournalIndex } from "@/components/insights/JournalIndex";
import { SignalStage } from "@/components/insights/SignalStage";
import {
  EditorialPause,
  JournalClose,
  JournalOpening,
} from "@/components/insights/JournalPieces";
import {
  FusionVisual,
  IdentityFieldVisual,
  PrivacyLayersVisual,
  TrajectoryVisual,
} from "@/components/insights/StoryVisuals";
import { insightArticles, insightHref } from "@/data/insights";
import styles from "@/components/insights/signal.module.css";

export const metadata: Metadata = {
  title: "Insights — Research notes & technical essays",
  description:
    "Research notes, technical essays and responsible-AI perspectives from the systems behind GaitAI — movement intelligence, multimodal AI, privacy and the evidence behind what we build.",
  alternates: { canonical: "/insights" },
};

/**
 * THE GAITAI JOURNAL — one signal, five transformations.
 *
 * Three versions of this page have now been a blog: a masthead over a grid, a
 * masthead over prettier cards, and a masthead over a question stream and a
 * feature cover. Each was cleaner than the last and each was still a list of
 * articles with decoration around it.
 *
 * This is not that. The page is a single continuous visual narrative — a
 * human movement signal that enters at the opening question and travels down
 * the page, changing form six times. Every transformation is one of the five
 * essays:
 *
 *   opening   a body walking, and one question: what does AI see when you
 *             walk? Landmarks surface and a trajectory draws as the reader
 *             starts to scroll, so the transformation begins before a word of
 *             body copy
 *   01        raw movement → pose: frames, landmarks, signal
 *   02        the pose trace becomes a gait signature — one walk, five
 *             readings
 *   03        the signature loses its identity information and keeps its
 *             movement
 *   pause     "a single frame shows a posture…" at cover size, with the
 *             signal running straight through it
 *   04        one reading becomes a sequence of readings: time enters
 *   pause     "measurement is not the same thing as intelligence."
 *   05        the signal splits into modalities, one goes missing, one
 *             corrupts, and the fusion output changes
 *   close     the signal continues, and the index
 *
 * WHAT MAKES IT ONE THING RATHER THAN SIX SECTIONS
 * `SignalThread` draws a single path over the whole container, weaving left
 * and right so it enters and leaves each visual field, and it draws itself to
 * the reader's scroll position. Every story alternates its field to the side
 * the thread arrives on. Remove the thread and this is five compositions;
 * with it, it is one journey.
 *
 * WHAT IS NOT HERE, ON PURPOSE
 * No card. No excerpt. No "you'll learn" list. No filter chips. No featured-
 * article block. No "latest from the lab". One question, one title and one
 * line per story, because the detailed hooks belong inside the essays — and
 * because a landing page that shows everything gives a reader nothing to
 * decide.
 *
 * WHERE THE WORDS COME FROM
 * Every question, title, hook, chain stage and call to action is a field on
 * the article it introduces (`data/insights.ts`), so the journal cannot ask a
 * question its essays do not answer. The two pause quotes are verbatim
 * `quote` blocks from the essays they credit. Routes, metadata, OpenGraph and
 * structured data are untouched.
 */

/**
 * Editorial theme per issue — labels for the collection, each naming the
 * subject its essay already covers.
 */
const THEME: Record<string, string> = {
  "from-walking-video-to-movement-intelligence": "Movement Intelligence",
  "your-walk-is-more-than-a-biometric": "Movement & Identity",
  "movement-intelligence-without-identification": "Responsible AI",
  "fall-risk-is-a-trend-not-a-number": "Mobility",
  "when-fusion-looks-better-than-it-is": "AI Evidence",
};

/** The rail's micro-labels: what each transformation does to the signal. */
const RAIL_LABEL: Record<number, string> = {
  1: "Signal",
  2: "Meaning",
  3: "Privacy",
  4: "Change",
  5: "Evidence",
};

/**
 * The transformation each story performs, as stages. Every stage names a step
 * the essay itself walks through — its own section vocabulary, not new claims.
 */
const CHAIN: Record<number, string[]> = {
  1: ["Video", "Pose", "Temporal motion", "Movement signal"],
  2: ["Gait trace", "Signature", "Five readings"],
  3: ["Appearance", "Abstraction", "Pose", "Movement only"],
  4: ["One reading", "A sequence", "A direction"],
  5: ["Four streams", "Fusion", "One missing", "Evidence"],
};

/** The question each moment asks, and the phrase set in the spectrum. */
const ASK: Record<number, { question: string; accent: string }> = {
  1: {
    question: "A camera records pixels. What turns that into movement?",
    accent: "movement?",
  },
  2: {
    question: "What can a walk tell us beyond identity?",
    accent: "beyond identity?",
  },
  3: {
    question:
      "Does AI need to know who you are to understand how you move?",
    accent: "how you move?",
  },
  4: {
    question: "What matters more: today's score, or its direction?",
    accent: "or its direction?",
  },
  5: {
    question: "When does more data actually mean better AI?",
    accent: "better AI?",
  },
};

const VISUAL: Record<number, React.ReactNode> = {
  1: <SignalStage />,
  2: <IdentityFieldVisual />,
  3: <PrivacyLayersVisual />,
  4: <TrajectoryVisual showValues={false} />,
  5: <FusionVisual />,
};

/** The first sentence of a passage, for stories with no subtitle. */
const firstSentence = (text: string) => {
  const end = text.indexOf(". ");
  return end > 0 ? text.slice(0, end + 1) : text;
};

const bySeries = [...insightArticles].sort((a, b) => a.seriesStep - b.seriesStep);

/** The two pause quotes, taken from the essays that contain them. */
const PAUSE_ONE = {
  lines: ["A single frame", "shows a posture.", "Only a sequence", "shows a gait."],
  source: "From Walking Video to Movement Intelligence",
  slug: "from-walking-video-to-movement-intelligence",
};
const PAUSE_TWO = {
  lines: ["Measurement", "is not the same thing", "as intelligence."],
  source: "A Fall-Risk Score Is Not Enough",
  slug: "fall-risk-is-a-trend-not-a-number",
};

export default function InsightsPage() {
  const latest = [...insightArticles].sort((a, b) =>
    b.date.localeCompare(a.date),
  )[0];

  const moment = (step: number) => {
    const article = bySeries.find((item) => item.seriesStep === step)!;
    return {
      article,
      props: {
        id: `story-0${step}`,
        step,
        theme: THEME[article.slug] ?? article.category,
        question: ASK[step].question,
        questionAccent: ASK[step].accent,
        title: article.title,
        /* One short line. Not `openingHook` — those are written for the top
           of the article and begin "Before you scroll:", which is nonsense on
           a page the reader is already scrolling. The subtitle where a record
           has one, and the excerpt's first sentence where it does not: a
           three-line excerpt under every story is the textual landing page
           this rebuild exists to get away from. */
        hook: article.subtitle ?? firstSentence(article.excerpt),
        chain: CHAIN[step],
        cta: article.ctaLabel,
        href: insightHref(article.slug),
      },
    };
  };

  const one = moment(1);
  const two = moment(2);
  const three = moment(3);
  const four = moment(4);
  const five = moment(5);

  return (
    <div className={styles.journal}>
      {/* One signal, drawn over the whole page. */}
      <SignalThread />

      {/* Five marks on the edge, from 1280px up. */}
      <StoryIndex
        entries={bySeries.map((article) => ({
          id: `story-0${article.seriesStep}`,
          step: article.seriesStep,
          label: RAIL_LABEL[article.seriesStep] ?? article.category,
        }))}
      />

      {/* ═════════ THE ARCHIVE ═════════
          The masthead, the cover story, every essay as a dated card, and the
          reading path — above the narrative, not instead of it.

          The narrative below is the strongest idea on this route and it keeps
          its job: showing what the essays are ABOUT. It cannot show what they
          ARE. It carries no date, no author, no read time, no excerpt and no
          way to filter, so a reader arriving to find something to read had to
          infer the archive from a scroll-driven illustration. This section is
          that archive; the signal thread still runs behind both. */}
      <JournalIndex />

      {/* ═════════ THE OPENING ═════════ */}
      <JournalOpening>
        <OpeningWalker />
      </JournalOpening>

      {/* ═════════ 01 · the signal ═════════ */}
      <StoryMoment {...one.props} side="right">
        {VISUAL[1]}
      </StoryMoment>

      {/* ═════════ 02 · meaning ═════════ */}
      <StoryMoment {...two.props} side="left">
        {VISUAL[2]}
      </StoryMoment>

      {/* ═════════ 03 · privacy ═════════ */}
      <StoryMoment {...three.props} side="right">
        {VISUAL[3]}
      </StoryMoment>

      {/* ═════════ PAUSE ═════════ */}
      <EditorialPause
        lines={PAUSE_ONE.lines}
        source={PAUSE_ONE.source}
        href={insightHref(PAUSE_ONE.slug)}
      />

      {/* ═════════ 04 · change ═════════ */}
      <StoryMoment {...four.props} side="left">
        {VISUAL[4]}
      </StoryMoment>

      {/* ═════════ PAUSE ═════════ */}
      <EditorialPause
        lines={PAUSE_TWO.lines}
        source={PAUSE_TWO.source}
        href={insightHref(PAUSE_TWO.slug)}
      />

      {/* ═════════ 05 · evidence ═════════ */}
      <StoryMoment {...five.props} side="right">
        {VISUAL[5]}
      </StoryMoment>

      {/* ═════════ THE CLOSE ═════════ */}
      <JournalClose
        latestHref={insightHref(latest.slug)}
        latestTitle={latest.title}
        entries={bySeries.map((article) => ({
          step: article.seriesStep,
          theme: THEME[article.slug] ?? article.category,
          href: insightHref(article.slug),
          title: article.title,
        }))}
      />

      {/* Verified Firestore posts, when any exist. Silent otherwise. */}
      <section className="relative z-[1] pb-4">
        <div className="container-wide">
          <LivePostsMount hideWhenEmpty />
        </div>
      </section>
    </div>
  );
}

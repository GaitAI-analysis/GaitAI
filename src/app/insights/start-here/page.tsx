import type { Metadata } from "next";
import Link from "next/link";
import { SignalThread } from "@/components/insights/SignalThread";
import { OpeningWalker } from "@/components/insights/OpeningWalker";
import { StoryMoment } from "@/components/insights/StoryMoment";
import { StoryIndex } from "@/components/insights/StoryIndex";
import { SignalStage } from "@/components/insights/SignalStage";
import { EditorialPause, JournalClose, JournalOpening } from "@/components/insights/JournalPieces";
import { FusionVisual, IdentityFieldVisual, PrivacyLayersVisual, TrajectoryVisual } from "@/components/insights/StoryVisuals";
import { insightArticles, insightHref } from "@/data/insights";
import styles from "@/components/insights/signal.module.css";

export const metadata: Metadata = {
  title: "Explore the GaitAI Foundations",
  description: "A five-part curated introduction to movement intelligence, identity, responsible AI, mobility and evidence at GaitAI.",
  alternates: { canonical: "/insights/start-here" },
  openGraph: { type: "website", url: "/insights/start-here", title: "Explore the GaitAI Foundations", description: "A curated five-part reading path for people who are new to GaitAI." },
};

const THEME: Record<string, string> = {
  "from-walking-video-to-movement-intelligence": "Movement Intelligence",
  "your-walk-is-more-than-a-biometric": "Movement & Identity",
  "movement-intelligence-without-identification": "Responsible AI",
  "fall-risk-is-a-trend-not-a-number": "Mobility",
  "when-fusion-looks-better-than-it-is": "AI Evidence",
};
const RAIL_LABEL: Record<number, string> = { 1: "Signal", 2: "Meaning", 3: "Privacy", 4: "Change", 5: "Evidence" };
const CHAIN: Record<number, string[]> = {
  1: ["Video", "Pose", "Temporal motion", "Movement signal"],
  2: ["Gait trace", "Signature", "Five readings"],
  3: ["Appearance", "Abstraction", "Pose", "Movement only"],
  4: ["One reading", "A sequence", "A direction"],
  5: ["Four streams", "Fusion", "One missing", "Evidence"],
};
const ASK: Record<number, { question: string; accent: string }> = {
  1: { question: "A camera records pixels. What turns that into movement?", accent: "movement?" },
  2: { question: "What can a walk tell us beyond identity?", accent: "beyond identity?" },
  3: { question: "Does AI need to know who you are to understand how you move?", accent: "how you move?" },
  4: { question: "What matters more: today's score, or its direction?", accent: "or its direction?" },
  5: { question: "When does more data actually mean better AI?", accent: "better AI?" },
};
const VISUAL: Record<number, React.ReactNode> = {
  1: <SignalStage />, 2: <IdentityFieldVisual />, 3: <PrivacyLayersVisual />,
  4: <TrajectoryVisual showValues={false} />, 5: <FusionVisual />,
};
const firstSentence = (text: string) => {
  const end = text.indexOf(". ");
  return end > 0 ? text.slice(0, end + 1) : text;
};
const foundations = [...insightArticles]
  .filter((article) => (article.series ?? "GaitAI Foundations") === "GaitAI Foundations")
  .sort((a, b) => (a.seriesOrder ?? a.seriesStep) - (b.seriesOrder ?? b.seriesStep));
const PAUSE_ONE = { lines: ["A single frame", "shows a posture.", "Only a sequence", "shows a gait."], source: "From Walking Video to Movement Intelligence", slug: "from-walking-video-to-movement-intelligence" };
const PAUSE_TWO = { lines: ["Measurement", "is not the same thing", "as intelligence."], source: "A Fall-Risk Score Is Not Enough", slug: "fall-risk-is-a-trend-not-a-number" };

export default function StartHerePage() {
  const moment = (step: number) => {
    const article = foundations.find((item) => (item.seriesOrder ?? item.seriesStep) === step)!;
    return {
      id: `story-0${step}`, step, theme: THEME[article.slug] ?? article.category,
      question: ASK[step].question, questionAccent: ASK[step].accent, title: article.title,
      hook: article.subtitle ?? firstSentence(article.excerpt), chain: CHAIN[step],
      cta: article.ctaLabel, href: insightHref(article.slug),
    };
  };
  return (
    <div className={styles.journal}>
      <SignalThread />
      <StoryIndex entries={foundations.map((article) => ({ id: `story-0${article.seriesOrder ?? article.seriesStep}`, step: article.seriesOrder ?? article.seriesStep, label: RAIL_LABEL[article.seriesOrder ?? article.seriesStep] ?? article.category }))} />
      <header className="relative z-[2] border-b border-white/[0.07] pb-10 pt-10 sm:pb-14 sm:pt-14">
        <div className="container-wide">
          <Link href="/insights" className="text-[11px] uppercase tracking-[0.18em] text-soft-mute transition-colors hover:text-soft-white">← Blog &amp; updates</Link>
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-300">Start here · Curated reading path</p>
          <h1 className="mt-4 max-w-4xl font-display text-display-xl text-balance text-soft-white">Explore the GaitAI Foundations</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-soft-gray sm:text-lg">Five evergreen stories for understanding what GaitAI measures, why movement means more than identity, and how evidence and responsibility shape the work.</p>
        </div>
      </header>
      <JournalOpening><OpeningWalker /></JournalOpening>
      <StoryMoment {...moment(1)} side="right">{VISUAL[1]}</StoryMoment>
      <StoryMoment {...moment(2)} side="left">{VISUAL[2]}</StoryMoment>
      <StoryMoment {...moment(3)} side="right">{VISUAL[3]}</StoryMoment>
      <EditorialPause lines={PAUSE_ONE.lines} source={PAUSE_ONE.source} href={insightHref(PAUSE_ONE.slug)} />
      <StoryMoment {...moment(4)} side="left">{VISUAL[4]}</StoryMoment>
      <EditorialPause lines={PAUSE_TWO.lines} source={PAUSE_TWO.source} href={insightHref(PAUSE_TWO.slug)} />
      <StoryMoment {...moment(5)} side="right">{VISUAL[5]}</StoryMoment>
      <JournalClose latestHref="/insights" latestTitle="GaitAI Blog & Updates" entries={foundations.map((article) => ({ step: article.seriesOrder ?? article.seriesStep, theme: THEME[article.slug] ?? article.category, href: insightHref(article.slug), title: article.title }))} />
    </div>
  );
}

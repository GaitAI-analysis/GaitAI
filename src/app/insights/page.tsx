import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { LivePostsList } from "@/components/posts/LivePostsList";
import { InsightsLibrary } from "@/components/insights/InsightsLibrary";
import { insightsByDate } from "@/data/insights";

export const metadata: Metadata = {
  title: "Insights — Research notes & technical essays",
  description:
    "Research notes, technical essays and responsible-AI perspectives from the systems behind GaitAI — movement intelligence, multimodal AI, privacy and the evidence behind what we build.",
  alternates: { canonical: "/insights" },
};

/**
 * Insights landing.
 *
 * Two content sources sit on this page. The editorial library (`data/insights`)
 * is versioned with the codebase and statically rendered. Below it, any post
 * marked verified in Firestore is surfaced through the existing live list —
 * which renders nothing at all when there is none, so the editorial index is
 * never interrupted by an empty state.
 */
export default function InsightsPage() {
  return (
    <>
      {/* ─────────── HERO ─────────── */}
      <section className="site-page-intro relative overflow-hidden pb-4">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-1/2 top-[6%] h-[560px] w-[1000px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(79,209,255,0.16), transparent 70%)",
            }}
          />
          <div className="absolute right-[10%] bottom-[8%] h-72 w-72 rounded-full bg-radial-violet opacity-40 blur-3xl" />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <Newspaper className="h-3.5 w-3.5" />
              GaitAI Insights
            </div>
            <h1 className="mt-6 font-display text-display-2xl text-balance text-soft-white">
              Insights from the <span className="text-gradient">GaitAI lab.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-soft-gray sm:text-lg">
              Research notes, technical essays and responsible-AI perspectives from
              the systems behind GaitAI.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-soft-mute">
              Movement intelligence, multimodal AI, privacy and the evidence behind
              what we build.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────── EDITORIAL LIBRARY ─────────── */}
      <section className="section pt-14 sm:pt-16">
        <div className="container-wide">
          <InsightsLibrary articles={insightsByDate} />

          {/* Verified Firestore posts, when any exist. Silent otherwise. */}
          <LivePostsList hideWhenEmpty />
        </div>
      </section>
    </>
  );
}

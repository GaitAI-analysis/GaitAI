import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { DiagramField } from "@/components/visuals/DiagramField";
import { TalksConstellation } from "@/components/research/TalksConstellation";
import { TalksTimeline } from "@/components/research/TalksTimeline";
import {
  talkCounts,
  talkFormatCount,
  talkRecords,
  talkSpan,
  talkThreads,
} from "@/data/talks";
import { ctas } from "@/data/content";

/**
 * TALKS & PRESENTATIONS — /research/talks
 *
 * RESEARCH MOVING THROUGH TIME, NOT A CV ON A WEB PAGE. The record is
 * unchanged — twenty-two entries, every date, title, venue and evidence link
 * exactly as the source has them. What changed is that the page no longer
 * asserts all of it at once: the timeline is the storytelling device, each
 * record opens on request, and the same continuous-line language the Journal
 * uses for ideas is used here for a sequence.
 *
 * NO PERSONAL NAME AND NO PROVENANCE DISCLAIMER IN THE COPY. The page shows
 * the talks themselves and nothing about how to interpret them: no note on
 * whose record it is, whether an entry is a company appearance, or which
 * entries reach a GaitAI research area. `TALKS_SPEAKER` still exists in the
 * data as provenance and still feeds the search index; it is simply not
 * rendered here. Do not reintroduce a provenance block on this page.
 *
 * THE COUNTS ARE NEVER SUMMED INTO "TALKS". 10 invited talks, 3 conference
 * presentations, 8 paper presentations and 1 poster are four different kinds
 * of activity. They are summed into one figure only as "documented
 * appearances", which is true of all four and claims nothing about any of them.
 *
 * WHAT THIS PAGE STILL DOES NOT HAVE, ON PURPOSE: no recordings (no source
 * carries a video), no technical demos (nothing is evidenced as one), and no
 * attendance, reach or impact figures (none exist).
 */

export const metadata: Metadata = {
  title: "Talks & Presentations — research in conversation",
  description:
    "Selected invited talks, conference presentations, posters and technical " +
    "sessions spanning AI, gait analysis, biometrics and related research.",
  alternates: { canonical: "/research/talks" },
  openGraph: {
    type: "website",
    url: "/research/talks",
    title: "Talks & Presentations — research in conversation",
    description:
      "An interactive record of invited talks, conference presentations, " +
      "posters and technical sessions across AI, gait analysis and biometrics.",
  },
};

/**
 * The counts strip, in the record's own terms.
 *
 * Zero-padded because they are read as a set, and the padding keeps the column
 * of figures aligned without a table.
 */
const breakdown = [
  { value: talkCounts.invitedTalks, label: "invited talks" },
  { value: talkCounts.presentations, label: "conference presentations" },
  { value: talkCounts.paperPresentations, label: "paper presentations" },
  { value: talkCounts.posters, label: "research poster" },
];

const pad = (n: number) => String(n).padStart(2, "0");

export default function TalksPage() {
  return (
    <>
      {/* ─────────── HERO ─────────── */}
      <section className="site-page-intro relative overflow-hidden pb-10">
        <DiagramField variant="archive" gridMask="maskRight" className="-z-10" />

        <div className="container-wide">
          <div className="max-w-3xl">
            <span className="eyebrow">
              <span className="h-1 w-6 rounded-full bg-gradient-brand" />
              Research exchange
            </span>

            <h1 className="mt-6 font-display text-display-lg text-balance text-soft-white">
              Research in{" "}
              <span className="text-gradient">conversation.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-soft-gray">
              Selected invited talks, conference presentations, posters and
              technical sessions spanning AI, gait analysis, biometrics and
              related research.
            </p>

            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-soft-mute">
              {talkRecords.length} documented appearances
              <span aria-hidden="true"> · </span>
              {talkSpan.from}—{talkSpan.to}
            </p>

            <a
              href="#record"
              className="row-link mt-6 inline-flex items-center gap-2 text-sm font-medium text-soft-white"
            >
              Explore the timeline
              <span aria-hidden="true" className="row-link-arrow">
                ↓
              </span>
            </a>
          </div>

          {/* ── AT A GLANCE ──
              The line is the record: one tick per year that has entries,
              taller where more landed in it. Nothing is drawn that is not a
              record, so the shape cannot flatter the data. */}
          <div className="mt-14 max-w-4xl">
            <TalksConstellation />

            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-white/10 pt-4">
              {breakdown.map((item) => (
                <div key={item.label} className="flex items-baseline gap-2">
                  <dt className="sr-only">{item.label}</dt>
                  <dd className="flex items-baseline gap-2">
                    <span className="font-mono text-[13px] font-semibold text-soft-white">
                      {pad(item.value)}
                    </span>
                    <span className="text-[12px] text-soft-mute">
                      {item.label}
                    </span>
                  </dd>
                </div>
              ))}
              <div className="flex items-baseline gap-2">
                <dt className="sr-only">presentation formats</dt>
                <dd className="flex items-baseline gap-2">
                  <span className="font-mono text-[13px] font-semibold text-soft-white">
                    {pad(talkFormatCount)}
                  </span>
                  <span className="text-[12px] text-soft-mute">
                    presentation formats
                  </span>
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="sr-only">research threads</dt>
                <dd className="flex items-baseline gap-2">
                  <span className="font-mono text-[13px] font-semibold text-soft-white">
                    {pad(talkThreads.length)}
                  </span>
                  <span className="text-[12px] text-soft-mute">
                    research threads
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ─────────── THE RECORD ───────────
          One surface, two arrangements. The "most recent talk" and "research
          poster" cards this page used to open with are gone as CARDS, not as
          records: both are nodes on the line — the most recent is simply the
          first, and the poster carries its own mark and its poster link. Two
          feature boxes above a list of the same entries was the CV shape the
          redesign exists to leave behind. */}
      <section id="record" className="section scroll-mt-28 !pt-6">
        <div className="container-wide">
          <Reveal>
            <TalksTimeline />
          </Reveal>
        </div>
      </section>

      {/* ─────────── WHERE TO GO NEXT ─────────── */}
      <section className="section pb-20 !pt-0 sm:pb-24">
        <div className="container-wide">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-8">
            <Link
              href="/publications"
              className="row-link inline-flex items-center gap-2 text-sm font-medium text-soft-white"
            >
              Publications and the granted patent
              <ArrowRight
                aria-hidden="true"
                className="row-link-arrow h-3.5 w-3.5"
              />
            </Link>
            <Link
              href="/research"
              className="row-link inline-flex items-center gap-2 text-sm font-medium text-soft-white"
            >
              Research areas and their evidence
              <ArrowRight
                aria-hidden="true"
                className="row-link-arrow h-3.5 w-3.5"
              />
            </Link>
            <Link
              href={ctas.research.href}
              className="row-link inline-flex items-center gap-2 text-sm font-medium text-soft-white"
            >
              {ctas.research.label}
              <ArrowRight
                aria-hidden="true"
                className="row-link-arrow h-3.5 w-3.5"
              />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

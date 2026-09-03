import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { DiagramField } from "@/components/visuals/DiagramField";
import { TalkRecordList } from "@/components/research/TalkRecordList";
import {
  EVIDENCE_LABEL,
  TALKS_SOURCES,
  TALKS_SPEAKER,
  featuredTalk,
  talkCounts,
  talksOfKind,
} from "@/data/talks";
import { FOUNDER_PORTFOLIO_URL } from "@/data/publications";
import { ctas } from "@/data/content";

/**
 * TALKS & PRESENTATIONS — /research/talks
 *
 * A FOUNDER RECORD ON A COMPANY SITE, SAID OUT LOUD. Everything here was
 * delivered by Anubha Parashar in an academic and personal research capacity.
 * GaitAI has delivered no talks of its own, so the page never says it has:
 * the eyebrow is "Founder research record", the standfirst names the speaker,
 * and the note under the counts states the distinction in one sentence. This
 * is the same framing /publications already uses for the same reason, which is
 * why this route sits beside it under Research rather than becoming a
 * company-news surface.
 *
 * THE COUNTS ARE NEVER SUMMED. 11 invited talks, 3 conference presentations
 * and 1 poster are three different kinds of activity. Adding them into "15
 * talks" would misdescribe all three, and adding the 16 conference papers
 * would be plainly false — most were not talks at all.
 *
 * WHAT THIS PAGE DOES NOT HAVE, ON PURPOSE:
 *
 *   - No recordings section. Neither source carries a video for any record,
 *     so there is no "Watch recording" control and no empty section promising
 *     one later.
 *   - No technical-demos section, for the same reason: nothing is evidenced
 *     as a demo, and relabelling a lecture as a demo to fill a category is
 *     the kind of small invention that costs a research page its credibility.
 *   - No attendance, reach or impact figures. None exist.
 */

export const metadata: Metadata = {
  title: "Talks & Presentations — the founder research record",
  description:
    `Invited talks, conference presentations and a research poster delivered by ` +
    `GaitAI founder ${TALKS_SPEAKER}, with the slides, certificates and papers ` +
    `each is evidenced by. Academic records held individually, not company appearances.`,
  alternates: { canonical: "/research/talks" },
  openGraph: {
    type: "website",
    url: "/research/talks",
    title: "Talks & Presentations — the founder research record",
    description:
      `Invited talks, conference presentations and a research poster from ${TALKS_SPEAKER}'s research record.`,
  },
};

const poster = talksOfKind("poster")[0];

/* Counted from the records, reported separately, never added together. */
const counts = [
  { value: talkCounts.invitedTalks, label: "Invited talks" },
  { value: talkCounts.presentations, label: "Conference presentations" },
  { value: talkCounts.posters, label: "Research poster" },
  { value: talkCounts.paperPresentations, label: "Paper presentations" },
];

export default function TalksPage() {
  return (
    <>
      {/* ─────────── HERO ─────────── */}
      <section className="site-page-intro relative overflow-hidden pb-12">
        <DiagramField variant="archive" gridMask="maskRight" className="-z-10" />

        <div className="container-wide">
          <div className="max-w-3xl">
            <span className="eyebrow">
              <span className="h-1 w-6 rounded-full bg-gradient-brand" />
              Founder research record
            </span>

            <h1 className="mt-6 font-display text-display-lg text-balance text-soft-white">
              Research shared{" "}
              <span className="text-gradient">beyond the page.</span>
            </h1>

            <p className="mt-6 text-base leading-relaxed text-soft-gray">
              Selected invited talks, conference presentations, posters and
              technical sessions from GaitAI founder {TALKS_SPEAKER}&apos;s
              research and academic record.
            </p>

            {/* The provenance sentence. This is the load-bearing line on the
                page and it is deliberately not a footnote. */}
            <p className="mt-3.5 max-w-2xl text-[12.5px] leading-relaxed text-soft-mute">
              These are academic and individually held records rather than
              GaitAI company appearances — the company has delivered no talks
              of its own. Every entry is reproduced from the founder&apos;s{" "}
              <a
                href={FOUNDER_PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-soft-gray underline decoration-soft-mute/40 underline-offset-2 transition-colors hover:text-soft-white"
              >
                research record
              </a>
              , with the evidence each one links.
            </p>
          </div>

          <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            {counts.map((c) => (
              <div key={c.label}>
                <dt className="sr-only">{c.label}</dt>
                <dd>
                  <span className="block font-display text-2xl font-semibold text-soft-white">
                    {c.value}
                  </span>
                  <span className="mt-1 block text-[11.5px] leading-snug text-soft-mute">
                    {c.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─────────── MOST RECENT TALK ───────────
          "Featured" by date, not by judgement: there is no attendance,
          rating or reach data behind any of these, so recency is the only
          ordering the record can actually support. */}
      {featuredTalk && (
        <section className="section !pt-0">
          <div className="container-wide">
            <Reveal>
              <div className="max-w-3xl rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-soft-mute">
                  Most recent
                </p>
                <h2 className="mt-3 font-display text-xl font-semibold leading-snug text-soft-white">
                  {featuredTalk.title}
                </h2>
                <p className="mt-2.5 text-sm text-soft-gray">
                  {featuredTalk.date}
                  {featuredTalk.venue && (
                    <>
                      <span aria-hidden="true"> · </span>
                      {featuredTalk.venue}
                    </>
                  )}
                </p>
                {featuredTalk.description && (
                  <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-soft-mute">
                    {featuredTalk.description}
                  </p>
                )}
                {/* No CTA unless the source links something. This record
                    links nothing, so nothing is offered. */}
                {featuredTalk.evidence.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                    {featuredTalk.evidence.map((e) => (
                      <a
                        key={e.href}
                        href={e.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-soft-gray transition-colors hover:text-cyan-300"
                      >
                        {EVIDENCE_LABEL[e.kind]}
                        <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ─────────── THE RESEARCH POSTER ───────────
          Its own block because it is the one artefact on this page that is
          the output itself rather than a record of an event — the poster PDF
          is the thing that was presented, and it is the most directly
          gait-relevant item here. */}
      {poster && (
        <section className="section !pt-0">
          <div className="container-wide">
            <Reveal>
              <div className="grid max-w-4xl gap-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">
                    Research poster
                  </p>
                  <h2 className="mt-3 font-display text-xl font-semibold leading-snug text-soft-white">
                    {poster.title}
                  </h2>
                  <p className="mt-2.5 text-sm leading-relaxed text-soft-gray">
                    {poster.year}
                    {poster.event && (
                      <>
                        <span aria-hidden="true"> · </span>
                        {poster.event}
                      </>
                    )}
                    {poster.venue && (
                      <>
                        <span aria-hidden="true"> · </span>
                        {poster.venue}
                      </>
                    )}
                  </p>
                </div>

                {poster.evidence[0] && (
                  <a
                    href={poster.evidence[0].href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2 self-start whitespace-nowrap lg:self-center"
                  >
                    View poster
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </a>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ─────────── THE FULL RECORD ─────────── */}
      <section className="section">
        <div className="container-wide">
          <Reveal>
            <h2 className="font-display text-display-md text-soft-white">
              The record
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-soft-gray">
              Every entry below is reproduced from the founder&apos;s research
              site, newest first, with the artefact it is evidenced by. A
              record links to a GaitAI research area only where the work itself
              is that research — the IoT, teaching and access-control sessions
              are part of the academic record and map to nothing here.
            </p>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="mt-8">
              <TalkRecordList />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────── WHERE TO GO NEXT ─────────── */}
      <section className="section pb-20 sm:pb-24">
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

          <p className="mt-6 text-[11.5px] leading-relaxed text-soft-mute">
            Sources:{" "}
            <a
              href={TALKS_SOURCES.talks}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-soft-mute/40 underline-offset-2 transition-colors hover:text-soft-gray"
            >
              talks delivered
            </a>{" "}
            and{" "}
            <a
              href={TALKS_SOURCES.conferences}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-soft-mute/40 underline-offset-2 transition-colors hover:text-soft-gray"
            >
              conference record
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import {
  RecordInstrumentPanel,
  type RecordMetric,
} from "@/components/visuals/RecordInstrumentPanel";
import { EvidenceChainMotif } from "@/components/visuals/ResearchMotifs";
import { researchAreas } from "@/data/evidence";
import { FOUNDER_NAME, papers } from "@/data/publications";

/**
 * "WHY SHOULD I BELIEVE IT?" — a gateway, not the Research page.
 * =============================================================================
 * What stood here was about 2,600px: the evidence chain drawn at 1000×470, the
 * founder record, the three most recent references, two decision cards and the
 * responsible-deployment statement. All of it true, and most of it a second
 * copy of /research and /publications, which is where a reader who wants it
 * will end up anyway.
 *
 * A gateway is one credibility statement, the record itself, and the two doors.
 * Nothing is softened on the way down: the attribution is still explicit — the
 * papers and the patent are the FOUNDER'S academic and IP output, not
 * company-owned publications — because that distinction is the honest part and
 * cutting it would be the one edit that made this section shorter by making it
 * less true.
 *
 * THE PROOF POINTS ARE THE DIALS. `RecordInstrumentPanel` renders counts, not
 * ratios: twelve segments per dial and the lit segments ARE the number. Nothing
 * is scaled, weighted or inferred, and every figure comes from
 * `publications.ts` and `evidence.ts`, so this section cannot claim a paper
 * that does not exist.
 *
 * WHAT MOVED RATHER THAN WENT. The three most recent references are on
 * /publications, which this links to by name and count. The responsible-
 * deployment statement moved into the Trust gateway directly below, where it
 * belongs and where it is no longer the last paragraph of a research section.
 */

/** Dial readings are counts, not ratios: lit segments = the record itself. */
const record: RecordMetric[] = [
  { value: `${papers.length}`, label: "Peer-reviewed papers", lit: papers.length, tone: "cyan" },
  { value: "1", label: "Granted patent (India)", lit: 1, tone: "violet" },
  {
    value: `${researchAreas.length}`,
    label: "Research areas",
    lit: researchAreas.length,
    tone: "royal",
  },
  { value: "10+ yrs", label: "Of founder gait research", lit: 10, tone: "emerald" },
];

export function ResearchGateway() {
  return (
    <section
      id="research"
      aria-label="Research basis"
      className="home-section section relative overflow-hidden bg-obsidian-300/30"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[8%] top-[15%] h-72 w-72 rounded-full bg-radial-violet opacity-40 blur-3xl" />
        <div className="absolute bottom-[15%] right-[8%] h-72 w-72 rounded-full bg-radial-cyan opacity-40 blur-3xl" />
      </div>
      <div className="res-dotfield pointer-events-none absolute inset-0 -z-10" />

      <div className="container-wide">
        <SectionHeading
          eyebrow="Research basis"
          title={
            <>
              Built on a{" "}
              <span className="text-gradient">published research record.</span>
            </>
          }
          description="The platform draws on peer-reviewed research in gait recognition, pose-based movement analysis, privacy-aware gait data and edge inference."
          align="left"
          size="lg"
        />

        <Reveal>
          <div className="res-record-block mt-8">
            <div className="res-record-head">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/[0.08] px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                <span className="pill-dot" />
                Founder research record
              </div>
              <p className="mt-4 max-w-3xl font-display text-xl leading-snug text-balance text-soft-white sm:text-2xl">
                {papers.length} peer-reviewed papers and one granted Indian
                patent, authored by founder {FOUNDER_NAME} with academic
                co-authors — the research this platform is built on.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-soft-mute">
                Academic and individually held records rather than
                company-produced output.{" "}
                <Link
                  href="/research#attribution"
                  className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 transition-colors hover:text-cyan-200"
                >
                  How we draw that line
                </Link>
                .
              </p>
            </div>

            <RecordInstrumentPanel
              metrics={record}
              caption="Twelve segments per dial; the lit segments are the count itself — nothing scaled, weighted or inferred."
            />
          </div>
        </Reveal>

        {/* The two doors. The motif beside them draws what the links lead to —
            a claim traced back to the record behind it — so the row is a
            diagram with two destinations rather than two buttons. It is the
            compressed form of what used to be two full decision cards: the
            privacy card moved to the Trust section, which is where a reader
            looking for it would actually go. */}
        <div className="mt-8 border-t border-white/[0.07] pt-7">
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Evidence map
              </div>
              <h3 className="mt-3 max-w-xl font-display text-xl text-soft-white">
                See which paper or patent sits behind which capability.
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-soft-mute">
                Each research area lists its publications, the capabilities it
                underpins and the products built on those capabilities — so you
                can trace a claim rather than take it.
              </p>
            </div>
            <div className="text-cyan-300/70">
              <EvidenceChainMotif />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-1">
            <Link
              href="/research"
              className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 transition-colors hover:text-cyan-200"
            >
              Explore Research
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/publications"
              className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-soft-white transition-colors hover:text-cyan-200"
            >
              All {papers.length} papers &amp; the granted patent
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

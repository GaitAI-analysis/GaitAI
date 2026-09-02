import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ResearchSignal } from "@/components/visuals/ResearchSignal";
import {
  RecordInstrumentPanel,
  type RecordMetric,
} from "@/components/visuals/RecordInstrumentPanel";
import {
  EvidenceChainMotif,
  PrivacyLayerMotif,
} from "@/components/visuals/ResearchMotifs";
import { researchAreas } from "@/data/evidence";
import { FOUNDER_NAME, papers } from "@/data/publications";

// Three most recent papers as a teaser — the full library lives on
// /publications, so Home shows references rather than restating the grid.
const featuredPapers = [...papers].sort((a, b) => b.year - a.year).slice(0, 3);

/**
 * "Why should I believe it?" on the home page.
 *
 * Every figure is derived from the publication records, and the section is
 * explicit about whose record it is: the papers and the patent are the
 * founder's academic and IP output, and GaitAI is the platform built on top
 * of them. It does not claim company-owned publications, validation studies,
 * benchmarks, datasets or pilots — none are documented in this repository.
 * The full evidence map, the method commitments and what the record does not
 * cover all live on /research; Home carries the attributed record, the three
 * most recent references and the two links out — a teaser, not the story.
 *
 * The section leads with the diagram rather than with prose. `ResearchSignal`
 * draws the actual chain — captured gait → the layered movement engine → the
 * capabilities the published record backs — and separates the data path
 * (solid) from the evidence path (dashed), so "research basis" is something
 * the reader can see the shape of before reading a word of it. Every label in
 * it, and every dial reading in the instrument panel below, is derived from
 * `researchAreas` and `publications.ts`.
 */

/**
 * Distinct records (papers + patent) reaching each capability through the
 * research areas that ground it. Derived — a capability with no research area
 * mapped to it never appears, which is the honest answer for it.
 */
const capabilityRecords = (() => {
  const acc = new Map<string, { id: string; title: string; records: Set<string> }>();
  for (const area of researchAreas) {
    for (const capability of area.capabilities) {
      const entry =
        acc.get(capability.id) ??
        { id: capability.id, title: capability.title, records: new Set<string>() };
      for (const publication of area.publications) entry.records.add(publication.id);
      acc.set(capability.id, entry);
    }
  }
  return Array.from(acc.values())
    .map((entry) => ({ id: entry.id, title: entry.title, records: entry.records.size }))
    .sort((a, b) => b.records - a.records);
})();

const signalAreas = researchAreas.map((area) => ({
  id: area.id,
  title: area.title,
  records: area.publications.length,
}));

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

export function ResearchCredibility() {
  return (
    <section
      id="research"
      className="section relative overflow-hidden bg-obsidian-300/30"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[8%] top-[15%] h-72 w-72 rounded-full bg-radial-violet opacity-40 blur-3xl" />
        <div className="absolute bottom-[15%] right-[8%] h-72 w-72 rounded-full bg-radial-cyan opacity-40 blur-3xl" />
      </div>
      <div className="res-dotfield pointer-events-none absolute inset-0 -z-10" />

      <div className="container-wide">
        <SectionHeading
          eyebrow="Research basis · Responsible AI"
          title={
            <>
              Built on a{" "}
              <span className="text-gradient">published research record.</span>
            </>
          }
          description="The platform draws on peer-reviewed research in gait recognition, pose-based movement analysis, privacy-aware gait data and edge inference."
          align="left"
        />

        {/* ── The chain, drawn: capture → engine → the capabilities the
            record backs, with published work grounding the engine ── */}
        <Reveal delay={0.08}>
          <figure className="res-stage mt-12">
            <ResearchSignal
              areas={signalAreas}
              capabilities={capabilityRecords}
              className="hidden sm:block"
            />
            <ResearchSignal
              areas={signalAreas}
              capabilities={capabilityRecords}
              compact
              className="sm:hidden"
            />
            <figcaption className="res-stage-legend">
              <span className="res-legend-key">
                <span aria-hidden="true" className="res-legend-swatch res-legend-swatch--data" />
                Solid — the data path
              </span>
              <span aria-hidden="true" className="res-stage-legend-rule" />
              <span className="res-legend-key">
                <span
                  aria-hidden="true"
                  className="res-legend-swatch res-legend-swatch--evidence"
                />
                Dashed — published evidence grounding the engine
              </span>
            </figcaption>
          </figure>
        </Reveal>

        {/* Founder research record — explicitly attributed */}
        <Reveal>
          <div className="res-record-block mt-14">
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
              {/* The full attribution — publishers, years, patent scope and
                  the founder-vs-company distinction — is set out on /research;
                  Home states the fact and links there. */}
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

        {/* Featured references — a teaser, not the library */}
        <Reveal>
          <div className="mt-14 border-t border-white/[0.06]">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pt-8">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-soft-white">
                Most recent references
              </h3>
              <Link
                href="/publications"
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300 transition-colors hover:text-cyan-200"
              >
                All {papers.length} papers &amp; the granted patent
              </Link>
            </div>
            <ul className="mt-2">
              {featuredPapers.map((paper) => (
                <li key={paper.id}>
                  <Link
                    href={`/publications/${paper.id}/`}
                    className="group flex flex-col gap-1 border-b border-white/[0.06] py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                  >
                    <span className="min-w-0 text-[13.5px] leading-snug text-soft-gray transition-colors group-hover:text-soft-white">
                      {paper.title}
                    </span>
                    <span className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-soft-mute">
                      {paper.venue} · {paper.year}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Two decision points: the evidence map, and the privacy layer.
            Each opens with the mechanism drawn, so the card is a diagram with
            an explanation rather than a bordered paragraph. */}
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <div className="res-decision res-decision--cyan">
            <EvidenceChainMotif />
            <div className="res-decision-body">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Evidence map
              </div>
              <h3 className="mt-4 font-display text-xl text-soft-white">
                See which paper or patent sits behind which capability.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-soft-mute">
                Each research area on /research lists its publications, the
                capabilities it underpins and the products built on those
                capabilities — so you can trace a claim rather than take it.
              </p>
              <Link
                href="/research"
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 transition-colors hover:text-cyan-200"
              >
                Open the evidence map
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="res-decision res-decision--emerald">
            <PrivacyLayerMotif />
            <div className="res-decision-body">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Privacy by design
              </div>
              <h3 className="mt-4 font-display text-xl text-soft-white">
                Skeleton-only analytics, face blur, role-based access and
                audit logs — by design.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-soft-mute">
                PrivacyGuard is designed to support these controls at the
                pipeline level, before analytics — with configurable retention
                and exportable audit logs. It is privacy-aware architecture,
                not a guarantee of anonymity.
              </p>
              <Link
                href="/legal/security"
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300 transition-colors hover:text-emerald-200"
              >
                Read the control documentation
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Responsible deployment */}
        <div className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-soft-white">
            Responsible deployment
          </div>
          <p className="mt-1 text-sm leading-relaxed text-soft-mute">
            Identity-related capabilities — biometric, watchlist and
            identification — are intended only for lawful, authorized
            deployments with appropriate governance, access control and
            auditability. Where non-identifying movement intelligence is
            sufficient, that is the intended default. GaitAI outputs are
            decision support — they do not diagnose, and no compliance
            certification is claimed.
          </p>
        </div>
      </div>
    </section>
  );
}

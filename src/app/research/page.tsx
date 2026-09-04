import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { ResearchHero } from "@/components/research/ResearchHero";
import { ResearchLabs, type LabArea } from "@/components/research/ResearchLabs";
import { ResearchTelemetry } from "@/components/research/ResearchTelemetry";
import {
  EvidenceObservatory,
  type ObservatoryArea,
} from "@/components/research/EvidenceObservatory";
import type { PillarKind } from "@/components/research/PillarVisual";
import { PublicationLedger } from "@/components/research/PublicationLedger";
import { ResearchJourney } from "@/components/research/ResearchJourney";
import { ResearchManifesto } from "@/components/research/ResearchManifesto";
import { ResearchPrinciples } from "@/components/research/ResearchPrinciples";
import { ResearchCollaborationCTA } from "@/components/research/ResearchCollaborationCTA";
import { researchAreas, type AreaProduct } from "@/data/evidence";
import { mobilityProducts, productCount, secureProducts } from "@/data/products";
import {
  FOUNDER_NAME,
  allPublications,
  papers,
  patent,
} from "@/data/publications";
import styles from "@/components/research/observatory.module.css";

export const metadata: Metadata = {
  title: "Research — The evidence behind GaitAI movement intelligence",
  description: `A traceable research foundation: ${papers.length} peer-reviewed papers and granted Indian patent ${patent.patentNumber} across gait biometrics, pose-based movement analysis, privacy-aware gait data and edge intelligence — mapped to the capabilities and products each one informs.`,
  alternates: { canonical: "/research" },
};

/**
 * The research page.
 *
 * ONE argument, stated ONCE:
 *
 *   research foundation → capability → product
 *
 * The page used to state that relationship five times over — a pipeline
 * diagram, a provenance lineage, the evidence map, a filterable evidence
 * explorer, and a five-stage research-to-product rail — each in a different
 * spatial composition. Four of them were removed. A reader who has understood
 * the evidence map has understood all five, and the repetition was most of
 * this route's length.
 *
 * What is left, top to bottom:
 *
 *   hero          cinematic instrument view of a captured stride
 *   telemetry     hairline readout of the record's scale
 *   foundations   the four pillars, each stated as a scientific scene
 *   evidence map  the one interactive surface: pillar → capability → module
 *   record        the published record as an academic archive
 *   journey       four milestones on a drawn stride path
 *   how we work   the four method commitments
 *   principles    responsible research as a thin rail
 *   closing       the collaboration statement over a trajectory field
 *
 * Every figure, record, capability mapping and product link is derived from
 * `researchAreas`, `publications.ts` and `products.ts` — nothing on this page
 * is hand-maintained, and removing sections removed no data.
 *
 * WHAT THE REMOVED SECTIONS CARRIED, and where it now lives:
 *   · the pipeline's capability list — in the evidence map, per pillar
 *   · the lineage's provenance      — in the journey and the record
 *   · the explorer's filters        — the full record is /publications
 *   · the research/product boundary — stated under the evidence map, in the
 *     same words, because it is a claim-safety statement and not decoration
 *   · the evidence-status panel     — removed at the owner's request, twice
 *
 * There is no `#attribution` anchor and nothing links to one: the home page's
 * "How we draw that line" link pointed at an id this page never carried, and
 * that paragraph has since been removed along with it.
 */

/** Which scientific visual belongs to which research pillar. */
const PILLAR_KIND: Record<string, PillarKind> = {
  "res-gait-biometrics": "biometrics",
  "res-pose-gait": "pose",
  "res-privacy": "privacy",
  "res-edge": "edge",
};

/** Only the serializable fields the panel renders. */
const chip = (product: AreaProduct) => ({
  id: product.id,
  short: product.short,
  vertical: product.vertical,
  href: product.href,
});

const observatoryAreas: ObservatoryArea[] = researchAreas.map((area) => ({
  id: area.id,
  title: area.title,
  summary: area.summary,
  kind: PILLAR_KIND[area.id] ?? "pose",
  publications: area.publications.map((publication) => ({
    id: publication.id,
    title: publication.title,
    venue: publication.venue,
    year: publication.year,
    kind: publication.kind,
  })),
  capabilities: area.capabilities,
  products: area.products.map(chip),
  /* The two-tier split `evidence.ts` derives. Passing only the flat list let
     the panel imply that every product a broad capability touches was
     informed by the specific record. */
  directProducts: area.directProducts.map(chip),
  architecturalProducts: area.architecturalProducts.map(chip),
  boundary: area.boundary,
}));

/**
 * The four pillars, for the four visual labs. Paper and patent counts are
 * counted off each area's own resolved records — three of the four rest on a
 * single record, and writing the numbers by hand here would be the one place
 * they could drift from `publications.ts`.
 */
const labAreas: LabArea[] = researchAreas.map((area) => ({
  id: area.id,
  title: area.title,
  summary: area.summary,
  papers: area.publications.filter((p) => p.kind === "journal").length,
  patents: area.publications.filter((p) => p.kind === "patent").length,
  capabilities: area.capabilities.length,
}));

const telemetry = [
  { value: papers.length, label: "Peer-reviewed papers", pad: true },
  { value: 1, label: "Granted patent", pad: true },
  { value: researchAreas.length, label: "Research pillars", pad: true },
  { value: productCount, label: "Connected product modules" },
];

/**
 * The ledger is a selection, newest first, with the granted patent last so the
 * one champagne row closes the list. The full library stays on /publications.
 */
const LEDGER_PAPERS = 4;
const ledgerRecords = [
  ...[...papers].sort((a, b) => b.year - a.year).slice(0, LEDGER_PAPERS),
  patent,
].map((record) => ({
  id: record.id,
  kind: record.kind,
  title: record.title,
  venue: record.venue,
  publisher: record.publisher,
  year: record.year,
}));

export default function ResearchPage() {
  return (
    <div className={styles.page}>
      <ResearchHero />

      {/* ─────────── TELEMETRY — the record's scale, above the fold ─────────── */}
      <section className="border-t border-white/[0.07] bg-obsidian-300/25 pb-4 pt-2 sm:pb-6">
        <div className="container-wide">
          <ResearchTelemetry metrics={telemetry} />
        </div>
      </section>

      {/* ─────────── 01 · THE FOUR RESEARCH FOUNDATIONS ─────────── */}
      <section id="pillars" className="border-t border-white/[0.07] py-14 sm:py-16">
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>01</span>
            <div className="min-w-0">
              <h2 className={styles.eyebrow}>
                <span aria-hidden="true" className={styles.eyebrowRule} />
                Four research pillars
              </h2>
            </div>
          </div>

          <div className="mt-8 sm:mt-10">
            <ResearchLabs areas={labAreas} />
          </div>
        </div>
      </section>

      {/* ─────────── 02 · EVIDENCE MAP — the one map ─────────── */}
      <section id="evidence-map" className="section">
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>02</span>
            <div className="min-w-0">
              <h2 className={styles.eyebrow}>
                <span aria-hidden="true" className={styles.eyebrowRule} />
                Evidence map
              </h2>
            </div>
          </div>
          <h3 className="mt-8 max-w-3xl font-display text-[1.875rem] leading-[1.12] tracking-[-0.03em] text-balance text-soft-white sm:text-[2.5rem]">
            Which research informs{" "}
            <span className={styles.heroSpectrum}>which capability,</span> and
            which products are built on it.
          </h3>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-soft-mute">
            Select a pillar. The map redraws to that pillar&apos;s record, the
            capabilities it informs and the modules built on them.
          </p>

          <div className="mt-10 sm:mt-12">
            <EvidenceObservatory areas={observatoryAreas} />
          </div>

          {/* The research-foundation vs product-validation distinction. It
              travelled with the research-to-product section; it is a
              claim-safety statement, so it stays on the page in the same
              words, attached to the map that makes the mapping claim. */}
          <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-white/[0.07] pt-6">
            <p className="max-w-2xl text-[13.5px] leading-relaxed text-soft-mute">
              Research establishes the methodological foundation.
              Product-specific validation establishes fitness for a particular
              use.
            </p>
            <Link
              href="/research/evidence/"
              className="group inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 transition-colors hover:text-cyan-200"
            >
              Explore the full record
              <span
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────── 03 · THE RECORD ─────────── */}
      <section
        id="record"
        className="border-y border-white/[0.07] bg-obsidian-300/25 py-16 sm:py-20"
      >
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>03</span>
            <div className="min-w-0">
              <h2 className={styles.eyebrow}>
                <span aria-hidden="true" className={styles.eyebrowRule} />
                Selected research record
              </h2>
              <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-soft-mute">
                Peer-reviewed papers and the granted patent, as published.
              </p>
            </div>
          </div>

          <Reveal>
            <div className="mt-10">
              <PublicationLedger
                records={ledgerRecords}
                total={allPublications.length}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────── 04 · JOURNEY ─────────── */}
      <section id="journey" className="section">
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>04</span>
            <div className="min-w-0">
              <h2 className={styles.eyebrow}>
                <span aria-hidden="true" className={styles.eyebrowRule} />
                Research journey
              </h2>
            </div>
          </div>
          <h3 className="mt-8 max-w-2xl font-display text-[1.75rem] leading-[1.15] tracking-[-0.025em] text-balance text-soft-white sm:text-[2.125rem]">
            A decade of founder-led work,{" "}
            <span className={styles.heroSpectrum}>in four steps.</span>
          </h3>

          <ResearchJourney />
        </div>
      </section>

      {/* ─────────── 05 · MANIFESTO ─────────── */}
      <section className="section">
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>05</span>
            <div className="min-w-0">
              <h2 className={styles.eyebrow}>
                <span aria-hidden="true" className={styles.eyebrowRule} />
                How we work
              </h2>
            </div>
          </div>
          <h3 className="mt-8 max-w-2xl font-display text-[1.75rem] leading-[1.15] tracking-[-0.025em] text-balance text-soft-white sm:text-[2.125rem]">
            Four commitments that shape{" "}
            <span className={styles.heroSpectrum}>how outputs are built.</span>
          </h3>

          <ResearchManifesto />
        </div>
      </section>

      {/* ─────────── 06 · RESPONSIBLE RESEARCH ─────────── */}
      <ResearchPrinciples />

      {/* ─────────── 07 · CLOSING ─────────── */}
      <ResearchCollaborationCTA />
    </div>
  );
}

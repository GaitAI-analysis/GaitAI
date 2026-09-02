import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import { ResearchHero } from "@/components/research/ResearchHero";
import { ResearchLabs, type LabArea } from "@/components/research/ResearchLabs";
import { EvidenceBoundary } from "@/components/research/EvidenceBoundary";
import {
  ResearchPipeline,
  type PipelineCapability,
} from "@/components/research/ResearchPipeline";
import { ResearchTelemetry } from "@/components/research/ResearchTelemetry";
import { ResearchLineage } from "@/components/research/ResearchLineage";
import {
  EvidenceObservatory,
  type ObservatoryArea,
} from "@/components/research/EvidenceObservatory";
import type { PillarKind } from "@/components/research/PillarVisual";
import { PublicationLedger } from "@/components/research/PublicationLedger";
import { ResearchJourney } from "@/components/research/ResearchJourney";
import { ResearchToProductFlow } from "@/components/research/ResearchToProductFlow";
import { ResearchManifesto } from "@/components/research/ResearchManifesto";
import { ResearchPrinciples } from "@/components/research/ResearchPrinciples";
import { ResearchCollaborationCTA } from "@/components/research/ResearchCollaborationCTA";
import {
  EvidenceExplorer,
  type ExplorerArea,
} from "@/components/analytics/EvidenceExplorer";
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
 * The research page, composed as an observatory.
 *
 * One argument runs top to bottom — a decade of founder-led work, a published
 * record, the capabilities that record informs, and the platform built on
 * them — and every section states its part of that argument in a different
 * spatial composition, so the page never falls into heading / paragraph /
 * cards:
 *
 *   hero          cinematic instrument view of a captured stride
 *   telemetry     hairline readout of the record
 *   lineage       provenance drawn as one trunk and two branches
 *   evidence map  the interactive centrepiece: pillar → capability → module
 *   ledger        the published record as an academic archive
 *   journey       four milestones on a drawn stride path
 *   pipeline      research → output as five stages on one signal
 *   manifesto     the four method commitments as an editorial document
 *   principles    responsible research as a thin rail
 *   closing       the collaboration statement over a trajectory field
 *
 * Every figure, record, capability mapping and product link is derived from
 * `researchAreas`, `publications.ts` and `products.ts` — nothing on this page
 * is hand-maintained.
 *
 * The evidence-boundary panel that used to sit between the manifesto and the
 * principles rail was removed at the owner's request. The research-foundation
 * versus product-validation distinction it carried is still stated on the
 * page, in the pipeline section: "Research establishes the methodological
 * foundation. Product-specific validation establishes fitness for a
 * particular use." The four validation gaps it listed are no longer stated
 * anywhere on this route.
 *
 * The `#attribution` anchor is preserved — the home page links straight to it.
 * `#evidence-boundary` is gone with the section; nothing linked to it.
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

/**
 * The capabilities the published record actually reaches, with the number of
 * shipped modules built on each. Derived by walking the areas rather than
 * listed: a capability with no research node mapped to it must be absent from
 * the pipeline, not present with a zero.
 */
const pipelineCapabilities: PipelineCapability[] = (() => {
  const byId = new Map<string, PipelineCapability & { ids: Set<string> }>();
  for (const area of researchAreas) {
    for (const capability of area.capabilities) {
      if (!byId.has(capability.id)) {
        byId.set(capability.id, {
          id: capability.id,
          title: capability.title,
          description: capability.description,
          modules: 0,
          ids: new Set<string>(),
        });
      }
    }
  }
  for (const area of researchAreas) {
    for (const product of area.products) {
      for (const capabilityId of product.capabilityIds) {
        byId.get(capabilityId)?.ids.add(product.id);
      }
    }
  }
  return [...byId.values()]
    .map(({ ids, ...rest }) => ({ ...rest, modules: ids.size }))
    .sort((a, b) => b.modules - a.modules);
})();

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

/**
 * The same four areas, shaped for the Evidence Explorer: full record metadata
 * (venue, publisher, year, type, keywords) so the surface can filter by year
 * and record type, and the two product tiers kept separate so the chain can
 * show "directly informed" and "architecturally relevant" as different things.
 * Derived from `researchAreas` — nothing added.
 */
const explorerProduct = (product: AreaProduct) => ({
  id: product.id,
  short: product.short,
  label: product.label,
  family: product.vertical,
  href: product.href,
});

const explorerAreas: ExplorerArea[] = researchAreas.map((area) => ({
  id: area.id,
  title: area.title,
  summary: area.summary,
  records: area.publications.map((publication) => ({
    id: publication.id,
    title: publication.title,
    venue: publication.venue,
    publisher: publication.publisher,
    year: publication.year,
    kind: publication.kind,
    href: `/publications/${publication.id}/`,
    keywords: publication.keywords ?? [],
  })),
  capabilities: area.capabilities,
  directProducts: area.directProducts.map(explorerProduct),
  architecturalProducts: area.architecturalProducts.map(explorerProduct),
  boundary: area.boundary,
}));

const publicationYears = papers.map((p) => p.year);

export default function ResearchPage() {
  return (
    <div className={styles.page}>
      <ResearchHero />

      {/* ─────────── 01 · TELEMETRY ─────────── */}
      <section className="border-t border-white/[0.07] bg-obsidian-300/25 pb-4 pt-2 sm:pb-6">
        <div className="container-wide">
          <ResearchTelemetry metrics={telemetry} />
        </div>
      </section>

      {/* ─────────── 01b · THE FOUR RESEARCH LABS ─────────── */}
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

      {/* ─────────── 01c · CAPTURE → ENGINE → CAPABILITIES ─────────── */}
      <section className="border-t border-white/[0.07] py-16 sm:py-20">
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>01</span>
            <div className="min-w-0">
              <h2 className={styles.eyebrow}>
                <span aria-hidden="true" className={styles.eyebrowRule} />
                What the record grounds
              </h2>
              <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-soft-mute">
                What goes in, the layers it passes through, and the
                capabilities that come out with published work behind them.
              </p>
            </div>
          </div>

          <Reveal>
            <div className="mt-10 sm:mt-12">
              <ResearchPipeline capabilities={pipelineCapabilities} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────── 02 · PROVENANCE LINEAGE ─────────── */}
      <section
        id="attribution"
        className="border-y border-white/[0.07] py-16 sm:py-20"
      >
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>02</span>
            <div className="min-w-0">
              <h2 className={styles.eyebrow}>
                <span aria-hidden="true" className={styles.eyebrowRule} />
                Research provenance
              </h2>
              <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-soft-mute">
                Whose work this is, and what was built on it.
              </p>
            </div>
          </div>

          <Reveal>
            <div className="mt-10 sm:mt-12">
              <ResearchLineage
                papers={papers.length}
                patentNumber={patent.patentNumber ?? ""}
                founder={FOUNDER_NAME}
                yearFrom={2014}
                yearTo={Math.max(...publicationYears)}
                careCount={mobilityProducts.length}
                secureCount={secureProducts.length}
                moduleCount={productCount}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────── 03 · EVIDENCE MAP — the centrepiece ─────────── */}
      <section id="evidence-map" className="section">
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>03</span>
            <div className="min-w-0">
              <h2 className={styles.eyebrow}>
                <span aria-hidden="true" className={styles.eyebrowRule} />
                Evidence map
              </h2>
            </div>
          </div>

          <h3 className="mt-8 max-w-3xl font-display text-[1.875rem] leading-[1.12] tracking-[-0.03em] text-balance text-soft-white sm:text-[2.5rem]">
            See how published research informs{" "}
            <span className={styles.heroSpectrum}>
              GaitAI&apos;s capability layer.
            </span>
          </h3>
          <p className="mt-5 max-w-2xl text-[13.5px] leading-relaxed text-soft-mute">
            Select a pillar to trace it: the records it cites, the capabilities
            those records informed, and the modules documented as built on those
            capabilities.
          </p>

          <div className="mt-12 sm:mt-14">
            <EvidenceObservatory areas={observatoryAreas} />
          </div>
        </div>
      </section>

      {/* ─────────── 04 · EVIDENCE EXPLORER ─────────── */}
      <section
        id="evidence-explorer-section"
        className="border-y border-white/[0.07] bg-obsidian-300/25 py-16 sm:py-20"
      >
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>04</span>
            <div className="min-w-0">
              <h2 className={styles.eyebrow}>
                <span aria-hidden="true" className={styles.eyebrowRule} />
                Evidence explorer
              </h2>
              <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-soft-mute">
                The whole record, filterable — and the chain it supports,
                stated stage by stage.
              </p>
            </div>
          </div>

          <div className="mt-10 sm:mt-12">
            <EvidenceExplorer areas={explorerAreas} />
          </div>
        </div>
      </section>

      {/* ─────────── 04b · WHERE THE EVIDENCE STOPS ─────────── */}
      <section id="evidence-boundary" className="section">
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>04</span>
            <div className="min-w-0">
              <h2 className={styles.eyebrow}>
                <span aria-hidden="true" className={styles.eyebrowRule} />
                Evidence status
              </h2>
            </div>
          </div>

          <Reveal>
            <div className="mt-12 sm:mt-14">
              <EvidenceBoundary />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────── 05 · THE LEDGER ─────────── */}
      <section
        id="record"
        className="border-y border-white/[0.07] bg-obsidian-300/25 py-16 sm:py-20"
      >
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>05</span>
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

      {/* ─────────── 06 · JOURNEY ─────────── */}
      <section id="journey" className="section">
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>06</span>
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

      {/* ─────────── 07 · RESEARCH → PRODUCT ─────────── */}
      <section
        id="research-to-product"
        className="border-y border-white/[0.07] bg-obsidian-300/25 py-16 sm:py-20"
      >
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>07</span>
            <div className="min-w-0">
              <h2 className={styles.eyebrow}>
                <span aria-hidden="true" className={styles.eyebrowRule} />
                From research to product
              </h2>
            </div>
          </div>
          <h3 className="mt-8 max-w-2xl font-display text-[1.75rem] leading-[1.15] tracking-[-0.025em] text-balance text-soft-white sm:text-[2.125rem]">
            Where the record ends and{" "}
            <span className={styles.heroSpectrum}>the platform begins.</span>
          </h3>

          <ResearchToProductFlow />
        </div>
      </section>

      {/* ─────────── 08 · MANIFESTO ─────────── */}
      <section className="section">
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>08</span>
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

      {/* ─────────── 09 · RESPONSIBLE RESEARCH ─────────── */}
      <ResearchPrinciples />

      {/* ─────────── 10 · CLOSING ─────────── */}
      <ResearchCollaborationCTA />
    </div>
  );
}

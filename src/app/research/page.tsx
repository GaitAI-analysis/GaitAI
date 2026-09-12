import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { ResearchHero } from "@/components/research/ResearchHero";
import { ResearchSignal } from "@/components/visuals/ResearchSignal";
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
import { researchAreas, type AreaProduct, type ResearchArea } from "@/data/evidence";
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
 *   record-map    the research → engine → capability chain, drawn
 *   foundations   the four pillars, each stated as a scientific scene
 *   evidence map  the one interactive surface: pillar → capability → module
 *   record        the published record as an academic archive
 *   journey       four milestones on a drawn stride path
 *   how we work   the four method commitments
 *   principles    responsible research as a thin rail
 *   closing       the collaboration statement over a trajectory field
 *
 * `record-map` ARRIVED FROM THE HOME PAGE, which carried the whole research
 * argument a second time: the same headline this route's <h1> already uses,
 * the same counts the telemetry already shows, a three-row cut of the ledger
 * below, a card describing the evidence map that is ON this page, and two
 * responsibility notes that /legal/responsible-ai and /trust already own. One
 * thing in it existed nowhere else — the drawn chain — so that is the one
 * thing that moved. Home keeps a gateway: the claim, the four subjects and a
 * link here. See components/home/ResearchGateway.
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
 * ON `#attribution`. The home page used to link to `/research#attribution`
 * and this file's comment claimed the anchor was preserved — no element on
 * this route has ever carried that id, so the link has been landing at the
 * top of the page. The block that pointed at it is gone with the rest of the
 * home section, and the statement it wanted is on /publications, which states
 * it more fully: authored by the founder with academic co-authors, published
 * with named publishers, and explicitly not company-assigned. Nothing links
 * to `#attribution` any more.
 */

/* ── THE RECORD, DRAWN ────────────────────────────────────────────────────
   These three derivations came with `ResearchSignal` from the home page,
   unchanged. They are pure functions of `researchAreas`, which is itself
   derived from `publications.ts` and the GaitScape graph — so the diagram's
   labels, its record counts and its capability counts cannot drift from the
   telemetry above it or the ledger below it. There is one source of truth and
   this is a second reading of it, not a second copy. */

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

/**
 * Where a record node on the diagram leads, and what a screen reader hears
 * when it gets there. Both are derived from the area's own publications, so a
 * node can never advertise records it does not have.
 *
 * The route is the one the repository already supports: `/research/evidence/`
 * reads `?area=` and filters the evidence explorer to that area's records —
 * the same link `data/search-index.ts` and the Ask corpus already emit for a
 * research area. An area whose entire record is a single patent goes one
 * better and links to that patent's own record page, because there the record
 * IS the destination and a filter over one row is a worse answer than the row.
 *
 * These are canonical routes rather than on-page hashes, so they survived the
 * move from the home page untouched — and they still resolve to the fullest
 * view of each area's records, which the evidence map on this page deliberately
 * summarises rather than lists.
 */
function areaDestination(area: ResearchArea): { href: string; label: string } {
  const [only] = area.publications;
  if (area.publications.length === 1 && only?.kind === "patent") {
    return {
      href: `/publications/${only.id}/`,
      label: `View the granted patent record: ${area.title}`,
    };
  }
  const count = area.publications.length;
  return {
    href: `/research/evidence/?area=${area.id}`,
    label: `View ${count} ${area.title.replace(/&/g, "and").toLowerCase()} ${
      count === 1 ? "record" : "records"
    }`,
  };
}

const signalAreas = researchAreas.map((area) => {
  const { href, label } = areaDestination(area);
  return {
    id: area.id,
    title: area.title,
    records: area.publications.length,
    href,
    linkLabel: label,
  };
});

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

      {/* ─────────── 01 · THE RECORD, DRAWN ───────────
          The chain the home page used to carry, moved here whole: the same
          `ResearchSignal` component, the same two variants, the same legend
          and the same four linked record nodes. What did NOT come with it is
          everything the home section wrapped around it — the founder record
          and its dials, the three most recent references, the evidence-map
          and privacy cards and the responsible-deployment note — because each
          of those already exists on this page or on /publications in a fuller
          form, and a second copy is what this move was for removing. The
          headline came off for the same reason: this route's <h1> is already
          "Built on a published research record."  */}
      <section
        id="record-map"
        className="relative overflow-hidden border-t border-white/[0.07] py-14 sm:py-16"
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[8%] top-[15%] h-72 w-72 rounded-full bg-radial-violet opacity-40 blur-3xl" />
          <div className="absolute bottom-[15%] right-[8%] h-72 w-72 rounded-full bg-radial-cyan opacity-40 blur-3xl" />
        </div>
        <div className="res-dotfield pointer-events-none absolute inset-0 -z-10" />

        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>01</span>
            <div className="min-w-0">
              <h2 className={styles.eyebrow}>
                <span aria-hidden="true" className={styles.eyebrowRule} />
                The record, drawn
              </h2>
              <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-soft-mute">
                Captured gait, the layered movement engine, and the
                capabilities the published record backs — with each research
                area&apos;s own records one click away.
              </p>
            </div>
          </div>

          <Reveal delay={0.08}>
            <figure className="res-stage mt-10 sm:mt-12">
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
        </div>
      </section>

      {/* ─────────── 02 · THE FOUR RESEARCH FOUNDATIONS ─────────── */}
      <section id="pillars" className="border-t border-white/[0.07] py-14 sm:py-16">
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>02</span>
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

      {/* ─────────── 03 · EVIDENCE MAP — the one map ─────────── */}
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

      {/* ─────────── 04 · THE RECORD ─────────── */}
      <section
        id="record"
        className="border-y border-white/[0.07] bg-obsidian-300/25 py-16 sm:py-20"
      >
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>04</span>
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

      {/* ─────────── 05 · JOURNEY ─────────── */}
      <section id="journey" className="section">
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>05</span>
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

      {/* ─────────── 06 · MANIFESTO ─────────── */}
      <section className="section">
        <div className="container-wide">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionIndex}>06</span>
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

      {/* ─────────── 07 · RESPONSIBLE RESEARCH ─────────── */}
      <ResearchPrinciples />

      {/* ─────────── 08 · CLOSING ─────────── */}
      <ResearchCollaborationCTA />
    </div>
  );
}

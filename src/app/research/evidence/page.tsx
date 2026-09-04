import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  EvidenceExplorer,
  type ExplorerArea,
} from "@/components/analytics/EvidenceExplorer";
import { EvidenceBoundary } from "@/components/research/EvidenceBoundary";
import { researchAreas, type AreaProduct } from "@/data/evidence";
import { papers, patent } from "@/data/publications";
import styles from "@/components/research/observatory.module.css";

export const metadata: Metadata = {
  title: "Full evidence record — every paper mapped to every capability",
  description: `The complete evidence record behind GaitAI: ${papers.length} peer-reviewed papers and granted Indian patent ${patent.patentNumber}, each mapped to the capabilities it informs and the product modules built on them, filterable by year and record type.`,
  alternates: { canonical: "/research/evidence" },
};

/**
 * The full evidence record, on its own route.
 *
 * This surface used to sit on /research directly, under the evidence map,
 * which meant the main research page carried two interactive explorers of the
 * same relationship — and put a year/type filter bar in front of a reader who
 * had come to understand the argument, not to query it. /research now states
 * the argument once; anyone who wants the whole record with its filters
 * arrives here from "Explore the full record".
 *
 * Nothing was cut in the move: the areas, records, capabilities and both
 * product tiers are the same derivation the research page used to run, and
 * every mapping still comes from `researchAreas`.
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

export default function ResearchEvidencePage() {
  return (
    <div className={styles.page}>
      <section className="site-page-intro pb-14">
        <div className="container-wide">
          <Link
            href="/research#evidence-map"
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-soft-mute transition-colors hover:text-cyan-300"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Research
          </Link>

          <h1 className="mt-6 max-w-3xl font-display text-[2rem] leading-[1.1] tracking-[-0.03em] text-balance text-soft-white sm:text-[2.75rem]">
            The full evidence record.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-soft-gray">
            Every published record behind the platform, mapped to the
            capabilities it informs and the modules built on them. Filter by
            year or record type.
          </p>
          <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-soft-mute">
            Research establishes the methodological foundation. Product-specific
            validation establishes fitness for a particular use.
          </p>
        </div>
      </section>

      <section className="border-t border-white/[0.07] py-14 sm:py-16">
        <div className="container-wide">
          <EvidenceExplorer areas={explorerAreas} />
        </div>
      </section>

      {/* ── RESEARCH FOUNDATION ≠ PRODUCT VALIDATION ──
          `EvidenceBoundary` was written for this and then never mounted: the
          explorer above links to `#evidence-boundary` under every pillar, and
          that id existed nowhere in the repository — so the page's clearest
          statement about the limits of its own evidence was a link to
          nothing. It is mounted here, at the id the explorer already
          expects. */}
      <section
        id="evidence-boundary"
        className="site-anchor-offset border-t border-white/[0.07] py-14 sm:py-16"
      >
        <div className="container-wide">
          <h2 className="max-w-2xl font-display text-display-md text-balance text-soft-white">
            What the record establishes,{" "}
            <span className="text-gradient">and what it does not.</span>
          </h2>
          <div className="mt-10">
            <EvidenceBoundary />
          </div>
        </div>
      </section>
    </div>
  );
}

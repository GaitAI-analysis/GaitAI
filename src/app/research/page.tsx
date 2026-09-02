import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { MovementHeroBackground } from "@/components/sections/MovementHeroBackground";
import { EvidencePillar } from "@/components/research/EvidencePillar";
import { EvidenceStatus } from "@/components/research/EvidenceStatus";
import { ResearchTimeline } from "@/components/research/ResearchTimeline";
import { ResearchToProduct } from "@/components/research/ResearchToProduct";
import { researchAreas } from "@/data/evidence";
import { productCount } from "@/data/products";
import { gaitscapeRelationships } from "@/data/gaitscape/graph";
import { FOUNDER_NAME, papers, patent } from "@/data/publications";
import styles from "@/components/research/evidence.module.css";

export const metadata: Metadata = {
  title: "Research — The evidence behind GaitAI movement intelligence",
  description: `A traceable research foundation: ${papers.length} peer-reviewed papers and granted Indian patent ${patent.patentNumber} across gait biometrics, pose-based movement analysis, privacy-aware gait data and edge intelligence — mapped to the capabilities and products each one informs.`,
  alternates: { canonical: "/research" },
};

/**
 * The research evidence page.
 *
 * One idea dominates: RESEARCH -> CAPABILITY -> PRODUCT. Four evidence
 * pillars carry it, each resolved from real records — the research nodes in
 * the GaitScape graph hold actual publication ids, and the capability and
 * product links are the same documented relationships the graph renders.
 *
 * The scientific distinction is preserved but stated ONCE, in the evidence
 * status panel, rather than as a disclaimer repeated under every row: the
 * record establishes the foundation; it does not validate a product's output
 * for a particular use.
 *
 * Density was the problem this rewrite addresses, so blocks were compressed
 * rather than deleted:
 *   - the separate founder-record and platform-output sections became one
 *     provenance strip
 *   - the ten-model pipeline diagram became the conceptual chain in
 *     ResearchToProduct; `aiPipeline` in products.ts is untouched
 *   - the prose journey timeline became a rail
 *   - the Responsible AI block became a band pointing at the full policy
 *   - "what the record does not cover" became "current evidence boundary" —
 *     the same four facts, worded as scope rather than failure
 *
 * Nothing factual was removed: all 8 papers, the patent, every capability
 * mapping and every product link is still reachable on this page.
 */

/**
 * Products per capability across the whole platform, from the documented
 * `powered-by` relations. Deduplicated, because a product can reach the same
 * capability through more than one relation.
 */
const capabilityProductCounts: Record<string, number> = (() => {
  const counts: Record<string, number> = {};
  const seen = new Set<string>();
  for (const rel of gaitscapeRelationships) {
    if (rel.type !== "powered-by") continue;
    const key = `${rel.source}|${rel.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    counts[rel.target] = (counts[rel.target] ?? 0) + 1;
  }
  return counts;
})();

const heroMetrics = [
  { value: `${papers.length}`, label: "Peer-reviewed papers" },
  { value: "1", label: "Granted patent" },
  { value: `${researchAreas.length}`, label: "Research pillars" },
  { value: `${productCount}`, label: "Connected product modules" },
];

/** Method commitments — each describes practice or architecture, not results. */
const principles = [
  {
    title: "Traceable to a signal",
    desc: "Every score is built from named movement features — cadence, symmetry, variability, trajectory — so a reviewer can see what moved the number.",
  },
  {
    title: "Peer-reviewed foundations",
    desc: "Recognition, pose and privacy components come from work published with Springer, Elsevier and Wiley · IET; the edge pipeline is covered by a granted patent.",
  },
  {
    title: "Framed as decision support",
    desc: "Outputs are assessment, screening and monitoring. No product diagnoses — the design constraint, not a disclaimer added afterwards.",
  },
  {
    title: "Stated limitations",
    desc: "Each product's technical view lists what constrains capture quality, what the model does not infer, and where human review is required.",
  },
];

/**
 * The evidence boundary. The same four facts the page has always stated,
 * worded as scope rather than as failure.
 */
const boundary = [
  "Product-specific clinical validation",
  "Published sensitivity, specificity or accuracy benchmarks",
  "A public proprietary or multi-site dataset",
  "Named production deployment evidence",
];

const responsiblePoints = [
  "Privacy by default",
  "Consent & authority",
  "Explainable outputs",
  "No unsupported claims",
];

const publicationYears = papers.map((p) => p.year);

export default function ResearchPage() {
  return (
    <>
      {/* ─────────── HERO ─────────── */}
      <section className="site-page-intro relative overflow-hidden pb-16">
        <MovementHeroBackground />

        <div className="container-wide relative z-10">
          <div className="max-w-3xl">
            <span className="eyebrow">
              <span className="h-1 w-6 rounded-full bg-gradient-brand" />
              Research at GaitAI
            </span>
            <h1 className="mt-6 font-display text-display-2xl text-balance text-soft-white">
              Built on a{" "}
              <span className="text-gradient">published research record.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-soft-gray sm:text-lg">
              A traceable research foundation spanning gait biometrics,
              pose-based movement analysis, privacy-aware gait data and edge
              intelligence.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="#areas" className="btn-primary">
                Explore evidence
              </Link>
              <Link href="/publications" className="btn-ghost">
                Browse publications
              </Link>
            </div>
          </div>

          {/* Four restrained metrics — a hairline row, not statistic cards. */}
          <dl className="mt-14 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-white/[0.09] pt-8 sm:mt-16 md:grid-cols-4">
            {heroMetrics.map((metric) => (
              <div key={metric.label}>
                <dt className="sr-only">{metric.label}</dt>
                <dd>
                  <span className="block font-display text-[2rem] font-semibold leading-none tracking-[-0.03em] text-soft-white sm:text-[2.25rem]">
                    {metric.value}
                  </span>
                  <span className="mt-2.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-soft-mute">
                    {metric.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─────────── PROVENANCE STRIP ───────────
          Replaces the two full-height "founder research record" and "GaitAI
          platform output" sections. Same distinction, one strip. The
          #attribution id is kept — the home page links straight to it. */}
      <section
        id="attribution"
        className="border-y border-white/[0.07] bg-obsidian-300/30 py-12 sm:py-14"
      >
        <div className="container-wide">
          <h2 className="eyebrow">
            <span
              aria-hidden="true"
              className="h-1 w-6 rounded-full bg-gradient-brand"
            />
            Research provenance
          </h2>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] lg:gap-0">
            <div className="min-w-0">
              <h3 className="font-display text-[1.1875rem] leading-snug text-soft-white">
                Founder-led research
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-soft-gray">
                {papers.length} peer-reviewed papers + Patent{" "}
                {patent.patentNumber}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-soft-mute">
                {Math.min(...publicationYears)}–{Math.max(...publicationYears)}{" "}
                published record, authored by {FOUNDER_NAME} with academic
                co-authors
              </p>
              <Link
                href="/publications"
                className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-cyan-300 transition-colors hover:text-cyan-200"
              >
                View publications
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div
              aria-hidden="true"
              className="hidden items-center justify-center text-cyan-300/50 lg:flex"
            >
              →
            </div>

            <div className="min-w-0">
              <h3 className="font-display text-[1.1875rem] leading-snug text-soft-white">
                GaitAI platform
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-soft-gray">
                Movement-intelligence capabilities
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-soft-mute">
                MobilityCare + SecureVision · {productCount} modular products
              </p>
              <Link
                href="/products"
                className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-soft-white transition-colors hover:text-cyan-300"
              >
                Explore platform
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <p className="mt-8 max-w-3xl border-t border-white/[0.07] pt-6 text-[12.5px] leading-relaxed text-soft-mute">
            Academic publications and Patent {patent.patentNumber} constitute
            the research foundation. GaitAI product modules are subsequent
            platform implementations.
          </p>
        </div>
      </section>

      {/* ─────────── EVIDENCE MAP — the centrepiece ─────────── */}
      <section id="areas" className="section">
        <div className="container-wide">
          <div className="max-w-3xl">
            <span className="eyebrow">
              <span className="h-1 w-6 rounded-full bg-gradient-brand" />
              Evidence map
            </span>
            <h2 className="mt-5 font-display text-[2rem] leading-[1.12] tracking-[-0.025em] text-balance text-soft-white sm:text-[2.5rem]">
              See how published research informs{" "}
              <span className="text-gradient">
                GaitAI&apos;s capability layer.
              </span>
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:mt-14">
            {researchAreas.map((area) => (
              <Reveal key={area.id}>
                <EvidencePillar
                  area={area}
                  capabilityProductCounts={capabilityProductCounts}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── EVIDENCE STATUS — the distinction, stated once ─────────── */}
      <EvidenceStatus />

      {/* ─────────── RESEARCH JOURNEY ─────────── */}
      <ResearchTimeline />

      {/* ─────────── FROM RESEARCH TO PRODUCT ─────────── */}
      <ResearchToProduct />

      {/* ─────────── HOW WE WORK — 2×2 ─────────── */}
      <section className="bg-obsidian-300/25 py-16 sm:py-20">
        <div className="container-wide">
          <span className="eyebrow">
            <span className="h-1 w-6 rounded-full bg-gradient-brand" />
            How we work
          </span>
          <h2 className="mt-5 max-w-2xl font-display text-[1.75rem] leading-[1.15] tracking-[-0.02em] text-balance text-soft-white sm:text-[2.125rem]">
            Four commitments that shape{" "}
            <span className="text-gradient">how outputs are built.</span>
          </h2>

          <dl className="mt-12 grid gap-x-14 gap-y-9 sm:grid-cols-2">
            {principles.map((principle, i) => (
              <div key={principle.title} className={styles.principle}>
                <span
                  aria-hidden="true"
                  className={`${styles.principleIndex} font-mono text-[11px]`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <dt className="mt-2.5 font-display text-[1.1875rem] leading-snug text-soft-white">
                  {principle.title}
                </dt>
                <dd className="mt-2 max-w-prose text-[13.5px] leading-relaxed text-soft-mute">
                  {principle.desc}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─────────── CURRENT EVIDENCE BOUNDARY ─────────── */}
      <section id="evidence-boundary" className="section">
        <div className="container-wide">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <span className="eyebrow">
                <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                Current evidence boundary
              </span>
              <h2 className="mt-5 font-display text-[1.75rem] leading-[1.15] tracking-[-0.02em] text-balance text-soft-white sm:text-[2.125rem]">
                What has not yet been{" "}
                <span className="text-gradient">established publicly.</span>
              </h2>
              <p className="mt-5 max-w-prose text-[13.5px] leading-relaxed text-soft-mute">
                These are validation gaps to be addressed through future
                independent studies and collaborations.
              </p>
            </div>

            <ul className="lg:pt-2">
              {boundary.map((item) => (
                <li key={item} className={styles.boundaryRow}>
                  <span aria-hidden="true" className={styles.boundaryMark} />
                  <span className="text-[0.9375rem] leading-relaxed text-soft-gray">
                    {item}
                    <span className="sr-only"> — not yet established</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─────────── RESPONSIBLE RESEARCH & DEPLOYMENT — narrow band ─────────── */}
      <section className="border-y border-white/[0.07] bg-obsidian-300/30 py-10 sm:py-12">
        <div className="container-wide">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <div className="min-w-0">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Responsible research &amp; deployment
              </span>
              <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                {responsiblePoints.map((point) => (
                  <li
                    key={point}
                    className="text-[13.5px] leading-snug text-soft-gray"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/legal/responsible-ai"
              className="group inline-flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300 transition-colors hover:text-emerald-200"
            >
              Read Responsible AI documentation
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

      {/* ─────────── CTA — a study, not a demo ─────────── */}
      <section className="section">
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.09] bg-gradient-to-b from-white/[0.04] to-transparent p-10 sm:p-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-radial-violet opacity-35 blur-3xl" />
            <div className="ring-grid pointer-events-none absolute inset-0 opacity-25" />

            <div className="relative max-w-3xl">
              <h2 className="font-display text-[2rem] leading-[1.12] tracking-[-0.025em] text-balance text-soft-white sm:text-[2.5rem]">
                Research creates the foundation.{" "}
                <span className="text-gradient">
                  Validation builds the evidence for use.
                </span>
              </h2>
              <p className="mt-6 max-w-2xl text-[0.9375rem] leading-relaxed text-soft-gray sm:text-base">
                GaitAI welcomes research, clinical and technical collaborations
                that can independently evaluate movement-intelligence systems
                across mobility, rehabilitation, sports and safety settings.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/#contact" className="btn-primary">
                  Discuss a study
                </Link>
                <Link href="/publications" className="btn-ghost">
                  Browse publications
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

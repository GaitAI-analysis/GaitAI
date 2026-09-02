import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Lock } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { AIPipelineDiagram } from "@/components/visuals/AIPipelineDiagram";
import { JourneyTimeline } from "@/components/sections/JourneyTimeline";
import { MovementHeroBackground } from "@/components/sections/MovementHeroBackground";
import { ResearchAreaEvidence } from "@/components/research/ResearchAreaEvidence";
import { researchAreas } from "@/data/evidence";
import { productCount } from "@/data/products";
import { FOUNDER_NAME, papers, patent } from "@/data/publications";

export const metadata: Metadata = {
  title: "Research — The evidence behind GaitAI's movement intelligence",
  description:
    "GaitAI's research basis, area by area: the peer-reviewed papers and granted patent behind gait recognition, pose-based gait analysis, privacy-preserving gait data and edge inference — and which capabilities and products each one underpins.",
  alternates: { canonical: "/research" },
};

/**
 * Evidence-led research page.
 *
 * Every research area below is resolved from real records: the four research
 * nodes in the GaitScape graph carry actual publication ids, and the
 * capability and product links come from the same documented relationships
 * the graph renders. Nothing is asserted that a paper, the patent or the
 * product architecture does not already support — and what the record does
 * NOT contain is stated openly in the "What the record does not cover"
 * section rather than left to be inferred.
 *
 * Previous version removed: six invented "research domains", six invented
 * "publication topics", and method claims (pre-registered protocols,
 * cross-validated benchmarks, curated multi-site datasets, clinical-grade
 * validation) with no supporting record anywhere in this repository.
 */

const publicationYears = papers.map((p) => p.year);

const recordStats = [
  { value: `${papers.length}`, label: "Peer-reviewed papers" },
  { value: "1", label: "Granted patent (India)" },
  { value: `${researchAreas.length}`, label: "Research areas" },
  { value: `${productCount}`, label: "Modular products" },
];

/** Method commitments — each describes practice or architecture, not results. */
const methodCommitments = [
  {
    title: "Traceable to a signal",
    desc: "Every score a product reports is built from named movement features — cadence, symmetry, variability, trajectory — so a clinician or operator can see what moved the number rather than accept an opaque output.",
  },
  {
    title: "Peer-reviewed foundations",
    desc: "The recognition, pose and privacy components come from work published with Springer, Elsevier and Wiley · IET, and the edge pipeline is covered by a granted Indian patent. Each area below lists its own records.",
  },
  {
    title: "Framed as decision support",
    desc: "Outputs are assessment, screening and monitoring. No product diagnoses, and every clinical page says so — the design constraint, not a disclaimer added afterwards.",
  },
  {
    title: "Stated limitations",
    desc: "Each product's technical view carries its own limitations section: what constrains capture quality, what the model does not infer, and where human review is required.",
  },
];

/** Stated plainly so no reader has to guess what is missing. */
const evidenceGaps = [
  "No clinical validation study, trial result or regulatory clearance.",
  "No published accuracy, sensitivity, specificity or latency benchmark.",
  "No proprietary or multi-site dataset released or described.",
  "No named customer, deployment or completed pilot.",
];

export default function ResearchPage() {
  return (
    <>
      {/* HERO */}
      <section className="site-page-intro relative overflow-hidden pb-20">
        <MovementHeroBackground />

        <div className="container-wide relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <span className="pill-dot" />
              Research · {papers.length} papers · 1 granted patent
            </div>
            <h1 className="mt-6 font-display text-display-2xl text-balance text-soft-white">
              The research{" "}
              <span className="text-gradient">GaitAI is actually built on.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-soft-gray sm:text-lg">
              Four research areas, each with the papers and patent behind it,
              the capabilities it grounds and the products that use them. Follow
              any claim back to its record.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="#areas" className="btn-primary">
                See the evidence map
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link href="/publications" className="btn-ghost">
                Browse publications
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WHOSE RECORD IS THIS — founder vs company */}
      <section
        id="attribution"
        className="border-y border-white/[0.06] bg-obsidian-300/40 py-14 sm:py-16"
      >
        <div className="container-wide">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="rounded-2xl border border-cyan-300/20 bg-gradient-to-b from-cyan-300/[0.04] to-transparent p-6 sm:p-8">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Founder research record
              </div>
              <h2 className="mt-4 font-display text-xl text-soft-white sm:text-2xl">
                {papers.length} peer-reviewed papers and one granted patent,
                authored by {FOUNDER_NAME}.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-soft-mute">
                Published between {Math.min(...publicationYears)} and{" "}
                {Math.max(...publicationYears)} with Springer, Elsevier and
                Wiley · IET, with academic co-authors. Patent{" "}
                {patent.patentNumber} is held by the named inventors, granted by
                the Government of India in {patent.year}. These are academic and
                individually held records — they are the foundation GaitAI is
                built on, not company-produced output.
              </p>
              <Link
                href="/publications"
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 transition-colors hover:text-cyan-200"
              >
                See every record
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent p-6 sm:p-8">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-soft-white">
                GaitAI platform output
              </div>
              <h2 className="mt-4 font-display text-xl text-soft-white sm:text-2xl">
                The engine, the {productCount} modules and the privacy
                architecture built on that foundation.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-soft-mute">
                What GaitAI has produced is the platform: the shared movement
                engine, the product modules across MobilityCare and
                SecureVision, the PrivacyGuard control layer, and the report and
                dashboard workflows around them. GaitAI does not currently hold
                company-assigned publications or patents of its own — where that
                changes, it will be listed here separately.
              </p>
              <Link
                href="/products"
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-soft-white transition-colors hover:text-cyan-300"
              >
                See the platform
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl glass sm:grid-cols-4">
            {recordStats.map((s) => (
              <div key={s.label} className="bg-gunmetal/30 p-6 text-center">
                <div className="stat-num text-2xl text-soft-white sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1.5 text-[10.5px] uppercase tracking-[0.18em] text-soft-mute">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EVIDENCE MAP — research area → publications → capabilities → products */}
      <section id="areas" className="section">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Evidence map"
            title={
              <>
                Each area, and{" "}
                <span className="text-gradient">what backs it.</span>
              </>
            }
            description="Each area below is a research foundation: published work that informed a capability, and the products built on that capability. A foundation is not a validation — the distinction is spelled out below the chain."
            align="left"
          />

          {/* The chain, one line per area. Column headers name what each step
              actually is, because the previous version let "research → product"
              be read as "this paper validates these products". It does not. */}
          <Reveal>
            <ol className="mt-12 overflow-hidden rounded-2xl border border-white/[0.08]">
              <li className="hidden gap-x-4 border-b border-white/[0.08] bg-white/[0.03] px-5 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)] sm:px-6">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
                  Research foundation
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
                  Capability informed by this work
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
                  Related GaitAI products
                </span>
              </li>
              {researchAreas.map((area) => (
                <li
                  key={`chain-${area.id}`}
                  className="grid gap-x-4 gap-y-1.5 border-b border-white/[0.06] bg-white/[0.015] px-5 py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)] sm:items-baseline sm:px-6"
                >
                  <a
                    href={`#${area.id}`}
                    className="text-[13.5px] font-medium text-soft-white transition-colors hover:text-cyan-300"
                  >
                    {area.title}
                  </a>
                  <span className="text-[12.5px] leading-snug text-soft-gray">
                    <span aria-hidden="true" className="mr-2 text-cyan-300/60">
                      &rarr;
                    </span>
                    {area.capabilities.map((c) => c.title).join(", ")}
                  </span>
                  <span className="text-[12.5px] leading-snug text-soft-mute">
                    <span aria-hidden="true" className="mr-2 text-cyan-300/60">
                      &rarr;
                    </span>
                    {area.products
                      .slice(0, 4)
                      .map((p) => p.short)
                      .join(", ")}
                    {area.products.length > 4
                      ? ` +${area.products.length - 4} more`
                      : ""}
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>

          {/* Said plainly, immediately after the chain. */}
          <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-soft-white">
              How to read this
            </h3>
            <dl className="mt-4 grid gap-x-10 gap-y-4 sm:grid-cols-3">
              <div>
                <dt className="text-[12.5px] font-semibold text-soft-white">
                  Research foundation
                </dt>
                <dd className="mt-1 text-[12.5px] leading-relaxed text-soft-mute">
                  Peer-reviewed work, or the granted patent, on the underlying
                  method. Real, citable, and listed per area.
                </dd>
              </div>
              <div>
                <dt className="text-[12.5px] font-semibold text-soft-white">
                  Capability informed by this work
                </dt>
                <dd className="mt-1 text-[12.5px] leading-relaxed text-soft-mute">
                  The platform capability that method informs — pose
                  estimation, gait analysis, movement biometrics and so on.
                </dd>
              </div>
              <div>
                <dt className="text-[12.5px] font-semibold text-soft-white">
                  Direct product validation
                </dt>
                <dd className="mt-1 text-[12.5px] leading-relaxed text-soft-mute">
                  <span className="text-amber-300">None published.</span> No
                  study in this record validates any GaitAI product&apos;s
                  output, and nothing on this page should be read as one.
                </dd>
              </div>
            </dl>
          </div>

          {/* Each area reads research → capability → product. The detail used
              to be one bordered three-column panel per area; it is now an open
              editorial layout with progressive disclosure. Same records, same
              capabilities, same product relationships. */}
          <div className="mt-14 divide-y divide-white/[0.07]">
            {researchAreas.map((area) => (
              <Reveal key={area.id}>
                <div className="py-14 first:pt-0 last:pb-0">
                  <ResearchAreaEvidence area={area} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* JOURNEY TIMELINE */}
      <JourneyTimeline variant="muted" />

      {/* PIPELINE */}
      <section className="section">
        <div className="container-wide">
          <SectionHeading
            eyebrow="From research to product"
            title={
              <>
                How research becomes a{" "}
                <span className="text-gradient">product module.</span>
              </>
            }
            description="Every model in this pipeline traces back to a research area above, and feeds the outputs the product pages describe."
            align="left"
          />
          <div className="mt-12">
            <AIPipelineDiagram />
          </div>
        </div>
      </section>

      {/* METHOD — editorial, replaces four near-identical feature cards */}
      <section className="section bg-obsidian-300/40">
        <div className="container-wide">
          <SectionHeading
            eyebrow="How we work"
            title={
              <>
                Reproducible foundations.{" "}
                <span className="text-gradient">Stated limits.</span>
              </>
            }
            description="A model that will sit in a clinical or safety workflow has to be explainable and honest about its edges. These are the commitments that shape how GaitAI's products are built and described."
            align="left"
          />

          <Reveal>
            <dl className="mt-12 grid gap-x-14 border-t border-white/[0.06] lg:grid-cols-2">
              {methodCommitments.map((commitment, i) => (
                <div
                  key={commitment.title}
                  className="flex gap-4 border-b border-white/[0.06] py-6"
                >
                  <span
                    aria-hidden="true"
                    className="font-mono text-[11px] tabular-nums text-cyan-300/70"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <dt className="font-display text-lg font-semibold text-soft-white">
                      {commitment.title}
                    </dt>
                    <dd className="mt-1.5 max-w-prose text-sm leading-relaxed text-soft-mute">
                      {commitment.desc}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </Reveal>

          {/* What the record does not cover */}
          <div className="mt-12 rounded-2xl border border-amber-300/20 bg-amber-300/[0.03] p-6 sm:p-8">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-amber-300">
              What the record does not cover
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-soft-gray">
              So that nothing above is read as more than it is, here is what
              GaitAI has <span className="text-soft-white">not</span> published:
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {evidenceGaps.map((gap) => (
                <li
                  key={gap}
                  className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-soft-mute"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300/60"
                  />
                  {gap}
                </li>
              ))}
            </ul>
            <p className="mt-4 max-w-2xl text-[12.5px] leading-relaxed text-soft-mute">
              Where a product page shows example figures, they are labelled as
              illustrative report values. Validation studies are exactly the
              kind of work we want research and clinical partners for.
            </p>
          </div>
        </div>
      </section>

      {/* RESPONSIBLE AI COMMITMENT */}
      <section className="section">
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-[2rem] border border-emerald-300/20 bg-gradient-to-b from-emerald-400/[0.04] to-transparent p-10 sm:p-14">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-50 blur-3xl"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(16,185,129,0.25), transparent 70%)",
              }}
            />
            <div className="ring-grid pointer-events-none absolute inset-0 opacity-30" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_1.4fr]">
              <div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/30">
                  <Lock aria-hidden="true" className="h-6 w-6" />
                </span>
                <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Responsible AI commitment
                </div>
                <h2 className="mt-3 font-display text-3xl text-balance text-soft-white sm:text-4xl">
                  Movement intelligence,{" "}
                  <span
                    style={{
                      background:
                        "linear-gradient(135deg, #10B981 0%, #4FD1FF 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    deployed responsibly.
                  </span>
                </h2>
                <Link
                  href="/legal/security"
                  className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300 transition-colors hover:text-emerald-200"
                >
                  Read the control documentation
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="space-y-4">
                {[
                  {
                    title: "Privacy by default",
                    desc: "Skeleton-only analytics, optional face blur, edge and on-device processing options, configurable retention and exportable audit logs.",
                  },
                  {
                    title: "Consent and authority",
                    desc: "Biometric and watchlist capabilities deploy only with lawful authority, consent and a full audit trail.",
                  },
                  {
                    title: "Explainability",
                    desc: "Every score is grounded in measurable movement features clinicians and operators can review.",
                  },
                  {
                    title: "No overclaiming",
                    desc: "No compliance certification, clinical approval or measured performance figure is claimed anywhere on this site.",
                  },
                ].map((c) => (
                  <div
                    key={c.title}
                    className="rounded-xl border border-white/8 bg-white/[0.025] p-4"
                  >
                    <div className="text-sm font-semibold text-soft-white">
                      {c.title}
                    </div>
                    <div className="mt-1 text-[13px] leading-relaxed text-soft-mute">
                      {c.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section !pt-0">
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-10 sm:p-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-radial-violet opacity-40 blur-3xl" />
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <span className="eyebrow">
                  <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                  Research collaboration &amp; validation studies
                </span>
                <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
                  Help us build the validation record this platform deserves.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/#contact" className="btn-primary">
                  Start a collaboration
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

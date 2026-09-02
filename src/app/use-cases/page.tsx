import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { UseCaseAudienceGrid } from "@/components/usecases/UseCaseAudienceGrid";
import { UseCaseExplorer } from "@/components/usecases/UseCaseExplorer";
import { EnvironmentIntelligence } from "@/components/analytics/EnvironmentIntelligence";
import { DeploymentConstellation } from "@/components/usecases/DeploymentConstellation";
import { DiagramField } from "@/components/visuals/DiagramField";
import { industryUseCases } from "@/data/products";
import { ctas } from "@/data/content";
import styles from "@/components/usecases/usecases.module.css";

export const metadata: Metadata = {
  title: "Use Cases — Which movement problem are you solving?",
  description:
    "GaitAI use cases by environment: the problem each one has, the approach GaitAI takes, the products involved and what they produce — across clinics, hospitals, sports, elderly care, transport hubs, smart cities, industry, retail and events.",
  alternates: { canonical: "/use-cases" },
};

/**
 * Problem-led environment discovery.
 *
 * The content model is unchanged — environment, problem, GaitAI approach,
 * relevant products, outputs — but it used to render as seventeen full-width
 * rows of prose, which read as a specification document rather than a page you
 * could find yourself in. It is now a card grid with progressive disclosure
 * behind search, family tabs and facet chips: the collapsed card carries the
 * problem in one sentence plus product and output chips, and the full
 * narrative is one click away in place. Nothing was dropped, and the
 * per-environment detail routes are still the deep version.
 *
 * The orientation strip below the hero exists because the page's first
 * question is which of the two families a reader belongs to, and the previous
 * hero answered that with two buttons and a diagram.
 */

const RIBBON = ["Environment", "Problem", "Products", "Outputs"];

export default function UseCasesPage() {
  return (
    <>
      {/* ── HERO ──
          The section carries the shared ecosystem field: a blueprint grid,
          contour bands and a node lattice that clusters toward the lower
          centre, where the system map's core sits. The hero's right half is
          the deployment constellation, so the first screen states the page's
          claim as a diagram rather than as an empty half. */}
      <section className="site-page-intro relative overflow-hidden pb-14">
        <DiagramField variant="ecosystem" gridMask="maskRight" className="-z-10" />

        <div className="container-wide">
          <div className={styles.heroGrid}>
            <div className="min-w-0 max-w-2xl">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Use cases
              </span>
              {/* The count is the headline. It comes from the records, so the
                  number and the map below it can never disagree. */}
              <h1 className="mt-5 font-display text-display-xl text-balance text-soft-white">
                {industryUseCases.length} environments,{" "}
                <span className="text-gradient">each with its own question.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-soft-gray sm:text-lg">
                Every environment brings a different problem, a different
                product mix and a different output. Find the one that looks
                like yours and see the products, signals and outputs that fit
                it.
              </p>

              {/* How every environment below is structured. */}
              <div className={styles.ribbon}>
                {RIBBON.map((step, i) => (
                  <span key={step} className={styles.ribbonStep}>
                    {i === 0 && (
                      <span aria-hidden="true" className={styles.ribbonDot} />
                    )}
                    {step}
                    {i < RIBBON.length - 1 && (
                      <span aria-hidden="true" className={styles.ribbonArrow}>
                        →
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Nine of the seventeen environments, each on a light trail back
                to one origin — placed so the origin sits directly above the
                system map's core. */}
            <div className={styles.heroArt}>
              <DeploymentConstellation />
            </div>
          </div>

        </div>
      </section>

      {/* ── WHO GAITAI SERVES ── */}
      <UseCaseAudienceGrid />

      {/* ── DISCOVERY + BOTH FAMILY GROUPS ── */}
      <UseCaseExplorer />

      {/* ── ENVIRONMENT INTELLIGENCE EXPLORER ──
          The analytical counterpart to the catalogue ABOVE it, and it sits
          below that catalogue on purpose: the page's job is to help someone
          find their environment, and it used to open with a control surface
          instead. Configure an environment, an objective and the capture
          available, and read the resulting module mix, signals, analytics,
          outputs and privacy posture. State lives in the URL. */}
      <section id="explore" className="section border-y border-white/[0.07] bg-obsidian-300/25">
        <div className="container-wide">
          <EnvironmentIntelligence />
        </div>
      </section>

      {/* ── CROSS-ENVIRONMENT CTA ── */}
      <section className="section">
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-b from-white/[0.05] to-transparent p-10 text-center sm:p-16">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-radial-cyan opacity-40 blur-3xl" />
            <div className="ring-grid pointer-events-none absolute inset-0 opacity-20" />

            <div className="relative mx-auto max-w-2xl">
              <span className="eyebrow justify-center">
                <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                Don&apos;t see your environment?
              </span>
              <h2 className="mt-6 font-display text-display-md text-balance text-soft-white">
                Tell us what movement problem you are solving.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-soft-gray">
                We&apos;ll map the right GaitAI product mix for your
                environment.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link href={ctas.pilot.href} className="btn-primary">
                  {ctas.pilot.label}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <Link href="/products#deploy" className="btn-ghost">
                  How deployment works
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartPulse, ShieldCheck } from "lucide-react";
import { UseCaseAudienceGrid } from "@/components/usecases/UseCaseAudienceGrid";
import { UseCaseExplorer } from "@/components/usecases/UseCaseExplorer";
import { EnvironmentIntelligence } from "@/components/analytics/EnvironmentIntelligence";
import { industryUseCases } from "@/data/products";
import { ctas } from "@/data/content";
import styles from "@/components/usecases/usecases.module.css";

export const metadata: Metadata = {
  title: "Use Cases — Which movement problem are you solving?",
  description:
    "GaitAI use cases by environment: the problem each one has, the approach GaitAI takes, the products involved and what they produce — across clinics, hospitals, sports, elderly care, transport hubs, smart cities, industry, retail and events.",
  alternates: { canonical: "/use-cases" },
};

const mobilityCases = industryUseCases.filter(
  (u) => u.vertical === "mobilitycare",
);
const secureCases = industryUseCases.filter(
  (u) => u.vertical === "securevision",
);

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

const FAMILIES = [
  {
    href: "#mobility",
    name: "MobilityCare",
    Icon: HeartPulse,
    tone: styles.toneCare,
    count: mobilityCases.length,
    blurb:
      "Camera and wearable movement intelligence, where the question is about one person's mobility.",
    items: ["Clinics", "Rehabilitation", "Sports", "Elderly care", "Home care"],
  },
  {
    href: "#secure",
    name: "SecureVision",
    Icon: ShieldCheck,
    tone: styles.toneSecure,
    count: secureCases.length,
    blurb:
      "Privacy-aware movement intelligence, where the question is about how a space is being used.",
    items: ["Transport", "Smart cities", "Campuses", "Factories", "Events"],
  },
];

const RIBBON = ["Environment", "Problem", "Products", "Outputs"];

export default function UseCasesPage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="site-page-intro relative overflow-hidden pb-14">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[10%] h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-radial-glow opacity-60 blur-3xl" />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

        <div className="container-wide">
          <div className="max-w-3xl">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Use cases
            </span>
            <h1 className="mt-5 font-display text-display-xl text-balance text-soft-white">
              Different environments. Different questions.{" "}
              <span className="text-gradient">One movement intelligence.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-soft-gray sm:text-lg">
              Find the environment that looks like yours and see the products,
              signals and outputs that fit it.
            </p>
          </div>

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

          {/* Orientation: which family am I? */}
          <div className={styles.compare}>
            {FAMILIES.map((f) => (
              <Link
                key={f.name}
                href={f.href}
                className={`${styles.compareCard} ${f.tone}`}
              >
                <span className={styles.compareTop}>
                  <span className={styles.compareName}>
                    <f.Icon aria-hidden="true" className="h-4 w-4" />
                    {f.name}
                  </span>
                  <span className={styles.compareCount}>
                    {f.count} environments
                  </span>
                </span>
                <span className={styles.compareBlurb}>{f.blurb}</span>
                <span className={styles.compareList}>
                  {f.items.map((item) => (
                    <span key={item} className={styles.compareItem}>
                      {item}
                    </span>
                  ))}
                </span>
                <span className={styles.compareGo}>
                  See these environments
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO GAITAI SERVES ── */}
      <UseCaseAudienceGrid />

      {/* ── ENVIRONMENT INTELLIGENCE EXPLORER ──
          The analytical counterpart to the catalogue below it: configure an
          environment, an objective and the capture available, and read the
          resulting module mix, signals, analytics, outputs and privacy
          posture. State lives in the URL. */}
      <section id="explore" className="section border-y border-white/[0.07] bg-obsidian-300/25">
        <div className="container-wide">
          <EnvironmentIntelligence />
        </div>
      </section>

      {/* ── DISCOVERY + BOTH FAMILY GROUPS ── */}
      <UseCaseExplorer />

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

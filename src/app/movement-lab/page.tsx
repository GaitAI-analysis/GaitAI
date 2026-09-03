import type { Metadata } from "next";
import Link from "next/link";
import { MovementLab } from "@/components/analytics/MovementLab";
import { SignalIntelligenceExplorer } from "@/components/analytics/SignalIntelligenceExplorer";
import { FootageMatch } from "@/components/analytics/FootageMatch";
import { SyntheticDataBadge } from "@/components/ui/SyntheticDataBadge";
import { SYNTHETIC_LABEL } from "@/data/lab-demo";
import { CAPABILITY_COUNT, MODULE_COUNT, SIGNAL_COUNT } from "@/data/analytics";
import { StatRow } from "@/components/analytics/primitives";
import { LabHeroInstrument } from "@/components/analytics/LabHeroInstrument";
import styles from "@/components/analytics/analytics.module.css";

export const metadata: Metadata = {
  title: "Movement Studio — See movement become intelligence",
  description:
    "An interactive demonstration of the GaitAI pipeline: video, pose, gait cycle, movement features, analytics and output — in a MobilityCare mode and an identity-free SecureVision mode. Illustrative demo running on synthetic data.",
  alternates: { canonical: "/movement-lab" },
};

/**
 * /movement-lab — the Movement Studio.
 *
 * A deliberate exception to the site's usual rule that every page states
 * facts: this page states a *demonstration*, and says so four times — in the
 * metadata description, in a badge above the fold, in a boundary panel under
 * the hero, and again inside every stage that shows a reading.
 *
 * Reached from the Explore menu, the home teaser, the products configurator,
 * GaitScape and the relevant CTAs. The URL stays /movement-lab: it is in the
 * sitemap and linked from five places, and a static export cannot redirect,
 * so renaming the route would break every one of them to no reader's
 * benefit. Only the visible name changed, to "Movement Studio".
 */
export default function MovementLabPage() {
  return (
    <div className={styles.lab}>
      {/* ── HERO ── */}
      <section className="site-page-intro relative overflow-hidden pb-10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[8%] h-[560px] w-[1000px] -translate-x-1/2 rounded-full bg-radial-glow opacity-50 blur-3xl" />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-25" />

        <div className="container-wide">
          {/* Two columns from lg: the copy keeps the left, the instrument
              takes the right half that was empty. Below lg the instrument
              moves under the description, where it is a diagram rather than a
              hero panel. */}
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12">
          <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Movement Studio
            </span>
            <SyntheticDataBadge label={SYNTHETIC_LABEL} />
          </div>

          <h1 className="mt-5 font-display text-display-xl text-balance text-soft-white">
            See movement become{" "}
            <span className="text-gradient">intelligence.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-soft-gray sm:text-lg">
            Explore how GaitAI transforms movement signals into structured
            analytical outputs — stage by stage, in both product families.
          </p>

          <div className="mt-8">
            <StatRow
              stats={[
                { value: String(MODULE_COUNT), label: "Modules on this pipeline" },
                { value: String(CAPABILITY_COUNT), label: "Capabilities" },
                { value: String(SIGNAL_COUNT), label: "Movement signals" },
                { value: "0", label: "Real recordings used" },
              ]}
            />
          </div>

          {/* The boundary, stated before the reader touches anything. */}
          <div className={`${styles.panel} mt-6`}>
            <div className={styles.panelBody}>
              <span className={styles.label}>What this is, and is not</span>
              <p className={`${styles.note} mt-2`}>
                This is an interactive technology demonstration running on
                synthetic data. It is not a medical device, not a diagnostic
                tool and not a live system, and no reading in it is a
                product-performance figure, a benchmark or a clinical result.
                The stage names, capability names, feature names and output
                names are the platform&apos;s own — the values are invented for
                illustration.
              </p>
              <p className={`${styles.note} mt-2`}>
                No personal data is used, uploaded or processed here. The
                SecureVision mode is identity-free by construction: it has no
                identification layer to switch on.
              </p>
            </div>
          </div>
          </div>

            {/* ── The instrument ── */}
            <div className="relative min-w-0 lg:pt-6">
              <LabHeroInstrument />
            </div>
          </div>
        </div>
      </section>

      {/* ── SIGNAL → INTELLIGENCE ──
          The platform-level answer to "how does movement become
          intelligence?": pick a capture source and the whole chain it feeds
          redraws. The lab below then answers the same question at one stage's
          depth. This surface is relationship data only — no measurements, so
          no synthetic-data badge; there are no invented numbers on it. */}
      <section className="border-t border-white/[0.07] py-14 sm:py-16">
        <div className="container-wide">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Signal → intelligence
          </span>
          <h2 className="mt-5 max-w-2xl font-display text-display-md text-balance text-soft-white">
            What one capture source{" "}
            <span className="text-gradient">actually becomes.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-soft-gray">
            Change the input and the chain below recomputes: the signals read
            from it, the capabilities that process them, the modules built on
            those capabilities and what they produce.
          </p>

          <div className="mt-10">
            <SignalIntelligenceExplorer />
          </div>
        </div>
      </section>

      {/* ── YOUR FOOTAGE ──
          The chain above answers "what does this input become"; this answers
          the question a reader actually arrives with — "would it work on
          mine?". Describe the scene, and every module is rated against what
          its own record says it needs. Nothing is uploaded and nothing is
          analysed: a real detector here would be claiming a production
          capability on a marketing page. */}
      <section className="border-t border-white/[0.07] py-14 sm:py-16">
        <div className="container-wide">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Your footage
          </span>
          <h2 className="mt-5 max-w-2xl font-display text-display-md text-balance text-soft-white">
            What could GaitAI read{" "}
            <span className="text-gradient">from your footage?</span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-soft-gray">
            Describe what your footage contains. Every module is rated against
            what its own record says it needs — and the reasons are listed
            underneath.
          </p>

          <div className="mt-10">
            <FootageMatch />
          </div>
        </div>
      </section>

      {/* ── THE LAB ── */}
      <section className="border-t border-white/[0.07] bg-obsidian-300/25 py-12 sm:py-16">
        <div className="container-wide">
          <MovementLab />
        </div>
      </section>

      {/* ── WHERE TO GO NEXT ── */}
      <section className="section">
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-10 sm:p-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-radial-cyan opacity-40 blur-3xl" />
            <div className="relative max-w-2xl">
              <span className="eyebrow">
                <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                From demonstration to deployment
              </span>
              <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
                This is the pipeline. The modules are where it gets applied.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-soft-gray">
                See which modules read which signals in an environment like
                yours, trace the research behind a capability, or walk the whole
                ecosystem as a map.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/products#stack" className="btn-primary">
                  Find your stack →
                </Link>
                <Link href="/gaitscape" className="btn-ghost">
                  Open GaitScape
                </Link>
                <Link href="/research#evidence-explorer" className="btn-ghost">
                  Evidence explorer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

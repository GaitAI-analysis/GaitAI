import type { Metadata } from "next";
import Link from "next/link";
import { MovementLab } from "@/components/analytics/MovementLab";
import { MovementAnalyzer } from "@/components/analytics/MovementAnalyzer";
import { SignalIntelligenceExplorer } from "@/components/analytics/SignalIntelligenceExplorer";
import { FootageMatch } from "@/components/analytics/FootageMatch";
import { FusionSandbox } from "@/components/analytics/FusionSandbox";
import { IllustrativeBadge } from "@/components/ui/IllustrativeBadge";
import { CAPABILITY_COUNT, MODULE_COUNT, SIGNAL_COUNT } from "@/data/analytics";
import { StatRow } from "@/components/analytics/primitives";
import { LabHeroInstrument } from "@/components/analytics/LabHeroInstrument";
import styles from "@/components/analytics/analytics.module.css";

/**
 * The description is one sentence in three places — the page metadata, the
 * share card and the structured data — so a rename can never leave two of
 * them disagreeing.
 */
const STUDIO_TITLE = "Movement Intelligence Lab";
const STUDIO_STRAP = "See movement become intelligence";
const STUDIO_DESCRIPTION =
  "An interactive demonstration of the GaitAI pipeline: video, pose, gait cycle, movement features, analytics and output — in a MobilityCare mode and an identity-free SecureVision mode. An illustrative demonstration with example values.";

export const metadata: Metadata = {
  title: `${STUDIO_TITLE} — See movement become intelligence`,
  description: STUDIO_DESCRIPTION,
  alternates: { canonical: "/movement-lab" },
  /* Without these the route inherited the site-wide card, so a shared link
     announced "GaitAI — Intelligence in Motion" and never the name of the
     thing being shared. The canonical URL is unchanged by the rename. */
  openGraph: {
    type: "website",
    url: "/movement-lab",
    siteName: "GaitAI",
    title: `${STUDIO_TITLE} — ${STUDIO_STRAP}`,
    description: STUDIO_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${STUDIO_TITLE} — ${STUDIO_STRAP}`,
    description: STUDIO_DESCRIPTION,
  },
};

/**
 * /movement-lab — the Movement Intelligence Lab.
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
 * benefit. The visible name is the Movement Intelligence Lab, which is what
 * the Explore menu, the Labs index and the search palette all call it.
 */
export default function MovementLabPage() {
  return (
    <div className={styles.lab}>
      {/* One WebPage node, so the rename reaches structured data too. The
          `url` is the existing route: the name changed, the address did not.
          No SoftwareApplication node — this page demonstrates a pipeline on
          example values and offers no application to download or run. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: STUDIO_TITLE,
            alternateName: STUDIO_STRAP,
            url: "https://gaitai.in/movement-lab/",
            description: STUDIO_DESCRIPTION,
            isPartOf: {
              "@type": "WebSite",
              name: "GaitAI",
              url: "https://gaitai.in",
            },
          }),
        }}
      />
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
              {STUDIO_TITLE}
            </span>
            <IllustrativeBadge />
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
This is an interactive technology demonstration. The stage,
                capability, feature and output names are the platform&apos;s
                own; the readings beside them are example values chosen to make
                the pipeline legible, not measurements, benchmarks or clinical
                results. It is not a medical device and not a live system.
              </p>
              <p className={`${styles.note} mt-2`}>
                Nothing is uploaded from this page. The analyzer below reads a
                file you choose entirely inside your browser — it is never
                transmitted, stored or retained anywhere — and the staged
                walkthroughs further down use example values only. The
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

      {/* ── ANALYZE A MOVEMENT VIDEO ──
          The one part of this page that runs on the reader's own footage, and
          the only one where a model actually runs: MediaPipe's BlazePose
          landmarker, client-side, on a clip the reader chooses.

          This site is a static export with no API routes, so client-side
          inference is not a fallback here — it is the only kind available.
          Every figure the workbench reports is computed from the clip in front
          of the reader, which is why it carries no illustrative badge: none
          of its values are examples. What a browser pose model cannot produce (cadence,
          stride length, walking speed, any clinical score) it does not show,
          and the workbench's own disclosure says so — deliberately there
          rather than here, so this heading can be about what the tool does. */}
      <section
        id="analyze"
        className="border-t border-white/[0.07] py-14 sm:py-16"
      >
        <div className="container-wide">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Try it on a clip
          </span>
          <h2 className="mt-5 max-w-2xl font-display text-display-md text-balance text-soft-white">
            Watch a pose model take a{" "}
            <span className="text-gradient">clip apart.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-soft-gray">
            Start with the prepared demo, bring your own video, or record a
            short walk — a real pose model runs on it in your browser, finding
            33 body landmarks per sampled instant, joint trajectories, the
            body&apos;s path through the frame, and the temporal channels that
            make up its Motion DNA. Nothing leaves the device.
          </p>

          <div className="mt-10">
            <MovementAnalyzer />
          </div>
        </div>
      </section>

      {/* ── SIGNAL → INTELLIGENCE ──
          `id="signal-chain"` is the Signal Inspector's address in GaitAI
          Labs, which links straight to this instrument.
          The platform-level answer to "how does movement become
          intelligence?": pick a capture source and the whole chain it feeds
          redraws. The lab below then answers the same question at one stage's
          depth. This surface is relationship data only — no measurements, so
          no illustrative badge; there are no invented numbers on it. */}
      <section
        id="signal-chain"
        className="border-t border-white/[0.07] py-14 sm:py-16"
      >
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

      {/* ── FUSION SANDBOX ──
          `id="fusion"` is its address in GaitAI Labs.

          It follows the signal chain deliberately. That instrument answers
          "what does this input become?" with every input healthy, which is
          the state every fusion diagram in every deck shows. This answers the
          two questions that follow — what happens when an input is missing,
          and what happens when one is quietly wrong — and the answers are not
          symmetric, which is the whole reason it is here.

          Relationship and architecture data only. No reading, no benchmark
          and no score, so no illustrative badge: there are no invented
          numbers on it, because there are no numbers on it. */}
      <section
        id="fusion"
        className="border-t border-white/[0.07] py-14 sm:py-16"
      >
        <div className="container-wide">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Fusion sandbox
          </span>
          <h2 className="mt-5 max-w-2xl font-display text-display-md text-balance text-soft-white">
            A missing input is a known unknown.{" "}
            <span className="text-gradient">A corrupted one is not.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-soft-gray">
            Set each input to available, missing or corrupted, and watch what
            happens to the channels. Break one and the read-out gets shorter.
            Corrupt one instead and it stays exactly the same size — which is
            the point.
          </p>

          <div className="mt-10">
            <FusionSandbox />
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
      <section
        id="footage"
        className="border-t border-white/[0.07] py-14 sm:py-16"
      >
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
                <Link href="/research/evidence/" className="btn-ghost">
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

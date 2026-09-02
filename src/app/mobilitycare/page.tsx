import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ClinicalReportVisual } from "@/components/visuals/ClinicalReportVisual";
import { RunningTrailVisual } from "@/components/visuals/RunningTrailVisual";
import { SmartwatchVisual } from "@/components/visuals/SmartwatchVisual";
import { MobilityCareHero } from "@/components/sections/MobilityCareHero";
import { MovementIntelligenceSection } from "@/components/sections/MovementIntelligenceSection";
import {
  industryUseCases,
  mobilityProducts,
  productById,
  watchcareFeatures,
} from "@/data/products";
import { intelligenceVocabularyFor } from "@/data/taxonomy";

export const metadata: Metadata = {
  title: "MobilityCare — Clinical movement intelligence",
  description:
    "GaitAI MobilityCare — AI-powered clinical gait, sports movement, rehabilitation, elderly mobility and WatchCare wearable intelligence.",
};

const mobilityUseCases = industryUseCases.filter(
  (u) => u.vertical === "mobilitycare"
);

/**
 * Signal + capability vocabulary, derived from the canonical taxonomy rather
 * than a hand-maintained list. The previous local array had drifted: it named
 * "Fall-risk prediction", "Tremor detection" and "Range of motion", none of
 * which are signals GaitAI documents reading anywhere else on the site.
 */
const mobilitySignals = intelligenceVocabularyFor("mobilitycare");

export default function MobilityCarePage() {
  const walkscan = productById("walkscan");
  const fallrisk = productById("fallrisk");
  const sportsmotion = productById("sportsmotion");
  const watchcare = productById("watchcare");

  return (
    <>
      {/* HERO — full-viewport canvas, same visual language as the homepage */}
      <MobilityCareHero />

      {/* PRODUCT GRID */}
      <section id="products" className="section bg-obsidian-300/40">
        <div className="container-wide">
          <SectionHeading
            eyebrow="MobilityCare · Product suite"
            title={
              <>
                {mobilityProducts.length} modular products on{" "}
                <span className="text-gradient">one movement engine.</span>
              </>
            }
            description="Filter by environment, deploy what's relevant. Every product produces clinician-friendly outputs and exportable reports."
            align="left"
          />
          <div className="mt-10">
            <ProductGrid vertical="mobilitycare" />
          </div>
        </div>
      </section>

      {/* WALKSCAN FLAGSHIP */}
      {walkscan && (
        <section id={walkscan.id} className="section">
          <div className="container-wide">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300">
                  GaitAI WalkScan
                </div>
                <h2 className="mt-5 font-display text-display-lg text-balance text-soft-white">
                  Turn a walking video into an{" "}
                  <span
                    style={{
                      background:
                        "linear-gradient(135deg, #0FA3B1 0%, #4FD1FF 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    objective clinical report.
                  </span>
                </h2>
                <p className="mt-5 max-w-md text-base leading-relaxed text-soft-gray">
                  {walkscan.description}
                </p>
                <ul className="mt-6 grid gap-2">
                  {walkscan.outputs.map((o) => (
                    <li
                      key={o}
                      className="flex items-center gap-2 text-sm text-soft-white"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                      {o}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/#contact"
                  className="mt-8 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300 transition-colors hover:text-teal-200"
                >
                  Pilot WalkScan in your clinic
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <ClinicalReportVisual />
            </div>
          </div>
        </section>
      )}

      {/* WATCHCARE FLAGSHIP (mini-version) */}
      {watchcare && (
        <section id={watchcare.id} className="section bg-obsidian-300/40">
          <div className="container-wide">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.2fr]">
              <SmartwatchVisual score={86} trend="up" />
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                  GaitAI WatchCare
                </div>
                <h2 className="mt-5 font-display text-display-lg text-balance text-soft-white">
                  Continuous mobility intelligence,{" "}
                  <span
                    style={{
                      background:
                        "linear-gradient(135deg, #FBBF24 0%, #D5A021 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    from the wrist.
                  </span>
                </h2>
                <p className="mt-5 max-w-md text-base leading-relaxed text-soft-gray">
                  {watchcare.description}
                </p>
                {/* Full WatchCare capability set — moved here from the home
                    page, where it was a second flagship block competing with
                    the product itself. */}
                <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {watchcareFeatures.map((f) => (
                    <div
                      key={f.title}
                      className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5 transition-colors hover:border-amber-300/30 hover:bg-amber-300/[0.03]"
                    >
                      <div className="text-sm font-semibold text-soft-white">
                        {f.title}
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-soft-mute">
                        {f.desc}
                      </p>
                      <div className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-amber-300/80">
                        {f.audience}
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/mobilitycare/watchcare/"
                  className="mt-7 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300 transition-colors hover:text-amber-200"
                >
                  Open the WatchCare product page
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SPORTSMOTION FLAGSHIP */}
      {sportsmotion && (
        <section id={sportsmotion.id} className="section">
          <div className="container-wide">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  GaitAI SportsMotion
                </div>
                <h2 className="mt-5 font-display text-display-lg text-balance text-soft-white">
                  Athlete movement —{" "}
                  <span className="text-gradient">measured, not guessed.</span>
                </h2>
                <p className="mt-5 max-w-md text-base leading-relaxed text-soft-gray">
                  {sportsmotion.description}
                </p>
                <ul className="mt-6 grid gap-2">
                  {sportsmotion.outputs.map((o) => (
                    <li
                      key={o}
                      className="flex items-center gap-2 text-sm text-soft-white"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card relative h-80 overflow-hidden p-0">
                <RunningTrailVisual />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FALLRISK FLAGSHIP */}
      {fallrisk && (
        <section id={fallrisk.id} className="section bg-obsidian-300/40">
          <div className="container-wide">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                  GaitAI FallRisk
                </div>
                <h2 className="mt-5 font-display text-display-lg text-balance text-soft-white">
                  Surface fall-risk indicators{" "}
                  <span
                    style={{
                      background:
                        "linear-gradient(135deg, #FBBF24 0%, #D5A021 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    while there is time to act.
                  </span>
                </h2>
                <p className="mt-5 max-w-md text-base leading-relaxed text-soft-gray">
                  {fallrisk.description}
                </p>
                {/* The three screening categories FallRisk assigns. The
                    previous version showed a 62 / 28 / 10 % cohort split —
                    an invented distribution — and built its colour class
                    dynamically, so Tailwind never emitted the utilities. */}
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {[
                    { label: "Low", tone: "text-emerald-300" },
                    { label: "Medium", tone: "text-amber-300" },
                    { label: "High", tone: "text-rose-300" },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center"
                    >
                      <div className={`font-display text-lg font-semibold ${r.tone}`}>
                        {r.label}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-soft-mute">
                        Screening category
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-soft-mute">
                  Categories are screening support for care teams, alongside
                  the contributing signals — not a diagnosis or a prediction of
                  an individual event.{" "}
                  <Link
                    href="/mobilitycare/fallrisk/"
                    className="text-amber-300 underline decoration-amber-300/40 underline-offset-2 transition-colors hover:text-amber-200"
                  >
                    How FallRisk works
                  </Link>
                  .
                </p>
              </div>
              <ClinicalReportVisual />
            </div>
          </div>
        </section>
      )}

      {/* CLINICAL USE CASES */}
      <section className="section">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Clinical · Sports · Wearable environments"
            title={
              <>
                Built for{" "}
                <span className="text-gradient">
                  the environments clinicians work in.
                </span>
              </>
            }
            description="From physiotherapy clinics to neurology wards, sports academies to elderly-care homes — each environment has a different problem, a different product mix and a different output."
            align="left"
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mobilityUseCases.map((u, i) => {
              const products = u.productIds
                .map((id) => productById(id))
                .filter((p): p is NonNullable<typeof p> => Boolean(p));
              return (
                <Reveal key={u.id} delay={(i % 3) * 0.08}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:border-teal-300/30 hover:bg-white/[0.04]">
                    <h3 className="font-display text-xl text-soft-white">
                      {u.industry}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-soft-mute">
                      {u.problem}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {products.map((p) => (
                        <span
                          key={p.id}
                          className="rounded-full border border-teal-300/30 bg-teal-300/8 px-2 py-0.5 text-[10.5px] font-medium text-teal-200"
                        >
                          {p.short}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.02] p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
                        Outcome
                      </div>
                      <div className="mt-1 text-[12.5px] leading-relaxed text-soft-white">
                        {u.outcome}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-10 sm:p-14">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-40 blur-3xl"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(15,163,177,0.25), transparent 70%)",
              }}
            />
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <span className="eyebrow">
                  <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                  MobilityCare for your clinic, hospital, academy or care home
                </span>
                <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
                  Pilot GaitAI with your team in 4–6 weeks.
                </h2>
              </div>
              <div className="flex gap-3">
                <Link href="/#contact" className="btn-primary">
                  Book a demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/products#deploy" className="btn-ghost">
                  How a pilot runs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MovementIntelligenceSection
        id="mobilitycare-intelligence-title"
        eyebrow="MOBILITYCARE INTELLIGENCE"
        emphasis="every step."
        description="From gait, balance and mobility change to rehabilitation progress and fall-risk insight — MobilityCare turns human-movement signals into clinically useful, actionable intelligence."
        rowOne={mobilitySignals}
      />
    </>
  );
}

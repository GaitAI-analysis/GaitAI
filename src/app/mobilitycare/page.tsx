import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Footprints,
  HeartPulse,
  Stethoscope,
  Trophy,
  Watch,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SkeletonOverlayVisual } from "@/components/visuals/SkeletonOverlayVisual";
import { ClinicalReportVisual } from "@/components/visuals/ClinicalReportVisual";
import { RunningTrailVisual } from "@/components/visuals/RunningTrailVisual";
import { SmartwatchVisual } from "@/components/visuals/SmartwatchVisual";
import {
  industryUseCases,
  productById,
  watchcareFeatures,
} from "@/data/products";

export const metadata: Metadata = {
  title: "MobilityCare — Clinical movement intelligence",
  description:
    "GaitAI MobilityCare — AI-powered clinical gait, sports movement, rehabilitation, elderly mobility and WatchCare wearable intelligence.",
};

const mobilityUseCases = industryUseCases.filter(
  (u) => u.vertical === "mobilitycare"
);

export default function MobilityCarePage() {
  const walkscan = productById("walkscan");
  const fallrisk = productById("fallrisk");
  const sportsmotion = productById("sportsmotion");
  const watchcare = productById("watchcare");

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden pt-36 pb-24 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-1/2 top-[10%] h-[640px] w-[1000px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(15,163,177,0.25), transparent 70%)",
            }}
          />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-40" />

        <div className="container-wide">
          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300">
                <HeartPulse className="h-3.5 w-3.5" />
                GaitAI MobilityCare
              </div>
              <h1 className="mt-6 font-display text-display-2xl text-balance text-soft-white">
                Clinical, sports, rehab &amp;{" "}
                <span
                  className="text-gradient"
                  style={{
                    background:
                      "linear-gradient(135deg, #0FA3B1 0%, #4FD1FF 60%, #7C3AED 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  wearable mobility intelligence.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-soft-gray sm:text-lg">
                Twelve AI-powered products that turn walking videos, sensor
                signals and motion patterns into clinical, sports and
                elderly-care insights — grounded in{" "}
                <span className="text-soft-white">10+ years of gait research</span>,
                built with clinicians, for clinicians.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="#products" className="btn-primary">
                  See all 12 products
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/#contact" className="btn-ghost">
                  Start a clinic pilot
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: Footprints, label: "Gait reports" },
                  { icon: Stethoscope, label: "Clinical workflow" },
                  { icon: Trophy, label: "Sports analytics" },
                  { icon: Watch, label: "WatchCare wearable" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-3"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-teal-400/10 text-teal-300 ring-1 ring-teal-300/20">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[11px] font-medium text-soft-white">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="card-glow relative h-80 overflow-hidden p-0">
                <div className="ring-grid absolute inset-0 opacity-50" />
                <SkeletonOverlayVisual accent="#0FA3B1" />
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/40 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-teal-300 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                  Live pose estimation
                </div>
              </div>
              <div className="mt-4">
                <ClinicalReportVisual />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT GRID */}
      <section id="products" className="section bg-obsidian-300/40">
        <div className="container-wide">
          <SectionHeading
            eyebrow="MobilityCare · Product suite"
            title={
              <>
                Twelve modular products on{" "}
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
                  <walkscan.icon className="h-3.5 w-3.5" />
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
                  <Watch className="h-3.5 w-3.5" />
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
                <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {watchcareFeatures.slice(0, 6).map((f) => {
                    const Icon = f.icon;
                    return (
                      <div
                        key={f.title}
                        className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] p-3"
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-amber-300/10 text-amber-300 ring-1 ring-amber-300/20">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="text-xs leading-relaxed text-soft-white">
                          {f.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                  <sportsmotion.icon className="h-3.5 w-3.5" />
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
                  <fallrisk.icon className="h-3.5 w-3.5" />
                  GaitAI FallRisk
                </div>
                <h2 className="mt-5 font-display text-display-lg text-balance text-soft-white">
                  Detect fall-risk{" "}
                  <span
                    style={{
                      background:
                        "linear-gradient(135deg, #FBBF24 0%, #D5A021 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    before incidents happen.
                  </span>
                </h2>
                <p className="mt-5 max-w-md text-base leading-relaxed text-soft-gray">
                  {fallrisk.description}
                </p>
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {[
                    { label: "Low", color: "emerald", count: "62%" },
                    { label: "Medium", color: "amber", count: "28%" },
                    { label: "High", color: "rose", count: "10%" },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center"
                    >
                      <div className={`text-2xl font-semibold text-${r.color}-300`}>
                        {r.count}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-soft-mute">
                        {r.label} risk
                      </div>
                    </div>
                  ))}
                </div>
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
            eyebrow="Clinical · Sports · Wearable use cases"
            title={
              <>
                Deploying MobilityCare across{" "}
                <span className="text-gradient">every environment.</span>
              </>
            }
            description="From physiotherapy clinics to neurology wards, sports academies to elderly-care chains — MobilityCare meets clinicians where they work."
            align="left"
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mobilityUseCases.map((u, i) => {
              const Icon = u.icon;
              const products = u.productIds
                .map((id) => productById(id))
                .filter((p): p is NonNullable<typeof p> => Boolean(p));
              return (
                <Reveal key={u.id} delay={(i % 3) * 0.08}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:border-teal-300/30 hover:bg-white/[0.04]">
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-teal-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-display text-xl text-soft-white">
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
                <Link href="/publications" className="btn-ghost">
                  See sample reports
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

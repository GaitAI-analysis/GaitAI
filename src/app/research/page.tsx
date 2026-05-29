import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Brain,
  Database,
  Eye,
  FileText,
  Footprints,
  GraduationCap,
  Lock,
  Microscope,
  Sparkles,
  Stethoscope,
  Waves,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { AIPipelineDiagram } from "@/components/visuals/AIPipelineDiagram";
import { JourneyTimeline } from "@/components/sections/JourneyTimeline";

export const metadata: Metadata = {
  title: "Research — A decade of gait & movement intelligence",
  description:
    "10+ years of GaitAI research across gait recognition, pose estimation, sensor fusion, clinical movement analytics and privacy-aware AI.",
};

const researchDomains = [
  {
    icon: Footprints,
    title: "Gait recognition",
    desc: "Identity from movement — non-contact biometrics, cross-view recognition, gait signatures under variable viewpoints, lighting and clothing.",
  },
  {
    icon: Eye,
    title: "Pose estimation",
    desc: "Skeleton tracking from monocular video — robust under occlusion, multi-person scenes, and edge-grade inference budgets.",
  },
  {
    icon: Waves,
    title: "Sensor fusion",
    desc: "Smartwatch and mobile IMU streams fused with vision-derived gait features for continuous, all-day movement intelligence.",
  },
  {
    icon: Brain,
    title: "Clinical movement analytics",
    desc: "Fall-risk modelling, rehabilitation tracking, neurological gait monitoring — co-designed with clinicians and validated against clinical workflows.",
  },
  {
    icon: Sparkles,
    title: "Sports & performance",
    desc: "Asymmetry detection, fatigue markers, return-to-play readiness and movement-quality scoring for athletes and rehabilitation.",
  },
  {
    icon: Lock,
    title: "Privacy-preserving AI",
    desc: "Skeleton-only analytics, face blur, on-device processing, audit-friendly pipelines and consent-aware deployment by design.",
  },
];

const publicationTopics = [
  "Gait recognition under view & clothing variation",
  "Pose estimation for clinical movement analysis",
  "Sensor-fusion architectures for wearable mobility",
  "Fall-risk scoring from gait variability",
  "Privacy-preserving movement analytics",
  "Sports-injury risk from running mechanics",
];

const methodPillars = [
  {
    icon: Microscope,
    title: "Methodology",
    desc: "Reproducible research: pre-registered protocols, cross-validated benchmarks, ablation-driven model design.",
  },
  {
    icon: Database,
    title: "Datasets",
    desc: "Curated multi-site datasets covering clinical, sports, elderly and field-deployment cohorts — with consent-first governance.",
  },
  {
    icon: Stethoscope,
    title: "Clinical validation",
    desc: "Workflows reviewed by physiotherapists, neurologists and geriatricians; outputs tuned to clinical decision-support quality.",
  },
  {
    icon: FileText,
    title: "Whitepapers & patents",
    desc: "Published methods, applied patents and applied-research notes that document how GaitAI's models actually work.",
  },
];

export default function ResearchPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden pt-36 pb-20 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[8%] top-[15%] h-72 w-72 rounded-full bg-radial-violet opacity-40 blur-3xl" />
          <div className="absolute right-[8%] top-[15%] h-72 w-72 rounded-full bg-radial-cyan opacity-50 blur-3xl" />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <span className="pill-dot" />
              Research · 10+ years of gait & movement AI
            </div>
            <h1 className="mt-6 font-display text-display-2xl text-balance text-soft-white">
              A decade of{" "}
              <span className="text-gradient">movement intelligence research.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-soft-gray sm:text-lg">
              GaitAI is the product of 10+ years of founder-led research in gait
              recognition, pose estimation, sensor fusion and privacy-aware AI —
              distilled into a platform with two verticals and 23 modular products.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/publications" className="btn-primary">
                Browse publications
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/#contact" className="btn-ghost">
                Collaborate on research
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* JOURNEY TIMELINE */}
      <JourneyTimeline />

      {/* RIBBON STATS */}
      <section className="border-y border-white/[0.06] bg-obsidian-300/40 py-10">
        <div className="container-wide">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl glass sm:grid-cols-4">
            {[
              { value: "10+ yrs", label: "Of gait research" },
              { value: "6", label: "Research domains" },
              { value: "23", label: "Shipped products" },
              { value: "Privacy", label: "First architecture" },
            ].map((s) => (
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

      {/* RESEARCH DOMAINS */}
      <section className="section">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Research domains"
            title={
              <>
                Six research areas, one{" "}
                <span className="text-gradient">unified engine.</span>
              </>
            }
            description="Each GaitAI product draws on multiple of these research domains. Together they form the movement-intelligence engine that powers MobilityCare and SecureVision."
            align="left"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {researchDomains.map((d, i) => {
              const Icon = d.icon;
              return (
                <Reveal key={d.title} delay={(i % 3) * 0.08}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:border-cyan-300/30 hover:bg-white/[0.04]">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-royal-400/20 to-violet-400/15 text-cyan-300 ring-1 ring-white/10">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-semibold text-soft-white">
                      {d.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-soft-mute">
                      {d.desc}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* PIPELINE */}
      <section className="section bg-obsidian-300/40">
        <div className="container-wide">
          <SectionHeading
            eyebrow="From research to product"
            title={
              <>
                How research becomes a{" "}
                <span className="text-gradient">shipped product.</span>
              </>
            }
            description="Every model in this pipeline traces back to a research domain — and feeds outputs that ship in the GaitAI product cards."
            align="left"
          />
          <div className="mt-12">
            <AIPipelineDiagram />
          </div>
        </div>
      </section>

      {/* METHODS */}
      <section className="section">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Methods · Datasets · Validation"
            title={
              <>
                Reproducible methods.{" "}
                <span className="text-gradient">Clinical-grade validation.</span>
              </>
            }
            description="GaitAI's research operates on the principle that a clinically-deployable model must be reproducible, validated and explainable — every output traces back to a measurable signal."
            align="left"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {methodPillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.title} delay={(i % 4) * 0.06}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:border-cyan-300/30 hover:bg-white/[0.04]">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-royal-400/20 to-cyan-300/10 text-cyan-300 ring-1 ring-white/10">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-semibold text-soft-white">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-soft-mute">
                      {p.desc}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* PUBLICATIONS PREVIEW */}
      <section className="section bg-obsidian-300/40">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Publications & topics"
            title={
              <>
                Active research areas across our{" "}
                <span className="text-gradient">publications.</span>
              </>
            }
            description="GaitAI's research output spans biometrics, clinical analytics, sensor systems and responsible AI. Full publication list lives in the newsroom."
            align="left"
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {publicationTopics.map((t, i) => (
              <Reveal key={t} delay={(i % 3) * 0.06}>
                <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/15 hover:bg-white/[0.04]">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-cyan-300/10 text-cyan-300 ring-1 ring-cyan-300/20">
                    <FileText className="h-3.5 w-3.5" />
                  </span>
                  <div className="text-[13px] leading-relaxed text-soft-white">
                    {t}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link
              href="/publications"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-300/8 px-5 py-2.5 text-sm font-semibold text-cyan-200 transition-all hover:border-cyan-300/60 hover:bg-cyan-300/15"
            >
              Open the publications newsroom
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOUNDER CREDIT */}
      <section className="section">
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-8 sm:p-10">
            <div className="ring-grid pointer-events-none absolute inset-0 opacity-30" />
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-40 blur-3xl"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(124,58,237,0.25), transparent 70%)",
              }}
            />

            <div className="relative grid items-center gap-8 lg:grid-cols-[auto_1fr]">
              {/* Portrait */}
              <Link
                href="/about#founder"
                className="group relative block h-32 w-32 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10 transition-transform hover:scale-[1.02] sm:h-40 sm:w-40"
              >
                <Image
                  src="/brand/founder-anubha-parashar.png"
                  alt="Dr. Anubha Parashar"
                  fill
                  sizes="160px"
                  className="object-cover object-top"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>

              {/* Credit */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  <Sparkles className="h-3 w-3" />
                  Founder &amp; principal researcher
                </div>
                <h3 className="mt-3 font-display text-2xl text-balance text-soft-white sm:text-3xl">
                  Dr. Anubha Parashar
                </h3>
                <p className="mt-1 text-[12.5px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
                  Ph.D. CS&amp;E (AI), Manipal University Jaipur · 10+ yrs ·
                  50+ publications · 6 patents
                </p>
                <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-soft-gray">
                  GaitAI&apos;s research direction is led by Dr. Anubha
                  Parashar, whose doctoral work on gait recognition under
                  occlusion, clothing variation and viewpoint changes — plus a
                  decade of applied work in AI, computer vision, biometrics,
                  generative AI and intelligent systems — forms the technical
                  backbone of every product on this site.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href="/about#founder"
                    className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-semibold text-cyan-200 transition-all hover:border-cyan-300/50 hover:bg-cyan-300/15"
                  >
                    Read the full founder profile
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                  <Link
                    href="https://anubhaparashar.github.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-soft-white transition-all hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <Award className="h-3.5 w-3.5" />
                    Visit portfolio
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESPONSIBLE AI COMMITMENT */}
      <section className="section">
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-[2rem] border border-emerald-300/20 bg-gradient-to-b from-emerald-400/[0.04] to-transparent p-10 sm:p-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-50 blur-3xl"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(16,185,129,0.25), transparent 70%)",
              }}
            />
            <div className="ring-grid pointer-events-none absolute inset-0 opacity-30" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_1.4fr]">
              <div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/30">
                  <Lock className="h-6 w-6" />
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
              </div>
              <div className="space-y-4">
                {[
                  {
                    title: "Privacy by default",
                    desc: "Skeleton-only analytics, face blur, on-device processing options, configurable retention and audit logs.",
                  },
                  {
                    title: "Consent and authority",
                    desc: "Biometric and watchlist capabilities deploy only with lawful authority, consent and full audit trails.",
                  },
                  {
                    title: "Explainability",
                    desc: "Every score is grounded in measurable features clinicians and operators can review.",
                  },
                  {
                    title: "Validation",
                    desc: "Clinical workflows reviewed with practising clinicians; performance benchmarked and reported transparently.",
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
      <section className="section">
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-10 sm:p-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-radial-violet opacity-40 blur-3xl" />
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <span className="eyebrow">
                  <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                  Research collaborations &amp; clinical pilots
                </span>
                <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
                  Co-design the next generation of movement intelligence.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/#contact" className="btn-primary">
                  Start a collaboration
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/about" className="btn-ghost">
                  Meet the team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

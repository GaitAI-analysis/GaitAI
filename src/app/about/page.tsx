import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Brain,
  Building2,
  Compass,
  Fingerprint,
  Globe2,
  Handshake,
  Heart,
  HeartHandshake,
  HeartPulse,
  Mail,
  Quote,
  Rocket,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Logo } from "@/components/ui/Logo";
import { JourneyTimeline } from "@/components/sections/JourneyTimeline";

const researchPortfolio = [
  {
    icon: Activity,
    title: "Medical gait analysis",
    desc: "Parkinson's risk, mobility assessment, fall-risk prediction, rehabilitation support, elderly care, posture analysis and patient monitoring.",
    accent: "teal",
  },
  {
    icon: ShieldCheck,
    title: "Gait biometrics & surveillance",
    desc: "Person recognition, suspicious movement analysis, secured gait signatures, non-contact biometric intelligence and public-safety systems.",
    accent: "blue",
  },
  {
    icon: Brain,
    title: "AI-based human movement intelligence",
    desc: "Sports, wellness, clinical screening, workplace safety, smart monitoring and future-ready human analytics.",
    accent: "violet",
  },
];

const audiences = [
  {
    icon: HeartPulse,
    title: "Patients",
    desc: "Early mobility screening, fall-risk detection, rehabilitation progress tracking and better clinical decision-making.",
  },
  {
    icon: Heart,
    title: "Elderly people",
    desc: "Safer monitoring at home and in care settings, with timely alerts before incidents — not after.",
  },
  {
    icon: Stethoscope,
    title: "Doctors & physiotherapists",
    desc: "Objective gait reports, measurable mobility insights and decision-support across clinical workflows.",
  },
  {
    icon: Trophy,
    title: "Sports professionals",
    desc: "Performance, posture, asymmetry and movement-efficiency analytics for athletes, academies and sports medicine.",
  },
  {
    icon: ShieldCheck,
    title: "Security teams",
    desc: "Intelligent surveillance, non-contact gait identification and privacy-aware safety analytics for public spaces.",
  },
  {
    icon: Building2,
    title: "Organizations",
    desc: "A new layer of safety, automation and decision intelligence for enterprises, campuses and smart-city operators.",
  },
];

export const metadata: Metadata = {
  title: "About — Mission, founder & team",
  description:
    "GaitAI's mission, founder story, partnerships and the team building the future of Human Movement Intelligence.",
};

const values = [
  {
    icon: Target,
    title: "Precision over hype",
    desc: "We ship measurable, validated movement intelligence — not vibes.",
  },
  {
    icon: HeartHandshake,
    title: "Clinician-first",
    desc: "Every clinical product is co-designed with the people who'll use it.",
  },
  {
    icon: Globe2,
    title: "Privacy by default",
    desc: "Skeleton-only analytics, consent logs, audit trails — built in, not bolted on.",
  },
  {
    icon: Rocket,
    title: "Deep tech, shipped",
    desc: "Research-grade models that run in clinics, stadiums and cities — not just papers.",
  },
];

const partnerships = [
  {
    icon: Building2,
    title: "Clinical partners",
    desc: "Physiotherapy networks, neurology and orthopedic clinics co-piloting MobilityCare products.",
  },
  {
    icon: Users,
    title: "Sports academies",
    desc: "Cricket, football, tennis and athletics academies running SportsMotion injury-risk programs.",
  },
  {
    icon: Globe2,
    title: "Public-sector & smart cities",
    desc: "Campus, transport and civic-body engagements piloting SecureVision crowd and safety analytics.",
  },
  {
    icon: Brain,
    title: "Research collaborations",
    desc: "University labs, CROs and hospitals running clinical-trial gait biomarker studies with us.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section className="site-page-intro relative overflow-hidden pb-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[10%] h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-radial-glow opacity-60 blur-3xl" />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              About GaitAI
            </div>
            <h1 className="mt-6 font-display text-display-2xl text-balance text-soft-white">
              Building the future of{" "}
              <span className="text-gradient">human movement intelligence.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-soft-gray sm:text-lg">
              GaitAI is a research-led deep-tech company turning the way humans
              move into actionable AI for healthcare, sports, elderly care and
              privacy-aware public safety — grounded in 10+ years of gait research
              and built with clinicians, researchers and operators.
            </p>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="section">
        <div className="container-wide">
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-royal-400/20 to-violet-400/15 text-cyan-300 ring-1 ring-white/10">
                <Compass className="h-5 w-5" />
              </span>
              <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Mission
              </div>
              <h2 className="mt-3 font-display text-display-lg text-balance text-soft-white">
                To make human movement{" "}
                <span className="text-gradient">measurable, meaningful and useful</span>{" "}
                for the world.
              </h2>
            </div>
            <div className="space-y-5 text-soft-gray">
              <p className="text-lg leading-relaxed">
                The journey of GaitAI did not begin as a business idea. It began
                as a deep research vision — a belief that the way humans walk,
                move, balance, recover and behave carries powerful information
                about health, identity, safety and quality of life.
              </p>
              <p className="text-base leading-relaxed">
                The foundation was laid in 2014 around gait analysis for
                Parkinson&apos;s disease and the early prediction of
                movement-related disorders. By 2016 the research expanded into
                gait recognition for surveillance and security applications —
                using gait as a non-contact biometric where face, fingerprint or
                iris recognition fall short. Today, that decade of work powers a
                Human Movement Intelligence Platform with two verticals and 23
                modular products.
              </p>
            </div>
          </div>

          {/* Mission quote */}
          <MotionQuoteCard />
        </div>
      </section>

      {/* MISSION & VISION */}
      <section
        aria-label="Mission and vision"
        className="relative overflow-hidden border-y border-white/[0.06] py-20 sm:py-24 lg:py-28"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-30" />
        <div className="container-wide">
          <div className="grid gap-5 md:grid-cols-2">
            <Reveal className="h-full">
              <article className="relative h-full overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-b from-cyan-300/[0.04] to-transparent p-8 sm:p-10">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  Mission
                </div>
                <p className="mt-5 font-display text-2xl leading-snug text-balance text-soft-white sm:text-3xl">
                  To turn human movement into actionable intelligence that
                  improves mobility, performance, safety and security.
                </p>
              </article>
            </Reveal>

            <Reveal delay={0.08} className="h-full">
              <article className="relative h-full overflow-hidden rounded-3xl border border-violet-300/20 bg-gradient-to-b from-violet-300/[0.04] to-transparent p-8 sm:p-10">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/70 to-transparent" />
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">
                  Vision
                </div>
                <p className="mt-5 font-display text-2xl leading-snug text-balance text-soft-white sm:text-3xl">
                  To make movement intelligence a trusted layer of
                  decision-making across healthcare, sports, enterprise and
                  public-safety environments.
                </p>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* WHY GAITAI */}
      <section id="founder" className="section bg-obsidian-300/40">
        <div className="container-wide">
          <SectionHeading
            eyebrow="WHY GAITAI"
            title={
              <>
                Why <span className="text-gradient">GaitAI</span> exists.
              </>
            }
            description="Human movement carries information about mobility, performance, identity, risk and behaviour. GaitAI is built to turn those signals into measurable, explainable intelligence."
            align="left"
          />

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            {/* Platform identity card */}
            <Reveal>
              <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-6">
                <div className="ring-grid pointer-events-none absolute inset-0 opacity-30" />
                <div className="relative">
                  {/* Branded movement visual */}
                  <div
                    className="relative overflow-hidden rounded-xl ring-1 ring-white/10"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(79,209,255,0.18) 0%, rgba(124,58,237,0.18) 100%)",
                    }}
                  >
                    <div className="relative aspect-square w-full">
                      <MovementSignalVisual />
                    </div>
                    <div className="absolute left-4 top-4 rounded-lg border border-white/10 bg-obsidian/65 p-2 backdrop-blur-md">
                      <Logo variant="icon" size="sm" />
                    </div>
                  </div>

                  {/* Identity */}
                  <div className="mt-5">
                    <div className="font-display text-2xl font-semibold text-soft-white">
                      GaitAI
                    </div>
                    <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                      HUMAN MOVEMENT INTELLIGENCE
                    </div>
                    <p className="mt-4 font-display text-lg font-semibold text-soft-white">
                      One platform. Two verticals.
                    </p>
                  </div>

                  {/* Verticals */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.04] p-4">
                      <div className="text-sm font-semibold text-cyan-100">
                        MobilityCare
                      </div>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-soft-mute">
                        Health, rehabilitation, mobility and performance
                        intelligence.
                      </p>
                    </div>
                    <div className="rounded-xl border border-violet-300/20 bg-violet-300/[0.04] p-4">
                      <div className="text-sm font-semibold text-violet-100">
                        SecureVision
                      </div>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-soft-mute">
                        Surveillance, security, behavioural and crowd
                        intelligence.
                      </p>
                    </div>
                  </div>

                  {/* Capabilities */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      "Computer Vision",
                      "Wearables",
                      "Gait Analytics",
                      "Edge AI",
                    ].map((capability) => (
                      <span
                        key={capability}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10.5px] font-semibold text-soft-gray"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Narrative + tagline */}
            <Reveal delay={0.15}>
              <div className="space-y-5 text-soft-gray">
                {/* Tagline */}
                <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-5">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    OUR THESIS
                  </div>
                  <p className="mt-2 font-display text-lg text-balance text-soft-white sm:text-xl">
                    &ldquo;Movement is more than motion — it is a measurable
                    signal.&rdquo;
                  </p>
                </div>

                <p className="text-base leading-relaxed">
                  GaitAI brings together video, wearable signals and movement
                  analytics to understand how people move, how movement changes
                  and what those changes can reveal.
                </p>
                <p className="text-base leading-relaxed">
                  The platform connects research in gait analysis, biometrics and
                  intelligent systems with practical applications across
                  healthcare, rehabilitation, sports, surveillance, security and
                  public safety.
                </p>
                <p className="text-base leading-relaxed">
                  Rather than building disconnected AI tools, GaitAI organizes
                  these capabilities around a common movement-intelligence
                  foundation — enabling specialized products across MobilityCare
                  and SecureVision.
                </p>

                {/* Company principles chip */}
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  RESEARCH-LED &middot; MOVEMENT-FIRST &middot; REAL-WORLD AI
                </div>
              </div>
            </Reveal>
          </div>

        </div>
      </section>

      {/* JOURNEY TIMELINE */}
      <JourneyTimeline />

      {/* RESEARCH PORTFOLIO */}
      <section id="research-portfolio" className="section bg-obsidian-300/40">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Research foundation · 3 pillars"
            title={
              <>
                The research portfolio behind{" "}
                <span className="text-gradient">every GaitAI product.</span>
              </>
            }
            description="GaitAI's research portfolio spans medical gait analysis, biometric surveillance and human-movement AI — three pillars, one engine, every product traced back to peer-reviewed work."
            align="left"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {researchPortfolio.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.title} delay={(i % 3) * 0.08}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:border-cyan-300/30 hover:bg-white/[0.04]">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-royal-400/20 to-violet-400/15 text-cyan-300 ring-1 ring-white/10">
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

      {/* WHO WE SERVE */}
      <section id="who-we-serve" className="section">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Who GaitAI serves"
            title={
              <>
                Built for the people whose lives{" "}
                <span className="text-gradient">movement intelligence touches.</span>
              </>
            }
            description="From patients and clinicians to athletes, caregivers, security teams and large organizations — GaitAI is designed to make human movement measurable, meaningful and useful for everyone in the loop."
            align="left"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {audiences.map((a, i) => {
              const Icon = a.icon;
              return (
                <Reveal key={a.title} delay={(i % 3) * 0.06}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:border-cyan-300/30 hover:bg-white/[0.04]">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-royal-400/20 to-cyan-300/10 text-cyan-300 ring-1 ring-white/10">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-semibold text-soft-white">
                      {a.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-soft-mute">
                      {a.desc}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Intersection callout */}
          <Reveal delay={0.2}>
            <div className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8 sm:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  The intersection
                </span>
              </div>
              <p className="mt-4 font-display text-xl leading-relaxed text-soft-white sm:text-2xl">
                GaitAI stands at the intersection of{" "}
                <span className="text-gradient">healthcare, biometrics, surveillance, rehabilitation, sports science and artificial intelligence</span>
                {" "}— making it a uniquely scalable platform for the future of
                human movement analytics.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* VALUES */}
      <section className="section">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Values"
            title={
              <>
                What we{" "}
                <span className="text-gradient">build by.</span>
              </>
            }
            align="left"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <Reveal key={v.title} delay={(i % 4) * 0.06}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:border-cyan-300/30 hover:bg-white/[0.04]">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-royal-400/20 to-cyan-300/10 text-cyan-300 ring-1 ring-white/10">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-semibold text-soft-white">
                      {v.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-soft-mute">
                      {v.desc}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* PARTNERSHIPS */}
      <section className="section bg-obsidian-300/40">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Partnerships & collaborations"
            title={
              <>
                We build with{" "}
                <span className="text-gradient">the people who deploy us.</span>
              </>
            }
            description="GaitAI's product roadmap is shaped by pilots with hospitals, sports academies, civic bodies and research labs."
            align="left"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {partnerships.map((p, i) => {
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

      {/* INVESTORS / INCUBATION */}
      <section id="investors" className="section bg-obsidian-300/40">
        <div className="container-wide">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-400/20 to-cyan-300/10 text-amber-300 ring-1 ring-amber-300/30">
                <Handshake className="h-5 w-5" />
              </span>
              <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                Investors &amp; incubation
              </div>
              <h2 className="mt-3 font-display text-display-md text-balance text-soft-white">
                We&apos;re raising for the next stage of{" "}
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #FBBF24 0%, #D5A021 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  movement intelligence.
                </span>
              </h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  title: "Where we are",
                  desc: "Research-validated platform with two verticals, 23 products, multiple live pilots in healthcare and sports.",
                },
                {
                  title: "What we&apos;re building",
                  desc: "Clinical-grade WalkScan, FallRisk, RehabTrack and WatchCare commercial rollouts. SecureVision public-safety pilots in smart-city and campus environments.",
                },
                {
                  title: "Who we want to work with",
                  desc: "Deep-tech and healthcare-focused investors, incubators, research grants, and partners with a long view of human-centric AI.",
                },
              ].map((c) => (
                <div
                  key={c.title}
                  className="rounded-xl border border-white/8 bg-white/[0.025] p-4"
                >
                  <div className="text-sm font-semibold text-soft-white">
                    {c.title}
                  </div>
                  <div
                    className="mt-1 text-[13px] leading-relaxed text-soft-mute"
                    dangerouslySetInnerHTML={{ __html: c.desc }}
                  />
                </div>
              ))}
              <Link
                href="/#contact"
                className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/8 px-4 py-2 text-xs font-semibold text-amber-200 transition-all hover:border-amber-300/60 hover:bg-amber-300/15"
              >
                <Mail className="h-3.5 w-3.5" />
                Talk to us about investment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-10 sm:p-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-radial-glow opacity-40 blur-3xl" />
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <span className="eyebrow">
                  <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                  Partner · Invest · Collaborate
                </span>
                <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
                  Let&apos;s build the future of human movement intelligence
                  together.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/#contact" className="btn-primary">
                  Get in touch
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/research" className="btn-ghost">
                  Explore our research
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Abstract gait signal field for the Why GaitAI platform card.
 * Built from CSS paths and keypoints so the visual stays branded and
 * responsive without introducing decorative imagery.
 */
function MovementSignalVisual() {
  const keypoints = [
    "left-[54%] top-[18%] h-5 w-5",
    "left-[55%] top-[31%] h-2.5 w-2.5",
    "left-[43%] top-[35%] h-2.5 w-2.5",
    "left-[66%] top-[35%] h-2.5 w-2.5",
    "left-[34%] top-[48%] h-2 w-2",
    "left-[75%] top-[49%] h-2 w-2",
    "left-[28%] top-[62%] h-2 w-2",
    "left-[82%] top-[61%] h-2 w-2",
    "left-[53%] top-[55%] h-3 w-3",
    "left-[42%] top-[70%] h-2.5 w-2.5",
    "left-[65%] top-[72%] h-2.5 w-2.5",
    "left-[32%] top-[89%] h-2 w-2",
    "left-[73%] top-[89%] h-2 w-2",
  ];

  return (
    <div aria-hidden className="relative h-full w-full overflow-hidden bg-obsidian/45">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,209,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(79,209,255,0.055)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="absolute -left-[14%] top-[24%] h-[54%] w-[88%] -rotate-[18deg] rounded-[50%] border border-cyan-300/20" />
      <div className="absolute right-[-16%] top-[15%] h-[68%] w-[78%] rotate-[16deg] rounded-[50%] border border-violet-300/20" />
      <div className="absolute left-[13%] top-[47%] h-[26%] w-[74%] -rotate-[8deg] rounded-[50%] border-t border-dashed border-cyan-200/25" />

      <div className="absolute left-[56%] top-[24%] h-[9%] w-px bg-gradient-to-b from-cyan-200 to-violet-300" />
      <div className="absolute left-[45%] top-[34%] h-px w-[12%] origin-right -rotate-[18deg] bg-cyan-200/85" />
      <div className="absolute left-[57%] top-[34%] h-px w-[12%] origin-left rotate-[15deg] bg-violet-200/85" />
      <div className="absolute left-[36%] top-[37%] h-px w-[20%] origin-right -rotate-[50deg] bg-cyan-200/75" />
      <div className="absolute left-[68%] top-[37%] h-px w-[17%] origin-left rotate-[54deg] bg-violet-200/75" />
      <div className="absolute left-[29%] top-[50%] h-px w-[17%] origin-left rotate-[60deg] bg-cyan-200/65" />
      <div className="absolute left-[76%] top-[51%] h-px w-[15%] origin-left rotate-[49deg] bg-violet-200/65" />
      <div className="absolute left-[56%] top-[33%] h-[24%] w-px -rotate-[4deg] bg-gradient-to-b from-cyan-200/80 to-violet-300/80" />
      <div className="absolute left-[45%] top-[56%] h-px w-[13%] origin-right rotate-[7deg] bg-cyan-200/80" />
      <div className="absolute left-[57%] top-[56%] h-px w-[11%] origin-left -rotate-[8deg] bg-violet-200/80" />
      <div className="absolute left-[44%] top-[58%] h-px w-[18%] origin-left rotate-[61deg] bg-cyan-200/75" />
      <div className="absolute left-[57%] top-[58%] h-px w-[19%] origin-left rotate-[55deg] bg-violet-200/75" />
      <div className="absolute left-[34%] top-[71%] h-px w-[17%] origin-left rotate-[112deg] bg-cyan-200/65" />
      <div className="absolute left-[66%] top-[73%] h-px w-[18%] origin-left rotate-[59deg] bg-violet-200/65" />

      {keypoints.map((className, index) => (
        <span
          key={className}
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border ${
            index % 2 === 0
              ? "border-cyan-100/80 bg-cyan-300/45 shadow-[0_0_16px_rgba(79,209,255,0.55)]"
              : "border-violet-100/80 bg-violet-300/45 shadow-[0_0_16px_rgba(167,139,250,0.45)]"
          } ${className}`}
        />
      ))}

      <div className="absolute inset-x-8 bottom-6 flex items-end gap-1 opacity-65">
        {[18, 28, 13, 34, 23, 40, 17, 31, 21, 37, 15, 26].map(
          (height, index) => (
            <span
              key={`${height}-${index}`}
              className="flex-1 rounded-full bg-gradient-to-t from-violet-300/25 to-cyan-200/70"
              style={{ height }}
            />
          )
        )}
      </div>
    </div>
  );
}

/**
 * Mission quote card — the GaitAI philosophy statement.
 */
function MotionQuoteCard() {
  return (
    <div className="mt-16 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8 sm:p-10">
      <Quote className="h-8 w-8 text-cyan-300" />
      <blockquote className="mt-4 font-display text-xl leading-relaxed text-soft-white sm:text-2xl">
        &ldquo;Walking is more than motion. It is a{" "}
        <span className="text-gradient">signature</span>. It is a{" "}
        <span className="text-gradient">health indicator</span>. It is a{" "}
        <span className="text-gradient">safety signal</span>. It is a{" "}
        <span className="text-gradient">biometric identity</span>. It is a story
        of the human body.&rdquo;
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 text-sm text-soft-mute">
        <span className="h-px w-10 bg-cyan-300/60" />
        GaitAI · Philosophy
      </figcaption>
    </div>
  );
}

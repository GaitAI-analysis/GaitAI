import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  Building2,
  Compass,
  Fingerprint,
  Globe2,
  Handshake,
  Heart,
  HeartPulse,
  Mail,
  Quote,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trophy,
  Users,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { JourneyTimeline } from "@/components/sections/JourneyTimeline";

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

      {/* JOURNEY TIMELINE */}
      <JourneyTimeline />

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

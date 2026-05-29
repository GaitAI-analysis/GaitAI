import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Award,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Brain,
  Building2,
  Compass,
  Cpu,
  Eye,
  FileText,
  Fingerprint,
  Globe2,
  GraduationCap,
  Handshake,
  Heart,
  HeartHandshake,
  HeartPulse,
  Lightbulb,
  Mail,
  Mic,
  Quote,
  Rocket,
  ScanText,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Trophy,
  Users,
  Workflow,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
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

const founderCreds = [
  { value: "50+", label: "Peer-reviewed publications", icon: BookOpen },
  { value: "6", label: "Granted / published patents", icon: Award },
  { value: "~600", label: "Academic citations", icon: FileText },
  { value: "10+", label: "Keynote talks & invited sessions", icon: Mic },
];

const founderExpertise = [
  { label: "Artificial Intelligence & ML", icon: Brain },
  { label: "Deep Learning & Neural Networks", icon: Cpu },
  { label: "Computer Vision", icon: Eye },
  { label: "Generative AI & LLMs", icon: Sparkles },
  { label: "Biometrics & Gait Recognition", icon: Fingerprint },
  { label: "Edge AI & IoT Systems", icon: Workflow },
  { label: "Robotics & HMI", icon: Lightbulb },
  { label: "Data Science & Analytics", icon: Activity },
  { label: "OCR & Document Intelligence", icon: ScanText },
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
      <section className="relative overflow-hidden pt-36 pb-20 sm:pt-40">
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

      {/* FOUNDER STORY */}
      <section id="founder" className="section bg-obsidian-300/40">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Founder story"
            title={
              <>
                Meet the founder of{" "}
                <span className="text-gradient">GaitAI.</span>
              </>
            }
            description="GaitAI is built by a researcher who has spent the last decade at the intersection of AI, computer vision and gait intelligence — and an academic-turned-industry-builder bringing research to real-world deployment."
            align="left"
          />

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            {/* Founder portrait + identity card */}
            <Reveal>
              <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-6">
                <div className="ring-grid pointer-events-none absolute inset-0 opacity-30" />
                <div className="relative">
                  {/* Portrait */}
                  <div
                    className="relative overflow-hidden rounded-xl ring-1 ring-white/10"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(79,209,255,0.18) 0%, rgba(124,58,237,0.18) 100%)",
                    }}
                  >
                    <div className="relative aspect-square w-full">
                      <Image
                        src="/brand/founder-anubha-parashar.png"
                        alt="Dr. Anubha Parashar — Founder & CEO, GaitAI"
                        fill
                        sizes="(min-width: 1024px) 360px, 100vw"
                        className="object-cover object-top"
                        priority
                      />
                    </div>
                    {/* Gradient overlay for legibility on hover badge */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-obsidian/80 via-obsidian/40 to-transparent" />
                    <div className="absolute left-3 bottom-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/40 bg-obsidian/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300 backdrop-blur-md">
                      <Sparkles className="h-3 w-3" />
                      Founder &amp; CEO
                    </div>
                  </div>

                  {/* Identity */}
                  <div className="mt-5">
                    <div className="font-display text-2xl font-semibold text-soft-white">
                      Dr. Anubha Parashar
                    </div>
                    <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                      AI Research Scientist · Founder &amp; CEO, GaitAI
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed text-soft-mute">
                      AI Research Scientist, Analytics &amp; AI Engineer,
                      educator and technology innovator with 10+ years of
                      experience across AI, deep learning, computer vision,
                      biometrics, generative AI, NLP and intelligent systems.
                    </p>
                  </div>

                  {/* External links */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href="https://anubhaparashar.github.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-semibold text-cyan-200 transition-all hover:border-cyan-300/50 hover:bg-cyan-300/15"
                    >
                      <Globe2 className="h-3.5 w-3.5" />
                      Portfolio
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                    <Link
                      href="mailto:anubha@gaitai.com"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-soft-white transition-all hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Reach out
                    </Link>
                  </div>

                  {/* Credentials */}
                  <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
                    <div className="flex items-start gap-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-violet-400/15 text-violet-300 ring-1 ring-violet-300/30">
                        <GraduationCap className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <div className="text-[12.5px] font-semibold text-soft-white">
                          Ph.D. in Computer Science &amp; Engineering
                        </div>
                        <div className="mt-0.5 text-[11.5px] leading-relaxed text-soft-mute">
                          Specialization in Artificial Intelligence · Manipal
                          University Jaipur. Doctoral research on gait
                          recognition under occlusions, clothing variation and
                          viewpoint changes.
                        </div>
                      </div>
                    </div>
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
                    Founder tagline
                  </div>
                  <p className="mt-2 font-display text-lg text-balance text-soft-white sm:text-xl">
                    &ldquo;Bridging deep research and{" "}
                    <span className="text-gradient">
                      production-grade AI systems
                    </span>{" "}
                    — transforming research into scalable AI solutions for
                    real-world impact.&rdquo;
                  </p>
                </div>

                <p className="text-base leading-relaxed">
                  Dr. Anubha Parashar has built a career at the intersection of
                  cutting-edge research and real-world AI deployment, creating
                  solutions that transform complex data into practical business
                  outcomes. Her doctoral research at Manipal University Jaipur
                  focused on gait recognition and biometric intelligence —
                  developing advanced deep-learning systems capable of handling
                  occlusions, clothing variations and viewpoint changes.
                </p>
                <p className="text-base leading-relaxed">
                  She served for nearly eight years as a Senior Assistant
                  Professor in Computer Science &amp; Engineering, mentoring
                  postgraduate researchers and designing advanced AI curricula —
                  then transitioned into industry-focused AI innovation, leading
                  the development of production-grade systems spanning computer
                  vision, OCR, large language models, forecasting, optimization,
                  edge-AI deployments and intelligent automation.
                </p>
                <p className="text-base leading-relaxed">
                  Her applied portfolio includes work on solar-panel defect
                  detection, AI-powered document intelligence, virtual try-on,
                  OCR pipelines, intelligent forecasting platforms, optimization
                  systems and multimodal AI — all focused on building scalable,
                  production-ready AI that bridges advanced research with
                  practical deployment.
                </p>

                {/* 10+ years chip */}
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  10+ years across research, academia &amp; industry
                </div>
              </div>
            </Reveal>
          </div>

          {/* Research output strip */}
          <Reveal delay={0.25}>
            <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl glass sm:grid-cols-4">
              {founderCreds.map((c) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.label}
                    className="bg-gunmetal/30 p-5 text-center sm:p-7"
                  >
                    <span className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-royal-400/20 to-cyan-300/10 text-cyan-300 ring-1 ring-white/10">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="stat-num mt-3 text-2xl text-soft-white sm:text-3xl">
                      {c.value}
                    </div>
                    <div className="mt-1.5 text-[10.5px] uppercase tracking-[0.18em] text-soft-mute">
                      {c.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>

          {/* Expertise grid */}
          <Reveal delay={0.3}>
            <div className="mt-12">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Areas of expertise
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {founderExpertise.map((e) => {
                  const Icon = e.icon;
                  return (
                    <span
                      key={e.label}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-soft-white transition-all hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]"
                    >
                      <Icon className="h-3.5 w-3.5 text-cyan-300" />
                      {e.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* Recognition */}
          <Reveal delay={0.35}>
            <div className="mt-10 rounded-2xl border border-amber-300/20 bg-gradient-to-b from-amber-400/[0.04] to-transparent p-6 sm:p-7">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-300/15 text-amber-300 ring-1 ring-amber-300/30">
                  <Award className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                    Recognition
                  </div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-soft-white">
                    Known for combining deep technical expertise with strong
                    leadership and academic rigor, Dr. Parashar has earned
                    recognition as an{" "}
                    <span className="font-semibold">
                      award-winning researcher and innovator
                    </span>
                    . Her mission is to leverage AI to solve meaningful
                    real-world problems while advancing the boundaries of
                    intelligent systems research.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
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

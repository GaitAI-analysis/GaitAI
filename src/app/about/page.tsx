import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Brain,
  Cpu,
  Eye,
  FileCheck2,
  Fingerprint,
  GraduationCap,
  HeartPulse,
  Mail,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Watch,
} from "lucide-react";
import { assetPath } from "@/lib/paths";
import { papers, patent, FOUNDER_SCHOLAR_URL, FOUNDER_PORTFOLIO_URL } from "@/data/publications";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ResearchProductMap } from "@/components/sections/ResearchProductMap";

export const metadata: Metadata = {
  title: "About — Research, founder and company",
  description:
    "The GaitAI story: founder-led gait research, a granted patent, peer-reviewed publications and a movement-intelligence platform for MobilityCare and SecureVision.",
  alternates: { canonical: "/about" },
};

const founderStats = [
  { value: "10+", label: "Years across research, academia and industry" },
  { value: "50+", label: "Peer-reviewed publications" },
  { value: "6", label: "Granted or published patents" },
  { value: "~600", label: "Academic citations" },
  { value: "10+", label: "Keynotes and invited sessions" },
] as const;

const expertise = [
  { label: "Artificial intelligence and machine learning", icon: Brain },
  { label: "Computer vision and pose", icon: Eye },
  { label: "Biometrics and gait recognition", icon: Fingerprint },
  { label: "Edge AI and intelligent systems", icon: Cpu },
] as const;

const companyPrinciples = [
  {
    icon: Target,
    title: "Movement-specific",
    description: "The company is organized around human movement—not a generic AI toolset.",
  },
  {
    icon: BookOpen,
    title: "Research connected",
    description: "Publications and patent records are treated as part of the product story, not a footnote.",
  },
  {
    icon: Eye,
    title: "Inspectable",
    description: "Results and technical claims are designed to expose their research and methodology when source data is available.",
  },
  {
    icon: ShieldCheck,
    title: "Responsible",
    description: "Privacy, oversight and controlled access are expressed as product-architecture requirements.",
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden pb-24 pt-36 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[10%] h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-radial-glow opacity-55 blur-3xl" />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />
        <div className="container-wide">
          <div className="max-w-5xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              About GaitAI
            </div>
            <h1 className="mt-7 max-w-5xl font-display text-display-2xl text-balance text-soft-white">
              Movement has always carried <span className="text-gradient">information.</span>
            </h1>
            <p className="mt-7 max-w-3xl font-display text-2xl leading-snug text-soft-white sm:text-3xl">
              We built GaitAI to understand it.
            </p>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-soft-gray sm:text-lg">
              GaitAI is a research-led movement-intelligence company connecting gait biometrics, pose, video and wearable signals to applications in health, performance and safety.
            </p>
          </div>
        </div>
      </section>

      <section className="section border-y border-white/[0.06] bg-obsidian-300/40">
        <div className="container-wide">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="eyebrow">
                <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                Mission
              </div>
              <h2 className="mt-5 font-display text-display-lg text-soft-white">
                Make human movement measurable, meaningful and useful.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed text-soft-gray sm:text-lg">
              <p>
                Human movement can carry signals about identity, mobility, balance, risk, behavior, flow and performance. GaitAI’s role is to turn those signals into structured intelligence that people can inspect and act on.
              </p>
              <p>
                The company presents one shared movement engine first, then MobilityCare and SecureVision as two focused verticals. The complete product catalog remains available as specialized modules behind that platform story.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ResearchProductMap />

      <section id="founder" className="section">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Founder and principal researcher"
            title={
              <>
                Dr. Anubha Parashar <span className="text-gradient">bridges research and applied AI.</span>
              </>
            }
            description="Founder & CEO of GaitAI, AI Research Scientist, educator and technology builder with a Ph.D. in Computer Science & Engineering (AI) from Manipal University Jaipur."
            align="left"
          />

          <div className="mt-14 grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <Reveal>
              <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025]">
                <Image
                  src={assetPath("/brand/founder-anubha-parashar.png")}
                  alt="Dr. Anubha Parashar, Founder and CEO of GaitAI"
                  fill
                  sizes="(min-width: 1024px) 420px, 90vw"
                  className="object-cover object-top"
                />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-obsidian via-obsidian/55 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="font-display text-2xl text-white">Dr. Anubha Parashar</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-cyan-300">AI Research Scientist · Founder &amp; CEO</div>
                </div>
              </div>
            </Reveal>

            <div>
              <p className="text-lg leading-relaxed text-soft-gray">
                Her doctoral research focused on gait recognition under occlusion, clothing variation and viewpoint changes. Her public profile records a broader applied portfolio across computer vision, deep learning, edge AI, document intelligence, forecasting, optimization and multimodal systems.
              </p>
              <p className="mt-5 text-base leading-relaxed text-soft-mute">
                That combination of gait-specific research and production-oriented AI forms the technical foundation of GaitAI. The selected publication portfolio on this site includes {papers.length} papers, with a separate granted Indian patent for a covariate-based gait recognition system and optimized edge pipeline.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {expertise.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-3 border-b border-white/[0.07] py-3 text-sm text-soft-white">
                      <Icon className="h-4 w-4 text-cyan-300" />
                      {item.label}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={FOUNDER_SCHOLAR_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  <GraduationCap className="h-4 w-4" />
                  Google Scholar
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link href={FOUNDER_PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                  Founder portfolio
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-2 border-y border-white/10 sm:grid-cols-3 lg:grid-cols-5">
            {founderStats.map((stat) => (
              <div key={stat.label} className="border-b border-r border-white/[0.07] p-5 last:border-r-0 lg:border-b-0 lg:p-7">
                <div className="stat-num text-3xl text-soft-white sm:text-4xl">{stat.value}</div>
                <div className="mt-2 text-xs leading-relaxed text-soft-mute">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-obsidian-300/40">
        <div className="container-wide">
          <SectionHeading
            eyebrow="How GaitAI builds"
            title={
              <>
                Editorial clarity with <span className="text-gradient">technical discipline.</span>
              </>
            }
            description="Four principles now connect the company story, product architecture and research presentation."
            align="left"
          />
          <div className="mt-12 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {companyPrinciples.map((principle) => {
              const Icon = principle.icon;
              return (
                <article key={principle.title} className="bg-obsidian-300 p-6 sm:p-7">
                  <Icon className="h-5 w-5 text-cyan-300" />
                  <h3 className="mt-7 font-display text-xl text-soft-white">{principle.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-soft-mute">{principle.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="investors" className="section">
        <div className="container-wide">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="eyebrow">
                <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                Investor overview
              </div>
              <h2 className="mt-5 font-display text-display-lg text-soft-white">
                Why <span className="text-gradient">movement intelligence.</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-soft-gray">
                This public overview contains no confidential financial, funding, valuation or market-size claims.
              </p>
            </div>
            <div className="divide-y divide-white/[0.08] border-y border-white/10">
              <InvestorRow
                icon={Users}
                label="Why movement intelligence"
                text="Human movement connects health, performance, identity, behavior and operational flow through a common measurable signal."
              />
              <InvestorRow
                icon={Watch}
                label="Why now"
                text="GaitAI brings video, wearables, mobile sensors, pose estimation and edge computing into one movement-focused architecture."
              />
              <InvestorRow
                icon={FileCheck2}
                label="Why GaitAI"
                text={`10+ years of founder research, 50+ publications, Indian Patent No. ${patent.patentNumber}, and two focused verticals on one platform.`}
              />
              <InvestorRow
                icon={HeartPulse}
                label="Commercialization direction"
                text="MobilityCare and SecureVision organize the product portfolio; maturity, customer and deployment status are disclosed only when documented."
              />
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <a href="mailto:hello@gaitai.com?subject=Investor%20enquiry%20for%20GaitAI" className="btn-primary">
              <Mail className="h-4 w-4" />
              Investor enquiries
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/publications" className="btn-ghost">
              Review the evidence
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function InvestorRow({ icon: Icon, label, text }: { icon: typeof Users; label: string; text: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4 py-6">
      <Icon className="mt-1 h-5 w-5 text-cyan-300" />
      <div>
        <h3 className="font-display text-xl text-soft-white">{label}</h3>
        <p className="mt-2 text-sm leading-relaxed text-soft-mute">{text}</p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Eye,
  FileCheck2,
  Fingerprint,
  GitBranch,
  LockKeyhole,
  Microscope,
  ScanLine,
} from "lucide-react";
import { papers, patent } from "@/data/publications";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ResearchProductMap } from "@/components/sections/ResearchProductMap";
import { EvidenceSection } from "@/components/sections/EvidenceSection";
import { ResponsibleAI } from "@/components/sections/ResponsibleAI";

export const metadata: Metadata = {
  title: "Research — Gait biometrics to movement intelligence",
  description:
    "Explore GaitAI's verified publication themes, granted Indian patent and the research lineage connecting gait biometrics to MobilityCare and SecureVision.",
  alternates: { canonical: "/research" },
};

const researchThemes = [
  {
    icon: Fingerprint,
    title: "Gait recognition",
    description: "Recognition pipelines, covariates, view variation and non-contact biometric identity.",
  },
  {
    icon: Eye,
    title: "Biometrics",
    description: "Model-based gait techniques, feature extraction, classification and deep-learning methods.",
  },
  {
    icon: ScanLine,
    title: "Pose features",
    description: "Pose-based representations for robust covariate-invariant gait recognition.",
  },
  {
    icon: GitBranch,
    title: "Covariate robustness",
    description: "Clothing, viewpoint and other intra-class variations represented across the publication record.",
  },
  {
    icon: LockKeyhole,
    title: "Privacy",
    description: "Protection and de-identification of gait datasets in deep-learning pipelines.",
  },
  {
    icon: Microscope,
    title: "Feature engineering",
    description: "Data preprocessing, feature selection, reduction, transformation and comparison of methods.",
  },
] as const;

export default function ResearchPage() {
  return (
    <>
      <section className="relative overflow-hidden pb-24 pt-36 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[8%] top-[15%] h-72 w-72 rounded-full bg-radial-violet opacity-40 blur-3xl" />
          <div className="absolute right-[8%] top-[15%] h-72 w-72 rounded-full bg-radial-cyan opacity-45 blur-3xl" />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />
        <div className="container-wide">
          <div className="max-w-5xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <BookOpen className="h-3.5 w-3.5" />
              Research · 10+ years of gait and applied AI
            </div>
            <h1 className="mt-7 max-w-5xl font-display text-display-2xl text-balance text-soft-white">
              The research behind <span className="text-gradient">movement intelligence.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-soft-gray sm:text-lg">
              The public research record includes {papers.length} selected journal records, a granted Indian patent and a founder profile covering 50+ peer-reviewed publications.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/publications" className="btn-primary">
                Browse publications
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/publications#patent" className="btn-ghost">
                Patent {patent.patentNumber}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ResearchProductMap />

      <section className="section">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Verified research themes"
            title={
              <>
                Six themes visible in the <span className="text-gradient">publication record.</span>
              </>
            }
            description="These themes are derived directly from the paper titles and keywords presented in the public research record."
            align="left"
          />

          <div className="mt-12 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {researchThemes.map((theme) => {
              const Icon = theme.icon;
              return (
                <article key={theme.title} className="bg-obsidian p-6 sm:p-8">
                  <Icon className="h-5 w-5 text-cyan-300" />
                  <h2 className="mt-8 font-display text-2xl text-soft-white">{theme.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-soft-mute">{theme.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section bg-obsidian-300/40">
        <div className="container-wide">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="eyebrow">
                <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                Patent foundation
              </div>
              <h2 className="mt-5 font-display text-display-lg text-soft-white">
                Edge gait recognition with <span className="text-gradient">documented IP.</span>
              </h2>
            </div>
            <div className="border-y border-white/10 py-7">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-amber-300">
                <FileCheck2 className="h-4 w-4" />
                Granted · Government of India
              </div>
              <h3 className="mt-4 font-display text-2xl leading-snug text-soft-white">{patent.title}</h3>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <PatentFact label="Patent number" value={patent.patentNumber} />
                <PatentFact label="Application number" value={patent.applicationNumber} />
                <PatentFact label="Filed" value={patent.filingDate} />
                <PatentFact label="Granted" value={patent.grantDate} />
              </dl>
              <Link href="/publications#patent" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-amber-300">
                View patent record
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <EvidenceSection />
      <ResponsibleAI />

      <section className="section bg-obsidian-300/40">
        <div className="container-wide">
          <div className="flex flex-col items-start justify-between gap-7 border-y border-white/10 py-10 lg:flex-row lg:items-center">
            <div>
              <div className="eyebrow">Research collaborations</div>
              <h2 className="mt-4 max-w-3xl font-display text-display-md text-soft-white">
                Connect research questions to movement-intelligence products.
              </h2>
            </div>
            <a href="mailto:hello@gaitai.com?subject=GaitAI%20research%20collaboration" className="btn-primary">
              Start a conversation
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function PatentFact({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-soft-mute">{label}</dt>
      <dd className="mt-1 text-sm text-soft-white">{value}</dd>
    </div>
  );
}

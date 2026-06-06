import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCheck2,
  ShieldCheck,
  Stamp,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { papers, patent } from "@/data/publications";
import { PublicationsExplorer } from "./PublicationsExplorer";

export const metadata: Metadata = {
  title: "Publications & Patent — Research portfolio",
  description:
    "Peer-reviewed research papers and a granted patent in gait recognition, biometrics, deep learning and privacy-preserving movement AI — by Dr. Anubha Parashar, Founder & CEO of GaitAI.",
};

const stats = [
  { value: "10+ yrs", label: "Of gait research" },
  { value: `${papers.length}`, label: "Surfaced here" },
  { value: "1", label: "Granted patent" },
  { value: "50+", label: "Total publications" },
];

export default function PublicationsPage() {
  return (
    <>
      {/* ─────────── HERO ─────────── */}
      <section className="relative overflow-hidden pt-36 pb-16 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-1/2 top-[8%] h-[640px] w-[1100px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(79,209,255,0.18), transparent 70%)",
            }}
          />
          <div className="absolute right-[8%] bottom-[10%] h-72 w-72 rounded-full bg-radial-violet opacity-40 blur-3xl" />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <BookOpen className="h-3.5 w-3.5" />
              Research portfolio · {papers.length} papers · 1 granted patent
            </div>
            <h1 className="mt-6 font-display text-display-2xl text-balance text-soft-white">
              The research behind{" "}
              <span className="text-gradient">GaitAI.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-soft-gray sm:text-lg">
              Peer-reviewed work across <span className="text-soft-white">Springer</span>,{" "}
              <span className="text-soft-white">Elsevier</span> and{" "}
              <span className="text-soft-white">Wiley · IET</span>, plus a granted
              patent from the Government of India — covering gait biometrics,
              deep-learning pipelines, pose estimation, covariate handling and
              privacy-preserving analytics.
            </p>
          </div>

          {/* Stat strip */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl glass sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-gunmetal/30 px-3 py-5 text-center sm:py-6"
              >
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

      {/* ─────────── PATENT FEATURED CARD ─────────── */}
      <section id="patent" className="section">
        <div className="container-wide">
          <SectionHeading
            eyebrow={
              <span className="inline-flex items-center gap-2 text-amber-300">
                <Award className="h-3.5 w-3.5" />
                Featured · Granted patent
              </span>
            }
            title={
              <>
                A granted Indian patent at the heart of{" "}
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #FBBF24 0%, #D5A021 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  GaitAI&apos;s edge pipeline.
                </span>
              </>
            }
            description="A covariate-based gait recognition system and method for edge analytics, built on an optimized deep-learning pipeline — granted by the Patent Office, Government of India."
            align="left"
          />

          <Reveal>
            <div className="mt-12 overflow-hidden rounded-[2rem] border border-amber-300/20 bg-gradient-to-b from-amber-400/[0.04] to-transparent shadow-[0_30px_80px_-30px_rgba(213,160,33,0.35)]">
              <div className="relative grid lg:grid-cols-[1fr_1.35fr]">
                {/* Ambient amber glow */}
                <div
                  className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full opacity-50 blur-3xl"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(213,160,33,0.45), transparent 70%)",
                  }}
                />
                <div
                  className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full opacity-40 blur-3xl"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(79,209,255,0.18), transparent 70%)",
                  }}
                />
                <div className="ring-grid pointer-events-none absolute inset-0 opacity-25" />

                {/* Certificate image */}
                <div className="relative flex items-center justify-center bg-gradient-to-b from-amber-400/[0.05] to-transparent p-6 sm:p-8 lg:p-10">
                  <div className="relative aspect-[1/1.3] w-full max-w-[360px] overflow-hidden rounded-2xl ring-1 ring-amber-300/30 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]">
                    <Image
                      src={patent.cover}
                      alt="GaitAI patent certificate — Government of India"
                      fill
                      sizes="(min-width: 1024px) 360px, 80vw"
                      className="object-cover object-top"
                      priority
                    />
                    {/* Government seal badge */}
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-obsidian/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300 ring-1 ring-amber-300/40 backdrop-blur-md">
                      <Stamp className="h-3 w-3" />
                      Govt. of India
                    </div>
                  </div>
                </div>

                {/* Patent details */}
                <div className="relative p-8 sm:p-10 lg:p-12">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Granted Patent · IP India
                  </div>

                  <h3 className="mt-5 font-display text-2xl font-semibold text-balance text-soft-white sm:text-3xl">
                    {patent.title}
                  </h3>

                  {/* Patent grid */}
                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    <PatentField
                      icon={<FileCheck2 className="h-3.5 w-3.5" />}
                      label="Patent number"
                      value={patent.patentNumber!}
                      mono
                    />
                    <PatentField
                      icon={<FileCheck2 className="h-3.5 w-3.5" />}
                      label="Application number"
                      value={patent.applicationNumber!}
                      mono
                    />
                    <PatentField
                      icon={<Calendar className="h-3.5 w-3.5" />}
                      label="Date of filing"
                      value={patent.filingDate!}
                    />
                    <PatentField
                      icon={<Calendar className="h-3.5 w-3.5" />}
                      label="Date of grant"
                      value={patent.grantDate!}
                    />
                  </div>

                  {/* Patentees */}
                  <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.02] p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                      Patentees
                    </div>
                    <div className="mt-2 space-y-0.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="grid h-4 w-4 place-items-center rounded-full bg-amber-300/15 text-[8px] font-bold text-amber-300">
                          1
                        </span>
                        <span className="font-semibold text-soft-white">
                          Dr. Anubha Parashar
                        </span>
                        <span className="text-[11px] text-soft-mute">
                          · Founder &amp; CEO, GaitAI
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="grid h-4 w-4 place-items-center rounded-full bg-amber-300/10 text-[8px] font-bold text-amber-300/80">
                          2
                        </span>
                        <span className="text-soft-white">
                          Apoorva Parashar
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Validity */}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/8 px-3 py-1 text-[10.5px] font-semibold text-emerald-300">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Valid {patent.validityYears} years from {patent.filingDate}
                    </div>
                    <div className="text-[10.5px] text-soft-mute">
                      Patents Act, 1970
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-7 flex flex-wrap gap-3">
                    <a
                      href={patent.cover}
                      download="GaitAI-Patent-Certificate.jpg"
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/50 bg-amber-300/15 px-4 py-2 text-xs font-semibold text-amber-100 transition-all hover:border-amber-300/70 hover:bg-amber-300/25"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download certificate
                    </a>
                    <Link
                      href="/about#founder"
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/8 px-4 py-2 text-xs font-semibold text-amber-200 transition-all hover:border-amber-300/60 hover:bg-amber-300/15"
                    >
                      Meet the inventor
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href="/#contact"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-soft-white transition-all hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      Discuss licensing
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────── PAPERS EXPLORER ─────────── */}
      <section id="papers" className="section bg-obsidian-300/40">
        <div className="container-wide">
          <SectionHeading
            eyebrow={
              <span className="inline-flex items-center gap-2 text-cyan-300">
                <BookOpen className="h-3.5 w-3.5" />
                Peer-reviewed journal papers · {papers.length}
              </span>
            }
            title={
              <>
                Published across{" "}
                <span className="text-gradient">
                  Springer, Elsevier &amp; Wiley · IET.
                </span>
              </>
            }
            description="Filter by year and publisher. Every paper opens to its DOI page on the publisher's site."
            align="left"
          />

          <div className="mt-12">
            <PublicationsExplorer papers={papers} />
          </div>
        </div>
      </section>

      {/* ─────────── CTA ─────────── */}
      <section className="section">
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-10 sm:p-14">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-40 blur-3xl"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(79,209,255,0.25), transparent 70%)",
              }}
            />
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <span className="eyebrow">
                  <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                  Research collaborations &amp; licensing
                </span>
                <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
                  Want to collaborate on a paper, a pilot, or a patent licence?
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/#contact" className="btn-primary">
                  Start a conversation
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="https://anubhaparashar.github.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                >
                  Founder portfolio
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function PatentField({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
        <span className="text-amber-300/80">{icon}</span>
        {label}
      </div>
      <div
        className={`mt-1 text-sm font-semibold text-soft-white ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

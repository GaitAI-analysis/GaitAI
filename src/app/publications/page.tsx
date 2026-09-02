import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Download,
  FileCheck2,
  ShieldCheck,
  Stamp,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { FOUNDER_NAME, papers, patent } from "@/data/publications";
import { PublicationLibrary } from "@/components/publications/PublicationLibrary";
import { allYears } from "@/components/publications/topics";
import { assetPath } from "@/lib/paths";
import { ctas } from "@/data/content";

export const metadata: Metadata = {
  title: "Publications — The founder research record behind GaitAI",
  description:
    "The research record GaitAI is built on: peer-reviewed papers and a granted Indian patent by founder Anubha Parashar, across gait recognition, computer vision, biometrics, pose estimation and privacy-preserving movement AI.",
  alternates: { canonical: "/publications" },
};

// Every number below is derived from the records themselves. The set is
// counted as research outputs because it is papers plus a granted patent —
// the patent is not a publication.
const summary = [
  { value: `${papers.length + 1}`, label: "Research outputs" },
  { value: `${papers.length}`, label: "Peer-reviewed papers" },
  { value: "1", label: "Granted patent" },
  {
    value: `${allYears[allYears.length - 1]}–${allYears[0]}`,
    label: "Years",
  },
];

export default function PublicationsPage() {
  return (
    <>
      {/* ─────────── HERO — compact, editorial ─────────── */}
      <section className="site-page-intro relative overflow-hidden pb-12">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-1/2 top-[-10%] h-[520px] w-[1000px] -translate-x-1/2 rounded-full opacity-45 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(79,209,255,0.15), transparent 70%)",
            }}
          />
          <div className="absolute right-[6%] top-[30%] h-64 w-64 rounded-full bg-radial-violet opacity-30 blur-3xl" />
        </div>

        <div className="container-wide">
          <span className="eyebrow">
            <span className="h-1 w-6 rounded-full bg-gradient-brand" />
            Founder research record
          </span>

          {/* Split composition: the claim on the left, what backs it on the
              right. Stacked, the headline used to run at display size and then
              hand the reader three paragraphs of qualification before the
              first record — the archive is the page, so it now starts higher. */}
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-12">
            <h1 className="font-display text-display-lg text-balance text-soft-white">
              A research archive behind{" "}
              <span className="text-gradient">the movement engine.</span>
            </h1>

            <div className="min-w-0">
              <p className="text-base leading-relaxed text-soft-gray">
                Peer-reviewed papers and a granted patent spanning gait
                recognition, computer vision, biometrics, pose estimation,
                machine learning and privacy-preserving movement analysis —
                authored by founder {FOUNDER_NAME} with academic co-authors,
                and published with Springer, Elsevier and Wiley · IET.
              </p>
              <p className="mt-3.5 text-[12.5px] leading-relaxed text-soft-mute">
                These are academic and individually held records rather than
                company-produced output. GaitAI does not currently hold
                company-assigned publications or patents of its own; how each
                record maps onto the platform&apos;s capabilities is set out on
                the{" "}
                <Link
                  href="/research#areas"
                  className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 transition-colors hover:text-cyan-200"
                >
                  research evidence map
                </Link>
                .
              </p>

              {/* Counts, derived from the records themselves. */}
              <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-white/[0.08] pt-5 sm:grid-cols-4">
                {summary.map((s) => (
                  <div key={s.label} className="min-w-0">
                    <dt className="stat-num text-[1.3rem] leading-none text-soft-white">
                      {s.value}
                    </dt>
                    <dd className="mt-1.5 text-[9.5px] leading-[1.5] uppercase tracking-[0.16em] text-soft-mute">
                      {s.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── RESEARCH LIBRARY ─────────── */}
      <section id="papers" className="border-y border-white/[0.06] bg-obsidian-300/40 py-14 sm:py-16">
        <div className="container-wide">
          <PublicationLibrary />
        </div>
      </section>

      {/* ─────────── GRANTED PATENT — featured record ─────────── */}
      <section id="patent" className="section">
        <div className="container-wide">
          <span className="eyebrow">
            <span className="h-1 w-6 rounded-full bg-gradient-brand" />
            Featured · Granted patent
          </span>
          <h2 className="mt-5 max-w-3xl font-display text-display-md text-balance text-soft-white">
            A granted Indian patent behind the{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #FBBF24 0%, #D5A021 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              edge gait pipeline.
            </span>
          </h2>
          <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-soft-mute">
            Granted to the named inventors by the Government of India. It
            covers the covariate-based gait recognition method for edge
            analytics that GaitAI&apos;s edge inference capability is built on.
          </p>

          <Reveal>
            <div className="mt-10 overflow-hidden rounded-[2rem] border border-amber-300/20 bg-gradient-to-b from-amber-400/[0.04] to-transparent shadow-[0_30px_80px_-30px_rgba(213,160,33,0.35)]">
              <div className="relative grid lg:grid-cols-[1fr_1.35fr]">
                <div
                  className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full opacity-50 blur-3xl"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(213,160,33,0.45), transparent 70%)",
                  }}
                />
                <div className="ring-grid pointer-events-none absolute inset-0 opacity-25" />

                {/* Certificate */}
                <div className="relative flex items-center justify-center bg-gradient-to-b from-amber-400/[0.05] to-transparent p-6 sm:p-8 lg:p-10">
                  <div className="relative aspect-[1/1.3] w-full max-w-[360px] overflow-hidden rounded-2xl ring-1 ring-amber-300/30 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]">
                    <Image
                      src={assetPath(patent.cover)}
                      alt={`Patent certificate ${patent.patentNumber}, Government of India`}
                      fill
                      sizes="(min-width: 1024px) 360px, 80vw"
                      className="object-cover object-top"
                    />
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-obsidian/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300 ring-1 ring-amber-300/40 backdrop-blur-md">
                      <Stamp className="h-3 w-3" />
                      Govt. of India
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="relative p-8 sm:p-10 lg:p-12">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Granted Patent · IP India
                  </div>

                  <h3 className="mt-5 font-display text-2xl font-semibold text-balance text-soft-white sm:text-3xl">
                    {patent.title}
                  </h3>

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

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/8 px-3 py-1 text-[10.5px] font-semibold text-emerald-300">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Valid {patent.validityYears} years from {patent.filingDate}
                    </div>
                    <div className="text-[10.5px] text-soft-mute">
                      Patents Act, 1970
                    </div>
                  </div>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      href={`/publications/${patent.id}/`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/50 bg-amber-300/15 px-4 py-2 text-xs font-semibold text-amber-100 transition-all hover:border-amber-300/70 hover:bg-amber-300/25"
                    >
                      View patent record
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <a
                      href={assetPath(patent.cover)}
                      download={`Patent-${patent.patentNumber}-Certificate.jpg`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-soft-white transition-all hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download certificate
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────── CTA ─────────── */}
      <section className="section !pt-0">
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
                  Research · Collaborate
                </span>
                <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
                  Want to collaborate on a paper, pilot or research programme?
                </h2>
              </div>
              <Link href="/#contact" className="btn-primary shrink-0">
                {ctas.research.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
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
        className={`mt-1 text-sm font-semibold text-soft-white ${mono ? "font-mono" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, FileText, Lock, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { researchPillars } from "@/data/products";

const proofStats = [
  { value: "10+ yrs", label: "Of founder gait research" },
  { value: "Privacy", label: "First-architecture" },
  { value: "Clinic + lab", label: "Co-designed workflows" },
  { value: "Lawful", label: "Deployment commitments" },
];

export function ResearchCredibility() {
  return (
    <section
      id="research"
      className="section relative overflow-hidden bg-obsidian-300/30"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[8%] top-[15%] h-72 w-72 rounded-full bg-radial-violet opacity-40 blur-3xl" />
        <div className="absolute right-[8%] bottom-[15%] h-72 w-72 rounded-full bg-radial-cyan opacity-40 blur-3xl" />
      </div>

      <div className="container-wide">
        <SectionHeading
          eyebrow="Research credibility · Responsible AI"
          title={
            <>
              Built by serious{" "}
              <span className="text-gradient">researchers and engineers.</span>
            </>
          }
          description="GaitAI is grounded in published research on gait recognition, computer vision and biometric movement analysis — and shipped with the audit, consent and privacy controls enterprises and clinicians actually need."
        />

        {/* Decade-of-research ribbon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-14 max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8 sm:p-10"
        >
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-50" />
          <div className="ring-grid pointer-events-none absolute inset-0 opacity-40" />

          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div
              className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl ring-1 ring-cyan-300/30"
              style={{
                background:
                  "linear-gradient(135deg, rgba(79,209,255,0.15) 0%, rgba(124,58,237,0.15) 100%)",
              }}
            >
              <div className="text-center">
                <div className="font-display text-2xl font-semibold text-soft-white leading-none">
                  10
                </div>
                <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  years +
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                <span className="pill-dot" />
                A decade of gait research
              </div>
              <h3 className="mt-3 font-display text-2xl text-balance text-soft-white sm:text-3xl">
                GaitAI is the product of{" "}
                <span className="text-gradient">10+ years</span> of dedicated
                research into gait recognition and movement intelligence.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-soft-mute sm:text-[15px]">
                A decade of work spanning gait biometrics, pose estimation,
                sensor fusion, clinical movement analytics, and privacy-aware
                deployment — distilled into one platform with two verticals and
                twenty-three modular products.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Pillars */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {researchPillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:border-cyan-300/30 hover:bg-white/[0.04]"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-royal-400/20 to-violet-400/15 text-cyan-300 ring-1 ring-white/10">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-soft-white">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-soft-mute">
                  {p.desc}
                </p>
                <div className="pointer-events-none absolute inset-x-6 bottom-5 h-px scale-x-0 bg-gradient-to-r from-cyan-300 to-violet-400 transition-transform duration-500 group-hover:scale-x-100" />
              </motion.div>
            );
          })}
        </div>

        {/* Proof bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl glass sm:grid-cols-4"
        >
          {proofStats.map((s) => (
            <div
              key={s.label}
              className="bg-gunmetal/30 p-5 text-center sm:p-7"
            >
              <div className="stat-num text-xl text-soft-white sm:text-2xl">
                {s.value}
              </div>
              <div className="mt-1.5 text-[10.5px] uppercase tracking-[0.18em] text-soft-mute">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Two-up commitments */}
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <div className="card relative overflow-hidden p-7">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/30">
                <Lock className="h-4 w-4" />
              </span>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Privacy by design
              </div>
            </div>
            <h3 className="mt-4 font-display text-xl text-soft-white">
              Skeleton-only analytics. Face blur. Consent logs. Audit trails.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-soft-mute">
              GaitAI ships with role-based access, configurable retention,
              on-device processing options, and a PrivacyGuard layer that lets
              enterprises and public-sector teams deploy responsibly.
            </p>
            <Link
              href="/securevision#privacyguard"
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300 transition-colors hover:text-emerald-200"
            >
              See PrivacyGuard
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="card relative overflow-hidden p-7">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300/15 text-cyan-300 ring-1 ring-cyan-300/30">
                <FileText className="h-4 w-4" />
              </span>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Research &amp; publications
              </div>
            </div>
            <h3 className="mt-4 font-display text-xl text-soft-white">
              Founder-led research in gait biometrics &amp; movement AI.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-soft-mute">
              Peer-reviewed publications, applied research, clinical pilots and
              ongoing collaborations across hospitals, sports academies and
              public-sector partners.
            </p>
            <Link
              href="/publications"
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 transition-colors hover:text-cyan-200"
            >
              Browse publications
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-soft-white ring-1 ring-white/10">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-soft-white">
              Responsible deployment
            </div>
            <p className="mt-1 text-sm leading-relaxed text-soft-mute">
              Biometric, watchlist and identification capabilities are deployed
              only with lawful authority, consent and audit controls. Where
              non-identifying movement intelligence is sufficient, it&apos;s the
              default.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

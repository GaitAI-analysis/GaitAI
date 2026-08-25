"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, HeartPulse, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MobilityDashboardVisual } from "@/components/visuals/MobilityDashboardVisual";
import { SecureOperationsVisual } from "@/components/visuals/SecureOperationsVisual";
import { mobilityProducts, secureProducts } from "@/data/products";

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: i * 0.12 },
  }),
};

const mobilityHighlights = mobilityProducts
  .filter((p) => p.featured)
  .slice(0, 4);
const secureHighlights = secureProducts.filter((p) => p.featured).slice(0, 4);

export function Verticals() {
  return (
    <section id="platform-verticals" className="section">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Two verticals · One platform"
          title={
            <>
              One AI layer.{" "}
              <span className="text-gradient">Two human missions.</span>
            </>
          }
          description="GaitAI is built around a single belief — every movement carries information about who a person is, how they are, and what they need. We turn that signal into two purpose-built verticals."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {/* ---------- MOBILITYCARE ---------- */}
          <motion.article
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={cardVariants}
            custom={0}
            id="mobilitycare-card"
            className="card-glow group relative overflow-hidden p-8 sm:p-10"
          >
            {/* Visual area */}
            <div className="relative -mx-8 -mt-8 mb-8 h-72 overflow-hidden border-b border-white/5 sm:-mx-10 sm:-mt-10"
              style={{
                background:
                  "linear-gradient(135deg, rgba(15,163,177,0.18) 0%, rgba(7,11,20,1) 60%, rgba(7,11,20,1) 100%)",
              }}
            >
              <div className="ring-grid absolute inset-0 opacity-40" />
              <MobilityDashboardVisual />
              <div className="absolute left-6 top-6 z-10 inline-flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-teal-400"
                  style={{ boxShadow: "0 0 12px #0FA3B1" }}
                />
                <span className="text-[10px] uppercase tracking-[0.22em] text-soft-mute">
                  Clinical mobility console
                </span>
              </div>
              <div className="absolute right-6 top-6 z-10 rounded-md bg-black/40 px-2 py-1 font-mono text-[10px] text-teal-300 backdrop-blur-md">
                WalkScan · Live
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300">
                  <HeartPulse className="h-3.5 w-3.5" />
                  GaitAI MobilityCare
                </div>
                <h3 className="mt-3 font-display text-display-lg text-soft-white">
                  Clinical, sports, rehab &amp;{" "}
                  <span
                    className="text-gradient-care"
                    style={{
                      background:
                        "linear-gradient(135deg, #0FA3B1 0%, #4FD1FF 60%, #7C3AED 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    wearable mobility intelligence
                  </span>
                </h3>
              </div>
              <Link
                href="/mobilitycare"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full glass transition-all hover:border-teal-300/40 hover:text-teal-300"
                aria-label="Explore GaitAI MobilityCare"
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-soft-gray sm:text-base">
              Camera-based gait assessment, rehabilitation tracking, fall-risk
              screening, sports movement analytics and smartwatch monitoring —
              built with clinicians, for clinicians.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {mobilityHighlights.map((p) => {
                const Icon = p.icon;
                return (
                  <li
                    key={p.id}
                    className="group/item flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 transition-all hover:border-teal-300/30 hover:bg-teal-300/[0.04]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-teal-400/20 to-cyan-300/10 text-teal-300 ring-1 ring-teal-300/20">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-sm font-medium text-soft-white">
                        {p.short}
                      </div>
                      <div className="mt-0.5 text-xs leading-relaxed text-soft-mute">
                        {p.label}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <Link
              href="/mobilitycare"
              className="mt-8 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300 transition-colors hover:text-teal-200"
            >
              See 12 MobilityCare products
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </motion.article>

          {/* ---------- SECUREVISION ---------- */}
          <motion.article
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={cardVariants}
            custom={1}
            id="securevision-card"
            className="card-glow group relative overflow-hidden p-8 sm:p-10"
          >
            <div
              className="relative -mx-8 -mt-8 mb-8 h-72 overflow-hidden border-b border-white/5 sm:-mx-10 sm:-mt-10"
              style={{
                background:
                  "linear-gradient(135deg, rgba(45,108,223,0.2) 0%, rgba(7,11,20,1) 60%, rgba(7,11,20,1) 100%)",
              }}
            >
              <div className="ring-grid absolute inset-0 opacity-40" />
              <SecureOperationsVisual />
              <div className="absolute left-6 top-6 z-10 inline-flex items-center gap-2">
                <span className="pill-dot" />
                <span className="text-[10px] uppercase tracking-[0.22em] text-soft-mute">
                  Privacy-aware ops console
                </span>
              </div>
              <div className="absolute right-6 top-6 z-10 rounded-md bg-black/40 px-2 py-1 font-mono text-[10px] text-royal-300 backdrop-blur-md">
                SecureVision · Live
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-royal-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  GaitAI SecureVision
                </div>
                <h3 className="mt-3 font-display text-display-lg text-soft-white">
                  Privacy-aware movement intelligence for{" "}
                  <span className="text-gradient-secure">safer public spaces</span>
                </h3>
              </div>
              <Link
                href="/securevision"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full glass transition-all hover:border-royal-300/40 hover:text-royal-300"
                aria-label="Explore GaitAI SecureVision"
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-soft-gray sm:text-base">
              Movement anomaly detection, crowd flow analytics, worker safety
              and post-event investigation — built with privacy-first
              architecture, lawful deployment and full audit trails.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {secureHighlights.map((p) => {
                const Icon = p.icon;
                return (
                  <li
                    key={p.id}
                    className="group/item flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 transition-all hover:border-royal-300/30 hover:bg-royal-300/[0.04]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-royal-400/20 to-cyan-300/10 text-royal-300 ring-1 ring-royal-300/20">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-sm font-medium text-soft-white">
                        {p.short}
                      </div>
                      <div className="mt-0.5 text-xs leading-relaxed text-soft-mute">
                        {p.label}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <Link
              href="/securevision"
              className="mt-8 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-royal-300 transition-colors hover:text-royal-200"
            >
              See 11 SecureVision products
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </motion.article>
        </div>
      </div>
    </section>
  );
}

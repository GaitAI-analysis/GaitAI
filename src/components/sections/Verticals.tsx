"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ShieldCheck, HeartPulse } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { secureFeatures, careFeatures } from "@/data/content";
import { RadarPulse, GaitWaveform } from "@/components/ui/VerticalVisual";

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: i * 0.15 },
  }),
};

export function Verticals() {
  return (
    <section id="secure" className="section">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Two verticals · One platform"
          title={
            <>
              One AI layer.{" "}
              <span className="text-gradient">Two human missions.</span>
            </>
          }
          description="GaitAI is built around a single belief — the way a person moves carries deep information about who they are, how they are, and what they need. We turn that signal into two purpose-built verticals."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {/* SECURE */}
          <motion.article
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={cardVariants}
            custom={0}
            className="card-glow group relative overflow-hidden p-8 sm:p-10"
          >
            {/* Visual area */}
            <div className="relative -mx-8 -mt-8 mb-8 h-72 overflow-hidden border-b border-white/5 bg-gradient-to-br from-royal-700/30 via-obsidian to-obsidian sm:-mx-10 sm:-mt-10">
              <div className="ring-grid absolute inset-0 opacity-60" />
              <RadarPulse />
              <div className="absolute left-6 top-6 inline-flex items-center gap-2">
                <span className="pill-dot" />
                <span className="text-[10px] uppercase tracking-[0.22em] text-soft-mute">
                  Live awareness
                </span>
              </div>
              <div className="absolute right-6 top-6 rounded-md bg-black/40 px-2 py-1 font-mono text-[10px] text-cyan-300 backdrop-blur-md">
                ID · 04:21:18
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  GaitAI Secure
                </div>
                <h3 className="mt-3 font-display text-display-lg text-soft-white">
                  Movement intelligence for{" "}
                  <span className="text-gradient-secure">security & identity</span>
                </h3>
              </div>
              <a
                href="#"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full glass transition-all hover:border-cyan-300/40 hover:text-cyan-300"
                aria-label="Explore GaitAI Secure"
              >
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-soft-gray sm:text-base">
              Non-contact biometric intelligence and movement-based risk
              awareness for airports, campuses, enterprises and public spaces —
              where face, fingerprint and voice are not enough.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {secureFeatures.map((f) => (
                <li
                  key={f.title}
                  className="group/item flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 transition-all hover:border-cyan-300/30 hover:bg-cyan-300/[0.04]"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-royal-400/20 to-cyan-300/10 text-cyan-300 ring-1 ring-cyan-300/20">
                    <f.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-medium text-soft-white">
                      {f.title}
                    </div>
                    <div className="mt-0.5 text-xs leading-relaxed text-soft-mute">
                      {f.desc}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </motion.article>

          {/* CARE */}
          <motion.article
            id="care"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={cardVariants}
            custom={1}
            className="card-glow group relative overflow-hidden p-8 sm:p-10"
          >
            {/* Visual area */}
            <div className="relative -mx-8 -mt-8 mb-8 h-72 overflow-hidden border-b border-white/5 bg-gradient-to-br from-violet-700/25 via-obsidian to-obsidian sm:-mx-10 sm:-mt-10">
              <div className="ring-grid absolute inset-0 opacity-60" />
              <GaitWaveform />
              <div className="absolute left-6 top-6 inline-flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-violet-400"
                  style={{ boxShadow: "0 0 12px #7C3AED" }}
                />
                <span className="text-[10px] uppercase tracking-[0.22em] text-soft-mute">
                  Live gait signal
                </span>
              </div>
              <div className="absolute right-6 top-6 rounded-md bg-black/40 px-2 py-1 font-mono text-[10px] text-violet-300 backdrop-blur-md">
                Risk · 0.21
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">
                  <HeartPulse className="h-3.5 w-3.5" />
                  GaitAI Care
                </div>
                <h3 className="mt-3 font-display text-display-lg text-soft-white">
                  Movement intelligence for{" "}
                  <span className="text-gradient-care">health & elderly care</span>
                </h3>
              </div>
              <a
                href="#"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full glass transition-all hover:border-violet-300/40 hover:text-violet-300"
                aria-label="Explore GaitAI Care"
              >
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-soft-gray sm:text-base">
              A silent guardian for families, clinicians and rehabilitation
              programs — detecting fall-risk, mobility decline and early
              neurological patterns before harm happens.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {careFeatures.map((f) => (
                <li
                  key={f.title}
                  className="group/item flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 transition-all hover:border-violet-300/30 hover:bg-violet-300/[0.04]"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-400/20 to-cyan-300/10 text-violet-300 ring-1 ring-violet-300/20">
                    <f.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-medium text-soft-white">
                      {f.title}
                    </div>
                    <div className="mt-0.5 text-xs leading-relaxed text-soft-mute">
                      {f.desc}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </motion.article>
        </div>
      </div>
    </section>
  );
}

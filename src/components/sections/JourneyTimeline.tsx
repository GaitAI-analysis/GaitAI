"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface Milestone {
  year: string;
  title: string;
  desc: string;
  accent: "cyan" | "blue" | "violet" | "gold";
}

const journey: Milestone[] = [
  {
    year: "2014",
    title: "The research begins",
    desc: "Founder-led research begins around human gait analysis for Parkinson's disease and the early prediction of movement-related disorders. The foundational belief: walking is a silent signal — neurological patterns, mobility decline, imbalance and early risk can be read in motion before they become visible in daily life.",
    accent: "violet",
  },
  {
    year: "2016",
    title: "Surveillance & biometrics",
    desc: "The research expands into gait recognition for surveillance and security applications — using gait as a non-contact biometric signature that works from a distance, where face, fingerprint and iris recognition alone are not enough.",
    accent: "blue",
  },
  {
    year: "Research portfolio",
    title: "Patents · Papers · Datasets · Models",
    desc: "Years of study, testing and scientific exploration grew into a strong research portfolio — peer-reviewed publications, patents, curated datasets and validated model development across medical gait analysis, biometric surveillance and human-movement AI.",
    accent: "cyan",
  },
  {
    year: "Today",
    title: "The GaitAI platform",
    desc: "Two verticals — MobilityCare and SecureVision. Twenty-three modular products. One Human Movement Intelligence Platform built on a decade of research-first work, designed to make every output useful, reliable, accessible and beneficial for real users.",
    accent: "gold",
  },
];

const accentClasses: Record<
  Milestone["accent"],
  { dot: string; halo: string; text: string; chip: string; cardHover: string }
> = {
  cyan: {
    dot: "bg-cyan-300 text-cyan-300",
    halo: "bg-cyan-300/25",
    text: "text-cyan-300",
    chip: "border-cyan-300/30 bg-cyan-300/8 text-cyan-200",
    cardHover: "hover:border-cyan-300/30",
  },
  blue: {
    dot: "bg-royal-400 text-royal-400",
    halo: "bg-royal-400/25",
    text: "text-royal-300",
    chip: "border-royal-300/30 bg-royal-300/8 text-royal-200",
    cardHover: "hover:border-royal-300/30",
  },
  violet: {
    dot: "bg-violet-400 text-violet-400",
    halo: "bg-violet-400/25",
    text: "text-violet-300",
    chip: "border-violet-300/30 bg-violet-300/8 text-violet-200",
    cardHover: "hover:border-violet-300/30",
  },
  gold: {
    dot: "bg-amber-300 text-amber-300",
    halo: "bg-amber-300/25",
    text: "text-amber-300",
    chip: "border-amber-300/30 bg-amber-300/8 text-amber-200",
    cardHover: "hover:border-amber-300/30",
  },
};

/**
 * "Our Journey" timeline rail — vertical milestones on one continuous
 * gradient spine. The rail sits at the left edge on mobile/tablet and in
 * the center on desktop; milestone dots are absolutely positioned on the
 * same coordinates as the rail, so line and dots can never drift apart.
 */
export function JourneyTimeline({
  variant = "default",
}: {
  variant?: "default" | "muted";
}) {
  const reduceMotion = Boolean(useReducedMotion());

  // Rail x-position, shared by the base line, the gradient line, the
  // traveling glow and every milestone dot.
  const railX = "left-[9px] lg:left-1/2 lg:-translate-x-1/2";

  return (
    <section
      id="journey"
      className={`section relative overflow-hidden ${
        variant === "muted" ? "bg-obsidian-300/40" : ""
      }`}
    >
      {/* Ambient light wash */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          animate={reduceMotion ? undefined : { opacity: [0.22, 0.38, 0.22] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[8%] top-[15%] h-72 w-72 rounded-full bg-radial-violet opacity-30 blur-3xl"
        />
        <motion.div
          animate={reduceMotion ? undefined : { opacity: [0.34, 0.2, 0.34] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[15%] right-[8%] h-72 w-72 rounded-full bg-radial-cyan opacity-30 blur-3xl"
        />
      </div>

      <div className="container-wide">
        <SectionHeading
          eyebrow="Our journey · 10+ years of research"
          title={
            <>
              From research to{" "}
              <span className="text-gradient">real-world movement intelligence.</span>
            </>
          }
          description="GaitAI did not begin as a business idea. It began as a deep research vision — a belief that the way humans walk, move, balance, recover and behave carries powerful information about health, identity and safety."
          align="left"
        />

        <div className="relative mt-16">
          {/* Continuous base rail — visible at every viewport */}
          <div
            className={`pointer-events-none absolute top-0 h-full w-px bg-white/10 ${railX}`}
          />

          {/* Gradient spine, drawn in on scroll on top of the base rail */}
          <motion.div
            initial={reduceMotion ? false : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "top" }}
            className={`pointer-events-none absolute top-0 h-full w-px bg-gradient-to-b from-violet-400/80 via-royal-400/70 to-amber-300/80 shadow-[0_0_18px_rgba(124,58,237,0.35)] ${railX}`}
          />

          {/* Faint glow traveling down the spine */}
          {!reduceMotion && (
            <div
              className={`pointer-events-none absolute top-0 h-full w-px ${railX}`}
              aria-hidden
            >
              <motion.span
                animate={{ top: ["-15%", "115%"] }}
                transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                className="absolute left-1/2 h-28 w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-transparent via-cyan-300/50 to-transparent blur-[2px]"
              />
            </div>
          )}

          <ul className="space-y-12 lg:space-y-20">
            {journey.map((m, i) => {
              const a = accentClasses[m.accent];
              const isLeft = i % 2 === 0;

              return (
                <li key={m.year} className="relative pl-12 sm:pl-14 lg:pl-0">
                  {/* Milestone dot — breathing glow, pinned to the rail */}
                  <div
                    className={`absolute top-7 -translate-x-1/2 ${railX}`}
                    aria-hidden
                  >
                    <span
                      className={`absolute -inset-2.5 rounded-full blur-md ${a.halo}`}
                    />
                    {!reduceMotion && (
                      <span
                        className={`absolute inset-0 animate-ping rounded-full opacity-30 ${a.dot}`}
                        style={{ animationDuration: "3.2s" }}
                      />
                    )}
                    <span
                      className={`relative block h-3 w-3 rounded-full shadow-[0_0_14px_currentColor] ${a.dot}`}
                    />
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="lg:grid lg:grid-cols-2 lg:gap-12"
                  >
                    <div
                      className={
                        isLeft
                          ? "lg:pr-16 lg:text-right"
                          : "lg:order-2 lg:pl-16"
                      }
                    >
                      <Card
                        milestone={m}
                        accent={a}
                        alignment={isLeft ? "right" : "left"}
                      />
                    </div>
                    <div
                      className={`hidden lg:block ${isLeft ? "lg:order-2" : ""}`}
                    />
                  </motion.div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Card({
  milestone,
  accent,
  alignment = "left",
}: {
  milestone: Milestone;
  accent: { chip: string; text: string; cardHover: string };
  alignment?: "left" | "right";
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.045] hover:shadow-[0_20px_50px_-24px_rgba(79,209,255,0.35)] sm:p-6 ${accent.cardHover} ${
        alignment === "right" ? "lg:ml-auto" : ""
      } lg:max-w-md`}
    >
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${accent.chip}`}
      >
        {milestone.year}
      </div>
      <h3 className="mt-3 font-display text-xl text-soft-white">
        {milestone.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-soft-mute">
        {milestone.desc}
      </p>
    </div>
  );
}

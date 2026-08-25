"use client";

import { motion } from "framer-motion";
import {
  Brain,
  BookOpen,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface Milestone {
  year: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  accent: "cyan" | "blue" | "violet" | "gold";
}

const journey: Milestone[] = [
  {
    year: "2014",
    title: "The research begins",
    desc: "Founder-led research begins around human gait analysis for Parkinson's disease and the early prediction of movement-related disorders. The foundational belief: walking is a silent signal — neurological patterns, mobility decline, imbalance and early risk can be read in motion before they become visible in daily life.",
    icon: Brain,
    accent: "violet",
  },
  {
    year: "2016",
    title: "Surveillance & biometrics",
    desc: "The research expands into gait recognition for surveillance and security applications — using gait as a non-contact biometric signature that works from a distance, where face, fingerprint and iris recognition alone are not enough.",
    icon: ShieldCheck,
    accent: "blue",
  },
  {
    year: "Research portfolio",
    title: "Patents · Papers · Datasets · Models",
    desc: "Years of study, testing and scientific exploration grew into a strong research portfolio — peer-reviewed publications, patents, curated datasets and validated model development across medical gait analysis, biometric surveillance and human-movement AI.",
    icon: BookOpen,
    accent: "cyan",
  },
  {
    year: "Today",
    title: "The GaitAI platform",
    desc: "Two verticals — MobilityCare and SecureVision. Twenty-three modular products. One Human Movement Intelligence Platform built on a decade of research-first work, designed to make every output useful, reliable, accessible and beneficial for real users.",
    icon: Sparkles,
    accent: "gold",
  },
];

const accentClasses: Record<
  Milestone["accent"],
  { dot: string; ring: string; text: string; chip: string }
> = {
  cyan: {
    dot: "bg-cyan-300",
    ring: "ring-cyan-300/30",
    text: "text-cyan-300",
    chip: "border-cyan-300/30 bg-cyan-300/8 text-cyan-200",
  },
  blue: {
    dot: "bg-royal-400",
    ring: "ring-royal-300/30",
    text: "text-royal-300",
    chip: "border-royal-300/30 bg-royal-300/8 text-royal-200",
  },
  violet: {
    dot: "bg-violet-400",
    ring: "ring-violet-300/30",
    text: "text-violet-300",
    chip: "border-violet-300/30 bg-violet-300/8 text-violet-200",
  },
  gold: {
    dot: "bg-amber-300",
    ring: "ring-amber-300/30",
    text: "text-amber-300",
    chip: "border-amber-300/30 bg-amber-300/8 text-amber-200",
  },
};

/**
 * "Our Journey" timeline rail — vertical milestones with a gradient
 * connecting line that draws in as the user scrolls.
 */
export function JourneyTimeline({
  variant = "default",
}: {
  variant?: "default" | "muted";
}) {
  return (
    <section
      id="journey"
      className={`section relative overflow-hidden ${
        variant === "muted" ? "bg-obsidian-300/40" : ""
      }`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[8%] top-[15%] h-72 w-72 rounded-full bg-radial-violet opacity-30 blur-3xl" />
        <div className="absolute right-[8%] bottom-[15%] h-72 w-72 rounded-full bg-radial-cyan opacity-30 blur-3xl" />
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
          {/* Vertical rail (desktop) */}
          <div className="pointer-events-none absolute left-[27px] top-0 hidden h-full w-px bg-white/8 sm:left-[31px] lg:left-1/2 lg:-translate-x-1/2 lg:block" />

          {/* Animated gradient line */}
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "top" }}
            className="pointer-events-none absolute left-[27px] top-0 hidden h-full w-px bg-gradient-to-b from-violet-400 via-royal-400 to-amber-300 shadow-[0_0_20px_rgba(124,58,237,0.4)] sm:left-[31px] lg:left-1/2 lg:-translate-x-1/2 lg:block"
          />

          <ul className="space-y-12 lg:space-y-20">
            {journey.map((m, i) => {
              const Icon = m.icon;
              const a = accentClasses[m.accent];
              const isLeft = i % 2 === 0;

              return (
                <li key={m.year} className="relative">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="relative grid items-start gap-6 lg:grid-cols-2 lg:gap-12"
                  >
                    {/* Year node */}
                    <div
                      className={`relative flex items-start gap-4 lg:contents`}
                    >
                      <div
                        className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-white/5 to-transparent ring-1 ring-white/10 lg:absolute lg:left-1/2 lg:top-0 lg:-translate-x-1/2`}
                      >
                        <span
                          className={`absolute inset-2 rounded-xl ring-1 ${a.ring}`}
                        />
                        <Icon className={`h-5 w-5 ${a.text}`} />
                        <span
                          className={`absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full ${a.dot} shadow-[0_0_12px_currentColor]`}
                        />
                      </div>

                      {/* Content (mobile lives next to icon) */}
                      <div className="flex-1 lg:hidden">
                        <Card milestone={m} accent={a} />
                      </div>
                    </div>

                    {/* Desktop content — alternates sides */}
                    <div
                      className={`hidden lg:block ${
                        isLeft ? "lg:pr-16 lg:text-right" : "lg:order-2 lg:pl-16"
                      }`}
                    >
                      <Card milestone={m} accent={a} alignment={isLeft ? "right" : "left"} />
                    </div>
                    {!isLeft && <div className="hidden lg:block" />}
                    {isLeft && <div className="hidden lg:block" />}
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
  accent: { chip: string; text: string };
  alignment?: "left" | "right";
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-5 sm:p-6 ${
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

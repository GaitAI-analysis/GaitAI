"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// Dynamically imported with ssr:false — same pattern as the homepage Hero.
const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => null,
});

// ── exact same animation config as the homepage hero ──────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.85,
      ease: [0.16, 1, 0.3, 1],
      delay: i * 0.08,
    },
  }),
};

/**
 * Full-viewport hero for /mobilitycare/ — exact structural clone of the
 * homepage Hero (commit 28e0a86). Layout, sizing, spacing, animations and
 * SVG background are preserved verbatim; only the copy and accent colour
 * differ from the home page.
 */
export function MobilityCareHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="mobilitycare-hero-title"
      className="site-viewport-section relative flex w-full items-center overflow-hidden py-20 sm:py-28 lg:py-32"
    >
      {/* ── background layers — identical to homepage Hero.tsx ── */}
      <div className="hero-ambient pointer-events-none absolute inset-0 -z-10" />
      <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-20" />

      {/* Animated gait skeleton scene — gated on reduced-motion, same as home */}
      {!reduceMotion && (
        <div
          aria-hidden="true"
          className="hero-scene-mask pointer-events-none absolute inset-x-0 top-[8%] -z-0 h-[76%] w-full opacity-20 sm:opacity-30"
        >
          <HeroScene />
        </div>
      )}

      {/* ── content — centred, same layout as homepage hero ── */}
      <div className="container-wide relative z-10">
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          animate="show"
          variants={fadeUp}
          className="mx-auto flex max-w-5xl flex-col items-center text-center"
        >
          {/* Eyebrow pill — teal accent for MobilityCare */}
          <motion.div
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center rounded-full border border-teal-300/20 bg-obsidian/55 px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-teal-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:text-xs"
          >
            GAITAI MOBILITYCARE · MOVEMENT INTELLIGENCE
          </motion.div>

          {/* Hero headline — exact same sizing as homepage h1 */}
          <motion.h1
            id="mobilitycare-hero-title"
            variants={fadeUp}
            custom={1}
            className="mt-8 max-w-5xl pb-2 text-balance font-display text-[clamp(1.85rem,9.3vw,3.5rem)] font-semibold leading-[0.95] tracking-[-0.055em] text-soft-white sm:mt-10 sm:pb-2.5 sm:text-[clamp(3rem,8vw,7.25rem)] lg:pb-3.5"
          >
            <span className="block">AI as a silent guardian</span>
            <span className="block">for human safety,</span>
            <span className="mt-0.5 block text-[0.9em] leading-[0.95] text-gradient-mobility sm:mt-1">
              health and identity.
            </span>
          </motion.h1>

          {/* Supporting paragraph — same classes as homepage */}
          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-8 max-w-2xl text-balance text-base leading-relaxed text-soft-white/90 sm:mt-10 sm:text-xl"
          >
            GaitAI exists for a future where AI doesn&apos;t only respond after
            something goes wrong, but quietly helps predict, prevent and
            protect — before it does.
          </motion.p>

          {/* CTA row — same pill style and layout as homepage */}
          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-10 flex w-full max-w-xl flex-col items-stretch justify-center gap-3 sm:mt-12 sm:flex-row sm:items-center"
          >
            <Link
              href="#products"
              className="hero-product-link hero-product-link--care group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-teal-300/35 bg-teal-300/[0.1] px-6 py-3 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-300/50 hover:bg-teal-300/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/70 focus-visible:ring-offset-4 focus-visible:ring-offset-obsidian"
            >
              Explore products
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/#contact"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-soft-white/20 bg-soft-white/[0.06] px-6 py-3 text-sm font-semibold text-soft-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-soft-white/35 hover:bg-soft-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soft-white/50 focus-visible:ring-offset-4 focus-visible:ring-offset-obsidian"
            >
              Book a demo
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </motion.div>

          {/* Bottom capability line — same classes as homepage breadth note */}
          <motion.div
            variants={fadeUp}
            custom={4}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-soft-gray/80 sm:mt-16"
          >
            <span>
              Clinical gait · Fall-risk · Rehabilitation · Sports motion ·
              Elderly mobility · Wearable intelligence
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

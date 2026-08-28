"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { GaitAIMark } from "@/components/ui/GaitAIMark";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => null,
});

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

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="platform"
      aria-labelledby="home-hero-title"
      className="site-viewport-section relative flex w-full items-center overflow-hidden py-20 sm:py-28 lg:py-32"
    >
      <div className="hero-ambient pointer-events-none absolute inset-0 -z-10" />
      <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-25" />

      {!reduceMotion && (
        <div
          aria-hidden="true"
          className="hero-scene-mask pointer-events-none absolute inset-x-0 top-[8%] -z-0 h-[76%] w-full opacity-[0.29]"
        >
          <HeroScene />
        </div>
      )}

      <div className="container-wide relative z-10">
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          animate="show"
          variants={fadeUp}
          className="mx-auto flex max-w-5xl flex-col items-center text-center"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2.5 rounded-full border border-cyan-300/20 bg-obsidian/55 py-1.5 pl-2 pr-4 text-[11px] font-semibold tracking-[0.14em] text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:text-xs"
          >
            <span
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(81,214,255,0.11),rgba(113,135,255,0.09))] shadow-[0_0_16px_rgba(81,214,255,0.12)]"
              aria-hidden="true"
            >
              <GaitAIMark className="h-[18px] w-[18px]" />
            </span>
            GaitAI Movement Intelligence
          </motion.div>

          <motion.h1
            id="home-hero-title"
            variants={fadeUp}
            custom={1}
            className="mt-8 max-w-5xl pb-2 text-balance font-display text-[clamp(2.75rem,8vw,7.25rem)] font-semibold leading-[0.95] tracking-[-0.055em] text-soft-white sm:mt-10 sm:pb-2.5 lg:pb-3.5"
          >
            <span className="block sm:whitespace-nowrap">One AI layer.</span>
            <span className="mt-1 block text-[0.91em] leading-[0.95] text-gradient sm:mt-1.5 sm:whitespace-nowrap">
              Two human missions.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="relative -top-3 mt-8 max-w-2xl text-balance text-base leading-relaxed text-soft-gray sm:mt-10 sm:text-xl"
          >
            Human movement intelligence for better care and safer spaces.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-10 flex w-full max-w-xl flex-col items-stretch justify-center gap-3 sm:mt-12 sm:flex-row sm:items-center"
          >
            <Link
              href="/mobilitycare"
              className="hero-product-link hero-product-link--care group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-teal-300/30 bg-teal-300/[0.09] px-6 py-3 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-300/50 hover:bg-teal-300/[0.13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/70 focus-visible:ring-offset-4 focus-visible:ring-offset-obsidian"
            >
              Explore MobilityCare
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/securevision"
              className="hero-product-link hero-product-link--secure group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-royal-300/35 bg-royal-400/[0.1] px-6 py-3 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-royal-300/55 hover:bg-royal-400/[0.15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-300/70 focus-visible:ring-offset-4 focus-visible:ring-offset-obsidian"
            >
              Explore SecureVision
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={4}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-soft-mute sm:mt-16"
          >
            <span>10+ years of gait research</span>
            <span className="hidden h-1 w-1 rounded-full bg-cyan-300/50 sm:block" />
            <span>23 specialized movement-intelligence products</span>
            <span className="hidden h-1 w-1 rounded-full bg-cyan-300/50 sm:block" />
            <span>Research to real-world systems</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

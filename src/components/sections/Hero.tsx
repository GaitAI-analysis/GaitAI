"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { heroStats } from "@/data/content";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => null,
});

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 },
  }),
};

export function Hero() {
  return (
    <section
      id="platform"
      className="relative min-h-[100svh] w-full overflow-hidden pt-32 sm:pt-36"
    >
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[12%] h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-radial-glow opacity-80 blur-3xl" />
        <div className="absolute right-[5%] top-[25%] h-[360px] w-[360px] rounded-full bg-radial-violet opacity-60 blur-3xl" />
        <div className="absolute left-[6%] bottom-[10%] h-[420px] w-[420px] rounded-full bg-radial-cyan opacity-50 blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div className="pointer-events-none absolute inset-0 -z-10 ring-grid opacity-50" />

      {/* 3D canvas behind text */}
      <div className="pointer-events-none absolute inset-x-0 top-[8%] -z-0 h-[85svh] w-full opacity-95">
        <HeroScene />
      </div>

      <div className="container-wide relative z-10">
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <motion.div variants={fadeUp} custom={0} className="pill">
            <span className="pill-dot" />
            Human Movement Intelligence Platform · 10+ years of research
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="mt-6 font-display text-display-2xl text-balance text-soft-white"
          >
            Intelligence
            <span className="block">
              in <span className="text-gradient">Motion.</span>
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-7 max-w-2xl text-balance text-base leading-relaxed text-soft-gray sm:text-lg"
          >
            GaitAI converts walking videos, wearable signals, posture and crowd
            movement into actionable AI — for{" "}
            <span className="text-soft-white">healthcare, rehabilitation,
            sports, elderly care, mobility,</span> and{" "}
            <span className="text-soft-white">privacy-aware public safety.</span>{" "}
            One platform. Two verticals. Twenty-three movement-intelligence
            products.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          >
            <a href="/mobilitycare" className="btn-primary">
              Explore MobilityCare
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/securevision" className="btn-ghost group">
              <span className="relative grid h-5 w-5 place-items-center">
                <Play className="h-3 w-3 fill-soft-white text-soft-white transition-transform group-hover:scale-110" />
                <span className="absolute inset-0 animate-pulse-glow rounded-full ring-1 ring-white/30" />
              </span>
              Explore SecureVision
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={4}
            className="mt-12 inline-flex items-center gap-2 text-xs text-soft-mute"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            Built for clinicians, hospitals, sports academies, enterprises &amp; public-safety teams
          </motion.div>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-24 grid grid-cols-2 gap-px overflow-hidden rounded-2xl glass sm:grid-cols-4"
        >
          {heroStats.map((s) => (
            <div key={s.label} className="bg-gunmetal/30 p-6 text-center sm:p-7">
              <div className="stat-num text-3xl text-soft-white sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-soft-mute">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center"
      >
        <div className="flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-soft-mute">
          <span>Scroll</span>
          <div className="relative h-10 w-[1px] overflow-hidden bg-white/10">
            <div className="absolute inset-x-0 h-3 animate-scan-line bg-gradient-to-b from-transparent via-cyan-300 to-transparent" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

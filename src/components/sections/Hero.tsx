"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Play, Sparkles } from "lucide-react";

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
      className="hero-identity relative flex min-h-[100svh] w-full items-center overflow-hidden pb-24 pt-32 sm:pt-36"
    >
      {/* Existing GaitAI atmosphere: retained as the hero identity layer. */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[12%] h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-radial-glow opacity-80 blur-3xl" />
        <div className="absolute right-[5%] top-[25%] h-[360px] w-[360px] rounded-full bg-radial-violet opacity-60 blur-3xl" />
        <div className="absolute bottom-[10%] left-[6%] h-[420px] w-[420px] rounded-full bg-radial-cyan opacity-50 blur-3xl" />
      </div>
      <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-[8%] z-0 h-[85svh] w-full opacity-95">
        <HeroScene />
      </div>

      <div className="container-wide relative z-10 py-10 sm:py-16">
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mx-auto flex max-w-4xl flex-col items-center text-center"
        >
          <motion.div variants={fadeUp} custom={0} className="pill border-white/10 bg-black/20 text-slate-300">
            <span className="pill-dot" />
            Research-led movement intelligence
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="mt-7 max-w-4xl font-display text-display-2xl text-balance text-white"
          >
            Intelligence in <span className="text-gradient">Motion.</span>
          </motion.h1>

          <motion.h2
            variants={fadeUp}
            custom={2}
            className="mt-6 max-w-2xl font-display text-xl font-medium text-white sm:text-2xl"
          >
            The AI platform that understands human movement.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            custom={3}
            className="mt-4 max-w-xl text-balance text-base leading-relaxed text-slate-300 sm:text-lg"
          >
            Turn video and wearable motion into measurable intelligence for
            health, performance, and safety.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={4}
            className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
          >
            <Link href="#movement-platform" className="btn-primary w-full sm:w-auto">
              Explore GaitAI
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#how" className="btn-ghost group w-full border-white/10 bg-black/20 text-white sm:w-auto">
              <span className="relative grid h-5 w-5 place-items-center">
                <Play className="h-3 w-3 fill-white text-white transition-transform group-hover:scale-110" />
                <span className="absolute inset-0 animate-pulse-glow rounded-full ring-1 ring-white/30" />
              </span>
              See how it works
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={5}
            className="mt-12 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            Movement → measurement → intelligence
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center"
      >
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.24em] text-slate-500">
          <span>See what GaitAI sees</span>
          <ArrowDown className="h-3 w-3 text-cyan-300" />
        </div>
      </motion.div>
    </section>
  );
}

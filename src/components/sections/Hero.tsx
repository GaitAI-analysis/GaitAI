"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";

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
      className="site-page-intro-compact site-viewport-section relative w-full overflow-hidden"
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
            10+ years of gait research · From research to real-world systems
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
            GaitAI transforms video, wearable signals and human movement into
            actionable intelligence across{" "}
            <span className="text-soft-white">
              MobilityCare and SecureVision
            </span>{" "}
            — one platform powering{" "}
            <span className="text-soft-white">
              twenty-three specialized movement-intelligence products.
            </span>
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link href="/mobilitycare" className="btn-primary">
              Explore MobilityCare
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/securevision"
              className="btn-ghost group border border-[rgba(120,180,255,0.35)] bg-[rgba(255,255,255,0.08)] font-semibold text-[#F7F9FF] shadow-[inset_0_1px_0_rgba(170,215,255,0.12)] hover:-translate-y-px hover:border-[rgba(150,210,255,0.55)] hover:bg-[rgba(255,255,255,0.13)] hover:shadow-[0_10px_28px_rgba(70,140,255,0.16),inset_0_1px_0_rgba(190,225,255,0.16)]"
            >
              <span className="relative grid h-5 w-5 place-items-center rounded-full border border-[rgba(150,200,255,0.45)] bg-[rgba(70,120,220,0.20)] shadow-[0_0_12px_rgba(90,155,255,0.18)] transition-shadow duration-300 group-hover:shadow-[0_0_14px_rgba(100,175,255,0.26)]">
                <Play className="h-3 w-3 fill-white text-white transition-transform duration-300 group-hover:scale-105" />
              </span>
              Explore SecureVision
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={4}
            className="mt-12 inline-flex items-center gap-2 text-xs text-soft-mute"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            Spanning clinical gait, fall-risk, rehabilitation, sports performance, wearable mobility, neurological movement, surveillance, security, crowd intelligence and public safety.
          </motion.div>
        </motion.div>

      </div>

    </section>
  );
}

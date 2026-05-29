"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Watch } from "lucide-react";
import { SmartwatchVisual } from "@/components/visuals/SmartwatchVisual";
import { watchcareFeatures } from "@/data/products";

/**
 * WatchCare flagship — the signature wearable section on the homepage.
 * Built around a code-rendered smartwatch UI with a daily mobility score,
 * activity decline trend, fall-risk trend and caregiver dashboard preview.
 */
export function WatchCareFlagship() {
  return (
    <section
      id="watchcare"
      className="section relative overflow-hidden"
      aria-label="GaitAI WatchCare"
    >
      {/* Ambient amber glow + brand mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute left-1/2 top-1/2 h-[640px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(213,160,33,0.18), transparent 70%)",
          }}
        />
        <div className="absolute right-[10%] bottom-[10%] h-72 w-72 rounded-full bg-radial-cyan opacity-40 blur-3xl" />
      </div>

      <div className="container-wide">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          {/* COPY + features */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
              <Watch className="h-3.5 w-3.5" />
              GaitAI WatchCare · Wearable Intelligence
            </div>

            <h2 className="mt-5 font-display text-display-xl text-balance text-soft-white">
              Continuous mobility intelligence,{" "}
              <span
                className="text-gradient"
                style={{
                  background:
                    "linear-gradient(135deg, #FBBF24 0%, #D5A021 50%, #4FD1FF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                from the wrist.
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-soft-gray">
              WatchCare combines smartwatch, mobile and wearable sensor data
              with GaitAI&apos;s AI engine — quietly monitoring daily mobility,
              activity decline, gait variability and fall-risk trends for
              elderly care, rehab follow-up, sports recovery and remote
              wellness.
            </p>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="mt-10 grid gap-3 sm:grid-cols-2"
            >
              {watchcareFeatures.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.06,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="group rounded-xl border border-white/8 bg-white/[0.025] p-4 transition-all hover:border-amber-300/40 hover:bg-amber-300/[0.04]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-300/10 text-amber-300 ring-1 ring-amber-300/20">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="text-sm font-semibold text-soft-white">
                        {f.title}
                      </div>
                    </div>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-soft-mute">
                      {f.desc}
                    </p>
                    <div className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-amber-300/80">
                      {f.audience}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/mobilitycare#watchcare"
                className="btn-primary"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(213,160,33,0.95) 0%, rgba(251,191,36,0.95) 100%)",
                  color: "#0B1F3A",
                }}
              >
                Explore WatchCare
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="#contact" className="btn-ghost">
                Pilot with us
              </Link>
            </div>
          </div>

          {/* VISUAL — smartwatch + floating widgets */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Floating widget — activity decline */}
              <motion.div
                initial={{ opacity: 0, x: -30, y: -10 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -left-2 top-6 z-10 hidden w-[200px] rounded-2xl border border-white/10 bg-obsidian-200/80 p-3.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:block"
              >
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
                    Activity · 7d
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-300">
                    +12%
                  </div>
                </div>
                <svg viewBox="0 0 160 40" className="mt-2 h-10 w-full">
                  <motion.path
                    d="M0 30 L20 26 L40 22 L60 18 L80 20 L100 14 L120 10 L140 8 L160 4"
                    stroke="#10B981"
                    strokeWidth="1.6"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, delay: 0.8 }}
                  />
                </svg>
                <div className="mt-1.5 flex justify-between text-[9px] text-soft-mute">
                  <span>Mon</span>
                  <span>Sun</span>
                </div>
              </motion.div>

              {/* Floating widget — fall-risk alert */}
              <motion.div
                initial={{ opacity: 0, x: 30, y: -10 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -right-2 top-24 z-10 hidden w-[210px] rounded-2xl border border-amber-300/40 bg-obsidian-200/80 p-3.5 shadow-[0_20px_60px_-20px_rgba(213,160,33,0.4)] backdrop-blur-xl sm:block"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-amber-300/15 text-amber-300 ring-1 ring-amber-300/30">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                      <path d="M12 2 L22 20 L2 20 Z" />
                    </svg>
                  </span>
                  <div className="text-xs font-semibold text-soft-white">
                    Fall-risk · Low
                  </div>
                </div>
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-soft-mute">
                  Stable gait variability over 4 weeks. Caregiver notified.
                </p>
              </motion.div>

              {/* Floating widget — caregiver */}
              <motion.div
                initial={{ opacity: 0, x: -20, y: 10 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1.0, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -left-2 bottom-12 z-10 hidden w-[200px] rounded-2xl border border-white/10 bg-obsidian-200/80 p-3.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:block"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {["#4FD1FF", "#7C3AED", "#FBBF24"].map((c) => (
                      <span
                        key={c}
                        className="h-6 w-6 rounded-full border-2 border-obsidian"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <div className="text-[11px] font-semibold text-soft-white">
                    Caregivers active
                  </div>
                </div>
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-soft-mute">
                  Daughter · GP · Physio · Care home — all looped in.
                </p>
              </motion.div>

              <SmartwatchVisual score={86} trend="up" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

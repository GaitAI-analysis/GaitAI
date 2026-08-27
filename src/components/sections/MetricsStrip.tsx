"use client";

import { motion } from "framer-motion";
import { heroStats } from "@/data/content";

export function MetricsStrip() {
  return (
    <section
      aria-label="Platform metrics"
      className="relative -mb-8 pt-10 sm:-mb-10 sm:pt-12 lg:-mb-16 lg:pt-14"
    >
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl glass sm:grid-cols-4"
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
    </section>
  );
}

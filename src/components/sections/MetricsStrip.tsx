"use client";

import { Fragment } from "react";
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
          className="relative grid grid-cols-2 gap-px overflow-hidden rounded-2xl glass sm:grid-cols-4"
        >
          {heroStats.map((s, index) => (
            <Fragment key={s.label}>
              <div className="bg-gunmetal/30 p-6 text-center sm:p-7">
                <div className="stat-num text-3xl text-soft-white sm:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-soft-mute">
                  {s.label}
                </div>
              </div>

              {index === 1 && (
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
              )}
            </Fragment>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

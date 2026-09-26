"use client";

import { motion } from "framer-motion";

const pillars = [
  {
    title: "Predict",
    desc: "Surface early movement and risk indicators — around a fall, an intrusion, a mobility decline.",
  },
  {
    title: "Prevent",
    desc: "Turn early signals into timely human action — alerts to families, clinicians and operators.",
  },
  {
    title: "Protect",
    desc: "Support safer decisions across care and public environments.",
  },
];

/**
 * Predict / Prevent / Protect pillar cards — moved from the Vision section
 * so they sit immediately under the GaitAI · Philosophy quote on the home
 * page. One row of three on desktop/tablet, stacked on mobile.
 */
export function VisionPillars() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      {pillars.map((p, i) => (
        <motion.div
          key={p.title}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7"
        >
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-radial-violet opacity-40 blur-2xl" />
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
            0{i + 1}
          </div>
          <h3 className="mt-3 font-display text-2xl text-soft-white">{p.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-soft-gray">{p.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}

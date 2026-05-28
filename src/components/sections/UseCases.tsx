"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useCases } from "@/data/content";

export function UseCases() {
  return (
    <section id="use-cases" className="section">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Where GaitAI lives"
          title={
            <>
              From a quiet home to a{" "}
              <span className="text-gradient">global airport.</span>
            </>
          }
          description="GaitAI is designed as an intelligent movement layer for every environment where human safety, health and identity matter."
        />

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((u, i) => {
            const Icon = u.icon;
            return (
              <motion.div
                key={u.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-7 transition-all hover:border-cyan-300/30 hover:bg-white/[0.04]"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-radial-glow opacity-0 transition-opacity duration-500 group-hover:opacity-70" />
                <div className="relative flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-cyan-300 transition-all duration-500 group-hover:border-cyan-300/40 group-hover:bg-cyan-300/[0.08] group-hover:shadow-glow-cyan">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs text-soft-mute">0{i + 1}</span>
                </div>
                <h3 className="mt-6 font-display text-xl text-soft-white">{u.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-soft-mute">{u.desc}</p>
                <div className="mt-8 flex items-center gap-1.5 text-xs font-medium text-soft-mute transition-colors group-hover:text-cyan-300">
                  Learn more
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

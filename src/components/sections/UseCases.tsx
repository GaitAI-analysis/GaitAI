"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  industryUseCases,
  productById,
  type UseCaseEntry,
} from "@/data/products";

const accentStyles: Record<
  UseCaseEntry["accent"],
  { glow: string; text: string; ring: string; pill: string }
> = {
  teal: {
    glow: "from-teal-400/20 via-transparent to-transparent",
    text: "text-teal-300",
    ring: "ring-teal-300/30",
    pill: "border-teal-300/30 bg-teal-300/8 text-teal-200",
  },
  blue: {
    glow: "from-royal-400/20 via-transparent to-transparent",
    text: "text-royal-300",
    ring: "ring-royal-300/30",
    pill: "border-royal-300/30 bg-royal-300/8 text-royal-200",
  },
  cyan: {
    glow: "from-cyan-300/20 via-transparent to-transparent",
    text: "text-cyan-300",
    ring: "ring-cyan-300/30",
    pill: "border-cyan-300/30 bg-cyan-300/8 text-cyan-200",
  },
  violet: {
    glow: "from-violet-400/20 via-transparent to-transparent",
    text: "text-violet-300",
    ring: "ring-violet-300/30",
    pill: "border-violet-300/30 bg-violet-300/8 text-violet-200",
  },
  gold: {
    glow: "from-amber-400/20 via-transparent to-transparent",
    text: "text-amber-300",
    ring: "ring-amber-300/30",
    pill: "border-amber-300/30 bg-amber-300/8 text-amber-200",
  },
  emerald: {
    glow: "from-emerald-400/20 via-transparent to-transparent",
    text: "text-emerald-300",
    ring: "ring-emerald-300/30",
    pill: "border-emerald-300/30 bg-emerald-300/8 text-emerald-200",
  },
};

// Bento sizing: feature airports, smart cities, sports as larger tiles.
const tileSpan: Record<string, string> = {
  airports: "md:col-span-2",
  sports: "lg:col-span-2",
  smartcities: "md:col-span-2 lg:col-span-2",
};

export function UseCases() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section id="use-cases" className="section">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Industries · Where GaitAI lives"
          title={
            <>
              From a quiet home to a{" "}
              <span className="text-gradient">global stadium.</span>
            </>
          }
          description="One movement-intelligence platform — deployed across hospitals, sports academies, elderly-care homes, airports, smart cities and industrial sites."
        />

        <div className="mt-16 grid gap-4 md:grid-cols-4">
          {industryUseCases.map((u, i) => {
            const Icon = u.icon;
            const a = accentStyles[u.accent];
            const products = u.productIds
              .map((id) => productById(id))
              .filter((p): p is NonNullable<typeof p> => Boolean(p));
            const span = tileSpan[u.id] ?? "md:col-span-2 lg:col-span-1";

            return (
              <motion.article
                key={u.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onMouseEnter={() => setHovered(u.id)}
                onMouseLeave={() => setHovered(null)}
                className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:border-white/15 hover:bg-white/[0.04] ${span}`}
              >
                {/* glow */}
                <div
                  className={`pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-80 ${a.glow}`}
                  style={{
                    background: `radial-gradient(circle at center, currentColor, transparent 60%)`,
                  }}
                />

                {/* header */}
                <div className="flex items-start justify-between">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.03] ${a.text} transition-all duration-500 group-hover:bg-white/[0.06] group-hover:ring-1 group-hover:ring-cyan-300/30 group-hover:shadow-glow-cyan`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs text-soft-mute">
                    0{i + 1 < 10 ? i + 1 : i + 1}
                  </span>
                </div>

                <h3 className="mt-6 font-display text-xl text-soft-white">
                  {u.industry}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-soft-mute">
                  {u.problem}
                </p>

                {/* products */}
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {products.map((p) => (
                    <span
                      key={p.id}
                      className={`rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${a.pill}`}
                    >
                      {p.short}
                    </span>
                  ))}
                </div>

                {/* hover-reveal outcome */}
                <AnimatePresence>
                  {hovered === u.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{
                        duration: 0.35,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
                          Outcome
                        </div>
                        <div className="mt-1.5 text-[13px] leading-relaxed text-soft-white">
                          {u.outcome}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Link
                  href={`/${u.vertical}`}
                  className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-soft-mute transition-colors group-hover:text-cyan-300"
                >
                  Learn more
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

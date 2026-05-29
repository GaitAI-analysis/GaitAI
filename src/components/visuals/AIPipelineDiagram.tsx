"use client";

import { motion } from "framer-motion";
import { aiPipeline } from "@/data/products";

/**
 * Animated AI pipeline diagram — used in the Technology section.
 * Inputs flow through pose / gait / fusion → models → privacy → outputs.
 */
export function AIPipelineDiagram() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-white/[0.02] to-transparent p-6 sm:p-8">
      <div className="ring-grid pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative grid gap-4 lg:grid-cols-[1fr_2fr_1fr]">
        {/* INPUTS */}
        <Column title="Inputs" tone="cyan">
          <Pill label="Walking video" color="cyan" />
          <Pill label="Smartwatch IMU" color="amber" />
          <Pill label="Mobile sensor" color="amber" />
          <Pill label="CCTV feed" color="blue" />
        </Column>

        {/* MODELS */}
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-soft-mute">
            AI Models
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {aiPipeline.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.04,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="group rounded-xl border border-white/6 bg-white/[0.025] p-3 transition-all hover:border-cyan-300/30 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-royal-400/20 to-cyan-300/15 text-cyan-300 ring-1 ring-white/10">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="text-xs font-semibold text-soft-white">
                      {m.title}
                    </div>
                  </div>
                  <div className="mt-1.5 text-[10.5px] leading-relaxed text-soft-mute">
                    {m.desc}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* OUTPUTS */}
        <Column title="Outputs" tone="violet">
          <Pill label="Clinical PDF report" color="teal" />
          <Pill label="Mobility score" color="amber" />
          <Pill label="Fall-risk trend" color="amber" />
          <Pill label="Crowd heatmap" color="blue" />
          <Pill label="Anomaly alert" color="violet" />
          <Pill label="Privacy audit log" color="emerald" />
        </Column>

        {/* Flow lines (hidden on mobile) */}
        <svg
          className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
          aria-hidden
        >
          {/* Just decorative animated flow markers */}
        </svg>
      </div>
    </div>
  );
}

function Column({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "cyan" | "violet";
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-4">
      <div
        className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] ${
          tone === "cyan" ? "text-cyan-300" : "text-violet-300"
        }`}
      >
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Pill({
  label,
  color,
}: {
  label: string;
  color: "cyan" | "blue" | "teal" | "amber" | "violet" | "emerald";
}) {
  const map: Record<typeof color, string> = {
    cyan: "border-cyan-300/30 bg-cyan-300/8 text-cyan-200",
    blue: "border-royal-400/30 bg-royal-400/10 text-royal-200",
    teal: "border-teal-400/30 bg-teal-400/10 text-teal-200",
    amber: "border-amber-400/30 bg-amber-400/8 text-amber-200",
    violet: "border-violet-400/30 bg-violet-400/10 text-violet-200",
    emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  } as Record<string, string>;
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${map[color]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </div>
  );
}

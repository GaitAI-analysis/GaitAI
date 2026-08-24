"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Camera, Footprints, ScanLine } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SkeletonOverlayVisual } from "@/components/visuals/SkeletonOverlayVisual";

const outputFields = [
  "Walking speed",
  "Cadence",
  "Gait cycle",
  "Stride pattern",
  "Asymmetry",
  "Mobility score",
  "Risk indicator",
];

export function MovementIntelligenceDemo() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="what-gaitai-sees" className="section border-t border-white/[0.06]">
      <div className="container-wide">
        <SectionHeading
          eyebrow="What GaitAI sees"
          title={
            <>
              From movement to <span className="text-gradient">measurable intelligence.</span>
            </>
          }
          description="A real product pattern: motion is captured, converted into a pose-and-signal representation, then organized into inspectable outputs. This demonstration contains no subject data."
          align="left"
        />

        <div className="relative mt-14 overflow-hidden rounded-[2rem] border border-white/10 bg-obsidian-200/70 p-4 shadow-[0_30px_100px_-50px_rgba(37,99,255,0.7)] sm:p-6 lg:p-8">
          <div className="ring-grid pointer-events-none absolute inset-0 opacity-35" />
          <div className="relative grid gap-3 lg:grid-cols-[1fr_auto_1.05fr_auto_1.15fr] lg:items-stretch">
            <DemoStage label="01 · Human movement" title="Capture" icon={Camera}>
              <div className="relative min-h-64 overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-royal-700/20 via-obsidian to-obsidian p-5">
                <div className="absolute inset-0 ring-grid opacity-40" />
                <div className="relative flex h-full min-h-52 items-center justify-center">
                  <div className="absolute inset-x-5 top-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-soft-mute">
                    <span>Input source</span>
                    <span className="inline-flex items-center gap-1.5 text-cyan-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                      Ready
                    </span>
                  </div>
                  <div className="relative mt-8 h-40 w-32">
                    {[0, 1, 2].map((frame) => (
                      <motion.div
                        key={frame}
                        aria-hidden
                        animate={reduceMotion ? undefined : { x: [0, 7, 0], opacity: [0.18, 0.5, 0.18] }}
                        transition={{ duration: 2.8, delay: frame * 0.35, repeat: Infinity }}
                        className="absolute inset-0 rounded-[42%_42%_35%_35%] border border-cyan-300/20"
                        style={{ transform: `translateX(${(frame - 1) * 18}px) scale(${1 - frame * 0.035})` }}
                      />
                    ))}
                    <Footprints className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-cyan-300/80" />
                  </div>
                  <div className="absolute inset-x-5 bottom-3 flex gap-2">
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.05] px-2.5 py-1 text-[10px] text-cyan-200">Video</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1 text-[10px] text-soft-mute">Wearable signal</span>
                  </div>
                </div>
              </div>
            </DemoStage>

            <FlowArrow />

            <DemoStage label="02 · Machine perception" title="Pose + motion" icon={ScanLine}>
              <div className="min-h-64 overflow-hidden rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.05] via-obsidian to-violet-400/[0.05]">
                <SkeletonOverlayVisual accent="#4FD1FF" />
              </div>
            </DemoStage>

            <FlowArrow />

            <DemoStage label="03 · Movement intelligence" title="Measured outputs" icon={Footprints}>
              <div className="min-h-64 rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-400/[0.05] to-transparent p-4">
                <div className="mb-3 flex items-center justify-between border-b border-white/8 pb-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-soft-mute">Output schema</span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-soft-mute">No data loaded</span>
                </div>
                <dl className="space-y-1.5">
                  {outputFields.map((field, index) => (
                    <motion.div
                      key={field}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: index * 0.04 }}
                      className="flex items-center justify-between border-b border-white/[0.05] py-1.5 text-xs"
                    >
                      <dt className="text-soft-gray">{field}</dt>
                      <dd className="font-mono text-soft-mute">—</dd>
                    </motion.div>
                  ))}
                </dl>
              </div>
            </DemoStage>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoStage({
  label,
  title,
  icon: Icon,
  children,
}: {
  label: string;
  title: string;
  icon: typeof Camera;
  children: React.ReactNode;
}) {
  return (
    <article className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300">{label}</div>
          <h3 className="mt-1 font-display text-xl text-soft-white">{title}</h3>
        </div>
        <Icon className="h-5 w-5 text-soft-mute" aria-hidden />
      </div>
      {children}
    </article>
  );
}

function FlowArrow() {
  return (
    <div className="flex items-center justify-center py-1 text-cyan-300/70 lg:px-1 lg:pt-14">
      <ArrowRight className="h-5 w-5 rotate-90 lg:rotate-0" aria-hidden />
    </div>
  );
}

"use client";

import { useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { movementEngineStages } from "@/data/platform";

export function HowItWorks() {
  const [activeId, setActiveId] = useState<(typeof movementEngineStages)[number]["id"]>(
    movementEngineStages[0].id
  );
  const active = movementEngineStages.find((stage) => stage.id === activeId) ?? movementEngineStages[0];
  const ActiveIcon = active.icon;
  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? movementEngineStages.length - 1
        : (index + (event.key === 'ArrowLeft' ? -1 : 1) + movementEngineStages.length) % movementEngineStages.length;
    const next = movementEngineStages[nextIndex];
    setActiveId(next.id);
    document.getElementById(`movement-engine-${next.id}`)?.focus();
  };

  return (
    <section id="how" className="section bg-obsidian-300/40">
      <div className="container-wide">
        <SectionHeading
          eyebrow="How GaitAI works"
          title={
            <>
              Human movement becomes <span className="text-gradient">actionable intelligence.</span>
            </>
          }
          description="A five-stage architecture connects capture sources to inspectable outputs. Select a stage to see the capabilities represented in the current GaitAI product content."
          align="left"
        />

        <div className="mt-14 lg:hidden">
          <ol className="space-y-3">
            {movementEngineStages.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <li key={stage.id} className="relative">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-cyan-300">{stage.step}</span>
                      <span className="grid h-9 w-9 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      <h3 className="font-display text-xl text-soft-white">{stage.label}</h3>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-soft-mute">{stage.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {stage.items.map((item) => (
                        <span key={item.label} className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[11px] text-soft-gray">
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  {index < movementEngineStages.length - 1 && (
                    <div className="flex h-8 items-center justify-center text-cyan-300/60">
                      <ArrowDown className="h-4 w-4" />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-16 hidden lg:block">
          <div role="tablist" aria-label="GaitAI movement engine stages" className="grid grid-cols-5 border-y border-white/10">
            {movementEngineStages.map((stage, index) => {
              const Icon = stage.icon;
              const selected = active.id === stage.id;
              return (
                <div key={stage.id} className="relative flex items-stretch">
                  <button
                    type="button"
                    role="tab"
                    id={`movement-engine-${stage.id}`}
                    aria-selected={selected}
                    aria-controls="movement-engine-detail"
                    tabIndex={selected ? 0 : -1}
                    onMouseEnter={() => setActiveId(stage.id)}
                    onFocus={() => setActiveId(stage.id)}
                    onClick={() => setActiveId(stage.id)}
                    onKeyDown={(event) => moveFocus(event, index)}
                    className={`group flex min-h-44 w-full flex-col items-start justify-between px-5 py-6 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300/70 ${
                      selected ? "bg-cyan-300/[0.055]" : "hover:bg-white/[0.025]"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-mono text-[10px] text-soft-mute">{stage.step}</span>
                      <Icon className={`h-5 w-5 ${selected ? "text-cyan-300" : "text-soft-mute"}`} />
                    </div>
                    <span className="font-display text-xl text-soft-white">{stage.label}</span>
                    <span className={`h-px w-full origin-left bg-gradient-to-r from-cyan-300 to-violet-400 transition-transform ${selected ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
                  </button>
                  {index < movementEngineStages.length - 1 && (
                    <ArrowRight className="pointer-events-none absolute -right-2 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-cyan-300/60" />
                  )}
                </div>
              );
            })}
          </div>

          <motion.div
            key={active.id}
            id="movement-engine-detail"
            role="tabpanel"
            aria-labelledby={`movement-engine-${active.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid min-h-72 grid-cols-[0.8fr_1.2fr] border-b border-white/10"
          >
            <div className="flex flex-col justify-center border-r border-white/10 p-10">
              <span className="grid h-12 w-12 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-300">
                <ActiveIcon className="h-5 w-5" />
              </span>
              <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300">Stage {active.step}</div>
              <h3 className="mt-2 font-display text-4xl text-soft-white">{active.label}</h3>
            </div>
            <div className="flex flex-col justify-center p-10">
              <p className="max-w-2xl text-lg leading-relaxed text-soft-gray">{active.description}</p>
              <div className="mt-7 grid grid-cols-2 gap-x-8 gap-y-3">
                {active.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-3 border-b border-white/[0.07] py-3 text-sm text-soft-white">
                      <Icon className="h-4 w-4 text-cyan-300" />
                      {item.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

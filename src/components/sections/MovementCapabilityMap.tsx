"use client";

import { useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { movementCapabilities } from "@/data/platform";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function MovementCapabilityMap() {
  const [activeId, setActiveId] = useState<(typeof movementCapabilities)[number]["id"]>(
    movementCapabilities[0].id
  );
  const active = movementCapabilities.find((item) => item.id === activeId) ?? movementCapabilities[0];
  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const delta = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? movementCapabilities.length - 1
        : (index + delta + movementCapabilities.length) % movementCapabilities.length;
    const next = movementCapabilities[nextIndex];
    setActiveId(next.id);
    document.getElementById(`movement-capability-${next.id}`)?.focus();
  };

  return (
    <section id="capability-map" className="section">
      <div className="container-wide">
        <SectionHeading
          eyebrow="What GaitAI understands"
          title={
            <>
              Movement carries <span className="text-gradient">information.</span>
            </>
          }
          description="GaitAI organizes that information into a focused capability taxonomy—separate from individual product names."
          align="left"
        />

        <div className="mt-14 border-y border-white/10">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div role="tablist" aria-label="Movement understanding categories" className="grid grid-cols-2 border-b border-white/10 sm:grid-cols-4 lg:border-b-0 lg:border-r lg:border-white/10">
              {movementCapabilities.map((capability, index) => {
                const Icon = capability.icon;
                const selected = capability.id === active.id;
                return (
                  <button
                    key={capability.id}
                    type="button"
                    role="tab"
                    id={`movement-capability-${capability.id}`}
                    aria-selected={selected}
                    aria-controls="movement-capability-detail"
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActiveId(capability.id)}
                    onKeyDown={(event) => moveFocus(event, index)}
                    className={`group relative min-h-32 border-b border-r border-white/[0.07] p-4 text-left transition-colors sm:min-h-40 sm:p-5 ${
                      selected ? "bg-cyan-300/[0.05]" : "hover:bg-white/[0.025]"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${selected ? "text-cyan-300" : "text-soft-mute"}`} />
                    <span className="mt-8 block font-display text-base text-soft-white sm:text-lg">
                      {capability.label}
                    </span>
                    <span
                      className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-cyan-300 to-violet-400 transition-transform ${
                        selected ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <motion.div
              key={active.id}
              id="movement-capability-detail"
              role="tabpanel"
              aria-labelledby={`movement-capability-${active.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex min-h-64 flex-col justify-center p-7 sm:p-10 lg:p-12"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300">Movement signal · {active.label}</div>
              <h3 className="mt-4 font-display text-3xl text-soft-white sm:text-4xl">{active.description}</h3>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-soft-mute">
                Represented in: <span className="text-soft-gray">{active.evidence}</span>.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

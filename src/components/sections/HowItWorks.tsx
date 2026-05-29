"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { workflowStages } from "@/data/products";

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="how" className="section bg-obsidian-300/40">
      <div className="container-wide">
        <SectionHeading
          eyebrow="The GaitAI workflow"
          title={
            <>
              Capture movement.{" "}
              <span className="text-gradient">Act on intelligence.</span>
            </>
          }
          description="A four-stage pipeline that turns walking videos, wearable signals and CCTV movement into clinically useful and operationally actionable insight — in seconds."
        />

        <div ref={ref} className="relative mt-20">
          {/* central rail (desktop) */}
          <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-white/8 lg:block" />
          <motion.div
            style={{ height: lineHeight }}
            className="pointer-events-none absolute left-1/2 top-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-cyan-300 via-royal-400 to-violet-400 shadow-[0_0_20px_rgba(79,209,255,0.6)] lg:block"
          />

          <div className="space-y-16 lg:space-y-28">
            {workflowStages.map((s, i) => {
              const isLeft = i % 2 === 0;
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-120px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="relative grid items-center gap-8 lg:grid-cols-2"
                >
                  {/* Left content (or stays left on mobile) */}
                  <div className={isLeft ? "lg:pr-16 lg:text-right" : "lg:order-2 lg:pl-16"}>
                    <div className={`inline-flex items-center gap-3 ${isLeft ? "lg:flex-row-reverse" : ""}`}>
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-royal-400/20 to-violet-400/20 ring-1 ring-white/10">
                        <Icon className="h-5 w-5 text-cyan-300" />
                      </span>
                      <div className="font-mono text-xs uppercase tracking-[0.2em] text-soft-mute">
                        Stage {s.step}
                      </div>
                    </div>
                    <h3 className="mt-5 font-display text-3xl text-soft-white sm:text-4xl">
                      {s.title}
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-soft-gray sm:text-base lg:max-w-md lg:ml-auto">
                      {isLeft ? <span className="lg:inline-block">{s.desc}</span> : s.desc}
                    </p>
                  </div>

                  {/* Center node (desktop) */}
                  <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
                    <div className="relative">
                      <div className="h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_16px_#4FD1FF]" />
                      <div className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-cyan-300/40" />
                    </div>
                  </div>

                  {/* Right visual */}
                  <div className={isLeft ? "" : "lg:order-1"}>
                    <StageVisual index={i} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function StageVisual({ index }: { index: number }) {
  return (
    <div className="card relative h-56 overflow-hidden sm:h-64">
      <div className="ring-grid absolute inset-0 opacity-50" />
      <div className="absolute inset-0">
        {index === 0 && <SenseVisual />}
        {index === 1 && <UnderstandVisual />}
        {index === 2 && <PredictVisual />}
        {index === 3 && <ProtectVisual />}
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-soft-mute">
        <span>stage_0{index + 1}</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          active
        </span>
      </div>
    </div>
  );
}

function SenseVisual() {
  return (
    <svg className="h-full w-full" viewBox="0 0 400 240" fill="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="400" y2="240">
          <stop stopColor="#4FD1FF" stopOpacity="0.7" />
          <stop offset="1" stopColor="#2563FF" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <g stroke="url(#sg)" strokeWidth="1.2" opacity="0.6">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1="200" y1="120" x2={200 + Math.cos((i / 12) * Math.PI * 2) * 100} y2={120 + Math.sin((i / 12) * Math.PI * 2) * 60} />
        ))}
      </g>
      <circle cx="200" cy="120" r="6" fill="#4FD1FF">
        <animate attributeName="r" values="6;9;6" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="200" cy="120" r="50" stroke="#4FD1FF" strokeOpacity="0.25" />
      <circle cx="200" cy="120" r="90" stroke="#4FD1FF" strokeOpacity="0.15" />
    </svg>
  );
}

function UnderstandVisual() {
  return (
    <svg className="h-full w-full" viewBox="0 0 400 240" fill="none">
      <g stroke="#7C3AED" strokeWidth="1.5" opacity="0.8">
        <path d="M120 60 L150 100 L130 140 L170 170" />
        <path d="M150 100 L190 90 L220 120 L210 160 L240 200" />
        <path d="M220 120 L270 110 L290 70" />
      </g>
      {[[120, 60], [150, 100], [130, 140], [170, 170], [190, 90], [220, 120], [210, 160], [240, 200], [270, 110], [290, 70]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="#4FD1FF">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" begin={`${i * 0.1}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

function PredictVisual() {
  return (
    <svg className="h-full w-full" viewBox="0 0 400 240" fill="none">
      <defs>
        <linearGradient id="pg" x1="0" y1="0" x2="0" y2="240">
          <stop stopColor="#4FD1FF" stopOpacity="0.6" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M 20 180 Q 80 140, 120 150 T 220 100 T 320 70 L 380 50" stroke="#4FD1FF" strokeWidth="2" fill="none" />
      <path d="M 20 180 Q 80 140, 120 150 T 220 100 T 320 70 L 380 50 L 380 220 L 20 220 Z" fill="url(#pg)" opacity="0.5" />
      <g fill="#fff">
        {[[120, 150], [220, 100], [320, 70], [380, 50]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" stroke="#7C3AED" />
        ))}
      </g>
    </svg>
  );
}

function ProtectVisual() {
  return (
    <svg className="h-full w-full" viewBox="0 0 400 240" fill="none">
      <g opacity="0.6">
        <circle cx="200" cy="120" r="40" stroke="#4FD1FF" />
        <circle cx="200" cy="120" r="70" stroke="#7C3AED" strokeOpacity="0.6" />
        <circle cx="200" cy="120" r="100" stroke="#2563FF" strokeOpacity="0.35" />
      </g>
      <path
        d="M180 105 L200 92 L220 105 L220 130 Q200 150 180 130 Z"
        fill="#4FD1FF"
        opacity="0.9"
      />
      <path d="M190 122 L198 130 L212 114" stroke="#070B14" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

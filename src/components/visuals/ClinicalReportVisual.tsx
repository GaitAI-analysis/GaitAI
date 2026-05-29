"use client";

import { motion } from "framer-motion";
import { FileText, Download } from "lucide-react";

/**
 * A premium "AI-generated clinical report" preview card — styled to look like
 * a real downloadable PDF mockup. Used on the MobilityCare page and WalkScan
 * flagship blocks.
 */
export function ClinicalReportVisual() {
  return (
    <div
      className="relative rounded-2xl border border-white/10 p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-teal-400/20 to-cyan-300/15 ring-1 ring-teal-400/30">
            <FileText className="h-4 w-4 text-teal-300" />
          </span>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-soft-mute">
              GaitAI Report
            </div>
            <div className="text-sm font-semibold text-soft-white">
              WalkScan · Patient #1042
            </div>
          </div>
        </div>
        <div className="flex h-7 items-center gap-1 rounded-md bg-emerald-400/15 px-2 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-400/30">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Cleared
        </div>
      </div>

      {/* Mobility score */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ScoreCard label="Mobility score" value="82" delta="+6" trend="up" />
        <ScoreCard label="Fall-risk" value="Low" sub="0.21" trend="down" />
      </div>

      {/* Metrics row */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        <Metric label="Speed" value="1.18" unit="m/s" />
        <Metric label="Cadence" value="112" unit="spm" />
        <Metric label="Stride" value="0.62" unit="m" />
        <Metric label="Asym." value="4.2" unit="%" />
      </div>

      {/* Mini chart */}
      <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] p-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-soft-mute">
            Recovery trend · 6 wk
          </div>
          <div className="text-[10px] font-semibold text-emerald-300">
            +18% improvement
          </div>
        </div>
        <svg viewBox="0 0 240 60" className="mt-2 h-12 w-full">
          <defs>
            <linearGradient id="rep-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0FA3B1" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0FA3B1" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* gridlines */}
          {[15, 30, 45].map((y) => (
            <line key={y} x1="0" y1={y} x2="240" y2={y} stroke="rgba(255,255,255,0.04)" />
          ))}
          <motion.path
            d="M0 48 L40 42 L80 38 L120 30 L160 25 L200 18 L240 12"
            fill="none"
            stroke="#0FA3B1"
            strokeWidth="1.8"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.path
            d="M0 48 L40 42 L80 38 L120 30 L160 25 L200 18 L240 12 L240 60 L0 60 Z"
            fill="url(#rep-grad)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.6 }}
          />
          {[
            [0, 48],
            [40, 42],
            [80, 38],
            [120, 30],
            [160, 25],
            [200, 18],
            [240, 12],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill="#0FA3B1" />
          ))}
        </svg>
      </div>

      {/* CTA */}
      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-xs font-medium text-soft-white transition-all hover:border-cyan-300/40 hover:bg-white/[0.06]">
        <Download className="h-3.5 w-3.5" />
        Download sample report
      </button>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  sub,
  delta,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: string;
  trend?: "up" | "down";
}) {
  const trendColor =
    trend === "up" ? "text-emerald-300" : trend === "down" ? "text-amber-300" : "";
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-soft-mute">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <div className="font-display text-2xl font-semibold text-soft-white">
          {value}
        </div>
        {sub && <div className="text-xs text-soft-mute">{sub}</div>}
        {delta && (
          <div className={`text-[11px] font-semibold ${trendColor}`}>{delta}</div>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-lg border border-white/6 bg-white/[0.015] p-2 text-center">
      <div className="text-[9px] font-medium uppercase tracking-[0.16em] text-soft-mute">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-soft-white">
        {value}
        <span className="ml-0.5 text-[9px] font-normal text-soft-mute">{unit}</span>
      </div>
    </div>
  );
}

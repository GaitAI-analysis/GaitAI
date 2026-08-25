"use client";

import { motion } from "framer-motion";

/**
 * Premium code-built smartwatch UI showing a live mobility score.
 * Used in the WatchCare flagship section and the MobilityCare page.
 */
export function SmartwatchVisual({
  score = 86,
  trend = "up",
}: {
  score?: number;
  trend?: "up" | "down" | "flat";
}) {
  const trendColor =
    trend === "up" ? "#10B981" : trend === "down" ? "#F59E0B" : "#94A3B8";

  return (
    <div className="relative mx-auto" style={{ width: 280 }}>
      {/* Watch crown */}
      <div className="absolute right-0 top-[28%] z-10 h-12 w-2 rounded-r-full bg-gradient-to-r from-soft-white/30 to-soft-white/10" />
      {/* Watch button */}
      <div className="absolute right-0 top-[58%] z-10 h-7 w-1.5 rounded-r-full bg-gradient-to-r from-soft-white/30 to-soft-white/10" />

      {/* Watch case */}
      <div
        className="relative overflow-hidden rounded-[58px] border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
        style={{
          background:
            "linear-gradient(160deg, rgba(40,40,55,0.9) 0%, rgba(15,18,30,1) 60%, rgba(8,10,18,1) 100%)",
          aspectRatio: "1 / 1.15",
        }}
      >
        {/* Bezel highlights */}
        <div className="pointer-events-none absolute inset-0 rounded-[58px] ring-1 ring-inset ring-white/8" />
        <div className="pointer-events-none absolute inset-x-12 top-[2px] h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {/* Screen */}
        <div
          className="absolute inset-3 overflow-hidden rounded-[48px]"
          style={{
            background:
              "radial-gradient(circle at 50% 25%, rgba(213,160,33,0.16), transparent 60%), linear-gradient(180deg, #0A1020 0%, #050810 100%)",
          }}
        >
          {/* Top status bar */}
          <div className="absolute inset-x-0 top-4 flex items-center justify-between px-6 text-[9px] font-medium uppercase tracking-[0.18em] text-soft-mute">
            <span>9:41 AM</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              live
            </span>
          </div>

          {/* Mobility score ring */}
          <div className="absolute inset-x-0 top-12 flex justify-center">
            <ScoreRing score={score} />
          </div>

          {/* Trend chart */}
          <div className="absolute inset-x-5 bottom-20 h-14">
            <TrendChart color={trendColor} />
          </div>

          {/* Bottom widgets */}
          <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-1.5">
            <MiniStat label="Steps" value="8,124" />
            <MiniStat label="Cadence" value="112" />
            <MiniStat label="Risk" value="Low" highlight />
          </div>
        </div>

        {/* Glow */}
        <div className="pointer-events-none absolute -inset-x-10 -top-10 h-40 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      {/* Strap top */}
      <div
        className="mx-auto -mt-2 h-12 w-[58%] rounded-b-[18px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(40,40,55,0.8) 0%, rgba(15,18,30,0.2) 100%)",
        }}
      />
      {/* Strap bottom (off-screen visual tail) */}
      <div
        className="absolute left-1/2 top-[88%] h-16 w-[55%] -translate-x-1/2 rounded-b-[18px] opacity-70"
        style={{
          background:
            "linear-gradient(180deg, rgba(40,40,55,0.6) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className="relative">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="60%" stopColor="#D5A021" />
            <stop offset="100%" stopColor="#A26B00" />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
          fill="none"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          stroke="url(#ring-grad)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          strokeDasharray={c}
          transform="rotate(-90 50 50)"
          style={{ filter: "drop-shadow(0 0 8px rgba(213,160,33,0.55))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-3xl font-semibold leading-none text-soft-white">
          {score}
        </div>
        <div className="mt-1 text-[8px] font-medium uppercase tracking-[0.2em] text-amber-300/80">
          mobility
        </div>
      </div>
    </div>
  );
}

function TrendChart({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 220 60" className="h-full w-full">
      <defs>
        <linearGradient id="trend-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0 45 Q20 38, 35 32 T70 30 T110 22 T150 18 T190 12 L220 8"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
      />
      <motion.path
        d="M0 45 Q20 38, 35 32 T70 30 T110 22 T150 18 T190 12 L220 8 L220 60 L0 60 Z"
        fill="url(#trend-area)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.8 }}
      />
      <motion.circle
        cx="220"
        cy="8"
        r="3"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.6, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      />
    </svg>
  );
}

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-1.5 py-1.5 text-center ${
        highlight
          ? "border-emerald-400/40 bg-emerald-400/10"
          : "border-white/8 bg-white/[0.03]"
      }`}
    >
      <div
        className={`text-[10px] font-semibold ${
          highlight ? "text-emerald-300" : "text-soft-white"
        }`}
      >
        {value}
      </div>
      <div className="text-[7px] uppercase tracking-[0.15em] text-soft-mute">
        {label}
      </div>
    </div>
  );
}

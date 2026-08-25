"use client";

import { motion } from "framer-motion";

/**
 * Premium clinical mobility dashboard mockup — replaces the bare skeleton
 * overlay on the MobilityCare card. Designed as a layered product moment:
 *
 *   ┌──────────────────────────┬────────────┐
 *   │  Walking figure + dots   │  Score ring │
 *   │  + cadence waveform      │  Cadence    │
 *   │                          │  Asymmetry  │
 *   ├──────────────────────────┴────────────┤
 *   │   Recovery trend sparkline strip       │
 *   └────────────────────────────────────────┘
 *
 * Fits inside the 288px-tall card visual area (top 12px reserved for
 * the existing pill badges on the parent card).
 */
export function MobilityDashboardVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-4 pt-14 pb-3">
      <div className="grid w-full max-w-[440px] grid-cols-[1.55fr_1fr] gap-2.5">
        {/* ─────────── LEFT: Walking figure dashboard card ─────────── */}
        <DashboardCard label="Live pose · 17/17 KP" accent="teal">
          <div className="relative h-[140px]">
            <WalkingFigure />
            {/* Floating cadence pill */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="absolute right-1 top-1 rounded-md border border-teal-300/40 bg-black/50 px-1.5 py-0.5 font-mono text-[8.5px] text-teal-200 backdrop-blur-md"
            >
              CAD · 112
            </motion.div>
          </div>
          {/* Mini gait waveform */}
          <div className="mt-2 border-t border-white/8 pt-2">
            <div className="text-[8px] font-medium uppercase tracking-[0.18em] text-soft-mute">
              Gait rhythm
            </div>
            <GaitWaveform />
          </div>
        </DashboardCard>

        {/* ─────────── RIGHT: Score ring + metric chips ─────────── */}
        <div className="flex flex-col gap-2.5">
          <DashboardCard label="Mobility" accent="teal" compact>
            <ScoreRing score={82} />
          </DashboardCard>

          <MetricChip label="Asymmetry" value="4.2%" trend="down" accent="emerald" />
          <MetricChip label="Fall-risk" value="Low" accent="emerald" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function DashboardCard({
  label,
  accent,
  compact = false,
  children,
}: {
  label: string;
  accent: "teal";
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] ${
        compact ? "p-2.5" : "p-3"
      } backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-teal-300/90">
          {label}
        </span>
        <span className="flex items-center gap-1 text-[8px] font-mono text-soft-mute">
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          live
        </span>
      </div>
      <div className={compact ? "mt-1.5" : "mt-2"}>{children}</div>
    </div>
  );
}

function WalkingFigure() {
  // Joints — head, shoulders, elbows, hands, hips, knees, ankles
  const joints: Array<[number, number]> = [
    [110, 22], // head
    [110, 42], // neck
    [96, 52], // l shoulder
    [124, 52], // r shoulder
    [86, 68], // l elbow
    [136, 70], // r elbow
    [78, 84], // l hand
    [148, 88], // r hand
    [110, 80], // hip
    [98, 105], // l hip
    [122, 105], // r hip
    [92, 130], // l knee
    [128, 132], // r knee
    [82, 158], // l ankle
    [140, 160], // r ankle
  ];

  const bones = [
    [0, 1],
    [1, 2],
    [1, 3],
    [2, 4],
    [3, 5],
    [4, 6],
    [5, 7],
    [1, 8],
    [8, 9],
    [8, 10],
    [9, 11],
    [10, 12],
    [11, 13],
    [12, 14],
  ];

  return (
    <svg viewBox="0 0 220 180" className="h-full w-full">
      <defs>
        <linearGradient id="bone-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0FA3B1" />
          <stop offset="100%" stopColor="#4FD1FF" />
        </linearGradient>
        <radialGradient id="figure-glow" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#0FA3B1" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0FA3B1" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="220" height="180" fill="url(#figure-glow)" />

      {/* Motion trail (faint duplicates trailing behind) */}
      <g opacity="0.18">
        {joints.map(([x, y], i) => (
          <circle key={`trail-${i}`} cx={x - 14} cy={y} r="2" fill="#4FD1FF" />
        ))}
      </g>
      <g opacity="0.32">
        {joints.map(([x, y], i) => (
          <circle key={`trail2-${i}`} cx={x - 7} cy={y} r="2" fill="#4FD1FF" />
        ))}
      </g>

      {/* Bones */}
      {bones.map(([a, b], i) => (
        <motion.line
          key={`bone-${i}`}
          x1={joints[a][0]}
          y1={joints[a][1]}
          x2={joints[b][0]}
          y2={joints[b][1]}
          stroke="url(#bone-grad)"
          strokeWidth="1.8"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.1 + i * 0.04,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ filter: "drop-shadow(0 0 3px rgba(79,209,255,0.6))" }}
        />
      ))}

      {/* Head circle */}
      <motion.circle
        cx="110"
        cy="22"
        r="9"
        fill="none"
        stroke="url(#bone-grad)"
        strokeWidth="1.8"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      />

      {/* Joints */}
      {joints.map(([x, y], i) => (
        <motion.circle
          key={`joint-${i}`}
          cx={x}
          cy={y}
          r="2.4"
          fill="#fff"
          stroke="#0FA3B1"
          strokeWidth="1"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 + i * 0.03, duration: 0.3 }}
          style={{ filter: "drop-shadow(0 0 3px #0FA3B1)" }}
        />
      ))}

      {/* Movement direction arrow */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        <line x1="170" y1="100" x2="200" y2="100" stroke="#4FD1FF" strokeWidth="1" opacity="0.6" />
        <polygon
          points="200,100 196,97 196,103"
          fill="#4FD1FF"
          opacity="0.8"
        />
      </motion.g>
    </svg>
  );
}

function ScoreRing({ score = 82 }: { score?: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <defs>
          <linearGradient id="mob-ring" x1="0" y1="0" x2="72" y2="72">
            <stop offset="0%" stopColor="#4FD1FF" />
            <stop offset="60%" stopColor="#0FA3B1" />
            <stop offset="100%" stopColor="#0A6890" />
          </linearGradient>
        </defs>
        <circle
          cx="36"
          cy="36"
          r={r}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="4.5"
          fill="none"
        />
        <motion.circle
          cx="36"
          cy="36"
          r={r}
          stroke="url(#mob-ring)"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          strokeDasharray={c}
          transform="rotate(-90 36 36)"
          style={{ filter: "drop-shadow(0 0 6px rgba(15,163,177,0.65))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-xl font-semibold leading-none text-soft-white">
          {score}
        </div>
        <div className="mt-0.5 text-[7px] font-medium uppercase tracking-[0.2em] text-teal-300/80">
          /100
        </div>
      </div>
    </div>
  );
}

function MetricChip({
  label,
  value,
  trend,
  accent,
}: {
  label: string;
  value: string;
  trend?: "up" | "down";
  accent: "emerald";
}) {
  const tone =
    accent === "emerald" ? "border-emerald-400/30 bg-emerald-400/8" : "";
  return (
    <div className={`rounded-xl border ${tone} px-2.5 py-1.5`}>
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-medium uppercase tracking-[0.18em] text-soft-mute">
          {label}
        </span>
        {trend === "down" && (
          <span className="text-[10px] text-emerald-300">↓</span>
        )}
      </div>
      <div className="mt-0.5 text-xs font-semibold text-soft-white">
        {value}
      </div>
    </div>
  );
}

function GaitWaveform() {
  return (
    <svg viewBox="0 0 180 28" className="mt-1 h-7 w-full">
      <defs>
        <linearGradient id="gait-wave" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#0FA3B1" stopOpacity="0" />
          <stop offset="50%" stopColor="#4FD1FF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0FA3B1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0 14 Q12 6, 24 14 T48 14 T72 14 T96 14 T120 14 T144 14 T168 14 L180 14"
        fill="none"
        stroke="url(#gait-wave)"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
      />
      {/* Tick marks */}
      {[0, 30, 60, 90, 120, 150, 180].map((x) => (
        <line
          key={x}
          x1={x}
          y1="22"
          x2={x}
          y2="24"
          stroke="rgba(148,163,184,0.3)"
        />
      ))}
    </svg>
  );
}

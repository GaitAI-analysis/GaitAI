"use client";

import { motion } from "framer-motion";

/**
 * Premium privacy-aware operations console — replaces the bare crowd
 * heatmap on the SecureVision card. Designed as a dense product moment:
 *
 *   ┌─────────────────────────┬─────────────┐
 *   │  Floor plan with        │  Camera     │
 *   │  animated anonymized    │  thumbs (3) │
 *   │  people + heat zones    │             │
 *   ├─────────────────────────┴─────────────┤
 *   │  Event timeline strip                  │
 *   └────────────────────────────────────────┘
 *
 * Sits inside the 288px-tall card visual area (top 12px reserved for
 * the existing pill badges on the parent card).
 */
export function SecureOperationsVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-4 pt-14 pb-3">
      <div className="grid w-full max-w-[460px] grid-cols-[1.55fr_1fr] gap-2.5">
        {/* ─────────── LEFT: Floor plan ─────────── */}
        <Card
          label="Atrium · West wing"
          right={
            <div className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-300">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              PrivacyGuard
            </div>
          }
        >
          <div className="relative h-[150px]">
            <FloorPlan />
          </div>
          <Timeline />
        </Card>

        {/* ─────────── RIGHT: Camera feeds + density meter ─────────── */}
        <div className="flex flex-col gap-2">
          <CameraFeed cam="CAM 04" status="normal" delay={0.2} />
          <CameraFeed cam="CAM 07" status="alert" delay={0.35} />
          <DensityMeter />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Card({
  label,
  right,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-royal-300/90">
          {label}
        </span>
        {right ?? (
          <span className="flex items-center gap-1 text-[8px] font-mono text-soft-mute">
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            live
          </span>
        )}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function FloorPlan() {
  // Walking-person waypoints — each "person" animates between two points.
  const people: Array<{ from: [number, number]; to: [number, number]; delay: number; color: string }> = [
    { from: [20, 60], to: [180, 50], delay: 0.4, color: "#4FD1FF" },
    { from: [220, 90], to: [60, 100], delay: 0.8, color: "#4FD1FF" },
    { from: [120, 20], to: [120, 120], delay: 1.0, color: "#FBBF24" },
    { from: [180, 110], to: [40, 30], delay: 0.6, color: "#4FD1FF" },
  ];

  return (
    <svg viewBox="0 0 260 140" className="h-full w-full">
      <defs>
        <radialGradient id="floor-bg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#2D6CDF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0B1F3A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="zone-warm" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="260" height="140" fill="url(#floor-bg)" />

      {/* Floor plan boundary */}
      <rect
        x="6"
        y="6"
        width="248"
        height="128"
        rx="4"
        stroke="rgba(148,163,184,0.25)"
        strokeDasharray="3 3"
        fill="none"
      />

      {/* Interior walls */}
      <line x1="90" y1="6" x2="90" y2="50" stroke="rgba(148,163,184,0.18)" strokeWidth="1" />
      <line x1="180" y1="80" x2="180" y2="134" stroke="rgba(148,163,184,0.18)" strokeWidth="1" />
      <line x1="6" y1="80" x2="60" y2="80" stroke="rgba(148,163,184,0.18)" strokeWidth="1" />

      {/* Door openings */}
      <rect x="0" y="60" width="6" height="14" fill="rgba(148,163,184,0.35)" />
      <rect x="254" y="60" width="6" height="14" fill="rgba(148,163,184,0.35)" />

      {/* Warm zone hot spot */}
      <motion.circle
        cx="200"
        cy="60"
        r="32"
        fill="url(#zone-warm)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        style={{ filter: "blur(8px)" }}
      />

      {/* Camera markers */}
      {[
        [12, 12],
        [248, 12],
        [12, 128],
        [248, 128],
      ].map(([cx, cy], i) => (
        <motion.g
          key={`cam-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + i * 0.08 }}
        >
          <circle cx={cx} cy={cy} r="3" fill="#4FD1FF" />
          <circle cx={cx} cy={cy} r="6" stroke="#4FD1FF" strokeOpacity="0.4" fill="none" />
        </motion.g>
      ))}

      {/* Animated people — anonymized dots */}
      {people.map((p, i) => (
        <motion.g
          key={`p-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: p.delay }}
        >
          {/* Trail */}
          <line
            x1={p.from[0]}
            y1={p.from[1]}
            x2={p.to[0]}
            y2={p.to[1]}
            stroke={p.color}
            strokeWidth="0.8"
            strokeDasharray="2 3"
            opacity="0.4"
          />
          {/* Person dot — animates along the line */}
          <motion.circle
            cx={p.from[0]}
            cy={p.from[1]}
            r="3.5"
            fill={p.color}
            initial={{ cx: p.from[0], cy: p.from[1] }}
            animate={{ cx: p.to[0], cy: p.to[1] }}
            transition={{
              duration: 3.5,
              delay: p.delay + 0.4,
              ease: "linear",
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{ filter: `drop-shadow(0 0 4px ${p.color})` }}
          />
        </motion.g>
      ))}

      {/* Alert tag */}
      <motion.g
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        <rect
          x="170"
          y="44"
          width="76"
          height="22"
          rx="4"
          fill="rgba(0,0,0,0.6)"
          stroke="rgba(251,191,36,0.5)"
        />
        <circle cx="178" cy="55" r="2.5" fill="#FBBF24">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <text x="184" y="58" fontSize="8" fill="#FBBF24" fontFamily="ui-monospace, monospace" letterSpacing="1">
          DWELL · 4:12
        </text>
      </motion.g>
    </svg>
  );
}

function CameraFeed({
  cam,
  status,
  delay = 0,
}: {
  cam: string;
  status: "normal" | "alert";
  delay?: number;
}) {
  const color = status === "alert" ? "amber" : "emerald";
  const ring =
    status === "alert"
      ? "border-amber-400/40"
      : "border-white/8";
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`relative overflow-hidden rounded-xl border ${ring} bg-white/[0.025] p-2 backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-mono uppercase tracking-[0.18em] text-soft-mute">
          {cam}
        </span>
        <span
          className={`flex items-center gap-1 text-[8px] font-semibold ${
            color === "amber" ? "text-amber-300" : "text-emerald-300"
          }`}
        >
          <span
            className={`h-1 w-1 rounded-full ${
              color === "amber" ? "bg-amber-400" : "bg-emerald-400"
            }`}
          />
          {status === "alert" ? "Anomaly" : "Normal"}
        </span>
      </div>
      <div className="mt-1.5">
        <CameraMiniSilhouette accent={status === "alert" ? "#FBBF24" : "#4FD1FF"} />
      </div>
    </motion.div>
  );
}

function CameraMiniSilhouette({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 110 50" className="h-9 w-full">
      <defs>
        <radialGradient id={`cam-bg-${accent}`} cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.12" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="110" height="50" fill={`url(#cam-bg-${accent})`} />
      {/* Skeleton figure — privacy-aware */}
      <g stroke={accent} strokeWidth="1.2" fill="none" opacity="0.9">
        <circle cx="55" cy="14" r="3" fill={accent} />
        <line x1="55" y1="17" x2="55" y2="32" />
        <line x1="55" y1="22" x2="47" y2="28" />
        <line x1="55" y1="22" x2="63" y2="28" />
        <line x1="55" y1="32" x2="48" y2="42" />
        <line x1="55" y1="32" x2="62" y2="42" />
      </g>
      {/* Joint dots */}
      {[
        [55, 14],
        [55, 22],
        [47, 28],
        [63, 28],
        [55, 32],
        [48, 42],
        [62, 42],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.2" fill="#fff" />
      ))}
      {/* Privacy face blur indicator */}
      <rect x="49" y="9" width="12" height="6" rx="2" fill={accent} opacity="0.3" />
    </svg>
  );
}

function DensityMeter() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="rounded-xl border border-white/8 bg-white/[0.025] p-2 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-mono uppercase tracking-[0.18em] text-soft-mute">
          Density
        </span>
        <span className="text-[9px] font-semibold text-amber-300">0.84</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "84%" }}
          transition={{ duration: 1.2, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #4FD1FF 0%, #FBBF24 100%)",
            boxShadow: "0 0 8px rgba(251,191,36,0.5)",
          }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[8px] text-soft-mute">
        <span>142/min flow</span>
        <span className="text-amber-300/80">warm</span>
      </div>
    </motion.div>
  );
}

function Timeline() {
  const events = [
    { time: "12:38", label: "Entry", tone: "muted" },
    { time: "12:41", label: "Dwell", tone: "warn" },
    { time: "12:43", label: "Exit", tone: "muted" },
  ];
  return (
    <div className="mt-2 border-t border-white/8 pt-2">
      <div className="text-[8px] font-medium uppercase tracking-[0.18em] text-soft-mute">
        Event timeline
      </div>
      <div className="mt-1.5 flex items-center gap-1">
        {events.map((e, i) => {
          const tone =
            e.tone === "warn"
              ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
              : "border-white/10 bg-white/[0.03] text-soft-gray";
          return (
            <motion.div
              key={`${e.time}-${i}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.1, duration: 0.4 }}
              className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[8px] font-medium ${tone}`}
            >
              <span className="font-mono">{e.time}</span>
              <span>·</span>
              <span>{e.label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

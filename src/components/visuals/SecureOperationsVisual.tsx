"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Premium privacy-aware operations console — replaces the bare crowd
 * heatmap on the SecureVision card. Designed as a dense product moment:
 *
 *   ┌─────────────────────────┬─────────────┐
 *   │  Floor plan with        │  Camera     │
 *   │  animated skeleton-only    │  thumbs (3) │
 *   │  people + heat zones    │             │
 *   ├─────────────────────────┴─────────────┤
 *   │  Event timeline strip                  │
 *   └────────────────────────────────────────┘
 *
 * Sits inside the 288px-tall card visual area (top 12px reserved for
 * the existing pill badges on the parent card).
 */
export function SecureOperationsVisual() {
  const visualRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(visualRef, { once: true, margin: "-12% 0px" });
  const reduceMotion = Boolean(useReducedMotion());
  const show = isInView || reduceMotion;

  return (
    <div
      ref={visualRef}
      className="vector-console absolute inset-0 flex items-center justify-center overflow-hidden px-4 pb-4 pt-[4.25rem] sm:px-5"
    >
      <div className="grid w-[calc(100%+2rem)] min-w-[330px] max-w-[525px] grid-cols-[1.58fr_1fr] gap-3">
        {/* ─────────── LEFT: Floor plan ─────────── */}
        <Card
          label="Atrium · West wing"
          show={show}
          reduceMotion={reduceMotion}
          right={
            <motion.div
              initial={false}
              animate={show ? { opacity: 1 } : { opacity: 0 }}
              transition={{
                delay: reduceMotion ? 0 : 0.35,
                duration: reduceMotion ? 0 : 0.45,
              }}
              className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[8.5px] font-semibold text-emerald-300"
            >
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              PrivacyGuard
            </motion.div>
          }
        >
          <div className="relative h-[164px]">
            <FloorPlan show={show} reduceMotion={reduceMotion} />
          </div>
          <Timeline show={show} reduceMotion={reduceMotion} />
        </Card>

        {/* ─────────── RIGHT: Camera feeds + density meter ─────────── */}
        <div className="flex flex-col gap-2">
          <CameraFeed
            cam="CAM 04"
            status="normal"
            delay={0.2}
            show={show}
            reduceMotion={reduceMotion}
          />
          <CameraFeed
            cam="CAM 07"
            status="alert"
            delay={0.35}
            show={show}
            reduceMotion={reduceMotion}
          />
          <DensityMeter show={show} reduceMotion={reduceMotion} />
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
  show,
  reduceMotion,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  show: boolean;
  reduceMotion: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-royal-300/90">
          {label}
        </span>
        {right ?? (
          <motion.span
            initial={false}
            animate={show ? { opacity: 1 } : { opacity: 0 }}
            transition={{
              delay: reduceMotion ? 0 : 0.35,
              duration: reduceMotion ? 0 : 0.45,
            }}
            className="flex items-center gap-1 text-[8.5px] font-mono text-soft-mute"
          >
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            live
          </motion.span>
        )}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function FloorPlan({
  show,
  reduceMotion,
}: {
  show: boolean;
  reduceMotion: boolean;
}) {
  // Walking-person waypoints — each "person" animates between two points.
  const people: Array<{ from: [number, number]; to: [number, number]; delay: number; color: string }> = [
    { from: [20, 60], to: [180, 50], delay: 0.4, color: "var(--vc-blue)" },
    { from: [220, 90], to: [60, 100], delay: 0.8, color: "var(--vc-blue)" },
    { from: [120, 20], to: [120, 120], delay: 1.0, color: "var(--vc-amber)" },
    { from: [180, 110], to: [40, 30], delay: 0.6, color: "var(--vc-blue)" },
  ];

  return (
    <svg viewBox="0 0 260 140" className="h-full w-full">
      <defs>
        <radialGradient id="floor-bg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="var(--vc-blue-deep)" stopOpacity="0.24" />
          <stop offset="100%" stopColor="var(--vc-navy)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="zone-warm" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--vc-amber)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--vc-amber)" stopOpacity="0" />
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
        initial={false}
        animate={{ opacity: show ? 0.9 : 0 }}
        transition={{
          delay: reduceMotion ? 0 : 0.4,
          duration: reduceMotion ? 0 : 0.8,
        }}
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
          initial={false}
          animate={{ opacity: show ? 1 : 0 }}
          transition={{
            delay: reduceMotion ? 0 : 0.3 + i * 0.08,
            duration: reduceMotion ? 0 : 0.4,
          }}
        >
          <circle cx={cx} cy={cy} r="3" fill="var(--vc-blue)" />
          <circle cx={cx} cy={cy} r="6" stroke="var(--vc-blue)" strokeOpacity="0.45" fill="none" />
        </motion.g>
      ))}

      {/* Animated people — non-identifying dots */}
      {people.map((p, i) => (
        <motion.g
          key={`p-${i}`}
          initial={false}
          animate={{ opacity: show ? 1 : 0 }}
          transition={{
            delay: reduceMotion ? 0 : p.delay,
            duration: reduceMotion ? 0 : 0.4,
          }}
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
            initial={false}
            animate={
              show && !reduceMotion
                ? { cx: p.to[0], cy: p.to[1] }
                : { cx: p.from[0], cy: p.from[1] }
            }
            transition={{
              duration: reduceMotion ? 0 : 1.8,
              delay: reduceMotion ? 0 : p.delay + 0.35,
              ease: "linear",
            }}
            style={{ filter: `drop-shadow(0 0 3px ${p.color})` }}
          />
        </motion.g>
      ))}

      {/* Alert tag */}
      <motion.g
        initial={false}
        animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
        transition={{
          delay: reduceMotion ? 0 : 1.05,
          duration: reduceMotion ? 0 : 0.4,
        }}
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
        <motion.circle
          cx="178"
          cy="55"
          r="2.5"
          fill="var(--vc-amber)"
          initial={false}
          animate={
            show && !reduceMotion
              ? { opacity: [0.45, 1, 0.75], scale: [1, 1.55, 1] }
              : { opacity: 0.8, scale: 1 }
          }
          transition={{
            delay: reduceMotion ? 0 : 1.2,
            duration: reduceMotion ? 0 : 0.9,
            times: [0, 0.45, 1],
          }}
        />
        <text x="184" y="58" fontSize="8" fill="var(--vc-amber)" fontFamily="ui-monospace, monospace" letterSpacing="1">
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
  show,
  reduceMotion,
}: {
  cam: string;
  status: "normal" | "alert";
  delay?: number;
  show: boolean;
  reduceMotion: boolean;
}) {
  const color = status === "alert" ? "amber" : "emerald";
  const ring =
    status === "alert"
      ? "border-amber-400/40"
      : "border-white/8";
  return (
    <motion.div
      initial={false}
      animate={show ? { opacity: 1, x: 0 } : { opacity: 0, x: 8 }}
      transition={{
        delay: reduceMotion ? 0 : delay,
        duration: reduceMotion ? 0 : 0.5,
      }}
      className={`relative overflow-hidden rounded-xl border ${ring} bg-white/[0.04] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[8.5px] font-mono uppercase tracking-[0.18em] text-soft-mute">
          {cam}
        </span>
        <span
          className={`flex items-center gap-1 text-[8px] font-semibold ${
            color === "amber" ? "text-amber-300" : "text-emerald-300"
          }`}
        >
          <motion.span
            initial={false}
            animate={
              status === "alert" && show && !reduceMotion
                ? { scale: [1, 1.9, 1], opacity: [0.7, 1, 0.8] }
                : { scale: 1, opacity: show ? 1 : 0 }
            }
            transition={{
              delay: reduceMotion ? 0 : delay + 0.45,
              duration: reduceMotion ? 0 : 0.85,
              times: [0, 0.4, 1],
            }}
            className={`h-1 w-1 rounded-full ${
              color === "amber" ? "bg-amber-400" : "bg-emerald-400"
            }`}
          />
          {status === "alert" ? "Anomaly" : "Normal"}
        </span>
      </div>
      <div className="mt-1.5">
        <CameraMiniSilhouette
          accent={status === "alert" ? "var(--vc-amber)" : "var(--vc-blue)"}
          idKey={status === "alert" ? "alert" : "normal"}
        />
      </div>
    </motion.div>
  );
}

/**
 * `idKey` names the gradient, `accent` colours it. They are separate because
 * the id used to be built from the colour, which worked only while the colour
 * was a hex literal — once it became `var(--vc-amber)` the id contained
 * brackets and `url(#…)` could not resolve it, so the tile lost its wash.
 */
function CameraMiniSilhouette({
  accent,
  idKey,
}: {
  accent: string;
  idKey: string;
}) {
  return (
    <svg viewBox="0 0 110 50" className="h-9 w-full">
      <defs>
        <radialGradient id={`cam-bg-${idKey}`} cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.12" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="110" height="50" fill={`url(#cam-bg-${idKey})`} />
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
        <circle key={i} cx={x} cy={y} r="1.2" fill="var(--vc-paper)" />
      ))}
      {/* Privacy face blur indicator */}
      <rect x="49" y="9" width="12" height="6" rx="2" fill={accent} opacity="0.3" />
    </svg>
  );
}

function DensityMeter({
  show,
  reduceMotion,
}: {
  show: boolean;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      initial={false}
      animate={show ? { opacity: 1, x: 0 } : { opacity: 0, x: 8 }}
      transition={{
        delay: reduceMotion ? 0 : 0.5,
        duration: reduceMotion ? 0 : 0.5,
      }}
      className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[8.5px] font-mono uppercase tracking-[0.18em] text-soft-mute">
          Density
        </span>
        <span className="text-[9px] font-semibold text-amber-300">0.84</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={false}
          animate={{ width: show ? "84%" : "0%" }}
          transition={{
            duration: reduceMotion ? 0 : 1.2,
            delay: reduceMotion ? 0 : 0.7,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, var(--vc-blue) 0%, var(--vc-amber) 100%)",
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

function Timeline({
  show,
  reduceMotion,
}: {
  show: boolean;
  reduceMotion: boolean;
}) {
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
              initial={false}
              animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
              transition={{
                delay: reduceMotion ? 0 : 0.9 + i * 0.1,
                duration: reduceMotion ? 0 : 0.4,
              }}
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

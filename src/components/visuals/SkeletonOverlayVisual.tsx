"use client";

import { motion } from "framer-motion";

/**
 * Animated pose-estimation skeleton overlay — used in the MobilityCare
 * showcase and the AI pipeline section. Conveys "video-in → skeleton-out".
 */
export function SkeletonOverlayVisual({
  accent = "#0FA3B1",
}: {
  accent?: string;
}) {
  return (
    <svg viewBox="0 0 320 240" className="h-full w-full">
      <defs>
        <radialGradient id="skel-glow" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="skel-line" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor="#4FD1FF" />
        </linearGradient>
      </defs>

      <rect width="320" height="240" fill="url(#skel-glow)" />

      {/* faint grid (camera frame) */}
      <g stroke="rgba(148,163,184,0.08)" strokeWidth="0.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`v-${i}`} x1={i * 40} y1="0" x2={i * 40} y2="240" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`h-${i}`} x1="0" y1={i * 40} x2="320" y2={i * 40} />
        ))}
      </g>

      {/* hip / shoulder body box (faint) */}
      <rect
        x="125"
        y="60"
        width="70"
        height="150"
        rx="4"
        stroke="rgba(148,163,184,0.18)"
        strokeDasharray="3 3"
        fill="none"
      />

      {/* Skeleton */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Bones */}
        <Bone d="M160 75 L160 105" delay={0.0} accent={accent} />
        <Bone d="M160 105 L160 145" delay={0.1} accent={accent} />
        <Bone d="M160 105 L135 130" delay={0.2} accent={accent} />
        <Bone d="M160 105 L185 130" delay={0.2} accent={accent} />
        <Bone d="M135 130 L120 155" delay={0.3} accent={accent} />
        <Bone d="M185 130 L200 155" delay={0.3} accent={accent} />
        <Bone d="M160 145 L142 178" delay={0.4} accent={accent} />
        <Bone d="M160 145 L178 178" delay={0.4} accent={accent} />
        <Bone d="M142 178 L130 215" delay={0.5} accent={accent} />
        <Bone d="M178 178 L190 215" delay={0.5} accent={accent} />

        {/* Joints */}
        {[
          [160, 75],
          [160, 105],
          [135, 130],
          [185, 130],
          [120, 155],
          [200, 155],
          [160, 145],
          [142, 178],
          [178, 178],
          [130, 215],
          [190, 215],
        ].map(([x, y], i) => (
          <Joint key={i} x={x} y={y} delay={0.05 * i} accent={accent} />
        ))}

        {/* Head */}
        <motion.circle
          cx="160"
          cy="62"
          r="11"
          fill="none"
          stroke={accent}
          strokeWidth="2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        />
      </motion.g>

      {/* HUD labels */}
      <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
        <text x="14" y="22" fontSize="9" fill="#94A3B8" letterSpacing="2">
          POSE · 17/17 KP
        </text>
        <text x="14" y="36" fontSize="9" fill={accent} letterSpacing="2">
          CONF · 0.97
        </text>
        <text x="220" y="22" fontSize="9" fill="#94A3B8" letterSpacing="2">
          GAIT · CYCLE 1.04s
        </text>
        <text x="220" y="36" fontSize="9" fill={accent} letterSpacing="2">
          CADENCE · 112
        </text>
      </g>
    </svg>
  );
}

function Bone({
  d,
  delay,
  accent,
}: {
  d: string;
  delay: number;
  accent: string;
}) {
  return (
    <motion.path
      d={d}
      stroke="url(#skel-line)"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 + delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ filter: `drop-shadow(0 0 4px ${accent}80)` }}
    />
  );
}

function Joint({
  x,
  y,
  delay,
  accent,
}: {
  x: number;
  y: number;
  delay: number;
  accent: string;
}) {
  return (
    <motion.circle
      cx={x}
      cy={y}
      r="3"
      fill="#fff"
      stroke={accent}
      strokeWidth="1.2"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 + delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ filter: `drop-shadow(0 0 4px ${accent})` }}
    />
  );
}

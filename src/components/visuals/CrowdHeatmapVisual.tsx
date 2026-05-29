"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

/**
 * Crowd density heatmap with flow arrows and an evolving hotspot.
 * Used in the SecureVision flagship section and CrowdSense product card.
 */
export function CrowdHeatmapVisual() {
  const cells = useMemo(
    () =>
      Array.from({ length: 12 * 8 }).map((_, i) => {
        const cx = (i % 12) * 26 + 13;
        const cy = Math.floor(i / 12) * 26 + 13;
        // Hot spot near center-right
        const d = Math.hypot(cx - 220, cy - 120);
        const intensity = Math.max(0, 1 - d / 130);
        return { cx, cy, intensity };
      }),
    []
  );

  return (
    <svg viewBox="0 0 320 220" className="h-full w-full">
      <defs>
        <radialGradient id="crowd-bg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#2D6CDF" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0B1F3A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hot" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id="warm" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#4FD1FF" />
          <stop offset="100%" stopColor="#2D6CDF" />
        </linearGradient>
      </defs>

      <rect width="320" height="220" fill="url(#crowd-bg)" />

      {/* Floor plan outline */}
      <rect
        x="14"
        y="14"
        width="292"
        height="192"
        rx="6"
        stroke="rgba(148,163,184,0.18)"
        strokeDasharray="4 4"
        fill="none"
      />

      {/* Doorway markers */}
      <rect x="10" y="100" width="8" height="22" fill="rgba(148,163,184,0.3)" />
      <rect x="302" y="100" width="8" height="22" fill="rgba(148,163,184,0.3)" />

      {/* Heat cells */}
      <g>
        {cells.map((c, i) => {
          if (c.intensity < 0.05) return null;
          const fill = c.intensity > 0.55 ? "url(#hot)" : "url(#warm)";
          return (
            <motion.circle
              key={i}
              cx={c.cx}
              cy={c.cy}
              r={c.intensity * 16 + 4}
              fill={fill}
              opacity={c.intensity * 0.7}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: c.intensity * 0.7, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.02 * i,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{ filter: "blur(6px)" }}
            />
          );
        })}
      </g>

      {/* Flow direction arrows */}
      {[
        { from: [30, 110], to: [120, 100] },
        { from: [120, 100], to: [200, 115] },
        { from: [60, 170], to: [180, 150] },
        { from: [280, 60], to: [220, 95] },
      ].map((a, i) => (
        <FlowArrow key={i} from={a.from as [number, number]} to={a.to as [number, number]} delay={0.6 + i * 0.15} />
      ))}

      {/* Hotspot label */}
      <motion.g
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <rect
          x="195"
          y="92"
          width="80"
          height="26"
          rx="6"
          fill="rgba(0,0,0,0.7)"
          stroke="rgba(245,158,11,0.5)"
        />
        <circle cx="206" cy="105" r="3" fill="#FBBF24">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" repeatCount="indefinite" />
        </circle>
        <text x="215" y="103" fontSize="8.5" fill="#FBBF24" fontFamily="ui-monospace, monospace" letterSpacing="1">
          DENSITY
        </text>
        <text x="215" y="113" fontSize="9" fill="#fff" fontWeight="600" fontFamily="ui-monospace, monospace">
          0.84
        </text>
      </motion.g>

      {/* HUD */}
      <g fontFamily="ui-monospace, monospace" letterSpacing="1.5">
        <text x="22" y="36" fontSize="9" fill="#94A3B8">
          CAM · WEST WING
        </text>
        <text x="22" y="50" fontSize="9" fill="#4FD1FF">
          FLOW · 142/MIN
        </text>
      </g>
      <g fontFamily="ui-monospace, monospace" letterSpacing="1.5">
        <text x="222" y="200" fontSize="9" fill="#94A3B8">
          12:41:38 LIVE
        </text>
        <circle cx="218" cy="197" r="2.5" fill="#10B981">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}

function FlowArrow({
  from,
  to,
  delay,
}: {
  from: [number, number];
  to: [number, number];
  delay: number;
}) {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const ax = to[0] - Math.cos(angle) * 6;
  const ay = to[1] - Math.sin(angle) * 6;
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.6 }}
    >
      <line
        x1={from[0]}
        y1={from[1]}
        x2={to[0]}
        y2={to[1]}
        stroke="#4FD1FF"
        strokeWidth="1.5"
        strokeDasharray="2 3"
        opacity="0.85"
      />
      <polygon
        points={`${to[0]},${to[1]} ${ax - Math.sin(angle) * 3},${ay + Math.cos(angle) * 3} ${ax + Math.sin(angle) * 3},${ay - Math.cos(angle) * 3}`}
        fill="#4FD1FF"
      />
    </motion.g>
  );
}

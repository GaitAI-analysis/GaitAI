"use client";

import { motion } from "framer-motion";

/**
 * Running motion trail — a stride-pattern visual used for SportsMotion.
 * Shows two strides with asymmetry markers.
 */
export function RunningTrailVisual() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full">
      <defs>
        <linearGradient id="trail-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#4FD1FF" stopOpacity="0" />
          <stop offset="50%" stopColor="#4FD1FF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#2563FF" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="trail-bg" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#4FD1FF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#0B1F3A" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="320" height="200" fill="url(#trail-bg)" />

      {/* Ground line */}
      <line
        x1="0"
        y1="170"
        x2="320"
        y2="170"
        stroke="rgba(148,163,184,0.25)"
        strokeDasharray="3 6"
      />

      {/* Stride arcs - left foot */}
      {[
        { x: 40, y: 170, d: 0 },
        { x: 110, y: 170, d: 0.2 },
        { x: 180, y: 170, d: 0.4 },
        { x: 250, y: 170, d: 0.6 },
      ].map((s, i) => (
        <motion.path
          key={`l${i}`}
          d={`M ${s.x} ${s.y} Q ${s.x + 30} ${s.y - 50}, ${s.x + 60} ${s.y}`}
          fill="none"
          stroke="url(#trail-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.8,
            delay: s.d,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}

      {/* Footprints */}
      {[40, 100, 160, 220, 280].map((x, i) => (
        <motion.g
          key={`f${i}`}
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
        >
          <ellipse
            cx={x}
            cy={170}
            rx="9"
            ry="3"
            fill={i % 2 === 0 ? "#4FD1FF" : "#FBBF24"}
            opacity={0.4 + (i / 10) * 0.6}
          />
        </motion.g>
      ))}

      {/* Asymmetry indicator */}
      <motion.g
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1.0, duration: 0.6 }}
      >
        <rect
          x="190"
          y="30"
          width="110"
          height="38"
          rx="8"
          fill="rgba(0,0,0,0.5)"
          stroke="rgba(79,209,255,0.4)"
        />
        <text x="200" y="46" fontSize="9" fill="#94A3B8" fontFamily="ui-monospace, monospace" letterSpacing="1.5">
          ASYMMETRY
        </text>
        <text x="200" y="60" fontSize="11" fill="#FBBF24" fontWeight="600" fontFamily="ui-monospace, monospace">
          L 47% · R 53%
        </text>
      </motion.g>

      {/* HUD */}
      <g fontFamily="ui-monospace, monospace" letterSpacing="1.5">
        <text x="20" y="30" fontSize="9" fill="#94A3B8">
          RUN · 4:32/km
        </text>
        <text x="20" y="44" fontSize="9" fill="#4FD1FF">
          CADENCE · 178
        </text>
      </g>
    </svg>
  );
}

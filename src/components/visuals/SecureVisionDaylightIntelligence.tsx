import type { CSSProperties } from "react";
import styles from "./SecureVisionDaylightIntelligence.module.css";

/**
 * THE DAYLIGHT INTELLIGENCE LAYER — the night hero's HUD, translated to day.
 * =============================================================================
 * The night film carries its own control-room HUD baked into the pixels: a
 * tracked subject in a box wired to a large analytics panel on the right,
 * zone and density readouts across the top, an amber anomaly card at the
 * bottom, dotted trajectories on the floor, skeletons on the walkers. The
 * daylight film is a clean plate — a bright concourse and nothing drawn on it
 * — so in light mode THIS layer draws the same HUD: the same parts in the
 * same places with the same hierarchy, re-inked for paper. Frosted white
 * panels, deep-navy type, royal and cyan graphics, restrained amber for the
 * warning. Switching the theme over the hero should read as the lights in the
 * building changing from night to day, not as a different page.
 *
 * WHAT IS WHERE, and why (units of the 1600×900 film frame):
 *   analytics panel   x 1262–1572, y 287–864 — the night panel's band and
 *                     right edge; narrower, because the daylight plate's
 *                     subject walks where the night panel's left half was.
 *   tracked subject   the traveller, box + corner ticks + track tag, with a
 *                     connector into the panel at the night HUD's height.
 *   second track      the man in the suit mid-frame; the anomaly is his.
 *   anomaly card      x 747–967, y 706–811 — where the night card sits.
 *   zone / density    top band, as in the night HUD, kept clear of heads.
 *   trajectories      dotted royal paths on the floor, one per track, plus
 *                     two ambient flow lines and the flow ribbon.
 *   privacy           face-blur indicator on a distant figure, and the
 *                     PRIVACY MODE line the panel ends with.
 *
 * ANCHORED TO THE FILM, NOT THE VIEWPORT. On desktop the film is `object-fit:
 * contain`, so the desktop SVG uses `xMidYMid meet`: same letterboxing,
 * same centre, same scale, at every width. Below 1024px the film is `cover`
 * and the phone SVG uses `slice`. One drawing, two viewports: the HUD is
 * defined once in <defs> and each SVG shows it with <use>; the phone copy
 * inherits `--hud-desktop-only: none` and keeps only the subject and the
 * flow. Every anchor lives in WALKERS and SCENE — when the commissioned
 * daylight film replaces the interim plate, re-read three frames and move
 * these numbers; nothing else knows where a person stands.
 *
 * MOTION is slow and small (the module CSS): trails draw, dots step along
 * them, the ribbon drifts, the anomaly ring breathes, the sparkline redraws.
 * `prefers-reduced-motion` holds everything still. The layer is decorative:
 * `pointer-events: none`, `aria-hidden`; the copy carries the meaning and the
 * night film's own labels say the same things.
 */

type Joint = readonly [number, number];

interface Walker {
  readonly id: string;
  readonly delay: string;
  /** Stroke scale: far walkers thinner. */
  readonly scale: number;
  /** 13 joints: head, neck, shoulders (L,R), elbows (L,R), wrists (L,R), hip, knees (L,R), ankles (L,R). */
  readonly joints: readonly Joint[];
  /** The floor trajectory that brought this walker here. */
  readonly trail: string;
  /** Detection region [x, y, w, h] and its tag; omitted where a panel covers the walker. */
  readonly box?: readonly [number, number, number, number];
  readonly tag?: string;
}

/* The interim plate, read off its first frame: a traveller with a case at the
   right third walking towards camera (the film's subject), a man in a suit
   walking away mid-frame, a woman with a backpack walking away far right.
   Coordinates in the 1600×900 frame; the film's parallax is ±1.4%, so a
   joint drifts at most ~9 units over the loop — under the hairline scale. */
const WALKERS: readonly Walker[] = [
  {
    id: "subject",
    delay: "0s",
    scale: 1,
    joints: [
      [1100, 232], [1100, 288], [1045, 326], [1155, 326], [1025, 438], [1175, 438],
      [1012, 512], [1195, 512], [1100, 476], [1070, 612], [1130, 612], [1075, 748], [1130, 744],
    ],
    trail: "M1104 756 C1122 700 1150 630 1198 566",
    box: [996, 206, 212, 566],
    tag: "TRACK 01 · GAI-7X92 · 98.7%",
  },
  {
    id: "mid",
    delay: "-1.4s",
    scale: 0.66,
    joints: [
      [930, 370], [930, 400], [900, 420], [960, 420], [880, 475], [980, 475],
      [870, 520], [995, 512], [930, 512], [915, 562], [950, 562], [915, 612], [955, 612],
    ],
    trail: "M700 800 C780 730 860 662 930 616",
    box: [858, 352, 148, 274],
    tag: "TRACK 02 · 96.1%",
  },
  {
    /* Under the analytics panel on desktop, as the night crowd is under its
       panel; drawn for the phone, where the panel is not shown. */
    id: "far",
    delay: "-2.6s",
    scale: 0.56,
    joints: [
      [1475, 338], [1475, 375], [1445, 395], [1505, 395], [1430, 450], [1520, 450],
      [1425, 495], [1530, 490], [1475, 500], [1460, 555], [1490, 555], [1460, 612], [1495, 610],
    ],
    trail: "M1590 830 C1550 740 1500 660 1476 614",
  },
];

const BONES: readonly (readonly [number, number])[] = [
  [0, 1], [1, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [1, 8], [8, 9], [8, 10], [9, 11], [10, 12],
];

const PANEL = { x: 1262, y: 287, w: 310, h: 577, r: 14 } as const;

const SCENE = {
  /* The main walking line of the concourse, far gates to foreground right. */
  flow: "M1150 500 C1200 620 1260 740 1360 880",
  /* Two ambient trajectories — other people's paths, as the night floor has. */
  ambient: [
    "M540 880 C640 780 760 700 880 640",
    "M1320 560 C1290 640 1250 720 1180 820",
  ],
  /* The connector from the tracked subject into the panel, at the night HUD's height. */
  connector: { y: 486 },
  /* Zone and density readouts across the top band. */
  tags: [
    /* The night HUD's flow readout sits under the headline, where its white
       type hides it; on paper it would collide with the navy headline, so it
       moves to the clear top band right of "Privacy-aware". */
    { id: "flow", x: 700, y: 52, w: 178, text: "FLOW DIRECTION · 142 /MIN", chevrons: true },
    { id: "density", x: 1222, y: 50, w: 118, text: "DENSITY 0.84", chevrons: true },
    { id: "zoneA", x: 1188, y: 122, w: 152, text: "ZONE A · DENSITY 0.72" },
    { id: "zoneB", x: 856, y: 244, w: 152, text: "ZONE B · DENSITY 0.75" },
  ],
  /* The anomaly: the night card's place; the ring sits on the mid walker's line. */
  anomaly: { card: { x: 747, y: 706, w: 220, h: 105 }, ring: { cx: 862, cy: 648, r: 22 } },
  /* Face-blur indicator on a distant figure, clear of the panel. */
  privacy: { cx: 1228, cy: 432, r: 11, label: "FACE BLUR · ON" },
  /* Movement-trajectory sparklines for the panel, in panel-local units. */
  spark: {
    cyan: "M0 46 L14 40 L28 44 L42 34 L56 38 L70 30 L84 36 L98 26 L112 32 L126 22 L140 28 L154 20 L168 24 L182 14 L196 20 L210 12 L224 16 L238 8 L252 14 L266 6",
    royal: "M0 50 L14 48 L28 42 L42 46 L56 40 L70 44 L84 38 L98 42 L112 34 L126 38 L140 30 L154 34 L168 28 L182 30 L196 24 L210 28 L224 20 L238 24 L252 18 L266 20",
  },
} as const;

const METRICS = [
  { label: "CROWD DENSITY", value: "0.84" },
  { label: "FLOW RATE", value: "142 /min" },
  { label: "ANOMALOUS MOVEMENT", value: "DETECTED", tone: "amber" },
  { label: "SAFETY EVENT", value: "REVIEW", tone: "amber" },
  { label: "PRIVACY MODE", value: "ON", tone: "green" },
] as const;

function skeletonPath(joints: readonly Joint[]): string {
  return BONES.map(([a, b]) => `M${joints[a][0]} ${joints[a][1]}L${joints[b][0]} ${joints[b][1]}`).join("");
}

/** Corner ticks for a detection region: four L-shaped marks, `len` long. */
function cornerTicks([x, y, w, h]: readonly [number, number, number, number], len: number): string {
  const x2 = x + w;
  const y2 = y + h;
  return [
    `M${x} ${y + len}V${y}H${x + len}`,
    `M${x2 - len} ${y}H${x2}V${y + len}`,
    `M${x2} ${y2 - len}V${y2}H${x2 - len}`,
    `M${x + len} ${y2}H${x}V${y2 - len}`,
  ].join("");
}

/** The subject's skeleton scaled into a small figure for the panel's GAIT SIGNATURE. */
function miniFigure(joints: readonly Joint[], x: number, y: number, h: number): string {
  const ys = joints.map((j) => j[1]);
  const xs = joints.map((j) => j[0]);
  const top = Math.min(...ys);
  const s = h / (Math.max(...ys) - top);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const t = (j: Joint): Joint => [x + (j[0] - cx) * s, y + (j[1] - top) * s];
  return skeletonPath(joints.map(t));
}

function Hud() {
  const subject = WALKERS[0];
  const p = PANEL;
  const anomaly = SCENE.anomaly;
  return (
    <g id="sv-daylight-hud" className={styles.hud}>
      {/* ── Floor: trajectories, ambient paths, the flow ribbon ── */}
      <g className={styles.desktopOnly}>
        {SCENE.ambient.map((d, i) => (
          <path key={i} className={styles.ambient} d={d} pathLength="1" style={{ "--i": i } as CSSProperties} />
        ))}
      </g>
      <g className={styles.flow}>
        <path className={styles.flowRibbon} d={SCENE.flow} pathLength="1" />
        <path className={styles.flowCore} d={SCENE.flow} pathLength="1" />
        {[0, 1, 2].map((i) => (
          <circle key={i} className={styles.flowDot} r="3.2">
            <animateMotion dur="14s" repeatCount="indefinite" begin={`${-i * 4.7}s`} path={SCENE.flow} />
          </circle>
        ))}
      </g>
      <g className={`${styles.trails} ${styles.desktopOnly}`}>
        {WALKERS.map((w) => (
          <g key={w.id} style={{ "--delay": w.delay } as CSSProperties}>
            <path className={styles.trail} d={w.trail} pathLength="1" />
            <circle className={styles.trailDot} r={2.4 * w.scale + 1}>
              <animateMotion dur="9s" repeatCount="indefinite" begin={w.delay} path={w.trail} />
            </circle>
          </g>
        ))}
      </g>

      {/* ── Detection regions with corner ticks and track tags ── */}
      <g className={styles.tracks}>
        {WALKERS.filter((w) => w.box).map((w) => {
          const box = w.box!;
          const desktopOnly = w.id !== "subject";
          return (
            <g key={w.id} className={desktopOnly ? styles.desktopOnly : undefined} data-track={w.id}>
              <rect className={styles.region} x={box[0]} y={box[1]} width={box[2]} height={box[3]} rx="6" />
              <path className={styles.ticks} d={cornerTicks(box, 16)} />
              {w.tag && (
                <g className={styles.desktopOnly} transform={`translate(${box[0]} ${box[1] - 14})`}>
                  <rect className={styles.tagGlass} x="0" y="-14" width={w.tag.length * 7.2 + 18} height="24" rx="12" />
                  <text className={styles.tag} x="9" y="3">{w.tag}</text>
                </g>
              )}
            </g>
          );
        })}
        {/* The connector from the subject's region into the panel. */}
        <g className={styles.desktopOnly}>
          <line className={styles.connector} x1={subject.box![0] + subject.box![2]} y1={SCENE.connector.y} x2={p.x} y2={SCENE.connector.y} />
          <circle className={styles.connectorDot} cx={subject.box![0] + subject.box![2]} cy={SCENE.connector.y} r="4" />
          <circle className={styles.connectorDot} cx={p.x} cy={SCENE.connector.y} r="4" />
        </g>
      </g>

      {/* ── Skeletons: hairline bones, small joints ── */}
      <g className={styles.skeletons}>
        {WALKERS.map((w) => (
          <g
            key={w.id}
            className={`${styles.skeleton} ${w.id === "subject" ? "" : styles.desktopOnly}`}
            style={{ "--delay": w.delay, "--scale": w.scale } as CSSProperties}
            data-walker={w.id}
          >
            <path className={styles.bones} d={skeletonPath(w.joints)} />
            {w.joints.map(([x, y], i) => (
              <circle key={i} className={styles.joint} cx={x} cy={y} r={1.9 * w.scale + 0.9} />
            ))}
          </g>
        ))}
      </g>

      {/* ── Zone and density readouts across the top ── */}
      <g className={styles.desktopOnly}>
        {SCENE.tags.map((t) => (
          <g key={t.id} transform={`translate(${t.x} ${t.y})`}>
            <rect className={styles.tagGlass} x="0" y="0" width={t.w} height="26" rx="13" />
            <text className={styles.tag} x="10" y="17">{t.text}</text>
            {"chevrons" in t && t.chevrons && (
              <path className={styles.chevrons} d={`M${t.w + 8} 8l5 5-5 5M${t.w + 16} 8l5 5-5 5M${t.w + 24} 8l5 5-5 5`} />
            )}
          </g>
        ))}
      </g>

      {/* ── The anomaly: ring on the floor, card where the night card sits ── */}
      <g className={styles.desktopOnly}>
        <g className={styles.anomaly} transform={`translate(${anomaly.ring.cx} ${anomaly.ring.cy})`}>
          <circle className={styles.anomalyRing} r={anomaly.ring.r} />
          <circle className={styles.anomalyPulse} r={anomaly.ring.r} />
          <circle className={styles.anomalyDot} r="2.6" />
        </g>
        <line className={styles.anomalyLead} x1={anomaly.ring.cx} y1={anomaly.ring.cy + anomaly.ring.r} x2={anomaly.card.x + 24} y2={anomaly.card.y} />
        <g transform={`translate(${anomaly.card.x} ${anomaly.card.y})`}>
          <rect className={styles.card} x="0" y="0" width={anomaly.card.w} height={anomaly.card.h} rx="12" />
          <rect className={styles.cardAccent} x="0" y="14" width="3" height={anomaly.card.h - 28} rx="1.5" />
          <path className={styles.warnIcon} d="M18 24 L30 44 H6 Z" />
          <rect className={styles.warnIconInk} x="17" y="31" width="2" height="7" rx="1" />
          <circle className={styles.warnIconInk} cx="18" cy="41" r="1.2" />
          <text className={`${styles.cardTitle} ${styles.amber}`} x="40" y="35">ANOMALY DETECTED</text>
          <text className={styles.cardLine} x="16" y="64">DEVIATION 2.60</text>
          <text className={`${styles.cardLine} ${styles.muted}`} x="16" y="90">REVIEW EVENT</text>
        </g>
      </g>

      {/* ── The face-blur indicator on a distant figure ── */}
      <g className={`${styles.privacy} ${styles.desktopOnly}`} transform={`translate(${SCENE.privacy.cx} ${SCENE.privacy.cy})`}>
        <circle className={styles.privacyBlur} r={SCENE.privacy.r} filter="url(#sv-daylight-privacy-blur)" />
        <circle className={styles.privacyRing} r={SCENE.privacy.r + 4} />
        {/* The tag hangs to the LEFT of the figure: the analytics panel begins
            just to its right. */}
        <g transform={`translate(${-(SCENE.privacy.r + 14) - 116} ${SCENE.privacy.r + 26})`}>
          <rect className={styles.tagGlass} x="0" y="-14" width="116" height="24" rx="12" />
          <text className={styles.tag} x="9" y="3">{SCENE.privacy.label}</text>
        </g>
      </g>

      {/* ── The analytics panel: frosted white, navy type, royal graphics ── */}
      <g className={styles.desktopOnly} transform={`translate(${p.x} ${p.y})`}>
        <rect className={styles.panel} x="0" y="0" width={p.w} height={p.h} rx={p.r} filter="url(#sv-daylight-panel-shadow)" />
        <rect className={styles.panelTop} x="18" y="0" width={p.w - 36} height="2" />

        {/* Identity match */}
        <path className={styles.check} d="M18 36 l5 5 9-10" />
        <text className={`${styles.label} ${styles.green}`} x="38" y="41">IDENTITY MATCH</text>
        <text className={styles.id} x="18" y="72">ID: GAI-7X92</text>
        <text className={styles.label} x="18" y="98">MATCH CONFIDENCE</text>
        <text className={styles.confidence} x="18" y="130">98.7%</text>

        {/* Gait signature: the subject's own skeleton, small */}
        <text className={styles.label} x={p.w - 18} y="62" textAnchor="end">GAIT SIGNATURE</text>
        <path className={styles.miniBones} d={miniFigure(subject.joints, p.w - 60, 70, 66)} />
        <line className={styles.miniGround} x1={p.w - 96} y1="140" x2={p.w - 24} y2="140" />

        <line className={styles.rule} x1="18" y1="154" x2={p.w - 18} y2="154" />

        {/* Safety metrics */}
        <text className={styles.label} x="18" y="178">SAFETY METRICS</text>
        {METRICS.map((m, i) => (
          <g key={m.label} transform={`translate(0 ${200 + i * 24})`}>
            <text className={styles.rowLabel} x="18" y="0">{m.label}</text>
            <text className={`${styles.rowValue} ${"tone" in m ? styles[m.tone] : ""}`} x={p.w - 18} y="0" textAnchor="end">{m.value}</text>
          </g>
        ))}

        <line className={styles.rule} x1="18" y1="322" x2={p.w - 18} y2="322" />

        {/* Movement trajectory */}
        <text className={styles.label} x="18" y="346">MOVEMENT TRAJECTORY</text>
        <g transform="translate(22 360)">
          {[0, 1, 2, 3].map((i) => (
            <line key={i} className={styles.grid} x1="0" y1={i * 17} x2="266" y2={i * 17} />
          ))}
          <path className={styles.sparkRoyal} d={SCENE.spark.royal} pathLength="1" />
          <path className={styles.sparkCyan} d={SCENE.spark.cyan} pathLength="1" />
          <circle className={styles.sparkEnd} cx="266" cy="6" r="3" />
        </g>

        <line className={styles.rule} x1="18" y1="436" x2={p.w - 18} y2="436" />

        {/* Time · location · camera */}
        {[
          { x: 18, label: "TIME", value: "12:41:38" },
          { x: 120, label: "LOCATION", value: "West Wing", tone: "royal" },
          { x: 222, label: "CAMERA", value: "CAM · W02" },
        ].map((c) => (
          <g key={c.label} transform={`translate(${c.x} 460)`}>
            <text className={styles.label} x="0" y="0">{c.label}</text>
            <text className={`${styles.rowValue} ${"tone" in c ? styles[c.tone!] : ""}`} x="0" y="22">{c.value}</text>
          </g>
        ))}

        <line className={styles.rule} x1="18" y1="510" x2={p.w - 18} y2="510" />

        {/* Privacy mode */}
        <path className={styles.shield} d="M24 528 l9 4 v9 c0 6-4 10-9 12 c-5-2-9-6-9-12 v-9 z" />
        <text className={`${styles.footer} ${styles.royal}`} x="42" y="546">PRIVACY MODE</text>
        <circle className={styles.liveDot} cx="150" cy="541" r="3" />
        <text className={`${styles.footer} ${styles.royal}`} x="160" y="546">ON</text>
      </g>
    </g>
  );
}

export function SecureVisionDaylightIntelligence({ className }: { className?: string }) {
  return (
    <div className={`${styles.layer} ${className ?? ""}`} aria-hidden="true">
      {/* Desktop: the film is `contain`ed, so `meet` letterboxes identically. */}
      <svg className={`${styles.stage} ${styles.desktop}`} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" focusable="false">
        <defs>
          <filter id="sv-daylight-privacy-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <filter id="sv-daylight-panel-shadow" x="-20%" y="-15%" width="140%" height="140%">
            <feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="#0c2641" floodOpacity="0.12" />
          </filter>
          <Hud />
        </defs>
        <use href="#sv-daylight-hud" />
      </svg>
      {/* Phone: the film is `cover`, so `slice`; the copy inherits the
          desktop-only marks away and keeps the subject and the flow. */}
      <svg className={`${styles.stage} ${styles.phone}`} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" focusable="false">
        <use href="#sv-daylight-hud" />
      </svg>
    </div>
  );
}

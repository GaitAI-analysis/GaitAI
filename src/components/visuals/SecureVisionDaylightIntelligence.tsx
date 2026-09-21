import type { CSSProperties } from "react";
import styles from "./SecureVisionDaylightIntelligence.module.css";

/**
 * THE DAYLIGHT INTELLIGENCE LAYER — a few quiet cues over the light film.
 *
 * The night hero shows SecureVision the way a control room might: boxes,
 * readouts, a HUD. The daylight hero shows it the way the brief asks — a
 * bright civic concourse first, and movement intelligence as a handful of
 * thin marks a careful eye finds: skeleton lines and joint dots on three
 * walkers, their trajectories on the floor, one restrained flow ribbon, one
 * small anomaly cue, one privacy indicator on a distant figure. No tracking
 * boxes, no panels, no glow.
 *
 * ANCHORED TO THE FILM, NOT TO THE VIEWPORT. The SVG shares the film's
 * 16:9 box and `preserveAspectRatio="xMidYMid slice"`, so a mark drawn at
 * (x, y) in this 1600×900 space lands on the same pixel of the footage at
 * every viewport, exactly as `object-fit: cover` places the film. Every
 * anchor lives in `WALKERS` and `SCENE` below — when the commissioned daylight
 * film replaces the interim plate, re-read three frames and move these
 * numbers; nothing else in the layer knows where a person stands.
 *
 * COLOUR. Cyan `#35C8F3` for the live marks, royal `#1b4ed9` for the flow
 * and the anomaly ring, navy `#0b1220` for the two tiny labels, at low
 * opacity throughout. Everything is a hairline: 1.25–1.6 units in a
 * 1600-unit frame.
 *
 * MOTION. Hairlines pulse very slowly, the flow ribbon drifts, the anomaly
 * ring breathes, dots step along the trajectories. Under
 * `prefers-reduced-motion` everything holds still (see the module CSS). The
 * layer itself is `pointer-events: none` and hidden from assistive tech;
 * the hero's copy carries the meaning.
 */

type Joint = readonly [number, number];

interface Walker {
  readonly id: string;
  /** Stride phase offset so the three skeletons never move in lockstep. */
  readonly delay: string;
  /** Stroke scale: far walkers thinner. */
  readonly scale: number;
  /** 13 joints: head, neck, shoulders (L,R), elbows (L,R), wrists (L,R), hip, knees (L,R), ankles (L,R). */
  readonly joints: readonly Joint[];
  /** The floor trajectory that brought this walker here. */
  readonly trail: string;
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
      [1100, 232],
      [1100, 288],
      [1045, 326],
      [1155, 326],
      [1025, 438],
      [1175, 438],
      [1012, 512],
      [1195, 512],
      [1100, 476],
      [1070, 612],
      [1130, 612],
      [1075, 748],
      [1130, 744],
    ],
    trail: "M1104 756 C1122 700 1150 630 1198 566",
  },
  {
    id: "mid",
    delay: "-1.4s",
    scale: 0.66,
    joints: [
      [930, 370],
      [930, 400],
      [900, 420],
      [960, 420],
      [880, 475],
      [980, 475],
      [870, 520],
      [995, 512],
      [930, 512],
      [915, 562],
      [950, 562],
      [915, 612],
      [955, 612],
    ],
    trail: "M700 800 C780 730 860 662 930 616",
  },
  {
    id: "far",
    delay: "-2.6s",
    scale: 0.56,
    joints: [
      [1475, 338],
      [1475, 375],
      [1445, 395],
      [1505, 395],
      [1430, 450],
      [1520, 450],
      [1425, 495],
      [1530, 490],
      [1475, 500],
      [1460, 555],
      [1490, 555],
      [1460, 612],
      [1495, 610],
    ],
    trail: "M1590 830 C1550 740 1500 660 1476 614",
  },
];

const BONES: readonly (readonly [number, number])[] = [
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
];

const SCENE = {
  /* One flow ribbon along the concourse's main walking line, from the far
     gates to the foreground right, drawn as a single soft royal path with
     three drifting dots. */
  flow: "M1150 500 C1200 620 1260 740 1360 880",
  /* The anomaly cue: a small ring on the floor just behind the mid walker —
     where a change of pace or direction would register — with a label that
     sits to its left, clear of the subject. */
  anomaly: {
    cx: 862,
    cy: 648,
    r: 22,
    label: "Movement anomaly · review",
    labelSide: -1,
  },
  /* The privacy indicator sits on a distant figure's head in the far
     concourse: a blurred disc and a two-word tag. Skeleton-only processing;
     no face is read. */
  privacy: {
    cx: 1346,
    cy: 446,
    r: 11,
    label: "Face blur · on",
    /* On a figure in the distant group between the subject and the far
       walker; the tag hangs BELOW the ring, in the clear floor between them. */
    labelBelow: true,
  },
} as const;

function skeletonPath(joints: readonly Joint[]): string {
  return BONES.map(
    ([a, b]) =>
      `M${joints[a][0]} ${joints[a][1]}L${joints[b][0]} ${joints[b][1]}`,
  ).join("");
}

export function SecureVisionDaylightIntelligence({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      className={`${styles.layer} ${className ?? ""}`}
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter
          id="sv-daylight-privacy-blur"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* ── Crowd flow: one ribbon, three drifting dots ── */}
      <g className={styles.flow}>
        <path className={styles.flowRibbon} d={SCENE.flow} pathLength="1" />
        <path className={styles.flowCore} d={SCENE.flow} pathLength="1" />
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            className={styles.flowDot}
            r="3.2"
            style={{ "--i": i } as CSSProperties}
          >
            <animateMotion
              dur="14s"
              repeatCount="indefinite"
              begin={`${-i * 4.7}s`}
              path={SCENE.flow}
            />
          </circle>
        ))}
      </g>

      {/* ── Trajectories on the floor, one per tracked walker ── */}
      <g className={styles.trails}>
        {WALKERS.map((w) => (
          <g key={w.id} style={{ "--delay": w.delay } as CSSProperties}>
            <path className={styles.trail} d={w.trail} pathLength="1" />
            <circle className={styles.trailDot} r={2.4 * w.scale + 1}>
              <animateMotion
                dur="9s"
                repeatCount="indefinite"
                begin={w.delay}
                path={w.trail}
              />
            </circle>
          </g>
        ))}
      </g>

      {/* ── Skeletons: hairline bones, tiny joint dots ── */}
      <g className={styles.skeletons}>
        {WALKERS.map((w) => (
          <g
            key={w.id}
            className={styles.skeleton}
            style={{ "--delay": w.delay, "--scale": w.scale } as CSSProperties}
            data-walker={w.id}
          >
            <path className={styles.bones} d={skeletonPath(w.joints)} />
            {w.joints.map(([x, y], i) => (
              <circle
                key={i}
                className={styles.joint}
                cx={x}
                cy={y}
                r={1.9 * w.scale + 0.9}
              />
            ))}
          </g>
        ))}
      </g>

      {/* ── One anomaly cue ── */}
      <g
        className={styles.anomaly}
        transform={`translate(${SCENE.anomaly.cx} ${SCENE.anomaly.cy})`}
      >
        <circle className={styles.anomalyRing} r={SCENE.anomaly.r} />
        <circle className={styles.anomalyPulse} r={SCENE.anomaly.r} />
        <circle className={styles.anomalyDot} r="2.6" />
        <g
          transform={`translate(${SCENE.anomaly.labelSide * (SCENE.anomaly.r + 14) - (SCENE.anomaly.labelSide < 0 ? 188 : 0)} -4)`}
        >
          <rect
            className={styles.tagGlass}
            x="-8"
            y="-13"
            width="196"
            height="24"
            rx="12"
          />
          <text className={styles.tag} x="4" y="4">
            {SCENE.anomaly.label}
          </text>
        </g>
      </g>

      {/* ── One privacy indicator on a distant figure ── */}
      <g
        className={styles.privacy}
        transform={`translate(${SCENE.privacy.cx} ${SCENE.privacy.cy})`}
      >
        <circle
          className={styles.privacyBlur}
          r={SCENE.privacy.r}
          filter="url(#sv-daylight-privacy-blur)"
        />
        <circle className={styles.privacyRing} r={SCENE.privacy.r + 4} />
        <g transform={`translate(-52 ${SCENE.privacy.r + 26})`}>
          <rect
            className={styles.tagGlass}
            x="-8"
            y="-13"
            width="128"
            height="24"
            rx="12"
          />
          <text className={styles.tag} x="4" y="4">
            {SCENE.privacy.label}
          </text>
        </g>
      </g>
    </svg>
  );
}

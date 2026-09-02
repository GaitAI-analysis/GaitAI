import {
  GAIT_HEAD,
  GAIT_NECK,
  GAIT_PHASES,
  type Pt,
} from "@/components/visuals/gait-phases";
import { PoseFrame, smoothPath } from "@/components/research/PoseFrame";
import styles from "./landing.module.css";

/**
 * The journal's opening image: one walk, becoming a signal.
 *
 * The hero asks "What does AI see when you walk?" — so the visual has to be an
 * answer, not decoration. It shows the three things a movement system actually
 * works with, in the order it gets them: the body, the landmarks it reduces to,
 * and the trace those landmarks leave over time. Cyan at the body, violet by
 * the time it is a signal.
 *
 * Everything is drawn from `gait-phases.ts`, the same stride keyframes the
 * product and research pages draw with, so the journal is visibly part of the
 * same system rather than illustrated separately.
 *
 * MOTION, AND WHY IT IS SHAPED THIS WAY
 * Every element is declared in its finished state and only `transform` and
 * `stroke-opacity` are animated, inside `prefers-reduced-motion:
 * no-preference`. An entrance that animates visibility fails CLOSED: if it
 * does not run, or has not run yet, the hero is empty. This one fails open —
 * the worst case is a still image, which is the point of the hero anyway.
 */

/* The frame is close to square rather than wide. A landscape composition in a
   portrait stage is letterboxed by `meet`, which is what made the figure small
   enough to read as an ornament instead of the subject of the page. */
const W = 760;
const H = 790;

/* The lead pose, with two earlier frames behind it as motion history. */
const LEAD = 3; // toe-off: the most open, most legible stride shape
const GHOSTS = [1, 2] as const;

const SCALE = 5.1;
/* Raised so the signal band runs UNDER the feet rather than through the
   legs, which made both unreadable where they crossed. */
const ORIGIN: Pt = [430, 428];

const figure = {
  bone: styles.hvBone,
  boneFar: styles.hvBoneFar,
  joint: styles.hvJoint,
  head: styles.hvHead,
  contact: styles.hvContact,
};

const ghostFigure = {
  bone: styles.hvGhostBone,
  boneFar: styles.hvGhostBone,
  joint: styles.hvGhostJoint,
  head: styles.hvGhostBone,
};

/** Absolute position of a local joint on the lead figure. */
const abs = ([x, y]: Pt): Pt => [ORIGIN[0] + x * SCALE, ORIGIN[1] + y * SCALE];

/** A joint's path across the stride, in absolute coordinates. */
function jointPath(pick: (i: number) => Pt, drift: number) {
  return smoothPath(
    GAIT_PHASES.map((_, i) => {
      const [x, y] = pick(i);
      /* The stride is drawn in place, so the trace is spread along x by the
         frame index — the path a fixed camera would see over one cycle. */
      return [
        ORIGIN[0] + x * SCALE + (i - 2) * drift,
        ORIGIN[1] + y * SCALE,
      ] as Pt;
    }),
  );
}

/** The temporal signal under the figure: one stride, two steps, asymmetric. */
function signal(y0: number, amp: number) {
  const pts: Pt[] = Array.from({ length: 121 }, (_, i) => {
    const t = i / 120;
    const v =
      Math.sin(t * Math.PI * 6) * (t < 0.5 ? 1 : 0.66) +
      Math.sin(t * Math.PI * 12) * 0.14;
    return [24 + t * (W - 48), y0 - v * amp] as Pt;
  });
  return smoothPath(pts);
}

export function JournalHeroVisual() {
  const lead = GAIT_PHASES[LEAD];

  /* The landmarks a pose model returns, on the lead figure. */
  const landmarks: Pt[] = [
    GAIT_HEAD,
    GAIT_NECK,
    ...lead.nearArm,
    ...lead.farArm,
    ...lead.nearLeg,
    ...lead.farLeg,
    lead.nearFoot[1],
  ].map(abs);

  const signalY = 722;

  return (
    <svg
      aria-hidden="true"
      className={styles.hv}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <linearGradient id="hv-sig" gradientUnits="userSpaceOnUse" x1="24" x2={W - 24}>
          <stop offset="0" className={styles.hvStopCyan} />
          <stop offset="0.5" className={styles.hvStopBlue} />
          <stop offset="1" className={styles.hvStopViolet} />
        </linearGradient>
      </defs>

      {/* ── Ground, surveyed ── */}
      <g className={styles.hvGrid}>
        {Array.from({ length: 31 }, (_, i) => {
          const x = 24 + i * ((W - 48) / 30);
          return (
            <line
              key={i}
              x1={x}
              y1={H - 26}
              x2={x}
              y2={H - (i % 5 === 0 ? 38 : 32)}
            />
          );
        })}
        <line x1={24} y1={H - 26} x2={W - 24} y2={H - 26} />
      </g>

      {/* ── Motion history: the frames before this one ── */}
      {GHOSTS.map((phaseIndex, i) => (
        <g
          key={phaseIndex}
          transform={`translate(${ORIGIN[0] - (GHOSTS.length - i) * 58} ${ORIGIN[1]})`}
        >
          <g className={styles.hvGhost} style={{ ["--h-i" as string]: i }}>
            <PoseFrame
              phase={GAIT_PHASES[phaseIndex]}
              s={SCALE}
              classes={ghostFigure}
              showFar={false}
            />
          </g>
        </g>
      ))}

      {/* ── Joint trajectories: what the landmarks trace over the stride ── */}
      <g>
        {[
          { d: jointPath((i) => GAIT_PHASES[i].nearLeg[2], 58), i: 0 },
          { d: jointPath((i) => GAIT_PHASES[i].nearArm[2], 58), i: 1 },
          { d: jointPath(() => GAIT_HEAD, 58), i: 2 },
        ].map(({ d, i }) => (
          <path
            key={i}
            className={styles.hvTraj}
            d={d}
            style={{ ["--h-i" as string]: i }}
          />
        ))}
      </g>

      {/* ── The body ── */}
      <g transform={`translate(${ORIGIN[0]} ${ORIGIN[1]})`}>
        <g className={styles.hvFigure}>
          <PoseFrame phase={lead} s={SCALE} classes={figure} showContacts />
        </g>
      </g>

      {/* ── The landmarks the model actually keeps ──
          They surface and settle in turn: a pose model does not see a person,
          it sees these. */}
      <g>
        {landmarks.map(([x, y], i) => (
          <circle
            key={i}
            className={styles.hvLandmark}
            cx={x}
            cy={y}
            r={5}
            style={{ ["--h-i" as string]: i % 7 }}
          />
        ))}
      </g>

      {/* ── The signal the whole thing becomes ── */}
      <g>
        <path className={styles.hvSignal} d={signal(signalY, 34)} />
        <path
          className={styles.hvSignalRun}
          d={signal(signalY, 34)}
          pathLength={100}
        />
      </g>
    </svg>
  );
}

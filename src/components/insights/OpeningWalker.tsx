"use client";

import { useEffect, useRef, useState } from "react";
import {
  GAIT_HEAD,
  GAIT_NECK,
  GAIT_PHASES,
  type Pt,
} from "@/components/visuals/gait-phases";
import { PoseFrame, smoothPath } from "@/components/research/PoseFrame";
import styles from "./signal.module.css";

/**
 * THE OPENING WALKER — a human that becomes a signal as you begin to scroll.
 *
 * The first viewport asks one question, and this is what stands beside it: a
 * walking figure drawn as a body, not as a diagram. Then, over the first
 * screen of scrolling, three things happen in order — the reader is doing the
 * transformation the journal is about, before reading a word of it:
 *
 *   0.00 → 0.30   a body: soft mass, limbs, a ground shadow
 *   0.25 → 0.60   landmarks surface at the joints
 *   0.45 → 1.00   the temporal trajectory draws behind it
 *
 * The three stages overlap on purpose. A hard switch between them would read
 * as three pictures; the overlap reads as one thing changing.
 *
 * Progress comes from the hero's own position, not from the page: one passive
 * listener, throttled to a frame, writing three CSS variables. Under
 * `prefers-reduced-motion` — or before hydration — the composition renders in
 * its finished state, with landmarks and trajectory present, because a hero
 * that needs JavaScript to be worth looking at is a broken hero.
 */

const W = 560;
const H = 620;

/* The figure. Heel strike rather than mid-stance: at mid-stance the limbs
   stack almost vertically and the figure reads as a pole, where heel strike
   is unmistakably a stride. */
const SCALE = 5.2;
const FX = 262;
const GROUND = 520;
const FY = GROUND - 48 * SCALE;
const PHASE_INDEX = 0;

const r1 = (n: number) => Math.round(n * 10) / 10;

/** A joint chain in the figure's own local space, for the wide mass strokes. */
const chain = (list: readonly Pt[]) =>
  list.map(([x, y]) => `${r1(x * SCALE)},${r1(y * SCALE)}`).join(" ");

/** The wrist's path through the cycle — the trajectory that draws in. */
function jointTrail(pick: (phase: (typeof GAIT_PHASES)[number]) => Pt): string {
  const pts: Pt[] = [0, 1, 2, 3, 4, 0].map((phase, i) => {
    const local = pick(GAIT_PHASES[phase]);
    /* A slow drift to the right, so the trail reads as travel through time
       rather than as a closed loop in place. */
    return [
      r1(FX + local[0] * SCALE + (i - 2.5) * 42),
      r1(FY + local[1] * SCALE),
    ];
  });
  return smoothPath(pts);
}

export function OpeningWalker() {
  const ref = useRef<HTMLDivElement>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const host = ref.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const box = host.getBoundingClientRect();
      /* 0 while the hero is fully in view, 1 once it has scrolled away. */
      const p = Math.min(
        1,
        Math.max(0, -box.top / Math.max(1, box.height * 0.85)),
      );
      const ramp = (from: number, to: number) =>
        Math.min(1, Math.max(0, (p - from) / (to - from))).toFixed(3);
      host.style.setProperty("--w-body", ramp(0.3, 0.62));
      host.style.setProperty("--w-marks", ramp(0.06, 0.34));
      host.style.setProperty("--w-trail", ramp(0.22, 0.7));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const phase = GAIT_PHASES[PHASE_INDEX];

  return (
    <div
      ref={ref}
      /* Before hydration the finished state is shown; the class only opts in
         to the scroll-driven version once the listener exists. */
      className={`${styles.walker} ${hydrated ? styles.walkerLive : ""}`}
      aria-hidden="true"
    >
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.walkerSvg}>
        <defs>
          <radialGradient id="ow-mass" cx="50%" cy="42%" r="58%">
            <stop offset="0" className={styles.walkerMassIn} />
            <stop offset="1" className={styles.walkerMassOut} />
          </radialGradient>
          <linearGradient id="ow-trail" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" className={styles.walkerTrailA} />
            <stop offset="1" className={styles.walkerTrailB} />
          </linearGradient>
        </defs>

        {/* ── the ground ── */}
        <ellipse
          className={styles.walkerShadow}
          cx={FX + 6}
          cy={GROUND + 8}
          rx={126}
          ry={16}
        />
        <line
          className={styles.walkerFloor}
          x1={54}
          y1={GROUND + 8}
          x2={W - 30}
          y2={GROUND + 8}
        />

        {/* ── 3 · the temporal trajectory, drawn behind the body ── */}
        <g className={styles.walkerTrail}>
          <path
            d={jointTrail((p) => p.nearArm[2])}
            pathLength={100}
            className={styles.walkerTrailPath}
          />
          <path
            d={jointTrail((p) => p.nearLeg[2])}
            pathLength={100}
            className={`${styles.walkerTrailPath} ${styles.walkerTrailPathB}`}
          />
        </g>

        {/* ── 1 · the body ──
            A silhouette, not three floating ellipses: the same joint chains
            the skeleton uses, stroked wide with round caps, which is what
            gives limbs volume. Read first, it is a person walking; the
            skeleton then surfaces inside it. */}
        <g className={styles.walkerBody} transform={`translate(${FX} ${FY})`}>
          <ellipse
            cx={2 * SCALE}
            cy={-20 * SCALE}
            rx={15 * SCALE}
            ry={24 * SCALE}
            fill="url(#ow-mass)"
          />
          {/* Limbs as volume, from the same chains the skeleton uses. */}
          <g className={styles.walkerLimb}>
            <polyline points={chain(phase.farArm)} />
            <polyline points={chain(phase.farLeg)} />
          </g>
          <g className={`${styles.walkerLimb} ${styles.walkerLimbNear}`}>
            <polyline points={chain(phase.nearArm)} />
            <polyline points={chain(phase.nearLeg)} />
          </g>
          {/* Torso: the spine, stroked wide. */}
          <line
            className={styles.walkerTorso}
            x1={r1(GAIT_NECK[0] * SCALE)}
            y1={r1(GAIT_NECK[1] * SCALE)}
            x2={0}
            y2={r1(2 * SCALE)}
          />
          {/* Head: concentric with PoseFrame's own head circle. */}
          <circle
            className={styles.walkerSkull}
            cx={r1(GAIT_HEAD[0] * SCALE)}
            cy={r1(GAIT_HEAD[1] * SCALE)}
            r={r1(6.6 * SCALE)}
          />
        </g>

        {/* ── the figure, drawn from the shared keyframes ── */}
        <g transform={`translate(${FX} ${FY})`}>
          <PoseFrame
            phase={phase}
            s={SCALE}
            classes={{
              bone: styles.walkerBone,
              boneFar: styles.walkerBoneFar,
              joint: styles.walkerJoint,
              head: styles.walkerHead,
            }}
          />
        </g>

        {/* ── 2 · the landmarks a pose model fits ── */}
        <g className={styles.walkerMarks} transform={`translate(${FX} ${FY})`}>
          {[
            ...phase.nearArm,
            ...phase.nearLeg,
            ...phase.farArm.slice(1),
            ...phase.farLeg.slice(1),
          ].map(([x, y], i) => (
            <g key={i} style={{ ["--m-i" as string]: i }}>
              <circle
                className={styles.walkerMarkRing}
                cx={r1(x * SCALE)}
                cy={r1(y * SCALE)}
                r={9}
              />
              <circle
                className={styles.walkerMarkDot}
                cx={r1(x * SCALE)}
                cy={r1(y * SCALE)}
                r={2.6}
              />
            </g>
          ))}
        </g>

        {/* One instrument label, at the noise floor. */}
        <text className={styles.walkerLabel} x={54} y={GROUND + 34}>
          Pose landmarks · temporal trajectory
        </text>
      </svg>
    </div>
  );
}

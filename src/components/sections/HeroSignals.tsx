"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { HERO_SIGNALS, type Pose, type SignalTheme, type XY } from "@/data/hero-signals";
import { HERO_WALK } from "@/data/hero-walk";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import styles from "./herosignals.module.css";

/**
 * THE HERO'S STORY LAYER — TWO APPLICATIONS, ONE ENGINE.
 * =============================================================================
 * The founder (2026-09-26): the hero showed "a man walking" beside two
 * photographs, and did not say how gait intelligence is USED. This layer makes
 * the three panels read, in two or three seconds, as:
 *
 *   SecureVision   the same gait markers on pedestrians in a public space:
 *                  anonymised tracks, their flow toward the far end, one path
 *                  flagged (a walker against the flow, toward the restricted
 *                  side) and a compact live read-out
 *   MobilityCare   the same markers as a clinical assessment: the patient's
 *                  skeleton, a gait ring and his last footfalls on the floor,
 *                  and a read-out tied to the clinician's tablet
 *   Pose analysis  the engine: the walker's own analysis layer (HeroWalker)
 *                  and the rail, labelled "Core engine"
 *
 * TWO KINDS OF CONNECTION, TWO JOBS (founder, 2026-09-26). The only
 * permanent analytics card is Pose analysis (the rail beside the walker).
 *
 *   DATA FLOW (upper)   two fine dotted lines carry each application's
 *                       signal INTO that card: SecureVision from the tracked
 *                       walker's detection box, MobilityCare from the
 *                       clinician's tablet. They end on the card, never on
 *                       the walker's body; the card's left edge is MEASURED
 *                       (ResizeObserver + MutationObserver) and the paths
 *                       are drawn to it.
 *   GAIT MAPPING (floor) two low lines run along the floor from real
 *                       people's ground contact (the tracked walker's feet,
 *                       the patient's gait ring) to the mannequin's, so
 *                       captured movement visibly lands in the shared model.
 *
 * Neither replaces the other. A slow pulse travels each line toward the
 * engine.
 *
 * POSE OVERLAYS ARE WHOLE OR ABSENT (founder, 2026-09-26). No partial
 * hip-and-feet points on anyone. The crowd keeps only its detection
 * corners (the flagged walker keeps its arrow). Exactly two real people
 * carry a pose, and it is a full-body skeleton: the primary tracked
 * pedestrian in SecureVision and the patient in MobilityCare. Thin lines,
 * very small joints, no glow, and no node at the pelvis centre; muted cobalt
 * by day, soft ivory by night. The walker carries the fullest structure
 * (HeroWalker).
 *
 * Everything is decorative (aria-hidden) and ignores the pointer, so the
 * dots, pills, cards and rail work exactly as before. It sits at z-index 1,
 * under the connectors (2) and the dots and rail (3).
 *
 * Geometry: one SVG per theme in its plate's own pixels (data/hero-signals.ts),
 * stretched onto the stage, which always has that plate's aspect. Strokes are
 * non-scaling. The tags and read-outs are HTML placed in plate fractions, so
 * their type stays real type at every width.
 */

/** A smooth path through points (Catmull-Rom as cubic Beziers). */
function smooth(pts: readonly XY[]) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1: XY = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: XY = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

const svg = (p: XY) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

const lerp = (a: XY, b: XY, t: number): XY => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const mid = (a: XY, b: XY): XY => lerp(a, b, 0.5);

const BONES = [
  ["head", "neck"], ["neck", "shoulderL"], ["neck", "shoulderR"], ["shoulderL", "elbowL"], ["elbowL", "wristL"],
  ["shoulderR", "elbowR"], ["elbowR", "wristR"], ["shoulderL", "hipL"], ["shoulderR", "hipR"], ["hipL", "hipR"],
  ["hipL", "kneeL"], ["kneeL", "ankleL"], ["hipR", "kneeR"], ["kneeR", "ankleR"],
] as const;
/* The standard keypoints, minus the pelvis centre and the neck. */
const NODES = ["head", "shoulderL", "shoulderR", "elbowL", "elbowR", "wristL", "wristR", "hipL", "hipR", "kneeL", "kneeR", "ankleL", "ankleR"] as const;

/** A full-body pose skeleton: thin bones, very small joints. */
function Skeleton({ pose }: { pose: Pose }) {
  return (
    <g className={styles.pose}>
      {BONES.map(([a, b]) => (
        <line key={a + b} className={styles.poseBone} x1={pose[a][0]} y1={pose[a][1]} x2={pose[b][0]} y2={pose[b][1]} />
      ))}
      {NODES.map((n) => (
        <circle key={n} cx={pose[n][0]} cy={pose[n][1]} r={n === "head" ? 2.2 : 1.6} className={styles.poseNode} />
      ))}
    </g>
  );
}

function Layer({ name, t, reduced }: { name: "light" | "dark"; t: SignalTheme; reduced: boolean }) {
  const [W, H] = t.plate;
  const { secure, care } = t;
  const J = care.joints;
  const tick = 9;
  const layer = useRef<HTMLDivElement>(null);
  /* The Pose analysis card's left edge (a little below its title), in this
     plate's px; null until measured, or while this theme's layer is hidden. */
  const [end, setEnd] = useState<XY | null>(null);

  useEffect(() => {
    const el = layer.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const card = document.getElementById("hero-option-pose");
      const l = el.getBoundingClientRect();
      const r = card?.getBoundingClientRect();
      if (!r || !l.width || !r.width) return setEnd(null);
      const x = ((r.left - l.left) / l.width) * W;
      const y = ((r.top + Math.min(r.height / 2, 44) - l.top) / l.height) * H;
      setEnd((e) => (e && Math.abs(e[0] - x) < 0.5 && Math.abs(e[1] - y) < 0.5 ? e : [x, y]));
    };
    const later = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const ro = new ResizeObserver(later);
    ro.observe(el);
    const card = document.getElementById("hero-option-pose");
    if (card) ro.observe(card);
    // The rail's `top` is set by its own fit pass (inline style), which a
    // ResizeObserver does not see; watch that attribute too.
    const mo = new MutationObserver(later);
    if (card) mo.observe(card, { attributes: true, attributeFilter: ["style", "data-open", "data-fit"] });
    const settle = window.setTimeout(later, 1600);
    later();
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.clearTimeout(settle);
      cancelAnimationFrame(raf);
    };
  }, [W, H]);

  /* SecureVision: from the top-right corner of the main tracked walker's
     detection box. MobilityCare: from the clinician's tablet. */
  const lead = secure.people.reduce((a, b) => (b.box[3] - b.box[1] > a.box[3] - a.box[1] ? b : a));
  const svFrom: XY = [lead.box[2], lead.box[1]];
  const mcFrom: XY = care.tablet;
  /* Both arrive at the card from a little below-left, so they merge just
     before it and pass under the Pose anchor dot rather than through it.
     MobilityCare first rises steeply, clearing the clinician's head. */
  const svPath = end && `M${svg(svFrom)} C${svg([svFrom[0] + (end[0] - svFrom[0]) * 0.3, svFrom[1] - 60])} ${svg([end[0] - (end[0] - svFrom[0]) * 0.3, end[1] + 60])} ${svg(end)}`;
  const mcPath = end && `M${svg(mcFrom)} C${svg([mcFrom[0] + (end[0] - mcFrom[0]) * 0.08, mcFrom[1] - 190])} ${svg([end[0] - (end[0] - mcFrom[0]) * 0.3, end[1] + 60])} ${svg(end)}`;

  /* FOOT TO FOOT, ALONG THE FLOOR (founder, 2026-09-26, final). Both
     applications' movement reaches the shared walking model where gait
     actually happens: the ground. Two low connectors, each from a real
     person's ground contact to the mannequin's, travelling near the floor
     plane and never through the air or across a body:

       MobilityCare   the patient's gait ring (his ground contact) -> him
       SecureVision   the main tracked walker's feet -> him, dipping a little
                      lower so it passes beneath the patient's ring

     The mannequin's end is between his feet at floor level (HERO_WALK's own
     placement, the same plate px as everything here), where a small contact
     ring with a soft halo terminates both lines. A slow pulse on each runs
     toward him: captured movement -> the shared model. */
  const walk = HERO_WALK[name];
  const target: XY = [walk.hipX, walk.feetY + 2];
  const svFoot = mid(lead.feet[0], lead.feet[1]);
  const mcFoot: XY = [care.ring[0], care.ring[1]];
  const dx = (a: XY) => target[0] - a[0];
  const mcFloor = `M${svg(mcFoot)} C${svg([mcFoot[0] + dx(mcFoot) * 0.35, mcFoot[1] + 22])} ${svg([target[0] - dx(mcFoot) * 0.3, target[1] + 16])} ${svg(target)}`;
  const svFloor = `M${svg(svFoot)} C${svg([svFoot[0] + dx(svFoot) * 0.3, svFoot[1] + 95])} ${svg([target[0] - dx(svFoot) * 0.28, target[1] + 45])} ${svg(target)}`;
  const markR = walk.figH * 0.055;

  return (
    <div ref={layer} className={`${styles.layer} ${styles[name]}`}>
      <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <marker id={`sig-arrow-${name}`} viewBox="0 0 8 8" refX="4" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M1,1 L7,4 L1,7" className={styles.alertArrow} />
          </marker>
        </defs>

        {/* ── The connectors: each application feeds Pose analysis ── */}
        {svPath && mcPath && end ? (
          <>
            <path d={svPath} className={styles.link} />
            <path d={mcPath} className={styles.link} />
            <circle cx={svFrom[0]} cy={svFrom[1]} r="2.4" className={styles.linkEnd} />
            <circle cx={mcFrom[0]} cy={mcFrom[1]} r="2.4" className={styles.linkEnd} />
            <circle cx={end[0]} cy={end[1]} r="2.6" className={styles.linkEnd} />
            {!reduced &&
              [svPath, mcPath].map((d, i) => (
                <circle key={i} r="2.4" className={styles.pulse}>
                  <animateMotion dur={i ? "4.6s" : "5.4s"} begin={`${i * 1.6}s`} repeatCount="indefinite" path={d} />
                  <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.1;0.85;1" dur={i ? "4.6s" : "5.4s"} begin={`${i * 1.6}s`} repeatCount="indefinite" />
                </circle>
              ))}
          </>
        ) : null}

        {/* ── Foot to foot: both applications feed the shared walking model ── */}
        <path d={svFloor} className={styles.floorLink} />
        <path d={mcFloor} className={styles.floorLink} />
        <ellipse className={styles.floorAnchor} cx={svFoot[0]} cy={svFoot[1] + 1} rx={markR * 0.55} ry={markR * 0.14} />
        <circle cx={svFoot[0]} cy={svFoot[1] + 1} r="2" className={styles.linkEnd} />
        <circle cx={mcFoot[0]} cy={mcFoot[1]} r="2" className={styles.linkEnd} />
        <ellipse className={styles.footHalo} cx={target[0]} cy={target[1]} rx={markR * 1.45} ry={markR * 0.3} />
        <ellipse className={styles.footMark} cx={target[0]} cy={target[1]} rx={markR} ry={markR * 0.2} />
        <circle cx={target[0]} cy={target[1]} r="2.4" className={styles.linkEnd} />
        {!reduced &&
          [svFloor, mcFloor].map((d, i) => (
            <circle key={i} r="2.2" className={styles.pulse}>
              <animateMotion dur={i ? "4.2s" : "5.2s"} begin={`${i * 1.4}s`} repeatCount="indefinite" path={d} />
              <animate attributeName="opacity" values="0;0.85;0.85;0" keyTimes="0;0.1;0.88;1" dur={i ? "4.2s" : "5.2s"} begin={`${i * 1.4}s`} repeatCount="indefinite" />
            </circle>
          ))}

        {/* ── SecureVision: tracks, flow, one flagged path ── */}
        {secure.people.map((p, k) => {
          const [x0, y0, x1, y1] = p.box;
          const f = mid(p.feet[0], p.feet[1]);
          const alert = p.flow === "against";
          const cls = alert ? styles.alertStroke : styles.ink;
          const ahead = lerp(f, [2 * f[0] - secure.vp[0], 2 * f[1] - secure.vp[1]], 0.22);
          return (
            <g key={k} className={styles.track} style={{ ["--k" as string]: k } as CSSProperties}>
              {/* corner ticks on the painted box, in the engine's gold */}
              <path className={cls} d={`M${x0},${y0 + tick} V${y0} H${x0 + tick} M${x1 - tick},${y0} H${x1} V${y0 + tick} M${x1},${y1 - tick} V${y1} H${x1 - tick} M${x0 + tick},${y1} H${x0} V${y1 - tick}`} />
              {/* the primary tracked subject only: a full-body pose */}
              {p.pose ? <Skeleton pose={p.pose} /> : null}
              {/* the flagged walker's heading: what "Direction alert" counts */}
              {alert ? <path className={styles.alertAhead} d={`M${f[0]},${f[1]} L${ahead[0].toFixed(1)},${ahead[1].toFixed(1)}`} markerEnd={`url(#sig-arrow-${name})`} /> : null}
            </g>
          );
        })}

        {/* ── MobilityCare: the assessment ── */}
        <g className={styles.care}>
          <Skeleton pose={J} />
          <ellipse className={styles.ring} cx={care.ring[0]} cy={care.ring[1]} rx={care.ring[2]} ry={care.ring[3]} />
          <ellipse className={styles.ringSweep} cx={care.ring[0]} cy={care.ring[1]} rx={care.ring[2] * 0.72} ry={care.ring[3] * 0.72} />
        </g>
      </svg>

    </div>
  );
}

export function HeroSignals() {
  const reduced = usePrefersReducedMotion();
  return (
    <div className={styles.signals} aria-hidden="true">
      <Layer name="light" t={HERO_SIGNALS.light} reduced={reduced} />
      <Layer name="dark" t={HERO_SIGNALS.dark} reduced={reduced} />
    </div>
  );
}

"use client";

import type { CSSProperties } from "react";
import { HERO_OPTIONS } from "@/data/home-hero";
import { HERO_SIGNALS, HERO_SIGNAL_COPY, type SignalTheme, type XY } from "@/data/hero-signals";
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
 * One gold THREAD runs along the floor from the walker's feet, through the
 * patient's gait ring, to the pedestrians' feet, and pulses travel along it
 * from the engine outward: analysis -> application. The markers (small gold
 * nodes, thin lines) are the engine's own vocabulary, repeated on every
 * person, so the relationship is visible without a sentence.
 *
 * Restraint is the brief too: thin strokes, three short tags, two compact
 * read-outs, no dashboard. Everything is decorative (aria-hidden) and ignores
 * the pointer, so the dots, pills, cards and rail work exactly as before. It
 * sits at z-index 1, under the connectors (2) and the dots and rail (3).
 *
 * Geometry: one SVG per theme in its plate's own pixels (data/hero-signals.ts),
 * stretched onto the stage, which always has that plate's aspect. Strokes are
 * non-scaling. The tags and read-outs are HTML placed in plate fractions, so
 * their type stays real type at every width.
 */

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;

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

const lerp = (a: XY, b: XY, t: number): XY => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const mid = (a: XY, b: XY): XY => lerp(a, b, 0.5);

const BONES = [
  ["head", "neck"], ["neck", "shoulderL"], ["neck", "shoulderR"], ["shoulderL", "elbowL"], ["elbowL", "wristL"],
  ["shoulderR", "elbowR"], ["elbowR", "wristR"], ["neck", "pelvis"], ["hipL", "hipR"], ["hipL", "kneeL"],
  ["kneeL", "ankleL"], ["hipR", "kneeR"], ["kneeR", "ankleR"],
] as const;
const NODES = ["shoulderL", "shoulderR", "elbowL", "elbowR", "wristL", "wristR", "pelvis", "kneeL", "kneeR", "ankleL", "ankleR"] as const;

function Layer({ name, t, reduced }: { name: "light" | "dark"; t: SignalTheme; reduced: boolean }) {
  const [W, H] = t.plate;
  const thread = smooth(t.thread);
  const { secure, care } = t;
  const J = care.joints;
  const tick = 9;
  const copy = HERO_SIGNAL_COPY;

  return (
    <div className={`${styles.layer} ${styles[name]}`}>
      <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <marker id={`sig-arrow-${name}`} viewBox="0 0 8 8" refX="4" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M1,1 L7,4 L1,7" className={styles.alertArrow} />
          </marker>
        </defs>

        {/* ── The thread: engine -> applications ── */}
        <path d={thread} className={styles.thread} />
        <path d={thread} className={styles.threadGlow} />
        {/* Direction, readable without motion: chevrons where the thread enters each application. */}
        {t.chevrons.map((i) => {
          const a = t.thread[i - 1], b = t.thread[i + 1], p = t.thread[i];
          const deg = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
          return <path key={i} className={styles.chevron} d="M-5,-4.5 L1,0 L-5,4.5" transform={`translate(${p[0]} ${p[1]}) rotate(${deg.toFixed(1)})`} />;
        })}
        {!reduced &&
          [0, 1, 2].map((i) => (
            <circle key={i} r="3.2" className={styles.pulse}>
              <animateMotion dur="5.4s" begin={`${i * 1.8}s`} repeatCount="indefinite" path={thread} />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.85;1" dur="5.4s" begin={`${i * 1.8}s`} repeatCount="indefinite" />
            </circle>
          ))}

        {/* ── SecureVision: tracks, flow, one flagged path ── */}
        {secure.people.map((p, k) => {
          const [x0, y0, x1, y1] = p.box;
          const f = mid(p.feet[0], p.feet[1]);
          const alert = p.flow === "against";
          const cls = alert ? styles.alertStroke : styles.ink;
          // Behind the walker: where they have been. Ahead: where the track predicts.
          const back = (s: number) => (alert ? lerp(f, secure.vp, s) : lerp(f, [2 * f[0] - secure.vp[0], 2 * f[1] - secure.vp[1]], s));
          const ahead = alert ? lerp(f, [2 * f[0] - secure.vp[0], 2 * f[1] - secure.vp[1]], 0.22) : lerp(f, secure.vp, 0.42);
          return (
            <g key={k} className={styles.track} style={{ ["--k" as string]: k } as CSSProperties}>
              {/* corner ticks on the painted box, in the engine's gold */}
              <path className={cls} d={`M${x0},${y0 + tick} V${y0} H${x0 + tick} M${x1 - tick},${y0} H${x1} V${y0 + tick} M${x1},${y1 - tick} V${y1} H${x1 - tick} M${x0 + tick},${y1} H${x0} V${y1 - tick}`} />
              {/* the same markers as on the walker: pelvis and both feet */}
              <line className={`${cls} ${styles.faint}`} x1={p.pelvis[0]} y1={p.pelvis[1]} x2={p.feet[0][0]} y2={p.feet[0][1]} />
              <line className={`${cls} ${styles.faint}`} x1={p.pelvis[0]} y1={p.pelvis[1]} x2={p.feet[1][0]} y2={p.feet[1][1]} />
              {[p.pelvis, ...p.feet].map((q, i) => (
                <circle key={i} cx={q[0]} cy={q[1]} r={i ? 2.2 : 2.6} className={alert ? styles.alertNode : styles.node} />
              ))}
              {/* footfall history */}
              {[0.1, 0.21, 0.33].map((s, i) => {
                const q = back(s);
                return <circle key={i} cx={q[0] + (i % 2 ? 3 : -3)} cy={q[1]} r="1.9" className={`${alert ? styles.alertNode : styles.node} ${styles.fall}`} style={{ ["--i" as string]: i } as CSSProperties} />;
              })}
              {/* predicted path */}
              <path className={alert ? styles.alertAhead : styles.ahead} d={`M${f[0]},${f[1]} L${ahead[0].toFixed(1)},${ahead[1].toFixed(1)}`} markerEnd={alert ? `url(#sig-arrow-${name})` : undefined} />
            </g>
          );
        })}

        {/* ── MobilityCare: the assessment ── */}
        <g className={styles.care}>
          {BONES.map(([a, b]) => (
            <line key={a + b} className={`${styles.ink} ${styles.bone}`} x1={J[a][0]} y1={J[a][1]} x2={J[b][0]} y2={J[b][1]} />
          ))}
          {NODES.map((n) => (
            <circle key={n} cx={J[n][0]} cy={J[n][1]} r="2.4" className={styles.node} />
          ))}
          <ellipse className={styles.ring} cx={care.ring[0]} cy={care.ring[1]} rx={care.ring[2]} ry={care.ring[3]} />
          <ellipse className={styles.ringSweep} cx={care.ring[0]} cy={care.ring[1]} rx={care.ring[2] * 0.72} ry={care.ring[3] * 0.72} />
          {care.steps.map((q, i) => (
            <ellipse key={i} className={styles.step} style={{ ["--i" as string]: i } as CSSProperties} cx={q[0]} cy={q[1]} rx="8" ry="3" />
          ))}
          {/* the read-out is tied to the patient and to the clinician's tablet */}
          <path className={`${styles.ink} ${styles.leader}`} d={`M${care.chip[0] + 28},${care.chip[1] + 2} L${J.head[0] - 6},${J.head[1] - 20}`} />
          <path className={`${styles.ink} ${styles.leader}`} d={`M${care.tablet[0]},${care.tablet[1] - 4} L${care.chip[0] + 92},${care.chip[1] + 2}`} />
          <circle cx={care.tablet[0]} cy={care.tablet[1] - 4} r="2" className={styles.node} />
        </g>
      </svg>

      {/* ── Role tags, hung from the anchor dots ── */}
      {HERO_OPTIONS.map((o) => {
        const role = o.id === "pose" ? copy.core : o.id === "securevision" ? copy.secure : copy.care;
        return (
          <span key={o.id} className={styles.tag} data-core={o.id === "pose" || undefined} style={{ left: `calc(${(o.dot[0] * 100).toFixed(3)}% - 0.4rem)`, top: `${(o.dot[1] * 100).toFixed(3)}%` }}>
            <span className={styles.tagRole}>{role.role}</span>
            <span className={styles.tagPlace}>{role.place}</span>
          </span>
        );
      })}

      {/* ── SecureVision: track labels and the read-out ── */}
      {secure.people.map((p, k) => p.label !== false && (
        <span key={k} className={styles.trackTag} data-alert={p.flow === "against" || undefined} style={{ left: pct(p.box[0], W), top: pct(p.box[1], H), ["--k" as string]: k } as CSSProperties}>
          {p.flow === "against" ? (
            <>
              <b>{copy.secure.flag.title}</b> {copy.secure.flag.note}
            </>
          ) : (
            <>
              {p.id} · {p.speed}
            </>
          )}
        </span>
      ))}
      <div className={`${styles.chip} ${styles.chipSecure}`} style={{ left: pct(secure.chip[0], W), top: pct(secure.chip[1], H) }}>
        <p className={styles.chipTitle}>
          <i className={styles.live} /> {copy.secure.title}
        </p>
        {copy.secure.rows.map((r) => (
          <p key={r.label} className={styles.row} data-tone={"tone" in r ? r.tone : undefined}>
            <span>{r.label}</span>
            <b>
              {"meter" in r && (
                <i className={styles.meter}>
                  <i style={{ width: `${r.meter * 100}%` }} />
                </i>
              )}
              {r.value}
            </b>
          </p>
        ))}
      </div>

      {/* ── MobilityCare: the read-out ── */}
      <div className={`${styles.chip} ${styles.chipCare}`} style={{ left: pct(care.chip[0], W), bottom: pct(H - care.chip[1], H) }}>
        <p className={styles.chipTitle}>
          <i className={styles.live} /> {copy.care.title}
        </p>
        {copy.care.rows.map((r) => (
          <p key={r.label} className={styles.row}>
            <span>{r.label}</span>
            <b>{r.value}</b>
          </p>
        ))}
        <p className={styles.row}>
          <span>{copy.care.trend.label}</span>
          <b>
            <svg className={styles.spark} viewBox="0 0 70 18" preserveAspectRatio="none">
              <polyline points={copy.care.trend.points.map((v, i) => `${(i / (copy.care.trend.points.length - 1)) * 68 + 1},${17 - v * 16}`).join(" ")} />
            </svg>
            {copy.care.trend.value}
          </b>
        </p>
      </div>
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

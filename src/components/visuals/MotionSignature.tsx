"use client";

import { useId, useState } from "react";
import { GAIT_PHASES, type Pt } from "./gait-phases";
import { PoseSilhouette } from "./PoseSilhouette";
import { PoseFrame, smoothPath } from "@/components/research/PoseFrame";
import styles from "./signature.module.css";

const READINGS = [
  { id: "knee", label: "Knee motion", detail: "Follow the hip–knee–ankle geometry across a stride. Joint motion describes the movement; it does not establish pain, injury or a diagnosis." },
  { id: "foot", label: "Stance / swing", detail: "Ground-contact markers and the ankle path separate a supporting foot from a swinging foot in this illustrated stride. A recorded clip needs sufficient visibility to estimate these events." },
  { id: "path", label: "Trajectory", detail: "A trajectory joins the same landmark over time. The shape shows its path; physical velocity requires timestamps and a calibrated scale, which this illustration does not supply." },
  { id: "centre", label: "Body centre", detail: "The hip midpoint provides a reference for body motion. Its movement can be inspected alongside the feet; it is not a validated balance or stability score." },
] as const;
const XS = [72, 183, 294, 405, 516];
const ankle: Pt[] = GAIT_PHASES.map((p, i) => [XS[i] + p.nearLeg[2][0], 92 + p.nearLeg[2][1]]);
const signal: Pt[] = GAIT_PHASES.map((p, i) => [XS[i], 203 + p.nearLeg[2][1] - 40]);

/** Abstract Motion DNA, derived from shared illustrative gait geometry, never measured values. */
export function MotionSignature({ stage = 3, interactive = false, compact = false }: {
  stage?: number;
  interactive?: boolean;
  compact?: boolean;
}) {
  const labelId = useId();
  const [reading, setReading] = useState<(typeof READINGS)[number]["id"]>("knee");
  const selected = READINGS.find((entry) => entry.id === reading)!;
  const level = Math.max(0, Math.min(4, stage));

  return (
    <div className={styles.signature} data-stage={level} data-reading={reading}>
      <svg viewBox={`0 0 590 ${compact ? 100 : 250}`} role="img" aria-labelledby={labelId} className={styles.drawing}>
        <title id={labelId}>{compact ? "Motion DNA: a temporal trace branching into four movement applications." : "Illustrative movement signature: one stride becomes pose, trajectories, temporal signals and four intelligence dimensions. No measured scores."}</title>
        {!compact && <>
          <path d="M30 141H564" className={styles.ground} />
          {GAIT_PHASES.map((phase, index) => (
            <g key={phase.id} transform={`translate(${XS[index]} 92)`}>
              <g className={styles.human} data-visible={level === 0}>
                <PoseSilhouette phase={phase} s={1} classes={{group:styles.mass,torso:styles.torso,limb:styles.limb,limbLeg:styles.leg,head:styles.massHead}} />
              </g>
              <g className={styles.pose} data-visible={level > 0}>
                <PoseFrame phase={phase} s={1} showContacts={reading === "foot"} classes={{bone:styles.bone,boneFar:styles.far,joint:styles.joint,head:styles.head,contact:styles.contact}} />
                {interactive && <g className={styles.hotspots}>
                  <circle cx={phase.nearLeg[1][0]} cy={phase.nearLeg[1][1]} r="9" data-active={reading === "knee"} onPointerEnter={() => setReading("knee")} />
                  <circle cx={phase.nearLeg[2][0]} cy={phase.nearLeg[2][1]} r="9" data-active={reading === "foot"} onPointerEnter={() => setReading("foot")} />
                  <circle cx="0" cy="0" r="9" data-active={reading === "centre"} onPointerEnter={() => setReading("centre")} />
                </g>}
              </g>
            </g>
          ))}
          <g className={styles.traces} data-visible={level > 1}>
            <path d={smoothPath(ankle)} className={styles.trail} onPointerEnter={() => {if(interactive) setReading("path");}} />
            <path d={smoothPath(signal)} className={styles.signal} pathLength="1" />
            <path d={smoothPath(signal.map(([x,y]) => [x,y + 11] as Pt))} className={styles.echo} />
            <path d="M72 223H516" className={styles.ground} />
          </g>
        </>}
        {compact && <>
          <path d={smoothPath(signal.map(([x,y]) => [x * .62, y - 155] as Pt))} className={styles.signal} pathLength="1" />
          {[16,38,60,82].map((y,i) => <path key={y} d={`M320 50C400 50 420 ${y} 566 ${y}`} className={i===1?styles.signal:styles.echo} />)}
          <circle cx="320" cy="50" r="3" className={styles.joint} />
        </>}
      </svg>
      {interactive && <>
        <div className={styles.controls} role="group" aria-label="Inspect a movement signal">
          {READINGS.map((entry) => <button key={entry.id} type="button" aria-pressed={reading === entry.id} onClick={() => setReading(entry.id)} onPointerEnter={(event) => {if(event.pointerType === "mouse") setReading(entry.id);}} onFocus={() => setReading(entry.id)}>{entry.label}</button>)}
        </div>
        <p className={styles.explanation} aria-live="polite"><strong>{selected.label}.</strong> {selected.detail}</p>
      </>}
    </div>
  );
}

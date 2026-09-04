"use client";

import { useId, useState } from "react";
import { GAIT_PHASES, type Pt } from "./gait-phases";
import { PoseSilhouette } from "./PoseSilhouette";
import { PoseFrame, smoothPath } from "@/components/research/PoseFrame";
import { SegmentTabs } from "@/components/analytics/controls";
import styles from "./xray.module.css";

/**
 * MOVEMENT X-RAY — the same walk, twice.
 *
 * HUMAN VIEW is the body a person sees. AI VIEW is what the pipeline actually
 * reads off it: the skeleton, the landmarks, where the feet meet the ground,
 * the path a joint traces across the stride, and two temporal channels.
 *
 * WHY BOTH VIEWS ARE PROVABLY THE SAME WALK. Both read `GAIT_PHASES` — one
 * stride sampled at five canonical gait events, with every joint placed by
 * data. The human view draws it through `PoseSilhouette` and the AI view
 * through `PoseFrame`, and those two share their coordinates. So the claim
 * this component makes — "this is the same person, read differently" — is
 * true by construction rather than by two artists agreeing.
 *
 * WHAT IT REFUSES TO SHOW. No numbers. Not one. The reveal names the channels
 * the pipeline reads and stops there, because a value on this figure would be
 * a measurement of a walk that never happened — a fake gait score, a fake
 * clinical reading or a fake identity confidence, depending on which page it
 * sat on. The temporal traces are drawn from the keyframe coordinates
 * themselves (ankle height and wrist position across the stride), so even the
 * SHAPES are the real data in this repository rather than invented curves;
 * they carry no axis and no units, because the keyframes are an illustration
 * of a stride and not a recording of one.
 *
 * REUSABLE, ONE ACCENT APART. `family` swaps a single CSS variable and the
 * copy; the geometry, the control and the reveal list are shared, so the
 * MobilityCare and SecureVision instances read as one instrument in two
 * places. `reads` is the caller's — it names what THAT family's modules do
 * with these channels, which is the only thing that genuinely differs.
 */

/* Five figures across one stride, and the frame that holds them. */
const XS = [96, 226, 356, 486, 616];
const S = 1.15;
const FIG_Y = 128;
const GROUND_Y = FIG_Y + 48 * S;
const W = 712;
/* Tall enough for BOTH channel strips. It was 236, which put the second one
   (wrist swing) 35 units below the viewBox — drawn, and invisible. The frame
   has `overflow: visible`, so nothing clipped it and nothing complained; it
   simply painted into the caption's space and read as one channel. Derived
   below rather than typed, so moving the figures or the strips cannot
   reintroduce it. */

/* Temporal channel strips, under the ground line. */
const TRACE_TOP = GROUND_Y + 22;
const TRACE_H = 26;
const TRACE_GAP = 14;
const TRACE_X = 96;
const TRACE_W = 520;
/** How many channel strips the render below draws. Keep in step with it. */
const TRACE_COUNT = 2;
const H =
  TRACE_TOP + TRACE_COUNT * TRACE_H + (TRACE_COUNT - 1) * TRACE_GAP + 10;

export type XRayFamily = "mobilitycare" | "securevision";

/** A named channel, and one line on what reads it. No values. */
export interface XRayRead {
  label: string;
  detail: string;
}

/**
 * One temporal channel, normalised into its own band.
 *
 * The values come out of the keyframes, so this is the shape of the data the
 * repository actually holds. Normalising per channel is what lets two
 * quantities with different ranges share one strip — and is also why there is
 * no axis: a normalised band has no units to label.
 */
function traceD(values: number[], top: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = TRACE_W / (values.length - 1);
  const points: Pt[] = values.map((value, i) => [
    TRACE_X + i * step,
    top + (1 - (value - min) / span) * TRACE_H,
  ]);
  return smoothPath(points);
}

export function MovementXRay({
  family,
  reads,
  humanCaption,
  aiCaption,
  hint = "Switch the view",
}: {
  family: XRayFamily;
  /** What this family's modules read off the AI view. Named, never measured. */
  reads: XRayRead[];
  /** One line under the figure in human view. */
  humanCaption: string;
  /** One line under the figure in AI view. */
  aiCaption: string;
  hint?: string;
}) {
  const [view, setView] = useState<"human" | "ai">("human");
  const ai = view === "ai";
  const labelId = useId();

  /* Absolute positions of two landmarks across the stride, so a trajectory is
     a path through the figures rather than a decoration inside one of them. */
  const ankleTrail: Pt[] = GAIT_PHASES.map((phase, i) => [
    XS[i] + phase.nearLeg[2][0] * S,
    FIG_Y + phase.nearLeg[2][1] * S,
  ]);
  const wristTrail: Pt[] = GAIT_PHASES.map((phase, i) => [
    XS[i] + phase.nearArm[2][0] * S,
    FIG_Y + phase.nearArm[2][1] * S,
  ]);

  /* The two channels, straight off the keyframes. Ankle height is negated so
     the trace rises when the foot lifts, which is the direction a reader
     expects; wrist position is taken as-is. */
  const ankleHeight = GAIT_PHASES.map((phase) => -phase.nearLeg[2][1]);
  const wristSwing = GAIT_PHASES.map((phase) => phase.nearArm[2][0]);

  return (
    <div
      className={`${styles.xray} ${
        family === "securevision" ? styles.famSecure : ""
      }`}
    >
      <SegmentTabs
        options={[
          { id: "human", label: "Human view" },
          { id: "ai", label: "AI view" },
        ]}
        value={view}
        onChange={(id) => setView(id === "ai" ? "ai" : "human")}
        label="Reading of the same walk"
        hint={hint}
        cueKey={`xray-${family}`}
      />

      <figure className="mt-6">
        <div className={styles.scroller}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={styles.frame}
          role="img"
          aria-labelledby={labelId}
        >
          {/* One sentence, not a transcription of the SVG: a screen-reader
              user needs to know which of the two readings is on screen and
              what it contains, and the reveal list below is real text. */}
          <title id={labelId}>
            {ai
              ? "One stride shown as a pose skeleton at five gait events, with body landmarks, ground-contact markers, the paths traced by the ankle and wrist, and two temporal channels beneath."
              : "One stride shown as five figures of a person walking, left to right."}
          </title>

          <line
            className={styles.ground}
            x1={40}
            y1={GROUND_Y}
            x2={W - 40}
            y2={GROUND_Y}
          />

          {/* ── HUMAN LAYER ──
              Kept mounted and faded rather than unmounted, so the figures
              never reflow between views — the point of the control is that
              the BODY does not change, only the reading of it. */}
          <g
            className={`${styles.layer} ${ai ? styles.layerOff : ""}`}
            aria-hidden="true"
          >
            {GAIT_PHASES.map((phase, i) => (
              <g key={phase.id} transform={`translate(${XS[i]} ${FIG_Y})`}>
                <PoseSilhouette
                  phase={phase}
                  s={S}
                  classes={{
                    group: styles.mass,
                    torso: styles.massTorso,
                    limb: styles.massLimb,
                    limbLeg: styles.massLimbLeg,
                    head: styles.massHead,
                  }}
                />
              </g>
            ))}
          </g>

          {/* ── AI LAYER ── */}
          <g
            className={`${styles.layer} ${ai ? "" : styles.layerOff}`}
            aria-hidden="true"
          >
            {/* Footfall markers first, so the skeletons sit over them. */}
            {GAIT_PHASES.map((phase, i) => (
              <g key={`c-${phase.id}`} transform={`translate(${XS[i]} ${FIG_Y})`}>
                <PoseFrame
                  phase={phase}
                  s={S}
                  showContacts
                  classes={{
                    bone: styles.bone,
                    boneFar: styles.boneFar,
                    joint: styles.joint,
                    head: styles.head,
                    contact: styles.contact,
                  }}
                />
              </g>
            ))}

            {/* Trajectories: the ankle and the wrist across the whole stride. */}
            <path className={styles.trail} d={smoothPath(ankleTrail)} />
            <path className={styles.trail} d={smoothPath(wristTrail)} />
            {[...ankleTrail, ...wristTrail].map(([x, y], i) => (
              <circle
                key={`n-${i}`}
                className={styles.trailNode}
                cx={x}
                cy={y}
                r={1.9}
              />
            ))}

            {/* Two temporal channels. No axis, no units — see traceD. */}
            {(
              [
                { label: "Ankle height", values: ankleHeight },
                { label: "Wrist swing", values: wristSwing },
                /* TRACE_COUNT sizes the viewBox from this list's length, so a
                   third channel cannot be added without the frame growing to
                   hold it — which is exactly how the second one came to be
                   drawn below the visible area. */
              ] satisfies { label: string; values: number[] }[]
            ).map((channel, i) => {
              const top = TRACE_TOP + i * (TRACE_H + TRACE_GAP);
              return (
                <g key={channel.label}>
                  <text className={styles.traceLabel} x={40} y={top + 16}>
                    {channel.label}
                  </text>
                  <line
                    className={styles.traceBase}
                    x1={TRACE_X}
                    y1={top + TRACE_H}
                    x2={TRACE_X + TRACE_W}
                    y2={top + TRACE_H}
                  />
                  <path
                    className={styles.trace}
                    d={traceD(channel.values, top)}
                  />
                </g>
              );
            })}
          </g>
        </svg>
        </div>

        <figcaption className="mt-4 text-[13.5px] leading-relaxed text-soft-gray">
          {ai ? aiCaption : humanCaption}
        </figcaption>
      </figure>

      {/* ── WHAT THE AI VIEW IS READING ──
          Real text under the figure rather than labels crammed into the SVG:
          it stays legible at 390px, it is selectable, and a screen reader gets
          it without an essay in the <title>. Only shown in AI view, because in
          human view there is nothing being read. */}
      {ai && (
        <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {reads.map((read) => (
            <div key={read.label} className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-soft-white">
                {read.label}
              </dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-soft-mute">
                {read.detail}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

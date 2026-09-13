"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { GAIT_PHASES, type Pt } from "./gait-phases";
import { PoseFrame, smoothPath } from "@/components/research/PoseFrame";
import { MovementViewSelector, type MovementView } from "./MovementViewSelector";
import { assetPath } from "@/lib/paths";
import { ShareExploration } from "@/components/ui/ShareExploration";
import styles from "./xray.module.css";

/**
 * MOVEMENT X-RAY — the same walk, twice.
 *
 * HUMAN VIEW is the recording a person sees - a camera frame. AI VIEW is what
 * the pipeline reads: the skeleton, the landmarks, where the feet meet the
 * ground, the path a joint traces across the stride, and two temporal
 * channels. See XRAY_PLATE below for why the frame is one photograph rather
 * than five drawn figures, and what replaces it when a real strip exists.
 *
 * THE AI VIEW IS KEYFRAMES, NOT DETECTION. It reads `GAIT_PHASES` - one
 * stride sampled at five canonical gait events, every joint placed by data -
 * through `PoseFrame`. It is not inferred from the frame in the human view,
 * and every caption says so; the five event ticks on the frame's timeline are
 * the honest join between the two.
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
export type XRayFamily = "mobilitycare" | "securevision";

const XS = [96, 226, 356, 486, 616];
const S = 1.15;
const FIG_Y = 128;

/**
 * HUMAN VIEW IS A CAMERA FRAME.
 * It was five grey silhouettes - a drawn body standing in for "what a person
 * sees", on both family pages and in the Movement Lab. A drawn body is not a
 * human view; a camera frame is. So the human layer is now a photograph across
 * the stride region with the five gait events the AI view samples marked on
 * its timeline, and the AI and Explain layers are unchanged over it:
 * real frame -> keypoints -> interpretation.
 *
 * ONE FRAME, NOT FIVE. The repository holds exactly one photoreal walking
 * frame (scripts/build-capture-plate.py), and five consecutive frames of one
 * stride cannot be invented from it without faking a recording - which is
 * the thing this pass exists to remove. The frame is shown once, as recorded,
 * and the five instants are ticks on the ground line. When a real five-frame
 * strip exists per family (public/assets/images/capture/README.md specifies
 * it), `XRAY_STRIP` takes it and the human layer becomes five frames at XS.
 *
 * PER FAMILY: MobilityCare takes the wide, warmer cut; SecureVision the
 * neutral CCTV-graded cut. Same source, different framing and grade - the
 * dedicated clinic-corridor and concourse frames are the first two slots in
 * the manifest.
 */
const XRAY_PLATE: Record<XRayFamily, { src: string; alt: string; ratio: number }> = {
  mobilitycare: {
    src: "/assets/images/capture/capture-walk-wide.jpg",
    alt: "A camera frame of a person walking past a concrete wall, side on.",
    ratio: 688 / 516,
  },
  securevision: {
    src: "/assets/images/capture/cctv-walk-frame.jpg",
    alt: "A fixed-camera frame of a person walking past a concrete wall.",
    ratio: 496 / 516,
  },
};
/** Five consecutive frames of one stride, per family, when they exist. */
const XRAY_STRIP: Partial<Record<XRayFamily, readonly string[]>> = {};
/* The frame stands on the ground line at its own aspect - a still, not a
   band. Stretching it across the whole stride region sliced a 4:3 photograph
   to a strip through the walker's torso. */
const PLATE_Y = 8;
const PLATE_H = FIG_Y + 48 * S - PLATE_Y;
const plateBox = (family: XRayFamily) => {
  const w = Math.round(PLATE_H * XRAY_PLATE[family].ratio);
  return { x: Math.round(356 - w / 2), w };
};
const EVENT_LABELS = ["heel strike", "loading", "mid-stance", "toe-off", "swing"];
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


/** A named channel, and one line on what reads it. No values. */
export interface XRayRead {
  label: string;
  detail: string;
}

const XRAY_STAGES = [
  { name: "Raw video", detail: "The camera records appearance and movement together. One frame, as recorded; the five instants the AI view samples are marked on its timeline. Not a patient or subject recording." },
  { name: "Silhouette", detail: "The shape of a body makes the walking motion visible. The frame below is the recording; the skeleton that follows is drawn from shared gait keyframes, not detected from it." },
  { name: "Pose", detail: "Landmarks describe where joints are in each frame. Visibility matters: an obscured joint cannot be treated as a reliable observation." },
  { name: "Skeleton", detail: "Connections between landmarks reveal body structure. A skeleton represents estimated positions, not a diagnosis or proof of identity." },
  { name: "Temporal trajectories", detail: "Following the ankle and wrist through this illustrated stride reveals their paths over time." },
  { name: "Motion signals", detail: "Ankle height and wrist swing become temporal channels. These traces come from the illustrated keyframes and have no measurement units." },
  { name: "AI interpretation", detail: "A signal gains meaning in a specific application. Select a channel to see its source and the limits of that interpretation." },
  { name: "Action", detail: "Movement intelligence supports a person reviewing the evidence. Explore the intended workflows and validation context before applying an output." },
] as const;

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
  staged = false,
  stage: controlledStage,
  onStageChange,
  sharePath,
}: {
  family: XRayFamily;
  /** What this family's modules read off the AI view. Named, never measured. */
  reads: XRayRead[];
  /** One line under the figure in human view. */
  humanCaption: string;
  /** One line under the figure in AI view. */
  aiCaption: string;
  hint?: string;
  /** Open the optional pipeline explorer; existing family pages start compact. */
  staged?: boolean;
  /** Optional controlled stage, 0–7, for a surrounding movement story. */
  stage?: number;
  onStageChange?: (stage: number) => void;
  sharePath?: string;
}) {
  const [view, setView] = useState<MovementView>("human");
  const [exploring, setExploring] = useState(staged);
  const [localStep, setLocalStep] = useState(1);
  const step = Number.isFinite(controlledStage) ? Math.max(0, Math.min(7, Math.round(controlledStage!))) : localStep;
  const setStep = (next: number) => { setLocalStep(next); onStageChange?.(next); };
  const [channel, setChannel] = useState<"ankle" | "wrist">("ankle");
  const activeView = controlledStage !== undefined ? step < 2 ? "human" : step < 6 ? "ai" : "explain" : view;
  const ai = activeView !== "human";
  const activeStep = exploring || controlledStage !== undefined ? step : ai ? 5 : 1;
  const showTrails = activeStep >= 4;
  const showSignals = activeStep >= 5;
  const explain = activeView === "explain" || activeStep >= 6;
  const labelId = useId();
  const stageId = useId();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const requested = query.get("stage");
    if (!requested || !/^xray-[0-7]$/.test(requested) || (query.has("mode") && query.get("mode") !== family)) return;
    const next = Number(requested.slice(-1));
    setLocalStep(next);
    setView(next < 2 ? "human" : next < 6 ? "ai" : "explain");
    setExploring(true);
    if (query.get("signal") === "wrist") setChannel("wrist");
  }, [family]);

  const chooseView = (next: MovementView) => {
    setView(next);
    setStep(next === "human" ? 1 : next === "ai" ? 5 : 6);
  };
  const chooseStep = (next: number) => {
    setStep(next);
    setView(next < 2 ? "human" : next < 6 ? "ai" : "explain");
  };

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
      id="movement-xray"
      className={`${styles.xray} ${
        family === "securevision" ? styles.famSecure : ""
      }`}
    >
      <MovementViewSelector
        value={activeView}
        onChange={chooseView}
        label="Reading of the same walk"
        hint={hint}
      />

      <button type="button" className={styles.exploreButton} aria-expanded={exploring} aria-controls={stageId} onClick={() => setExploring((open) => !open)}>
        {exploring ? "Close pipeline explorer" : "Trace the movement pipeline"}
        <span aria-hidden="true">{exploring ? " −" : " →"}</span>
      </button>

      {exploring && (
        <div id={stageId} className={styles.pipeline}>
          <ol className={styles.steps} aria-label="Movement interpretation stages">
            {XRAY_STAGES.map((item, index) => (
              <li key={item.name}>
                <button type="button" onClick={() => chooseStep(index)} aria-current={step === index ? "step" : undefined}>
                  <span className={styles.stepNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  {item.name}
                </button>
              </li>
            ))}
          </ol>
          <label className={styles.scrubLabel}>
            <span>Scrub the pipeline <span className={styles.stepName}>{XRAY_STAGES[step].name}</span></span>
            <input type="range" min={0} max={XRAY_STAGES.length - 1} step={1} value={step} aria-valuetext={XRAY_STAGES[step].name} onChange={(event) => chooseStep(Number(event.target.value))} />
          </label>
          <p className={styles.stageContext} aria-live="polite">{XRAY_STAGES[step].detail}</p>
          <ShareExploration path={sharePath ?? `/${family}#movement-xray`} title="GaitAI Movement X-Ray" params={{ mode: family, stage: `xray-${step}`, signal: channel }} className={styles.exploreButton} />
        </div>
      )}

      <figure className="mt-6">
        {activeStep === 0 ? (
          /* eslint-disable-next-line @next/next/no-img-element -- a fixed
             photographic plate; next/image's wrapper fights the figure box. */
          <img
            className={styles.rawFrame}
            src={assetPath(XRAY_PLATE[family].src)}
            alt={XRAY_PLATE[family].alt}
            loading="lazy"
            decoding="async"
          />
        ) : (
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
              ? `An illustrated stride as ${activeStep === 2 ? "pose landmarks" : "connected body landmarks"} at five gait events${showTrails ? ", with ankle and wrist trajectories" : ""}${showSignals ? " and two temporal signal channels" : ""}. No measured or clinical results.`
              : "A camera frame of a person walking, with the five gait events the AI view samples marked along the ground line."}
          </title>

          <line
            className={styles.ground}
            x1={40}
            y1={GROUND_Y}
            x2={W - 40}
            y2={GROUND_Y}
          />

          {/* ── HUMAN LAYER ──
              Kept mounted and faded rather than unmounted, so nothing reflows
              between views - the point of the control is that the RECORDING
              does not change, only the reading of it. */}
          <defs>
            <clipPath id={`${labelId}-plate`}>
              <rect x={plateBox(family).x} y={PLATE_Y} width={plateBox(family).w} height={PLATE_H} rx={4} />
            </clipPath>
          </defs>
          <g
            className={`${styles.layer} ${ai ? styles.layerOff : ""}`}
            aria-hidden="true"
          >
            {XRAY_STRIP[family] ? (
              XRAY_STRIP[family]!.slice(0, 5).map((src, i) => (
                <image
                  key={src}
                  href={assetPath(src)}
                  x={XS[i] - 58}
                  y={PLATE_Y}
                  width={116}
                  height={PLATE_H}
                  preserveAspectRatio="xMidYMid slice"
                  className={styles.plate}
                />
              ))
            ) : (
              <g clipPath={`url(#${labelId}-plate)`}>
                <image
                  href={assetPath(XRAY_PLATE[family].src)}
                  x={plateBox(family).x}
                  y={PLATE_Y}
                  width={plateBox(family).w}
                  height={PLATE_H}
                  preserveAspectRatio="xMidYMid slice"
                  className={styles.plate}
                />
              </g>
            )}
            <rect className={styles.plateEdge} x={plateBox(family).x} y={PLATE_Y} width={plateBox(family).w} height={PLATE_H} rx={4} />
            {/* The five instants the AI view samples, on the recording's own
                timeline - so switching views reads as "the same moments, read
                differently" without five frames being pretended. */}
            {EVENT_LABELS.map((label, i) => {
              const box = XRAY_STRIP[family] ? { x: 40, w: 632 } : plateBox(family);
              const x = box.x + 18 + ((box.w - 36) * i) / (EVENT_LABELS.length - 1);
              return (
                <g key={label}>
                  <line className={styles.eventTick} x1={x} y1={GROUND_Y - 6} x2={x} y2={GROUND_Y + 6} />
                  {/* Staggered on two rows: under a frame at its own aspect
                      the five labels would otherwise run into each other. */}
                  <text className={styles.eventLabel} x={x} y={GROUND_Y + (i % 2 ? 29 : 17)} textAnchor="middle">
                    {label}
                  </text>
                </g>
              );
            })}
          </g>

          {/* ── AI LAYER ── */}
          <g
            className={`${styles.layer} ${ai ? "" : styles.layerOff} ${activeStep === 2 ? styles.poseOnly : ""}`}
            aria-hidden="true"
          >
            {/* Footfall markers first, so the skeletons sit over them. */}
            {GAIT_PHASES.map((phase, i) => (
              <g key={`c-${phase.id}`} transform={`translate(${XS[i]} ${FIG_Y})`}>
                <PoseFrame
                  phase={phase}
                  s={S}
                  showContacts={activeStep >= 3}
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
            <g className={`${styles.layer} ${showTrails ? "" : styles.layerOff}`}>
            <path className={`${styles.trail} ${explain && channel === "ankle" ? styles.selectedTrail : ""}`} d={smoothPath(ankleTrail)} />
            <path className={`${styles.trail} ${explain && channel === "wrist" ? styles.selectedTrail : ""}`} d={smoothPath(wristTrail)} />
            {[...ankleTrail, ...wristTrail].map(([x, y], i) => (
              <circle
                key={`n-${i}`}
                className={styles.trailNode}
                cx={x}
                cy={y}
                r={1.9}
              />
            ))}
            </g>

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
                <g key={channel.label} className={`${styles.layer} ${showSignals ? "" : styles.layerOff}`}>
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
        )}

        <figcaption className="mt-4 text-[13.5px] leading-relaxed text-soft-gray">
          {activeStep === 0 ? "A camera frame, as recorded. The steps that follow read shared gait keyframes, not this frame." : ai ? aiCaption : humanCaption}
        </figcaption>
      </figure>

      {explain && (
        <section className={styles.explanation} aria-label="Why this signal is shown">
          <h3>Why is this signal shown?</h3>
          <div className={styles.channelChoices} role="group" aria-label="Explain a movement channel">
            <button type="button" aria-pressed={channel === "ankle"} onClick={() => setChannel("ankle")}>Ankle height</button>
            <button type="button" aria-pressed={channel === "wrist"} onClick={() => setChannel("wrist")}>Wrist swing</button>
          </div>
          <p>{channel === "ankle" ? "The highlighted trajectory follows the ankle across five illustrated gait events. Its vertical position produces the ankle-height trace. This can help explain when a foot rises; it does not measure stride length, diagnose gait or estimate fall risk." : "The highlighted trajectory follows the wrist across the same illustrated stride. Its horizontal position produces the wrist-swing trace. It shows how a joint changes position; a recording would also need camera-motion and visibility checks before interpretation."}</p>
          <p className={styles.limitation}>Illustrative Demo · Shared keyframes, not inference from the frame shown. No clinical, identity or safety conclusion is generated here.</p>
        </section>
      )}

      {exploring && step === 7 && (
        <div className={styles.actions}>
          <Link href={`/${family}`}>{family === "mobilitycare" ? "Explore MobilityCare" : "Explore SecureVision"} →</Link>
          <Link href="/movement-lab#analyze">Try browser movement analysis →</Link>
        </div>
      )}

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

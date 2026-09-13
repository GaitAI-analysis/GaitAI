"use client";

import { useEffect, useId, useState } from "react";
import { SequenceFrame, sequenceFrames, sequencePoint, SEQUENCE_CAPTION, SEQUENCE_SOURCE_URL } from "./SequenceFrame";
import Link from "next/link";
import { type Pt } from "./gait-phases";
import { smoothPath } from "@/components/research/PoseFrame";
import { MovementViewSelector, type MovementView } from "./MovementViewSelector";
import { ShareExploration } from "@/components/ui/ShareExploration";
import styles from "./xray.module.css";

/** Same recorded input frames -> their model output -> contextual explanation. */
export type XRayFamily = "mobilitycare" | "securevision";
const XS = [96,226,356,486,616];
const TRACE_H = 26;
const TRACE_X = 96;
const TRACE_W = 520;

/** A named channel, and one line on what reads it. No values. */
export interface XRayRead {
  label: string;
  detail: string;
}

const XRAY_STAGES = [
  { name: "Camera input", detail: "A recorded demonstration walking sequence with the same person, clothes, camera and environment. Not a patient or surveillance recording." },
  { name: "Silhouette", detail: "The foreground mask is extracted from each corresponding input frame. Body shape can still carry identifying information." },
  { name: "Pose", detail: "Landmarks describe where joints are in each frame. Visibility matters: an obscured joint cannot be treated as a reliable observation." },
  { name: "Skeleton", detail: "Connections between landmarks reveal body structure. A skeleton represents estimated positions, not a diagnosis or proof of identity." },
  { name: "Temporal trajectories", detail: "Following the ankle and wrist through this illustrated stride reveals their paths over time." },
  { name: "Motion signals", detail: "Ankle height and wrist swing become temporal channels. These traces come from the same estimated keypoints. This short excerpt does not establish cadence or symmetry." },
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
  hint = "Switch the view",
  staged = false,
  stage: controlledStage,
  onStageChange,
  sharePath,
}: {
  family: XRayFamily;
  /** What this family's modules read off the AI view. Named, never measured. */
  reads: XRayRead[];
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
  const [localStep, setLocalStep] = useState(0);
  const step = Number.isFinite(controlledStage) ? Math.max(0, Math.min(7, Math.round(controlledStage!))) : localStep;
  const setStep = (next: number) => { setLocalStep(next); onStageChange?.(next); };
  const [channel, setChannel] = useState<"ankle" | "wrist">("ankle");
  const stageDetail = family === "securevision" && step === 0
    ? "A recorded demonstration sequence: the same walker, clothes, environment and camera across all five moments."
    : family === "securevision" && step === 3
      ? "Connections between landmarks reveal body structure. A skeleton represents estimated positions; a safety event also requires temporal context and operator review."
      : XRAY_STAGES[step].detail;
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
    setStep(next === "human" ? 0 : next === "ai" ? 5 : 6);
  };
  const chooseStep = (next: number) => {
    setStep(next);
    setView(next < 2 ? "human" : next < 6 ? "ai" : "explain");
  };

  /* Absolute positions of two landmarks across the stride, so a trajectory is
     a path through the figures rather than a decoration inside one of them. */
  const landmarkPoint = (i: number, joint: number): Pt => sequencePoint(i,joint,{x:XS[i]-58,y:6,width:116,height:180});
  const ankleTrail = sequenceFrames.map((_,i)=>landmarkPoint(i,28));
  const wristTrail = sequenceFrames.map((_,i)=>landmarkPoint(i,16));
  const ankleHeight = sequenceFrames.map(f=>-f.landmarks[28].y);
  const wristSwing = sequenceFrames.map(f=>f.landmarks[16].x);

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
          <p className={styles.stageContext} aria-live="polite">{stageDetail}</p>
          <ShareExploration path={sharePath ?? `/${family}#movement-xray`} title="GaitAI Movement X-Ray" params={{ mode: family, stage: `xray-${step}`, signal: channel }} className={styles.exploreButton} />
        </div>
      )}

      <figure className="mt-6">
        <div className={styles.scroller}>
          <svg viewBox="0 0 712 300" className={styles.frame} role="img" aria-labelledby={labelId}>
            <title id={labelId}>{`${SEQUENCE_CAPTION} ${ai ? "Estimated keypoints at the same five moments." : "Five recorded frames of the same recorded walk."}`}</title>
            {sequenceFrames.map((frame, i) => (
              <g key={frame.source}>
                <SequenceFrame index={i} x={XS[i]-58} y={6} width={116} height={180} view={ai ? (activeStep===2 ? "keypoints" : "pose") : (exploring && step===1 ? "mask" : "source")} overlay={explain}/>
                <text className={styles.eventLabel} x={XS[i]} y={204} textAnchor="middle">{frame.moment.toLowerCase()}</text>
              </g>
            ))}
            {ai && showTrails && <g fill="none"><path className={styles.trail} d={smoothPath(ankleTrail)}/><path className={styles.trail} d={smoothPath(wristTrail)}/></g>}
            {ai && showSignals && <g fill="none">
              <text className={styles.traceLabel} x={40} y={240}>Ankle height</text><path className={styles.trace} d={traceD(ankleHeight,222)}/>
              <text className={styles.traceLabel} x={40} y={280}>Wrist position</text><path className={styles.trace} d={traceD(wristSwing,262)}/>
            </g>}
          </svg>
        </div>
        <figcaption className="mt-4 text-[13.5px] leading-relaxed text-soft-gray">{SEQUENCE_CAPTION} <a className="underline" href={SEQUENCE_SOURCE_URL} target="_blank" rel="noreferrer">Source footage</a></figcaption>
        {explain && <p className="mt-3 text-sm leading-relaxed text-soft-gray">Heel contact, weight acceptance, stance, toe-off and swing are illustrative annotations of these moments. A longer timed recording and capture-quality review are required for cadence, symmetry or clinical interpretation.</p>}
      </figure>

      {explain && (
        <section className={styles.explanation} aria-label="Why this signal is shown">
          <h3>Why is this signal shown?</h3>
          <div className={styles.channelChoices} role="group" aria-label="Explain a movement channel">
            <button type="button" aria-pressed={channel === "ankle"} onClick={() => setChannel("ankle")}>Ankle height</button>
            <button type="button" aria-pressed={channel === "wrist"} onClick={() => setChannel("wrist")}>Wrist swing</button>
          </div>
          <p>{channel === "ankle" ? family === "securevision" ? "The highlighted trajectory follows the ankle across five illustrated movement events. Its vertical position produces the ankle-height trace. This shows how a foot moves; detecting a fall or other safety event also requires temporal context and visibility checks." : "The highlighted trajectory follows the ankle across five illustrated gait events. Its vertical position produces the ankle-height trace. This can help explain when a foot rises; it does not measure stride length, diagnose gait or estimate fall risk." : "The highlighted trajectory follows the wrist across the same illustrated stride. Its horizontal position produces the wrist-swing trace. It shows how a joint changes position; a recording would also need camera-motion and visibility checks before interpretation."}</p>
          <p className={styles.limitation}>Illustrative Demo · Pose estimates and segmentation from the displayed frames. {family === "securevision" ? "No identity or safety conclusion is generated here." : "No clinical, identity or safety conclusion is generated here."}</p>
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

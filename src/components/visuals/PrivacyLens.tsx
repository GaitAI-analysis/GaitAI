"use client";

import { useId, useState } from "react";
import { GAIT_PHASES, GAIT_HEAD, type Pt } from "./gait-phases";
import { assetPath } from "@/lib/paths";
import { PoseFrame, smoothPath } from "@/components/research/PoseFrame";
import { AnalyticsPipeline } from "@/components/analytics/AnalyticsPipeline";
import {
  PRIVACY_LENS_APPLIES_TO,
  PRIVACY_LENS_BOUNDARY,
  privacyStages,
} from "@/data/privacy-lens";
import styles from "./privacyLens.module.css";

/**
 * PRIVACY LENS — sensing → privacy transformed → movement intelligence.
 *
 * "Identity-free safety intelligence" is the SecureVision proposition and, as
 * a sentence, a reader cannot check it. This is the version they can look at:
 * one person, three steps, and information visibly leaving at each one.
 *
 * IT REPLACES A LIST, NOT A DEMO. The PrivacyGuard block used to show six
 * indented rows of text — "Raw video feed", "Face blur · skeleton
 * extraction", "Movement features only", then three governance rows — all in
 * the same visual stack, which read as though role-based access were another
 * transformation of the video. The three processing steps are now an
 * instrument, and the governance controls are stated separately, because they
 * are controls over who may see step three's output rather than steps four to
 * six of a pipeline.
 *
 * THE FIGURE NEVER RELOADS. All three renderings stay mounted and cross-fade
 * over one body. Watching the SAME person lose information is the argument the
 * instrument is making; three separate pictures side by side would only assert
 * it, and a reflow between steps would break it.
 *
 * WHAT IT IS FORBIDDEN FROM CLAIMING. Not anonymity — pose and gait can
 * themselves be identifying, which is this company's own research subject, so
 * the wording is minimisation and transformation throughout. Not universality
 * — the identity and investigation modules are a separate governed group that
 * retains identity-bearing information by design, and the scope line says so
 * on screen rather than in a footnote. Not measurement — the retained-
 * information indicator is a relative shape with no scale and no number,
 * because the only thing that is honestly assertable is the ordering: each
 * step carries strictly less than the one before. See data/privacy-lens.ts.
 */

const W = 300;
const H = 188;
const FIG_X = 150;
const FIG_Y = 122;
const S = 1.35;
const GROUND_Y = FIG_Y + 48 * S;

/** Mid-stance: the most legible single pose in the keyframe set. */
const PHASE = GAIT_PHASES[2];

/**
 * THE SENSING STEP IS A PHOTOGRAPH.
 * "What a camera holds before anything has been done to it" was drawn as a
 * solid figure — a mannequin standing in for footage, on the one page whose
 * entire argument is what real footage contains. It is now the site's real
 * capture plate (see scripts/build-capture-plate.py: the project's own asset,
 * reframed), inside a frame that matches the plate's own aspect so nothing is
 * stretched. Step two keeps the photograph but blurs the head and lays the
 * keypoint skeleton over the person; step three is unchanged — the photograph
 * is gone and only the ankle's path remains. The skeleton's placement over the
 * walker is by eye against the plate, not a detection: this is an
 * illustration of a transformation, and says so in its title.
 */
const PLATE = "/assets/images/capture/cctv-walk-frame.jpg";
const PLATE_W = 180;
const PLATE_H = 188;
const PLATE_X = FIG_X - PLATE_W / 2;
/* Where the walker stands inside the plate, in stage units. */
const WALKER_HIP: Pt = [151, 100];
const WALKER_S = 1.66;
const HEAD_BLUR: { cx: number; cy: number; r: number } = { cx: 149, cy: 35, r: 12 };

export function PrivacyLens() {
  const [index, setIndex] = useState(0);
  const stage = privacyStages[index];
  const labelId = useId();

  /* Step three: the ankle's path through the stride, which is what remains
     once the person is gone. Real keyframe coordinates, compressed into the
     figure's box so the trace sits where the body was. */
  const trail: Pt[] = GAIT_PHASES.map((phase, i) => [
    FIG_X + (i - 2) * 26 + phase.nearLeg[2][0] * 0.4,
    FIG_Y + phase.nearLeg[2][1] * S * 0.55 - 8,
  ]);

  /* The landmarks, faded, so step three reads as "what is left of that" and
     not as an unrelated diagram. */
  const joints: readonly Pt[] = [...PHASE.nearArm, ...PHASE.nearLeg, GAIT_HEAD];

  return (
    <div className={styles.lens}>
      <AnalyticsPipeline
        stages={privacyStages.map((entry) => ({
          id: entry.id,
          name: entry.label,
          note: entry.lead,
        }))}
        activeId={stage.id}
        onSelect={(id) => {
          const next = privacyStages.findIndex((entry) => entry.id === id);
          if (next >= 0) setIndex(next);
        }}
        label="Processing step"
      />

      <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-[minmax(0,17rem)_1fr] sm:items-start">
        {/* ── THE FIGURE ── */}
        <figure className="min-w-0">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className={styles.frame}
            role="img"
            aria-labelledby={labelId}
          >
            <title id={labelId}>
              {stage.render === "body"
                ? "A camera frame of a person walking past a concrete wall — face, clothing and scene all present."
                : stage.render === "skeleton"
                  ? "The same frame with the head blurred and a pose skeleton of keypoints laid over the walker, placed by eye for illustration."
                  : "The frame is gone: faint keypoints and the path the ankle traces across a stride."}
            </title>

            <line
              className={styles.ground}
              x1={16}
              y1={GROUND_Y}
              x2={W - 16}
              y2={GROUND_Y}
            />

            <defs>
              <clipPath id="pl-plate">
                <rect x={PLATE_X} y={0} width={PLATE_W} height={PLATE_H} rx={3} />
              </clipPath>
              <clipPath id="pl-head">
                <circle cx={HEAD_BLUR.cx} cy={HEAD_BLUR.cy} r={HEAD_BLUR.r} />
              </clipPath>
              <filter id="pl-blur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.2" />
              </filter>
              <radialGradient id="pl-vignette" cx="50%" cy="46%" r="72%">
                <stop offset="58%" stopColor="#000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
              </radialGradient>
            </defs>

            {/* 01 SENSING — the frame as recorded. */}
            <g
              className={`${styles.layer} ${
                stage.render === "body" ? "" : styles.layerOff
              }`}
              aria-hidden="true"
            >
              <g clipPath="url(#pl-plate)">
                <image
                  href={assetPath(PLATE)}
                  x={PLATE_X}
                  y={0}
                  width={PLATE_W}
                  height={PLATE_H}
                  preserveAspectRatio="xMidYMid slice"
                  className={styles.plate}
                />
                <rect x={PLATE_X} y={0} width={PLATE_W} height={PLATE_H} fill="url(#pl-vignette)" />
              </g>
              <rect x={PLATE_X} y={0} width={PLATE_W} height={PLATE_H} rx={3} className={styles.plateEdge} />
              <circle cx={PLATE_X + 9} cy={10} r={2} className={styles.rec} />
              <text x={PLATE_X + 14} y={12} className={styles.camText}>REC</text>
              <text x={PLATE_X + PLATE_W - 6} y={12} textAnchor="end" className={styles.camText}>CAM 03</text>
              <text x={PLATE_X + 6} y={PLATE_H - 6} className={styles.camStamp}>09:41:07</text>
            </g>

            {/* 02 PRIVACY TRANSFORMED — same frame, face gone, geometry kept. */}
            <g
              className={`${styles.layer} ${
                stage.render === "skeleton" ? "" : styles.layerOff
              }`}
              aria-hidden="true"
            >
              <g clipPath="url(#pl-plate)" className={styles.plateFaded}>
                <image
                  href={assetPath(PLATE)}
                  x={PLATE_X}
                  y={0}
                  width={PLATE_W}
                  height={PLATE_H}
                  preserveAspectRatio="xMidYMid slice"
                  className={styles.plate}
                />
                {/* The blur is a real blur of the real pixels, clipped to the
                    head, not a drawn disc pretending to be one. */}
                <g clipPath="url(#pl-head)">
                  <image
                    href={assetPath(PLATE)}
                    x={PLATE_X}
                    y={0}
                    width={PLATE_W}
                    height={PLATE_H}
                    preserveAspectRatio="xMidYMid slice"
                    filter="url(#pl-blur)"
                  />
                </g>
                <circle cx={HEAD_BLUR.cx} cy={HEAD_BLUR.cy} r={HEAD_BLUR.r} className={styles.blurRing} />
              </g>
              <rect x={PLATE_X} y={0} width={PLATE_W} height={PLATE_H} rx={3} className={styles.plateEdge} />
              <g transform={`translate(${WALKER_HIP[0]} ${WALKER_HIP[1]})`}>
                <PoseFrame
                  phase={PHASE}
                  s={WALKER_S}
                  classes={{
                    bone: styles.bone,
                    boneFar: styles.boneFar,
                    joint: styles.joint,
                    head: styles.head,
                  }}
                />
              </g>
            </g>

            {/* 03 MOVEMENT INTELLIGENCE */}
            <g
              className={`${styles.layer} ${
                stage.render === "signal" ? "" : styles.layerOff
              }`}
              aria-hidden="true"
            >
              <g transform={`translate(${FIG_X} ${FIG_Y})`}>
                {joints.map(([jx, jy], i) => (
                  <circle
                    key={i}
                    className={styles.signalDot}
                    cx={jx * S}
                    cy={jy * S}
                    r={1.8}
                  />
                ))}
              </g>
              <path className={styles.trail} d={smoothPath(trail)} />
              {trail.map(([tx, ty], i) => (
                <circle
                  key={`t${i}`}
                  className={styles.trailNode}
                  cx={tx}
                  cy={ty}
                  r={2}
                />
              ))}
            </g>
          </svg>

          {/* Relative, unlabelled, and it only ever falls. */}
          <figcaption className="mt-5">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-soft-mute">
              Information retained
            </span>
            <div className={`${styles.retainedTrack} mt-2`}>
              <div
                className={styles.retainedFill}
                style={{ width: `${stage.retained * 100}%` }}
              />
            </div>
            <span className="mt-2 block text-[11.5px] leading-relaxed text-soft-mute">
              Relative and unmeasured. Each step carries strictly less than the
              one before it, which is the only thing this shape asserts.
            </span>
          </figcaption>
        </figure>

        {/* ── WHAT IS HERE, AND WHAT HAS GONE ── */}
        <div className="min-w-0">
          <p className="text-[15px] leading-relaxed text-soft-white">
            {stage.lead}
          </p>

          <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div className="min-w-0">
              <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                Present at this step
              </h4>
              <ul className="mt-3 grid gap-1.5">
                {stage.carries.map((item) => (
                  <li
                    key={item}
                    className="text-[13px] leading-snug text-soft-gray"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-0">
              <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-soft-mute">
                Not available after this step
              </h4>
              {stage.drops.length === 0 ? (
                <p className="mt-3 text-[13px] leading-snug text-soft-mute">
                  Nothing further is removed here — this is what the module
                  reads.
                </p>
              ) : (
                <ul className="mt-3 grid gap-1.5">
                  {stage.drops.map((item) => (
                    <li
                      key={item}
                      className="text-[13px] leading-snug text-soft-mute line-through decoration-soft-mute/50"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* The scope line. On screen, never in a footnote: a three-step
              diagram invites the assumption that all eleven SecureVision
              modules follow it, and the identity group does not. */}
          <p className="mt-7 border-l border-amber-300/30 pl-4 text-[12.5px] leading-relaxed text-soft-mute">
            {PRIVACY_LENS_APPLIES_TO}
          </p>

          <p className="mt-4 text-[12.5px] leading-relaxed text-soft-mute">
            {PRIVACY_LENS_BOUNDARY}
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { GAIT_PHASES } from "@/components/visuals/gait-phases";
import {
  PLATE,
  WALKER_HEAD,
  WALKER_MASK,
  WALKER_PHASE,
  plateFit,
  walkerStride,
} from "@/components/visuals/capture-plate";
import { PoseFrame, smoothPath } from "@/components/research/PoseFrame";
import { trackInsightEvent } from "@/lib/insight-events";
import { assetPath } from "@/lib/paths";
import { InteractiveFigure } from "../InteractiveFigure";
import { StageControl, type Stage } from "../StageControl";
import { ShareInsight, useSharedFigureState } from "../ShareInsight";
import { useNarrow } from "../useNarrow";
import type { FigureProps } from "../registry";
import {
  CUES,
  REPRESENTATIONS,
  REPRESENTATION_LABEL,
  VERDICT_LABEL,
  identityLedger,
  identityVerdict,
  isRepresentation,
  type Representation,
} from "./identity-model";
import fig from "../figures.module.css";
import ui from "../experience.module.css";

/**
 * CAN A SKELETON STILL REVEAL IDENTITY — the ledger that refuses to reach zero.
 *
 *   ┌─ the frame ─────┐   What could still identify this person
 *   │  RGB → face     │   Face                removed
 *   │  removed →      │   Clothing & colour   removed
 *   │  silhouette →   │   Build & proportions weakened
 *   │  skeleton →     │   Gait pattern        present
 *   │  trajectories   │   Time & place        weakened
 *   └─────────────────┘   ▸ Identifiable to a model
 *   [ kept over time ] [ linked to other data ]
 *
 * A stage control strips the frame down; the ledger says what each of five
 * kinds of identifying information becomes — present, weakened, removed — and
 * a verdict names the situation in a phrase. Two toggles are the essay's
 * point: KEPT OVER TIME turns a weakened gait pattern back into a signature;
 * LINKED TO OTHER DATA turns time and place into a name. Neither changes the
 * picture. Both change what it means.
 *
 * QUALITATIVE and labelled so. No re-identification rate is stated or implied.
 */

const W = 640;
const H = 360;
const FRAME = { x: 40, y: 30, w: 250, h: 300 };
const PANEL_X = 328;

/**
 * THE FRAME IS A PHOTOGRAPH, and every later stage is derived from it.
 * RGB used to be a drawn body with four "clothing" lines and two dots for a
 * face, on a grid of drawn pixels — an illustration labelled RGB. The frame is
 * now the site's real capture plate, "face removed" blocks the head the
 * photograph actually has, the silhouette is that walker's own segmentation
 * mask, the skeleton is that walker's joints, and the trajectories are the
 * stride those joints imply. See visuals/capture-plate.ts.
 */
const FIT = plateFit("portrait", FRAME);
const [FX, FY] = FIT.hip;
const S = FIT.poseScale;
const HEAD = FIT.at([WALKER_HEAD.cx, WALKER_HEAD.cy]);
const HEAD_R = WALKER_HEAD.r * FIT.scale;

const CLASSES = { bone: fig.bone, boneFar: fig.boneFar, joint: fig.joint, head: fig.head };

const DESCRIPTION = `A walking figure stripped down in five steps — RGB, face removed, silhouette, skeleton, joint trajectories — beside a ledger of five kinds of identifying information: face, clothing and colour, build and proportions, gait pattern, and time and place. At each step the ledger says whether each is present, weakened or removed, and a verdict names the situation: identifiable, still identifiable, identifiable to a model, hard to identify alone.
Two toggles change the ledger without changing the picture. Kept over time: observations can be matched across days, so a weakened gait pattern becomes a recurring signature and the verdict for trajectories becomes re-identifiable by pattern. Linked to other data: time and place can be joined to something that names a person, and the verdict for any reduced representation becomes identifiable by linkage.
Qualitative: the ledger states the essay's argument in words; it is not a measurement of anyone's re-identifiability.`;

const STAGES: Stage[] = REPRESENTATIONS.map((value) => ({ id: value, label: REPRESENTATION_LABEL[value], name: REPRESENTATION_LABEL[value] }));
/** Shorter track labels for phones, where five long words collide. */
const SHORT_LABEL: Record<Representation, string> = { rgb: "RGB", "face-removed": "No face", silhouette: "Silhouette", skeleton: "Skeleton", trajectories: "Paths" };
const STAGES_NARROW: Stage[] = REPRESENTATIONS.map((value) => ({ id: value, label: SHORT_LABEL[value], name: REPRESENTATION_LABEL[value] }));

export function IdentityLayersExplorer({ articleSlug, presentation }: FigureProps) {
  const shared = useSharedFigureState("identity-layers-explorer");
  const [representation, setRepresentation] = useState<Representation>(() =>
    isRepresentation(presentation?.representation) ? presentation.representation : "rgb",
  );
  const [persisted, setPersisted] = useState<boolean>(() => presentation?.persisted === true);
  const [linked, setLinked] = useState<boolean>(() => presentation?.linked === true);
  const stacked = useNarrow(640);
  const reached = useRef({ end: false, toggled: false });

  useEffect(() => {
    if (!shared) return;
    if (isRepresentation(shared.representation)) setRepresentation(shared.representation);
    if (typeof shared.persisted === "boolean") setPersisted(shared.persisted);
    if (typeof shared.linked === "boolean") setLinked(shared.linked);
  }, [shared]);
  useEffect(() => {
    if (!presentation) return;
    if (isRepresentation(presentation.representation)) setRepresentation(presentation.representation);
    setPersisted(presentation.persisted === true);
    setLinked(presentation.linked === true);
  }, [presentation]);

  const complete = () => {
    if (presentation || !reached.current.end || !reached.current.toggled) return;
    trackInsightEvent(
      "interactive_figure_complete",
      { article_slug: articleSlug, figure_id: "identity-layers-explorer" },
      { once: "identity-layers-explorer" },
    );
  };
  const chooseRepresentation = (next: Representation) => {
    setRepresentation(next);
    if (presentation) return;
    trackInsightEvent("privacy_representation_changed", { article_slug: articleSlug, representation: next }, { debounce: "identity" });
    if (next === "trajectories") reached.current.end = true;
    complete();
  };
  const toggle = (which: "persisted" | "linked") => {
    if (which === "persisted") setPersisted((v) => !v);
    else setLinked((v) => !v);
    if (presentation) return;
    trackInsightEvent("privacy_representation_changed", { article_slug: articleSlug, representation: `${representation}+${which}` });
    reached.current.toggled = true;
    complete();
  };

  const context = { persisted, linked };
  const ledger = identityLedger(representation, context);
  const verdict = identityVerdict(representation, context);
  const phase = WALKER_PHASE;
  const groundY = FY + 48 * S;
  const stage = REPRESENTATIONS.indexOf(representation);

  /* The stride scaled to this walker: earlier moments of the same walk behind
     the photographed one, and the paths three joints trace through them. */
  const stride = walkerStride(FIT, GAIT_PHASES, 6);
  const trails = {
    ankle: smoothPath(stride.map((m) => m.pick((p) => p.nearLeg[2]))),
    wrist: smoothPath(stride.map((m) => m.pick((p) => p.nearArm[2]))),
    hip: smoothPath(stride.map((m) => m.pick((p) => p.nearLeg[0]))),
  };

  const viewBox = stacked ? "0 0 322 640" : `0 0 ${W} ${H}`;
  const panelTransform = stacked ? `translate(${-PANEL_X + 20} 340)` : undefined;
  const ROW = stacked ? 40 : 36;

  const svg = (
    <svg viewBox={viewBox} className={`${fig.svg} ${stacked ? fig.narrow : ""}`} aria-hidden="true" style={{ maxHeight: stacked ? undefined : 380, margin: "0 auto" }}>
      {/* ── the frame ── */}
      <rect className={fig.frame} x={FRAME.x} y={FRAME.y} width={FRAME.w} height={FRAME.h} rx={3} />
      <text className={`${fig.label} ${fig.labelInk}`} x={FRAME.x + 10} y={FRAME.y + 16}>
        {REPRESENTATION_LABEL[representation]}
      </text>
      <line className={fig.ground} x1={FRAME.x + 12} y1={groundY} x2={FRAME.x + FRAME.w - 12} y2={groundY} />
      <defs>
        <clipPath id="idl-frame">
          <rect x={FRAME.x} y={FRAME.y} width={FRAME.w} height={FRAME.h} rx={3} />
        </clipPath>
      </defs>
      <g clipPath="url(#idl-frame)">
        {/* RGB, and face removed: the photograph. Faint under the mask so the
            mask reads as cut from it; gone after that. */}
        <g className={fig.fade} style={{ opacity: stage <= 1 ? 1 : stage === 2 ? 0.14 : 0 }}>
          <image
            href={assetPath(PLATE.portrait.src)}
            x={FRAME.x}
            y={FRAME.y}
            width={FRAME.w}
            height={FRAME.h}
            preserveAspectRatio="xMidYMid slice"
            className={fig.photo}
          />
        </g>
        {/* face removed: the block sits on the head the photograph has */}
        <rect
          className={`${fig.fade} ${fig.redact}`}
          style={{ opacity: stage === 1 ? 1 : 0 }}
          x={HEAD[0] - HEAD_R - 3}
          y={HEAD[1] - HEAD_R - 4}
          width={HEAD_R * 2 + 6}
          height={HEAD_R * 2 + 8}
          rx={2}
        />
        {/* silhouette: the walker's own segmentation, traced from the frame */}
        <g className={fig.fade} style={{ opacity: stage === 2 ? 1 : stage === 3 ? 0.2 : 0 }} transform={FIT.transform}>
          <path className={fig.segMask} d={WALKER_MASK.path} />
        </g>
      </g>
      {/* skeleton: that walker's joints */}
      <g className={fig.fade} style={{ opacity: stage === 3 ? 1 : stage === 4 ? 0.3 : 0 }} transform={`translate(${FX} ${FY})`}>
        <PoseFrame phase={phase} s={S} classes={CLASSES} />
      </g>
      {/* trajectories */}
      <g className={fig.fade} style={{ opacity: stage === 4 ? 1 : 0 }}>
        <path className={fig.trace} d={trails.ankle} />
        <path className={`${fig.trace} ${fig.traceViolet}`} d={trails.wrist} />
        <path className={`${fig.trace} ${fig.traceRoyal} ${fig.traceThin}`} d={trails.hip} />
        {stride.map((m, i) => {
          const [nx, ny] = m.pick((p) => p.nearArm[2]);
          return <circle key={i} className={fig.nodeViolet} cx={nx} cy={ny} r={2} />;
        })}
      </g>
      {/* the two context facts, drawn onto the frame as marks */}
      <g className={fig.fade} style={{ opacity: persisted ? 1 : 0 }}>
        {[0, 1, 2].map((i) => (
          <rect key={i} className={fig.frame} x={FRAME.x + 12 + i * 6} y={FRAME.y + FRAME.h - 34 - i * 4} width={38} height={22} rx={2} />
        ))}
        <text className={`${fig.label} ${fig.labelSmall}`} x={FRAME.x + 60} y={FRAME.y + FRAME.h - 16}>
          kept · day after day
        </text>
      </g>
      <g className={fig.fade} style={{ opacity: linked ? 1 : 0 }}>
        <line className={fig.dash} x1={FRAME.x + FRAME.w - 12} y1={FRAME.y + 40} x2={FRAME.x + FRAME.w - 12} y2={FRAME.y + 80} style={{ stroke: "var(--jr-violet)" }} />
        <text className={`${fig.label} ${fig.labelSmall} ${fig.labelViolet}`} x={FRAME.x + FRAME.w - 12} y={FRAME.y + 96} textAnchor="end">
          linked
        </text>
      </g>

      {/* ── the ledger ── */}
      <g transform={panelTransform}>
        <text className={`${fig.label} ${fig.labelInk}`} x={PANEL_X} y={FRAME.y + 16}>
          What could still identify this person
        </text>
        <text className={`${fig.label} ${fig.labelSmall}`} x={PANEL_X} y={FRAME.y + 32}>
          {REPRESENTATION_LABEL[representation].toLowerCase()} · qualitative
        </text>
        {CUES.map((cue, i) => {
          const y = FRAME.y + 66 + i * ROW;
          const state = ledger[cue.id];
          return (
            <g key={cue.id}>
              <text className={`${fig.label} ${fig.labelKey}`} x={PANEL_X} y={y}>
                {cue.label}
              </text>
              <line className={fig.hair} x1={PANEL_X} y1={y + 8} x2={PANEL_X + 282} y2={y + 8} />
              <text
                className={`${fig.label} ${fig.labelSmall} ${state === "present" ? fig.labelWarn : state === "weakened" ? fig.labelAccent : fig.labelTeal}`}
                x={PANEL_X + 282}
                y={y}
                textAnchor="end"
              >
                {state}
              </text>
            </g>
          );
        })}
        <text className={`${fig.label} ${fig.labelSmall}`} x={PANEL_X} y={FRAME.y + 66 + CUES.length * ROW + 4}>
          verdict
        </text>
        <text
          className={`${fig.label} ${fig.labelKey} ${verdict === "hard-to-identify-alone" ? fig.labelTeal : fig.labelWarn}`}
          x={PANEL_X}
          y={FRAME.y + 66 + CUES.length * ROW + 24}
        >
          {VERDICT_LABEL[verdict]}
        </text>
      </g>
    </svg>
  );

  if (presentation) return <div>{svg}</div>;

  const caption =
    verdict === "identifiable-by-linkage"
      ? "Nothing in the picture changed. Joined to data that names a person, time and place become a name, and the representation no longer matters."
      : verdict === "re-identifiable-by-pattern"
        ? "Alone, a trajectory identifies almost no one. Kept and matched across days, the same rhythm at the same door becomes a signature."
        : representation === "rgb"
          ? "Everything a camera holds: face, clothing, build, gait and context. The starting point, and what minimisation at the edge is for."
          : representation === "face-removed"
            ? "The most recognisable region is gone. Four of the five layers are untouched; in a small population they narrow a person down to a handful."
            : representation === "trajectories"
              ? "The leanest representation: minimal image information, a weakened gait pattern, and time and place still attached."
              : "Appearance is gone and shape and gait remain — the representations gait recognition was built on. Identity stops being visible to a person and starts being visible to a model.";

  return (
    <InteractiveFigure
      id="identity-layers-explorer"
      articleSlug={articleSlug}
      eyebrow="Interactive hero"
      title="Strip the frame down, and keep the ledger"
      status="conceptual"
      hint="scrub"
      hero
      minHeight="420px"
      description={DESCRIPTION}
      caption={
        <>
          <strong>{VERDICT_LABEL[verdict]}.</strong> {caption}
        </>
      }
      actions={
        <ShareInsight
          figureId="identity-layers-explorer"
          state={{ representation, persisted, linked }}
          label="Share this ledger"
          articleSlug={articleSlug}
        />
      }
    >
      {svg}
      <StageControl
        stages={stacked ? STAGES_NARROW : STAGES}
        value={stage}
        onChange={(next) => chooseRepresentation(REPRESENTATIONS[Math.max(0, Math.min(4, next))])}
        ariaLabel="Representation"
        hint="Drag the track, tap a stage, or use ← →"
        dense={false}
      />
      <div className={`${ui.chips} mt-3`} role="group" aria-label="Deployment facts">
        <button type="button" aria-pressed={persisted} onClick={() => toggle("persisted")} className={`${ui.chip} ${persisted ? ui.chipOn : ""}`}>
          Kept over time
        </button>
        <button type="button" aria-pressed={linked} onClick={() => toggle("linked")} className={`${ui.chip} ${linked ? ui.chipOn : ""}`}>
          Linked to other data
        </button>
      </div>
    </InteractiveFigure>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { GAIT_HEAD, GAIT_PHASES } from "@/components/visuals/gait-phases";
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
import { useFigureActive } from "../useFigureActive";
import { useNarrow } from "../useNarrow";
import type { FigureProps } from "../registry";
import fig from "../figures.module.css";
import ui from "../experience.module.css";

/**
 * THE PRIVACY TRANSFORMATION — drag from identity-rich to movement-minimised.
 *
 *   RAW RGB → FACE REDACTED → SILHOUETTE → POSE → SKELETON → TRAJECTORY → MINIMISED OUTPUT
 *
 * One walker, walking, loses appearance stage by stage while its movement is
 * kept. Two indicators beneath say, qualitatively, how much MOVEMENT
 * information and how much IDENTITY-BEARING VISUAL information remains — as
 * High / Medium / Low, never a percentage.
 *
 * What it does not claim: that a skeleton is anonymous. Pose and gait can
 * themselves carry identifying information (this company's own research
 * subject), so the identity indicator never reaches "none", and the notes
 * say that the privacy property depends on implementation, storage and
 * deployment, not on the diagram.
 */

const STAGES: Stage[] = [
  { id: "rgb", label: "RGB", name: "Raw RGB" },
  { id: "redacted", label: "Redacted", name: "Face redacted" },
  { id: "silhouette", label: "Silhouette", name: "Silhouette" },
  { id: "pose", label: "Pose", name: "Pose landmarks" },
  { id: "skeleton", label: "Skeleton", name: "Skeleton" },
  { id: "trajectory", label: "Trajectory", name: "Trajectory" },
  { id: "minimised", label: "Output", name: "Minimised output" },
];
const PRINTED = [0, 2, 4, 5, 6];

type Level = 0 | 1 | 2 | 3; // none · low · medium · high
const LEVEL_LABEL = ["None", "Low", "Medium", "High"] as const;
const MOVEMENT: Level[] = [3, 3, 3, 3, 3, 2, 1];
const IDENTITY: Level[] = [3, 3, 2, 1, 1, 1, 1];
const NOTES = [
  "Everything the camera saw: face, clothing, build, background. The movement is in here, but so is everyone's identity.",
  "The most recognisable region is removed at the edge. Clothing, build and gait remain visible — redaction alone is a small step.",
  "Shape without texture. Colour, face and clothing detail are gone; build and gait are still there.",
  "A handful of landmarks. Appearance is discarded; the geometry of the movement is kept.",
  "Joints and bones only. Direct visual identity is far lower — but pose and gait can themselves be identifying. Lower is not none.",
  "The path movement leaves through time. Minimal image information; temporal movement representation retained.",
  "What leaves the system: a count, a flow, an event. Whether this is private depends on what was stored on the way here, for how long, and who can reach it.",
];

const W = 640;
const H = 340;
const FRAME = { x: 30, y: 22, w: 240, h: 290 };

/**
 * RAW RGB IS A PHOTOGRAPH, AND THE STAGES ARE CUT FROM IT.
 * The frame used to be a grid of drawn pixels with a drawn body on it, and
 * "face redacted" a violet block over a drawn face — an illustration labelled
 * RGB. The frame is now the site's real capture plate; the redaction blocks the
 * head the photograph has; the silhouette is that walker's own segmentation;
 * the landmarks and skeleton are that walker's joints; the trajectory is the
 * stride those joints imply. A single frame does not walk, so the figure holds
 * the photographed moment instead of cycling through keyframes — the stages
 * still move, the person does not. See visuals/capture-plate.ts.
 */
const FIT = plateFit("portrait", FRAME);
const [FX, FY] = FIT.hip;
const S = FIT.poseScale;
const GROUND = FY + 48 * S;
const HEAD = FIT.at([WALKER_HEAD.cx, WALKER_HEAD.cy]);
const HEAD_R = WALKER_HEAD.r * FIT.scale;
const CLASSES = { bone: fig.bone, boneFar: fig.boneFar, joint: fig.joint, head: fig.head, contact: fig.contact };
const GHOST = { ...CLASSES, head: fig.ghostHead };

const DESCRIPTION = `A seven-stage slider from identity-rich to movement-minimised.
Raw RGB: a camera frame of a person walking past a wall — high identity-bearing visual information, high movement information.
Face redacted: the same frame with the head blocked out; still high identity (clothing, build, gait visible), high movement.
Silhouette: the walker's foreground mask cut from that frame — medium identity, high movement.
Pose landmarks: low identity, high movement.
Skeleton: lower direct visual identity, high structural movement information — but pose and gait can themselves carry identifying information.
Trajectory: minimal image information, medium temporal movement information retained.
Minimised output: low identity, low movement — a count, a flow or an event leaves the system.
Privacy properties depend on implementation, storage and deployment context, not on the diagram.`;

export function PrivacyTransform({ articleSlug, presentation }: FigureProps) {
  const shared = useSharedFigureState("privacy-transform");
  const [stage, setStage] = useState(() =>
    typeof presentation?.stage === "number" ? presentation.stage : 0,
  );
  const [dragging, setDragging] = useState(false);
  const { ref } = useFigureActive<HTMLDivElement>();
  const stacked = useNarrow(640);
  /* Stage changes are analytics events, debounced so a drag counts where it
     settled; the completion event lives in the effect below. */
  const chooseStage = (next: number) => {
    setStage(next);
    trackInsightEvent("privacy_stage_selected", { article_slug: articleSlug, stage: next }, { debounce: "privacy" });
  };

  useEffect(() => {
    if (shared && typeof shared.stage === "number") setStage(Math.max(0, Math.min(6, shared.stage)));
  }, [shared]);
  useEffect(() => {
    if (typeof presentation?.stage === "number") setStage(presentation.stage);
  }, [presentation]);
  useEffect(() => {
    if (stage === 6 && !presentation) {
      trackInsightEvent(
        "interactive_figure_complete",
        { article_slug: articleSlug, figure_id: "privacy-transform" },
        { once: "privacy-transform" },
      );
    }
  }, [articleSlug, presentation, stage]);

  const phase = WALKER_PHASE;

  const redact = stage === 1 ? 1 : 0;
  const silhouette = stage === 2 ? 1 : stage === 3 ? 0.22 : 0;
  const joints = stage === 3 ? 1 : 0;
  const bones = stage === 4 ? 1 : stage === 5 ? 0.35 : 0;
  const trail = stage === 5 ? 1 : 0;
  const output = stage === 6 ? 1 : 0;
  /* The photograph: whole for RGB and the redaction, faint under the mask so
     the mask reads as cut from it, gone after that. */
  const pixels = stage <= 1 ? 1 : stage === 2 ? 0.14 : 0;

  /* The stride scaled to this walker: earlier moments of the same walk behind
     the photographed one, and the paths the ankle and wrist trace through them. */
  const stride = useMemo(() => walkerStride(FIT, GAIT_PHASES, 6.5), []);
  const trails = useMemo(
    () => ({
      ankle: smoothPath(stride.map((m) => m.pick((p) => p.nearLeg[2]))),
      wrist: smoothPath(stride.map((m) => m.pick((p) => p.nearArm[2]))),
    }),
    [stride],
  );

  const panel = stacked ? "translate(-318 330)" : undefined;
  /* Stacked, the panel's last line sits 618 units down; the box must hold it
     or it draws over the stage control beneath the figure. */
  const viewBox = stacked ? "0 0 322 632" : `0 0 ${W} ${H}`;

  const Indicator = ({ label, level, color, y }: { label: string; level: Level; color: string; y: number }) => (
    <g>
      <text className={`${fig.label} ${fig.labelKey}`} x={330} y={y}>
        {label}
      </text>
      {[1, 2, 3].map((n) => (
        <rect
          key={n}
          className={fig.fade}
          x={330 + (n - 1) * 26}
          y={y + 12 + (3 - n) * 6}
          width={20}
          height={8 + n * 6}
          rx={1.5}
          fill={n <= level ? color : "var(--jr-line-mid)"}
          style={{ opacity: n <= level ? 1 : 0.35 }}
        />
      ))}
      <text className={`${fig.label} ${fig.labelInk}`} x={420} y={y + 40}>
        {LEVEL_LABEL[level]}
      </text>
    </g>
  );

  const svg = (
    <svg viewBox={viewBox} className={`${fig.svg} ${stacked ? fig.narrow : ""}`} aria-hidden="true" style={{ maxHeight: stacked ? undefined : 400, margin: "0 auto" }}>
      <defs>
        <clipPath id="pt-frame">
          <rect x={30} y={22} width={240} height={290} rx={4} />
        </clipPath>
      </defs>
      <rect className={fig.frame} x={30} y={22} width={240} height={290} rx={4} />
      <g clipPath="url(#pt-frame)">
        {/* the frame: the photograph */}
        <g className={fig.fade} style={{ opacity: pixels }}>
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
        <line className={fig.ground} x1={40} y1={GROUND} x2={260} y2={GROUND} />

        {/* the redaction: a violet block over the head the photograph has —
            unmissable, the same mark the hub card uses */}
        <rect
          className={`${fig.fade} ${fig.redact}`}
          style={{ opacity: redact }}
          x={HEAD[0] - HEAD_R - 3}
          y={HEAD[1] - HEAD_R - 4}
          width={HEAD_R * 2 + 6}
          height={HEAD_R * 2 + 8}
          rx={2}
        />
        {/* silhouette: the walker's own segmentation, traced from the frame */}
        <g className={fig.fade} style={{ opacity: silhouette }} transform={FIT.transform}>
          <path className={fig.segMask} d={WALKER_MASK.path} />
        </g>
        {/* trail */}
        <g className={fig.fade} style={{ opacity: trail }}>
          {stride.slice(0, -1).map((m, i) => (
            <g key={i} className={fig.ghost} transform={`translate(${m.x} ${m.y})`}>
              <PoseFrame phase={m.phase} s={m.scale} classes={GHOST} showFar={false} />
            </g>
          ))}
          <path className={`${fig.trace} ${fig.traceViolet}`} d={trails.ankle} />
          <path className={`${fig.trace}`} d={trails.wrist} />
        </g>
        {/* joints / skeleton */}
        <g transform={`translate(${FX} ${FY})`}>
          <g className={fig.fade} style={{ opacity: bones }}>
            <PoseFrame phase={phase} s={S} classes={CLASSES} />
          </g>
          <g className={fig.fade} style={{ opacity: joints }}>
            {[...phase.nearArm, ...phase.nearLeg, ...phase.farLeg.slice(1), GAIT_HEAD].map(([jx, jy], i) => (
              <circle key={i} className={fig.joint} cx={jx * S} cy={jy * S} r={3.2} />
            ))}
          </g>
        </g>
        {/* minimised output */}
        <g className={fig.fade} style={{ opacity: output }}>
          <rect className={`${fig.plate} ${fig.plateLit}`} x={60} y={110} width={180} height={104} rx={6} />
          <text className={`${fig.label} ${fig.labelAccent}`} x={76} y={134}>
            what leaves the system
          </text>
          <text className={`${fig.label} ${fig.labelInk}`} x={76} y={156}>
            people in zone · 1
          </text>
          <text className={`${fig.label} ${fig.labelInk}`} x={76} y={172}>
            flow · left → right
          </text>
          <text className={`${fig.label} ${fig.labelInk}`} x={76} y={188}>
            event · none
          </text>
          <text className={`${fig.label} ${fig.labelSmall}`} x={76} y={204}>
            no image · no identifier
          </text>
        </g>
      </g>
      <text className={`${fig.label} ${fig.labelInk}`} x={40} y={40}>
        {STAGES[stage].name}
      </text>

      <g transform={panel}>
        <text className={`${fig.label} ${fig.labelSmall}`} x={330} y={36}>
          identity rich
        </text>
        <text className={`${fig.label} ${fig.labelSmall}`} x={600} y={36} textAnchor="end">
          movement minimised
        </text>
        <line className={fig.hair} x1={330} y1={44} x2={600} y2={44} />
        <line className={fig.trace} x1={330} y1={44} x2={330 + (stage / 6) * 270} y2={44} style={{ transition: "x2 0.3s" }} />
        <Indicator label="Movement information retained" level={MOVEMENT[stage]} color="var(--jr-teal)" y={82} />
        <Indicator
          label={stacked ? "Identity information retained" : "Identity-bearing visual information retained"}
          level={IDENTITY[stage]}
          color="var(--jr-violet)"
          y={176}
        />
        <text className={`${fig.label} ${fig.labelSmall}`} x={330} y={270}>
          qualitative · not a measurement
        </text>
        {stage >= 4 && stage <= 5 && (
          <text className={`${fig.label} ${fig.labelWarn} ${fig.labelSmall}`} x={330} y={288}>
            pose and gait can themselves be identifying
          </text>
        )}
      </g>
    </svg>
  );

  if (presentation) return <div ref={ref}>{svg}</div>;

  return (
    <div ref={ref}>
      <InteractiveFigure
        id="privacy-transform"
        articleSlug={articleSlug}
        eyebrow="Interactive hero"
        title="Drag from identity-rich to movement-minimised"
        status="conceptual"
        hint="scrub"
        hero
        dragging={dragging}
        minHeight="420px"
        description={DESCRIPTION}
        caption={
          <>
            <strong className="font-medium text-soft-white">{STAGES[stage].name}.</strong> {NOTES[stage]} Privacy
            properties depend on implementation, storage and deployment context — a skeleton is not automatically
            anonymous.
          </>
        }
        actions={
          <ShareInsight figureId="privacy-transform" state={{ stage }} label="Share this insight" articleSlug={articleSlug} />
        }
      >
        {svg}
        <div onPointerDown={() => setDragging(true)} onPointerUp={() => setDragging(false)} onPointerCancel={() => setDragging(false)}>
          <StageControl
            stages={STAGES}
            labels={PRINTED}
            value={stage}
            onChange={(next) => chooseStage(next)}
            ariaLabel="Privacy transformation stage"
            hint="Drag the track, tap a stage, or use ← →"
          />
        </div>
        <p className={ui.srOnly} aria-live="polite">
          {STAGES[stage].name}. Movement information {LEVEL_LABEL[MOVEMENT[stage]]}. Identity-bearing visual information{" "}
          {LEVEL_LABEL[IDENTITY[stage]]}.
        </p>
      </InteractiveFigure>
    </div>
  );
}

"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { SequenceFrame, sequenceFrames, sequencePoint, SEQUENCE_CAPTION } from "@/components/visuals/SequenceFrame";
import { GAIT_HEAD, GAIT_PHASES, type Pt } from "@/components/visuals/gait-phases";
import { PoseFrame, smoothPath } from "@/components/research/PoseFrame";
import { assetPath } from "@/lib/paths";
import { InteractiveFigure } from "../InteractiveFigure";
import { StageControl, type Stage } from "../StageControl";
import { ShareInsight, useSharedFigureState } from "../ShareInsight";
import { useFigureActive } from "../useFigureActive";
import { useNarrow } from "../useNarrow";
import { gaitWave, phaseAt, useWalkCycle } from "../gait";
import type { FigureProps } from "../registry";
import { trackInsightEvent } from "@/lib/insight-events";
import fig from "../figures.module.css";

/** One recorded sequence, its extracted model output and explanatory channels. */

const STAGES: Stage[] = [
  { id: "raw", label: "Raw", name: "Raw video" },
  { id: "person", label: "Person", name: "Person detected" },
  { id: "pose", label: "Pose", name: "Pose landmarks" },
  { id: "skeleton", label: "Skeleton", name: "Skeleton" },
  { id: "trajectory", label: "Trajectory", name: "Temporal trajectory" },
  { id: "signals", label: "Signal", name: "Movement signals" },
  { id: "context", label: "Context", name: "Context" },
  { id: "decision", label: "Intelligence", name: "Decision support" },
];
const PRINTED = [0, 2, 3, 5, 7];

const W = 640;
const H = 340;
const FX = 150;
const FY = 168;
const S = 2.1;
const GROUND = FY + 48 * S;
/**
 * RAW VIDEO IS A PHOTOGRAPH.
 * Stage 0 used to be a mosaic of drawn "pixels" with the drawn walker on top -
 * an illustration labelled RAW VIDEO. The capture frame is now the site's real
 * capture plate (scripts/build-capture-plate.py), and the drawn body only
 * appears once the frame has faded: at "Person" the detection box sits on the
 * photograph, at "Pose" the landmarks replace it. Which is the story the figure
 * tells - appearance leaves, geometry stays - now shown on a real frame.
 */


const CLASSES = { bone: fig.bone, boneFar: fig.boneFar, joint: fig.joint, head: fig.head, contact: fig.contact };

const DESCRIPTION = `An eight-stage progression, one walking figure throughout.
Raw video: recorded frames from the same recorded walking sequence.
Person: a detection box around the walker, tracked across frames.
Pose: a small set of landmarks — head, shoulders, hips, knees, ankles, wrists — replaces appearance.
Skeleton: the landmarks joined into bones; geometry only.
Temporal trajectory: earlier poses ghosted behind the walker and the paths the ankle and wrist trace through time.
Movement features: normalized image-space ankle, wrist and hip positions from the same frames. No cadence or symmetry is measured.
Context: the same signal set beside an illustrative personal baseline and history, with a capture-quality note.
Decision support: a report for review, marked as decision support and not a diagnosis.`;

export function VideoToIntelligence({ articleSlug, presentation }: FigureProps) {
  const clipId = useId();
  const shared = useSharedFigureState("video-to-intelligence");
  const [stage, setStage] = useState(() =>
    typeof presentation?.stage === "number" ? presentation.stage : 3,
  );
  const [dragging, setDragging] = useState(false);
  const { ref, active, reduced } = useFigureActive<HTMLDivElement>();
  const t = useWalkCycle(active && !presentation, 1500, 0.1, stage);
  /* On a phone the frame and the panel stack; on anything wider they sit
     side by side. Same drawing, one transform. */
  const stacked = useNarrow(640);
  /* Stage changes are analytics events: debounced so a drag across eight
     stages counts where it settled, and a first arrival at Intelligence
     completes the figure. */
  const chooseStage = (next: number) => {
    setStage(next);
    trackInsightEvent("pipeline_stage_changed", { article_slug: articleSlug, stage: next }, { debounce: "pipeline" });
    if (next === STAGES.length - 1) {
      trackInsightEvent(
        "interactive_figure_complete",
        { article_slug: articleSlug, figure_id: "video-to-intelligence" },
        { once: "video-to-intelligence" },
      );
    }
  };

  useEffect(() => {
    if (shared && typeof shared.stage === "number") setStage(Math.max(0, Math.min(7, shared.stage)));
  }, [shared]);
  useEffect(() => {
    if (typeof presentation?.stage === "number") setStage(presentation.stage);
  }, [presentation]);

  /* Reduced motion: hold a legible mid-stride pose rather than freezing at
     whatever frame the cycle stopped on. */

  /* Layer weights per stage. */
  const pixels = stage === 0 ? 1 : stage === 1 ? 0.35 : 0;
  const mass = stage <= 1 ? 0 : stage === 2 ? 0.35 : 0;
  const box = stage === 1 ? 1 : stage === 2 ? 0.4 : 0;
  const joints = stage >= 2 ? 1 : 0;
  const bones = stage >= 3 ? 1 : 0;
  const trail = stage === 4 ? 1 : stage >= 5 ? 0.35 : 0;
  const signals = stage >= 5 ? 1 : 0;
  const context = stage >= 6 ? 1 : 0;
  const decision = stage === 7 ? 1 : 0;
  const figureDim = stage >= 5 ? 0.55 : 1;

  const channels = useMemo(() => [
    {name:"Ankle height · image space", joint:28, axis:"y" as const,cls:fig.trace},
    {name:"Wrist position · image space", joint:16, axis:"x" as const,cls:`${fig.trace} ${fig.traceRoyal}`},
    {name:"Left ankle · image space", joint:27, axis:"y" as const,cls:`${fig.trace} ${fig.traceViolet}`},
    {name:"Hip position · image space", joint:24, axis:"x" as const,cls:`${fig.trace} ${fig.traceTeal}`},
  ].map((channel,index)=>{
    const values=sequenceFrames.map(f=>f.landmarks[channel.joint][channel.axis]);
    const min=Math.min(...values),span=Math.max(...values)-min||1;
    return {...channel,pts:values.map((v,i)=>[330+i*67.5,74+index*58-(v-min)/span*18] as Pt)};
  }), []);

  /* The cursor of "now" moving along the signal panel with the walk. */
  const cursorX = 330 + (presentation ? 0.62 : t) * 270;

  /* The right-hand panel is drawn at x 330–600. Stacked, it moves under the
     frame: 320 to the left and 320 down. */
  const panel = stacked ? "translate(-318 322)" : undefined;
  const viewBox = stacked ? `0 0 ${W / 2 + 2} 640` : `0 0 ${W} ${H}`;

  const svg = (
    <svg
      viewBox={viewBox}
      className={`${fig.svg} ${stacked ? fig.narrow : ""}`}
      aria-hidden="true"
      style={{ maxHeight: presentation ? 320 : stacked ? undefined : 400, margin: "0 auto" }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={30} y={22} width={240} height={290} rx={4} />
        </clipPath>
      </defs>

      {/* ── the capture frame ── */}
      <rect className={fig.frame} x={30} y={22} width={240} height={290} rx={4} />
      <g clipPath={`url(#${clipId})`}>
        <SequenceFrame index={Math.min(sequenceFrames.length-1,Math.floor(t*sequenceFrames.length))} x={30} y={22} width={240} height={290} view={stage<2?"source":stage===2?"keypoints":"pose"} overlay={stage===2 || stage>=6}/>
        {stage===1 && <rect className={fig.frameAccent} x={67} y={46} width={166} height={228} rx={3} fill="none"/>}
        {stage>=4 && <path className={fig.trace} d={smoothPath(sequenceFrames.map((frame,i)=>sequencePoint(i,28,{x:30,y:22,width:240,height:290})))}/>}
      </g>

      {/* stage name inside the frame */}
      <text className={`${fig.label} ${fig.labelInk}`} x={40} y={40}>
        {STAGES[stage].name}
      </text>
      <text className={`${fig.label} ${fig.labelSmall}`} x={40} y={302}>
        {stage <= 1 ? "appearance" : stage <= 4 ? "geometry" : "signal"}
      </text>

      {/* ── the arrow of the pipeline ── */}
      {!stacked && (
        <line className={fig.dash} x1={282} y1={168} x2={316} y2={168} style={{ opacity: signals }} />
      )}

      <g transform={panel}>
      {/* ── what the system will read: the panel, faintly, before it exists.
             Eight stage marks along the top say where in the pipeline we are. ── */}
      <g>
        {STAGES.map((item, i) => (
          <g key={item.id}>
            <circle
              className={i <= stage ? fig.nodeFill : fig.nodeMute}
              cx={336 + i * 37}
              cy={32}
              r={i === stage ? 3.4 : 2}
              style={{ transition: "r 0.2s" }}
            />
            {i < STAGES.length - 1 && (
              <line
                className={i < stage ? fig.trace : fig.hair}
                x1={336 + i * 37 + 4}
                y1={32}
                x2={336 + (i + 1) * 37 - 4}
                y2={32}
              />
            )}
          </g>
        ))}
        <text className={`${fig.label} ${fig.labelSmall}`} x={336} y={18}>
          pipeline · {String(stage + 1).padStart(2, "0")} / 08
        </text>
        {/* Stacked (phones) the panel is half as wide and the type larger, so
            this state word moves to the foot of the panel instead of sharing
            the stage-mark line with the pipeline counter. */}
        <text
          className={`${fig.label} ${fig.labelSmall}`}
          x={stacked ? 336 : 600}
          y={stacked ? 290 : 18}
          textAnchor={stacked ? undefined : "end"}
        >
          {stage < 5 ? "signals not yet read" : stage === 5 ? "signals" : stage === 6 ? "context" : "decision support"}
        </text>
      </g>
      <g className={fig.fade} style={{ opacity: signals ? 0 : 0.14 }}>
        {channels.map((channel, i) => (
          <path key={channel.name} className={`${channel.cls} ${fig.traceThin}`} d={smoothPath(channel.pts)} />
        ))}
      </g>

      {/* ── signals ── */}
      <g className={fig.fade} style={{ opacity: signals * (1 - decision * 0.6) }}>
        {channels.map((channel, i) => (
          <g key={channel.name}>
            <line className={fig.hair} x1={330} y1={74 + i * 58} x2={600} y2={74 + i * 58} />
            <text className={`${fig.label} ${fig.labelSmall}`} x={330} y={74 + i * 58 - 18}>
              {channel.name}
            </text>
            <path className={channel.cls} d={smoothPath(channel.pts)} />
          </g>
        ))}
        {!reduced && <line className={fig.dash} x1={cursorX} y1={48} x2={cursorX} y2={262} />}
      </g>

      {/* ── context ── */}
      <g className={fig.fade} style={{ opacity: context * (1 - decision * 0.6) }}>
        <rect className={fig.band} x={330} y={278} width={270} height={22} rx={3} />
        <text className={`${fig.label} ${fig.labelSmall}`} x={336} y={273}>
          personal baseline · illustrative
        </text>
        {[0, 1, 2, 3, 4].map((i) => (
          <circle
            key={i}
            className={i === 4 ? fig.nodeFill : fig.nodeMute}
            cx={350 + i * 58}
            cy={289 + [0, -3, 2, 4, 7][i]}
            r={i === 4 ? 3.2 : 2.2}
          />
        ))}
        <path
          className={`${fig.trace} ${fig.traceThin}`}
          d={smoothPath([0, 1, 2, 3, 4].map((i) => [350 + i * 58, 289 + [0, -3, 2, 4, 7][i]] as Pt))}
        />
        <text className={`${fig.label} ${fig.labelTeal} ${fig.labelSmall}`} x={520} y={273} textAnchor="end">
          capture: clean
        </text>
      </g>

      {/* ── decision support ── */}
      <g className={fig.fade} style={{ opacity: decision }}>
        <rect className={`${fig.plate} ${fig.plateLit}`} x={372} y={96} width={200} height={132} rx={6} />
        <text className={`${fig.label} ${fig.labelAccent}`} x={388} y={118}>
          For review
        </text>
        <text className={`${fig.label} ${fig.labelInk}`} x={388} y={140}>
          Stride variability
        </text>
        <text className={`${fig.label} ${fig.labelSmall}`} x={388} y={156}>
          above this person&apos;s baseline
        </text>
        <line className={fig.hair} x1={388} y1={168} x2={556} y2={168} />
        <text className={`${fig.label} ${fig.labelSmall}`} x={388} y={184}>
          history · 5 captures · quality clean
        </text>
        <text className={`${fig.label} ${fig.labelSmall}`} x={388} y={200}>
          report · dashboard · alert
        </text>
        <text className={`${fig.label} ${fig.labelWarn} ${fig.labelSmall}`} x={388} y={216}>
          decision support · not a diagnosis
        </text>
      </g>
      </g>
    </svg>
  );

  if (presentation) {
    return <div ref={ref}>{svg}</div>;
  }

  return (
    <div ref={ref}>
      <InteractiveFigure
        id="video-to-intelligence"
        articleSlug={articleSlug}
        eyebrow="Interactive hero"
        title="Scrub one walk from pixels to decision support"
        status="conceptual"
        hint="scrub"
        hero
        dragging={dragging}
        minHeight="380px"
        description={DESCRIPTION}
        caption={
          <>
            Stage {String(stage + 1).padStart(2, "0")} of 08 · {STAGES[stage].name}. {SEQUENCE_CAPTION} The baseline and report panels are conceptual examples.
          </>
        }
        actions={
          <ShareInsight
            figureId="video-to-intelligence"
            state={{ stage }}
            label="Share this stage"
            articleSlug={articleSlug}
          />
        }
      >
        {svg}
        <div
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        >
          <StageControl
            stages={STAGES}
            labels={PRINTED}
            value={stage}
            onChange={(next) => chooseStage(next)}
            ariaLabel="Pipeline stage"
            hint="Drag the track, tap a stage, or use ← →"
          />
        </div>
      </InteractiveFigure>
    </div>
  );
}

export const VIDEO_TO_INTELLIGENCE_STAGES = STAGES;

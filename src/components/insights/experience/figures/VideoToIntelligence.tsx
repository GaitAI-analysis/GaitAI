"use client";

import { useEffect, useMemo, useState } from "react";
import { GAIT_HEAD, GAIT_PHASES, type Pt } from "@/components/visuals/gait-phases";
import { PoseFrame, smoothPath } from "@/components/research/PoseFrame";
import { InteractiveFigure } from "../InteractiveFigure";
import { StageControl, type Stage } from "../StageControl";
import { ShareInsight, useSharedFigureState } from "../ShareInsight";
import { useFigureActive } from "../useFigureActive";
import { useNarrow } from "../useNarrow";
import { gaitWave, phaseAt, useWalkCycle } from "../gait";
import type { FigureProps } from "../registry";
import fig from "../figures.module.css";

/**
 * FROM WALKING VIDEO TO MOVEMENT INTELLIGENCE — the flagship hero.
 *
 *   RAW VIDEO → PERSON → POSE → SKELETON → TEMPORAL TRAJECTORY
 *             → MOVEMENT SIGNALS → CONTEXT → DECISION SUPPORT
 *
 * One walking figure, drawn from the project's gait keyframes and WALKING
 * (interpolated between real poses), stays on the left the whole way. What
 * changes with the stage is what the system holds of it: pixels, then a
 * box, then landmarks, then bones, then the trail those bones leave through
 * time, then the signals read off the trail, then the context those signals
 * are placed in, then the form a decision-maker sees.
 *
 * Drag the track, tap a stage name, or use the arrow keys. In a Visual Story
 * moment the same drawing renders at a fixed stage with no control.
 *
 * NOTHING HERE IS A MEASUREMENT: no axis carries a unit, the channel names
 * are names, and the context panel's history is a shape, not data. The
 * figure says so on its face.
 */

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
const CLASSES = { bone: fig.bone, boneFar: fig.boneFar, joint: fig.joint, head: fig.head, contact: fig.contact };

const DESCRIPTION = `An eight-stage progression, one walking figure throughout.
Raw video: a frame of pixels with a person somewhere in it.
Person: a detection box around the walker, tracked across frames.
Pose: a small set of landmarks — head, shoulders, hips, knees, ankles, wrists — replaces appearance.
Skeleton: the landmarks joined into bones; geometry only.
Temporal trajectory: earlier poses ghosted behind the walker and the paths the ankle and wrist trace through time.
Movement signals: four channels read off those paths — cadence, stride rhythm, left/right symmetry, variability — drawn as waveforms with no units.
Context: the same signal set beside an illustrative personal baseline and history, with a capture-quality note.
Decision support: a report for review, marked as decision support and not a diagnosis.`;

export function VideoToIntelligence({ articleSlug, presentation }: FigureProps) {
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

  useEffect(() => {
    if (shared && typeof shared.stage === "number") setStage(Math.max(0, Math.min(7, shared.stage)));
  }, [shared]);
  useEffect(() => {
    if (typeof presentation?.stage === "number") setStage(presentation.stage);
  }, [presentation]);

  /* Reduced motion: hold a legible mid-stride pose rather than freezing at
     whatever frame the cycle stopped on. */
  const phase = reduced || presentation ? GAIT_PHASES[0] : phaseAt(t);

  /* Layer weights per stage. */
  const pixels = stage === 0 ? 1 : stage === 1 ? 0.35 : 0;
  const mass = stage <= 1 ? 1 : stage === 2 ? 0.35 : 0;
  const box = stage === 1 ? 1 : stage === 2 ? 0.4 : 0;
  const joints = stage >= 2 ? 1 : 0;
  const bones = stage >= 3 ? 1 : 0;
  const trail = stage === 4 ? 1 : stage >= 5 ? 0.35 : 0;
  const signals = stage >= 5 ? 1 : 0;
  const context = stage >= 6 ? 1 : 0;
  const decision = stage === 7 ? 1 : 0;
  const figureDim = stage >= 5 ? 0.55 : 1;

  /* Trajectories through the five keyframes, laid out as a trail behind the
     walker — where the ankle and the wrist have been. */
  const trails = useMemo(() => {
    const step = 30;
    const pts = (pick: (p: (typeof GAIT_PHASES)[number]) => Pt) =>
      GAIT_PHASES.map((p, i) => [FX - (4 - i) * step + pick(p)[0] * S * 0.45, FY - p.lift * S + pick(p)[1] * S] as Pt);
    return {
      ankle: smoothPath(pts((p) => p.nearLeg[2])),
      wrist: smoothPath(pts((p) => p.nearArm[2])),
      hip: smoothPath(pts((p) => p.nearLeg[0])),
    };
  }, []);

  const channels = useMemo(
    () => [
      { name: "Cadence", cls: fig.trace, pts: gaitWave(330, 600, 74, 9, 3, 0) },
      { name: "Stride rhythm", cls: `${fig.trace} ${fig.traceRoyal}`, pts: gaitWave(330, 600, 132, 8, 2, 0.6) },
      {
        name: "Left / right symmetry",
        cls: `${fig.trace} ${fig.traceViolet}`,
        pts: gaitWave(330, 600, 190, 7, 2, 0).map(([x, y], i) => [x, y + (i % 2 ? 1.5 : -1.5)] as Pt),
      },
      {
        name: "Variability",
        cls: `${fig.trace} ${fig.traceTeal}`,
        pts: gaitWave(330, 600, 248, 6, 4, 1.2).map(([x, y], i) => [x, y + Math.sin(i * 1.7) * 2.2] as Pt),
      },
    ],
    [],
  );

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
        <clipPath id="v2i-frame">
          <rect x={30} y={22} width={240} height={290} rx={4} />
        </clipPath>
      </defs>

      {/* ── the capture frame ── */}
      <rect className={fig.frame} x={30} y={22} width={240} height={290} rx={4} />
      <g clipPath="url(#v2i-frame)">
        <g className={fig.fade} style={{ opacity: pixels }}>
          {Array.from({ length: 14 }, (_, row) =>
            Array.from({ length: 12 }, (_, col) => {
              const lit = (row * 7 + col * 5) % 6 === 0;
              return (
                <rect
                  key={`${row}-${col}`}
                  className={lit ? fig.pixelLit : fig.pixel}
                  x={32 + col * 20}
                  y={24 + row * 21}
                  width={18}
                  height={19}
                />
              );
            }),
          )}
        </g>
        <line className={fig.ground} x1={40} y1={GROUND} x2={260} y2={GROUND} />

        {/* the trail of where the body has been */}
        <g className={fig.fade} style={{ opacity: trail }}>
          {GAIT_PHASES.map((p, i) =>
            i === 4 ? null : (
              <g
                key={p.id}
                className={fig.ghost}
                transform={`translate(${FX - (4 - i) * 30} ${FY - p.lift * S})`}
              >
                <PoseFrame phase={p} s={S * 0.45} classes={CLASSES} showFar={false} />
              </g>
            ),
          )}
          <path className={fig.trace} d={trails.ankle} />
          <path className={`${fig.trace} ${fig.traceViolet}`} d={trails.wrist} />
          <path className={`${fig.trace} ${fig.traceRoyal} ${fig.traceThin}`} d={trails.hip} />
        </g>

        {/* the walker */}
        <g className={fig.fade} style={{ opacity: figureDim }}>
          <g className={fig.fade} style={{ opacity: mass }} transform={`translate(${FX} ${FY - phase.lift * S})`}>
            <BodyMass phaseLift={0} />
          </g>
          <rect
            className={`${fig.frame} ${fig.frameAccent} ${fig.fade}`}
            style={{ opacity: box }}
            x={FX - 30 * S * 0.6}
            y={FY - 52 * S}
            width={60 * S * 0.6}
            height={102 * S}
            rx={3}
          />
          <text
            className={`${fig.label} ${fig.labelAccent} ${fig.labelSmall} ${fig.fade}`}
            style={{ opacity: box }}
            x={FX - 30 * S * 0.6}
            y={FY - 52 * S - 6}
          >
            track 01
          </text>
          <g transform={`translate(${FX} ${FY - phase.lift * S})`}>
            <g className={fig.fade} style={{ opacity: bones }}>
              <PoseFrame phase={phase} s={S} classes={CLASSES} showContacts={stage >= 3 && stage <= 4} />
            </g>
            <g className={fig.fade} style={{ opacity: joints * (1 - bones) }}>
              {[...phase.nearArm, ...phase.nearLeg, ...phase.farLeg.slice(1), GAIT_HEAD].map(([jx, jy], i) => (
                <circle key={i} className={fig.joint} cx={jx * S} cy={jy * S} r={3.2} />
              ))}
            </g>
          </g>
        </g>
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
        <text className={`${fig.label} ${fig.labelSmall}`} x={600} y={18} textAnchor="end">
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
            Stage {String(stage + 1).padStart(2, "0")} of 08 · {STAGES[stage].name}. The walker is
            interpolated between GaitAI&apos;s five gait keyframes; the channels and the history are shapes,
            not measurements.
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
            onChange={(next) => setStage(next)}
            ariaLabel="Pipeline stage"
            hint="Drag the track, tap a stage, or use ← →"
          />
        </div>
      </InteractiveFigure>
    </div>
  );
}

/** The body before there is a skeleton: a soft mass around mid-stance. */
function BodyMass({ phaseLift }: { phaseLift: number }) {
  const s = S;
  const y = -phaseLift;
  const d = [
    `M${-9 * s} ${y - 33 * s}`,
    `C${-11 * s} ${y - 20 * s} ${-8 * s} ${y - 6 * s} ${-7 * s} ${y + 4 * s}`,
    `L${-10 * s} ${y + 44 * s} L${-2 * s} ${y + 46 * s} L0 ${y + 14 * s}`,
    `L${3 * s} ${y + 46 * s} L${11 * s} ${y + 45 * s} L${7 * s} ${y + 4 * s}`,
    `C${9 * s} ${y - 6 * s} ${12 * s} ${y - 20 * s} ${9 * s} ${y - 33 * s}`,
    `C${6 * s} ${y - 36 * s} ${-6 * s} ${y - 36 * s} ${-9 * s} ${y - 33 * s} Z`,
  ].join(" ");
  return (
    <g className={fig.mass}>
      <path d={d} />
      <circle cx={1 * s} cy={y - 43 * s} r={6.5 * s} />
    </g>
  );
}

export const VIDEO_TO_INTELLIGENCE_STAGES = STAGES;

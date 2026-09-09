"use client";

import { useEffect, useMemo, useState } from "react";
import { GAIT_HEAD, GAIT_PHASES, type Pt } from "@/components/visuals/gait-phases";
import { PoseFrame, smoothPath } from "@/components/research/PoseFrame";
import { trackInsightEvent } from "@/lib/insight-events";
import { InteractiveFigure } from "../InteractiveFigure";
import { StageControl, type Stage } from "../StageControl";
import { ShareInsight, useSharedFigureState } from "../ShareInsight";
import { useFigureActive } from "../useFigureActive";
import { useNarrow } from "../useNarrow";
import { phaseAt, useWalkCycle } from "../gait";
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
const FX = 150;
const FY = 160;
const S = 2.1;
const GROUND = FY + 48 * S;
const CLASSES = { bone: fig.bone, boneFar: fig.boneFar, joint: fig.joint, head: fig.head, contact: fig.contact };

const DESCRIPTION = `A seven-stage slider from identity-rich to movement-minimised.
Raw RGB: high identity-bearing visual information, high movement information.
Face redacted: still high identity (clothing, build, gait visible), high movement.
Silhouette: medium identity, high movement.
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
  const { ref, active, reduced } = useFigureActive<HTMLDivElement>();
  const t = useWalkCycle(active && !presentation, 1500, 0.1, stage);
  const stacked = useNarrow(640);

  useEffect(() => {
    if (shared && typeof shared.stage === "number") setStage(Math.max(0, Math.min(6, shared.stage)));
  }, [shared]);
  useEffect(() => {
    if (typeof presentation?.stage === "number") setStage(presentation.stage);
  }, [presentation]);
  useEffect(() => {
    if (stage === 6 && !presentation) {
      trackInsightEvent("privacy_slider_completed", { article: articleSlug }, { once: articleSlug });
    }
  }, [articleSlug, presentation, stage]);

  const phase = reduced || presentation ? GAIT_PHASES[0] : phaseAt(t);

  const rgb = stage === 0 ? 1 : 0;
  const redact = stage === 1 ? 1 : 0;
  const bodyTextured = stage <= 1 ? 1 : 0;
  const silhouette = stage === 2 ? 1 : stage === 3 ? 0.3 : 0;
  const joints = stage === 3 ? 1 : 0;
  const bones = stage === 4 ? 1 : stage === 5 ? 0.35 : 0;
  const trail = stage === 5 ? 1 : 0;
  const output = stage === 6 ? 1 : 0;
  const pixels = stage <= 1 ? 1 : stage === 2 ? 0.25 : 0;

  const trails = useMemo(() => {
    const step = 30;
    const pts = (pick: (p: (typeof GAIT_PHASES)[number]) => Pt) =>
      GAIT_PHASES.map((p, i) => [FX - (4 - i) * step + pick(p)[0] * S * 0.45, FY - p.lift * S + pick(p)[1] * S] as Pt);
    return { ankle: smoothPath(pts((p) => p.nearLeg[2])), wrist: smoothPath(pts((p) => p.nearArm[2])) };
  }, []);

  const panel = stacked ? "translate(-318 330)" : undefined;
  const viewBox = stacked ? "0 0 322 560" : `0 0 ${W} ${H}`;

  const Indicator = ({ label, level, color, y }: { label: string; level: Level; color: string; y: number }) => (
    <g>
      <text className={fig.label} x={330} y={y}>
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
        {/* background: a room, as pixels */}
        <g className={fig.fade} style={{ opacity: pixels }}>
          {Array.from({ length: 14 }, (_, row) =>
            Array.from({ length: 12 }, (_, col) => (
              <rect
                key={`${row}-${col}`}
                className={(row * 5 + col * 3) % 7 === 0 ? fig.pixelLit : fig.pixel}
                x={32 + col * 20}
                y={24 + row * 21}
                width={18}
                height={19}
              />
            )),
          )}
        </g>
        <line className={fig.ground} x1={40} y1={GROUND} x2={260} y2={GROUND} />

        {/* the person, textured */}
        <g className={fig.fade} style={{ opacity: bodyTextured }} transform={`translate(${FX} ${FY - phase.lift * S})`}>
          <Body solid />
          {/* clothing lines and a face */}
          {[0, 1, 2, 3].map((i) => (
            <line key={i} className={fig.hair} x1={-7 * S} y1={-26 * S + i * 7 * S} x2={7 * S} y2={-24 * S + i * 7 * S} />
          ))}
          <g className={fig.fade} style={{ opacity: rgb }}>
            <circle cx={-0.5 * S} cy={-44 * S} r={1.4} className={fig.nodeMute} />
            <circle cx={3.5 * S} cy={-44 * S} r={1.4} className={fig.nodeMute} />
            <path d={`M${-1 * S} ${-40.5 * S} Q${1.5 * S} ${-39 * S} ${4 * S} ${-40.5 * S}`} fill="none" stroke="var(--jr-mute)" strokeWidth={0.8} />
          </g>
          <rect
            className={fig.fade}
            style={{ opacity: redact }}
            x={-8 * S}
            y={-51 * S}
            width={18 * S}
            height={15 * S}
            fill="rgb(var(--c-obsidian-500))"
            stroke="var(--jr-violet)"
            strokeWidth={1}
          />
        </g>
        {/* silhouette */}
        <g className={fig.fade} style={{ opacity: silhouette }} transform={`translate(${FX} ${FY - phase.lift * S})`}>
          <Body />
        </g>
        {/* trail */}
        <g className={fig.fade} style={{ opacity: trail }}>
          {GAIT_PHASES.map((p, i) =>
            i === 4 ? null : (
              <g key={p.id} className={fig.ghost} transform={`translate(${FX - (4 - i) * 30} ${FY - p.lift * S})`}>
                <PoseFrame phase={p} s={S * 0.45} classes={CLASSES} showFar={false} />
              </g>
            ),
          )}
          <path className={`${fig.trace} ${fig.traceViolet}`} d={trails.ankle} />
          <path className={`${fig.trace}`} d={trails.wrist} />
        </g>
        {/* joints / skeleton */}
        <g transform={`translate(${FX} ${FY - phase.lift * S})`}>
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
        <Indicator label="Identity-bearing visual information retained" level={IDENTITY[stage]} color="var(--jr-violet)" y={176} />
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
            onChange={(next) => setStage(next)}
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

function Body({ solid = false }: { solid?: boolean }) {
  const s = S;
  const d = [
    `M${-9 * s} ${-33 * s}`,
    `C${-11 * s} ${-20 * s} ${-8 * s} ${-6 * s} ${-7 * s} ${4 * s}`,
    `L${-10 * s} ${44 * s} L${-2 * s} ${46 * s} L0 ${14 * s}`,
    `L${3 * s} ${46 * s} L${11 * s} ${45 * s} L${7 * s} ${4 * s}`,
    `C${9 * s} ${-6 * s} ${12 * s} ${-20 * s} ${9 * s} ${-33 * s}`,
    `C${6 * s} ${-36 * s} ${-6 * s} ${-36 * s} ${-9 * s} ${-33 * s} Z`,
  ].join(" ");
  return (
    <g className={solid ? fig.massSolid : fig.mass}>
      <path d={d} />
      <circle cx={1 * s} cy={-43 * s} r={6.5 * s} />
    </g>
  );
}

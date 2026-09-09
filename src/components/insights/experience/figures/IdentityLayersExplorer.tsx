"use client";

import { useEffect, useRef, useState } from "react";
import { GAIT_PHASES, type Pt } from "@/components/visuals/gait-phases";
import { PoseFrame, smoothPath } from "@/components/research/PoseFrame";
import { trackInsightEvent } from "@/lib/insight-events";
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
  bodyMassPath,
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
const FX = 165;
const FY = 176;
const S = 2.3;
const PANEL_X = 328;

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
  const phase = GAIT_PHASES[2];
  const groundY = FY + (48 - phase.lift) * S;
  const stage = REPRESENTATIONS.indexOf(representation);

  const trails = {
    ankle: smoothPath(GAIT_PHASES.map((p, i) => [FX - (2 - i) * 24 + p.nearLeg[2][0] * S * 0.45, FY - p.lift * S + p.nearLeg[2][1] * S] as Pt)),
    wrist: smoothPath(GAIT_PHASES.map((p, i) => [FX - (2 - i) * 24 + p.nearArm[2][0] * S * 0.45, FY - p.lift * S + p.nearArm[2][1] * S] as Pt)),
    hip: smoothPath(GAIT_PHASES.map((p, i) => [FX - (2 - i) * 24 + p.nearLeg[0][0] * S * 0.45, FY - p.lift * S + p.nearLeg[0][1] * S] as Pt)),
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
      {/* pixels behind the earliest stages */}
      <g className={fig.fade} style={{ opacity: stage <= 1 ? 1 : stage === 2 ? 0.25 : 0 }}>
        {Array.from({ length: 10 }, (_, row) =>
          Array.from({ length: 12 }, (_, col) => (
            <rect
              key={`${row}-${col}`}
              className={(row * 7 + col * 3) % 5 === 0 ? fig.pixelLit : fig.pixel}
              x={FRAME.x + 12 + col * 19}
              y={FRAME.y + 30 + row * 24}
              width={16}
              height={20}
            />
          )),
        )}
      </g>
      {/* RGB / face removed: a textured body */}
      <g className={fig.fade} style={{ opacity: stage <= 1 ? 1 : 0 }}>
        <path className={fig.massSolid} d={bodyMassPath(FX, FY, S)} />
        {[0, 1, 2, 3].map((i) => (
          <line key={i} className={fig.hair} x1={FX - 7 * S} y1={FY - 26 * S + i * 7 * S} x2={FX + 7 * S} y2={FY - 24 * S + i * 7 * S} />
        ))}
        <g className={fig.fade} style={{ opacity: stage === 0 ? 1 : 0 }}>
          <circle cx={FX - 0.5 * S} cy={FY - 44 * S} r={1.4} className={fig.nodeMute} />
          <circle cx={FX + 3.5 * S} cy={FY - 44 * S} r={1.4} className={fig.nodeMute} />
        </g>
      </g>
      <rect className={`${fig.fade} ${fig.redact}`} style={{ opacity: stage === 1 ? 1 : 0 }} x={FX - 9 * S} y={FY - 52 * S} width={20 * S} height={17 * S} rx={1} />
      {/* silhouette */}
      <path className={`${fig.fade} ${fig.mass}`} style={{ opacity: stage === 2 ? 1 : stage === 3 ? 0.25 : 0 }} d={bodyMassPath(FX, FY, S)} />
      {/* skeleton */}
      <g className={fig.fade} style={{ opacity: stage === 3 ? 1 : stage === 4 ? 0.3 : 0 }} transform={`translate(${FX} ${FY - phase.lift * S})`}>
        <PoseFrame phase={phase} s={S} classes={CLASSES} />
      </g>
      {/* trajectories */}
      <g className={fig.fade} style={{ opacity: stage === 4 ? 1 : 0 }}>
        <path className={fig.trace} d={trails.ankle} />
        <path className={`${fig.trace} ${fig.traceViolet}`} d={trails.wrist} />
        <path className={`${fig.trace} ${fig.traceRoyal} ${fig.traceThin}`} d={trails.hip} />
        {GAIT_PHASES.map((p, i) => (
          <circle key={p.id} className={fig.nodeViolet} cx={FX - (2 - i) * 24 + p.nearArm[2][0] * S * 0.45} cy={FY - p.lift * S + p.nearArm[2][1] * S} r={2} />
        ))}
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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GAIT_PHASES } from "@/components/visuals/gait-phases";
import { PoseFrame } from "@/components/research/PoseFrame";
import { trackInsightEvent } from "@/lib/insight-events";
import { InteractiveFigure } from "../InteractiveFigure";
import { ShareInsight, useSharedFigureState } from "../ShareInsight";
import { useNarrow } from "../useNarrow";
import type { FigureProps } from "../registry";
import fig from "../figures.module.css";
import ui from "../experience.module.css";

/**
 * WHEN POSE ESTIMATION LIES — AI VIEW | ORIGINAL FRAME.
 *
 *   ┌─ camera frame ─────────┐   What the measurement inherits
 *   │   a plausible skeleton  │   Step timing        reliable
 *   │                         │   Stride length      degraded
 *   │                         │   Knee angle         questionable
 *   └─────────────────────────┘   Left/right symmetry unavailable
 *   [ AI view | Original frame ]  Cadence             reliable
 *   Occlusion · Motion blur · Cropped foot · Leg crossing
 *
 * AI VIEW is the skeleton as an estimator would return it — complete,
 * anatomically plausible, nothing marked. ORIGINAL FRAME is what the camera
 * captured, with the estimate laid over it: the hidden leg behind the bin,
 * the blurred swing foot, the feet below the frame, the two legs that cross.
 * Only the comparison shows which joints were observed and which were filled
 * in. Choosing an issue moves the estimate the way that issue moves it; the
 * right-hand panel says what each gait measure inherits, in four qualitative
 * states — reliable, degraded, questionable, unavailable.
 *
 * EVERYTHING HERE IS ILLUSTRATIVE and says so. The walker is GaitAI's own gait
 * keyframes; the displacements are drawn to make the failure mode visible,
 * not measured from any model; no confidence value, accuracy or error size is
 * stated as a number.
 */

import {
  POSE_CROP_Y,
  POSE_PHASE_FOR as PHASE_FOR,
  estimatePose as estimate,
  isPoseIssue as isIssue,
  isPoseView as isView,
  poseFocusJoint as focusJoint,
  type PoseIssue as Issue,
  type PoseView as View,
} from "./pose-error-model";

type Reliability = "reliable" | "degraded" | "questionable" | "unavailable";

const ISSUES: Array<{ id: Issue; label: string; name: string; note: string }> = [
  { id: "none", label: "Clean frame", name: "Clean frame", note: "Full body, steady camera, good light. The skeleton is observed, not filled in." },
  {
    id: "occlusion",
    label: "Occlusion",
    name: "Occlusion",
    note: "A bin hides the far leg. The estimator places a knee and an ankle where legs usually are — a filled-in limb reported like an observed one.",
  },
  {
    id: "blur",
    label: "Motion blur",
    name: "Motion blur",
    note: "The swing foot moves fastest and blurs most. Its ankle lands along the streak, biased in the direction of travel.",
  },
  {
    id: "cropped",
    label: "Cropped foot",
    name: "Cropped foot",
    note: "The feet were never in the frame. The estimator still returns ankles — at the bottom edge, because a body has feet.",
  },
  {
    id: "crossing",
    label: "Leg crossing",
    name: "Leg crossing",
    note: "At mid-stance the legs overlap. For a few frames the near knee is assigned to the far leg and back: each frame plausible, the sequence swapped.",
  },
];

const MEASURES = ["Step timing", "Stride length", "Knee angle", "Left/right symmetry", "Cadence"] as const;
/* Illustrative: how each issue tends to land on each measure. */
const INHERITS: Record<Issue, Reliability[]> = {
  none: ["reliable", "reliable", "reliable", "reliable", "reliable"],
  occlusion: ["degraded", "questionable", "unavailable", "questionable", "reliable"],
  blur: ["degraded", "degraded", "degraded", "degraded", "reliable"],
  cropped: ["unavailable", "unavailable", "degraded", "unavailable", "questionable"],
  crossing: ["reliable", "reliable", "questionable", "unavailable", "reliable"],
};
const RELIABILITY_LABEL: Record<Reliability, string> = {
  reliable: "Reliable",
  degraded: "Degraded",
  questionable: "Questionable",
  unavailable: "Unavailable",
};

const W = 640;
const H = 360;
const FX = 170;
const FY = 176;
const S = 2.3;
const FRAME = { x: 40, y: 30, w: 260, h: 300 };
const PANEL_X = 340;

const CLASSES = { bone: fig.bone, boneFar: fig.boneFar, joint: fig.joint, head: fig.head };
const MASS = { bone: fig.massBone, boneFar: fig.massBoneFar, joint: fig.massJoint, head: fig.massHead };

const DESCRIPTION = `A camera frame with a walking figure, shown two ways. AI view: the skeleton as a pose estimator would return it — complete and plausible, with nothing marked. Original frame: what the camera captured, with the estimate laid over it.
Four failure modes can be chosen. Occlusion: a bin hides the far leg; the estimator fills in a knee and ankle that were never observed. Motion blur: the swing foot is a streak; its ankle is placed along the streak, ahead of where the foot is. Cropped foot: the feet are below the frame; the estimator places ankles at the bottom edge. Leg crossing: at mid-stance the legs overlap and left and right are swapped for a few frames.
For each, a panel states what five gait measures inherit — step timing, stride length, knee angle, left/right symmetry and cadence — as reliable, degraded, questionable or unavailable. In every failure mode the estimator's reported confidence for the affected joint can still be high. Illustrative: the displacements are drawn to show the pattern of each error, not measured from any model.`;

export function PoseErrorExplorer({ articleSlug, presentation }: FigureProps) {
  const shared = useSharedFigureState("pose-error-explorer");
  const [issue, setIssue] = useState<Issue>(() => (isIssue(presentation?.issue) ? presentation.issue : "occlusion"));
  const [view, setView] = useState<View>(() => (isView(presentation?.view) ? presentation.view : "ai"));
  const stacked = useNarrow(640);
  const revealed = useRef({ issue: false, original: false });

  useEffect(() => {
    if (!shared) return;
    if (isIssue(shared.issue)) setIssue(shared.issue);
    if (isView(shared.view)) setView(shared.view);
  }, [shared]);
  useEffect(() => {
    if (!presentation) return;
    if (isIssue(presentation.issue)) setIssue(presentation.issue);
    if (isView(presentation.view)) setView(presentation.view);
  }, [presentation]);

  const chooseIssue = (next: Issue) => {
    setIssue(next);
    trackInsightEvent("pose_issue_selected", { article_slug: articleSlug, issue: next });
    if (next !== "none") revealed.current.issue = true;
    complete();
  };
  const chooseView = (next: View) => {
    setView(next);
    trackInsightEvent("pose_view_toggled", { article_slug: articleSlug, view: next });
    if (next === "original") revealed.current.original = true;
    complete();
  };
  /* Completion: a failure mode chosen AND the original frame revealed — the
     reader has compared what the model believed with what the camera saw. */
  const complete = () => {
    if (presentation || !revealed.current.issue || !revealed.current.original) return;
    trackInsightEvent(
      "interactive_figure_complete",
      { article_slug: articleSlug, figure_id: "pose-error-explorer" },
      { once: "pose-error-explorer" },
    );
  };

  const actual = GAIT_PHASES[PHASE_FOR[issue]];
  const est = useMemo(() => estimate(actual, issue), [actual, issue]);
  const focus = focusJoint(actual, est, issue);
  const original = view === "original";
  const groundY = FY + (48 - actual.lift) * S;
  const cropLineY = FY - actual.lift * S + POSE_CROP_Y * S;
  const current = ISSUES.find((item) => item.id === issue)!;
  const inherits = INHERITS[issue];

  /* Stacked, the rows breathe more (the type is larger) and the panel sits
     under the frame. */
  const ROW = stacked ? 40 : 34;
  const panelTransform = stacked ? `translate(${-PANEL_X + 20} 330)` : undefined;
  const viewBox = stacked ? "0 0 322 640" : `0 0 ${W} ${H}`;

  const svg = (
    <svg viewBox={viewBox} className={`${fig.svg} ${stacked ? fig.narrow : ""}`} aria-hidden="true" style={{ maxHeight: stacked ? undefined : 380, margin: "0 auto" }}>
      <defs>
        <clipPath id="pose-error-frame">
          <rect x={FRAME.x} y={FRAME.y} width={FRAME.w} height={issue === "cropped" ? cropLineY - FRAME.y : FRAME.h} />
        </clipPath>
        <pattern id="pose-error-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--jr-line-mid)" strokeWidth="1" />
        </pattern>
      </defs>

      {/* ── the camera frame ── */}
      <rect className={fig.frame} x={FRAME.x} y={FRAME.y} width={FRAME.w} height={FRAME.h} rx={3} />
      <text className={`${fig.label} ${fig.labelInk}`} x={FRAME.x + 10} y={FRAME.y + 16}>
        {original ? "Original frame" : "AI view"}
      </text>
      {!stacked && (
        <text className={`${fig.label} ${fig.labelSmall}`} x={FRAME.x + FRAME.w - 10} y={FRAME.y + 16} textAnchor="end">
          {original ? "what the camera saw" : "what the model returned"}
        </text>
      )}

      <g clipPath="url(#pose-error-frame)">
        <line className={fig.ground} x1={FRAME.x + 12} y1={groundY} x2={FRAME.x + FRAME.w - 12} y2={groundY} />

        {/* ORIGINAL: the body as it was, then the occluder / blur / crop */}
        {original && (
          <g className={fig.fade}>
            <g transform={`translate(${FX} ${FY - actual.lift * S})`}>
              <PoseFrame phase={actual} s={S} classes={MASS} />
            </g>
            {issue === "blur" && (
              <g transform={`translate(${FX} ${FY - actual.lift * S})`} opacity={0.35}>
                {[-8, 0, 8].map((dx) => (
                  <polyline
                    key={dx}
                    className={fig.massBone}
                    points={`${(actual.nearLeg[1][0] + dx * 0.4) * S},${actual.nearLeg[1][1] * S} ${(actual.nearLeg[2][0] + dx) * S},${actual.nearLeg[2][1] * S}`}
                  />
                ))}
              </g>
            )}
          </g>
        )}

        {/* THE ESTIMATE, in both views — plausible, complete */}
        <g transform={`translate(${FX} ${FY - actual.lift * S})`} className={fig.fade} style={{ opacity: original ? 0.85 : 1 }}>
          <PoseFrame phase={est} s={S} classes={CLASSES} showContacts={false} />
        </g>

        {/* ORIGINAL: the occluder sits in front of the far leg */}
        {original && issue === "occlusion" && (
          <g>
            <rect x={FX + 4 * S} y={FY + 8 * S} width={30 * S} height={groundY - (FY + 8 * S)} fill="url(#pose-error-hatch)" stroke="var(--jr-line-mid)" strokeWidth={1} rx={2} />
            <rect x={FX + 4 * S} y={FY + 8 * S} width={30 * S} height={groundY - (FY + 8 * S)} fill="rgb(var(--c-obsidian-400) / 0.55)" rx={2} />
          </g>
        )}
      </g>

      {/* CROPPED: what lies below the frame was never observed */}
      {issue === "cropped" && (
        <g>
          <rect x={FRAME.x} y={cropLineY} width={FRAME.w} height={FRAME.y + FRAME.h - cropLineY} fill="url(#pose-error-hatch)" opacity={0.5} />
          <line className={fig.dash} x1={FRAME.x} y1={cropLineY} x2={FRAME.x + FRAME.w} y2={cropLineY} />
          <text className={`${fig.label} ${fig.labelSmall}`} x={FRAME.x + 10} y={cropLineY + 16}>
            below the frame · not observed
          </text>
          {original && (
            <g transform={`translate(${FX} ${FY - actual.lift * S})`} opacity={0.35}>
              <PoseFrame phase={actual} s={S} classes={MASS} />
            </g>
          )}
        </g>
      )}

      {/* ORIGINAL: the joint that moved — actual (teal) against estimated (cyan) */}
      {original && focus && (
        <g transform={`translate(${FX} ${FY - actual.lift * S})`}>
          <line className={fig.dash} x1={focus.actual[0] * S} y1={focus.actual[1] * S} x2={focus.est[0] * S} y2={focus.est[1] * S} />
          <circle className={fig.nodeTeal} cx={focus.actual[0] * S} cy={focus.actual[1] * S} r={3.2} />
          <circle className={fig.node} cx={focus.est[0] * S} cy={focus.est[1] * S} r={7} style={{ stroke: "#f0b45a" }} />
          <text className={`${fig.label} ${fig.labelSmall} ${fig.labelWarn}`} x={focus.est[0] * S + 10} y={focus.est[1] * S - 8}>
            {focus.name} · estimated
          </text>
          <text className={`${fig.label} ${fig.labelSmall} ${fig.labelTeal}`} x={focus.actual[0] * S + 10} y={focus.actual[1] * S + 14}>
            actual
          </text>
        </g>
      )}
      {original && issue === "crossing" && (
        <text className={`${fig.label} ${fig.labelSmall} ${fig.labelWarn}`} x={FRAME.x + 10} y={FRAME.y + FRAME.h - 12}>
          left and right swapped for this span
        </text>
      )}
      {!original && issue !== "none" && (
        <text className={`${fig.label} ${fig.labelSmall}`} x={FRAME.x + 10} y={FRAME.y + FRAME.h - 12}>
          nothing here says which joints are guesses
        </text>
      )}

      {/* ── the panel: what the measurement inherits ── */}
      <g transform={panelTransform}>
        <text className={`${fig.label} ${fig.labelInk}`} x={PANEL_X} y={FRAME.y + 16}>
          What the measurement inherits
        </text>
        <text className={`${fig.label} ${fig.labelSmall}`} x={PANEL_X} y={FRAME.y + 32}>
          {current.name.toLowerCase()} · illustrative
        </text>
        {MEASURES.map((measure, i) => {
          const y = FRAME.y + 66 + i * ROW;
          const state = inherits[i];
          return (
            <g key={measure}>
              <text className={`${fig.label} ${fig.labelKey}`} x={PANEL_X} y={y}>
                {stacked && measure === "Left/right symmetry" ? "L/R symmetry" : measure}
              </text>
              <line className={fig.hair} x1={PANEL_X} y1={y + 8} x2={PANEL_X + 270} y2={y + 8} />
              <text
                className={`${fig.label} ${fig.labelSmall} ${
                  state === "reliable" ? fig.labelTeal : state === "unavailable" ? "" : fig.labelWarn
                }`}
                x={PANEL_X + 270}
                y={y}
                textAnchor="end"
                style={state === "unavailable" ? { opacity: 0.7 } : undefined}
              >
                {RELIABILITY_LABEL[state].toLowerCase()}
              </text>
            </g>
          );
        })}
        <g style={{ opacity: issue === "none" ? 0.45 : 1 }}>
          <text className={`${fig.label} ${fig.labelSmall}`} x={PANEL_X} y={FRAME.y + 66 + MEASURES.length * ROW + 6}>
            {stacked ? "confidence reported" : "reported keypoint confidence"}
          </text>
          <text className={`${fig.label} ${fig.labelSmall} ${fig.labelInk}`} x={PANEL_X + 270} y={FRAME.y + 66 + MEASURES.length * ROW + 6} textAnchor="end">
            {issue === "none" ? "high" : "still high"}
          </text>
          <text className={`${fig.label} ${fig.labelSmall}`} x={PANEL_X} y={FRAME.y + 66 + MEASURES.length * ROW + 6 + (stacked ? 20 : 16)}>
            {stacked ? "joint actually correct" : "affected joint actually correct"}
          </text>
          <text className={`${fig.label} ${fig.labelSmall} ${issue === "none" ? fig.labelTeal : fig.labelWarn}`} x={PANEL_X + 270} y={FRAME.y + 66 + MEASURES.length * ROW + 6 + (stacked ? 20 : 16)} textAnchor="end">
            {issue === "none" ? "yes" : "no"}
          </text>
        </g>
      </g>
    </svg>
  );

  if (presentation) {
    return <div>{svg}</div>;
  }

  return (
    <InteractiveFigure
      id="pose-error-explorer"
      articleSlug={articleSlug}
      eyebrow="Interactive hero"
      title="AI view against the original frame"
      status="illustrative"
      hint="tap"
      hero
      minHeight="420px"
      description={DESCRIPTION}
      caption={
        <>
          <strong>{current.name}.</strong> {current.note}{" "}
          {issue !== "none" && "The estimator's confidence for the affected joint need not drop at all."}
        </>
      }
      actions={<ShareInsight figureId="pose-error-explorer" state={{ issue, view }} label="Share this frame" articleSlug={articleSlug} />}
    >
      <div
        role="presentation"
        onClick={(event) => {
          /* A press on the picture itself flips the view — the reveal is the
             interaction; the buttons below do the same for a keyboard. */
          if ((event.target as HTMLElement).closest("button")) return;
          chooseView(view === "ai" ? "original" : "ai");
        }}
        style={{ cursor: "pointer" }}
      >
        {svg}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className={ui.segment} role="radiogroup" aria-label="View">
          {(["ai", "original"] as View[]).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={view === value}
              onClick={() => chooseView(value)}
              className={`${ui.segmentBtn} ${view === value ? ui.segmentOn : ""}`}
            >
              {value === "ai" ? "AI view" : "Original frame"}
            </button>
          ))}
        </div>
        <div className={ui.chips} role="group" aria-label="Failure mode">
          {ISSUES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={issue === item.id}
              onClick={() => chooseIssue(item.id)}
              className={`${ui.chip} ${issue === item.id ? ui.chipOn : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </InteractiveFigure>
  );
}

"use client";

import { useMemo } from "react";
import { GAIT_PHASES, type Pt } from "@/components/visuals/gait-phases";
import { PoseFrame, smoothPath } from "@/components/research/PoseFrame";
import { InteractiveFigure } from "../InteractiveFigure";
import { useHoldGesture } from "../useHoldGesture";
import { useNarrow } from "../useNarrow";
import { GAIT_EVENT_NAMES } from "../gait";
import type { FigureProps } from "../registry";
import fig from "../figures.module.css";
import ui from "../experience.module.css";

/**
 * ONE FRAME IS NOT GAIT.
 *
 * One skeleton at mid-stance, alone. Hold the button — a finger, a mouse
 * button or the Space bar — and the four other gait events of the stride
 * appear around it in order, with the ankle's path drawn through them.
 * Release and they leave. The reader does the argument with their hand:
 * posture is a frame; gait is the sequence.
 *
 * The five poses are the project's keyframes, so this is a real stride.
 */

const W = 560;
const H = 252;
const S = 1.35;
const BASE_Y = 140;
const GROUND = BASE_Y + 48 * S;
const XS = [96, 188, 280, 372, 464];
const CLASSES = { bone: fig.bone, boneFar: fig.boneFar, joint: fig.joint, head: fig.head, contact: fig.contact };

const DESCRIPTION = `A single skeleton at mid-stance stands alone: one frame, which shows posture.
While the "Hold to reveal gait" control is held, four more skeletons appear on either side in stride order — heel strike, loading, mid-stance, toe-off, swing — and the ankle's path is drawn through all five. Released, they fade and one frame remains.
The point: cadence, symmetry and variability exist only across this sequence, never in one frame.`;

export function OneFrameHold({ articleSlug, presentation }: FigureProps) {
  const { held, handlers } = useHoldGesture();
  const narrow = useNarrow(640);
  const revealed = held || presentation?.held === true;

  const ankle = useMemo(
    () =>
      smoothPath(
        GAIT_PHASES.map((p, i) => [XS[i] + p.nearLeg[2][0] * S, BASE_Y - p.lift * S + p.nearLeg[2][1] * S] as Pt),
      ),
    [],
  );

  return (
    <InteractiveFigure
      id="one-frame-is-not-gait"
      articleSlug={articleSlug}
      eyebrow="Interactive figure"
      title="One frame shows posture. Hold to reveal gait."
      status="conceptual"
      hint="hold"
      wide
      minHeight="300px"
      description={DESCRIPTION}
      caption="Five canonical gait events from GaitAI's own keyframes. Step timing, symmetry and variability are properties of the sequence, so none of them exists in the single frame."
    >
      <svg viewBox={`0 0 ${W} ${H}`} className={`${fig.svg} ${narrow ? fig.narrow : ""}`} aria-hidden="true">
        <line className={fig.ground} x1={40} y1={GROUND} x2={520} y2={GROUND} />
        {GAIT_PHASES.map((phase, i) => {
          const centre = i === 2;
          const on = centre || revealed;
          const delay = centre ? 0 : Math.abs(i - 2) * 90;
          return (
            <g
              key={phase.id}
              className={fig.fade}
              style={{
                opacity: on ? 1 : 0,
                transitionDelay: revealed ? `${delay}ms` : "0ms",
              }}
            >
              <g transform={`translate(${XS[i]} ${BASE_Y - phase.lift * S})`}>
                <g style={{ opacity: centre ? 1 : 0.75 }}>
                  <PoseFrame phase={phase} s={S} classes={CLASSES} showContacts />
                </g>
              </g>
              <text className={`${fig.label} ${fig.labelSmall}`} x={XS[i]} y={30} textAnchor="middle">
                {String(i + 1).padStart(2, "0")}
              </text>
              <text
                className={`${fig.label} ${centre ? fig.labelInk : ""}`}
                x={XS[i]}
                y={44}
                textAnchor="middle"
              >
                {GAIT_EVENT_NAMES[i]}
              </text>
            </g>
          );
        })}
        <path
          className={`${fig.trace} ${fig.draw} ${revealed ? fig.drawOn : ""}`}
          pathLength={1}
          d={ankle}
          style={{ opacity: revealed ? 1 : 0, transition: "stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1), opacity 0.3s" }}
        />
        <text className={`${fig.label} ${revealed ? fig.labelAccent : ""}`} x={40} y={H - 12}>
          {revealed ? "A sequence shows a gait." : "One frame shows a posture."}
        </text>
        <text className={`${fig.label} ${fig.labelSmall}`} x={520} y={H - 12} textAnchor="end">
          {revealed ? "stance → swing · one stride" : "mid-stance · one frame"}
        </text>
      </svg>

      {!presentation && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            aria-pressed={held}
            className={`${ui.holdBtn} ${held ? ui.holdBtnOn : ""}`}
            {...handlers}
          >
            <span aria-hidden="true" className={ui.holdRing} />
            {held ? "Release to return to one frame" : "Hold to reveal gait"}
          </button>
        </div>
      )}
    </InteractiveFigure>
  );
}

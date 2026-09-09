"use client";

import { useEffect, useMemo, useState } from "react";
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
 * WHAT HAPPENS WHEN CAPTURE QUALITY BREAKS?
 *
 * Five things that go wrong with real captures, as toggles. Each one changes
 * the picture of the walker — legs hidden, feet cropped, the frame darkened,
 * blurred, or seen from a collapsing angle — and the table beside it says,
 * for each movement signal, whether it is still AVAILABLE, DEGRADED,
 * UNRELIABLE or UNAVAILABLE.
 *
 * QUALITATIVE ON PURPOSE. The mapping is an editorial teaching table (which
 * capture problems hurt which features, and roughly how badly); it is not the
 * output of any analysis and it prints no accuracy or confidence. Several
 * toggles combine by taking the worse verdict for each signal.
 */

type Condition = "occlude" | "crop" | "light" | "blur" | "angle";
type Verdict = 0 | 1 | 2 | 3; // available · degraded · unreliable · unavailable

const CONDITIONS: Array<{ id: Condition; label: string; note: string }> = [
  { id: "occlude", label: "Occlude legs", note: "Furniture or another person hides the legs for part of the walk." },
  { id: "crop", label: "Crop feet", note: "The feet leave the bottom of the frame." },
  { id: "light", label: "Low light", note: "Under-exposed frames; landmarks jitter." },
  { id: "blur", label: "Motion blur", note: "Fast movement smears the limbs across frames." },
  { id: "angle", label: "Poor camera angle", note: "A frontal or steep view collapses the movement being measured." },
];

const SIGNALS = [
  "Cadence",
  "Stance / swing timing",
  "Left / right symmetry",
  "Ankle trajectory",
  "Stride length",
  "Posture",
  "Walking speed",
] as const;

/* Rows: signals in the order above. Columns: occlude, crop, light, blur, angle. */
const TABLE: Record<(typeof SIGNALS)[number], Record<Condition, Verdict>> = {
  Cadence: { occlude: 1, crop: 0, light: 1, blur: 0, angle: 0 },
  "Stance / swing timing": { occlude: 3, crop: 1, light: 1, blur: 2, angle: 1 },
  "Left / right symmetry": { occlude: 3, crop: 1, light: 1, blur: 1, angle: 2 },
  "Ankle trajectory": { occlude: 3, crop: 3, light: 2, blur: 2, angle: 2 },
  "Stride length": { occlude: 3, crop: 2, light: 2, blur: 1, angle: 3 },
  Posture: { occlude: 0, crop: 0, light: 1, blur: 1, angle: 1 },
  "Walking speed": { occlude: 1, crop: 1, light: 1, blur: 0, angle: 2 },
};

const VERDICT_LABEL = ["Available", "Degraded", "Unreliable", "Unavailable"] as const;
const VERDICT_CLASS = [ui.qualOk, ui.qualMid, ui.qualBad, ui.qualOff] as const;

const W = 300;
const H = 300;
const FX = 150;
const FY = 150;
const S = 2;
const GROUND = FY + 48 * S;
const CLASSES = { bone: fig.bone, boneFar: fig.boneFar, joint: fig.joint, head: fig.head };

const DESCRIPTION = `Five capture problems can be switched on: occlude legs, crop feet, low light, motion blur, poor camera angle. For seven movement signals — cadence, stance/swing timing, left/right symmetry, ankle trajectory, stride length, posture, walking speed — a qualitative verdict is shown: available, degraded, unreliable or unavailable.
With a clean capture every signal is available. Hiding the legs removes timing, symmetry, trajectory and stride length while cadence and posture survive. Cropping the feet removes the ankle trajectory and makes stride length unreliable. Low light degrades everything a little. Motion blur makes timing and trajectory unreliable. A poor angle removes stride length and makes symmetry and speed unreliable.
This is an illustrative teaching table, not an analysis of any capture.`;

export function SignalQualityLab({ articleSlug, presentation }: FigureProps) {
  const shared = useSharedFigureState("signal-quality");
  const narrow = useNarrow(640);
  const [on, setOn] = useState<Set<Condition>>(() => {
    const initial = typeof presentation?.c === "string" ? presentation.c : "";
    return new Set(initial.split(",").filter(Boolean) as Condition[]);
  });

  useEffect(() => {
    if (shared && typeof shared.c === "string") {
      setOn(new Set(shared.c.split(",").filter((v) => CONDITIONS.some((c) => c.id === v)) as Condition[]));
    }
  }, [shared]);

  const toggle = (id: Condition) => {
    setOn((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    trackInsightEvent("signal_quality_demo_used", { article: articleSlug, condition: id });
  };

  const verdicts = useMemo(
    () =>
      SIGNALS.map((signal) => {
        let worst: Verdict = 0;
        on.forEach((c) => {
          worst = Math.max(worst, TABLE[signal][c]) as Verdict;
        });
        return worst;
      }),
    [on],
  );

  const occlude = on.has("occlude");
  const crop = on.has("crop");
  const light = on.has("light");
  const blur = on.has("blur");
  const angle = on.has("angle");
  const phase = GAIT_PHASES[0];
  const state = [...on].sort().join(",");

  return (
    <InteractiveFigure
      id="signal-quality"
      articleSlug={articleSlug}
      eyebrow="Interactive figure"
      title="What happens when capture quality breaks?"
      status="illustrative"
      hint="tap"
      wide
      minHeight="420px"
      description={DESCRIPTION}
      caption="An illustrative teaching table — which capture problems hurt which signals, and roughly how badly. It is not the output of any analysis and it prints no accuracy or confidence."
      actions={
        !presentation && (
          <ShareInsight
            figureId="signal-quality"
            state={{ c: state }}
            label="Share this experiment"
            articleSlug={articleSlug}
          />
        )
      }
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className={`${fig.svg} ${narrow ? fig.narrow : ""}`} aria-hidden="true" style={{ maxHeight: 320 }}>
            <defs>
              <clipPath id="sq-frame">
                <rect x={30} y={20} width={240} height={crop ? 200 : 262} rx={4} />
              </clipPath>
            </defs>
            <rect className={fig.frame} x={30} y={20} width={240} height={crop ? 200 : 262} rx={4} />
            <g clipPath="url(#sq-frame)">
              <line className={fig.ground} x1={40} y1={GROUND} x2={260} y2={GROUND} />
              <g
                className={`${fig.move} ${blur ? fig.blur : ""}`}
                transform={
                  angle
                    ? `translate(${FX} ${FY - phase.lift * S}) scale(0.55 1) skewX(-6)`
                    : `translate(${FX} ${FY - phase.lift * S})`
                }
                style={{ opacity: light ? 0.42 : 1 }}
              >
                <PoseFrame phase={phase} s={S} classes={CLASSES} />
              </g>
              {/* occlusion: a foreground mass across the legs */}
              <rect
                className={`${fig.plate} ${fig.fade}`}
                style={{ opacity: occlude ? 0.96 : 0 }}
                x={60}
                y={FY + 14 * S}
                width={190}
                height={80}
                rx={3}
              />
              <text
                className={`${fig.label} ${fig.labelSmall} ${fig.fade}`}
                style={{ opacity: occlude ? 1 : 0 }}
                x={70}
                y={FY + 14 * S + 18}
              >
                foreground object
              </text>
              {/* low light: a dark wash */}
              <rect
                className={fig.fade}
                style={{ opacity: light ? 0.55 : 0 }}
                x={30}
                y={20}
                width={240}
                height={270}
                fill="rgb(var(--c-obsidian-500))"
              />
            </g>
            {crop && (
              <text className={`${fig.label} ${fig.labelWarn} ${fig.labelSmall}`} x={40} y={238}>
                feet outside the frame
              </text>
            )}
            <text className={`${fig.label} ${fig.labelSmall}`} x={40} y={290}>
              {on.size === 0 ? "clean capture" : `${on.size} problem${on.size > 1 ? "s" : ""} active`}
            </text>
          </svg>

          {!presentation && (
            <div className={`${ui.chips} mt-1`} role="group" aria-label="Capture problems">
              {CONDITIONS.map((condition) => (
                <button
                  key={condition.id}
                  type="button"
                  aria-pressed={on.has(condition.id)}
                  title={condition.note}
                  onClick={() => toggle(condition.id)}
                  className={`${ui.chip} ${ui.chipWarn} ${on.has(condition.id) ? ui.chipOn : ""}`}
                >
                  {condition.label}
                </button>
              ))}
              {on.size > 0 && (
                <button type="button" onClick={() => setOn(new Set())} className={ui.chip}>
                  Clean capture
                </button>
              )}
            </div>
          )}
        </div>

        <div role="table" aria-label="Signal availability under the selected capture problems">
          <div role="row" className={ui.qualRow} style={{ borderBottomWidth: 1 }}>
            <span role="columnheader" className={ui.qualName}>
              Movement signal
            </span>
            <span role="columnheader" className={ui.qualName}>
              Status
            </span>
          </div>
          {SIGNALS.map((signal, i) => (
            <div key={signal} role="row" className={ui.qualRow}>
              <span role="cell">{signal}</span>
              <span role="cell" className={`${ui.qual} ${VERDICT_CLASS[verdicts[i]]}`}>
                {VERDICT_LABEL[verdicts[i]]}
              </span>
            </div>
          ))}
          <p className={ui.note}>
            {on.size === 0
              ? "A clean, well-framed capture: every signal can be computed. Switch a problem on to see what a responsible pipeline should withhold."
              : "Where a signal is unreliable or unavailable, the pipeline should flag the capture, attenuate confidence, or decline to emit that feature — an honest gap beats a confident artefact."}
          </p>
        </div>
      </div>
    </InteractiveFigure>
  );
}

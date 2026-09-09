"use client";

import { useEffect, useRef, useState } from "react";
import { trackInsightEvent } from "@/lib/insight-events";
import { InteractiveFigure } from "../InteractiveFigure";
import { StageControl, type Stage } from "../StageControl";
import { ShareInsight, useSharedFigureState } from "../ShareInsight";
import { useNarrow } from "../useNarrow";
import type { FigureProps } from "../registry";
import {
  PARAMETER_LABEL,
  READING_LABEL,
  SYMMETRY_LEVELS,
  isSymmetryLevel,
  isSymmetryParameter,
  symmetryState,
  type SymmetryLevel,
  type SymmetryParameter,
} from "./symmetry-model";
import fig from "../figures.module.css";
import ui from "../experience.module.css";

/**
 * WHAT DOES GAIT SYMMETRY ACTUALLY MEAN — left against right, as time.
 *
 *   LEFT   ████████░░░░░████████░░░░░        stance ■  swing ░
 *   RIGHT  ░░░░░████████░░░░░████████
 *          ▲ heel strike        SYMMETRICAL
 *
 * Two gait cycles on one clock. The reader picks WHICH comparison to move —
 * stance duration, swing duration or step timing — and drags the right side
 * away from the left. The left cycle's boundaries stay drawn over the right
 * as dashed guides, so the misalignment is visible as geometry, and the only
 * reading is qualitative: symmetrical, mildly asymmetrical, asymmetrical,
 * clearly asymmetrical. A line beneath says what moved, in words.
 *
 * ILLUSTRATIVE, and labelled so. The proportions are drawn, not measured; no
 * ratio, index or percentage appears anywhere in the figure.
 */

const PARAMETERS: SymmetryParameter[] = ["stance", "swing", "timing"];

const STAGE_NAMES: Record<SymmetryParameter, [string, string, string]> = {
  stance: ["Left stands longer", "Symmetric", "Right stands longer"],
  swing: ["Left swings longer", "Symmetric", "Right swings longer"],
  timing: ["Right strikes early", "Even steps", "Right strikes late"],
};

const WHAT_MOVED: Record<SymmetryParameter, (level: SymmetryLevel) => string> = {
  stance: (level) =>
    level === 0
      ? "Both feet spend the same share of their cycle on the ground."
      : `The ${level > 0 ? "right" : "left"} foot stays on the ground longer; the other spends more of its cycle in the air.`,
  swing: (level) =>
    level === 0
      ? "Both legs spend the same share of their cycle in the air."
      : `The ${level > 0 ? "right" : "left"} leg swings longer, so its stance is shorter and the other side carries more.`,
  timing: (level) =>
    level === 0
      ? "Heel strikes are evenly spaced: each step takes the same time as the last."
      : `The right heel strikes ${level > 0 ? "late" : "early"}: steps alternate short and long even though each phase lasts as long as before.`,
};

const W = 640;
const H = 360;
const X0 = 56;
const X1 = 592;
const CYCLES = 1.6; /* how much of the shared clock is drawn */
const LEFT_Y = 118;
const RIGHT_Y = 208;
const BAR = 26;

const DESCRIPTION = `Two gait cycles drawn as horizontal bars of time, one for the left leg and one for the right, on a shared clock. Each bar is filled while the foot is on the ground (stance) and open while it is in the air (swing); a tick marks each heel strike. The right cycle starts half a cycle after the left.
A control chooses which comparison to move — stance duration, swing duration or step timing — and a seven-step track shifts the right side away from the left, or the left away from the right. Stance: one foot stays on the ground longer and the other's stance shrinks. Swing: one leg spends longer in the air. Step timing: the right heel strikes early or late, so steps alternate short and long.
The left cycle's boundaries stay drawn over the right bar as dashed guides so the misalignment is visible. The only reading is qualitative: symmetrical, mildly asymmetrical, asymmetrical or clearly asymmetrical, with a sentence saying what moved. Illustrative: the proportions are drawn, not measured, and no ratio or index value is shown.`;

export function SymmetryExplorer({ articleSlug, presentation }: FigureProps) {
  const shared = useSharedFigureState("symmetry-explorer");
  const [parameter, setParameter] = useState<SymmetryParameter>(() =>
    isSymmetryParameter(presentation?.parameter) ? presentation.parameter : "stance",
  );
  const [level, setLevel] = useState<SymmetryLevel>(() => (isSymmetryLevel(presentation?.level) ? presentation.level : 0));
  const stacked = useNarrow(640);
  const touched = useRef(new Set<SymmetryParameter>());

  useEffect(() => {
    if (!shared) return;
    if (isSymmetryParameter(shared.parameter)) setParameter(shared.parameter);
    if (isSymmetryLevel(shared.level)) setLevel(shared.level);
  }, [shared]);
  useEffect(() => {
    if (!presentation) return;
    if (isSymmetryParameter(presentation.parameter)) setParameter(presentation.parameter);
    if (isSymmetryLevel(presentation.level)) setLevel(presentation.level);
  }, [presentation]);

  const state = symmetryState(parameter, level);

  const record = (nextParameter: SymmetryParameter, nextLevel: SymmetryLevel) => {
    if (presentation) return;
    const next = symmetryState(nextParameter, nextLevel);
    trackInsightEvent(
      "symmetry_adjusted",
      { article_slug: articleSlug, state: `${nextParameter}:${next.reading}` },
      { debounce: "symmetry" },
    );
    if (nextLevel !== 0) touched.current.add(nextParameter);
    /* Completion: two different comparisons moved away from symmetric — the
       reader has felt that they are different things. */
    if (touched.current.size >= 2) {
      trackInsightEvent(
        "interactive_figure_complete",
        { article_slug: articleSlug, figure_id: "symmetry-explorer" },
        { once: "symmetry-explorer" },
      );
    }
  };
  const chooseLevel = (index: number) => {
    const next = SYMMETRY_LEVELS[Math.max(0, Math.min(6, index))];
    setLevel(next);
    record(parameter, next);
  };
  const chooseParameter = (next: SymmetryParameter) => {
    setParameter(next);
    record(next, level);
  };

  const stages: Stage[] = SYMMETRY_LEVELS.map((value, index) => ({
    id: String(value),
    label: index === 0 ? STAGE_NAMES[parameter][0] : index === 3 ? STAGE_NAMES[parameter][1] : index === 6 ? STAGE_NAMES[parameter][2] : "",
    name: index === 3 ? STAGE_NAMES[parameter][1] : value < 0 ? `${STAGE_NAMES[parameter][0]}, ${Math.abs(value)} of 3` : `${STAGE_NAMES[parameter][2]}, ${value} of 3`,
  }));

  /* Time → x. */
  const span = X1 - X0;
  const xAt = (t: number) => X0 + (t / CYCLES) * span;

  /** Stance segments for a side across the drawn window. */
  const stances = (start: number, stance: number) => {
    const out: Array<[number, number]> = [];
    for (let k = -1; k <= 2; k++) {
      const s = start + k;
      const e = s + stance;
      const a = Math.max(0, s);
      const b = Math.min(CYCLES, e);
      if (b > a) out.push([a, b]);
    }
    return out;
  };
  const strikes = (start: number) => [-1, 0, 1, 2].map((k) => start + k).filter((t) => t >= 0 && t <= CYCLES);

  const leftStance = stances(state.left.start, state.left.stance);
  const rightStance = stances(state.right.start, state.right.stance);
  const tone = state.reading === "symmetrical" ? fig.labelTeal : state.reading === "mildly-asymmetrical" ? fig.labelAccent : fig.labelWarn;

  /* Stacked: the side labels sit above their bars, the legend stacks, and the
     reading moves to its own line. */
  const viewBox = stacked ? "0 56 640 300" : `0 0 ${W} ${H}`;

  const bar = (y: number, label: string, side: "left" | "right", segments: Array<[number, number]>, heelStrikes: number[]) => (
    <g>
      <text
        className={`${fig.label} ${fig.labelKey}`}
        x={stacked ? X0 : X0 - 8}
        y={stacked ? y - 14 : y + BAR / 2 + 4}
        textAnchor={stacked ? "start" : "end"}
      >
        {label}
      </text>
      <rect className={fig.frame} x={X0} y={y} width={span} height={BAR} rx={3} />
      {segments.map(([a, b]) => (
        <rect
          key={`${side}-${a}`}
          className={fig.fade}
          x={xAt(a)}
          y={y + 4}
          width={Math.max(0, xAt(b) - xAt(a))}
          height={BAR - 8}
          rx={2}
          fill={side === "left" ? "var(--jr-cyan)" : "var(--jr-royal)"}
          opacity={0.75}
        />
      ))}
      {heelStrikes.map((t) => (
        <g key={`${side}-strike-${t}`} className={fig.fade}>
          <line className={fig.trace} x1={xAt(t)} y1={y - 8} x2={xAt(t)} y2={y + BAR + 8} style={{ stroke: side === "left" ? "var(--jr-cyan)" : "var(--jr-royal)" }} />
          <circle className={fig.nodeFill} cx={xAt(t)} cy={y - 8} r={2.4} style={{ fill: side === "left" ? "var(--jr-cyan)" : "var(--jr-royal)" }} />
        </g>
      ))}
    </g>
  );

  const svg = (
    <svg viewBox={viewBox} className={`${fig.svg} ${stacked ? fig.narrow : ""}`} aria-hidden="true" style={{ maxHeight: stacked ? undefined : 360, margin: "0 auto" }}>
      {/* the shared clock */}
      <text className={`${fig.label} ${fig.labelSmall}`} x={stacked ? X1 : X0} y={72} textAnchor={stacked ? "end" : "start"}>
        {stacked ? "time →" : "one gait cycle, then most of the next · time →"}
      </text>
      <line className={fig.ground} x1={X0} y1={82} x2={X1} y2={82} />
      {[0, 0.5, 1, 1.5].map((t) => (
        <g key={t}>
          <line className={fig.hair} x1={xAt(t)} y1={78} x2={xAt(t)} y2={86} />
          <text className={`${fig.label} ${fig.labelSmall}`} x={xAt(t)} y={stacked ? 72 : 98} textAnchor={stacked && t === 0 ? "start" : "middle"}>
            {t === 0 ? (stacked ? "" : "start") : t === 1 ? "one cycle" : ""}
          </text>
        </g>
      ))}

      {bar(LEFT_Y, "Left", "left", leftStance, strikes(state.left.start))}
      {bar(RIGHT_Y, "Right", "right", rightStance, strikes(state.right.start))}

      {/* the left cycle's stance boundaries, shifted by the nominal half cycle,
          drawn over the right bar: where a symmetric right side would be */}
      <g className={fig.fade} style={{ opacity: state.reading === "symmetrical" ? 0 : 1 }}>
        {stances(state.left.start + 0.5, state.left.stance).map(([a, b]) => (
          <g key={`ghost-${a}`}>
            <line className={fig.dash} x1={xAt(a)} y1={RIGHT_Y - 2} x2={xAt(a)} y2={RIGHT_Y + BAR + 2} />
            <line className={fig.dash} x1={xAt(b)} y1={RIGHT_Y - 2} x2={xAt(b)} y2={RIGHT_Y + BAR + 2} />
          </g>
        ))}
        <text className={`${fig.label} ${fig.labelSmall}`} x={X1} y={RIGHT_Y + BAR + 20} textAnchor="end">
          dashed: where a symmetric right side would be
        </text>
      </g>

      {/* legend */}
      <g>
        <rect x={X0} y={272} width={14} height={8} rx={2} fill="var(--jr-cyan)" opacity={0.75} />
        <text className={`${fig.label} ${fig.labelSmall}`} x={X0 + 20} y={279}>
          stance · foot on the ground
        </text>
        <rect className={fig.frame} x={stacked ? X0 : X0 + 200} y={stacked ? 290 : 272} width={14} height={8} rx={2} />
        <text className={`${fig.label} ${fig.labelSmall}`} x={stacked ? X0 + 20 : X0 + 220} y={stacked ? 297 : 279}>
          swing · foot in the air
        </text>
      </g>

      {/* the reading */}
      <text className={`${fig.label} ${fig.labelKey} ${tone}`} x={stacked ? X0 : X1} y={stacked ? 326 : 279} textAnchor={stacked ? "start" : "end"}>
        {READING_LABEL[state.reading]}
      </text>
      <text className={`${fig.label} ${fig.labelSmall}`} x={stacked ? X0 : X1} y={stacked ? 344 : 296} textAnchor={stacked ? "start" : "end"}>
        {PARAMETER_LABEL[parameter].toLowerCase()} · illustrative
      </text>
    </svg>
  );

  if (presentation) return <div>{svg}</div>;

  return (
    <InteractiveFigure
      id="symmetry-explorer"
      articleSlug={articleSlug}
      eyebrow="Interactive hero"
      title="Left against right, as time"
      status="illustrative"
      hint="scrub"
      hero
      minHeight="400px"
      description={DESCRIPTION}
      caption={
        <>
          <strong>{READING_LABEL[state.reading]}.</strong> {WHAT_MOVED[parameter](level)} Nothing here is a ratio or a threshold: the
          reading is a comparison in words.
        </>
      }
      actions={<ShareInsight figureId="symmetry-explorer" state={{ parameter, level }} label="Share this comparison" articleSlug={articleSlug} />}
    >
      {svg}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className={ui.chips} role="group" aria-label="Which comparison to move">
          {PARAMETERS.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={parameter === item}
              onClick={() => chooseParameter(item)}
              className={`${ui.chip} ${parameter === item ? ui.chipOn : ""}`}
            >
              {PARAMETER_LABEL[item]}
            </button>
          ))}
        </div>
      </div>
      <StageControl
        stages={stages}
        value={SYMMETRY_LEVELS.indexOf(level)}
        onChange={(next) => chooseLevel(next)}
        ariaLabel={`${PARAMETER_LABEL[parameter]}: left against right`}
        labels={[0, 3, 6]}
        hint="Drag the track, tap a step, or use ← →"
        dense={false}
      />
    </InteractiveFigure>
  );
}

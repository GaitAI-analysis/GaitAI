"use client";

import { useEffect, useRef, useState } from "react";
import type { Pt } from "@/components/visuals/gait-phases";
import { smoothPath } from "@/components/research/PoseFrame";
import { trackInsightEvent } from "@/lib/insight-events";
import { InteractiveFigure } from "../InteractiveFigure";
import { StageControl, type Stage } from "../StageControl";
import { ShareInsight, useSharedFigureState } from "../ShareInsight";
import { useNarrow } from "../useNarrow";
import type { FigureProps } from "../registry";
import {
  MAX_OBSERVATIONS,
  OBSERVATIONS,
  POPULATION,
  READING_LABEL,
  isBaselineMode,
  personalBand,
  populationCurve,
  readingFor,
  type BaselineMode,
} from "./baseline-model";
import fig from "../figures.module.css";
import ui from "../experience.module.css";

/**
 * WHAT IS A PERSONAL MOVEMENT BASELINE — the same reading, two references.
 *
 *   POPULATION REFERENCE            PERSONAL BASELINE
 *        ╭──╮                        · · · · · ·
 *      ╭─╯  ╰─╮   ● latest                   · ●   latest
 *   ───╯      ╰───   inside          ─────────────   outside own band
 *
 * One unitless movement index on one axis. Left: where everyone sits — a
 * distribution and its reference range, with this person's latest reading
 * marked inside it. Right: the same person's repeated observations over
 * time, forming their own narrow band, with the same latest reading marked
 * against it. A track brings observations in one by one; the band forms
 * after a few; then the latest readings drift and the two references
 * disagree. The reading is a phrase, never a value.
 *
 * ILLUSTRATIVE, and labelled so. No clinical threshold, no diagnosis.
 */

const W = 640;
const H = 360;
const LEFT = { x: 36, w: 280 };
const RIGHT = { x: 340, w: 280 };
const AXIS_Y = 250;
const TOP_Y = 80;

const DESCRIPTION = `One unitless movement index drawn on a shared axis, two ways. Population reference: a bell-shaped distribution of where a population sits, with a shaded reference range across the middle and this person's latest reading marked as a point — inside the range. Personal baseline: the same person's repeated observations over time as points at their own position, forming a narrow band above the population centre once three or more have been recorded, with the same latest reading marked against that band.
A track brings observations in one at a time, up to eight. The first observations sit close together; after a few the personal band forms; the last two drift lower — still well inside the population range, but outside the person's own band. The reading beneath is a phrase: within the population range; not enough observations for a baseline; within this person's own baseline; outside this person's own baseline.
Illustrative: positions drawn to make the argument visible, not measured from anyone, and no value is shown.`;

export function BaselineExplorer({ articleSlug, presentation }: FigureProps) {
  const shared = useSharedFigureState("baseline-explorer");
  const [mode, setMode] = useState<BaselineMode>(() => (isBaselineMode(presentation?.mode) ? presentation.mode : "population"));
  const [shown, setShown] = useState<number>(() =>
    typeof presentation?.shown === "number" ? Math.max(1, Math.min(MAX_OBSERVATIONS, presentation.shown)) : 1,
  );
  const stacked = useNarrow(640);
  const seen = useRef({ modes: new Set<BaselineMode>(), full: false });

  useEffect(() => {
    if (!shared) return;
    if (isBaselineMode(shared.mode)) setMode(shared.mode);
    if (typeof shared.shown === "number") setShown(Math.max(1, Math.min(MAX_OBSERVATIONS, shared.shown)));
  }, [shared]);
  useEffect(() => {
    if (!presentation) return;
    if (isBaselineMode(presentation.mode)) setMode(presentation.mode);
    if (typeof presentation.shown === "number") setShown(Math.max(1, Math.min(MAX_OBSERVATIONS, presentation.shown)));
  }, [presentation]);

  const complete = () => {
    if (presentation || seen.current.modes.size < 2 || !seen.current.full) return;
    trackInsightEvent("interactive_figure_complete", { article_slug: articleSlug, figure_id: "baseline-explorer" }, { once: "baseline-explorer" });
  };
  const chooseMode = (next: BaselineMode) => {
    setMode(next);
    if (presentation) return;
    trackInsightEvent("baseline_mode_changed", { article_slug: articleSlug, mode: next });
    seen.current.modes.add(next);
    complete();
  };
  const chooseShown = (next: number) => {
    const clamped = Math.max(1, Math.min(MAX_OBSERVATIONS, next));
    setShown(clamped);
    if (presentation) return;
    trackInsightEvent("trend_assessment_added", { article_slug: articleSlug, step: clamped }, { debounce: "baseline" });
    if (clamped >= 6) seen.current.full = true;
    complete();
  };

  const latest = OBSERVATIONS[shown - 1];
  const band = personalBand(shown);
  const reading = readingFor(mode, shown);
  const populationReading = readingFor("population", shown);
  const personalReading = readingFor("personal", shown);

  const xIn = (panel: { x: number; w: number }, t: number) => panel.x + t * panel.w;
  const curve = populationCurve();
  const curvePath = smoothPath(curve.map(([x, y]) => [xIn(LEFT, x), AXIS_Y - y * (AXIS_Y - TOP_Y - 20)] as Pt));

  const stages: Stage[] = Array.from({ length: MAX_OBSERVATIONS }, (_, i) => ({
    id: `o${i + 1}`,
    label: String(i + 1).padStart(2, "0"),
    name: `${i + 1} ${i === 0 ? "observation" : "observations"}`,
  }));

  const viewBox = stacked ? "0 0 322 650" : `0 0 ${W} ${H}`;
  const rightTransform = stacked ? `translate(${-RIGHT.x + LEFT.x} 270)` : undefined;
  const focusLeft = mode === "population";

  const svg = (
    <svg viewBox={viewBox} className={`${fig.svg} ${stacked ? fig.narrow : ""}`} aria-hidden="true" style={{ maxHeight: stacked ? undefined : 380, margin: "0 auto" }}>
      {/* ── population reference ── */}
      <g className={fig.fade} style={{ opacity: focusLeft || stacked ? 1 : 0.55 }}>
        <text className={`${fig.label} ${fig.labelKey} ${focusLeft ? fig.labelAccent : ""}`} x={LEFT.x} y={44}>
          Population reference
        </text>
        <text className={`${fig.label} ${fig.labelSmall}`} x={LEFT.x} y={60}>
          {stacked ? "where everyone sits" : "where everyone sits · one movement index"}
        </text>
        <rect className={fig.band} x={xIn(LEFT, POPULATION.range[0])} y={TOP_Y} width={xIn(LEFT, POPULATION.range[1]) - xIn(LEFT, POPULATION.range[0])} height={AXIS_Y - TOP_Y} rx={3} />
        <path className={`${fig.trace} ${fig.traceViolet}`} d={curvePath} />
        <line className={fig.ground} x1={LEFT.x} y1={AXIS_Y} x2={LEFT.x + LEFT.w} y2={AXIS_Y} />
        <text className={`${fig.label} ${fig.labelSmall}`} x={xIn(LEFT, (POPULATION.range[0] + POPULATION.range[1]) / 2)} y={AXIS_Y + 18} textAnchor="middle">
          reference range
        </text>
        <line className={fig.dash} x1={xIn(LEFT, latest)} y1={TOP_Y - 10} x2={xIn(LEFT, latest)} y2={AXIS_Y} style={{ stroke: "var(--jr-cyan)" }} />
        <circle className={fig.halo} cx={xIn(LEFT, latest)} cy={TOP_Y - 10} r={11} />
        <circle className={fig.node} cx={xIn(LEFT, latest)} cy={TOP_Y - 10} r={5} />
        <circle className={fig.nodeFill} cx={xIn(LEFT, latest)} cy={TOP_Y - 10} r={2.4} />
        <text className={`${fig.label} ${fig.labelSmall} ${fig.labelTeal}`} x={xIn(LEFT, latest) + (stacked ? -12 : 10)} y={TOP_Y - 6} textAnchor={stacked ? "end" : undefined}>
          latest · {populationReading === "within-population" ? "inside" : "outside"}
        </text>
      </g>

      {/* ── personal baseline ── */}
      <g transform={rightTransform} className={fig.fade} style={{ opacity: !focusLeft || stacked ? 1 : 0.55 }}>
        <text className={`${fig.label} ${fig.labelKey} ${!focusLeft ? fig.labelAccent : ""}`} x={RIGHT.x} y={44}>
          Personal baseline
        </text>
        <text className={`${fig.label} ${fig.labelSmall}`} x={RIGHT.x} y={60}>
          {stacked ? "the same person, repeatedly" : "the same person, observed again and again"}
        </text>
        {/* the population range, faint, so the two panels share an axis */}
        <rect className={fig.band} style={{ opacity: 0.35 }} x={xIn(RIGHT, POPULATION.range[0])} y={TOP_Y} width={xIn(RIGHT, POPULATION.range[1]) - xIn(RIGHT, POPULATION.range[0])} height={AXIS_Y - TOP_Y} rx={3} />
        {band && (
          <g className={fig.fade}>
            <rect x={xIn(RIGHT, band.low)} y={TOP_Y} width={xIn(RIGHT, band.high) - xIn(RIGHT, band.low)} height={AXIS_Y - TOP_Y} rx={3} fill="var(--jr-teal)" opacity={0.14} />
            <line className={fig.dash} x1={xIn(RIGHT, band.low)} y1={TOP_Y} x2={xIn(RIGHT, band.low)} y2={AXIS_Y} style={{ stroke: "var(--jr-teal)" }} />
            <line className={fig.dash} x1={xIn(RIGHT, band.high)} y1={TOP_Y} x2={xIn(RIGHT, band.high)} y2={AXIS_Y} style={{ stroke: "var(--jr-teal)" }} />
            <text className={`${fig.label} ${fig.labelSmall} ${fig.labelTeal}`} x={xIn(RIGHT, (band.low + band.high) / 2)} y={AXIS_Y + 18} textAnchor="middle">
              own baseline
            </text>
          </g>
        )}
        <line className={fig.ground} x1={RIGHT.x} y1={AXIS_Y} x2={RIGHT.x + RIGHT.w} y2={AXIS_Y} />
        {/* observations, oldest at the top, newest lowest — time runs down */}
        {OBSERVATIONS.map((value, i) => {
          const on = i < shown;
          const isLatest = i === shown - 1;
          const y = TOP_Y + 8 + i * ((AXIS_Y - TOP_Y - 24) / (MAX_OBSERVATIONS - 1));
          return (
            <g key={i} className={fig.fade} style={{ opacity: on ? 1 : 0.35 }}>
              {on ? (
                <>
                  {isLatest && <circle className={fig.halo} cx={xIn(RIGHT, value)} cy={y} r={10} />}
                  <circle className={fig.node} cx={xIn(RIGHT, value)} cy={y} r={isLatest ? 5 : 3.6} style={{ stroke: reading === "outside-own" && isLatest ? "#f0b45a" : undefined }} />
                  <circle className={fig.nodeFill} cx={xIn(RIGHT, value)} cy={y} r={isLatest ? 2.4 : 1.8} />
                </>
              ) : (
                <circle className={fig.nodeFuture} cx={xIn(RIGHT, OBSERVATIONS[shown - 1])} cy={y} r={3.6} />
              )}
              <text className={`${fig.label} ${fig.labelSmall}`} x={RIGHT.x + RIGHT.w} y={y + 3} textAnchor="end" style={{ opacity: on ? 1 : 0.6 }}>
                {String(i + 1).padStart(2, "0")}
              </text>
            </g>
          );
        })}
        <text className={`${fig.label} ${fig.labelSmall}`} x={RIGHT.x} y={TOP_Y - 6}>
          time ↓
        </text>
      </g>

      {/* ── the reading ── */}
      <g transform={stacked ? "translate(0 300)" : undefined}>
        <text className={`${fig.label} ${fig.labelSmall}`} x={LEFT.x} y={AXIS_Y + 48}>
          {stacked ? "same reading · " : "the same latest reading · "}
          {mode === "population" ? (stacked ? "vs population" : "against the population · illustrative") : (stacked ? "vs this person" : "against this person · illustrative")}
        </text>
        <text
          className={`${fig.label} ${fig.labelKey} ${reading === "outside-own" ? fig.labelWarn : reading === "no-baseline-yet" ? "" : fig.labelTeal}`}
          x={LEFT.x}
          y={AXIS_Y + 68}
        >
          {READING_LABEL[reading]}
        </text>
        {shown >= 3 && (
          <text className={`${fig.label} ${fig.labelSmall}`} x={LEFT.x} y={AXIS_Y + 86}>
            {personalReading === "outside-own" && populationReading === "within-population"
              ? (stacked ? "the references disagree · one knows the person" : "the two references now disagree — and only one of them knows this person")
              : "the two references agree, for now"}
          </text>
        )}
      </g>
    </svg>
  );

  if (presentation) return <div>{svg}</div>;

  return (
    <InteractiveFigure
      id="baseline-explorer"
      articleSlug={articleSlug}
      eyebrow="Interactive hero"
      title="One reading, two references"
      status="illustrative"
      hint="scrub"
      hero
      minHeight="400px"
      description={DESCRIPTION}
      caption={
        <>
          <strong>{READING_LABEL[reading]}.</strong>{" "}
          {reading === "no-baseline-yet"
            ? "A baseline is made of repeated observations. With one or two there is nothing to compare against yet — only the population."
            : reading === "outside-own"
              ? "Inside the population range, outside this person's own band: personal change gives context a single threshold cannot."
              : mode === "population"
                ? "Against a population, this reading is unremarkable. That answers where the person sits among strangers, not whether they have changed."
                : "This reading sits where this person's earlier walks sat. Nothing has moved — which is also information."}
        </>
      }
      actions={<ShareInsight figureId="baseline-explorer" state={{ mode, shown }} label="Share this comparison" articleSlug={articleSlug} />}
    >
      {svg}
      <div className={`${ui.segment} mt-3`} role="radiogroup" aria-label="Reference">
        {(["population", "personal"] as BaselineMode[]).map((value) => (
          <button key={value} type="button" role="radio" aria-checked={mode === value} onClick={() => chooseMode(value)} className={`${ui.segmentBtn} ${mode === value ? ui.segmentOn : ""}`}>
            {value === "population" ? "Population reference" : "Personal baseline"}
          </button>
        ))}
      </div>
      <StageControl
        stages={stages}
        value={shown - 1}
        onChange={(next) => chooseShown(next + 1)}
        ariaLabel="Observations recorded"
        hint="Drag the track, tap an observation, or use ← →"
        dense={false}
      />
    </InteractiveFigure>
  );
}

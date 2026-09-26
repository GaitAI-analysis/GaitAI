"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Pt } from "@/components/visuals/gait-phases";
import { smoothPath } from "@/components/research/PoseFrame";
import { InteractiveFigure } from "../InteractiveFigure";
import { StageControl, type Stage } from "../StageControl";
import { ShareInsight, useSharedFigureState } from "../ShareInsight";
import { useFigureActive } from "../useFigureActive";
import { useNarrow } from "../useNarrow";
import type { FigureProps } from "../registry";
import { trackInsightEvent } from "@/lib/insight-events";
import fig from "../figures.module.css";
import ui from "../experience.module.css";

/**
 * A FALL-RISK SCORE IS NOT ENOUGH — one number becomes a trajectory.
 *
 * It opens with one large number that looks like the answer. Step by step
 * (scroll on a desktop, the control everywhere) another reading appears,
 * then another, until the first number has shrunk into one point on a
 * longitudinal graph:
 *
 *   One number is an observation. A trajectory is context.
 *
 * Then two toggles change the question: POPULATION REFERENCE lays a shared
 * band over the readings (every point can sit inside it); PERSONAL BASELINE
 * measures the same points against this person's own first walks (the drift
 * shows). Selecting a point opens a small set of signals for that
 * assessment — cadence, symmetry, stride variability, posture, capture
 * quality — as qualitative labels.
 *
 * EVERY NUMBER HERE IS ILLUSTRATIVE and says so on the figure. They are a
 * unitless index chosen to draw the argument; they are not a clinical score,
 * a threshold, or anyone's data.
 */

const VALUES = [72, 74, 70, 66, 63];
const LABELS = ["Assessment 01", "Assessment 02", "Assessment 03", "Assessment 04", "Assessment 05"];
type Ref = "population" | "personal";

const SIGNALS = ["Cadence", "Left / right symmetry", "Stride variability", "Posture", "Capture quality"] as const;
type Q = "steady" | "changed" | "watch" | "clean" | "degraded";
/* Illustrative per-assessment qualitative readings. */
const PER_POINT: Q[][] = [
  ["steady", "steady", "steady", "steady", "clean"],
  ["steady", "steady", "steady", "steady", "clean"],
  ["steady", "changed", "steady", "steady", "degraded"],
  ["steady", "changed", "watch", "steady", "clean"],
  ["changed", "changed", "watch", "changed", "clean"],
];
const Q_LABEL: Record<Q, string> = {
  steady: "Steady",
  changed: "Changed",
  watch: "Rising",
  clean: "Clean",
  degraded: "Degraded",
};
const Q_CLASS: Record<Q, string> = {
  steady: ui.qualOk,
  changed: ui.qualMid,
  watch: ui.qualMid,
  clean: ui.qualOk,
  degraded: ui.qualBad,
};

const STEPS: Stage[] = LABELS.map((label, i) => ({ id: `a${i + 1}`, label: `0${i + 1}`, name: label }));

const W = 640;
const H = 360;
const X0 = 90;
const X1 = 470;
const Y_TOP = 60;
const Y_BOTTOM = 270;
const xFor = (i: number) => X0 + (i * (X1 - X0)) / 4;
const yFor = (v: number) => Y_BOTTOM - ((v - 58) / 22) * (Y_BOTTOM - Y_TOP);

const DESCRIPTION = `An illustrative assessment sequence — five unitless index values, not clinical scores: 72, 74, 70, 66, 63.
It opens with the first value shown very large, as if it were the answer. Each step adds the next assessment until all five sit on a longitudinal graph and the first value is one point among them: one number is an observation, a trajectory is context.
A toggle switches the reference. Population reference: a shared band that all five readings sit inside, so each looks acceptable on its own. Personal baseline: a band around this person's own first readings, which the later points fall below — deviation from self is harder to explain away.
Selecting an assessment lists qualitative signals for it: cadence, left/right symmetry, stride variability, posture and capture quality, each marked steady, changed, rising, clean or degraded. Assessment 03 has a degraded capture, a reminder that a trend in the measurement setup is not a trend in the person.`;

export function LongitudinalTrend({ articleSlug, presentation }: FigureProps) {
  const shared = useSharedFigureState("longitudinal-trend");
  const [step, setStep] = useState(() => (typeof presentation?.step === "number" ? presentation.step : 0));
  const [reference, setReference] = useState<Ref>(() =>
    presentation?.reference === "personal" ? "personal" : "population",
  );
  const [point, setPoint] = useState<number | null>(() =>
    typeof presentation?.point === "number" ? presentation.point : null,
  );
  const { ref, reduced } = useFigureActive<HTMLDivElement>();
  const narrow = useNarrow(1024);
  const phone = useNarrow(640);
  const stepsRef = useRef<HTMLDivElement>(null);
  /* A reader who has just used the control owns the figure for a moment:
     the scroll observer stays quiet so a caption drifting through the middle
     of the viewport cannot undo the stage they chose. */
  const manualUntil = useRef(0);
  const chooseStep = (next: number) => {
    manualUntil.current = Date.now() + 2500;
    setStep(next);
  };

  useEffect(() => {
    if (!shared) return;
    if (typeof shared.step === "number") setStep(Math.max(0, Math.min(4, shared.step)));
    if (shared.reference === "personal" || shared.reference === "population") setReference(shared.reference);
    if (typeof shared.point === "number") setPoint(Math.max(0, Math.min(4, shared.point)));
  }, [shared]);
  useEffect(() => {
    if (!presentation) return;
    if (typeof presentation.step === "number") setStep(presentation.step);
    setReference(presentation.reference === "personal" ? "personal" : "population");
    setPoint(typeof presentation.point === "number" ? presentation.point : null);
  }, [presentation]);

  /* Desktop: scrolling through the step captions advances the figure. The
     page always scrolls normally; this only reads where the captions are. */
  const scrollDriven = !presentation && !narrow && !reduced;
  useEffect(() => {
    if (!scrollDriven) return;
    const container = stepsRef.current;
    if (!container) return;
    const items = Array.from(container.querySelectorAll<HTMLElement>("[data-step]"));
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < manualUntil.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.step);
            setStep(index);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [scrollDriven]);

  const shown = step + 1;
  const path = useMemo(() => smoothPath(VALUES.slice(0, shown).map((v, i) => [xFor(i), yFor(v)] as Pt)), [shown]);
  const complete = shown === 5;
  const big = shown === 1;

  /* The reference band. Population: wide, everyone inside. Personal: narrow
     around the first two readings; later points drift out. */
  const band =
    reference === "population"
      ? { top: yFor(78), bottom: yFor(60), label: "population reference range · illustrative" }
      : { top: yFor(75.5), bottom: yFor(70.5), label: "personal baseline · assessments 01–02 · illustrative" };
  const outside = VALUES.slice(0, shown).filter((v) => (reference === "personal" ? v < 70.5 : false)).length;

  const svg = (
    <svg
      viewBox={phone ? `${X0 - 60} 0 ${X1 - X0 + 130} ${H}` : `0 0 ${W} ${H}`}
      className={`${fig.svg} ${phone ? fig.narrow : ""}`}
      aria-hidden="true"
      style={{ maxHeight: 420, margin: "0 auto" }}
    >
      <text className={`${fig.label} ${fig.labelWarn} ${fig.labelSmall}`} x={X0 - 50} y={22}>
        {phone ? "illustrative · unitless · not clinical data" : "illustrative assessment sequence · unitless index · not clinical data"}
      </text>
      {/* axes */}
      <line className={fig.ground} x1={X0 - 40} y1={Y_BOTTOM + 14} x2={X1 + 40} y2={Y_BOTTOM + 14} />
      <g className={fig.grid}>
        {[62, 66, 70, 74, 78].map((v) => (
          <line key={v} x1={X0 - 40} y1={yFor(v)} x2={X1 + 40} y2={yFor(v)} />
        ))}
      </g>

      {/* reference band */}
      <g className={fig.fade} style={{ opacity: complete ? 1 : shown >= 3 && reference === "personal" ? 0.7 : 0 }}>
        <rect
          className={`${fig.band} ${reference === "personal" ? "" : fig.bandViolet} ${fig.move}`}
          x={X0 - 40}
          y={band.top}
          width={X1 - X0 + 80}
          height={band.bottom - band.top}
          rx={3}
        />
        <text className={fig.label} x={X0 - 36} y={band.top - 6}>
          {band.label}
        </text>
      </g>

      {/* the trajectory */}
      <path className={`${fig.trace} ${fig.traceTeal} ${fig.fade}`} d={path} style={{ opacity: shown > 1 ? 1 : 0 }} />
      {VALUES.map((v, i) => {
        const on = i < shown;
        const selected = point === i;
        const flagged = complete && reference === "personal" && v < 70.5;
        const latest = on && i === shown - 1 && !big;
        /* Recorded assessments are solid points, the latest haloed. The ones
           still to come are dashed rings on their slots — pending, not
           missing — until the reader or the scroll brings them in. */
        return (
          <g key={i} className={fig.fade} style={{ opacity: on ? 1 : 0.55 }}>
            {on && <line className={fig.dash} x1={xFor(i)} y1={yFor(v) + 10} x2={xFor(i)} y2={Y_BOTTOM + 8} />}
            {/* a generous, invisible hit target */}
            <circle
              cx={xFor(i)}
              cy={yFor(v)}
              r={22}
              fill="transparent"
              style={{ cursor: on ? "pointer" : "default" }}
              onClick={() => on && setPoint((prev) => (prev === i ? null : i))}
            />
            {latest && !selected && <circle className={fig.halo} cx={xFor(i)} cy={yFor(v)} r={14} />}
            {on ? (
              <circle
                className={`${fig.node} ${fig.move}`}
                cx={xFor(i)}
                cy={yFor(v)}
                r={selected ? 9 : 5.5}
                style={{ stroke: flagged ? "var(--jr-violet)" : undefined }}
              />
            ) : (
              <circle className={fig.nodeFuture} cx={xFor(i)} cy={yFor(v)} r={5} />
            )}
            {on && <circle className={flagged ? fig.nodeViolet : fig.nodeFill} cx={xFor(i)} cy={yFor(v)} r={selected ? 3.6 : 2.4} />}
            {!big && on && (
              <text className={`${fig.label} ${fig.labelSmall}`} x={xFor(i)} y={yFor(v) - 14} textAnchor="middle">
                {v}
              </text>
            )}
            <text
              className={`${fig.label} ${fig.labelSmall} ${on ? fig.labelInk : ""}`}
              x={xFor(i)}
              y={Y_BOTTOM + 30}
              textAnchor="middle"
              style={{ opacity: on ? 1 : 0.8 }}
            >
              {LABELS[i].replace("Assessment ", "T")}
            </text>
          </g>
        );
      })}

      {/* THE number: enormous at first, then shrinking into its point */}
      <g
        className={fig.move}
        style={{
          transform: big ? "translate(320px, 190px) scale(1)" : `translate(${xFor(0)}px, ${yFor(VALUES[0]) - 14}px) scale(0.08)`,
          transformOrigin: "0 0",
          opacity: big ? 1 : 0,
          transition: "transform 0.9s cubic-bezier(0.16,1,0.3,1), opacity 0.6s",
        }}
      >
        <text className={fig.labelDisplay} textAnchor="middle" style={{ fontSize: 132 }}>
          {VALUES[0]}
        </text>
        <text className={`${fig.label}`} textAnchor="middle" y={28}>
          Assessment 01 · illustrative index
        </text>
        <text className={`${fig.label} ${fig.labelSmall}`} textAnchor="middle" y={44}>
          it looks like the answer
        </text>
      </g>

      {/* the reading */}
      <text className={`${fig.label} ${complete ? fig.labelInk : ""}`} x={X0 - 40} y={H - 46}>
        {big
          ? ""
          : shown < 5
            ? `${shown} readings · a direction is forming`
            : reference === "population"
              ? "all five inside the population range — the same score for very different people"
              : `${outside} of 5 below this person's own baseline — the direction of travel is the reading`}
      </text>
      <text className={`${fig.label} ${fig.labelSmall}`} x={X0 - 40} y={H - 30}>
        {complete ? "one number is an observation · a trajectory is context" : ""}
      </text>
    </svg>
  );

  const inspector = point !== null && point < shown && (
    <div className="mt-3 rounded-xl border border-white/[0.07] p-4" aria-live="polite">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-300">
        {LABELS[point]} · illustrative signals
      </p>
      <div className="mt-2 grid gap-x-6 sm:grid-cols-2">
        {SIGNALS.map((signal, i) => (
          <div key={signal} className={ui.qualRow}>
            <span className="text-[0.8125rem] text-soft-gray">{signal}</span>
            <span className={`${ui.qual} ${Q_CLASS[PER_POINT[point][i]]}`}>{Q_LABEL[PER_POINT[point][i]]}</span>
          </div>
        ))}
      </div>
      {PER_POINT[point][4] === "degraded" && (
        <p className={ui.note}>A degraded capture travels with the reading: this point may be a trend in the setup, not in the person.</p>
      )}
    </div>
  );

  if (presentation) {
    return (
      <div ref={ref}>
        {svg}
        {inspector}
      </div>
    );
  }

  const STEP_COPY = [
    "A single assessment. It compresses a time-varying pattern into one value on one day.",
    "A second reading. Is this ordinary day-to-day variation, or a direction?",
    "A third. The single number is now one of several; a shape is forming.",
    "A fourth. Read as numbers, each step is small. Read as a sequence, the direction is consistent.",
    "Five assessments. The first number is one point on a trajectory — and the reference decides what the trajectory means.",
  ];

  return (
    <div ref={ref}>
      <InteractiveFigure
        id="longitudinal-trend"
        articleSlug={articleSlug}
        eyebrow="Interactive hero"
        title="One number becomes a trajectory"
        status="illustrative"
        hint="scrub"
        hero
        minHeight="460px"
        description={DESCRIPTION}
        caption="Illustrative assessment sequence. The index is unitless and chosen to draw the argument; it is not a clinical score, a threshold, or anyone's data. Selecting a point shows qualitative signals only."
        actions={
          <ShareInsight
            figureId="longitudinal-trend"
            state={{ step, reference, ...(point !== null ? { point } : {}) }}
            label="Share this view"
            articleSlug={articleSlug}
          />
        }
      >
        <div className={scrollDriven ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]" : ""}>
          <div className={scrollDriven ? "lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] lg:self-start" : ""}>
            {svg}
            <StageControl
              stages={STEPS}
              value={step}
              onChange={(next) => chooseStep(next)}
              ariaLabel="Assessments shown"
              hint={scrollDriven ? "Scroll, drag the track, or use ← →" : "Drag the track, tap a step, or use ← →"}
              dense={false}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className={ui.segment} role="radiogroup" aria-label="Reference">
                {(["population", "personal"] as Ref[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={reference === value}
                    onClick={() => setReference(value)}
                    className={`${ui.segmentBtn} ${reference === value ? ui.segmentOn : ""}`}
                  >
                    {value === "population" ? "Population reference" : "Personal baseline"}
                  </button>
                ))}
              </div>
              <div className={ui.chips} role="group" aria-label="Inspect an assessment">
                {LABELS.slice(0, shown).map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={point === i}
                    onClick={() => setPoint((prev) => (prev === i ? null : i))}
                    className={`${ui.chip} ${point === i ? ui.chipOn : ""}`}
                    style={{ minHeight: 34 }}
                  >
                    T{i + 1}
                  </button>
                ))}
              </div>
            </div>
            {inspector}
          </div>
          {scrollDriven && (
            <div ref={stepsRef} aria-hidden="true" className="hidden lg:block">
              {STEP_COPY.map((copy, i) => (
                <div
                  key={i}
                  data-step={i}
                  className="flex min-h-[46vh] items-center first:min-h-[30vh] last:min-h-[30vh]"
                >
                  <p
                    className={`border-l pl-4 text-[0.875rem] leading-relaxed transition-colors ${
                      i === step ? "border-cyan-300 text-soft-white" : "border-white/10 text-soft-mute"
                    }`}
                  >
                    <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-300">
                      {LABELS[i]}
                    </span>
                    {copy}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </InteractiveFigure>
    </div>
  );
}

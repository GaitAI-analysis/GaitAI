"use client";

import { useEffect, useMemo, useState } from "react";
import type { Pt } from "@/components/visuals/gait-phases";
import { smoothPath } from "@/components/research/PoseFrame";
import { InteractiveFigure } from "../InteractiveFigure";
import { ShareInsight, useSharedFigureState } from "../ShareInsight";
import { useFigureActive } from "../useFigureActive";
import { useNarrow } from "../useNarrow";
import { noise } from "../gait";
import type { FigureProps } from "../registry";
import fig from "../figures.module.css";
import ui from "../experience.module.css";

/**
 * WHEN FUSION LOOKS BETTER THAN IT IS — a small experiment.
 *
 *   RGB ─────┐
 *   POSE ────┤
 *   IMU ─────┼── FUSION ── RESULT
 *   AUDIO ───┘
 *
 * Each stream can be HEALTHY, MISSING or CORRUPTED. Missing: the stream
 * disappears, the result shows a visible gap and says so — a known unknown.
 * Corrupted: the stream keeps arriving, visibly wrong to us and invisible to
 * the system; the result keeps its size and its confident layout. The two
 * are not the same problem, and the figure exists to make that felt.
 *
 * No accuracy, no benchmark, no confidence number. Coverage and honesty are
 * shown as qualitative states.
 */

type Mode = "ok" | "missing" | "corrupt";
type StreamId = "rgb" | "pose" | "imu" | "audio";
const STREAMS: Array<{ id: StreamId; label: string; carries: string; corruption: string }> = [
  { id: "rgb", label: "RGB", carries: "appearance · scene", corruption: "compression and dropped frames: timing read from frames is quietly wrong" },
  { id: "pose", label: "Pose", carries: "geometry · symmetry", corruption: "left and right landmarks swapped for part of the walk: a confident, wrong symmetry" },
  { id: "imu", label: "IMU", carries: "step timing · dynamics", corruption: "a loose strap: the sensor reports as fine while measuring the strap" },
  { id: "audio", label: "Audio", carries: "footfall rhythm", corruption: "an air-conditioner hum at a walking frequency: a rhythm that is not a person" },
];
const MODES: Mode[] = ["ok", "missing", "corrupt"];
const MODE_LABEL: Record<Mode, string> = { ok: "Healthy", missing: "Missing", corrupt: "Corrupted" };

const W = 640;
const H = 340;
const YS = [56, 124, 192, 260];
const NX = 372;
const NY = 158;

const DESCRIPTION = `Four input streams — RGB, pose, IMU and audio — converge on a fusion stage that produces one result. Each stream can be set to healthy, missing or corrupted.
Healthy: all four bars in the result are filled and the result reads "complete".
Missing: the stream's line becomes a dashed gap, its bar in the result is empty and labelled "gap", and the result reads "known gap — the system can say what it cannot answer".
Corrupted: the stream's line keeps arriving but is visibly noisy, its bar is still filled but jagged, and the result keeps its full layout while a label says "looks complete — the damage is not announced".
The lesson: a missing input is a routing problem the system can see; a silently corrupted one is a detection problem it may not.`;

export function FusionExperiment({ articleSlug, presentation }: FigureProps) {
  const shared = useSharedFigureState("fusion-experiment");
  const read = (source: Record<string, unknown> | null | undefined, id: StreamId): Mode => {
    const value = source?.[id];
    return value === "missing" || value === "corrupt" ? value : "ok";
  };
  const [modes, setModes] = useState<Record<StreamId, Mode>>(() => ({
    rgb: read(presentation, "rgb"),
    pose: read(presentation, "pose"),
    imu: read(presentation, "imu"),
    audio: read(presentation, "audio"),
  }));
  const { ref, active, reduced } = useFigureActive<HTMLDivElement>();
  const stacked = useNarrow(640);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (shared) setModes({ rgb: read(shared, "rgb"), pose: read(shared, "pose"), imu: read(shared, "imu"), audio: read(shared, "audio") });
  }, [shared]);
  useEffect(() => {
    if (presentation)
      setModes({ rgb: read(presentation, "rgb"), pose: read(presentation, "pose"), imu: read(presentation, "imu"), audio: read(presentation, "audio") });
  }, [presentation]);

  /* The streams flow: a slow phase advance while active. */
  useEffect(() => {
    if (!active || presentation) return;
    const id = window.setInterval(() => setTick((v) => (v + 1) % 1000), 90);
    return () => window.clearInterval(id);
  }, [active, presentation]);

  const missing = STREAMS.filter((s) => modes[s.id] === "missing");
  const corrupt = STREAMS.filter((s) => modes[s.id] === "corrupt");
  const verdict =
    corrupt.length > 0
      ? { label: "looks complete", tone: fig.labelWarn, line: "Every bar is drawn and nothing announces the damage. The system may weight the corrupted evidence as if it were sound." }
      : missing.length > 0
        ? { label: "known gap", tone: fig.labelTeal, line: "Coverage drops and the gap is visible. The system can say what it can no longer answer and route around it." }
        : { label: "complete", tone: fig.labelAccent, line: "All four streams present and sound. The best case — and the only case most benchmarks test." };

  /* Per-stream waveform, distinct by character; corrupted adds noise. */
  const waves = useMemo(() => {
    const shift = (reduced ? 0 : tick) * 0.6;
    return STREAMS.map((s, i) => {
      const y0 = YS[i];
      const pts: Pt[] = Array.from({ length: 34 }, (_, k) => {
        const u = k / 33;
        const x = 70 + u * 200;
        let y = 0;
        switch (s.id) {
          case "rgb":
            y = Math.round(Math.sin(u * 14 + shift * 0.2) ) * 5;
            break;
          case "pose":
            y = Math.sin(u * Math.PI * 4 + shift * 0.15) * 9;
            break;
          case "imu":
            y = Math.pow(Math.max(0, Math.sin(u * Math.PI * 4 + shift * 0.15)), 6) * 16 - 4;
            break;
          case "audio":
            y = Math.sin(u * 40 + shift * 0.4) * 4 + Math.sin(u * Math.PI * 4 + shift * 0.15) * 3;
            break;
        }
        if (modes[s.id] === "corrupt") y += noise(k * 3.1 + i * 17 + Math.floor(shift)) * 9;
        return [x, y0 + y];
      });
      return pts;
    });
  }, [modes, reduced, tick]);

  const panel = stacked ? "translate(-300 300)" : undefined;
  const viewBox = stacked ? "0 0 322 560" : `0 0 ${W} ${H}`;

  const svg = (
    <svg viewBox={viewBox} className={`${fig.svg} ${stacked ? fig.narrow : ""}`} aria-hidden="true" style={{ maxHeight: stacked ? undefined : 380, margin: "0 auto" }}>
      <defs>
        <filter id="fx-noise" x="-5%" y="-40%" width="110%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="1" seed="5" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      {STREAMS.map((s, i) => {
        const mode = modes[s.id];
        const y = YS[i];
        const toNode = `M270 ${y} C310 ${y} 320 ${stacked ? y : NY} ${stacked ? 300 : NX - 16} ${stacked ? y : NY}`;
        return (
          <g key={s.id} className={fig.fade} style={{ opacity: mode === "missing" ? 0.55 : 1 }}>
            <text className={`${fig.label} ${fig.labelInk}`} x={22} y={y + 3}>
              {s.label}
            </text>
            <text className={`${fig.label} ${fig.labelSmall} ${mode === "corrupt" ? fig.labelWarn : ""}`} x={70} y={y - 20}>
              {mode === "ok" ? s.carries : mode === "missing" ? "no stream" : "arriving · damaged"}
            </text>
            {mode === "missing" ? (
              <>
                <line className={fig.dash} x1={70} y1={y} x2={270} y2={y} />
                <path className={fig.dash} d={toNode} />
              </>
            ) : (
              <>
                <path
                  className={`${fig.trace} ${mode === "corrupt" ? fig.traceWarn : i === 1 ? fig.traceViolet : i === 2 ? fig.traceTeal : i === 3 ? fig.traceRoyal : ""}`}
                  d={smoothPath(waves[i])}
                />
                <path className={`${fig.trace} ${mode === "corrupt" ? fig.traceWarn : fig.traceSoft}`} d={toNode} style={mode === "corrupt" ? { filter: "url(#fx-noise)" } : undefined} />
              </>
            )}
          </g>
        );
      })}

      <g transform={panel}>
        {/* fusion node */}
        <circle className={fig.node} cx={NX} cy={NY} r={16} />
        <text className={`${fig.label} ${fig.labelSmall}`} x={NX} y={NY + 32} textAnchor="middle">
          fusion
        </text>
        <line className={fig.trace} x1={NX + 18} y1={NY} x2={NX + 58} y2={NY} />
        {/* result */}
        <rect className={`${fig.plate} ${corrupt.length ? "" : fig.plateLit}`} x={NX + 60} y={NY - 78} width={190} height={156} rx={6} />
        <text className={`${fig.label} ${fig.labelInk}`} x={NX + 76} y={NY - 56}>
          Result
        </text>
        <text className={`${fig.label} ${fig.labelSmall} ${verdict.tone}`} x={NX + 244} y={NY - 56} textAnchor="end">
          {verdict.label}
        </text>
        {STREAMS.map((s, i) => {
          const mode = modes[s.id];
          const y = NY - 34 + i * 26;
          return (
            <g key={s.id}>
              <text className={`${fig.label} ${fig.labelSmall}`} x={NX + 76} y={y + 3}>
                {s.label}
              </text>
              <rect className={fig.hair} x={NX + 120} y={y - 4} width={116} height={8} rx={1.5} fill="none" />
              {mode === "missing" ? (
                <text className={`${fig.label} ${fig.labelSmall} ${fig.labelTeal}`} x={NX + 124} y={y + 3}>
                  gap · known
                </text>
              ) : (
                <rect
                  className={mode === "corrupt" ? fig.nodeWarn : fig.nodeFill}
                  x={NX + 120}
                  y={y - 4}
                  width={116 - i * 10}
                  height={8}
                  rx={1.5}
                  style={mode === "corrupt" ? { filter: "url(#fx-noise)" } : undefined}
                />
              )}
            </g>
          );
        })}
        <text className={`${fig.label} ${fig.labelSmall}`} x={NX + 76} y={NY + 68}>
          {corrupt.length ? "trusted as sound" : missing.length ? "gap flagged to the model" : "all evidence present"}
        </text>
      </g>
    </svg>
  );

  const state = { rgb: modes.rgb, pose: modes.pose, imu: modes.imu, audio: modes.audio };

  if (presentation) return <div ref={ref}>{svg}</div>;

  return (
    <div ref={ref}>
      <InteractiveFigure
        id="fusion-experiment"
        articleSlug={articleSlug}
        eyebrow="Interactive hero"
        title="Remove a stream. Then corrupt one."
        status="conceptual"
        hint="tap"
        hero
        minHeight="440px"
        description={DESCRIPTION}
        caption={
          <>
            <strong className="font-medium text-soft-white">{verdict.label[0].toUpperCase() + verdict.label.slice(1)}.</strong>{" "}
            {verdict.line} No accuracy or confidence is shown because none is published; coverage and honesty are
            drawn qualitatively.
          </>
        }
        actions={<ShareInsight figureId="fusion-experiment" state={state} label="Share this experiment" articleSlug={articleSlug} />}
      >
        {svg}
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {STREAMS.map((s) => (
            <div key={s.id} className="rounded-xl border border-white/[0.07] p-2.5">
              <p className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-soft-white">{s.label}</span>
                <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-soft-mute">{s.carries}</span>
              </p>
              <div className={`${ui.segment} mt-2 w-full`} role="radiogroup" aria-label={`${s.label} stream`}>
                {MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={modes[s.id] === mode}
                    onClick={() => setModes((prev) => ({ ...prev, [s.id]: mode }))}
                    className={`${ui.segmentBtn} flex-1 ${modes[s.id] === mode ? ui.segmentOn : ""}`}
                  >
                    {MODE_LABEL[mode]}
                  </button>
                ))}
              </div>
              {modes[s.id] === "corrupt" && <p className={`${ui.note} mt-1.5`}>{s.corruption}</p>}
            </div>
          ))}
        </div>
      </InteractiveFigure>
    </div>
  );
}

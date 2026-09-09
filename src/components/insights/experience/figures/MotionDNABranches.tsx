"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Pt } from "@/components/visuals/gait-phases";
import { smoothPath } from "@/components/research/PoseFrame";
import { InteractiveFigure } from "../InteractiveFigure";
import { ShareInsight, useSharedFigureState } from "../ShareInsight";
import { useFigureActive } from "../useFigureActive";
import { useNarrow } from "../useNarrow";
import { gaitWave, useWalkCycle } from "../gait";
import type { FigureProps } from "../registry";
import { trackInsightEvent } from "@/lib/insight-events";
import fig from "../figures.module.css";
import ui from "../experience.module.css";

/**
 * ONE MOVEMENT. MULTIPLE INTELLIGENCES. — the Motion DNA branches.
 *
 * At the centre, one movement: a gait-shaped signal with the walk's "now"
 * travelling along it. From it, five branches: MOBILITY, RECOVERY, IDENTITY,
 * RISK, SAFETY. Touch, hover or choose one and the SAME signal reorganises
 * to show what that reading looks at —
 *
 *   mobility   step peaks marked, stride spans bracketed, left and right named
 *   recovery   an earlier walk laid under this one; the difference is the reading
 *   identity   the recurring cycle boxed as a pattern — a research property, not a guarantee
 *   risk       a variability envelope that widens; instability, change over time
 *   safety     the signal becomes a path through a space: trajectory, an unusual stop
 *
 * Nothing is measured and nothing is claimed about performance. The point is
 * structural: what is emphasised depends on the question asked of the walk.
 */

type Branch = "none" | "mobility" | "recovery" | "identity" | "risk" | "safety";
const BRANCHES: Array<{ id: Exclude<Branch, "none">; label: string; emphasis: string[]; note: string }> = [
  {
    id: "mobility",
    label: "Mobility",
    emphasis: ["cadence", "stride", "symmetry"],
    note: "How well is this person moving right now? Read functionally: rhythm, stride and left/right balance.",
  },
  {
    id: "recovery",
    label: "Recovery",
    emphasis: ["longitudinal comparison", "baseline change", "progression"],
    note: "Placed beside an earlier walk. The difference between the two, not either alone, is the information.",
  },
  {
    id: "identity",
    label: "Identity",
    emphasis: ["recurring temporal pattern", "movement signature"],
    note: "The pattern that repeats cycle to cycle, treated as a signature. A research property — sensitive to viewpoint, footwear, load and health — not a guarantee of recognition.",
  },
  {
    id: "risk",
    label: "Risk",
    emphasis: ["variability", "instability", "longitudinal change"],
    note: "How much the pattern fluctuates, and whether that is changing. A reason to look closer — never a prediction about a specific event.",
  },
  {
    id: "safety",
    label: "Safety",
    emphasis: ["environmental context", "unusual activity", "trajectory"],
    note: "At the level of a space rather than a person: where the movement goes, where it stops, and what is unusual against the normal pattern of use.",
  },
];

const W = 640;
const H = 340;
const X0 = 40;
const X1 = 300;
const CY = 172;
const BRANCH_X = 600;
const BRANCH_Y = [64, 118, 172, 226, 280];

const DESCRIPTION = `One gait-shaped movement signal sits at the centre with five branches leading from it: mobility, recovery, identity, risk and safety.
Selecting a branch reorganises the same signal. Mobility marks each step peak, brackets a stride and names left and right. Recovery overlays an earlier walk so the difference becomes visible. Identity boxes the repeating cycle as a recurring pattern, noted as a research property and not a guarantee. Risk draws a variability envelope that widens toward the right. Safety redraws the signal as a path through a room with an unusual stop marked.
The lesson: one movement, multiple intelligences — what is emphasised depends on the question asked of it.`;

export function MotionDNABranches({ articleSlug, presentation }: FigureProps) {
  const shared = useSharedFigureState("motion-dna-branches");
  const isBranch = (value: unknown): value is Branch =>
    value === "none" || BRANCHES.some((b) => b.id === value);
  const [branch, setBranch] = useState<Branch>(() =>
    isBranch(presentation?.branch) ? presentation.branch : "none",
  );
  const [hover, setHover] = useState<Branch>("none");
  const { ref, active, reduced } = useFigureActive<HTMLDivElement>();
  const t = useWalkCycle(active && !presentation, 1500, 0.1, branch);
  const stacked = useNarrow(640);

  useEffect(() => {
    if (shared && isBranch(shared.branch)) setBranch(shared.branch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shared]);
  useEffect(() => {
    if (isBranch(presentation?.branch)) setBranch(presentation.branch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentation]);

  const shown: Branch = hover !== "none" ? hover : branch;
  const current = BRANCHES.find((b) => b.id === shown);

  const wave = useMemo(() => gaitWave(X0, X1, CY, 30, 3, 0, 60), []);
  const earlier = useMemo(
    () => gaitWave(X0, X1, CY + 4, 24, 3, 0.35, 60).map(([x, y], i) => [x, y + Math.sin(i * 0.6) * 2] as Pt),
    [],
  );
  const peaks = useMemo(() => {
    const out: number[] = [];
    for (let i = 1; i < wave.length - 1; i += 1) {
      if (wave[i][1] < wave[i - 1][1] && wave[i][1] <= wave[i + 1][1]) out.push(i);
    }
    return out;
  }, [wave]);
  const cursorX = X0 + (presentation || reduced ? 0.42 : t) * (X1 - X0);

  /* Stacked (phones): the five branches fan DOWN from the end of the wave
     into a row of labelled nodes under it, instead of fanning right. */
  const viewBox = stacked ? "0 0 340 372" : `0 0 ${W} ${H}`;
  const branchEnd = (i: number): Pt => (stacked ? [38 + i * 66, 318] : [BRANCH_X - 40, BRANCH_Y[i]]);
  const branchPath = (i: number) => {
    const [tx, ty] = branchEnd(i);
    return stacked
      ? `M${X1} ${CY} C${X1} ${CY + 70} ${tx} ${ty - 70} ${tx} ${ty - 10}`
      : `M${X1} ${CY} C${X1 + 90} ${CY} ${BRANCH_X - 120} ${ty} ${tx} ${ty}`;
  };

  const svg = (
    <svg viewBox={viewBox} className={`${fig.svg} ${stacked ? fig.narrow : ""}`} aria-hidden="true" style={{ maxHeight: stacked ? undefined : 380, margin: "0 auto" }}>
      {/* ── one movement ── */}
      <text className={`${fig.label} ${fig.labelInk}`} x={X0} y={CY - 62}>
        One movement
      </text>
      <text className={`${fig.label} ${fig.labelSmall}`} x={X0} y={CY + 78}>
        {current ? `read as ${current.label.toLowerCase()}` : "a gait signal · read five ways"}
      </text>
      <line className={fig.hair} x1={X0} y1={CY} x2={X1} y2={CY} />

      {/* safety: the same walk as a path through a space */}
      <g className={fig.fade} style={{ opacity: shown === "safety" ? 1 : 0 }}>
        <rect className={fig.frame} x={X0} y={CY - 52} width={X1 - X0} height={104} rx={3} />
        <line className={fig.frame} x1={X0 + 92} y1={CY - 52} x2={X0 + 92} y2={CY - 22} />
        <line className={fig.frame} x1={X0 + 92} y1={CY + 22} x2={X0 + 92} y2={CY + 52} />
        <path
          className={`${fig.trace} ${fig.traceRoyal}`}
          d={smoothPath([
            [X0 + 12, CY + 36],
            [X0 + 60, CY + 20],
            [X0 + 92, CY],
            [X0 + 140, CY - 14],
            [X0 + 176, CY - 8],
            [X0 + 200, CY + 4],
            [X0 + 244, CY - 30],
          ])}
        />
        <circle className={fig.nodeWarn} cx={X0 + 200} cy={CY + 4} r={4} />
        <text className={`${fig.label} ${fig.labelWarn} ${fig.labelSmall}`} x={X0 + 208} y={CY + 18}>
          unusual stop
        </text>
        <text className={`${fig.label} ${fig.labelSmall}`} x={X0 + 6} y={CY - 40}>
          floor plan · doorway
        </text>
      </g>

      {/* the signal itself, hidden under safety */}
      <g className={fig.fade} style={{ opacity: shown === "safety" ? 0 : 1 }}>
        {/* risk envelope */}
        <path
          className={`${fig.band} ${fig.bandWarn} ${fig.fade}`}
          style={{ opacity: shown === "risk" ? 1 : 0 }}
          d={`${smoothPath(wave.map(([x, y], i) => [x, y - 6 - (i / wave.length) * 22] as Pt))} ${smoothPath(
            [...wave].reverse().map(([x, y], i) => [x, y + 6 + ((wave.length - i) / wave.length) * 22] as Pt),
          ).replace("M", "L")} Z`}
        />
        {/* recovery: the earlier walk */}
        <path
          className={`${fig.trace} ${fig.traceViolet} ${fig.fade}`}
          style={{ opacity: shown === "recovery" ? 1 : 0 }}
          strokeDasharray="4 3"
          d={smoothPath(earlier)}
        />
        {/* identity: cycle boxes */}
        <g className={fig.fade} style={{ opacity: shown === "identity" ? 1 : 0 }}>
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              className={fig.band}
              x={X0 + (i * (X1 - X0)) / 3 + 2}
              y={CY - 40}
              width={(X1 - X0) / 3 - 4}
              height={80}
              rx={3}
            />
          ))}
          <text className={`${fig.label} ${fig.labelSmall}`} x={X0} y={CY - 46}>
            the same cycle, three times
          </text>
        </g>
        {/* the wave */}
        <path className={`${fig.trace} ${fig.traceBold}`} d={smoothPath(wave)} />
        {/* mobility: peaks, stride, L/R */}
        <g className={fig.fade} style={{ opacity: shown === "mobility" ? 1 : 0 }}>
          {peaks.map((p, i) => (
            <g key={p}>
              <line className={`${fig.trace} ${fig.traceTeal}`} x1={wave[p][0]} y1={wave[p][1] - 4} x2={wave[p][0]} y2={wave[p][1] - 16} />
              <text
                className={`${fig.label} ${fig.labelTeal} ${fig.labelSmall}`}
                x={wave[p][0]}
                y={wave[p][1] - 20}
                textAnchor="middle"
              >
                {i % 2 === 0 ? "L" : "R"}
              </text>
            </g>
          ))}
          {peaks.length >= 3 && (
            <>
              <line className={fig.dash} x1={wave[peaks[0]][0]} y1={CY + 46} x2={wave[peaks[2]][0]} y2={CY + 46} />
              <text className={`${fig.label} ${fig.labelSmall}`} x={(wave[peaks[0]][0] + wave[peaks[2]][0]) / 2} y={CY + 58} textAnchor="middle">
                one stride
              </text>
            </>
          )}
        </g>
        {/* now */}
        {!reduced && <line className={fig.dash} x1={cursorX} y1={CY - 44} x2={cursorX} y2={CY + 44} />}
      </g>

      {/* ── the branches ── */}
      <g>
        {BRANCHES.map((b, i) => {
          const on = shown === b.id;
          const dim = shown !== "none" && !on;
          const [tx, ty] = branchEnd(i);
          const d = branchPath(i);
          return (
            <g
              key={b.id}
              className={fig.fade}
              style={{ opacity: dim ? 0.48 : 1, cursor: "pointer" }}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setHover(b.id);
              }}
              onPointerLeave={() => setHover("none")}
              onClick={() => setBranch((prev) => (prev === b.id ? "none" : b.id))}
            >
              <path className={`${fig.trace} ${on ? fig.traceBold : fig.traceSoft}`} d={d} />
              {/* a wide invisible hit path for fingers */}
              <path d={d} fill="none" stroke="transparent" strokeWidth={28} style={{ pointerEvents: "stroke" }} />
              {/* The chosen reading is cyan, bold and haloed; the others stay
                  legible and quiet. Stacked, alternate labels drop a line so
                  five names fit across a phone without touching. */}
              {on && <circle className={fig.halo} cx={tx} cy={stacked ? ty - 10 : ty} r={10} />}
              <circle className={on ? fig.nodeFill : fig.nodeMute} cx={tx} cy={stacked ? ty - 10 : ty} r={on ? 4 : 2.6} />
              <rect x={tx - (stacked ? 30 : 6)} y={ty - 14} width={stacked ? 60 : 74} height={stacked ? 44 : 28} fill="transparent" />
              <text
                className={`${fig.label} ${stacked ? fig.labelSmall : fig.labelKey} ${on ? fig.labelAccent : ""}`}
                x={stacked ? tx : tx + 10}
                y={stacked ? ty + 14 + (i % 2) * 13 : ty + 3}
                textAnchor={stacked ? "middle" : undefined}
              >
                {b.label}
              </text>
            </g>
          );
        })}
        <circle className={fig.nodeFill} cx={X1} cy={CY} r={3.6} />
      </g>
    </svg>
  );

  if (presentation) {
    return (
      <div ref={ref}>
        {svg}
        {current && (
          <p className={`${ui.legend} justify-center`}>
            {current.emphasis.map((word) => (
              <span key={word} className={ui.legendItem}>
                <span className={ui.legendSwatch} />
                {word}
              </span>
            ))}
          </p>
        )}
      </div>
    );
  }

  return (
    <div ref={ref}>
      <InteractiveFigure
        id="motion-dna-branches"
        articleSlug={articleSlug}
        eyebrow="Interactive hero"
        title="One movement. Multiple intelligences."
        status="conceptual"
        hint="inspect"
        hero
        minHeight="420px"
        description={DESCRIPTION}
        caption={
          current
            ? `${current.label}: ${current.note}`
            : "Touch or hover a branch. The same movement data reorganises depending on the purpose it is read for; nothing here is a measurement or a claim about performance."
        }
        actions={
          <ShareInsight
            figureId="motion-dna-branches"
            state={{ branch }}
            label="Share this reading"
            articleSlug={articleSlug}
          />
        }
      >
        {svg}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className={ui.chips} role="radiogroup" aria-label="Read the movement as">
            <button
              type="button"
              role="radio"
              aria-checked={branch === "none"}
              onClick={() => setBranch("none")}
              className={`${ui.chip} ${branch === "none" ? ui.chipOn : ""}`}
            >
              One movement
            </button>
            {BRANCHES.map((b) => (
              <button
                key={b.id}
                type="button"
                role="radio"
                aria-checked={branch === b.id}
                onClick={() => setBranch(b.id)}
                className={`${ui.chip} ${branch === b.id ? ui.chipOn : ""}`}
              >
                {b.label}
              </button>
            ))}
          </div>
          {current && (
            <p className={ui.legend} aria-live="polite">
              {current.emphasis.map((word) => (
                <span key={word} className={ui.legendItem}>
                  <span className={ui.legendSwatch} />
                  {word}
                </span>
              ))}
            </p>
          )}
        </div>
      </InteractiveFigure>
    </div>
  );
}

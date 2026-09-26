"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { trackInsightEvent } from "@/lib/insight-events";
import { InteractiveFigure } from "../InteractiveFigure";
import { ShareInsight, useSharedFigureState } from "../ShareInsight";
import { useNarrow } from "../useNarrow";
import type { FigureProps } from "../registry";
import { CHAIN, COMPONENT_LABEL, FAILURE, OUTCOME_LABEL, isChainComponent, outcomeFor, type ChainComponent } from "./system-model";
import fig from "../figures.module.css";
import ui from "../experience.module.css";

/**
 * A GOOD MODEL CAN STILL BE A BAD SYSTEM — break the chain, watch the model stay right.
 *
 *   CAMERA ──▶ INFERENCE ──▶ NETWORK ──▶ ALERT ──▶ INTERFACE ──▶ OPERATOR
 *      ✓          ✓ model       ✕          ·           ·            ·
 *                                          What the model sees: nothing
 *                                          What the person gets: alert never arrives
 *
 * Six links, each a button. Break any of them and two panels answer: what
 * the model experiences (in five of six cases, nothing — its outputs stay
 * correct) and what reaches the person (an outcome named in words). The
 * upstream-most break decides the outcome. The model's own link carries a
 * permanent "outputs correct" mark; that is the argument.
 *
 * CONCEPTUAL, and labelled so. Kinds of failure, never rates.
 */

const W = 640;
const H = 360;
const CHAIN_Y = 120;
const X0 = 48;
const GAP = (W - 2 * X0) / (CHAIN.length - 1);

const DESCRIPTION = `A chain of six components drawn left to right — camera, inference, network, alert, interface, operator — joined by arrows. Each can be marked as failed. The inference link carries a permanent note that the model's outputs are correct.
Breaking a link answers two questions beneath the chain. What the model sees: for a frozen camera, a stationary person inferred correctly from a frozen frame; for a saturated inference queue, correct results produced late; for every downstream failure, nothing — its outputs are correct and go nowhere useful. What reaches the person: the outcome named in words — alert in time, silence mistaken for calm, alert after the window, alert never arrives, alert doubled or swallowed, alert not seen, alert dismissed unread. The upstream-most failure decides the outcome.
Conceptual: kinds of failure and their consequences, not rates, uptimes or latencies.`;

export function SystemChainExplorer({ articleSlug, presentation }: FigureProps) {
  const shared = useSharedFigureState("system-chain-explorer");
  const [failed, setFailed] = useState<Set<ChainComponent>>(() => {
    const initial = new Set<ChainComponent>();
    const raw = presentation?.failed;
    if (typeof raw === "string") raw.split("+").filter(isChainComponent).forEach((c) => initial.add(c));
    return initial;
  });
  const stacked = useNarrow(640);
  const broken = useRef(new Set<ChainComponent>());

  useEffect(() => {
    if (!shared || typeof shared.failed !== "string") return;
    const next = new Set<ChainComponent>();
    shared.failed.split("+").filter(isChainComponent).forEach((c) => next.add(c));
    setFailed(next);
  }, [shared]);
  useEffect(() => {
    if (!presentation) return;
    const next = new Set<ChainComponent>();
    if (typeof presentation.failed === "string") presentation.failed.split("+").filter(isChainComponent).forEach((c) => next.add(c));
    setFailed(next);
  }, [presentation]);

  const toggle = (component: ChainComponent) => {
    setFailed((prev) => {
      const next = new Set(prev);
      if (next.has(component)) next.delete(component);
      else next.add(component);
      return next;
    });
    if (presentation || failed.has(component)) return;
    trackInsightEvent("system_component_failed", { article_slug: articleSlug, component });
    broken.current.add(component);
    /* Completion: three different links broken — the reader has seen the
       model stay right through three kinds of system failure. */
    if (broken.current.size >= 3) {
      trackInsightEvent(
        "interactive_figure_complete",
        { article_slug: articleSlug, figure_id: "system-chain-explorer" },
        { once: "system-chain-explorer" },
      );
    }
  };

  const { outcome, at } = useMemo(() => outcomeFor(failed), [failed]);
  const failedKey = CHAIN.filter((c) => failed.has(c)).join("+");
  const modelSees = at ? FAILURE[at].modelSees : "Frames arrive, results leave, and every one of them is correct.";

  const viewBox = stacked ? "0 0 322 520" : `0 0 ${W} ${H}`;
  /* Stacked: the chain runs vertically down the left, the panels beside it. */
  const pos = (i: number): [number, number] => (stacked ? [56, 40 + i * 76] : [X0 + i * GAP, CHAIN_Y]);

  const svg = (
    <svg viewBox={viewBox} className={`${fig.svg} ${stacked ? fig.narrow : ""}`} aria-hidden="true" style={{ maxHeight: stacked ? undefined : 380, margin: "0 auto" }}>
      {/* ── the chain ── */}
      {CHAIN.map((component, i) => {
        const [x, y] = pos(i);
        const [nx, ny] = i < CHAIN.length - 1 ? pos(i + 1) : [x, y];
        const isFailed = failed.has(component);
        const downstreamOfBreak = at !== null && CHAIN.indexOf(component) > CHAIN.indexOf(at);
        return (
          <g key={component}>
            {i < CHAIN.length - 1 && (
              <g className={fig.fade} style={{ opacity: downstreamOfBreak || isFailed ? 0.35 : 1 }}>
                <line
                  className={isFailed ? fig.dash : fig.trace}
                  x1={stacked ? x : x + 22}
                  y1={stacked ? y + 22 : y}
                  x2={stacked ? nx : nx - 22}
                  y2={stacked ? ny - 22 : ny}
                  style={isFailed ? { stroke: "#f0b45a" } : undefined}
                />
              </g>
            )}
            <g
              className={fig.fade}
              style={{ cursor: presentation ? undefined : "pointer", opacity: downstreamOfBreak ? 0.5 : 1 }}
              onClick={() => !presentation && toggle(component)}
            >
              <circle className={fig.node} cx={x} cy={y} r={20} style={isFailed ? { stroke: "#f0b45a" } : undefined} />
              {isFailed ? (
                <g style={{ stroke: "#f0b45a" }} className={fig.trace}>
                  <line x1={x - 7} y1={y - 7} x2={x + 7} y2={y + 7} />
                  <line x1={x + 7} y1={y - 7} x2={x - 7} y2={y + 7} />
                </g>
              ) : (
                <polyline className={fig.trace} points={`${x - 7},${y} ${x - 2},${y + 6} ${x + 8},${y - 6}`} style={{ stroke: "var(--jr-teal)" }} />
              )}
              <text className={`${fig.label} ${fig.labelKey} ${isFailed ? fig.labelWarn : ""}`} x={stacked ? x + 34 : x} y={stacked ? y - 2 : y + 40} textAnchor={stacked ? "start" : "middle"}>
                {COMPONENT_LABEL[component]}
              </text>
              <text className={`${fig.label} ${fig.labelSmall} ${isFailed ? fig.labelWarn : ""}`} x={stacked ? x + 34 : x} y={stacked ? y + 12 : y + 54} textAnchor={stacked ? "start" : "middle"}>
                {isFailed ? FAILURE[component].name.toLowerCase() : component === "inference" ? "model · outputs correct" : "sound"}
              </text>
            </g>
          </g>
        );
      })}
      {/* the model's permanent mark */}
      {!stacked && (
        <g>
          <rect className={fig.plate} x={X0 + GAP - 44} y={CHAIN_Y - 62} width={88} height={20} rx={4} />
          <text className={`${fig.label} ${fig.labelSmall} ${fig.labelTeal}`} x={X0 + GAP} y={CHAIN_Y - 48} textAnchor="middle">
            model right
          </text>
        </g>
      )}

      {/* ── the two panels ── */}
      <g transform={stacked ? "translate(-24 470)" : undefined}>
        <text className={`${fig.label} ${fig.labelSmall}`} x={X0} y={CHAIN_Y + 110}>
          what the model sees
        </text>
        <text className={`${fig.label} ${fig.labelKey}`} x={X0} y={CHAIN_Y + 128}>
          {modelSees.length > 70 && !stacked ? `${modelSees.slice(0, 68)}…` : modelSees.length > 40 && stacked ? `${modelSees.slice(0, 38)}…` : modelSees}
        </text>
        <line className={fig.hair} x1={X0} y1={CHAIN_Y + 146} x2={W - X0} y2={CHAIN_Y + 146} />
        <text className={`${fig.label} ${fig.labelSmall}`} x={X0} y={CHAIN_Y + 172}>
          what reaches the person
        </text>
        <text className={`${fig.label} ${fig.labelKey} ${outcome === "in-time" ? fig.labelTeal : fig.labelWarn}`} x={X0} y={CHAIN_Y + 192}>
          {OUTCOME_LABEL[outcome]}
        </text>
        {at && (
          <text className={`${fig.label} ${fig.labelSmall}`} x={X0} y={CHAIN_Y + 210}>
            decided at the {COMPONENT_LABEL[at].toLowerCase()} · conceptual
          </text>
        )}
      </g>
    </svg>
  );

  if (presentation) return <div>{svg}</div>;

  return (
    <InteractiveFigure
      id="system-chain-explorer"
      articleSlug={articleSlug}
      eyebrow="Interactive hero"
      title="Break the chain; the model stays right"
      status="conceptual"
      hint="tap"
      hero
      minHeight="400px"
      description={DESCRIPTION}
      caption={
        <>
          <strong>{at ? FAILURE[at].name : "Every link sound"}.</strong>{" "}
          {at ? `${FAILURE[at].how} ${FAILURE[at].modelSees}` : "The camera captures, the model infers, the result travels, the alert lands in time on a screen someone is looking at. The case every model evaluation assumes."}
        </>
      }
      actions={<ShareInsight figureId="system-chain-explorer" state={{ failed: failedKey }} label="Share this chain" articleSlug={articleSlug} />}
    >
      {svg}
      <div className={`${ui.chips} mt-3`} role="group" aria-label="Break a link">
        {CHAIN.map((component) => (
          <button key={component} type="button" aria-pressed={failed.has(component)} onClick={() => toggle(component)} className={`${ui.chip} ${failed.has(component) ? ui.chipOn : ""}`}>
            {COMPONENT_LABEL[component]}
            {failed.has(component) && <span aria-hidden="true"> · failed</span>}
          </button>
        ))}
        {failed.size > 0 && (
          <button type="button" onClick={() => setFailed(new Set())} className={ui.chip}>
            Repair all
          </button>
        )}
      </div>
    </InteractiveFigure>
  );
}

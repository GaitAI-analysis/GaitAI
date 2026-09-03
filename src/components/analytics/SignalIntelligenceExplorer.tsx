"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CAPTURE_SOURCES,
  analyticsProducts,
  capabilityNodes,
  signalNodes,
  type CaptureSource,
} from "@/data/analytics";
import styles from "./signalchain.module.css";

/**
 * SIGNAL → INTELLIGENCE — what a capture source actually becomes.
 *
 * Five stages, left to right:
 *
 *   INPUT → MOVEMENT SIGNALS → AI CAPABILITIES → GAITAI MODULES → OUTPUTS
 *
 * Change the input and every downstream stage recomputes and re-enters in
 * order, so the reader sees the chain redraw rather than a table repopulate.
 * Select a signal or a capability and the stages after it narrow to the
 * modules that documented relationship actually reaches.
 *
 * WHY THERE IS NO "MEASUREMENTS" STAGE
 * The brief asks for one between signals and capabilities. The knowledge model
 * has no measurements layer: modules document an input, signals, capabilities,
 * outcomes and outputs, and nothing between the signal and the capability that
 * reads it. Inventing a measurement vocabulary here would be exactly the
 * second, inconsistent dataset the brief rules out, so the chain states the
 * five stages the data supports and names the last one OUTPUTS.
 *
 * EVERY EDGE IS DOCUMENTED. Nothing is inferred: a module appears under a
 * signal because its own `signalIds` names that signal, under a capability
 * because its `capabilityIds` names it, and under an input because
 * `sourcesForProduct` read that input off the module's own documented input
 * string. There is no similarity scoring and no fallback that would put a
 * module under something it does not claim.
 *
 * This is relationship data, not measurement, so it carries no illustrative
 * badge — there are no invented numbers on this surface to label.
 */

type Focus = { kind: "signal" | "capability"; id: string } | null;

const STAGES = ["Input", "Movement signals", "AI capabilities", "GaitAI modules", "Outputs"];

export function SignalIntelligenceExplorer() {
  const [source, setSource] = useState<CaptureSource>("video");
  const [focus, setFocus] = useState<Focus>(null);

  /** Modules that can work from this input, per their own documented input. */
  const sourceProducts = useMemo(
    () => analyticsProducts.filter((product) => product.sources.includes(source)),
    [source],
  );

  /** Narrowed by the selected signal or capability, if one is selected. */
  const products = useMemo(() => {
    if (!focus) return sourceProducts;
    return sourceProducts.filter((product) =>
      focus.kind === "signal"
        ? product.signalIds.includes(focus.id)
        : product.capabilityIds.includes(focus.id),
    );
  }, [sourceProducts, focus]);

  /** Stage contents, in graph order so the columns never reshuffle. */
  const signals = useMemo(
    () =>
      signalNodes.filter((node) =>
        sourceProducts.some((product) => product.signalIds.includes(node.id)),
      ),
    [sourceProducts],
  );

  const capabilities = useMemo(
    () =>
      capabilityNodes.filter((node) =>
        products.some((product) => product.capabilityIds.includes(node.id)),
      ),
    [products],
  );

  const outputs = useMemo(
    () => Array.from(new Set(products.flatMap((product) => product.outputs))),
    [products],
  );

  /** Which capabilities the focused signal reaches, for the dimming pass. */
  const liveCapabilityIds = useMemo(
    () => new Set(products.flatMap((product) => product.capabilityIds)),
    [products],
  );

  const families = useMemo(() => {
    const set = new Set(products.map((product) => product.family));
    return set.size === 1 ? [...set][0] : null;
  }, [products]);

  /* The run key restarts the entry animation whenever the chain changes, so
     the redraw is visible as a redraw. Every stage keys off the same value. */
  const runKey = `${source}:${focus?.kind ?? ""}:${focus?.id ?? ""}`;

  const sourceDef = CAPTURE_SOURCES.find((item) => item.id === source)!;

  const clearFocus = () => setFocus(null);

  return (
    <div
      className={`${styles.chain} ${
        families === "securevision" ? styles.famSecure : styles.famCare
      }`}
    >
      {/* ── INPUT ──
          Six labelled panels in a grid are a layout before they are a
          control, so one line names the act. The instruction below the rail
          already explains the second-level selection; this one is about the
          first choice a reader has to make. */}
      <p className="ix-hint mb-3">Choose a capture source to trace</p>
      <div className={styles.inputs} role="group" aria-label="Capture source">
        {CAPTURE_SOURCES.map((item) => {
          const on = item.id === source;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSource(item.id);
                setFocus(null);
              }}
              aria-pressed={on}
              className={`${styles.input} ${on ? styles.inputOn : ""}`}
            >
              <span className={styles.inputLabel}>{item.label}</span>
              <span className={styles.inputNote}>{item.note}</span>
            </button>
          );
        })}
      </div>

      <p className={styles.reading} aria-live="polite">
        <span className={styles.readingStrong}>{sourceDef.label}</span> →{" "}
        {signals.length} {signals.length === 1 ? "signal" : "signals"} →{" "}
        {capabilities.length}{" "}
        {capabilities.length === 1 ? "capability" : "capabilities"} →{" "}
        {products.length} {products.length === 1 ? "module" : "modules"} →{" "}
        {outputs.length} {outputs.length === 1 ? "output" : "outputs"}
        {focus && (
          <button type="button" onClick={clearFocus} className={styles.clear}>
            Clear selection
          </button>
        )}
      </p>

      {/* ── THE CHAIN ── */}
      <div key={runKey} className={styles.rail}>
        <div className={styles.head} aria-hidden="true">
          {STAGES.map((stage, i) => (
            <span key={stage} className={styles.headCell} style={{ ["--i" as string]: i }}>
              {stage}
            </span>
          ))}
        </div>

        <div className={styles.cols}>
          {/* Stage 1 — the input itself, so the chain starts from something. */}
          <div className={styles.col} style={{ ["--i" as string]: 0 }}>
            <span className={`${styles.node} ${styles.nodeInput}`}>
              {sourceDef.label}
            </span>
          </div>

          {/* Stage 2 — signals read from it. Selectable. */}
          <div className={styles.col} style={{ ["--i" as string]: 1 }}>
            {signals.map((node) => {
              const on = focus?.kind === "signal" && focus.id === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setFocus(on ? null : { kind: "signal", id: node.id })
                  }
                  className={`${styles.node} ${styles.nodeSignal} ${
                    on ? styles.nodeOn : ""
                  }`}
                >
                  {node.title}
                </button>
              );
            })}
          </div>

          {/* Stage 3 — capabilities that process them. Selectable. */}
          <div className={styles.col} style={{ ["--i" as string]: 2 }}>
            {capabilityNodes
              .filter((node) => capabilities.includes(node))
              .map((node) => {
                const on = focus?.kind === "capability" && focus.id === node.id;
                const live = liveCapabilityIds.has(node.id);
                return (
                  <button
                    key={node.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setFocus(on ? null : { kind: "capability", id: node.id })
                    }
                    className={`${styles.node} ${styles.nodeCap} ${
                      on ? styles.nodeOn : ""
                    } ${live ? "" : styles.nodeDim}`}
                  >
                    {node.title}
                  </button>
                );
              })}
          </div>

          {/* Stage 4 — the modules built on them. Each opens its own page. */}
          <div className={styles.col} style={{ ["--i" as string]: 3 }}>
            {products.map((product) => (
              <Link
                key={product.id}
                href={product.href}
                className={`${styles.node} ${styles.nodeModule} ${
                  product.family === "securevision"
                    ? styles.moduleSecure
                    : styles.moduleCare
                }`}
              >
                {product.short}
              </Link>
            ))}
          </div>

          {/* Stage 5 — what those modules document producing. */}
          <div className={styles.col} style={{ ["--i" as string]: 4 }}>
            {outputs.slice(0, 10).map((output) => (
              <span key={output} className={`${styles.node} ${styles.nodeOutput}`}>
                {output}
              </span>
            ))}
            {outputs.length > 10 && (
              <span className={styles.more}>+{outputs.length - 10} more</span>
            )}
          </div>
        </div>
      </div>

      <p className={styles.foot}>
        Every step is a documented relationship: a module appears under a signal
        or a capability because its own record names it. Select a signal or a
        capability to narrow the chain to what that relationship reaches.
      </p>
    </div>
  );
}

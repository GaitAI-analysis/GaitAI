"use client";

import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { PillarVisual, type PillarKind } from "./PillarVisual";
import { EvidencePanel } from "./EvidencePanel";
import styles from "./observatory.module.css";

/**
 * The evidence map: the page's centrepiece and its only interactive surface.
 *
 * Four research pillars on the left, the selected pillar's evidence flow in
 * the middle, and a compact summary of that pillar on the right. Selecting a
 * pillar re-draws the graph and swaps the panel, and the whole thing is a
 * proper tablist so a keyboard reaches every pillar with the arrow keys.
 *
 * The right panel is deliberately a summary — two records, capability names,
 * four product chips — because rendering the full record inline made that
 * column two to three times taller than the graph. EvidencePanel owns that
 * disclosure; every mapping stays reachable from inside it.
 *
 * Everything rendered is derived data passed in from `researchAreas` — the
 * publication records a pillar cites, the capabilities the graph maps it to,
 * and the products documented as built on those capabilities. No relationship
 * is invented here, and a pillar with one record shows one record.
 *
 * Below `lg` the graph becomes a stacked chain rather than a shrunken diagram:
 * a 620-unit viewBox on a phone would put 6px labels on screen.
 */

export type ObservatoryArea = {
  id: string;
  title: string;
  summary: string;
  kind: PillarKind;
  publications: {
    id: string;
    title: string;
    venue: string;
    year: number;
    kind: string;
  }[];
  capabilities: { id: string; title: string; description: string }[];
  /** Every product this area reaches, for the counts and the graph. */
  products: AreaChip[];
  /**
   * The same set, split by how strong the relationship actually is.
   *
   * `directProducts` use a capability this research is specifically about.
   * `architecturalProducts` draw on a broad platform capability the work
   * happens to touch — listed for traceability, not as evidence. Collapsing
   * the two made a gait-recognition paper look like it stood behind FallRisk,
   * which is the overreach the split exists to prevent.
   */
  directProducts: AreaChip[];
  architecturalProducts: AreaChip[];
  /** Where the record's contribution ends and GaitAI's own design begins. */
  boundary?: {
    foundationLabel: string;
    foundation: string[];
    controlsLabel: string;
    controls: string[];
    note: string;
  };
};

export type AreaChip = {
  id: string;
  short: string;
  vertical: string;
  href: string;
};

const W = 620;
const H = 400;
const RESEARCH_X = 80;
const CAP_X = 300;
const JUNCTION_X = 432;
const CHIP_X = 470;
const MID_Y = 205;
const CHIPS_SHOWN = 5;

/** Break a title into at most `lines` lines of about `max` characters. */
function wrap(text: string, max: number, lines: number) {
  const words = text.split(" ");
  const out: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max && current) {
      out.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) out.push(current);
  if (out.length <= lines) return out;
  const head = out.slice(0, lines - 1);
  head.push(out.slice(lines - 1).join(" "));
  return head;
}

const capY = (index: number, count: number) => {
  const gap = count > 2 ? 78 : 96;
  return MID_Y + (index - (count - 1) / 2) * gap;
};

const chipY = (index: number, count: number) =>
  MID_Y + (index - (count - 1) / 2) * 34;

export function EvidenceObservatory({ areas }: { areas: ObservatoryArea[] }) {
  const [selected, setSelected] = useState(0);
  const area = areas[selected];

  const capCount = area.capabilities.length;
  const chips = area.products.slice(0, CHIPS_SHOWN);
  const moreProducts = area.products.length - chips.length;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const back = event.key === "ArrowLeft" || event.key === "ArrowUp";
    if (!forward && !back) return;
    event.preventDefault();
    const next = forward
      ? (selected + 1) % areas.length
      : (selected - 1 + areas.length) % areas.length;
    setSelected(next);
    const tabs = event.currentTarget.querySelectorAll<HTMLButtonElement>(
      "button[role='tab']",
    );
    tabs[next]?.focus();
  };

  return (
    <div className={styles.emap}>
      {/* ── Pillar index ── */}
      <div>
        {/* A vertical rule-separated list of pillar names does not look like a
            control, and the thing it drives — the evidence flow — is two
            columns away. One line says what the connection is. */}
        <p className="ix-hint mb-3">
          Select a research area to trace its evidence path
        </p>
        <div
          role="tablist"
          aria-label="Research pillars"
          aria-orientation="vertical"
          className={styles.emapIndex}
          onKeyDown={onKeyDown}
        >
        {areas.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`pillar-tab-${item.id}`}
            aria-selected={i === selected}
            aria-controls={`pillar-panel-${item.id}`}
            tabIndex={i === selected ? 0 : -1}
            onClick={() => setSelected(i)}
            className={`${styles.emapTab}${
              i === selected ? ` ${styles.emapTabActive}` : ""
            }`}
          >
            <span aria-hidden="true" className={styles.emapTabIndex}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <PillarVisual kind={item.kind} className={styles.pvTab} />
            <span className="min-w-0">
              <span className={styles.emapTabTitle}>{item.title}</span>
              <span className={styles.emapTabMeta}>
                {item.publications.length}{" "}
                {item.publications.length === 1 ? "record" : "records"} ·{" "}
                {item.capabilities.length}{" "}
                {item.capabilities.length === 1 ? "capability" : "capabilities"}
              </span>
            </span>
          </button>
        ))}
        </div>
      </div>

      {/* ── Evidence flow ── */}
      <div className={styles.emapStage}>
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${W} ${H}`}
          className={`${styles.emapGraph} hidden lg:block`}
        >
          <text className={styles.gColumnLabel} x={20} y={18}>
            Research
          </text>
          <text className={styles.gColumnLabel} x={CAP_X} y={18} textAnchor="middle">
            Capability
          </text>
          <text className={styles.gColumnLabel} x={W - 20} y={18} textAnchor="end">
            Product modules
          </text>
          <line className={styles.gRule} x1={20} y1={30} x2={W - 20} y2={30} />

          {/* Research pillar */}
          <circle
            className={`${styles.gHalo} ${styles.gHaloLive}`}
            cx={RESEARCH_X}
            cy={MID_Y}
            r={30}
          />
          <circle
            className={`${styles.gNode} ${styles.gNodeLive}`}
            cx={RESEARCH_X}
            cy={MID_Y}
            r={13}
          />
          <circle
            className={`${styles.gNodeDot} ${styles.gNodeDotLive}`}
            cx={RESEARCH_X}
            cy={MID_Y}
            r={4}
          />
          {wrap(area.title, 17, 2).map((line, i) => (
            <text
              key={line}
              className={`${styles.gLabel} ${styles.gLabelLive}`}
              x={RESEARCH_X}
              y={MID_Y + 44 + i * 14}
              textAnchor="middle"
            >
              {line}
            </text>
          ))}
          <text
            className={styles.gCount}
            x={RESEARCH_X}
            y={MID_Y - 34}
            textAnchor="middle"
          >
            {area.publications.length}{" "}
            {area.publications.length === 1 ? "record" : "records"}
          </text>

          {/* Research → capability */}
          {area.capabilities.map((capability, i) => {
            const y = capY(i, capCount);
            const d = `M${RESEARCH_X + 16} ${MID_Y} C${RESEARCH_X + 90} ${MID_Y} ${
              CAP_X - 90
            } ${y} ${CAP_X - 30} ${y}`;
            return (
              <g key={capability.id}>
                <path className={`${styles.gEdge} ${styles.gEdgeLive}`} d={d} />
                <path
                  className={styles.gEdgeFlow}
                  style={{ "--i": i } as CSSProperties}
                  d={d}
                  pathLength={100}
                />
              </g>
            );
          })}

          {/* Capability nodes */}
          {area.capabilities.map((capability, i) => {
            const y = capY(i, capCount);
            return (
              <g key={`cap-${capability.id}`}>
                <circle
                  className={`${styles.gHalo} ${styles.gHaloLive}`}
                  cx={CAP_X}
                  cy={y}
                  r={22}
                />
                <circle
                  className={`${styles.gNode} ${styles.gNodeLive}`}
                  cx={CAP_X}
                  cy={y}
                  r={9}
                />
                <circle
                  className={`${styles.gNodeDot} ${styles.gNodeDotLive}`}
                  cx={CAP_X}
                  cy={y}
                  r={3}
                />
                <text
                  className={`${styles.gLabel} ${styles.gLabelLive}`}
                  x={CAP_X}
                  y={y - 30}
                  textAnchor="middle"
                >
                  {capability.title}
                </text>
                {/* Capability → junction */}
                <path
                  className={`${styles.gEdge} ${styles.gEdgeLive}`}
                  d={`M${CAP_X + 12} ${y} C${CAP_X + 70} ${y} ${
                    JUNCTION_X - 60
                  } ${MID_Y} ${JUNCTION_X - 8} ${MID_Y}`}
                />
              </g>
            );
          })}

          {/* Junction into the module column */}
          <circle className={styles.gNode} cx={JUNCTION_X} cy={MID_Y} r={6} />
          <circle
            className={`${styles.gNodeDot} ${styles.gNodeDotLive}`}
            cx={JUNCTION_X}
            cy={MID_Y}
            r={2.4}
          />

          {/* Module chips */}
          {chips.map((product, i) => {
            const y = chipY(i, chips.length + (moreProducts > 0 ? 1 : 0));
            const d = `M${JUNCTION_X + 8} ${MID_Y} C${JUNCTION_X + 26} ${MID_Y} ${
              CHIP_X - 20
            } ${y} ${CHIP_X - 4} ${y}`;
            return (
              <g key={product.id}>
                <path className={`${styles.gEdge} ${styles.gEdgeLive}`} d={d} />
                <path
                  className={styles.gEdgeFlow}
                  style={{ "--i": i + 2 } as CSSProperties}
                  d={d}
                  pathLength={100}
                />
                <text
                  className={`${styles.gLabel} ${styles.gLabelLive}`}
                  x={CHIP_X + 6}
                  y={y + 4}
                >
                  {product.short}
                </text>
              </g>
            );
          })}
          {moreProducts > 0 && (
            <text
              className={styles.gCount}
              x={CHIP_X + 6}
              y={chipY(chips.length, chips.length + 1) + 4}
            >
              + {moreProducts} more
            </text>
          )}
        </svg>

        {/* Below lg: the same chain, stacked. */}
        <ol className={`${styles.chain} lg:hidden`} aria-hidden="true">
          <li className={styles.chainStep}>
            <span className={styles.chainLabel}>Research</span>
            <span className={styles.chainBody}>{area.title}</span>
          </li>
          <li className={styles.chainStep}>
            <span className={styles.chainLabel}>Capability</span>
            <span className={styles.chainBody}>
              {area.capabilities.map((c) => c.title).join(" · ")}
            </span>
          </li>
          <li className={styles.chainStep}>
            <span className={styles.chainLabel}>Product modules</span>
            <span className={styles.chainBody}>
              {area.products.map((p) => p.short).join(" · ")}
            </span>
          </li>
        </ol>
      </div>

      {/* ── Detail panel ── */}
      <div
        role="tabpanel"
        id={`pillar-panel-${area.id}`}
        aria-labelledby={`pillar-tab-${area.id}`}
        tabIndex={0}
        className={styles.emapPanel}
      >
        {/* Compact summary with progressive disclosure — see EvidencePanel.
            Keyed on the pillar id so switching pillars remounts it and every
            disclosure returns to its collapsed default. */}
        <EvidencePanel key={area.id} area={area} />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./landing.module.css";

/**
 * The ideas connect.
 *
 * Five essays, five themes, and the fact that no essay sits under exactly one
 * theme — which is the section's whole argument. Pointing at a story lights
 * the themes it actually spans and dims the rest; pointing at a theme lights
 * the stories that reach it.
 *
 * Deliberately NOT a force graph. Nine nodes, hairline edges, large type and a
 * lot of empty field: a generic network visualisation would say "we have a
 * graph", where this says "these five ideas overlap". Theme placement is
 * hand-set rather than simulated, so the composition is stable and readable
 * instead of arriving differently on every load.
 *
 * ACCESSIBILITY
 * The stories are links, so the keyboard walks them and `focus` drives the
 * same highlight. Every relationship is also stated in text under each story
 * node, so nothing here exists only as a line on a diagram.
 */

type Theme = { id: string; label: string; at: [number, number] };

type Node = {
  slug: string;
  step: number;
  label: string;
  title: string;
  themes: string[];
  at: [number, number];
};

/* The five editorial themes, placed as a field rather than a ring. */
const THEMES: Theme[] = [
  { id: "movement", label: "MOVEMENT", at: [300, 118] },
  { id: "intelligence", label: "INTELLIGENCE", at: [534, 74] },
  { id: "privacy", label: "PRIVACY", at: [116, 214] },
  { id: "mobility", label: "MOBILITY", at: [352, 320] },
  { id: "evidence", label: "EVIDENCE", at: [578, 268] },
];

const NODES: Node[] = [
  {
    slug: "from-walking-video-to-movement-intelligence",
    step: 1,
    label: "Pipeline",
    title: "From Walking Video to Movement Intelligence",
    themes: ["movement", "intelligence"],
    at: [416, 96],
  },
  {
    slug: "your-walk-is-more-than-a-biometric",
    step: 2,
    label: "Beyond identity",
    title: "Your Walk Is More Than a Biometric",
    themes: ["movement", "mobility", "intelligence"],
    at: [326, 218],
  },
  {
    slug: "movement-intelligence-without-identification",
    step: 3,
    label: "Without identity",
    title: "Can AI Understand Movement Without Identifying the Person?",
    themes: ["privacy", "movement", "intelligence"],
    at: [200, 154],
  },
  {
    slug: "fall-risk-is-a-trend-not-a-number",
    step: 4,
    label: "Over time",
    title: "A Fall-Risk Score Is Not Enough",
    themes: ["mobility", "evidence"],
    at: [470, 296],
  },
  {
    slug: "when-fusion-looks-better-than-it-is",
    step: 5,
    label: "The audit",
    title: "When Fusion Looks Better Than It Is",
    themes: ["evidence", "intelligence"],
    at: [560, 170],
  },
];

const themeById = new Map(THEMES.map((t) => [t.id, t]));

export function IdeasConstellation() {
  const [active, setActive] = useState<string | null>(null);

  const activeNode = NODES.find((n) => n.slug === active) ?? null;
  const litThemes = new Set(activeNode?.themes ?? []);

  const dim = (on: boolean) => (active && !on ? styles.cnDim : "");

  return (
    <div className={styles.cn} onMouseLeave={() => setActive(null)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 700 400"
        className={styles.cnField}
      >
        {/* Edges: story → each theme it spans. */}
        {NODES.flatMap((node) =>
          node.themes.map((themeId) => {
            const theme = themeById.get(themeId);
            if (!theme) return null;
            const on = active === node.slug;
            return (
              <line
                key={`${node.slug}-${themeId}`}
                className={`${styles.cnEdge} ${on ? styles.cnEdgeOn : dim(false)}`}
                x1={node.at[0]}
                y1={node.at[1]}
                x2={theme.at[0]}
                y2={theme.at[1]}
              />
            );
          }),
        )}

        {/* Themes. */}
        {THEMES.map((theme) => {
          const on = litThemes.has(theme.id);
          return (
            <g
              key={theme.id}
              className={`${styles.cnTheme} ${on ? styles.cnThemeOn : dim(on)}`}
            >
              <circle cx={theme.at[0]} cy={theme.at[1]} r={3.5} />
              <text
                x={theme.at[0]}
                y={theme.at[1] - 14}
                textAnchor="middle"
                className={styles.cnThemeLabel}
              >
                {theme.label}
              </text>
            </g>
          );
        })}

        {/* Story nodes. */}
        {NODES.map((node) => {
          const on = active === node.slug;
          return (
            <g
              key={node.slug}
              className={`${styles.cnNode} ${on ? styles.cnNodeOn : dim(on)}`}
            >
              <circle cx={node.at[0]} cy={node.at[1]} r={on ? 9 : 6.5} />
              <circle
                className={styles.cnNodeCore}
                cx={node.at[0]}
                cy={node.at[1]}
                r={2.4}
              />
            </g>
          );
        })}
      </svg>

      {/* The stories themselves — the links, and the text the diagram shows. */}
      <ol className={styles.cnList}>
        {NODES.map((node) => {
          const on = active === node.slug;
          return (
            <li key={node.slug}>
              <Link
                href={`/insights/${node.slug}/`}
                className={`${styles.cnItem} ${on ? styles.cnItemOn : ""}`}
                onMouseEnter={() => setActive(node.slug)}
                onFocus={() => setActive(node.slug)}
                onBlur={() => setActive(null)}
              >
                <span className={styles.cnItemNo}>
                  {String(node.step).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className={styles.cnItemTitle}>{node.title}</span>
                  <span className={styles.cnItemThemes}>
                    {node.themes
                      .map((id) => themeById.get(id)?.label ?? id)
                      .join(" · ")}
                  </span>
                </span>
                <span aria-hidden="true" className={styles.cnItemArrow}>
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

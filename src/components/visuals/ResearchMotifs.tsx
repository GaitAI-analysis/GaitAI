import type { CSSProperties } from "react";
import { GAIT_HEAD, GAIT_NECK, GAIT_PHASES, type Pt } from "@/components/visuals/gait-phases";

/**
 * Two technical motifs for the research section's decision points, drawn as
 * wide instrument strips across the head of each card (480×76, so they render
 * at roughly the height of three lines of body copy rather than towering over
 * it).
 *
 * Neither is iconographic: the evidence chain shows the traversal the evidence
 * map actually offers — record → capability → product — and the privacy strip
 * shows what PrivacyGuard leaves behind: a skeleton inside a dashed boundary
 * with the head obscured, the controls listed as readouts, and retention shown
 * as a settable track rather than a fixed promise. Animation is a slow dash
 * march along the connectors; nothing flashes.
 */

const round = (n: number) => Math.round(n * 10) / 10;

const STRIP = {
  viewBox: "0 0 480 76",
  className: "res-motif-strip",
  "aria-hidden": true,
} as const;

/** record → capability → product, with the signal marching along the chain. */
export function EvidenceChainMotif() {
  const y = 32;
  const nodes = [
    { x: 80, label: "RECORD" },
    { x: 240, label: "CAPABILITY" },
    { x: 400, label: "PRODUCT" },
  ];

  return (
    <svg {...STRIP}>
      <defs>
        <linearGradient id="res-chain-link" x1="0" x2="1">
          <stop offset="0" stopColor="#4FD1FF" stopOpacity="0.7" />
          <stop offset="1" stopColor="#4FD1FF" stopOpacity="0.18" />
        </linearGradient>
      </defs>

      {nodes.slice(0, -1).map((node, i) => {
        const from = node.x + 15;
        const to = nodes[i + 1].x - 15;
        const d = `M${from} ${y}C${from + 44} ${y - 10} ${to - 44} ${y + 10} ${to} ${y}`;
        return (
          <g key={node.label} style={{ "--res-i": i } as CSSProperties}>
            <path className="res-chain-trace" d={d} stroke="url(#res-chain-link)" />
            <path className="res-chain-flow" d={d} pathLength={100} />
          </g>
        );
      })}

      {nodes.map((node, i) => (
        <g key={node.label} style={{ "--res-i": i } as CSSProperties}>
          <circle className="res-chain-halo" cx={node.x} cy={y} r={17} />
          <circle className="res-chain-ring" cx={node.x} cy={y} r={12} />
          {i === 0 &&
            [-3.6, 0, 3.6].map((dy) => (
              <line
                key={dy}
                className="res-chain-glyph"
                x1={node.x - 4.6}
                y1={y + dy}
                x2={node.x + 4.6}
                y2={y + dy}
              />
            ))}
          {i === 1 &&
            [
              [-3.6, -3.6],
              [3.6, -3.6],
              [-3.6, 3.6],
              [3.6, 3.6],
            ].map(([dx, dy]) => (
              <circle
                key={`${dx}${dy}`}
                className="res-chain-dot"
                cx={node.x + dx}
                cy={y + dy}
                r={1.5}
              />
            ))}
          {i === 2 && (
            <rect
              className="res-chain-glyph"
              x={node.x - 4.8}
              y={y - 4.8}
              width={9.6}
              height={9.6}
              rx={2}
            />
          )}
          <text className="res-mono" x={node.x} y={62} fontSize={8.5} textAnchor="middle">
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/**
 * What the privacy layer leaves: a skeleton inside a retention boundary, head
 * obscured, the controls and the retention setting shown as readouts.
 */
export function PrivacyLayerMotif() {
  const phase = GAIT_PHASES[2];
  const s = 0.58;
  const originX = 70;
  const originY = 40;
  const pts = (p: readonly Pt[]) =>
    p.map(([px, py]) => `${round(px * s)},${round(py * s)}`).join(" ");
  const controls = ["Skeleton only", "Face blur", "Audit log"];
  const groundY = round(originY + 48 * s);

  return (
    <svg {...STRIP}>
      {/* Retention boundary — dashed, because it is a policy, not a wall. */}
      <rect className="res-privacy-bound" x={16} y={6} width={110} height={66} rx={10} />
      <line className="res-ground" x1={26} y1={groundY} x2={116} y2={groundY} />

      <g className="res-figure" transform={`translate(${originX} ${originY})`}>
        <polyline className="res-bone res-bone--far" points={pts(phase.farArm)} />
        <polyline className="res-bone res-bone--far" points={pts(phase.farLeg)} />
        <path
          className="res-bone"
          d={`M0 0 C${round(0.4 * s)} ${round(-12 * s)} ${round(0.9 * s)} ${round(-24 * s)} ${round(
            1.5 * s,
          )} ${round(-34 * s)}`}
        />
        <polyline className="res-bone" points={pts(phase.nearArm)} />
        <polyline className="res-bone" points={pts(phase.nearLeg)} />
        {[...phase.nearArm, ...phase.nearLeg, GAIT_NECK].map(([jx, jy], i) => (
          <circle
            key={i}
            className="res-joint"
            cx={round(jx * s)}
            cy={round(jy * s)}
            r={round(1.9 * s)}
          />
        ))}
        {/* Head: obscured rather than drawn. */}
        <rect
          className="res-privacy-blur"
          x={round(GAIT_HEAD[0] * s - 4.4)}
          y={round(GAIT_HEAD[1] * s - 5)}
          width={9.4}
          height={10}
          rx={2.2}
        />
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            className="res-privacy-hatch"
            x1={round(GAIT_HEAD[0] * s - 4.4)}
            y1={round(GAIT_HEAD[1] * s - 3.2 + i * 2.7)}
            x2={round(GAIT_HEAD[0] * s + 5)}
            y2={round(GAIT_HEAD[1] * s - 5 + i * 2.7)}
          />
        ))}
      </g>

      {/* Controls, as readouts on the boundary's output side. */}
      {controls.map((control, i) => {
        const cy = 22 + i * 17;
        return (
          <g key={control} style={{ "--res-i": i } as CSSProperties}>
            <line className="res-privacy-link" x1={126} y1={cy} x2={150} y2={cy} />
            <circle className="res-privacy-node" cx={153} cy={cy} r={2.6} />
            <text className="res-label" x={163} y={cy + 3.6} fontSize={10.5}>
              {control}
            </text>
          </g>
        );
      })}

      {/* Retention — a setting on a track, not a fixed guarantee. */}
      <line className="res-privacy-divider" x1={306} y1={12} x2={306} y2={64} />
      <text className="res-mono" x={324} y={26} fontSize={8}>
        RETENTION
      </text>
      <line className="res-privacy-track" x1={324} y1={44} x2={462} y2={44} />
      <line className="res-privacy-track-live" x1={324} y1={44} x2={404} y2={44} />
      {[324, 358, 393, 427, 462].map((tx) => (
        <line
          key={tx}
          className="res-privacy-track-tick"
          x1={tx}
          y1={48}
          x2={tx}
          y2={53}
        />
      ))}
      <circle className="res-privacy-knob" cx={404} cy={44} r={3.4} />
      <text className="res-mono" x={324} y={68} fontSize={7.5}>
        CONFIGURABLE
      </text>
    </svg>
  );
}

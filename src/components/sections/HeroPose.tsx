import {
  HERO_CANVAS,
  POSE_EDGES,
  type HeroPanel,
  type PoseJoint,
} from "@/data/home-hero";
import { heroPanelById } from "@/lib/hero-panels";
import styles from "./hero.module.css";

/**
 * THE POSE OVERLAY — what the platform reads, drawn rather than painted.
 * =============================================================================
 * The approved artwork had cyan keypoints baked onto the people, which is why
 * they were the softest thing in the hero on a Retina screen: a 10px disc in a
 * 1774px picture stretched across 2560 CSS pixels at 2x is a 29px blur. Drawn
 * as SVG, the same disc is a vector and is exact at any device pixel ratio.
 *
 * ── THE COORDINATE SPACE ──────────────────────────────────────────────────
 * The viewBox is the PANEL'S PHOTOGRAPH, not the hero's canvas — so a skeleton
 * is expressed in the picture it is attached to and cannot slide off it. The
 * photograph is laid in with `object-fit: cover; object-position: center`, and
 * `preserveAspectRatio="xMidYMid slice"` is the SVG spelling of exactly that,
 * so the overlay crops with the picture at every width, on desktop and in the
 * stacked phone layout alike. Those two declarations are a matched pair: change
 * one and the skeletons drift off the people.
 *
 * ── THE RESTRAINT IS THE POINT ────────────────────────────────────────────
 * Thin bones, small joints, well under full opacity, one accent colour. This is
 * a measurement laid over a photograph, not a neon skeleton: the brief asks for
 * anatomically plausible and subtle, and the weights live in hero.module.css so
 * they can be judged against the picture rather than guessed at here. A figure
 * marked `depth: "far"` in the data is drawn lighter still — smaller joints, a
 * thinner bone, lower opacity — so the panel's main subject stays the one the
 * eye lands on, and the overlay reads as a computer-vision layer whose
 * confidence falls off with distance rather than as a row of blue beads.
 */
export function HeroPose({ panel }: { panel: HeroPanel }) {
  if (panel.pose.length === 0) return null;

  const asset = heroPanelById[panel.id];
  const width = asset.box.x1 - asset.box.x0;

  return (
    <svg
      className={styles.pose}
      viewBox={`0 0 ${width} ${HERO_CANVAS.height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {panel.pose.map((figure, index) => {
        const joints = Object.entries(figure.joints) as [
          PoseJoint,
          readonly [number, number],
        ][];
        return (
          <g key={index} className={styles.poseFigure} data-depth={figure.depth ?? "near"}>
            {/* Bones first, so every joint disc sits on top of its lines. */}
            {POSE_EDGES.map(([from, to]) => {
              const a = figure.joints[from];
              const b = figure.joints[to];
              if (!a || !b) return null;
              return (
                <line
                  key={`${from}-${to}`}
                  className={styles.poseBone}
                  x1={a[0]}
                  y1={a[1]}
                  x2={b[0]}
                  y2={b[1]}
                />
              );
            })}
            {joints.map(([name, [x, y]]) => (
              <circle key={name} className={styles.poseJoint} cx={x} cy={y} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

import { GAIT_PHASES, type Pt } from "@/components/visuals/gait-phases";
import styles from "./scene.module.css";

/**
 * The pose skeleton — an anatomical wireframe, not a stick figure.
 *
 * A five-line matchstick figure is the thing this page must not draw: it makes
 * a research claim look like a placeholder. What makes the reference's figure
 * read as a *body* is that it is built from the structures a pose model
 * actually fits — a segmented spine, a rib cage, a pelvis, clavicles, and
 * limbs with a joint at every vertex — so this draws all of them.
 *
 * The limbs come from `gait-phases`, the same canonical keyframes the rest of
 * the site walks with, so the pose is a real stride rather than a drawn one.
 * Everything else — the axial skeleton — is generated here in the same local
 * coordinate space: pelvis at (0,0), ground at y≈48, walking direction +x,
 * which is also the direction the ribs and skull face.
 *
 * Two passes give it depth: a wide, very soft pass underneath for volume, and
 * the hairline pass on top for structure. No gradients on the strokes and no
 * glow filters — the light comes from the scene around it.
 */

const r1 = (n: number) => Math.round(n * 100) / 100;

export type SkeletonPhase = 0 | 1 | 2 | 3 | 4;

/** The spine, as vertebral segments with a slight lumbar curve. */
const SPINE: Pt[] = [
  [1.6, -33.4],
  [1.2, -28],
  [0.7, -22.5],
  [0.3, -17],
  [0.1, -11.5],
  [0.2, -6],
  [0.4, -1],
];

/**
 * The rib cage: six pairs curving forward from the spine, tapering upward,
 * plus the sternum line they meet.
 */
function ribs() {
  const out: { d: string; o: number }[] = [];
  for (let i = 0; i < 6; i += 1) {
    const t = i / 5;
    const y = -31 + t * 15;
    const x = 1.4 - t * 1.1;
    const reach = 9.6 - Math.abs(t - 0.42) * 5.6;
    const drop = 3.4 + t * 0.7;
    // forward (the walking direction) and back, so the cage has depth
    out.push({
      d: `M ${r1(x)} ${r1(y)} C ${r1(x + reach * 0.75)} ${r1(y - 0.6)} ${r1(
        x + reach,
      )} ${r1(y + drop * 0.35)} ${r1(x + reach * 0.72)} ${r1(y + drop)}`,
      o: 0.62 - i * 0.05,
    });
    out.push({
      d: `M ${r1(x)} ${r1(y)} C ${r1(x - reach * 0.5)} ${r1(y - 0.4)} ${r1(
        x - reach * 0.66,
      )} ${r1(y + drop * 0.3)} ${r1(x - reach * 0.46)} ${r1(y + drop * 0.85)}`,
      o: 0.3 - i * 0.03,
    });
  }
  return out;
}

const STERNUM = `M ${r1(SPINE[0][0] + 7)} ${r1(SPINE[0][1] + 2.6)} C ${r1(
  SPINE[0][0] + 8.4,
)} -25 ${r1(SPINE[0][0] + 7.6)} -21 ${r1(SPINE[0][0] + 5.6)} -17.5`;

/** The pelvis, as a closed plate. */
const PELVIS = "M -4.4 -3.2 L 4.6 -2.4 L 5.4 3.4 L -3.2 3.2 Z";

/** Clavicle: one segment forward, one back, from the top of the spine. */
const CLAVICLE_F = "M 1.6 -33.4 L 6.4 -31.8";
const CLAVICLE_B = "M 1.6 -33.4 L -3.2 -31.4";

export function PoseSkeleton({
  phase = 0,
  scale,
  x,
  y,
  /**
   * "full" draws the axial skeleton — spine, ribs, sternum, pelvis, skull —
   * and every joint. "ghost" draws limbs and torso line only, for the earlier
   * frames of a stride sequence, where anatomical detail would read as noise.
   */
  detail = "full",
  opacity = 1,
}: {
  phase?: SkeletonPhase;
  /** Local-unit → viewBox-unit multiplier. */
  scale: number;
  /** Where the pelvis lands in the parent viewBox. */
  x: number;
  y: number;
  detail?: "full" | "ghost";
  opacity?: number;
}) {
  const P = GAIT_PHASES[phase];

  /* The group transform does the scaling, so everything inside is in local
     units. `vector-effect: non-scaling-stroke` keeps the hairlines at 1px
     through it. */
  const tx = (p: Pt) => r1(p[0]);
  const ty = (p: Pt) => r1(p[1]);
  const poly = (list: readonly Pt[]) =>
    list.map((point) => `${tx(point)},${ty(point)}`).join(" ");

  /** Every joint the drawing marks — one dot per articulation. */
  const joints: Pt[] = [
    ...SPINE,
    P.nearLeg[0],
    P.nearLeg[1],
    P.nearLeg[2],
    P.farLeg[1],
    P.farLeg[2],
    P.nearArm[0],
    P.nearArm[1],
    P.nearArm[2],
    P.farArm[1],
    P.farArm[2],
  ];

  if (detail === "ghost") {
    return (
      <g
        transform={`translate(${x} ${y}) scale(${scale})`}
        className={styles.skeleton}
        opacity={opacity}
      >
        <g className={styles.skFar}>
          <polyline className={styles.skBone} points={poly(P.farArm)} />
          <polyline className={styles.skBone} points={poly(P.farLeg)} />
          <polyline className={styles.skBone} points={poly(P.farFoot)} />
        </g>
        <polyline className={styles.skSpine} points={poly(SPINE)} />
        <ellipse className={styles.skSkull} cx={2.2} cy={-39.6} rx={4.5} ry={5.4} />
        <polyline className={styles.skBone} points={poly(P.nearArm)} />
        <polyline className={styles.skBone} points={poly(P.nearLeg)} />
        <polyline className={styles.skBone} points={poly(P.nearFoot)} />
      </g>
    );
  }

  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      className={styles.skeleton}
      opacity={opacity}
    >
      {/* ── far side: behind the torso, dimmer and thinner ── */}
      <g className={styles.skFar}>
        <polyline className={styles.skBone} points={poly(P.farArm)} />
        <polyline className={styles.skBone} points={poly(P.farLeg)} />
        <polyline className={styles.skBone} points={poly(P.farFoot)} />
      </g>

      {/* ── axial skeleton ── */}
      <g className={styles.skAxial}>
        {ribs().map((rib) => (
          <path key={rib.d} className={styles.skRib} d={rib.d} opacity={rib.o} />
        ))}
        <path className={styles.skRib} d={STERNUM} opacity={0.45} />
        <polyline className={styles.skSpine} points={poly(SPINE)} />
        <path className={styles.skPelvis} d={PELVIS} />
        <path className={styles.skBone} d={CLAVICLE_F} />
        <path className={`${styles.skBone} ${styles.skFar}`} d={CLAVICLE_B} />
      </g>

      {/* ── skull: an ellipse with a jaw, so the figure has a facing ── */}
      <g className={styles.skHead}>
        <ellipse className={styles.skSkull} cx={2.2} cy={-39.6} rx={4.5} ry={5.4} />
        <path className={styles.skJaw} d="M -1.4 -37.6 C -0.6 -33.6 2.6 -33.2 5.4 -34.6" />
        <line className={styles.skNeck} x1={1.8} y1={-34.4} x2={1.6} y2={-33.4} />
      </g>

      {/* ── near side: in front ── */}
      <g>
        <polyline className={styles.skBone} points={poly(P.nearArm)} />
        <polyline className={styles.skBone} points={poly(P.nearLeg)} />
        <polyline className={styles.skBone} points={poly(P.nearFoot)} />
      </g>

      {/* ── joints ── */}
      {joints.map((joint, i) => (
        <circle key={i} className={styles.skJoint} cx={tx(joint)} cy={ty(joint)} r={1.15} />
      ))}
    </g>
  );
}

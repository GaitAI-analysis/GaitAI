import {
  GAIT_HEAD,
  GAIT_NECK,
  type GaitPhase,
  type Pt,
} from "@/components/visuals/gait-phases";

/**
 * One captured pose, drawn from the project's real gait keyframes.
 *
 * `gait-phases.ts` holds a single stride sampled at five canonical gait
 * events, with every joint placed by data rather than by rotating one
 * silhouette. Both the hero sequence and the pillar visuals draw through this
 * component, so a figure at 12px and a figure at 120px are provably the same
 * anatomy.
 *
 * The caller supplies its own class names, which keeps the CSS module that
 * owns the section in charge of colour and motion.
 */

export type FigureClasses = {
  bone: string;
  boneFar: string;
  joint: string;
  head: string;
  contact?: string;
};

const r1 = (n: number) => Math.round(n * 10) / 10;

export function PoseFrame({
  phase,
  s,
  classes,
  showContacts = false,
  showFar = true,
}: {
  phase: GaitPhase;
  /** Figure scale; the local box is roughly 90 units tall at s = 1. */
  s: number;
  classes: FigureClasses;
  showContacts?: boolean;
  showFar?: boolean;
}) {
  const pts = (list: readonly Pt[]) =>
    list.map(([x, y]) => `${r1(x * s)},${r1(y * s)}`).join(" ");
  const groundY = r1((48 - phase.lift) * s);
  const spine = `M0 0 C${r1(0.4 * s)} ${r1(-12 * s)} ${r1(0.9 * s)} ${r1(
    -24 * s,
  )} ${r1(1.5 * s)} ${r1(-34 * s)}`;
  const joints: readonly Pt[] = [...phase.nearArm, ...phase.nearLeg];

  return (
    <>
      {showContacts &&
        classes.contact &&
        phase.contacts.map((cx) => (
          <ellipse
            key={cx}
            className={classes.contact}
            cx={r1(cx * s)}
            cy={groundY}
            rx={r1(7 * s)}
            ry={r1(1.7 * s)}
          />
        ))}

      {showFar && (
        <>
          <polyline
            className={`${classes.bone} ${classes.boneFar}`}
            points={pts(phase.farArm)}
          />
          <polyline
            className={`${classes.bone} ${classes.boneFar}`}
            points={pts(phase.farLeg)}
          />
          <line
            className={`${classes.bone} ${classes.boneFar}`}
            x1={r1(phase.farFoot[0][0] * s)}
            y1={r1(phase.farFoot[0][1] * s)}
            x2={r1(phase.farFoot[1][0] * s)}
            y2={r1(phase.farFoot[1][1] * s)}
          />
        </>
      )}

      <path className={classes.bone} d={spine} />
      <circle
        className={classes.head}
        cx={r1(GAIT_HEAD[0] * s)}
        cy={r1(GAIT_HEAD[1] * s)}
        r={r1(4.4 * s)}
      />

      <polyline className={classes.bone} points={pts(phase.nearArm)} />
      <polyline className={classes.bone} points={pts(phase.nearLeg)} />
      <line
        className={classes.bone}
        x1={r1(phase.nearFoot[0][0] * s)}
        y1={r1(phase.nearFoot[0][1] * s)}
        x2={r1(phase.nearFoot[1][0] * s)}
        y2={r1(phase.nearFoot[1][1] * s)}
      />

      {joints.map(([jx, jy], i) => (
        <circle
          key={i}
          className={classes.joint}
          cx={r1(jx * s)}
          cy={r1(jy * s)}
          r={r1(1.9 * s)}
        />
      ))}
      <circle
        className={classes.joint}
        cx={r1(GAIT_NECK[0] * s)}
        cy={r1(GAIT_NECK[1] * s)}
        r={r1(1.7 * s)}
      />
    </>
  );
}

/** Smooth path through a point list (Catmull-Rom → cubic Bézier). */
export function smoothPath(points: readonly Pt[]) {
  if (points.length < 2) return "";
  let d = `M${r1(points[0][0])} ${r1(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(
      p2[1],
    )}`;
  }
  return d;
}

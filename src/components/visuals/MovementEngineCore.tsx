import type { CSSProperties } from "react";
import {
  GAIT_HEAD,
  GAIT_NECK,
  GAIT_PHASES,
  type GaitPhase,
  type Pt,
} from "@/components/visuals/gait-phases";
import styles from "./engine.module.css";

/**
 * The product ecosystem: one engine, two worlds.
 *
 *   MobilityCare  →  GaitAI Movement Intelligence Engine  →  SecureVision
 *
 * The message is a transformation, not three connected bubbles:
 *
 *   MOVEMENT → SIGNAL EXTRACTION → INTELLIGENCE → APPLICATION
 *
 * Each world therefore carries a real internal system rather than a tint, and
 * the three systems share one temporal "Motion DNA" language — samples taken
 * over time — expressed three ways:
 *
 *   MobilityCare — biomechanical. A stride's joint-angle field, four genuine
 *     gait poses (heel strike → stance → toe-off → swing) phase-aligned to
 *     that field, and a time axis of gait events and cadence intervals. Not a
 *     bar meter: the dominant marks are events and intervals, and the sample
 *     ticks are deliberately near-flat.
 *   Engine — signal interpretation. A radial sample ring that is illuminated
 *     by a single sweep per loop rather than spun, an ingest arc that responds
 *     when the inbound signal lands, and an emit arc when the output leaves.
 *   SecureVision — anonymous human movement intelligence in public space. A
 *     plan view of a monitored environment: anonymous pedestrian poses walking
 *     it, each standing on the route it is walking, over density contours,
 *     restricted-zone geometry, computed intersections and one flagged
 *     deviation. The figures are pose graphs, not silhouettes — no face, no
 *     fill, no bounding box, no camera and no shield — so the side reads as
 *     people whose movement is measured, with nobody identified.
 *
 * So both worlds start from people and diverge in what the movement is read
 * for: PEOPLE -> GAIT -> HEALTH on one side, PEOPLE -> TRAJECTORIES -> SAFETY
 * on the other, off one engine.
 *
 * COLOUR is the transformation too: the signal itself runs cyan (biomechanical
 * capture) → electric blue (engine) → violet (spatial intelligence). The
 * channels are gradient-stroked, so the colour changes along the travel rather
 * than only between the circles.
 *
 * RESPONSIVE: the wide and stacked compositions are gated by media queries
 * *inside the CSS module*. They are deliberately NOT gated with Tailwind's
 * `hidden`/`sm:block` — those are single-class rules in the global sheet, the
 * module's own `display` rule is a single-class rule in a later sheet, and the
 * later one wins. That is what previously rendered both variants at once.
 */

type Variant = "wide" | "stacked";

/** Which world the reader is pointing at, if any. */
export type EngineFocus = "care" | "secure" | "engine" | null;

type Geometry = {
  key: string;
  w: number;
  h: number;
  /** Engine centre and core radius. */
  c: Pt;
  r: number;
  /** Care-world centre and field radius; the secure world is its mirror. */
  world: Pt;
  worldR: number;

  /* ── MobilityCare interior bands, top to bottom ── */
  /** Joint-angle field: top of the plotted band, its baseline, its half-width. */
  phaseTop: number;
  phaseBase: number;
  phaseX: number;
  /** Walking sequence. */
  walkerIdx: readonly number[];
  walkerBaseY: number;
  walkerScale: number;
  walkerSpacing: number;
  /** Gait-event time axis and the cadence-interval row under it. */
  axisY: number;
  axisX: number;
  cadenceY: number;

  /* ── SecureVision field extent, as a fraction of worldR ── */
  fieldU: number;
  fieldV: number;
  /** Pedestrian size against this composition's world. */
  pedScale: number;

  /* ── Channel spread at the world end and at the engine end ── */
  fanWorld: number;
  fanEngine: number;

  /* ── Type ── */
  coreLines: readonly [number, number, number, number];
  coreDescY: number;
  /** The tertiary descriptor has to fit the core disc's chord at its own
      baseline, which is a much shorter line on the stacked composition. */
  coreDesc: string;
  coreBrandSize: number;
  coreTitleSize: number;
  coreDescSize: number;
  worldLabelSize: number;
  stacked: boolean;
};

const WIDE: Geometry = {
  key: "w",
  w: 1240,
  h: 452,
  c: [620, 264],
  r: 116,
  world: [206, 264],
  worldR: 152,

  phaseTop: 150,
  phaseBase: 208,
  phaseX: 98,
  walkerIdx: [0, 2, 3, 4],
  walkerBaseY: 266,
  walkerScale: 1.05,
  walkerSpacing: 66,
  axisY: 344,
  axisX: 118,
  cadenceY: 362,

  fieldU: 0.82,
  fieldV: 0.74,
  pedScale: 1.08,

  fanWorld: 96,
  fanEngine: 34,

  coreLines: [216, 242, 264, 286],
  coreDescY: 314,
  coreDesc: "Signals → Capabilities → Insight",
  coreBrandSize: 11,
  coreTitleSize: 19,
  coreDescSize: 8,
  worldLabelSize: 21,
  stacked: false,
};

const STACKED: Geometry = {
  key: "s",
  w: 420,
  h: 1092,
  c: [210, 546],
  r: 86,
  world: [210, 216],
  worldR: 120,

  phaseTop: 120,
  phaseBase: 166,
  phaseX: 66,
  walkerIdx: [0, 2, 4],
  walkerBaseY: 220,
  walkerScale: 0.86,
  walkerSpacing: 54,
  axisY: 286,
  axisX: 86,
  cadenceY: 302,

  fieldU: 0.82,
  fieldV: 0.74,
  pedScale: 0.86,

  fanWorld: 70,
  fanEngine: 26,

  coreLines: [498, 524, 546, 568],
  coreDescY: 596,
  coreDesc: "Signals → Intelligence",
  coreBrandSize: 10,
  coreTitleSize: 17,
  coreDescSize: 7.2,
  worldLabelSize: 20,
  stacked: true,
};

/* ═══ Motion DNA: one stride, sampled ══════════════════════════════════════
   Twelve samples per gait cycle with the trailing half of the cycle lower.
   That left/right asymmetry is what makes the engine's sample ring read as
   gait rather than as an equalizer. Deterministic, so server and client
   markup agree. */
function strideHeight(i: number, amplitude: number) {
  const inCycle = i % 12;
  const swing = Math.abs(Math.sin((inCycle / 12) * Math.PI * 2));
  const side = inCycle < 6 ? 1 : 0.62;
  return 2 + swing * amplitude * side;
}

/* ═══ MobilityCare: the biomechanical temporal field ═══════════════════════
   Two joint-angle traces over one stride, normalized 0..1 and periodic in t,
   so the field can be plotted continuously either side of the stride it is
   phase-aligned to. These are gait kinematics, not decoration: the hip runs
   one flexion/extension cycle, the knee shows the small loading-response
   flexion and the large swing-phase peak. */
function hipAngle(t: number) {
  return 0.5 + 0.42 * Math.cos(2 * Math.PI * (t - 0.04));
}

function kneeAngle(t: number) {
  const tw = t - Math.floor(t);
  /* Each bump is repeated at ±1 stride so the curve is continuous across the
     seam when the field is plotted beyond a single cycle. */
  const bump = (c: number, w: number) =>
    [-1, 0, 1].reduce(
      (sum, k) => sum + Math.exp(-(((tw - c - k) / w) ** 2)),
      0,
    );
  return 0.06 + 0.24 * bump(0.14, 0.09) + 0.9 * bump(0.73, 0.12);
}

/* ═══ SecureVision: the people the trajectories belong to ═════════════════
   Anonymous pedestrian forms, in the same pose-graph language as the
   MobilityCare walkers but seen three-quarter-on rather than in profile —
   MobilityCare studies one person's gait side-on; SecureVision watches several
   people cross a space. Each figure is a stick pose with joints: no face, no
   silhouette fill, no bounding box, nothing that identifies anybody.

   Local frame: feet on y = 0, hip at y = -19, neck at y = -40, head above
   that, so a figure can be dropped onto a ground position and stand on it.
   The five poses are authored rather than generated so each reads as a
   distinct stance — stride width, arm swing and torso lean all differ, which
   is what stops five figures reading as one figure stamped five times. */
const PED_HIP: Pt = [0, -19];

type PedPose = {
  id: string;
  /** Torso lean at the neck, in local x. */
  lean: number;
  /** shoulder → elbow → wrist */
  armA: readonly [Pt, Pt, Pt];
  armB: readonly [Pt, Pt, Pt];
  /** hip → knee → ankle */
  legA: readonly [Pt, Pt, Pt];
  legB: readonly [Pt, Pt, Pt];
};

const PED_POSES: readonly PedPose[] = [
  {
    id: "stride",
    lean: 0.6,
    armA: [[-5, -38], [-7, -30], [-7.5, -22]],
    armB: [[5.5, -38], [7.5, -31], [10, -25]],
    legA: [[0, -19], [-5, -10], [-9, 0]],
    legB: [[0, -19], [5.5, -10], [9.5, -1]],
  },
  {
    id: "swing",
    lean: -0.3,
    armA: [[-4.5, -38], [-5.5, -30], [-6, -21]],
    armB: [[4.5, -38], [5.5, -30], [6, -21]],
    legA: [[0, -19], [-3, -10], [-4, 0]],
    legB: [[0, -19], [3, -11], [4.5, -2.5]],
  },
  {
    id: "wide",
    lean: 1,
    armA: [[-6, -38], [-8.5, -31], [-11, -24]],
    armB: [[6, -38], [8.5, -32], [11, -26]],
    legA: [[0, -19], [-6.5, -11], [-12, 0]],
    legB: [[0, -19], [6, -10], [11, 0]],
  },
  {
    id: "turn",
    lean: -1,
    armA: [[-5, -38], [-7, -32], [-5.5, -24]],
    armB: [[5, -38], [7, -31], [9.5, -24]],
    legA: [[0, -19], [-4, -10], [-6, 0]],
    legB: [[0, -19], [4, -11], [6.5, -3]],
  },
  {
    id: "slow",
    lean: 0.4,
    armA: [[-5, -38], [-6.5, -30], [-8, -21]],
    armB: [[5, -38], [6.5, -32], [9, -27]],
    legA: [[0, -19], [-4.5, -10], [-7, 0]],
    legB: [[0, -19], [3.5, -10], [5.5, 0]],
  },
];

/** Which route each figure stands on, where along it, and how big.
    Route -1 is the flagged departure, so one figure is standing on the route
    that gets flagged — the amber trail runs out from under their feet.
    Scale doubles as the depth cue: figures further up the field are further
    away and smaller, and the stroke weight follows. */
const PED_PLACEMENT: readonly {
  route: number;
  f: number;
  s: number;
  pose: number;
  w: number;
  flip: boolean;
  /** Dropped from the stacked composition, which has less room. */
  wideOnly?: boolean;
}[] = [
  { route: 0, f: 0.3, s: 0.6, pose: 2, w: 1.1, flip: false },
  { route: 0, f: 0.74, s: 0.58, pose: 3, w: 1.1, flip: true },
  { route: 1, f: 0.4, s: 0.76, pose: 4, w: 1.3, flip: false, wideOnly: true },
  { route: 2, f: 0.16, s: 0.94, pose: 0, w: 1.5, flip: false },
  { route: -1, f: 0.45, s: 0.88, pose: 1, w: 1.5, flip: true },
];

/* ═══ SecureVision: the spatial movement field ═════════════════════════════
   The plan view the pedestrians walk on: surveyed ground, density contours
   where flow concentrates, a restricted-area polygon, tracked routes that
   follow the expected flow, and one route that deviates into the zone. The
   contrast with MobilityCare is the reading, not the subject — both sides are
   people; this one measures where they go rather than how they walk.

   Routes are declared as points in a normalized (u, v) field where u and v run
   -1..1 across the world. Declaring them as points rather than as hand-written
   Bézier strings is what lets the intersections below be *computed* from the
   real geometry instead of eyeballed, and lets the per-route temporal samples
   be placed by arc length, so both stay correct at either composition size. */
type UV = readonly [number, number];

/** Routes following the expected flow. Individually varied — four identical
    bows is what made an earlier version read as an audio waveform. Endpoint
    v values are kept inside the world disc so their event nodes survive the
    clip at both sizes. */
const SECURE_TRACKS: readonly (readonly UV[])[] = [
  [[-1, -0.5], [-0.5, -0.7], [0.05, -0.5], [0.58, -0.6], [1, -0.66]],
  [[-1, -0.05], [-0.46, 0.11], [0.1, -0.03], [0.6, 0.13], [1, 0.05]],
  [[-1, 0.52], [-0.44, 0.47], [0.12, 0.6], [0.62, 0.49], [1, 0.56]],
];

/** A cross-flow route, so the field has genuine crossings to mark. */
const SECURE_CROSS: readonly UV[] = [
  [-0.72, -0.9],
  [-0.3, -0.34],
  [0.08, 0.22],
  [0.46, 0.78],
];

/** The anomaly: enters on the expected flow, then veers into the zone. */
const SECURE_ANOMALY: readonly UV[] = [
  [-1, 0.2],
  [-0.54, 0.34],
  [-0.1, 0.24],
  [0.18, 0.5],
  [0.44, 0.74],
];

/** Where that route was expected to continue — drawn as a faint ghost so the
    deviation is legible as a deviation, not just as another line. */
const SECURE_EXPECTED: readonly UV[] = [
  [-0.1, 0.24],
  [0.32, 0.34],
  [0.7, 0.24],
  [0.99, 0.32],
];

/** Restricted-area perimeter. */
const SECURE_ZONE: readonly UV[] = [
  [0.1, 0.42],
  [0.78, 0.28],
  [0.88, 0.8],
  [0.16, 0.88],
];

/** Sparse flow vectors: sample positions in the expected flow field. */
const SECURE_VECTORS: readonly UV[] = [
  [-0.66, -0.3],
  [-0.16, -0.78],
  [0.3, -0.26],
  [-0.62, 0.26],
  [0.72, -0.02],
  [-0.2, 0.72],
];

/** Catmull-Rom through the points, emitted as a smooth cubic path. */
function smoothPath(pts: readonly Pt[]) {
  if (pts.length < 2) return "";
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d +=
      ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)}` +
      ` ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)}` +
      ` ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** The same Catmull-Rom curve, flattened to a dense polyline. Uses the exact
    control points `smoothPath` emits, so samples placed with `alongPoly` sit
    on the drawn curve rather than on its chords. */
function flatten(pts: readonly Pt[], per = 14): Pt[] {
  if (pts.length < 2) return [...pts];
  const out: Pt[] = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (let j = 1; j <= per; j++) {
      const t = j / per;
      const u = 1 - t;
      out.push([
        u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0],
        u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1],
      ]);
    }
  }
  return out;
}

/** A polyline as a path. Used on `flatten`ed curves, where the segments are
    dense enough to be indistinguishable from the cubic they came from — which
    is what lets one route be split mid-curve without the two halves parting
    company at the join. */
function polyD(pts: readonly Pt[]) {
  const f = (n: number) => n.toFixed(1);
  return pts.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join(" ");
}

/** Point at fraction `f` of a polyline's length, with the local heading in
    degrees. Used to place temporal samples and direction chevrons on routes. */
function alongPoly(pts: readonly Pt[], f: number): { p: Pt; a: number } {
  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    seg.push(d);
    total += d;
  }
  let want = Math.min(Math.max(f, 0), 1) * total;
  for (let i = 0; i < seg.length; i++) {
    if (want <= seg[i] || i === seg.length - 1) {
      const t = seg[i] === 0 ? 0 : Math.min(want / seg[i], 1);
      const dx = pts[i + 1][0] - pts[i][0];
      const dy = pts[i + 1][1] - pts[i][1];
      return {
        p: [pts[i][0] + dx * t, pts[i][1] + dy * t],
        a: (Math.atan2(dy, dx) * 180) / Math.PI,
      };
    }
    want -= seg[i];
  }
  return { p: pts[0], a: 0 };
}

/** Where segments ab and cd cross, or null. */
function segHit(a: Pt, b: Pt, c: Pt, d: Pt): Pt | null {
  const rx = b[0] - a[0];
  const ry = b[1] - a[1];
  const sx = d[0] - c[0];
  const sy = d[1] - c[1];
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / den;
  const u = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return [a[0] + t * rx, a[1] + t * ry];
}

/** Every crossing between two polylines. */
function polyHits(p: readonly Pt[], q: readonly Pt[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < p.length - 1; i++) {
    for (let j = 0; j < q.length - 1; j++) {
      const h = segHit(p[i], p[i + 1], q[j], q[j + 1]);
      if (h) out.push(h);
    }
  }
  return out;
}

/** A closed density isoline. The radius is perturbed deterministically so it
    reads as a contour rather than as a target ring or a radar sweep. */
function contour(cx: number, cy: number, rx: number, ry: number) {
  const pts: Pt[] = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const k = 1 + 0.17 * Math.sin(3 * a + 0.7) + 0.09 * Math.cos(2 * a - 0.3);
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  });
  return `${smoothPath([...pts, pts[0], pts[1]])} Z`;
}

/** A circular arc, used for the engine's ingest and emit responses. */
function arcPath(cx: number, cy: number, rr: number, a0: number, a1: number) {
  const f = (n: number) => n.toFixed(1);
  const x0 = cx + Math.cos(a0) * rr;
  const y0 = cy + Math.sin(a0) * rr;
  const x1 = cx + Math.cos(a1) * rr;
  const y1 = cy + Math.sin(a1) * rr;
  return `M${f(x0)} ${f(y0)} A${rr} ${rr} 0 0 ${a1 > a0 ? 1 : 0} ${f(x1)} ${f(y1)}`;
}

/** A walking pose, drawn from the shared canonical gait events. */
function Walker({
  phase,
  x,
  baseY,
  s,
  order,
}: {
  phase: GaitPhase;
  x: number;
  baseY: number;
  s: number;
  order: number;
}) {
  const pts = (p: readonly Pt[]) =>
    p.map(([px, py]) => `${px * s},${py * s}`).join(" ");
  const originY = baseY + phase.lift * s;

  return (
    <g
      className={styles.walker}
      transform={`translate(${x} ${originY})`}
      style={{ "--eng-i": order } as CSSProperties}
    >
      <polyline className={styles.boneFar} points={pts(phase.farArm)} />
      <polyline className={styles.boneFar} points={pts(phase.farLeg)} />
      <path
        className={styles.bone}
        d={`M0 0 C${0.4 * s} ${-12 * s} ${0.9 * s} ${-24 * s} ${1.5 * s} ${-34 * s}`}
      />
      <circle
        className={styles.head}
        cx={GAIT_HEAD[0] * s}
        cy={GAIT_HEAD[1] * s}
        r={4.2 * s}
      />
      <polyline className={styles.bone} points={pts(phase.nearArm)} />
      <polyline className={styles.bone} points={pts(phase.nearLeg)} />
      <line
        className={styles.bone}
        x1={phase.nearFoot[0][0] * s}
        y1={phase.nearFoot[0][1] * s}
        x2={phase.nearFoot[1][0] * s}
        y2={phase.nearFoot[1][1] * s}
      />
      {[...phase.nearArm, ...phase.nearLeg, GAIT_NECK].map(([jx, jy], j) => (
        <circle
          key={j}
          className={styles.joint}
          cx={jx * s}
          cy={jy * s}
          r={1.9 * s}
        />
      ))}
    </g>
  );
}

/** One anonymous pedestrian, standing on the ground point it is given.
    The strokes are drawn twice — a wide, very faint copy under the real one —
    which is the whole of the "glow": a filter would be the only filter in the
    composition, and a fill would make a silhouette. */
function Pedestrian({
  pose,
  at,
  s,
  w,
  flip,
}: {
  pose: PedPose;
  at: Pt;
  s: number;
  w: number;
  flip: boolean;
}) {
  const pts = (p: readonly Pt[]) => p.map(([x, y]) => `${x},${y}`).join(" ");
  const neck: Pt = [pose.lean, -40];
  const limbs = [pose.armA, pose.armB, pose.legA, pose.legB];
  const joints: Pt[] = [
    PED_HIP,
    pose.armA[1],
    pose.armB[1],
    pose.legA[1],
    pose.legB[1],
  ];

  const strokes = (
    <>
      {limbs.map((limb, i) => (
        <polyline key={i} points={pts(limb)} />
      ))}
      <line
        x1={pose.armA[0][0]}
        y1={pose.armA[0][1]}
        x2={pose.armB[0][0]}
        y2={pose.armB[0][1]}
      />
      <line x1={PED_HIP[0]} y1={PED_HIP[1]} x2={neck[0]} y2={neck[1]} />
    </>
  );

  return (
    <g
      className={styles.ped}
      transform={`translate(${at[0].toFixed(1)} ${at[1].toFixed(1)}) scale(${(flip ? -s : s).toFixed(3)} ${s.toFixed(3)})`}
      style={{ "--ped-w": w } as CSSProperties}
    >
      {/* Ground contact — grounds the figure in the plan view the way the
          dashed line grounds the MobilityCare walkers. */}
      <ellipse className={styles.pedContact} cx={0} cy={0} rx={6} ry={1.6} />
      <g className={styles.pedHalo}>{strokes}</g>
      <g className={styles.pedBody}>{strokes}</g>
      <circle
        className={styles.pedHead}
        cx={pose.lean * 1.15}
        cy={-45.5}
        r={4.3}
      />
      {joints.map(([jx, jy], i) => (
        <circle key={i} className={styles.pedJoint} cx={jx} cy={jy} r={1.5} />
      ))}
    </g>
  );
}

export function MovementEngineCore({
  variant = "wide",
  focus = null,
  onFocus,
  className,
}: {
  variant?: Variant;
  focus?: EngineFocus;
  onFocus?: (focus: EngineFocus) => void;
  className?: string;
}) {
  const geo = variant === "stacked" ? STACKED : WIDE;
  const k = geo.key;
  const [cx, cy] = geo.c;
  const { r } = geo;

  const careCentre = geo.world;
  const secureCentre: Pt = geo.stacked
    ? [geo.world[0], 2 * cy - geo.world[1]]
    : [2 * cx - geo.world[0], geo.world[1]];

  /* ══ MobilityCare ═════════════════════════════════════════════════════ */

  /* Four canonical events across the stride, evenly spaced along x so the
     sequence reads as a strip. Their gait phase, however, is *not* evenly
     spaced in time, so the joint-angle field below is plotted against a
     piecewise mapping from x back to stride fraction — which is what keeps
     every pose sitting on its own phase of the curve. */
  const walkerX0 =
    careCentre[0] - ((geo.walkerIdx.length - 1) * geo.walkerSpacing) / 2;
  const events = geo.walkerIdx.map((idx, i) => ({
    idx,
    x: walkerX0 + i * geo.walkerSpacing,
    t: idx / GAIT_PHASES.length,
    phase: GAIT_PHASES[idx],
  }));
  const groundY = geo.walkerBaseY + 48 * geo.walkerScale;

  /** Stride fraction at a given x, extrapolating past the end events. */
  const xToT = (x: number) => {
    let i = 0;
    while (i < events.length - 2 && x > events[i + 1].x) i++;
    const a = events[i];
    const b = events[i + 1];
    return a.t + ((x - a.x) * (b.t - a.t)) / (b.x - a.x);
  };

  /* Two stacked channels, each with its own baseline — the way a gait report
     plots them. Overlaying both on one baseline made two joint kinematics read
     as a single decorative wave. */
  const phaseAmp = geo.phaseBase - geo.phaseTop;
  const HIP = { base: geo.phaseTop + phaseAmp * 0.45, h: phaseAmp * 0.42 };
  const KNEE = { base: geo.phaseBase, h: phaseAmp * 0.45 };
  const phaseCurve = (
    fn: (t: number) => number,
    ch: { base: number; h: number },
  ) =>
    smoothPath(
      Array.from({ length: 33 }, (_, i) => {
        const x = careCentre[0] - geo.phaseX + (i * geo.phaseX * 2) / 32;
        return [x, ch.base - fn(xToT(x)) * ch.h] as Pt;
      }),
    );

  /* ══ SecureVision ═════════════════════════════════════════════════════
     Normalized field coords -> absolute. The field is wider than it is tall
     so the flow reads as directional, and covers a little under 60% of the
     disc area — dense enough to match the MobilityCare side, open enough to
     stay elegant. Everything is clipped to the world circle. */
  const fw = geo.worldR * geo.fieldU;
  const fh = geo.worldR * geo.fieldV;
  const F = ([u, v]: UV): Pt => [
    secureCentre[0] + u * fw,
    secureCentre[1] + v * fh,
  ];

  const tracks = SECURE_TRACKS.map((t) => t.map(F));
  const crossRoute = SECURE_CROSS.map(F);
  const anomaly = SECURE_ANOMALY.map(F);
  const expected = SECURE_EXPECTED.map(F);
  const zone = SECURE_ZONE.map(F);

  /* Real crossings, computed from the polylines above. */
  const junctions = [
    ...tracks.flatMap((t) => polyHits(t, crossRoute)),
    ...polyHits(anomaly, crossRoute),
  ];

  /* Per-route temporal samples and a direction chevron, placed by arc length
     on the flattened curve. This is the SecureVision dialect of the same
     Motion DNA language the other two worlds speak: samples over time, here
     taken along a trajectory instead of against a clock or a radius. */
  const trackFlat = tracks.map((t) => flatten(t));
  const trackDetail = trackFlat.map((flat) => ({
    samples: [0.16, 0.32, 0.48, 0.64, 0.8].map((f) => alongPoly(flat, f).p),
    chevron: alongPoly(flat, 0.56),
  }));

  /* The deviating route is only anomalous *after* it deviates. Drawing the
     whole thing amber made it the loudest object in the composition and said
     the route was flagged from the moment it entered; it is normal until the
     deviation point, so the approach is drawn as an ordinary tracked route and
     only the departure carries the accent. The split is taken on the flattened
     curve so the two halves meet exactly. */
  const FLAT_PER = 14;
  const anomalyFlat = flatten(anomaly, FLAT_PER);
  const splitAt = 2 * FLAT_PER;
  const anomalyApproach = anomalyFlat.slice(0, splitAt + 1);
  const anomalyDeviation = anomalyFlat.slice(splitAt);
  const anomalyDetail = {
    samples: [0.2, 0.4, 0.6].map(
      (f) => alongPoly(anomalyApproach, f).p,
    ),
    chevron: alongPoly(anomalyApproach, 0.55),
  };

  /* The people the routes belong to. Each figure's feet are solved onto the
     route it is walking, so the association between a person and their
     trajectory is geometric rather than eyeballed, and stays right at both
     composition sizes. One of them stands on the route that gets flagged. */
  const pedestrians = PED_PLACEMENT.filter(
    (q) => !(q.wideOnly && geo.stacked),
  ).map((q) => ({
    ...q,
    at: alongPoly(q.route < 0 ? anomalyDeviation : trackFlat[q.route], q.f).p,
    scale: q.s * geo.pedScale,
  }));

  /* The deviation point is where the ghost continuation begins. */
  const deviation = expected[0];
  const flagged = anomaly[anomaly.length - 1];

  /* ══ Channels: care → engine → secure ════════════════════════════════
     The channels are not parallel rails. They leave the world spread wide
     across its surface, converge as they enter the engine, and fan out again
     on the way to the other world — so the geometry itself says gather →
     transform → distribute rather than "circle wired to circle". Every
     endpoint is solved onto the actual circle it touches, so nothing starts in
     mid-air or overruns a disc. */
  const channel = (
    from: Pt,
    fromR: number,
    to: Pt,
    toR: number,
    spread: number,
    gather: number,
  ) =>
    [-0.42, 0, 0.42].map((t) => {
      const f = (n: number) => n.toFixed(1);
      const o1 = t * spread;
      const o2 = t * gather;
      /* Along the composition axis, offset across it. */
      const d1 = Math.sqrt(Math.max(fromR * fromR - o1 * o1, 1));
      const d2 = Math.sqrt(Math.max(toR * toR - o2 * o2, 1));
      if (geo.stacked) {
        const [ax, ay] = [from[0] + o1, from[1] + d1];
        const [bx, by] = [to[0] + o2, to[1] - d2];
        const m = (by - ay) * 0.45;
        return `M${f(ax)} ${f(ay)} C${f(ax)} ${f(ay + m)} ${f(bx)} ${f(by - m)} ${f(bx)} ${f(by)}`;
      }
      const [ax, ay] = [from[0] + d1, from[1] + o1];
      const [bx, by] = [to[0] - d2, to[1] + o2];
      const m = (bx - ax) * 0.45;
      return `M${f(ax)} ${f(ay)} C${f(ax + m)} ${f(ay)} ${f(bx - m)} ${f(by)} ${f(bx)} ${f(by)}`;
    });

  const inflow = channel(
    careCentre,
    geo.worldR,
    geo.c,
    r,
    geo.fanWorld,
    geo.fanEngine,
  );

  /* Mirrored: the output leaves the engine gathered and arrives spread. */
  const outflow = channel(
    geo.c,
    r,
    secureCentre,
    geo.worldR,
    geo.fanEngine,
    geo.fanWorld,
  );

  /* One restrained fork on the output side: intelligence fanning out into
     capabilities. Two short stubs, not a tree. */
  const branches: { d: string; end: Pt }[] = (() => {
    if (geo.stacked) {
      const my = (cy + r + (secureCentre[1] - geo.worldR)) / 2 + 6;
      return [1, -1].map((s) => {
        const end: Pt = [cx + s * 30, my + 38];
        return {
          d: `M${cx} ${my} C${cx} ${my + 22} ${cx + s * 20} ${my + 24} ${end[0]} ${end[1]}`,
          end,
        };
      });
    }
    const mx = (cx + r + (secureCentre[0] - geo.worldR)) / 2;
    return [-1, 1].map((s) => {
      const end: Pt = [mx + 38, cy + s * 30];
      return {
        d: `M${mx} ${cy} C${mx + 22} ${cy} ${mx + 24} ${cy + s * 20} ${end[0]} ${end[1]}`,
        end,
      };
    });
  })();

  /* ══ Engine ══════════════════════════════════════════════════════════ */
  /* Ingest faces the inbound world, emit faces the outbound one. */
  const ingestMid = geo.stacked ? -Math.PI / 2 : Math.PI;
  const emitMid = geo.stacked ? Math.PI / 2 : 0;
  const ingestArc = arcPath(cx, cy, r + 70, ingestMid - 0.62, ingestMid + 0.62);
  const emitArc = arcPath(cx, cy, r + 70, emitMid - 0.62, emitMid + 0.62);

  /* ══ Labels ══════════════════════════════════════════════════════════
     The label belongs to its world rather than floating over the diagram: a
     short accent rule above it in the world's own colour, and a hairline stem
     into an anchor node on the world ring. */
  const worldLabel = (
    centre: Pt,
    title: string,
    a: string,
    b: string,
    below: boolean,
  ) => {
    const [wx, wy] = centre;
    const edge = below ? wy + geo.worldR : wy - geo.worldR;
    const ruleY = below ? edge + 19 : edge - 82;
    const titleY = below ? edge + 45 : edge - 60;
    const subY = below ? [edge + 65, edge + 82] : [edge - 40, edge - 23];
    const stemY = below ? edge + 11 : edge - 11;
    return (
      <g className={styles.labelGroup}>
        <line
          className={styles.labelRule}
          x1={wx - 13}
          y1={ruleY}
          x2={wx + 13}
          y2={ruleY}
        />
        <text
          className={styles.worldLabel}
          x={wx}
          y={titleY}
          style={{ fontSize: geo.worldLabelSize } as CSSProperties}
        >
          {title}
        </text>
        <text className={styles.worldSub} x={wx} y={subY[0]}>
          {a}
        </text>
        <text className={styles.worldSub} x={wx} y={subY[1]}>
          {b}
        </text>
        <line
          className={styles.labelStem}
          x1={wx}
          y1={stemY}
          x2={wx}
          y2={edge}
        />
        <circle className={styles.labelAnchor} cx={wx} cy={edge} r={2.6} />
      </g>
    );
  };

  return (
    <svg
      role="img"
      aria-label="How the GaitAI ecosystem turns human movement into intelligence. On the left, MobilityCare: a stride's joint-angle field, four walking poses from heel strike to swing, and a time axis of gait events. In the centre, the GaitAI Movement Intelligence Engine, shown as a sampling ring that illuminates as the signal arrives. On the right, SecureVision: a plan view of a public space with anonymous pedestrian figures walking through it, each standing on its own tracked route, over density contours and a restricted zone, with one route deviating into that zone and flagged."
      viewBox={`0 0 ${geo.w} ${geo.h}`}
      data-focus={focus ?? "none"}
      className={`${styles.engine} ${
        geo.stacked ? styles.stackedOnly : styles.wideOnly
      } ${className ?? ""}`}
    >
      <defs>
        <radialGradient id={`eng-core-${k}`}>
          <stop offset="0" stopColor="#BFE9FF" stopOpacity="0.4" />
          <stop offset="0.45" stopColor="#4FD1FF" stopOpacity="0.14" />
          <stop offset="1" stopColor="#2563FF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`eng-care-${k}`}>
          <stop offset="0.35" stopColor="#4FD1FF" stopOpacity="0.055" />
          <stop offset="1" stopColor="#4FD1FF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`eng-secure-${k}`}>
          <stop offset="0.35" stopColor="#8B5CF6" stopOpacity="0.065" />
          <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
        </radialGradient>

        {/* The signal's own colour transformation. Stop colours come from CSS
            so the light theme can darken them without a second gradient set. */}
        <linearGradient
          id={`eng-in-${k}`}
          gradientUnits="userSpaceOnUse"
          x1={geo.stacked ? cx : careCentre[0] + geo.worldR}
          y1={geo.stacked ? careCentre[1] + geo.worldR : cy}
          x2={geo.stacked ? cx : cx - r}
          y2={geo.stacked ? cy - r : cy}
        >
          <stop offset="0" className={styles.stopCare} />
          <stop offset="1" className={styles.stopEngine} />
        </linearGradient>
        <linearGradient
          id={`eng-out-${k}`}
          gradientUnits="userSpaceOnUse"
          x1={geo.stacked ? cx : cx + r}
          y1={geo.stacked ? cy + r : cy}
          x2={geo.stacked ? cx : secureCentre[0] - geo.worldR}
          y2={geo.stacked ? secureCentre[1] - geo.worldR : cy}
        >
          <stop offset="0" className={styles.stopEngine} />
          <stop offset="1" className={styles.stopSecure} />
        </linearGradient>

        {/* The movement field is bounded by the world disc, so a route can
            never escape it at either composition size. */}
        <clipPath id={`eng-secure-clip-${k}`}>
          <circle
            cx={secureCentre[0]}
            cy={secureCentre[1]}
            r={geo.worldR - 1}
          />
        </clipPath>
        <clipPath id={`eng-care-clip-${k}`}>
          <circle cx={careCentre[0]} cy={careCentre[1]} r={geo.worldR - 1} />
        </clipPath>
      </defs>

      {/* ═══ MOBILITYCARE WORLD ═══ */}
      <g
        className={`${styles.world} ${styles.care}`}
        onMouseEnter={onFocus ? () => onFocus("care") : undefined}
        onMouseLeave={onFocus ? () => onFocus(null) : undefined}
      >
        <circle
          cx={careCentre[0]}
          cy={careCentre[1]}
          r={geo.worldR}
          fill={`url(#eng-care-${k})`}
        />
        <circle
          className={styles.worldRing}
          cx={careCentre[0]}
          cy={careCentre[1]}
          r={geo.worldR}
        />

        <g clipPath={`url(#eng-care-clip-${k})`}>
          {/* ── Band 1: the stride's joint-angle field ── */}
          <g>
            {/* Angle axis at the start of the stride, with a scale tick per
                channel extreme. Without it the channels read as decoration
                rather than as measurement. */}
            <line
              className={styles.phaseAxis}
              x1={careCentre[0] - geo.phaseX}
              y1={geo.phaseTop}
              x2={careCentre[0] - geo.phaseX}
              y2={geo.phaseBase}
            />
            {[HIP.base - HIP.h, HIP.base, KNEE.base - KNEE.h, KNEE.base].map(
              (y, i) => (
                <line
                  key={`pa${i}`}
                  className={styles.phaseAxis}
                  x1={careCentre[0] - geo.phaseX}
                  y1={y}
                  x2={careCentre[0] - geo.phaseX + 4}
                  y2={y}
                />
              ),
            )}
            {[HIP.base, KNEE.base].map((y, i) => (
              <line
                key={`pb${i}`}
                className={styles.phaseBaseline}
                x1={careCentre[0] - geo.phaseX}
                y1={y}
                x2={careCentre[0] + geo.phaseX}
                y2={y}
              />
            ))}
            {events.map((e) => (
              <line
                key={`ps${e.idx}`}
                className={styles.phaseSep}
                x1={e.x}
                y1={geo.phaseTop - 2}
                x2={e.x}
                y2={geo.phaseBase + 8}
              />
            ))}
            <path className={styles.phaseKnee} d={phaseCurve(kneeAngle, KNEE)} />
            <path className={styles.phaseHip} d={phaseCurve(hipAngle, HIP)} />
            <path
              className={styles.phaseHipFlow}
              d={phaseCurve(hipAngle, HIP)}
              pathLength={100}
            />
            {events.map((e) => (
              <g key={`pn${e.idx}`}>
                <circle
                  className={styles.phaseNode}
                  cx={e.x}
                  cy={HIP.base - hipAngle(e.t) * HIP.h}
                  r={1.8}
                />
                <circle
                  className={styles.phaseNodeKnee}
                  cx={e.x}
                  cy={KNEE.base - kneeAngle(e.t) * KNEE.h}
                  r={1.6}
                />
              </g>
            ))}
          </g>

          {/* ── Band 2: the walking sequence ── */}
          <line
            className={styles.ground}
            x1={careCentre[0] - geo.worldR * 0.8}
            y1={groundY}
            x2={careCentre[0] + geo.worldR * 0.8}
            y2={groundY}
          />
          {events.map((e, i) => (
            <Walker
              key={e.phase.id}
              phase={e.phase}
              x={e.x}
              baseY={geo.walkerBaseY}
              s={geo.walkerScale}
              order={i}
            />
          ))}

          {/* ── Band 3: the gait-event time axis ──
              Deliberately not a bar meter. The sample ticks are near-flat and
              only lightly varied; what carries the band is the gait events,
              the stems tying each event to the pose above it, and the cadence
              intervals between them. Time and movement, not audio. */}
          <g>
            <line
              className={styles.axisLine}
              x1={careCentre[0] - geo.axisX}
              y1={geo.axisY}
              x2={careCentre[0] + geo.axisX}
              y2={geo.axisY}
            />
            {Array.from({ length: 29 }, (_, i) => {
              const x =
                careCentre[0] - geo.axisX + (i * geo.axisX * 2) / 28;
              /* Slight deterministic variation: a perfect comb reads as a
                 ruler, and a tall one reads as an equalizer. */
              const h = 2.4 + 1.6 * Math.abs(Math.sin(i * 1.7));
              return (
                <line
                  key={`st${i}`}
                  className={styles.axisSample}
                  x1={x}
                  y1={geo.axisY}
                  x2={x}
                  y2={geo.axisY - h}
                />
              );
            })}
            {events.map((e, i) => (
              <g key={`ev${e.idx}`} style={{ "--eng-i": i } as CSSProperties}>
                <line
                  className={styles.eventStem}
                  x1={e.x}
                  y1={geo.axisY - 12}
                  x2={e.x}
                  y2={groundY + 7}
                />
                <line
                  className={styles.eventTick}
                  x1={e.x}
                  y1={geo.axisY + 3}
                  x2={e.x}
                  y2={geo.axisY - 12}
                />
                <circle
                  className={i === 0 ? styles.eventStrike : styles.eventNode}
                  cx={e.x}
                  cy={geo.axisY}
                  r={i === 0 ? 3 : 2.2}
                />
              </g>
            ))}
            {events.slice(0, -1).map((e, i) => {
              const nx = events[i + 1].x;
              return (
                <g key={`iv${i}`} className={styles.interval}>
                  <line x1={e.x + 4} y1={geo.cadenceY} x2={nx - 4} y2={geo.cadenceY} />
                  <line x1={e.x + 4} y1={geo.cadenceY - 3} x2={e.x + 4} y2={geo.cadenceY + 3} />
                  <line x1={nx - 4} y1={geo.cadenceY - 3} x2={nx - 4} y2={geo.cadenceY + 3} />
                </g>
              );
            })}
          </g>
        </g>

        {worldLabel(
          careCentre,
          "MobilityCare",
          "Movement intelligence",
          "for mobility & health",
          false,
        )}
      </g>

      {/* ═══ SECUREVISION WORLD ═══ */}
      <g
        className={`${styles.world} ${styles.secure}`}
        onMouseEnter={onFocus ? () => onFocus("secure") : undefined}
        onMouseLeave={onFocus ? () => onFocus(null) : undefined}
      >
        <circle
          cx={secureCentre[0]}
          cy={secureCentre[1]}
          r={geo.worldR}
          fill={`url(#eng-secure-${k})`}
        />
        <circle
          className={styles.worldRing}
          cx={secureCentre[0]}
          cy={secureCentre[1]}
          r={geo.worldR}
        />

        {/* Everything in the field is clipped to the world disc. */}
        <g clipPath={`url(#eng-secure-clip-${k})`}>
          {/* Surveyed ground — a faint plan grid, not a decorative pattern. */}
          <g className={styles.secGrid}>
            {[-0.66, -0.33, 0, 0.33, 0.66].map((u) => (
              <line
                key={`v${u}`}
                x1={F([u, -1.35])[0]}
                y1={F([u, -1.35])[1]}
                x2={F([u, 1.35])[0]}
                y2={F([u, 1.35])[1]}
              />
            ))}
            {[-0.75, -0.4, 0, 0.4, 0.75].map((v) => (
              <line
                key={`h${v}`}
                x1={F([-1.25, v])[0]}
                y1={F([-1.25, v])[1]}
                x2={F([1.25, v])[0]}
                y2={F([1.25, v])[1]}
              />
            ))}
          </g>

          {/* Density contours where the flow concentrates. */}
          <g className={styles.secDensity}>
            {[1, 0.66, 0.36].map((s, i) => {
              const [dx, dy] = F([-0.44, -0.22]);
              return (
                <path
                  key={i}
                  className={styles.secContour}
                  d={contour(dx, dy, fw * 0.3 * s, fh * 0.34 * s)}
                />
              );
            })}
          </g>

          {/* Restricted-area perimeter, with survey marks at its vertices. */}
          <polygon
            className={styles.secZone}
            points={zone.map(([x, y]) => `${x},${y}`).join(" ")}
          />
          {zone.map(([x, y], i) => (
            <g key={`zm${i}`} className={styles.secZoneMark}>
              <line x1={x - 3.5} y1={y} x2={x + 3.5} y2={y} />
              <line x1={x} y1={y - 3.5} x2={x} y2={y + 3.5} />
            </g>
          ))}

          {/* Flow vectors — direction of the expected field. */}
          <g className={styles.secVectors}>
            {SECURE_VECTORS.map((p, i) => {
              const [x, y] = F(p);
              const ang = -7 + p[1] * 15;
              return (
                <g key={i} transform={`rotate(${ang.toFixed(1)} ${x} ${y})`}>
                  <line x1={x - 5} y1={y} x2={x + 5} y2={y} />
                  <polyline
                    points={`${x + 1.6},${y - 2.6} ${x + 5},${y} ${x + 1.6},${y + 2.6}`}
                  />
                </g>
              );
            })}
          </g>

          {/* Tracked routes following the expected flow, each carrying its own
              temporal samples and a heading chevron. */}
          {tracks.map((t, i) => {
            const d = smoothPath(t);
            const detail = trackDetail[i];
            return (
              <g key={`t${i}`} style={{ "--eng-i": i } as CSSProperties}>
                <path className={styles.secTrack} d={d} />
                <path className={styles.secTrackFlow} d={d} pathLength={100} />
                {detail.samples.map(([sx, sy], j) => (
                  <circle
                    key={j}
                    className={styles.secSample}
                    cx={sx}
                    cy={sy}
                    r={1.15}
                  />
                ))}
                <polyline
                  className={styles.secChevron}
                  transform={`rotate(${detail.chevron.a.toFixed(1)} ${detail.chevron.p[0].toFixed(1)} ${detail.chevron.p[1].toFixed(1)})`}
                  points={`${(detail.chevron.p[0] - 2.6).toFixed(1)},${(detail.chevron.p[1] - 2.6).toFixed(1)} ${(detail.chevron.p[0] + 1.4).toFixed(1)},${detail.chevron.p[1].toFixed(1)} ${(detail.chevron.p[0] - 2.6).toFixed(1)},${(detail.chevron.p[1] + 2.6).toFixed(1)}`}
                />
              </g>
            );
          })}

          {/* Cross-flow route. */}
          <path className={styles.secCross} d={smoothPath(crossRoute)} />

          {/* Route intersections, at the computed crossings. */}
          {junctions.map(([x, y], i) => (
            <circle
              key={`j${i}`}
              className={styles.secJunction}
              cx={x}
              cy={y}
              r={3.4}
            />
          ))}

          {/* Anonymous event nodes at every route entry and exit. */}
          {tracks.map((t, i) => (
            <g key={`n${i}`}>
              <circle
                className={styles.secNode}
                cx={t[0][0]}
                cy={t[0][1]}
                r={2.4}
              />
              <circle
                className={styles.secNode}
                cx={t[t.length - 1][0]}
                cy={t[t.length - 1][1]}
                r={2.4}
              />
            </g>
          ))}

          {/* The people. Drawn over the field so they are the first thing
              read, and under the flagged route so the accent still lands on
              top of everything. */}
          {pedestrians.map((q, i) => (
            <Pedestrian
              key={`ped${i}`}
              pose={PED_POSES[q.pose]}
              at={q.at}
              s={q.scale}
              w={q.w}
              flip={q.flip}
            />
          ))}

          {/* The deviating route: an ordinary approach, the continuation it
              was expected to follow as a ghost, then the departure itself. */}
          <path className={styles.secTrack} d={polyD(anomalyApproach)} />
          {anomalyDetail.samples.map(([sx, sy], j) => (
            <circle key={`as${j}`} className={styles.secSample} cx={sx} cy={sy} r={1.15} />
          ))}
          <polyline
            className={styles.secChevron}
            transform={`rotate(${anomalyDetail.chevron.a.toFixed(1)} ${anomalyDetail.chevron.p[0].toFixed(1)} ${anomalyDetail.chevron.p[1].toFixed(1)})`}
            points={`${(anomalyDetail.chevron.p[0] - 2.6).toFixed(1)},${(anomalyDetail.chevron.p[1] - 2.6).toFixed(1)} ${(anomalyDetail.chevron.p[0] + 1.4).toFixed(1)},${anomalyDetail.chevron.p[1].toFixed(1)} ${(anomalyDetail.chevron.p[0] - 2.6).toFixed(1)},${(anomalyDetail.chevron.p[1] + 2.6).toFixed(1)}`}
          />
          <path className={styles.secGhost} d={smoothPath(expected)} />
          <path className={styles.secAnomaly} d={polyD(anomalyDeviation)} />
          <path
            className={styles.secAnomalyFlow}
            d={smoothPath(anomaly)}
            pathLength={100}
          />
          <circle
            className={styles.secDeviation}
            cx={deviation[0]}
            cy={deviation[1]}
            r={3.2}
          />
          <circle
            className={styles.secAlertPulse}
            cx={flagged[0]}
            cy={flagged[1]}
            r={5}
          />
          <circle
            className={styles.secAlert}
            cx={flagged[0]}
            cy={flagged[1]}
            r={3}
          />
        </g>

        {worldLabel(
          secureCentre,
          "SecureVision",
          "Movement intelligence",
          "for safety & security",
          geo.stacked,
        )}
      </g>

      {/* ═══ CHANNELS: care → engine → secure ═══
          Gradient-stroked, so the signal changes colour along the travel:
          cyan out of MobilityCare, electric blue at the engine, violet into
          SecureVision. */}
      <g className={styles.chIn}>
        {inflow.map((d, i) => (
          <g key={`in${i}`} style={{ "--eng-i": i } as CSSProperties}>
            <path className={styles.trace} d={d} stroke={`url(#eng-in-${k})`} />
            <path
              className={styles.traceIn}
              d={d}
              pathLength={100}
              stroke={`url(#eng-in-${k})`}
            />
            <path
              className={styles.traceDotIn}
              d={d}
              pathLength={100}
              stroke={`url(#eng-in-${k})`}
            />
          </g>
        ))}
      </g>
      <g className={styles.chOut}>
        {outflow.map((d, i) => (
          <g key={`out${i}`} style={{ "--eng-i": i } as CSSProperties}>
            <path className={styles.trace} d={d} stroke={`url(#eng-out-${k})`} />
            <path
              className={styles.traceOut}
              d={d}
              pathLength={100}
              stroke={`url(#eng-out-${k})`}
            />
            <path
              className={styles.traceDotOut}
              d={d}
              pathLength={100}
              stroke={`url(#eng-out-${k})`}
            />
          </g>
        ))}
        {branches.map((b, i) => (
          <g key={`br${i}`}>
            <path
              className={styles.branch}
              d={b.d}
              stroke={`url(#eng-out-${k})`}
            />
            <circle
              className={styles.branchNode}
              cx={b.end[0]}
              cy={b.end[1]}
              r={1.9}
            />
          </g>
        ))}
      </g>

      {/* ═══ THE ENGINE ═══ */}
      <g
        onMouseEnter={onFocus ? () => onFocus("engine") : undefined}
        onMouseLeave={onFocus ? () => onFocus(null) : undefined}
      >
        <circle
          className={styles.coreGlow}
          cx={cx}
          cy={cy}
          r={r * 1.85}
          fill={`url(#eng-core-${k})`}
        />

        {/* Two concentric processing rings. They do not spin: they illuminate
            once per cycle, while the signal is being processed. */}
        <circle className={styles.ringOuter} cx={cx} cy={cy} r={r + 58} />
        <circle className={styles.ringInner} cx={cx} cy={cy} r={r + 44} />

        {/* Inbound response and outbound emission. */}
        <path className={styles.ingestArc} d={ingestArc} />
        <path className={styles.emitArc} d={emitArc} />

        {/* Segmented radial ticks — the instrument's scale. */}
        <g className={styles.ticks}>
          {Array.from({ length: 72 }, (_, i) => {
            const a = (i / 72) * Math.PI * 2;
            const r0 = r + 24;
            const r1 = r0 + (i % 6 === 0 ? 11 : 5);
            return (
              <line
                key={i}
                x1={cx + Math.cos(a) * r0}
                y1={cy + Math.sin(a) * r0}
                x2={cx + Math.cos(a) * r1}
                y2={cy + Math.sin(a) * r1}
              />
            );
          })}
        </g>

        {/* Motion DNA, wrapped around the core: the stride signal the engine is
            processing, drawn radially. A single illumination sweep runs the
            ring once per loop — the samples brighten in turn rather than the
            ring rotating. */}
        <g>
          {Array.from({ length: 96 }, (_, i) => {
            const a = (i / 96) * Math.PI * 2 - Math.PI / 2;
            const h = strideHeight(i, 15);
            const r0 = r + 6;
            return (
              <line
                key={i}
                className={i % 12 === 0 ? styles.dnaStrong : styles.dnaTick}
                style={{ "--eng-i": i } as CSSProperties}
                x1={cx + Math.cos(a) * r0}
                y1={cy + Math.sin(a) * r0}
                x2={cx + Math.cos(a) * (r0 + h)}
                y2={cy + Math.sin(a) * (r0 + h)}
              />
            );
          })}
        </g>

        {/* Inclined internal orbits carrying processing nodes. The nodes sit on
            the orbits rather than travelling them: SMIL <animateMotion> ignores
            prefers-reduced-motion. They brighten in turn as the signal is
            worked on. */}
        {[
          { rx: r * 0.74, ry: r * 0.3, rot: -18, at: [0.15, 0.62] },
          { rx: r * 0.56, ry: r * 0.24, rot: 26, at: [0.4, 0.88] },
        ].map((o, i) => (
          <g key={i} transform={`rotate(${o.rot} ${cx} ${cy})`}>
            <ellipse className={styles.orbit} cx={cx} cy={cy} rx={o.rx} ry={o.ry} />
            {o.at.map((t, j) => {
              const a = t * Math.PI * 2;
              return (
                <circle
                  key={j}
                  className={styles.orbitNode}
                  cx={cx + Math.cos(a) * o.rx}
                  cy={cy + Math.sin(a) * o.ry}
                  r={2.4}
                  style={{ "--eng-i": i * 2 + j } as CSSProperties}
                />
              );
            })}
          </g>
        ))}

        <circle className={styles.coreDisc} cx={cx} cy={cy} r={r} />
        <circle className={styles.coreEdge} cx={cx} cy={cy} r={r} />
        <circle className={styles.corePulse} cx={cx} cy={cy} r={r} />

        <text
          className={styles.coreBrand}
          x={cx}
          y={geo.coreLines[0]}
          style={{ fontSize: geo.coreBrandSize } as CSSProperties}
        >
          GaitAI
        </text>
        {["Movement", "Intelligence", "Engine"].map((word, i) => (
          <text
            key={word}
            className={styles.coreTitle}
            x={cx}
            y={geo.coreLines[i + 1]}
            style={{ fontSize: geo.coreTitleSize } as CSSProperties}
          >
            {word}
          </text>
        ))}
        {/* What the engine actually does, at the smallest legible weight. */}
        <text
          className={styles.coreDesc}
          x={cx}
          y={geo.coreDescY}
          style={{ fontSize: geo.coreDescSize } as CSSProperties}
        >
          {geo.coreDesc}
        </text>
      </g>
    </svg>
  );
}

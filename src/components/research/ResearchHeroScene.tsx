import { GAIT_HEAD, GAIT_NECK, GAIT_PHASES, type Pt } from "@/components/visuals/gait-phases";
import { PoseSkeleton } from "./PoseSkeleton";
import styles from "./scene.module.css";

/**
 * The research hero scene: one signal becoming a representation.
 *
 * The hero's right half was empty. The reference fills it with a single
 * continuous scientific scene rather than a picture of a product, and that
 * scene happens to be exactly this page's argument read left to right:
 *
 *   capture      three sampled signal traces on a measured axis
 *   pose         a wireframe walker on a perspective ground plane, drawn
 *                from the same canonical mid-stance keyframe the rest of the
 *                site uses
 *   features     the body's joints projected out into a scatter — the point
 *                where movement stops being a picture and becomes numbers
 *   latent       a dense radial burst: the learned representation the
 *                published record is actually about
 *
 * Every stage is annotated in the same hairline small-caps the page uses for
 * section labels, so the drawing reads as a labelled figure rather than as
 * background art. Nothing in it is a measurement: there are no axis values,
 * no units and no numbers anywhere, because the scene depicts a pipeline, not
 * a result.
 *
 * All geometry is deterministic — the scatter and the burst are generated
 * from a fixed integer seed — so the figure is identical on the server, in
 * the browser and in a screenshot.
 */

const W = 1000;
const H = 560;

const r1 = (n: number) => Math.round(n * 10) / 10;

const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/* ── 1 · CAPTURE — three sampled traces ──────────────────────────────── */

function trace(seed: number, y0: number, amp: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= 56; i += 1) {
    const t = i / 56;
    const y =
      y0 +
      Math.sin(t * 9.1 + seed) * amp +
      Math.sin(t * 21.3 + seed * 2.1) * (amp * 0.34) +
      Math.sin(t * 3.4 + seed * 0.7) * (amp * 0.5);
    pts.push(`${r1(18 + t * 172)},${r1(y)}`);
  }
  return `M ${pts.join(" L ")}`;
}

/* ── 2 · POSE — the walker ───────────────────────────────────────────── */

/**
 * The figure's frame. `gait-phases` puts the pelvis at (0,0) and the ground at
 * y≈48, so the ground line is what has to land on the platform: at SCALE 3.1
 * the figure stands 300px tall and its feet meet the ellipse exactly.
 */
const SCALE = 3.1;
const FIG_X = 420;
const GROUND_Y = 418;
const FIG_Y = GROUND_Y - 48 * SCALE;

const px = (p: Pt) => r1(FIG_X + p[0] * SCALE);
const py = (p: Pt) => r1(FIG_Y + p[1] * SCALE);
const poly = (list: readonly Pt[]) =>
  list.map((p) => `${px(p)},${py(p)}`).join(" ");

/**
 * Heel strike: the one keyframe that reads as a stride at a glance — both
 * legs extended, opposite arms swung. Mid-stance stacks the limbs almost
 * vertically, which draws as a stick rather than as a walk.
 */
const PHASE = GAIT_PHASES[0];

/* ── 3 · FEATURES — joints projected into a scatter ──────────────────── */

const JOINTS: Pt[] = [
  GAIT_HEAD,
  GAIT_NECK,
  PHASE.nearLeg[0],
  PHASE.nearLeg[1],
  PHASE.nearLeg[2],
  PHASE.farLeg[1],
  PHASE.farLeg[2],
  PHASE.nearArm[1],
  PHASE.nearArm[2],
  PHASE.farArm[2],
];

/** The feature cloud: a wedge opening to the right of the figure. */
const FEATURES = Array.from({ length: 68 }, (_, i) => {
  const t = rnd(i * 3 + 1);
  const s = rnd(i * 7 + 5);
  const x = 552 + Math.pow(t, 0.8) * 214;
  const spread = 26 + Math.pow(t, 0.7) * 120;
  const y = 254 + (s - 0.5) * spread * 2;
  return {
    x: r1(x),
    y: r1(y),
    r: r1(1 + rnd(i * 11 + 2) * 1.7),
    tone: rnd(i * 13 + 7),
  };
});

/* ── 4 · LATENT — the radial burst ───────────────────────────────────── */

const LX = 862;
const LY = 236;

const BURST = Array.from({ length: 92 }, (_, i) => {
  const a = rnd(i * 5 + 3) * Math.PI * 2;
  const len = 12 + Math.pow(rnd(i * 9 + 4), 1.7) * 108;
  return {
    x1: r1(LX + Math.cos(a) * 6),
    y1: r1(LY + Math.sin(a) * 6),
    x2: r1(LX + Math.cos(a) * len),
    y2: r1(LY + Math.sin(a) * len),
    tone: rnd(i * 17 + 1),
  };
});

const BURST_POINTS = Array.from({ length: 54 }, (_, i) => {
  const a = rnd(i * 11 + 9) * Math.PI * 2;
  const len = 16 + Math.pow(rnd(i * 3 + 13), 1.4) * 112;
  return {
    x: r1(LX + Math.cos(a) * len),
    y: r1(LY + Math.sin(a) * len),
    r: r1(0.8 + rnd(i * 7 + 5) * 1.5),
    tone: rnd(i * 19 + 2),
  };
});

/* ── Joint trajectories ─────────────────────────────────────────────────
   Where a joint travels over one full cycle, sampled at the five canonical
   events and closed back to the first — a motion-capture trace in place. It
   is the figure's analytical content: the shape a temporal model reads.

   An overlapping row of stride frames was tried first and rejected: five
   bodies at this scale read as a clump of heads rather than as movement, and
   the reference's own figure annotates a single body.
   ---------------------------------------------------------------------- */

/** A smooth closed path through one joint across the five gait events. */
function jointPath(pick: (phase: (typeof GAIT_PHASES)[number]) => Pt): string {
  const samples = [0, 1, 2, 3, 4, 0];
  const pts: Pt[] = samples.map((phase) => {
    const local = pick(GAIT_PHASES[phase]);
    return [FIG_X + local[0] * SCALE, FIG_Y + local[1] * SCALE];
  });

  const d: string[] = [`M ${r1(pts[0][0])} ${r1(pts[0][1])}`];
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d.push(
      `C ${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(
        p2[1],
      )}`,
    );
  }
  return d.join(" ");
}

const TRAJECTORY_WRIST = jointPath((phase) => phase.nearArm[2]);
const TRAJECTORY_ANKLE = jointPath((phase) => phase.nearLeg[2]);

/** The sampled positions themselves, marked along each trace. */
const trajectoryPoints = (pick: (phase: (typeof GAIT_PHASES)[number]) => Pt) =>
  [0, 1, 2, 3, 4].map((phase) => {
    const local = pick(GAIT_PHASES[phase]);
    return {
      x: r1(FIG_X + local[0] * SCALE),
      y: r1(FIG_Y + local[1] * SCALE),
    };
  });

const WRIST_POINTS = trajectoryPoints((phase) => phase.nearArm[2]);
const ANKLE_POINTS = trajectoryPoints((phase) => phase.nearLeg[2]);

export function ResearchHeroScene() {
  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        role="img"
        aria-label="A figure of the research pipeline: sampled movement signals, a pose skeleton on a ground plane, the joint features extracted from it, and the learned representation those features form."
      >
        <defs>
          <radialGradient id="rs-latent">
            <stop offset="0" stopColor="#E9D5FF" stopOpacity="0.85" />
            <stop offset="0.4" stopColor="#A78BFA" stopOpacity="0.28" />
            <stop offset="1" stopColor="#7C3AED" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="rs-pose">
            <stop offset="0" stopColor="#4FD1FF" stopOpacity="0.2" />
            <stop offset="1" stopColor="#2563FF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="rs-bridge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#4FD1FF" stopOpacity="0.45" />
            <stop offset="1" stopColor="#A78BFA" stopOpacity="0.18" />
          </linearGradient>
        </defs>

        {/* ── ground plane: a receding perspective grid under the figure ── */}
        <g className={styles.plane}>
          {Array.from({ length: 8 }, (_, i) => {
            const t = i / 7;
            const y = GROUND_Y - 22 + t * t * 104;
            const inset = 132 * (1 - t) * 0.42;
            return (
              <line
                key={`pz${i}`}
                x1={r1(FIG_X - 168 + inset)}
                y1={r1(y)}
                x2={r1(FIG_X + 168 - inset)}
                y2={r1(y)}
              />
            );
          })}
          {Array.from({ length: 11 }, (_, i) => {
            const t = i / 10;
            return (
              <line
                key={`px${i}`}
                x1={r1(FIG_X - 168 + t * 336)}
                y1={GROUND_Y - 22}
                x2={r1(FIG_X - 112 + t * 224)}
                y2={GROUND_Y + 82}
              />
            );
          })}
        </g>

        {/* ── 1 · capture ── */}
        <g className={styles.capture}>
          <line className={styles.axis} x1={18} y1={92} x2={18} y2={238} />
          <line className={styles.axis} x1={18} y1={238} x2={196} y2={238} />
          {[0.9, 2.4, 4.1].map((seed, i) => (
            <path
              key={seed}
              className={i === 1 ? styles.traceLit : styles.trace}
              d={trace(seed, 126 + i * 44, 15 - i * 3)}
            />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line
              key={`t${i}`}
              className={styles.tick}
              x1={r1(18 + i * 19.6)}
              y1={238}
              x2={r1(18 + i * 19.6)}
              y2={244}
            />
          ))}
        </g>

        {/* ── bridge: capture into the body ── */}
        <path
          className={styles.bridge}
          d="M 198 182 C 252 182 268 226 300 240"
        />

        {/* ── 2 · pose ── */}
        <ellipse cx={FIG_X} cy={GROUND_Y} rx={142} ry={32} fill="url(#rs-pose)" />
        <ellipse
          className={styles.platform}
          cx={FIG_X}
          cy={GROUND_Y}
          rx={100}
          ry={22}
        />

        {/* A soft volume behind the leading figure, so the wireframe reads
            as a body rather than as a diagram floating in space. */}
        <ellipse
          cx={FIG_X + 6}
          cy={FIG_Y - 52}
          rx={58}
          ry={82}
          fill="url(#rs-pose)"
          opacity={0.8}
        />

        {/* One earlier frame, far back, so the figure has a direction of
            travel without the drawing becoming a row of bodies. */}
        <PoseSkeleton
          phase={3}
          scale={SCALE}
          x={FIG_X - 78}
          y={FIG_Y}
          detail="ghost"
          opacity={0.16}
        />

        {/* The joint trajectories: where the wrist and the ankle travel over
            one cycle, with the five sampled events marked. */}
        <g className={styles.trajectory}>
          <path d={TRAJECTORY_WRIST} />
          <path d={TRAJECTORY_ANKLE} />
        </g>
        <g className={styles.trajectoryMark}>
          {[...WRIST_POINTS, ...ANKLE_POINTS].map((point, i) => (
            <circle key={i} cx={point.x} cy={point.y} r={1.9} />
          ))}
        </g>

        <PoseSkeleton phase={0} scale={SCALE} x={FIG_X} y={FIG_Y} />

        {/* ── joints projected into the feature cloud ── */}
        <g className={styles.projection}>
          {JOINTS.slice(0, 7).map((joint, i) => (
            <line
              key={i}
              x1={px(joint)}
              y1={py(joint)}
              x2={r1(556 + i * 5)}
              y2={r1(196 + i * 18)}
            />
          ))}
        </g>

        {/* ── 3 · features ── */}
        <g>
          {FEATURES.map((point, i) => (
            <circle
              key={i}
              className={
                point.tone > 0.7
                  ? styles.featureLit
                  : point.tone > 0.38
                    ? styles.featureWarm
                    : styles.feature
              }
              cx={point.x}
              cy={point.y}
              r={point.r}
            />
          ))}
        </g>

        {/* ── bridge: features into the representation ── */}
        <path
          className={styles.bridgeWarm}
          d="M 742 252 C 788 252 806 242 836 238"
        />

        {/* ── 4 · latent representation ── */}
        <circle cx={LX} cy={LY} r={126} fill="url(#rs-latent)" />
        <g>
          {BURST.map((ray, i) => (
            <line
              key={i}
              className={ray.tone > 0.62 ? styles.rayLit : styles.ray}
              x1={ray.x1}
              y1={ray.y1}
              x2={ray.x2}
              y2={ray.y2}
            />
          ))}
          {BURST_POINTS.map((point, i) => (
            <circle
              key={i}
              className={point.tone > 0.6 ? styles.burstLit : styles.burst}
              cx={point.x}
              cy={point.y}
              r={point.r}
            />
          ))}
          <circle className={styles.latentCore} cx={LX} cy={LY} r={3.6} />
        </g>

        {/* ── annotations ── */}
        <g className={styles.labels}>
          <text x={18} y={80}>Capture</text>
          <text x={FIG_X - 168} y={GROUND_Y + 100}>Pose</text>
          <text x={FIG_X + 84} y={FIG_Y + 10}>Joint trajectories</text>
          <text x={556} y={140}>Gait features</text>
          <text x={640} y={410}>Feature space</text>
          <text x={LX} y={378} textAnchor="middle">Latent representation</text>
        </g>
      </svg>
    </div>
  );
}

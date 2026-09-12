import { smoothPath } from "@/components/research/PoseFrame";
import type { Pt } from "@/components/visuals/gait-phases";
import styles from "./representations.module.css";

/**
 * THE FIVE REPRESENTATIONS, DRAWN AS THE THINGS THEY ACTUALLY ARE.
 * =============================================================================
 * Every drawing here is authored from scratch for GaitAI — geometry in this
 * file, painted with the section's own tokens. Nothing is traced from, or
 * derived from, any third-party image, dataset frame or model output; the
 * published work these are recognisable AS was used only as a description of
 * what each representation contains.
 *
 * WHY THIS REPLACED THE SHARED GAIT KEYFRAMES. `visuals/gait-phases` is a
 * five-keyframe stick figure: a head circle, a spine and four limb polylines.
 * It is the right asset for the research pages, where it is a diagram of a
 * gait cycle. In this section it was wrong, because this section's whole
 * argument is that the five representations are DIFFERENT KINDS OF DATA — and
 * three of them were rendering as the same mannequin at three opacities.
 * A visitor could see the label change and not the thing.
 *
 * So the five are now built to be recognisable on sight:
 *
 *   CAMERA VIDEO  a tonal figure in a real scene inside camera furniture —
 *                 corner brackets, REC, a timestamp, scanlines, vignette.
 *                 It should read as a frame off a CCTV stream.
 *   SILHOUETTE    the same body as ONE flat mask. No face, no internal
 *                 geometry, no scene — a foreground segmentation, which is
 *                 exactly what the word means.
 *   POSE          landmarks and bones at the joints a pose estimator
 *                 actually returns: nose, shoulders, elbows, wrists, hips,
 *                 knees, ankles, heels, foot index — near side bright, far
 *                 side dim, the way every pose overlay distinguishes them.
 *   TRAJECTORY    the hip centroid over time. Ghosts of where the body was,
 *                 a fading path, sampled time dots — the body is incidental
 *                 and the PATH is the subject.
 *   SENSOR        no person at all. Three accelerometer traces over a time
 *                 axis with heel-strike markers, and a watch as a caption.
 *
 * ONE BODY, FIVE VIEWS. The camera figure, the mask, the skeleton, the
 * trajectory ghosts and the pose inside the trajectory are all the same
 * `L` landmark set below. That is what makes the section's claim legible:
 * the visitor is watching one walk lose information, not five drawings.
 *
 * THE POSE IS A REAL INSTANT OF GAIT — right heel strike, left toe off, the
 * moment of maximum stride separation, with the arms in the contralateral
 * swing a walk actually has (right leg forward, right arm back). Proportions
 * are a 7-head adult figure. Nothing is placed by transform.
 */

/* The box. Matches the card figure area the section already reserves. */
const W = 150;
const H = 156;
const GROUND = 126;

/**
 * THE LANDMARK SET, in box coordinates.
 *
 * Named for what a pose estimator returns, because the pose view draws
 * exactly these and the other views are built from the same points — so the
 * mask cannot drift away from the skeleton it is supposed to be a mask of.
 * `R` is the near side (towards the viewer), `L` the far side.
 */
const P = {
  /* The head cluster. A pose estimator returns face landmarks, not a head
     outline — so the head here is an ear, an eye and a nose, which is what
     the overlay looks like and why it reads as a pose result rather than as
     a drawing of a person. Only the far-side ear/eye are occluded at this
     angle, so only the near ones are drawn. */
  ear: [73.5, 21],
  eye: [78, 19.2],
  nose: [80.5, 20.5],
  headC: [74, 22.5],
  neck: [74, 34],
  shoulderR: [76.5, 40],
  shoulderL: [70, 40.5],
  elbowR: [69, 57],
  wristR: [65, 72],
  elbowL: [80, 57],
  wristL: [87, 69],
  hipR: [75, 74],
  hipL: [70, 75],
  hipC: [72.5, 74.5],
  kneeR: [87, 97],
  ankleR: [97, 118],
  heelR: [94, 125],
  toeR: [106, 123],
  kneeL: [63, 98],
  ankleL: [54, 118],
  heelL: [49, 114],
  toeL: [60, 124],
} satisfies Record<string, Pt>;

const HEAD_RX = 6.8;
const HEAD_RY = 8.2;

const line = (a: Pt, b: Pt) => `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
const poly = (...pts: Pt[]) => pts.map((p) => p.join(",")).join(" ");

/**
 * The body as a single filled region.
 *
 * Built as limb capsules (round-capped strokes) plus a torso and a head, all
 * painted in ONE colour with no internal stroke — so the union reads as a
 * foreground mask rather than as an assembly of parts. That is the whole
 * difference between a segmentation and a cartoon made of shapes.
 *
 * `mask` renders it flat (the silhouette view); the camera view passes tonal
 * classes per region instead, which is the only thing that differs between
 * "person as recorded" and "person as mask".
 */
function Body({
  tone = false,
  className,
}: {
  tone?: boolean;
  className?: string;
}) {
  const skin = tone ? styles.toneSkin : undefined;
  const wear = tone ? styles.toneWear : undefined;
  const legs = tone ? styles.toneLegs : undefined;
  const shoe = tone ? styles.toneShoe : undefined;

  return (
    <g className={className}>
      {/* Far limbs first, so the near side overlaps them the way a body
          occludes itself. */}
      <path className={legs} d={poly(P.hipL, P.kneeL) && line(P.hipL, P.kneeL)} strokeWidth={13} />
      <path className={legs} d={line(P.kneeL, P.ankleL)} strokeWidth={9} />
      <path className={shoe} d={`M${P.heelL[0]} ${P.heelL[1]}L${P.ankleL[0]} ${P.ankleL[1]}L${P.toeL[0]} ${P.toeL[1]}`} strokeWidth={5.5} />
      <path className={wear} d={line(P.shoulderL, P.elbowL)} strokeWidth={7.5} />
      <path className={skin} d={line(P.elbowL, P.wristL)} strokeWidth={6} />
      <circle className={skin} cx={P.wristL[0]} cy={P.wristL[1]} r={3} strokeWidth={0} />

      {/* Torso. One closed path from the shoulder line to the hips. */}
      <path
        className={wear}
        strokeWidth={0}
        d="M65 43 C64.4 37.2 83.6 36.8 83 43 L81.2 61 L80 77.5 L65.6 77.5 L64.6 61 Z"
      />
      {/* Neck and head. */}
      <path className={skin} d={line([74, 31], P.neck)} strokeWidth={8} />
      <ellipse
        className={skin}
        cx={P.headC[0]}
        cy={P.headC[1]}
        rx={HEAD_RX}
        ry={HEAD_RY}
        strokeWidth={0}
      />

      {/* Near limbs. */}
      <path className={legs} d={line(P.hipR, P.kneeR)} strokeWidth={14} />
      <path className={legs} d={line(P.kneeR, P.ankleR)} strokeWidth={9.5} />
      <path className={shoe} d={`M${P.heelR[0]} ${P.heelR[1]}L${P.ankleR[0]} ${P.ankleR[1]}L${P.toeR[0]} ${P.toeR[1]}`} strokeWidth={5.5} />
      <path className={wear} d={line(P.shoulderR, P.elbowR)} strokeWidth={8} />
      <path className={skin} d={line(P.elbowR, P.wristR)} strokeWidth={6.5} />
      <circle className={skin} cx={P.wristR[0]} cy={P.wristR[1]} r={3.2} strokeWidth={0} />
    </g>
  );
}

/** The bones a pose estimator reports, near side and far side kept apart. */
const BONES_FAR: [Pt, Pt][] = [
  [P.shoulderL, P.elbowL],
  [P.elbowL, P.wristL],
  [P.shoulderL, P.hipL],
  [P.hipL, P.kneeL],
  [P.kneeL, P.ankleL],
  [P.ankleL, P.heelL],
  [P.heelL, P.toeL],
];

const BONES_NEAR: [Pt, Pt][] = [
  [P.ear, P.eye],
  [P.eye, P.nose],
  [P.ear, P.neck],
  [P.shoulderL, P.shoulderR],
  [P.shoulderR, P.elbowR],
  [P.elbowR, P.wristR],
  [P.shoulderR, P.hipR],
  [P.hipL, P.hipR],
  [P.hipR, P.kneeR],
  [P.kneeR, P.ankleR],
  [P.ankleR, P.heelR],
  [P.heelR, P.toeR],
];

const JOINTS_FAR: Pt[] = [P.shoulderL, P.elbowL, P.wristL, P.hipL, P.kneeL, P.ankleL, P.heelL, P.toeL];
const JOINTS_NEAR: Pt[] = [P.ear, P.eye, P.nose, P.shoulderR, P.elbowR, P.wristR, P.hipR, P.kneeR, P.ankleR, P.heelR, P.toeR];

/**
 * The centroid path: where the hip went, over the last few strides.
 *
 * A walking pelvis rises and falls twice per stride, so the path is not a
 * straight line — that small vertical ripple is the thing that makes a
 * trajectory read as a WALK rather than as a slide. Deterministic, so the
 * server and the browser draw the same curve.
 */
const TRAIL: Pt[] = Array.from({ length: 13 }, (_, i) => {
  const t = i / 12;
  return [
    14 + t * (P.hipC[0] - 14),
    P.hipC[1] + 8 - t * 8 - Math.sin(t * Math.PI * 4) * 2.6,
  ] as Pt;
});

/** Where the ghosts stand, as a fraction along the trail. */
const GHOSTS = [0.18, 0.52];

/* ── The wearable signal ─────────────────────────────────────────────────
   Three accelerometer channels over about three and a bit gait cycles.

   The shapes are the ones a trunk-mounted IMU actually produces, written as
   functions rather than sampled from anybody's data: vertical acceleration
   peaks twice per stride, anteroposterior once, mediolateral once per STRIDE
   (so half the rate of the other two), and each initial contact puts a sharp
   transient on the vertical trace. No randomness — a random trace would
   differ between the server and the client render. */

const PAD_X = 12;
const CYCLES = 3.25;
const SAMPLES = 170;

const at = (t: number) => PAD_X + t * (W - PAD_X * 2);

/** A narrow transient at every initial contact. */
const strike = (t: number) => {
  let v = 0;
  for (let k = 0; k <= Math.ceil(CYCLES); k += 1) {
    const d = (t - k / CYCLES) * CYCLES * 26;
    v += Math.exp(-d * d);
  }
  return v;
};

const channel = (fn: (t: number) => number, mid: number, amp: number) => {
  const pts: Pt[] = [];
  for (let i = 0; i <= SAMPLES; i += 1) {
    const t = i / SAMPLES;
    pts.push([at(t), mid - fn(t) * amp]);
  }
  return smoothPath(pts);
};

const phase = (t: number) => t * CYCLES * Math.PI * 2;

/** Vertical: two peaks a stride, plus the heel-strike transient. */
const ACC_Y = channel(
  (t) => -Math.cos(phase(t) * 2) * 0.62 + strike(t) * 0.9 - 0.1,
  66,
  15,
);
/** Anteroposterior: one cycle per stride, braking then propulsion. */
const ACC_X = channel((t) => Math.sin(phase(t)) * 0.8 + Math.sin(phase(t) * 3) * 0.12, 95, 9);
/** Mediolateral: half the rate — one sway per stride pair. */
const ACC_Z = channel((t) => Math.sin(phase(t) / 2 + 0.6) * 0.7, 113, 6);

/** Where each initial contact lands on the time axis. */
const CONTACTS = Array.from({ length: Math.floor(CYCLES) + 1 }, (_, k) => at(k / CYCLES)).filter(
  (x) => x <= W - PAD_X,
);

export type RepresentationDraw =
  | "frame"
  | "silhouette"
  | "pose"
  | "trajectory"
  | "sensor";

/**
 * One representation, at card scale.
 *
 * `role="img"` with the caller's label: each of these is a picture of
 * something, not decorative SVG, and the label is what a screen reader gets
 * instead of the geometry.
 */
export function RepresentationFigure({
  draw,
  label,
  className,
}: {
  draw: RepresentationDraw;
  label: string;
  className?: string;
}) {
  return (
    <div role="img" aria-label={label} className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className={styles.svg}
        data-draw={draw}
        aria-hidden="true"
      >
        <defs>
          {/* The trail fades into the past rather than ending in mid-air. */}
          <linearGradient id="gai-trail" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="55%" stopColor="currentColor" stopOpacity="0.45" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
          </linearGradient>
          {/* The lens falls off at the corners, which is most of what makes a
              rectangle read as a camera frame. */}
          <radialGradient id="gai-vignette" cx="50%" cy="46%" r="72%">
            <stop offset="55%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.66" />
          </radialGradient>
          <linearGradient id="gai-spill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <clipPath id="gai-frame">
            <rect x="0" y="0" width={W} height={H} rx="4" />
          </clipPath>
        </defs>

        {/* ═══ CAMERA VIDEO ═══════════════════════════════════════════════
            A room, a person in it, and the furniture of a recording. */}
        {draw === "frame" && (
          <g clipPath="url(#gai-frame)">
            <rect x="0" y="0" width={W} height={H} className={styles.camGround} />
            {/* Back wall, floor, and the perspective that separates them. */}
            <rect x="0" y="0" width={W} height={74} className={styles.camWall} />
            <rect x="0" y="74" width={W} height={H - 74} className={styles.camFloor} />
            <path d={`M0 74H${W}`} className={styles.camEdge} />
            <path d={`M-20 ${H}L44 74`} className={styles.camEdgeSoft} />
            <path d={`M${W + 20} ${H}L${W - 44} 74`} className={styles.camEdgeSoft} />
            <path d={`M20 ${H}L58 74`} className={styles.camEdgeSoft} />
            <path d={`M${W - 20} ${H}L${W - 58} 74`} className={styles.camEdgeSoft} />
            {/* A doorway and the light coming through it. */}
            <rect x="14" y="36" width="24" height="38" className={styles.camDoor} />
            <path d="M14 74 L38 74 L46 156 L2 156 Z" fill="url(#gai-spill)" className={styles.camSpill} />
            {/* Ceiling luminaire. */}
            <ellipse cx="104" cy="12" rx="20" ry="4.5" className={styles.camLamp} />

            {/* The person, in tone rather than as a flat shape. */}
            <g className={styles.camShadowWrap}>
              <ellipse cx="76" cy={GROUND + 1} rx="26" ry="3.6" className={styles.camShadow} />
            </g>
            <Body tone className={styles.camBody} />

            {/* Camera furniture. */}
            <rect x="0" y="0" width={W} height={H} fill="url(#gai-vignette)" />
            <g className={styles.scanlines}>
              {Array.from({ length: 26 }, (_, i) => (
                <path key={i} d={`M0 ${i * 6 + 2}H${W}`} />
              ))}
            </g>
            <g className={styles.camBracket}>
              {[
                [8, 8, 1, 1],
                [W - 8, 8, -1, 1],
                [8, H - 8, 1, -1],
                [W - 8, H - 8, -1, -1],
              ].map(([x, y, dx, dy]) => (
                <path key={`${x}-${y}`} d={`M${x} ${y + dy * 9}L${x} ${y}L${x + dx * 9} ${y}`} />
              ))}
            </g>
            <circle cx="15" cy="15" r="2.6" className={styles.camRec} />
            <text x="21" y="17.4" className={styles.camText}>
              REC
            </text>
            <text x={W - 10} y="17.4" textAnchor="end" className={styles.camText}>
              CAM 03
            </text>
            <text x="10" y={H - 9} className={styles.camStamp}>
              2026-09-12 09:41:07
            </text>
            <text x={W - 10} y={H - 9} textAnchor="end" className={styles.camStamp}>
              30 FPS
            </text>
          </g>
        )}

        {/* ═══ SILHOUETTE ═════════════════════════════════════════════════
            The foreground, and nothing else. The chequer behind it is the
            convention for "background removed" — it is not a scene. */}
        {draw === "silhouette" && (
          <g>
            <g className={styles.checker}>
              {Array.from({ length: 13 }, (_, r) =>
                Array.from({ length: 13 }, (_, c) =>
                  (r + c) % 2 === 0 ? (
                    <rect key={`${r}-${c}`} x={c * 12} y={r * 12} width="12" height="12" />
                  ) : null,
                ),
              )}
            </g>
            <Body className={styles.mask} />
            <text x={W / 2} y={H - 8} textAnchor="middle" className={styles.maskLabel}>
              FOREGROUND MASK
            </text>
          </g>
        )}

        {/* ═══ POSE SKELETON ══════════════════════════════════════════════ */}
        {draw === "pose" && (
          <g>
            <g className={styles.poseFar}>
              {BONES_FAR.map(([a, b]) => (
                <path key={`${a}-${b}`} d={line(a, b)} />
              ))}
              {JOINTS_FAR.map((p) => (
                <circle key={String(p)} cx={p[0]} cy={p[1]} r="2.1" />
              ))}
            </g>
            <g className={styles.poseNear}>
              {BONES_NEAR.map(([a, b]) => (
                <path key={`${a}-${b}`} d={line(a, b)} />
              ))}
            </g>
            <g className={styles.poseJoint}>
              {JOINTS_NEAR.map((p) => (
                <circle key={String(p)} cx={p[0]} cy={p[1]} r="2.6" />
              ))}
            </g>
            {/* The detection box every pose estimator reports alongside the
                landmarks, with its confidence. */}
            <rect x="42" y="10" width="70" height={GROUND - 10 + 4} rx="2" className={styles.poseBox} />
            <text x="42" y="7" className={styles.poseTag}>
              PERSON 0.97
            </text>
            <text x={W / 2} y={H - 8} textAnchor="middle" className={styles.poseCount}>
              {JOINTS_NEAR.length + JOINTS_FAR.length} LANDMARKS
            </text>
          </g>
        )}

        {/* ═══ TRAJECTORY ═════════════════════════════════════════════════
            The path is the subject; the body is where the path has got to. */}
        {draw === "trajectory" && (
          <g>
            <path d={`M6 ${GROUND}H${W - 6}`} className={styles.trajGround} />
            {GHOSTS.map((g) => {
              const i = Math.round(g * (TRAIL.length - 1));
              const [x, y] = TRAIL[i];
              return (
                <g
                  key={g}
                  className={styles.ghost}
                  style={{ opacity: 0.05 + g * 0.08 }}
                  transform={`translate(${x - P.hipC[0]} ${y - P.hipC[1]})`}
                >
                  <Body />
                </g>
              );
            })}
            <path
              d={smoothPath(TRAIL)}
              className={styles.trailLine}
              stroke="url(#gai-trail)"
            />
            {TRAIL.filter((_, i) => i % 2 === 0).map(([x, y], i, arr) => (
              <circle
                key={x}
                cx={x}
                cy={y}
                r={i === arr.length - 1 ? 3.2 : 1.8}
                className={styles.trailDot}
                style={{ opacity: 0.25 + (i / (arr.length - 1)) * 0.75 }}
              />
            ))}
            <g className={styles.trajBody}>
              <Body />
            </g>
            <circle cx={P.hipC[0]} cy={P.hipC[1]} r="3.4" className={styles.centroid} />
            <text x={P.hipC[0] + 7} y={P.hipC[1] - 5} className={styles.trajTag}>
              CENTROID
            </text>
            <text x="8" y={H - 8} className={styles.trajTag}>
              t − 3.0 s
            </text>
            <text x={W - 8} y={H - 8} textAnchor="end" className={styles.trajTag}>
              now
            </text>
          </g>
        )}

        {/* ═══ SENSOR SIGNAL ══════════════════════════════════════════════
            No body. Three channels, a time axis and the contacts. */}
        {draw === "sensor" && (
          <g>
            <g className={styles.grid}>
              {[40, 66, 95, 113, 132].map((y) => (
                <path key={y} d={`M${PAD_X} ${y}H${W - PAD_X}`} />
              ))}
            </g>
            {/* Initial contact, marked on the axis and down the plot. */}
            <g className={styles.contact}>
              {CONTACTS.map((x) => (
                <path key={x} d={`M${x} 34V134`} />
              ))}
            </g>

            <path d={ACC_Y} className={styles.accY} />
            <path d={ACC_X} className={styles.accX} />
            <path d={ACC_Z} className={styles.accZ} />

            {CONTACTS.map((x) => (
              <circle key={x} cx={x} cy={66 - 0.8 * 15} r="2" className={styles.strikeDot} />
            ))}

            <text x={PAD_X} y="30" className={styles.sensorTag}>
              ACCEL · 100 Hz
            </text>
            <text x={W - PAD_X} y="30" textAnchor="end" className={styles.sensorLegendY}>
              Y
            </text>
            <text x={W - PAD_X - 12} y="30" textAnchor="end" className={styles.sensorLegendX}>
              X
            </text>
            <text x={W - PAD_X - 22} y="30" textAnchor="end" className={styles.sensorLegendZ}>
              Z
            </text>
            <text x={PAD_X} y={H - 8} className={styles.sensorTag}>
              ▲ INITIAL CONTACT
            </text>

            {/* The device, as a caption rather than as the subject. */}
            <g className={styles.watch} transform={`translate(${W - 30} ${H - 30})`}>
              <rect x="-7" y="-11" width="14" height="4" rx="1.6" />
              <rect x="-7" y="7" width="14" height="4" rx="1.6" />
              <rect x="-9.5" y="-8" width="19" height="16" rx="4" className={styles.watchFace} />
              <path d="M-4.5 0h3l1.5 -3 1.5 5 1.5 -2h2" className={styles.watchTrace} />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

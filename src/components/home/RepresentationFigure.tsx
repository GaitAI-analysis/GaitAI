import { assetPath } from "@/lib/paths";
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
/**
 * THE CAPTURE PLATE — A REAL FRAME, NOT A DRAWING OF ONE.
 * ---------------------------------------------------------------------------
 * This card has to read as raw camera footage before any privacy transform,
 * and a vector figure cannot: however much grain, vignette and motion blur go
 * over it, a drawn person stays a drawn person. So the capture view is a
 * photograph.
 *
 * WHERE IT COMES FROM. The site already owned one: the insights cover
 * `01-walking-video-to-movement-intelligence.jpg` contains, inside the phone
 * in its top-left corner, a photoreal frame of a man walking past a concrete
 * wall. `scripts/build-capture-plate.py` crops that region clear of the phone
 * bezel and its UI, grades it away from the cover's blue key toward the
 * near-neutral, low-contrast look of a camera at gain, and writes the portrait
 * plate below. Nothing was fetched from the internet and no new licence is
 * involved — it is the project's own asset, reframed.
 *
 * TO REPLACE IT, drop a different still at the same path (or point this at a
 * new one) and rerun nothing: the recording furniture — vignette, grain,
 * scanlines, brackets, REC, CAM 03, timestamp — is drawn over whatever is
 * here. A photograph of an identifiable person presented as surveillance
 * footage needs a model release, so that stays a decision for the site owner.
 *
 * Set to null to fall back to the drawn room, which is still below.
 */
const CCTV_PLATE: string | null = "/assets/images/capture/cctv-walk-frame.jpg";

const W = 150;
const H = 156;
const GROUND = 126;
/** Where the floor's perspective lines converge, just above the horizon. */
const VP: [number, number] = [88, 71];

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
const TRAIL: Pt[] = Array.from({ length: 25 }, (_, i) => {
  const t = i / 24;
  return [
    10 + t * (W - 22),
    /* Walking toward the camera as well as across it, so the path has
       depth rather than being a horizontal line with a wobble. */
    P.hipC[1] + 26 - t * 30 - Math.sin(t * Math.PI * 5) * 3.1,
  ] as Pt;
});

/**
 * Samples along the trail, used for the time ticks. Spacing is the
 * observation interval, so where the dots bunch the walker was slower —
 * which is the one quantity a trajectory carries that a path alone does not.
 */
const TRAIL_TICKS = [0, 4, 8, 12, 16, 20, 24];

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
    /* Narrow: a heel strike is a transient, and at 100 Hz it is a spike
       with a fall, not a hump. Widening this is what made the vertical
       channel read as a sine wave. */
    const d = (t - k / CYCLES) * CYCLES * 44;
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
  (t) =>
    -Math.cos(phase(t) * 2) * 0.42 +
    strike(t) * 1.35 -
    /* The loading-response dip that follows every strike. */
    strike(t - 0.055 / CYCLES) * 0.38 -
    0.08,
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

          {/* ── What makes a rectangle read as footage rather than artwork ──
              Grain, focus and smear: three things every real frame has and no
              illustration does. They are cheap at this size and they are the
              whole difference between the two readings. */}

          {/* A SEGMENTATION BOUNDARY, NOT A SHAPE.
              The mask was a union of capsules, which is geometrically perfect
              in a way no segmenter's output ever is: a real foreground mask
              wobbles along the edge, swells a little at the shoulders and
              bites into the thin parts. A low-frequency displacement gives it
              that boundary without changing the pose, the proportions or the
              silhouette's reading — it is the same body, cut out by a model
              rather than drawn with a compass. Seeded, so the server and the
              browser produce the same edge. */}
          <filter id="gai-seg" x="-10%" y="-8%" width="120%" height="116%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.042 0.075"
              numOctaves="3"
              seed="19"
              result="segNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="segNoise"
              scale="3.1"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Sensor noise. Real at any gain; the dominant texture at low light. */}
          <filter id="gai-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.82"
              numOctaves="3"
              seed="11"
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
            <feComponentTransfer in="mono">
              <feFuncA type="linear" slope="0.5" intercept="-0.16" />
            </feComponentTransfer>
          </filter>

          {/* Depth of field. The far plane is not where the lens is focused. */}
          <filter id="gai-dof" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.85" />
          </filter>

          {/* Motion blur. A walking person at 1/30s smears horizontally — and
              the limbs, which travel fastest, smear most. */}
          <filter id="gai-motion" x="-14%" y="-8%" width="128%" height="116%">
            <feGaussianBlur stdDeviation="0.85 0.22" />
          </filter>
          <filter id="gai-motion-limb" x="-24%" y="-10%" width="148%" height="120%">
            <feGaussianBlur stdDeviation="1.9 0.3" />
          </filter>

          {/* The room's own light: a ceiling source falling off down the wall,
              and a floor that is brightest where it is nearest. */}
          <linearGradient id="gai-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2b3140" />
            <stop offset="100%" stopColor="#151a25" />
          </linearGradient>
          <linearGradient id="gai-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#191f2b" />
            <stop offset="100%" stopColor="#0a0e16" />
          </linearGradient>
          {/* Tone on the body, so it is lit from one side rather than filled. */}
          <linearGradient id="gai-lit" x1="0" y1="0" x2="1" y2="0.2">
            <stop offset="0%" stopColor="#000" stopOpacity="0.42" />
            <stop offset="58%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* ═══ CAMERA VIDEO ═══════════════════════════════════════════════
            A room, a person in it, and the furniture of a recording — drawn
            the way a camera resolves a dim room rather than the way an
            illustration describes one. The scene is a lit wall and a receding
            floor with a real vanishing point, the person is tonally modelled
            and motion-blurred (the limbs more than the trunk, because they
            travel faster), and the whole plate carries the vignette, sensor
            grain, compression blocking and scanlines that no drawing has.
            Set CCTV_PLATE to swap the drawing for a licensed still. */}
        {draw === "frame" && (
          <g clipPath="url(#gai-frame)">
            <rect x="0" y="0" width={W} height={H} className={styles.camGround} />

            {CCTV_PLATE ? (
              <image
                href={assetPath(CCTV_PLATE)}
                x="0"
                y="0"
                width={W}
                height={H}
                preserveAspectRatio="xMidYMid slice"
                className={styles.camPlate}
              />
            ) : (
              <>
                {/* ── The room, behind the plane of focus ── */}
                <g filter="url(#gai-dof)">
                  <rect x="-4" y="-4" width={W + 8} height={82} fill="url(#gai-wall)" />
                  <rect x="-4" y="74" width={W + 8} height={H - 70} fill="url(#gai-floor)" />

                  {/* The floor recedes to a vanishing point on the horizon.
                      Spacing tightens with distance — that is perspective, and
                      it is what evenly spaced lines were failing to be. */}
                  <g className={styles.camPerspective}>
                    {[-70, -28, 6, 40, 78, 120, 168, 220].map((x) => (
                      <path key={x} d={`M${x} ${H + 6}L${VP[0]} ${VP[1]}`} />
                    ))}
                    {[0.1, 0.24, 0.42, 0.64, 0.88].map((f) => {
                      const y = VP[1] + (H + 6 - VP[1]) * f * f;
                      return <path key={f} d={`M-4 ${y}H${W + 4}`} />;
                    })}
                  </g>

                  {/* Where the wall meets the floor, and the skirting under it. */}
                  <path d={`M-4 74H${W + 4}`} className={styles.camEdge} />
                  <path d={`M-4 77.4H${W + 4}`} className={styles.camSkirt} />

                  {/* A doorway, and the light it puts on the floor. */}
                  <rect x="14" y="34" width="24" height="40" className={styles.camDoor} />
                  <path
                    d="M14 74 L38 74 L52 162 L-6 162 Z"
                    fill="url(#gai-spill)"
                    className={styles.camSpill}
                  />
                  {/* Ceiling luminaire and the pool it throws. */}
                  <ellipse cx="104" cy="10" rx="21" ry="4.2" className={styles.camLamp} />
                  <ellipse cx="96" cy="112" rx="52" ry="20" className={styles.camPool} />
                </g>

                {/* ── The person, on the plane of focus ──
                    Trunk and head take the light; the limbs carry the smear.
                    The tonal wash over the top is what stops the fills reading
                    as flat colour. */}
                <g className={styles.camShadowWrap}>
                  <ellipse cx="76" cy={GROUND + 1} rx="27" ry="3.4" className={styles.camShadow} />
                </g>
                <g filter="url(#gai-motion)">
                  <Body tone className={styles.camBody} />
                </g>
                <g filter="url(#gai-motion-limb)" className={styles.camSmear}>
                  <Body tone className={styles.camBody} />
                </g>
                <g className={styles.camModel} clipPath="url(#gai-frame)">
                  <rect x="40" y="20" width="76" height={GROUND - 18} fill="url(#gai-lit)" />
                </g>
              </>
            )}

            {/* ── The recording itself ── */}
            <rect x="0" y="0" width={W} height={H} fill="url(#gai-vignette)" />
            {/* Macroblocking: the artifact every compressed camera stream has
                and no drawing does. Faint, irregular, and only in the dark. */}
            <g className={styles.camBlocks}>
              {[
                [8, 88], [24, 88], [8, 104], [112, 40], [128, 40], [120, 128],
                [40, 136], [56, 136], [96, 16], [136, 96],
              ].map(([x, y]) => (
                <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" />
              ))}
            </g>
            <rect
              x="0"
              y="0"
              width={W}
              height={H}
              filter="url(#gai-grain)"
              className={styles.camGrain}
            />
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
            <g filter="url(#gai-seg)">
              <Body className={styles.mask} />
              {/* The fragment a segmenter leaves near the trailing foot, where
                  shoe and shadow are the same few pixels. One, small, and on
                  the ground line — an artifact, not decoration. */}
              <ellipse cx="44" cy={GROUND - 3} rx="3.1" ry="1.7" className={styles.maskFleck} />
            </g>
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
            {/* The floor the path is drawn on, in perspective — a trajectory
                is a route through a place, and without the place it is a
                line. */}
            <g className={styles.trajFloor}>
              {[-10, 40, 90, 140, 180].map((x) => (
                <path key={x} d={`M${x} ${H - 6}L${VP[0]} ${VP[1] + 30}`} />
              ))}
              {[0.16, 0.34, 0.56, 0.82].map((f) => {
                const y = VP[1] + 14 + (H - 6 - VP[1] - 14) * f * f;
                return <path key={f} d={`M4 ${y}H${W - 4}`} />;
              })}
            </g>
            <path d={`M6 ${GROUND}H${W - 6}`} className={styles.trajGround} />

            {/* THE PATH IS THE SUBJECT. The walker is one small marker at the
                head of it, not a body with a line attached: what this
                representation keeps is where somebody went and how fast, and
                the drawing has to say that before it says anything else. */}
            <path d={smoothPath(TRAIL)} className={styles.trailGlow} />
            <path
              d={smoothPath(TRAIL)}
              className={styles.trailLine}
              stroke="url(#gai-trail)"
            />

            {/* Observation ticks. Evenly spaced in TIME, so their spacing on
                the path is the speed. */}
            {TRAIL_TICKS.map((i, k) => {
              const [x, y] = TRAIL[i];
              const last = k === TRAIL_TICKS.length - 1;
              return (
                <g key={i} style={{ opacity: 0.3 + (k / (TRAIL_TICKS.length - 1)) * 0.7 }}>
                  <path d={`M${x} ${y - 3.4}V${y + 3.4}`} className={styles.trailTick} />
                  <circle cx={x} cy={y} r={last ? 2.2 : 1.5} className={styles.trailDot} />
                </g>
              );
            })}

            {/* Where the walker is now: a position marker on the path, with the
                ground point under it. Two rings and a dot — the same vocabulary
                the rest of the site uses for "a thing at a place". */}
            {(() => {
              const [x, y] = TRAIL[TRAIL.length - 1];
              return (
                <g>
                  <path d={`M${x} ${y}V${GROUND - 2}`} className={styles.trajDrop} />
                  <ellipse cx={x} cy={GROUND - 1} rx="7" ry="2.2" className={styles.trajFoot} />
                  <circle cx={x} cy={y} r="7.5" className={styles.centroidHalo} />
                  <circle cx={x} cy={y} r="3.4" className={styles.centroid} />
                  <text x={x - 7} y={y - 8} textAnchor="end" className={styles.trajTag}>
                    CENTROID
                  </text>
                </g>
              );
            })()}

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

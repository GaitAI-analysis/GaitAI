import {
  GAIT_HEAD,
  GAIT_NECK,
  GAIT_PHASES,
  type Pt,
} from "@/components/visuals/gait-phases";
import { PoseFrame, smoothPath } from "./PoseFrame";
import styles from "./observatory.module.css";

/**
 * The hero, built as a motion-capture lab rather than as a heading over an
 * empty background.
 *
 * WHAT IS DRAWN, AND WHY IT IS THE HERO
 * The page's claim is a published record about human movement. So the first
 * screen shows the thing being studied, in the form the research studies it:
 * one stride sampled at six captured frames, the joint trajectories those
 * frames trace, and the temporal signal the trajectories reduce to. Read
 * left to right it says HUMAN GAIT → TEMPORAL SIGNAL → REPRESENTATION without
 * a sentence of help.
 *
 * The six frames come from `gait-phases.ts` — the same five canonical gait
 * events the rest of the site draws with, plus the next heel strike, so the
 * sequence closes a full cycle instead of stopping mid-stride. Nothing is a
 * rotated copy of one silhouette: every joint is placed from the data, which
 * is why the trajectory curves through the frames are real curves and not
 * decoration.
 *
 * COMPOSITION
 * The lab is a full-bleed layer, not a picture in a box: the frames sit in the
 * right two-thirds, the signal band runs the whole width under them, and a
 * mask fades the left edge so the headline sits on clean ground. Annotations
 * are set at the smallest legible size and the lowest legible contrast — they
 * are instrument labels, and an instrument label that shouts is a poster.
 *
 * MOTION
 * One entrance, then rest: the frames arrive in stride order, the trajectories
 * draw, the signal draws, and a single sample point travels the signal on a
 * slow loop. Nothing bobs, nothing spins, nothing follows the pointer.
 */

/* One full stride: five canonical events plus the next heel strike. */
const FRAMES = [0, 1, 2, 3, 4, 0] as const;

const W = 1440;
const H = 620;

/** Frame geometry. The baseline climbs to the right and alternates a little,
    so the frames read as captured samples rather than as a chorus line.

    The baselines were 86 units lower — about 110px on a 1440 desktop, where
    the viewBox is scaled to cover. That put the whole sequence in the bottom
    45% of the hero, reading as though it were sliding out of frame. Raising
    it clears room above for the instrument cluster and leaves the capture
    floor and the signal band as two distinct strips beneath the figures
    rather than one crowded one. */
const SCALE = 2.05;
const X0 = 662;
const STEP = 116;
const BASE = [420, 406, 414, 394, 402, 382] as const;

/** The capture floor: just under the lowest foot. */
const FLOOR = 532;

/**
 * WHICH FRAME IS THE ANALYTICAL FOCUS, AND WHY THIS ONE.
 *
 * The scene needed one pose to be the measurement rather than six poses of
 * equal weight. It has to be the swing frame: reading the knee angle off the
 * keyframes, swing is the only captured event with real flexion (42°) —
 * heel strike, loading, mid-stance and toe-off all sit within 4° of straight,
 * so an angle arc on any of them would annotate a straight leg.
 */
const FOCUS = 4;

/**
 * Visibility per frame. Deliberately not a linear ramp: the focus reads at
 * full strength, its two neighbours nearly so, and the outer frames stay
 * subdued, which is what makes the sequence read as depth through a cycle
 * rather than as a fade.
 */
const FRAME_OPACITY = [0.34, 0.5, 0.74, 0.88, 1, 0.6] as const;

const figureClasses = {
  bone: styles.labBone,
  boneFar: styles.labBoneFar,
  joint: styles.labJoint,
  head: styles.labHead,
  contact: styles.labContact,
};

/** Absolute position of a frame's origin (pelvis). */
const originOf = (i: number): Pt => [X0 + i * STEP, BASE[i]];

/**
 * A joint's path across the six frames, in absolute coordinates. This is the
 * whole reason the frames are data rather than art: the trajectory is sampled
 * from the same keyframes the figures are drawn from, so the curve genuinely
 * passes through each pose's joint.
 */
function trajectory(pick: (i: number) => Pt): string {
  return smoothPath(
    FRAMES.map((_, i) => {
      const [ox, oy] = originOf(i);
      const [jx, jy] = pick(i);
      return [ox + jx * SCALE, oy + jy * SCALE] as Pt;
    }),
  );
}

/** Stride signal: a vertical-oscillation curve over the captured cycle. */
function strideSignal(y0: number, amp: number) {
  const pts: Pt[] = Array.from({ length: 97 }, (_, i) => {
    const t = i / 96;
    /* Two peaks per stride — one per step — with the trailing step lower, the
       asymmetry the annotation beside it names. */
    const v =
      Math.sin(t * Math.PI * 4) * (t < 0.5 ? 1 : 0.62) +
      Math.sin(t * Math.PI * 8) * 0.16;
    return [120 + t * 1200, y0 - v * amp] as Pt;
  });
  return smoothPath(pts);
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Deterministic 0-1 from an integer — no randomness in a rendered figure. */
const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * THE FOCAL MEASUREMENT — knee flexion on the swing frame.
 *
 * Drawn the way flexion is actually measured: the thigh's line extended
 * through the knee as the reference axis, then the arc from that axis round to
 * the shank. The value is COMPUTED from the keyframe the figure is drawn from,
 * so it is a property of the pose on screen and cannot drift from it — it is
 * not a claim about any person, any capture or any product.
 */
function KneeAngle({ origin }: { origin: Pt }) {
  const phase = GAIT_PHASES[FRAMES[FOCUS]];
  const abs = (p: Pt): Pt => [origin[0] + p[0] * SCALE, origin[1] + p[1] * SCALE];
  const [hx, hy] = abs(phase.nearLeg[0]);
  const [kx, ky] = abs(phase.nearLeg[1]);
  const [ax, ay] = abs(phase.nearLeg[2]);

  /* Unit vectors: down the thigh, and down the shank. */
  const tl = Math.hypot(kx - hx, ky - hy);
  const ux = (kx - hx) / tl;
  const uy = (ky - hy) / tl;
  const sl = Math.hypot(ax - kx, ay - ky);
  const vx = (ax - kx) / sl;
  const vy = (ay - ky) / sl;

  /* Flexion: the angle between the extended thigh axis and the shank. */
  const flexion = Math.round(
    (Math.acos(Math.max(-1, Math.min(1, ux * vx + uy * vy))) * 180) / Math.PI,
  );

  const R = 34;
  const a1: Pt = [kx + ux * R, ky + uy * R];
  const a2: Pt = [kx + vx * R, ky + vy * R];
  /* Sweep direction from the cross product, so the arc always takes the
     short way round whichever way the leg is bent. */
  const sweep = ux * vy - uy * vx > 0 ? 1 : 0;

  return (
    <g className={styles.labFocus}>
      {/* The reference axis: the thigh, extended through the knee. */}
      <line
        className={styles.labFocusAxis}
        x1={r1(kx)}
        y1={r1(ky)}
        x2={r1(kx + ux * 36)}
        y2={r1(ky + uy * 36)}
      />
      <path
        className={styles.labFocusArc}
        d={`M ${r1(a1[0])} ${r1(a1[1])} A ${R} ${R} 0 0 ${sweep} ${r1(
          a2[0],
        )} ${r1(a2[1])}`}
      />
      {/* Degree ticks along the arc — an instrument scale, not a gauge. */}
      {[0.25, 0.5, 0.75].map((t) => {
        const th = Math.atan2(uy, ux) * (1 - t) + Math.atan2(vy, vx) * t;
        return (
          <line
            key={t}
            className={styles.labFocusTick}
            x1={r1(kx + Math.cos(th) * (R - 3))}
            y1={r1(ky + Math.sin(th) * (R - 3))}
            x2={r1(kx + Math.cos(th) * (R + 3))}
            y2={r1(ky + Math.sin(th) * (R + 3))}
          />
        );
      })}
      <circle className={styles.labFocusJoint} cx={r1(kx)} cy={r1(ky)} r={4.6} />
      <circle className={styles.labFocusRing} cx={r1(kx)} cy={r1(ky)} r={9} />
      {/* Placed up and to the right of the joint rather than on the arc's
          bisector, which put it on the ankle trajectory and the frame id. */}
      <text className={styles.labFocusValue} x={r1(kx + 30)} y={r1(ky - 14)}>
        {flexion}°
      </text>
    </g>
  );
}

/**
 * THE INSTRUMENT CLUSTER — the upper-right quadrant.
 *
 * That corner was empty, which left the composition sitting in its own bottom
 * half. This fills it the way an analysis environment would: a coordinate
 * frame with ticks, a feature-vector matrix, a sparse point cloud with a few
 * links, a short temporal readout and a couple of measurement markers.
 *
 * All of it is background-level by construction — hairlines at a fraction of
 * the figures' contrast, nothing filled, nothing large enough to read as a
 * panel. Geometry is seeded, never random.
 */
function InstrumentCluster() {
  /* Row A · a feature-vector matrix and a coordinate frame */
  const mx = 880;
  const my = 88;
  const cell = 13;
  const cols = 8;
  const rows = 4;

  const cx0 = 1012;
  const cy0 = 88;
  const cw = 136;
  const ch = 62;

  /* Row B · a point cloud and a temporal readout */
  const cloud = Array.from({ length: 26 }, (_, i) => ({
    x: r1(882 + rnd(i * 3 + 1) * 124),
    y: r1(180 + rnd(i * 7 + 2) * 74),
    r: r1(0.8 + rnd(i * 11 + 5) * 1.3),
    lit: rnd(i * 13 + 3) > 0.74,
  }));

  const wave = Array.from({ length: 61 }, (_, i) => {
    const t = i / 60;
    const y =
      218 +
      Math.sin(t * Math.PI * 6) * 9 +
      Math.sin(t * Math.PI * 13 + 1.1) * 3.4;
    return `${r1(1030 + t * 120)},${r1(y)}`;
  }).join(" ");

  return (
    <g className={styles.labInstr}>
      {/* a · feature-vector matrix */}
      <g>
        {Array.from({ length: rows }, (_, row) =>
          Array.from({ length: cols }, (_, col) => {
            const lit = (row * cols + col) % 7 === 0 || (col === 5 && row === 2);
            return (
              <rect
                key={`${row}-${col}`}
                className={lit ? styles.labInstrCellLit : styles.labInstrCell}
                x={mx + col * cell}
                y={my + row * cell}
                width={cell - 3}
                height={cell - 3}
                rx={1}
              />
            );
          }),
        )}
      </g>

      {/* b · coordinate frame with ticks and two measurement markers */}
      <g>
        <line x1={cx0} y1={cy0} x2={cx0} y2={cy0 + ch} />
        <line x1={cx0} y1={cy0 + ch} x2={cx0 + cw} y2={cy0 + ch} />
        {Array.from({ length: 7 }, (_, i) => (
          <line
            key={`tx${i}`}
            x1={r1(cx0 + (i + 1) * (cw / 7))}
            y1={cy0 + ch}
            x2={r1(cx0 + (i + 1) * (cw / 7))}
            y2={cy0 + ch - (i % 3 === 0 ? 7 : 4)}
          />
        ))}
        {Array.from({ length: 4 }, (_, i) => (
          <line
            key={`ty${i}`}
            x1={cx0}
            y1={r1(cy0 + i * (ch / 4))}
            x2={cx0 + (i % 2 === 0 ? 7 : 4)}
            y2={r1(cy0 + i * (ch / 4))}
          />
        ))}
        {/* A short plotted segment between two markers. */}
        <line
          className={styles.labInstrDash}
          x1={cx0 + 34}
          y1={cy0 + 40}
          x2={cx0 + 96}
          y2={cy0 + 16}
        />
        <circle className={styles.labInstrLit} cx={cx0 + 34} cy={cy0 + 40} r={2.4} />
        <circle className={styles.labInstrLit} cx={cx0 + 96} cy={cy0 + 16} r={1.9} />
      </g>

      {/* c · point cloud with a few links */}
      <g>
        {cloud.slice(0, 6).map((point, i) => {
          const other = cloud[(i * 5 + 3) % cloud.length];
          return (
            <line
              key={`cl${i}`}
              className={styles.labInstrDash}
              x1={point.x}
              y1={point.y}
              x2={other.x}
              y2={other.y}
            />
          );
        })}
        {cloud.map((point, i) => (
          <circle
            key={i}
            className={point.lit ? styles.labInstrLit : styles.labInstrDot}
            cx={point.x}
            cy={point.y}
            r={point.r}
          />
        ))}
      </g>

      {/* d · temporal readout */}
      <polyline className={styles.labInstrWave} points={wave} />
      <line
        className={styles.labInstrBase}
        x1={1030}
        y1={248}
        x2={1150}
        y2={248}
      />
    </g>
  );
}

/** Instrument annotation: a hairline leader and a label. */
function Note({
  x,
  y,
  to,
  label,
  anchor = "start",
  order = 0,
}: {
  x: number;
  y: number;
  to?: Pt;
  label: string;
  anchor?: "start" | "end" | "middle";
  order?: number;
}) {
  return (
    <g className={styles.labNote} style={{ ["--l-i" as string]: order }}>
      {to && (
        <line className={styles.labLeader} x1={x} y1={y} x2={to[0]} y2={to[1]} />
      )}
      <text className={styles.labNoteText} x={x} y={y - 6} textAnchor={anchor}>
        {label}
      </text>
    </g>
  );
}

export function ResearchHeroLab() {
  const signalY = 582;

  /* Joint picks, per frame, in the figure's local coordinates. */
  const ankle = (i: number) => GAIT_PHASES[FRAMES[i]].nearLeg[2];
  const knee = (i: number) => GAIT_PHASES[FRAMES[i]].nearLeg[1];
  const hip = (i: number) => GAIT_PHASES[FRAMES[i]].nearLeg[0];
  const head = () => GAIT_HEAD;

  /* Heel-strike events, for the ticks that tie the signal to the frames. */
  const events = FRAMES.map((_, i) => originOf(i)[0]);

  return (
    <svg
      aria-hidden="true"
      className={styles.lab}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* The left-edge fade that keeps the headline off the figures is a CSS
            mask on the <svg> itself, not an SVG <mask> here. An SVG mask fails
            CLOSED — anything that stops it resolving hides the whole hero —
            and that is exactly what happened: the lab rendered nothing while
            the mask was in place. A CSS mask-image fails open. */}
        <linearGradient id="lab-signal" gradientUnits="userSpaceOnUse" x1="120" x2="1320">
          <stop offset="0" className={styles.labStopCyan} />
          <stop offset="0.55" className={styles.labStopBlue} />
          <stop offset="1" className={styles.labStopViolet} />
        </linearGradient>
      </defs>

      <g>
        {/* ── Surveyed ground: axis ticks and a capture floor ── */}
        <g className={styles.labGrid}>
          {Array.from({ length: 49 }, (_, i) => {
            const x = 120 + i * 25;
            return (
              <line
                key={x}
                x1={x}
                y1={FLOOR}
                x2={x}
                y2={FLOOR + (i % 4 === 0 ? 10 : 5)}
              />
            );
          })}
          <line x1={120} y1={FLOOR} x2={1320} y2={FLOOR} />
          {/* Two reference lines, in the upper band where the instrument
              cluster sits. Three of them used to run under the figures, adding
              to the parallel-line problem the trajectories already had. */}
          {[164, 262].map((y) => (
            <line key={y} className={styles.labGridSoft} x1={876} y1={y} x2={1154} y2={y} />
          ))}
        </g>

        {/* ── Joint trajectories, sampled through the captured frames ──
            Three, not five. Head, neck, wrist, knee and ankle drew five
            near-parallel curves across the whole scene, which read as
            decorative waves; head, hip and ankle are the three a gait study
            actually plots — the trunk's vertical oscillation, the pelvis, and
            the foot's swing arc — and they separate enough to be read
            individually. */}
        <g>
          {[
            { d: trajectory(head), i: 0 },
            { d: trajectory(hip), i: 1 },
            { d: trajectory(ankle), i: 2 },
          ].map(({ d, i }) => (
            <path
              key={i}
              className={styles.labTrajPath}
              d={d}
              style={{ ["--l-i" as string]: i }}
            />
          ))}
        </g>

        {/* ── The captured frames ── */}
        {FRAMES.map((phaseIndex, i) => {
          const [ox, oy] = originOf(i);
          return (
            /* The translate lives on an OUTER group and the animation on an
               inner one. A CSS `transform` animation REPLACES an element's
               `transform` attribute rather than composing with it, so animating
               the positioned group sent all six figures to the SVG origin —
               which is exactly the bug that made this hero look empty. */
            <g key={i} transform={`translate(${ox} ${oy})`}>
              <g
                className={`${styles.labFrame} ${
                  i === FOCUS ? styles.labFrameFocus : ""
                }`}
                style={{
                  ["--l-i" as string]: i,
                  ["--l-op" as string]: FRAME_OPACITY[i],
                }}
              >
                <PoseFrame
                  phase={GAIT_PHASES[phaseIndex]}
                  s={SCALE}
                  classes={figureClasses}
                  showContacts
                />
                {/* Frame index, at instrument scale. */}
                <text className={styles.labFrameId} x={-4} y={70}>
                  {String(i + 1).padStart(2, "0")}
                </text>
              </g>
            </g>
          );
        })}

        {/* ── The upper-right instrument cluster ── */}
        <InstrumentCluster />

        {/* ── The analytical focus: knee flexion on the swing frame ── */}
        <KneeAngle origin={originOf(FOCUS)} />

        {/* ── Trajectory sample nodes, on the ankle path ── */}
        <g className={styles.labTrajNodes}>
          {FRAMES.map((_, i) => {
            const [ox, oy] = originOf(i);
            const [jx, jy] = ankle(i);
            return (
              <circle
                key={i}
                cx={ox + jx * SCALE}
                cy={oy + jy * SCALE}
                r={3}
                style={{ ["--l-i" as string]: i }}
              />
            );
          })}
        </g>

        {/* ── The temporal signal the trajectories reduce to ── */}
        <g>
          <path className={styles.labSignalPath} d={strideSignal(signalY, 21)} />
          <path
            className={styles.labSignalFlow}
            d={strideSignal(signalY, 21)}
            pathLength={100}
          />
          {/* Stride events, aligned to the captured frames. */}
          {events.map((x, i) => (
            <g key={i} style={{ ["--l-i" as string]: i }}>
              <line
                className={styles.labEventStem}
                x1={x}
                y1={signalY + 24}
                x2={x}
                y2={signalY - 24}
              />
              <circle
                className={styles.labEventNode}
                cx={x}
                cy={signalY}
                r={i === 0 || i === 5 ? 3.4 : 2.2}
              />
            </g>
          ))}
        </g>

        {/* ── Instrument annotations. Deliberately near the noise floor. ── */}
        {/* POSE moved off the headline column: at x = X0 - 96 it sat behind
            the lede. It now leads into the first captured frame. */}
        <Note
          x={X0 + 4}
          y={BASE[0] - 138}
          to={[X0 + 2, BASE[0] - 92]}
          label="POSE"
          order={0}
        />
        {/* Pointing at a hip joint on the hip trajectory, which is the curve
            it names. */}
        <Note
          x={X0 + STEP * 2 - 26}
          y={BASE[2] - 128}
          to={[X0 + STEP * 2, BASE[2] - 4]}
          label="HIP ANGLE"
          order={1}
        />
        {/* Tied to the focal arc. */}
        <Note
          x={X0 + STEP * FOCUS + 68}
          y={BASE[FOCUS] + 96}
          to={[X0 + STEP * FOCUS + 30, BASE[FOCUS] + 62]}
          label="KNEE FLEXION"
          order={2}
        />
        <Note x={1046} y={signalY - 26} label="ASYMMETRY" order={3} />
        <Note x={148} y={signalY - 26} label="STRIDE" order={4} />
        <Note x={148} y={FLOOR - 8} label="CADENCE" order={5} />
        <Note
          x={1288}
          y={signalY - 26}
          label="TEMPORAL SIGNAL"
          anchor="end"
          order={6}
        />
        <Note x={880} y={78} label="FEATURE VECTOR" order={7} />
      </g>
    </svg>
  );
}

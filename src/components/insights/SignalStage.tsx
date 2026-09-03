import { GAIT_HEAD, GAIT_PHASES, type Pt } from "@/components/visuals/gait-phases";
import { PoseFrame, smoothPath } from "@/components/research/PoseFrame";
import scene from "./scenes.module.css";
import styles from "./signal.module.css";

/**
 * STORY 01's TRANSFORMATION — a walk becoming a movement representation.
 *
 * WHAT THIS REPLACES, AND WHY
 * The previous version was three panels: a frame, a stick skeleton, a sine
 * wave. That is the cheapest diagram in the genre, and it undersold the one
 * essay the whole page is built around. It is now the five transformations the
 * essay actually walks through:
 *
 *   01 CAPTURE        the body as mass, inside a real capture frame
 *   02 GAIT PHASES    one stride at its five canonical events, earlier events
 *                     ghosted behind the current one
 *   03 TRAJECTORIES   the paths those joints accumulate across the cycle
 *   04 FEATURES       the spatio-temporal field, with cadence markers — what
 *                     a feature representation looks like once geometry has
 *                     been summarised over time
 *   05 MOTION DNA     the dimensional movement signature that is kept
 *
 * TWO ROWS, NOT FIVE COLUMNS. Five stages across the story's visual slot
 * rendered every stage at a third of legible size. The split is also the
 * argument: the top row is still a body, the bottom row is no longer one, and
 * the signal runs between them.
 *
 * BIOMECHANICS
 * Each figure is a different pose from `gait-phases.ts` — heel strike, loading
 * response, mid-stance, toe-off, swing — every joint placed from data. Arm/leg
 * opposition, knee flexion and pelvic rise are in the keyframes, so this is a
 * stride rather than one silhouette with its limbs nudged five times.
 *
 * NOTHING HERE IS A MEASUREMENT. No axis carries a unit and no element carries
 * a value: this repository holds no benchmark to quote.
 *
 * It is drawn to be worth looking at with every animation disabled — the only
 * motion is a staggered fade, and the composition is complete without it.
 */

const W = 600;
const H = 430;

const r1 = (n: number) => Math.round(n * 10) / 10;

/* ── Row 1: the body ── */
const ROW1_GROUND = 202;
const CAP_S = 1.6;
const CAP_X = 92;
const CAP_PHASE = GAIT_PHASES[0]; // heel strike: unmistakably a stride
const PH_S = 1.12;
const PH_X = 350;
const PH_STEP = 40;

/* ── Row 2: the representation ── */
const ROW2_Y = 330;
const TR_X = 108;
const TR_S = 1.05;
const TR_STEP = 22;
const FIELD_X = 300;
const DNA_X = 500;

const chain = (list: readonly Pt[], s: number) =>
  list.map(([x, y]) => `${r1(x * s)},${r1(y * s)}`).join(" ");

/**
 * A joint's path across the five gait events, drifting right so the curve
 * reads as travel through time rather than a closed loop in place. The points
 * come from the same keyframes the figures are drawn from, so these are the
 * real paths of the real poses — `lift` included, since the pelvis rises and
 * falls through the cycle and the figures above are drawn with it.
 *
 * Each trail is normalised into its own band. Plotted on one shared vertical
 * scale, the head and the wrist barely move in y and rendered as dead straight
 * lines, which said the opposite of what the panel is for. Normalising is
 * honest here because the panel carries no axis and no unit: it shows the
 * SHAPE each joint traces, four channels stacked, not their magnitudes.
 */
function trail(
  pick: (phase: (typeof GAIT_PHASES)[number]) => Pt,
  bandTop: number,
  bandHeight: number,
): string {
  const raw = GAIT_PHASES.map((phase) => {
    const [lx, ly] = pick(phase);
    return { lx, ly: ly + phase.lift };
  });
  const ys = raw.map((v) => v.ly);
  const min = Math.min(...ys);
  const span = Math.max(...ys) - min || 1;

  return smoothPath(
    raw.map((v, i) => [
      r1(TR_X + v.lx * TR_S + (i - 2) * TR_STEP),
      r1(bandTop + ((v.ly - min) / span) * bandHeight),
    ] as Pt),
  );
}

/** The four channels, top to bottom, and the band each occupies. */
const TRAILS = [
  { pick: () => GAIT_HEAD, top: 296, h: 14 },
  { pick: (p: (typeof GAIT_PHASES)[number]) => p.nearArm[2], top: 318, h: 16 },
  { pick: (p: (typeof GAIT_PHASES)[number]) => p.nearLeg[1], top: 342, h: 16 },
  { pick: (p: (typeof GAIT_PHASES)[number]) => p.nearLeg[2], top: 366, h: 18 },
] as const;

/** Deterministic cell weight — a field, not a reading. */
const cellWeight = (c: number, r: number) =>
  Math.abs(
    Math.sin(c * 0.9 + r * 1.7) * 0.55 + Math.cos(c * 1.3 - r * 0.6) * 0.45,
  );

/**
 * The signature. Twelve samples per cycle with the trailing half of the stride
 * lower — the same left/right asymmetry the rest of the site draws gait with,
 * which is what stops it reading as a sunburst.
 */
const DNA = Array.from({ length: 60 }, (_, i) => {
  const inCycle = i % 12;
  const swing = Math.abs(Math.sin((inCycle / 12) * Math.PI * 2));
  return 2 + swing * 17 * (inCycle < 6 ? 1 : 0.6);
});

/** The signal between the two rows: two steps per stride, trailing one lower. */
const RUN = smoothPath(
  Array.from({ length: 97 }, (_, i) => {
    const t = i / 96;
    const v =
      Math.sin(t * Math.PI * 6) * (t < 0.5 ? 1 : 0.62) +
      Math.sin(t * Math.PI * 12) * 0.12;
    return [r1(28 + t * (W - 56)), r1(246 - v * 12)] as Pt;
  }),
);

export function SignalStage() {
  const capY = ROW1_GROUND - 48 * CAP_S;
  const phY = ROW1_GROUND - 48 * PH_S;

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${W} ${H}`}
      className={scene.scene}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="ss-run" gradientUnits="userSpaceOnUse" x1="28" x2={W - 28}>
          <stop offset="0" className={styles.ssStopCyan} />
          <stop offset="0.55" className={styles.ssStopBlue} />
          <stop offset="1" className={styles.ssStopViolet} />
        </linearGradient>
        <radialGradient id="ss-dna">
          <stop offset="0" className={styles.ssStopViolet} stopOpacity="0.3" />
          <stop offset="1" className={styles.ssStopViolet} stopOpacity="0" />
        </radialGradient>
      </defs>

      <line
        className={scene.scFloor}
        x1={28}
        y1={ROW1_GROUND + 4}
        x2={W - 28}
        y2={ROW1_GROUND + 4}
      />

      {/* ═══ 01 · CAPTURE ═══════════════════════════════════════════════ */}
      <g className={styles.ssIn} style={{ ["--s-i" as string]: 0 }}>
        <text className={scene.scLabel} x={30} y={26}>
          01 CAPTURE
        </text>

        {/* The frame a camera actually produces, with its corner marks. */}
        <rect
          className={styles.ssFrame}
          x={CAP_X - 62}
          y={46}
          width={128}
          height={ROW1_GROUND - 30}
          rx={3}
        />
        {(
          [
            [CAP_X - 62, 46, 1, 1],
            [CAP_X + 66, 46, -1, 1],
            [CAP_X - 62, ROW1_GROUND + 16, 1, -1],
            [CAP_X + 66, ROW1_GROUND + 16, -1, -1],
          ] as const
        ).map(([x, y, sx, sy], i) => (
          <path
            key={i}
            className={styles.ssCorner}
            d={`M${x} ${y + 11 * sy} L${x} ${y} L${x + 11 * sx} ${y}`}
          />
        ))}

        <g transform={`translate(${CAP_X} ${capY})`}>
          {/* Mass, not outline: at capture the body is still pixels. */}
          <g className={styles.ssMass}>
            <polyline points={chain(CAP_PHASE.farArm, CAP_S)} />
            <polyline points={chain(CAP_PHASE.farLeg, CAP_S)} />
            <line
              x1={0}
              y1={0}
              x2={r1(GAIT_HEAD[0] * CAP_S)}
              y2={r1(GAIT_HEAD[1] * CAP_S)}
            />
            <polyline points={chain(CAP_PHASE.nearLeg, CAP_S)} />
            <polyline points={chain(CAP_PHASE.nearArm, CAP_S)} />
            <circle
              className={styles.ssMassHead}
              cx={r1(GAIT_HEAD[0] * CAP_S)}
              cy={r1(GAIT_HEAD[1] * CAP_S)}
              r={r1(6.6 * CAP_S)}
            />
          </g>
          <ellipse
            className={styles.ssShadow}
            cx={6}
            cy={r1(48 * CAP_S)}
            rx={r1(17 * CAP_S)}
            ry={r1(2.4 * CAP_S)}
          />
        </g>
      </g>

      {/* ═══ 02 · GAIT PHASES ═══════════════════════════════════════════ */}
      <g className={styles.ssIn} style={{ ["--s-i" as string]: 1 }}>
        <text className={scene.scLabel} x={PH_X - 92} y={26}>
          02 GAIT PHASES
        </text>

        {GAIT_PHASES.map((phase, i) => (
          <g
            key={phase.id}
            transform={`translate(${PH_X + (i - 2) * PH_STEP} ${phY})`}
          >
            <g
              className={
                i === GAIT_PHASES.length - 1 ? styles.ssLead : styles.ssGhost
              }
              style={{ ["--g-i" as string]: i }}
            >
              <PoseFrame
                phase={phase}
                s={PH_S}
                classes={{
                  bone: styles.ssBone,
                  boneFar: styles.ssBoneFar,
                  joint: styles.ssJoint,
                  head: styles.ssHead,
                }}
                showFar={i === GAIT_PHASES.length - 1}
              />
            </g>
          </g>
        ))}

        {/* Phase-transition arcs: the event boundaries of one stride. */}
        {GAIT_PHASES.slice(0, -1).map((phase, i) => {
          const x1 = PH_X + (i - 2) * PH_STEP;
          const x2 = PH_X + (i - 1) * PH_STEP;
          return (
            <g key={phase.id}>
              <path
                className={styles.ssArc}
                d={`M${x1} ${ROW1_GROUND + 14} Q${(x1 + x2) / 2} ${ROW1_GROUND + 30} ${x2} ${ROW1_GROUND + 14}`}
              />
              <circle
                className={styles.ssEvent}
                cx={x1}
                cy={ROW1_GROUND + 14}
                r={2}
              />
            </g>
          );
        })}
        <circle
          className={styles.ssEvent}
          cx={PH_X + 2 * PH_STEP}
          cy={ROW1_GROUND + 14}
          r={2}
        />
      </g>

      {/* ── One signal, between the body and its representation ── */}
      <path className={styles.ssRun} d={RUN} />

      {/* ═══ 03 · TRAJECTORIES ══════════════════════════════════════════ */}
      <g className={styles.ssIn} style={{ ["--s-i" as string]: 2 }}>
        <text className={scene.scLabel} x={30} y={286}>
          03 TRAJECTORIES
        </text>

        {/* Four channels, each in its own band; the body is already gone. */}
        {TRAILS.map((channel, i) => (
          <path
            key={i}
            className={styles.ssTrail}
            d={trail(channel.pick, channel.top, channel.h)}
            style={{ ["--g-i" as string]: i }}
          />
        ))}

        {/* Where each event fell on the ankle channel. */}
        {(() => {
          const channel = TRAILS[TRAILS.length - 1];
          const raw = GAIT_PHASES.map((phase) => {
            const [lx, ly] = channel.pick(phase);
            return { lx, ly: ly + phase.lift };
          });
          const ys = raw.map((v) => v.ly);
          const min = Math.min(...ys);
          const span = Math.max(...ys) - min || 1;
          return raw.map((v, i) => (
            <circle
              key={GAIT_PHASES[i].id}
              className={styles.ssTrailNode}
              cx={r1(TR_X + v.lx * TR_S + (i - 2) * TR_STEP)}
              cy={r1(channel.top + ((v.ly - min) / span) * channel.h)}
              r={2.2}
            />
          ));
        })()}

        {/* Cadence markers, off the same cycle. */}
        <g className={styles.ssMarkers}>
          <line x1={TR_X - 66} y1={400} x2={TR_X + 66} y2={400} />
          {Array.from({ length: 13 }, (_, i) => {
            const x = TR_X - 66 + i * 11;
            return (
              <line
                key={i}
                x1={x}
                y1={400}
                x2={x}
                y2={400 - (i % 4 === 0 ? 10 : 4)}
              />
            );
          })}
        </g>
      </g>

      {/* ═══ 04 · FEATURES ══════════════════════════════════════════════ */}
      <g className={styles.ssIn} style={{ ["--s-i" as string]: 3 }}>
        <text className={scene.scLabel} x={FIELD_X - 62} y={286}>
          04 FEATURES
        </text>

        <g className={styles.ssField}>
          {Array.from({ length: 9 }, (_, c) =>
            Array.from({ length: 6 }, (_, r) => (
              <rect
                key={`${c}-${r}`}
                x={FIELD_X - 62 + c * 14}
                y={300 + r * 14}
                width={12.2}
                height={12.2}
                rx={1.4}
                style={{ ["--w" as string]: cellWeight(c, r).toFixed(3) }}
              />
            )),
          )}
        </g>

        {/* The field's own axes. No units, because there is no measurement. */}
        <line
          className={styles.ssAxis}
          x1={FIELD_X - 68}
          y1={296}
          x2={FIELD_X - 68}
          y2={390}
        />
        <line
          className={styles.ssAxis}
          x1={FIELD_X - 68}
          y1={390}
          x2={FIELD_X + 66}
          y2={390}
        />
        <text className={scene.scTiny} x={FIELD_X - 68} y={404}>
          TIME →
        </text>
      </g>

      {/* ═══ 05 · MOTION DNA ════════════════════════════════════════════ */}
      <g className={styles.ssIn} style={{ ["--s-i" as string]: 4 }}>
        <text className={styles.ssLabelKey} x={DNA_X - 46} y={286}>
          05 MOTION DNA
        </text>

        <circle cx={DNA_X} cy={ROW2_Y + 14} r={62} fill="url(#ss-dna)" />
        <g className={styles.ssDna}>
          {DNA.map((h, i) => {
            const a = (i / DNA.length) * Math.PI * 2 - Math.PI / 2;
            const r0 = 22;
            return (
              <line
                key={i}
                className={i % 12 === 0 ? styles.ssDnaKey : undefined}
                x1={r1(DNA_X + Math.cos(a) * r0)}
                y1={r1(ROW2_Y + 14 + Math.sin(a) * r0)}
                x2={r1(DNA_X + Math.cos(a) * (r0 + h))}
                y2={r1(ROW2_Y + 14 + Math.sin(a) * (r0 + h))}
              />
            );
          })}
        </g>
        <circle
          className={styles.ssDnaCore}
          cx={DNA_X}
          cy={ROW2_Y + 14}
          r={22}
        />
      </g>
    </svg>
  );
}

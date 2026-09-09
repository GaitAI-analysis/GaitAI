import { GAIT_PHASES, type Pt } from "@/components/visuals/gait-phases";
import { PoseFrame } from "@/components/research/PoseFrame";
import type { CoverConcept } from "@/data/insights";
import { POSE_PHASE_FOR, estimatePose, poseFocusJoint } from "./experience/figures/pose-error-model";
import { symmetryState } from "./experience/figures/symmetry-model";
import { availabilityAt } from "./experience/figures/camera-model";
import { bodyMassPath, identityLedger } from "./experience/figures/identity-model";
import { CHAIN, COMPONENT_LABEL, OUTCOME_LABEL, outcomeFor, type ChainComponent } from "./experience/figures/system-model";
import { OBSERVATIONS, POPULATION, personalBand, populationCurve } from "./experience/figures/baseline-model";
import styles from "./covers.module.css";

/**
 * JOURNAL COVERS — one per essay, and no two alike.
 *
 * THE PROBLEM THESE REPLACE
 * The five essays shipped with five commissioned raster heroes, and four of
 * them were the same picture: one glowing wireframe walker, same pose, same
 * circular platform, same scale, ringed by the same UI panels. Read one at a
 * time on an article page that was fine. Read side by side in the archive
 * grid — which is where a reader decides what to open — the journal looked
 * templated, and the covers said nothing about which essay was which.
 *
 * WHY THESE ARE DRAWN RATHER THAN GENERATED IMAGES
 * Vector art cannot be blurry, stretched or badly cropped: it renders at the
 * display's density, the viewBox fixes the composition at every card width,
 * and there is no 230 kB asset per card to ship, cache or keep in sync with
 * the records. It is also the only way to guarantee the set shares one
 * instrument language — the same hairlines, the same mono labels, the same
 * palette — while being compositionally unlike each other. The same reasoning
 * the publications library already runs on.
 *
 * HOW THEY DIFFER, DELIBERATELY
 * Each cover is a different archetype, a different focal element and a
 * different number of human figures, because those three are what a reader
 * actually distinguishes covers by:
 *
 *   01 pipeline      a filmstrip resolving into one signal · 4 small figures
 *   02 divergence    one trace splitting into five readings · no figure
 *   03 reduction     appearance stripped to movement · 3 figures, abstracting
 *   04 trajectory    five sessions and a diverging future · no figure
 *   05 fusion        four streams, one missing, one corrupt · no figure
 *
 * So the set runs 4 / 0 / 3 / 0 / 0 figures across five layouts: a filmstrip,
 * a fan, a horizontal strip with bars, a timeline with a cone, and a network
 * with an uncertainty band. Nothing here animates.
 *
 * NOTHING HERE IS A MEASUREMENT. There is no axis value, no unit and no
 * number on any cover: they depict arguments, not results.
 */

const W = 640;
const H = 400;

const r1 = (n: number) => Math.round(n * 10) / 10;

const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** A smooth path through points — Catmull-Rom to cubic Bézier. */
function smooth(points: Pt[]): string {
  if (points.length < 2) return "";
  const d = [`M ${r1(points[0][0])} ${r1(points[0][1])}`];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d.push(
      `C ${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`,
    );
  }
  return d.join(" ");
}

/* ═══════════════════════════════════════════════════════════════════════════
   01 · PIPELINE — "From Walking Video to Movement Intelligence"

   Movement being progressively decoded, left to right, in five stages that the
   essay itself walks through:

     source frames → temporal gait phases → joint trajectories
                   → derived feature bands → Motion DNA

   WHAT REPLACED WHAT. This was four boxed thumbnails and one sine wave: a
   filmstrip icon next to a chart, which said "video in, signal out" and
   nothing about the decoding in between. It now shows the decoding itself —
   six real gait phases overlapping in one continuous stride, the ankle and
   wrist paths ACCUMULATING across those phases as curves through space, the
   heel-strike events marked on the floor beneath them, four derived channels
   banded on the right, and the dense signature they collapse into.

   THE GAIT IS REAL. The six poses are GAIT_PHASES walked in order and then
   re-entered, so heel strike, loading, mid-stance, terminal stance, toe-off
   and swing appear in sequence with genuine knee flexion, opposite arm/leg
   swing and pelvic rise and fall. The trajectory curves are traced through
   those poses' OWN ankle and wrist coordinates — they are where the joints
   actually are, not decorative arcs.

   NOTHING HERE IS A MEASUREMENT: the only text is stage names, channel names
   and gait-cycle percentages, which are positions in a stride, not results.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Where the six drawn poses sit in one stride, as a percentage of the cycle. */
const CYCLE_MARKS = [0, 12, 30, 50, 62, 82];

/** The four derived channels, each with its own character. Names only. */
const CHANNELS: { label: string; freq: number; amp: number; phase: number }[] = [
  { label: "Cadence", freq: 5.0, amp: 7.5, phase: 0 },
  { label: "Step symmetry", freq: 2.4, amp: 5.5, phase: 1.1 },
  { label: "Stride variability", freq: 8.5, amp: 4.0, phase: 0.4 },
  { label: "Walking speed", freq: 1.3, amp: 6.5, phase: 2.2 },
];

function Pipeline() {
  /* Six poses across one stride, large enough to read as bodies. Each is a
     real phase; the walk translates right and the figures brighten, so the
     cluster reads as one person moving through time rather than six people
     standing in a row. */
  const S = 0.8;
  const baseY = 250;
  const groundY = baseY + 48 * S;

  const poses = CYCLE_MARKS.map((pct, i) => ({
    phase: GAIT_PHASES[i % GAIT_PHASES.length],
    x: 96 + i * 46,
    /* Ghosting, but never to the point of vanishing: the oldest frame is a
       trace, the newest is the figure. */
    opacity: 0.3 + (i / (CYCLE_MARKS.length - 1)) * 0.7,
    pct,
  }));

  /** A joint's path through the six poses, in cover coordinates. */
  const jointPath = (pick: (phase: (typeof GAIT_PHASES)[number]) => Pt) =>
    smooth(
      poses.map((pose) => {
        const [jx, jy] = pick(pose.phase);
        return [pose.x + jx * S, baseY - pose.phase.lift * S + jy * S] as Pt;
      }),
    );

  const anklePath = jointPath((phase) => phase.nearLeg[2]);
  const wristPath = jointPath((phase) => phase.nearArm[2]);
  const hipPath = jointPath((phase) => phase.nearLeg[0]);

  /* The signature the channels collapse into: one tick per sample around the
     stride, the trailing half shorter, so the strip reads as gait and not as a
     barcode. 62 ticks over 184 units — dense, but every tick still separate. */
  const dna = Array.from({ length: 62 }, (_, i) => {
    const t = (i % 31) / 31;
    const swing = Math.abs(Math.sin(t * Math.PI * 2));
    const side = i % 31 < 16 ? 1 : 0.56;
    return 3 + swing * 24 * side;
  });

  return (
    <>
      {/* ── depth: two translucent analytical planes under everything ── */}
      <path className={styles.cPlane} d="M 68 78 L 372 62 L 372 336 L 68 320 Z" />
      <path className={styles.cPlane} d="M 392 74 L 616 62 L 616 348 L 392 336 Z" />

      {/* ── 01 · source frames, stacked and nearly gone ── */}
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          className={styles.cFrameGhost}
          x={22 + i * 6}
          y={126 + i * 5}
          width={70}
          height={52}
          rx={2}
        />
      ))}
      <rect className={styles.cFrame} x={40} y={136} width={70} height={52} rx={2} />
      {[0, 1, 2, 3].map((k) => (
        <line
          key={k}
          className={styles.cHair}
          x1={46 + k * 17}
          y1={136}
          x2={46 + k * 17}
          y2={140}
        />
      ))}
      <text className={styles.cTiny} x={22} y={118}>
        Source frames
      </text>

      {/* ── the floor the stride happens on, with heel-strike events ── */}
      <line className={styles.cGround} x1={72} y1={groundY} x2={356} y2={groundY} />
      {poses
        .filter((_, i) => i % 2 === 0)
        .map((pose) => (
          <g key={`ev${pose.x}`}>
            <line
              className={styles.cTick}
              x1={pose.x + 6}
              y1={groundY}
              x2={pose.x + 6}
              y2={groundY + 11}
            />
            <text className={styles.cTiny} x={pose.x - 2} y={groundY + 25}>
              {pose.pct}%
            </text>
          </g>
        ))}

      {/* ── 03 · joint trajectories, accumulating through the stride ──
            Under the figures, so the poses are the foreground and the paths
            are the history they leave behind. The ankle carries the read. */}
      <path className={styles.cPathFaint} d={hipPath} />
      <path className={styles.cPathFaint} d={anklePath} />
      <path className={styles.cPathFaint} d={wristPath} />
      {/* One sample per pose on the ankle path: the trajectory accumulating,
          as the discrete samples it is actually built from. */}
      {poses.map((pose) => {
        const [jx, jy] = pose.phase.nearLeg[2];
        return (
          <circle
            key={`ank${pose.pct}`}
            className={styles.cNode}
            cx={r1(pose.x + jx * S)}
            cy={r1(baseY - pose.phase.lift * S + jy * S)}
            r={1.8}
          />
        );
      })}

      {/* ── 02 · the six overlapping phases ── */}
      {poses.map((pose) => (
        <g
          key={pose.pct}
          transform={`translate(${pose.x} ${baseY - pose.phase.lift * S})`}
          opacity={pose.opacity}
        >
          <PoseFrame
            phase={pose.phase}
            s={S}
            classes={{
              bone: styles.cBone,
              boneFar: styles.cBoneFar,
              joint: styles.cJoint,
              head: styles.cHead,
            }}
            /* Far side on every pose: without it the opposite arm/leg
               coordination is invisible and six distinct phases read as six
               copies of one thin figure. */
            showFar

          />
        </g>
      ))}

      <text className={styles.cLabel} x={96} y={92}>
        One stride, six phases
      </text>
      <text className={styles.cTiny} x={96} y={108}>
        Joint paths accumulating
      </text>

      {/* ── 04 · derived feature bands. Label above its own trace. ── */}
      {CHANNELS.map((channel, i) => {
        const top = 104 + i * 44;
        const mid = top + 16;
        const pts: Pt[] = Array.from({ length: 44 }, (_, k) => {
          const t = k / 43;
          return [
            402 + t * 184,
            mid -
              Math.sin(t * Math.PI * channel.freq + channel.phase) * channel.amp -
              Math.sin(t * Math.PI * channel.freq * 2.7) * channel.amp * 0.28,
          ];
        });
        return (
          <g key={channel.label}>
            <text className={styles.cTiny} x={402} y={top}>
              {channel.label}
            </text>
            <path className={styles.cBandTrace} d={smooth(pts)} />
            <line className={styles.cAxis} x1={402} y1={top + 28} x2={586} y2={top + 28} />
          </g>
        );
      })}
      <text className={styles.cTiny} x={402} y={86}>
        Derived channels
      </text>

      {/* ── 05 · Motion DNA: the strip the channels collapse into ── */}
      {dna.map((h, i) => (
        <line
          key={i}
          className={i % 8 === 0 ? styles.cDnaStrong : styles.cDna}
          x1={402 + i * 3}
          y1={306 - h / 2}
          x2={402 + i * 3}
          y2={306 + h / 2}
        />
      ))}
      <line className={styles.cAxis} x1={402} y1={326} x2={586} y2={326} />
      <text className={styles.cLabel} x={402} y={350}>
        Motion DNA
      </text>
      <text className={styles.cTiny} x={512} y={350}>
        one signature
      </text>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   02 · DIVERGENCE — "Your Walk Is More Than a Biometric"

   One signature, read five different ways — and each reading gets its OWN
   analytical language rather than a label on the end of a line.

   WHAT REPLACED WHAT. This was one sine wave fanning into five thin curves
   that ended in five dots with five words beside them. The fan said "one
   thing becomes five things" and then asked the text to do all the work. Now
   the signature is a dense signal column on the left, and each of the five
   branches terminates in the instrument that reading actually uses:

     Identity  → a latent cluster with its own boundary contour
     Mobility  → a cyclic gait profile with phase ticks
     Recovery  → a session-over-session change field
     Risk      → a deviation envelope around a centre line
     Safety    → a plan-view path with spatial events

   So the five are distinguishable at a glance without reading a word, which
   is the essay's whole point: the same movement carries different meanings.

   NO VALUES ANYWHERE. Every mini-instrument is a shape, not a plot of
   numbers: no axis is labelled, no magnitude is stated, nothing is measured.
   ═══════════════════════════════════════════════════════════════════════════ */

const READINGS = ["Identity", "Mobility", "Recovery", "Risk", "Safety"];

function Divergence() {
  const hubX = 214;
  const hubY = 200;
  /* Five rows, evenly spread, each holding one reading's instrument. */
  const rows = READINGS.map((label, i) => ({
    label,
    y: 62 + i * 69,
    x: 392,
  }));

  /* The signature every reading is taken from: a dense column of samples,
     tallest at mid-stride, deterministic. */
  const column = Array.from({ length: 34 }, (_, i) => {
    const t = i / 33;
    return 6 + Math.abs(Math.sin(t * Math.PI * 2)) * 34 * (i % 2 ? 0.72 : 1);
  });

  return (
    <>
      <path className={styles.cPlane} d="M 44 66 L 268 54 L 268 348 L 44 336 Z" />

      {/* ── the one signature, as a signal column ── */}
      {column.map((w, i) => (
        <line
          key={i}
          className={i % 6 === 0 ? styles.cDnaStrong : styles.cDna}
          x1={hubX - 60 - w / 2}
          y1={92 + i * 6.4}
          x2={hubX - 60 + w / 2}
          y2={92 + i * 6.4}
        />
      ))}
      <text className={styles.cLabel} x={72} y={78}>
        One signature
      </text>
      <text className={styles.cTiny} x={72} y={330}>
        Same walk, five readings
      </text>

      {/* ── the hub, then five branches to five instruments ── */}
      <circle className={styles.cRing} cx={hubX} cy={hubY} r={21} />
      <circle className={styles.cNodeLit} cx={hubX} cy={hubY} r={4} />

      {rows.map((row, i) => (
        <path
          key={row.label}
          className={i === 0 ? styles.cBranchLit : styles.cBranch}
          d={`M ${hubX + 22} ${hubY} C ${hubX + 92} ${hubY} ${row.x - 78} ${
            row.y + 18
          } ${row.x - 8} ${row.y + 18}`}
        />
      ))}

      {rows.map((row, i) => (
        <g key={row.label} transform={`translate(${row.x} ${row.y})`}>
          <text className={styles.cTiny} x={0} y={0}>
            {row.label}
          </text>
          {i === 0 && <IdentityCluster />}
          {i === 1 && <MobilityProfile />}
          {i === 2 && <RecoveryField />}
          {i === 3 && <RiskEnvelope />}
          {i === 4 && <SafetyPath />}
        </g>
      ))}
    </>
  );
}

/* Identity — a latent cluster: points with a boundary contour around them.
   Deterministic positions from `rnd`, so the scatter is fixed. */
function IdentityCluster() {
  const pts = Array.from({ length: 16 }, (_, i) => {
    const a = rnd(i * 3 + 1) * Math.PI * 2;
    const r = 4 + rnd(i * 7 + 2) * 15;
    return [66 + Math.cos(a) * r * 1.5, 18 + Math.sin(a) * r * 0.85] as Pt;
  });
  const hull = Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2;
    const k = 1 + 0.16 * Math.sin(3 * a + 0.6);
    return [66 + Math.cos(a) * 27 * k, 18 + Math.sin(a) * 15 * k] as Pt;
  });
  return (
    <>
      <path className={styles.cContour} d={`${smooth([...hull, hull[0], hull[1]])} Z`} />
      {pts.map(([x, y], i) => (
        <circle
          key={i}
          className={i === 3 ? styles.cNodeLit : styles.cNode}
          cx={r1(x)}
          cy={r1(y)}
          r={1.7}
        />
      ))}
    </>
  );
}

/* Mobility — one gait cycle with its phase ticks. */
function MobilityProfile() {
  const pts = Array.from({ length: 34 }, (_, i) => {
    const t = i / 33;
    return [
      20 + t * 92,
      20 - Math.sin(t * Math.PI * 2) * 13 - Math.sin(t * Math.PI * 4 + 0.4) * 4,
    ] as Pt;
  });
  return (
    <>
      <line className={styles.cAxis} x1={20} y1={34} x2={112} y2={34} />
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          className={styles.cHair}
          x1={20 + i * 23}
          y1={34}
          x2={20 + i * 23}
          y2={i % 2 ? 38 : 41}
        />
      ))}
      <path className={styles.cTrace} d={smooth(pts)} />
    </>
  );
}

/* Recovery — the same reading across sessions, as a change field. */
function RecoveryField() {
  const bars = [11, 15, 19, 24, 28];
  return (
    <>
      <line className={styles.cAxis} x1={20} y1={36} x2={112} y2={36} />
      {/* Rects, not lines: cBarTrack / cBarLit are fill-based classes, and a
          <line> carrying only a fill is invisible. */}
      {bars.map((h, i) => (
        <rect
          key={i}
          className={i === bars.length - 1 ? styles.cBarLit : styles.cBarTrack}
          x={24 + i * 21}
          y={36 - h}
          width={5}
          height={h}
          rx={1}
        />
      ))}
      <path
        className={styles.cPathFaint}
        d={smooth(bars.map((h, i) => [26 + i * 21, 36 - h - 5] as Pt))}
      />
    </>
  );
}

/* Risk — a deviation envelope: a band around a centre line, widening. */
function RiskEnvelope() {
  const mid = Array.from({ length: 26 }, (_, i) => {
    const t = i / 25;
    return [20 + t * 92, 20 + Math.sin(t * Math.PI * 3) * 4] as Pt;
  });
  const up = mid.map(([x, y], i) => [x, y - 3 - (i / 25) * 12] as Pt);
  const dn = [...mid].reverse().map(([x, y], i) => {
    const k = (25 - i) / 25;
    return [x, y + 3 + k * 12] as Pt;
  });
  return (
    <>
      <path className={styles.cEnvelope} d={`${smooth([...up, ...dn])} Z`} />
      <path className={styles.cTrace} d={smooth(mid)} />
    </>
  );
}

/* Safety — a plan-view route with spatial events and a zone corner. */
function SafetyPath() {
  const route = smooth([
    [18, 30],
    [46, 18],
    [76, 28],
    [110, 16],
  ]);
  return (
    <>
      <path
        className={styles.cZoneEdge}
        d="M 84 34 L 116 30 L 118 44 L 86 48 Z"
      />
      <path className={styles.cTrace} d={route} />
      {[[46, 18], [110, 16]].map(([x, y], i) => (
        <circle key={i} className={styles.cNode} cx={x} cy={y} r={2.2} />
      ))}
      <circle className={styles.cNodeLit} cx={100} cy={22} r={2.6} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   03 · REDUCTION — "Movement Intelligence Without Identification"

   A feature space losing its identity-bearing dimensions while its
   movement-bearing structure survives:

     intertwined representation → attenuation → protected representation

   WHAT REPLACED WHAT. This was a pixel grid, a filled human blob, a skeleton
   and a waveform in four boxes — a before/after explainer whose middle step
   was a picture of a person, on the one essay whose argument is that no
   picture of a person is needed. There is no figure here now, and no lock and
   no shield either: the transformation is shown in the representation itself.

   Left, the two channel families are interleaved column by column, violet for
   identity-bearing and cyan for movement-bearing, so they read as genuinely
   entangled rather than as two tidy halves. Middle, the violet columns
   attenuate to empty slots — the dimensions are masked, not merely dimmed —
   while the cyan ones carry through. Right, what is left: a movement-only
   latent field with its temporal trajectories still intact.
   ═══════════════════════════════════════════════════════════════════════════ */

function Reduction() {
  const ROWS = 9;
  const COLS = 11;
  const cell = 13;
  /* Which columns carry identity. Fixed, interleaved, not a tidy block. */
  const identityCols = new Set([1, 2, 5, 7, 8, 10]);

  const lattice = (x0: number, mode: "raw" | "masked") =>
    Array.from({ length: COLS }, (_, c) =>
      Array.from({ length: ROWS }, (_, r) => {
        const ident = identityCols.has(c);
        const on = rnd(c * 13 + r * 7) > (ident ? 0.34 : 0.42);
        if (!on) return null;
        const x = x0 + c * cell;
        const y = 128 + r * cell;
        if (ident && mode === "masked") {
          /* An emptied slot: the dimension is gone, and its absence is drawn. */
          return (
            <rect
              key={`${c}-${r}`}
              className={styles.cSlot}
              x={x}
              y={y}
              width={7}
              height={7}
              rx={1}
            />
          );
        }
        return (
          <rect
            key={`${c}-${r}`}
            className={ident ? styles.cCellIdent : styles.cCellMove}
            x={x}
            y={y}
            width={7}
            height={7}
            rx={1}
          />
        );
      }),
    );

  /* The temporal trajectories that survive the transformation. */
  const traj = (x0: number, w: number, seed: number) =>
    smooth(
      Array.from({ length: 26 }, (_, i) => {
        const t = i / 25;
        return [
          x0 + t * w,
          214 + Math.sin(t * Math.PI * 2 + seed) * 16 + Math.sin(t * Math.PI * 5) * 5,
        ] as Pt;
      }),
    );

  return (
    <>
      <path className={styles.cPlane} d="M 30 104 L 208 96 L 208 300 L 30 292 Z" />
      <path className={styles.cPlane} d="M 396 100 L 612 92 L 612 306 L 396 298 Z" />

      {/* ── raw: the two families interleaved ── */}
      {lattice(40, "raw")}
      <text className={styles.cTiny} x={40} y={116}>
        Interleaved dimensions
      </text>
      <text className={styles.cLabel} x={40} y={98}>
        Raw representation
      </text>
      <g>
        <rect className={styles.cCellIdent} x={40} y={258} width={7} height={7} rx={1} />
        <text className={styles.cTinyWarm} x={54} y={265}>
          identity-bearing
        </text>
        <rect className={styles.cCellMove} x={40} y={274} width={7} height={7} rx={1} />
        <text className={styles.cTiny} x={54} y={281}>
          movement-bearing
        </text>
      </g>

      {/* ── the transformation ── */}
      <path className={styles.cDash} d="M 212 200 C 236 200 240 200 258 200" />
      <text className={styles.cTiny} x={214} y={186}>
        attenuate
      </text>

      {/* ── masked: identity slots emptied, movement carried through ── */}
      {lattice(266, "masked")}
      <text className={styles.cTiny} x={266} y={116}>
        Identity attenuated
      </text>

      <path className={styles.cDash} d="M 420 200 C 438 200 442 200 458 200" />

      {/* ── protected: movement structure only, trajectories intact ── */}
      <path className={styles.cContour} d={`${smooth(
        Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const k = 1 + 0.14 * Math.sin(3 * a + 1.1) + 0.08 * Math.cos(2 * a);
          return [504 + Math.cos(a) * 84 * k, 214 + Math.sin(a) * 52 * k] as Pt;
        }),
      )} Z`} />
      <path className={styles.cTrace} d={traj(432, 148, 0)} />
      <path className={styles.cPathFaint} d={traj(432, 148, 1.9)} />
      <path className={styles.cPathFaint} d={traj(432, 148, 3.4)} />
      <text className={styles.cLabel} x={432} y={98}>
        Protected representation
      </text>
      <text className={styles.cTiny} x={432} y={116}>
        Movement structure retained
      </text>
      <text className={styles.cTiny} x={432} y={296}>
        No identity channel remains
      </text>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   04 · TRAJECTORY — "A Fall-Risk Score Is Not Enough"

   Five sessions of the same walk, each with its own signature, and what only
   becomes visible across them.

   WHAT REPLACED WHAT. This was a line sloping down across five ticks with a
   cone on the end: business analytics, and precisely the reading the essay
   argues against — that a number going down is the finding. The sessions are
   now the dominant form. Each is a small Motion DNA signature of its own, and
   they differ from one another; underneath, the baseline, the drift between
   them, the widening variance band and the direction the change is heading
   are drawn as separate marks, so "the movement changed" is what the cover
   says, not "the metric fell".

   THE SIGNATURES ARE SHAPES, NOT SCORES. Each session's ticks come from one
   deterministic function with a per-session phase and spread; no session is
   labelled with a value, and there is no y-axis.
   ═══════════════════════════════════════════════════════════════════════════ */

function Trajectory() {
  const sessions = [0, 1, 2, 3, 4];
  const colW = 104;
  const x0 = 52;
  /* Signatures sit at ONE height across all five columns. The drift is drawn
     separately, below them: tying the signatures to the drift line made them
     ride a diagonal and merge into a single wedge, which is the chart this
     cover exists to replace. */
  const sigY = 168;
  const driftY = 268;

  /** One session's signature — 12 ticks, each session a different character. */
  const signature = (i: number) =>
    Array.from({ length: 12 }, (_, k) => {
      const t = k / 11;
      const spread = 1 + i * 0.2;
      const h =
        6 +
        Math.abs(Math.sin(t * Math.PI * 2 + i * 0.8)) * 20 * (k % 2 ? 0.68 : 1) * spread;
      return { x: x0 + i * colW + 14 + k * 6.4, h: Math.min(h, 40) };
    });

  /** Where each session's centre sits on the drift track. */
  const centres = sessions.map(
    (i) => [x0 + i * colW + 40, driftY + i * 12] as Pt,
  );

  const bandTop = smooth(centres.map(([x, y], i) => [x, y - 7 - i * 4] as Pt));
  const bandBottom = [...centres]
    .reverse()
    .map(([x, y], i) => {
      const k = sessions.length - 1 - i;
      return [x, y + 7 + k * 4] as Pt;
    });

  return (
    <>
      {/* five sessions, five signatures, all at one height */}
      {sessions.map((i) => (
        <g key={i}>
          <rect
            className={styles.cPanel}
            x={x0 + i * colW}
            y={104}
            width={92}
            height={128}
            rx={3}
          />
          {signature(i).map((tick, k) => (
            <line
              key={k}
              className={i === sessions.length - 1 ? styles.cDnaStrong : styles.cDna}
              x1={tick.x}
              y1={sigY - tick.h / 2}
              x2={tick.x}
              y2={sigY + tick.h / 2}
            />
          ))}
          <text className={styles.cTiny} x={x0 + i * colW + 8} y={124}>
            {`Session 0${i + 1}`}
          </text>
        </g>
      ))}

      <text className={styles.cLabel} x={52} y={84}>
        Five sessions, one walk
      </text>

      {/* the drift the sessions reveal — one mark, under the evidence */}
      <line className={styles.cBaseline} x1={52} y1={driftY} x2={588} y2={driftY} />
      <text className={styles.cTiny} x={52} y={driftY - 8}>
        Session 01 baseline
      </text>
      <path
        className={styles.cEnvelope}
        d={`${bandTop} L ${r1(bandBottom[0][0])} ${r1(bandBottom[0][1])} ${bandBottom
          .slice(1)
          .map(([x, y]) => `L ${r1(x)} ${r1(y)}`)
          .join(" ")} Z`}
      />
      <path className={styles.cPath} d={smooth(centres)} />
      {centres.map(([x, y], i) => (
        <circle
          key={i}
          className={i === centres.length - 1 ? styles.cNodeLit : styles.cNode}
          cx={r1(x)}
          cy={r1(y)}
          r={2.4}
        />
      ))}

      {/* where it is heading */}
      <path
        className={styles.cCone}
        d={`M ${r1(centres[4][0])} ${r1(centres[4][1])} L 580 ${r1(
          centres[4][1] - 24,
        )} L 580 ${r1(centres[4][1] + 30)} Z`}
      />
      <text className={styles.cTiny} x={432} y={driftY + 74}>
        Direction of change
      </text>
      <text className={styles.cTiny} x={52} y={driftY + 74}>
        Variance widens across sessions
      </text>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   05 · FUSION — "When Fusion Looks Better Than It Is"
   Four input rails converging on one node: two clean, one dashed away
   (missing), one jittered (corrupted). What leaves the node is not a point
   but a band — the essay's argument is that more inputs widen uncertainty as
   readily as they narrow it.
   ═══════════════════════════════════════════════════════════════════════════ */

const STREAMS = [
  { label: "Video", state: "ok" },
  { label: "Pose", state: "ok" },
  { label: "Wearable", state: "missing" },
  { label: "Trajectory", state: "corrupt" },
] as const;

function Fusion() {
  const hubX = 356;
  const hubY = 200;

  return (
    <>
      {STREAMS.map((stream, i) => {
        const y = 88 + i * 76;
        const cls =
          stream.state === "missing"
            ? styles.cRailGone
            : stream.state === "corrupt"
              ? styles.cRailWarm
              : styles.cRail;

        /* The corrupted rail is drawn as a jagged line rather than a smooth
           one: the corruption is in the geometry, not in an animation. */
        const d =
          stream.state === "corrupt"
            ? `M 52 ${y} ` +
              Array.from({ length: 16 }, (_, k) => {
                const x = 52 + (k + 1) * 12;
                const off = (rnd(k * 7 + 3) - 0.5) * 17;
                return `L ${r1(x)} ${r1(y + off)}`;
              }).join(" ") +
              ` C 250 ${y} 292 ${hubY} ${hubX - 26} ${hubY}`
            : `M 52 ${y} L 214 ${y} C 268 ${y} 300 ${hubY} ${hubX - 26} ${hubY}`;

        return (
          <g key={stream.label}>
            <path className={cls} d={d} />
            <circle
              className={
                stream.state === "ok" ? styles.cNodeLit : styles.cNode
              }
              cx={52}
              cy={y}
              r={3.6}
            />
            <text className={styles.cLabel} x={52} y={y - 14}>
              {stream.label}
            </text>
            {stream.state !== "ok" && (
              /* Below the name, not beside it: at x=140 "corrupted" ran into
                 the end of "Trajectory". */
              <text className={styles.cTinyWarm} x={52} y={y + 20}>
                {stream.state === "missing" ? "missing" : "corrupted"}
              </text>
            )}
          </g>
        );
      })}

      {/* the fusion node */}
      <circle className={styles.cRing} cx={hubX} cy={hubY} r={26} />
      <circle className={styles.cRing} cx={hubX} cy={hubY} r={17} />
      <circle className={styles.cNodeLit} cx={hubX} cy={hubY} r={5} />
      <text className={styles.cTiny} x={hubX} y={hubY + 48} textAnchor="middle">
        Fusion
      </text>

      {/* what leaves: a band, not a point */}
      {(() => {
        const band = `M ${hubX + 28} ${hubY - 8} C 448 ${hubY - 28} 512 ${
          hubY - 40
        } 592 ${hubY - 46} L 592 ${hubY + 50} C 512 ${hubY + 40} 448 ${
          hubY + 20
        } ${hubX + 28} ${hubY + 8} Z`;
        return (
          <>
            <path className={styles.cBand2} d={band} />
            {/* A hairline edge, so the band reads as a bound rather than as a
                smudge behind the trace. */}
            <path className={styles.cBand2Edge} d={band} />
          </>
        );
      })()}
      <path
        className={styles.cTrace}
        d={`M ${hubX + 28} ${hubY} C 448 ${hubY - 6} 512 ${hubY - 4} 592 ${hubY + 2}`}
      />
      <text className={styles.cLabel} x={470} y={hubY + 80}>
        Uncertainty
      </text>
    </>
  );
}

/**
 * WHEN POSE ESTIMATION LIES. A camera frame with a plausible skeleton in it,
 * drawn as the estimator returned it — and, beside the hidden leg, the one
 * joint that was filled in rather than seen: the estimate ringed warm, the
 * actual position a teal point, a dashed line between. To the right, what the
 * measurement inherits, as three qualitative lines. No number anywhere.
 */
function PoseError() {
  const issue = "occlusion" as const;
  const actual = GAIT_PHASES[POSE_PHASE_FOR[issue]];
  const est = estimatePose(actual, issue);
  const focus = poseFocusJoint(actual, est, issue)!;
  const s = 2.6;
  const fx = 190;
  const fy = 196;
  const cls = { bone: styles.cBone, boneFar: styles.cBoneFar, joint: styles.cJoint, head: styles.cHead };
  const groundY = fy + (48 - actual.lift) * s;
  return (
    <>
      {/* the frame */}
      <rect className={styles.cFrame} x={72} y={56} width={236} height={292} rx={4} />
      <text className={styles.cTiny} x={84} y={78}>
        Original frame
      </text>
      <line className={styles.cAxis} x1={84} y1={groundY} x2={296} y2={groundY} />
      {/* the bin in front of the far leg */}
      <rect className={styles.cFrame} x={fx + 6 * s} y={fy + 10 * s} width={26 * s} height={groundY - (fy + 10 * s)} rx={2} />
      <line className={styles.cHair} x1={fx + 6 * s} y1={fy + 22 * s} x2={fx + 32 * s} y2={fy + 22 * s} />
      {/* the estimate, complete and plausible */}
      <g transform={`translate(${fx} ${fy - actual.lift * s})`}>
        <PoseFrame phase={est} s={s} classes={cls} />
        {/* the filled-in joint against the observed one */}
        <line className={styles.cDash} x1={focus.est[0] * s} y1={focus.est[1] * s} x2={focus.actual[0] * s} y2={focus.actual[1] * s} />
        <circle className={styles.cRing} cx={focus.est[0] * s} cy={focus.est[1] * s} r={9} style={{ stroke: "var(--c-warm)", opacity: 0.9 }} />
        <circle className={styles.cNodeLit} cx={focus.actual[0] * s} cy={focus.actual[1] * s} r={3.2} style={{ fill: "var(--c-b)" }} />
      </g>
      <text className={styles.cTinyWarm} x={84} y={332}>
        Far knee · estimated, not observed
      </text>
      {/* what the measurement inherits */}
      <text className={styles.cLabel} x={352} y={78}>
        What the measurement inherits
      </text>
      {[
        ["Step timing", "degraded"],
        ["Knee angle", "unavailable"],
        ["Left / right symmetry", "questionable"],
        ["Cadence", "reliable"],
      ].map(([name, state], i) => (
        <g key={name}>
          <text className={styles.cTiny} x={352} y={124 + i * 46}>
            {name}
          </text>
          <line className={styles.cHair} x1={352} y1={132 + i * 46} x2={584} y2={132 + i * 46} />
          <text className={state === "reliable" ? styles.cTiny : styles.cTinyWarm} x={584} y={124 + i * 46} textAnchor="end">
            {state}
          </text>
        </g>
      ))}
      <text className={styles.cTiny} x={352} y={332}>
        Reported confidence · still high
      </text>
    </>
  );
}

/**
 * WHAT DOES GAIT SYMMETRY ACTUALLY MEAN. Two gait cycles as bars of time on
 * one clock — stance filled, swing open, a tick at each heel strike — with
 * the right side standing longer than the left, and the left cycle's
 * boundaries drawn over it as dashed guides. Three comparisons named beneath.
 */
function Symmetry() {
  const state = symmetryState("stance", 2);
  const x0 = 96;
  const x1 = 560;
  const cycles = 1.6;
  const xAt = (t: number) => x0 + (t / cycles) * (x1 - x0);
  const segments = (start: number, stance: number) => {
    const out: Array<[number, number]> = [];
    for (let k = -1; k <= 2; k++) {
      const a = Math.max(0, start + k);
      const b = Math.min(cycles, start + k + stance);
      if (b > a) out.push([a, b]);
    }
    return out;
  };
  const bar = (y: number, label: string, side: "left" | "right", start: number, stance: number) => (
    <g>
      <text className={styles.cLabel} x={x0 - 12} y={y + 22} textAnchor="end">
        {label}
      </text>
      <rect className={styles.cBarTrack} x={x0} y={y} width={x1 - x0} height={32} rx={3} />
      {segments(start, stance).map(([a, b]) => (
        <rect
          key={`${side}-${a}`}
          className={side === "left" ? styles.cBarLit : styles.cBarWarm}
          x={xAt(a)}
          y={y + 5}
          width={xAt(b) - xAt(a)}
          height={22}
          rx={2}
        />
      ))}
      {[-1, 0, 1, 2].map((k) => start + k).filter((t) => t >= 0 && t <= cycles).map((t) => (
        <line key={`${side}-${t}`} className={styles.cStem} x1={xAt(t)} y1={y - 10} x2={xAt(t)} y2={y + 42} />
      ))}
    </g>
  );
  return (
    <>
      <text className={styles.cTiny} x={x0} y={92}>
        Left against right · one gait cycle, then most of the next
      </text>
      <line className={styles.cAxis} x1={x0} y1={104} x2={x1} y2={104} />
      {bar(136, "Left", "left", state.left.start, state.left.stance)}
      {bar(216, "Right", "right", state.right.start, state.right.stance)}
      {segments(state.left.start + 0.5, state.left.stance).map(([a, b]) => (
        <g key={`ghost-${a}`}>
          <line className={styles.cDash} x1={xAt(a)} y1={212} x2={xAt(a)} y2={252} />
          <line className={styles.cDash} x1={xAt(b)} y1={212} x2={xAt(b)} y2={252} />
        </g>
      ))}
      <text className={styles.cTinyWarm} x={x1} y={300} textAnchor="end">
        Asymmetrical · right stands longer
      </text>
      <text className={styles.cTiny} x={x0} y={300}>
        Stance · swing · step timing — three comparisons, one word
      </text>
      <text className={styles.cTiny} x={x0} y={340}>
        Illustrative · no ratio, no threshold
      </text>
    </>
  );
}

/**
 * CAMERA ANGLE CHANGES WHAT AI SEES. A plan view: the walker at the centre
 * heading right, a camera on a ring at the front-right, its line of sight
 * drawn, the four cardinal positions named — and beside it what this angle
 * makes easier, harder or unavailable, in words.
 */
function Viewpoint() {
  const cx = 200;
  const cy = 200;
  const r = 118;
  const angle = 135 as const;
  const a = (angle * Math.PI) / 180;
  const camX = cx + r * Math.sin(a);
  const camY = cy + r * Math.cos(a);
  const availability = availabilityAt(angle);
  return (
    <>
      <circle className={styles.cDash} cx={cx} cy={cy} r={r} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((value) => {
        const t = (value * Math.PI) / 180;
        return <circle key={value} className={value === angle ? styles.cNodeLit : styles.cNode} cx={cx + r * Math.sin(t)} cy={cy + r * Math.cos(t)} r={value === angle ? 0 : 2.6} />;
      })}
      <text className={styles.cTiny} x={cx + r + 14} y={cy + 4}>
        Front
      </text>
      <text className={styles.cTiny} x={cx - r - 14} y={cy + 4} textAnchor="end">
        Rear
      </text>
      <text className={styles.cTiny} x={cx} y={cy + r + 24} textAnchor="middle">
        Left side
      </text>
      <text className={styles.cTiny} x={cx} y={cy - r - 14} textAnchor="middle">
        Right side
      </text>
      <ellipse className={styles.cFrame} cx={cx} cy={cy} rx={22} ry={9} />
      <circle className={styles.cNodeLit} cx={cx} cy={cy} r={6} style={{ fill: "var(--c-ink)" }} />
      <path className={styles.cTrace} d={`M${cx + 28} ${cy} H${cx + 58} M${cx + 48} ${cy - 7} L${cx + 60} ${cy} L${cx + 48} ${cy + 7}`} />
      <line className={styles.cDash} x1={camX} y1={camY} x2={cx} y2={cy} style={{ stroke: "var(--c-a)" }} />
      <g transform={`translate(${camX} ${camY})`}>
        <circle className={styles.cRing} r={16} />
        <rect className={styles.cFrame} x={-12} y={-9} width={24} height={18} rx={3} style={{ stroke: "var(--c-a)" }} />
        <circle className={styles.cNodeLit} r={3.6} />
      </g>
      <text className={styles.cTinyWarm} x={camX + 22} y={camY - 12}>
        Camera · front-right
      </text>
      <text className={styles.cLabel} x={392} y={78}>
        From this angle
      </text>
      {[
        ["Knee flexion", availability["knee-flexion"]],
        ["Stride width", availability["stride-width"]],
        ["Step timing", availability["step-timing"]],
        ["Foot trajectory", availability["foot-trajectory"]],
        ["Body path", availability["body-path"]],
      ].map(([name, state], i) => (
        <g key={String(name)}>
          <text className={styles.cTiny} x={392} y={124 + i * 46}>
            {name}
          </text>
          <line className={styles.cHair} x1={392} y1={132 + i * 46} x2={600} y2={132 + i * 46} />
          <text className={state === "easier" ? styles.cTiny : styles.cTinyWarm} x={600} y={124 + i * 46} textAnchor="end" style={state === "unavailable" ? { opacity: 0.7 } : undefined}>
            {String(state)}
          </text>
        </g>
      ))}
    </>
  );
}

/**
 * CAN A SKELETON STILL REVEAL IDENTITY. Three figures in a row — a textured
 * body, a skeleton, a set of trajectories — each losing more of the picture,
 * and beneath each the ledger of what could still identify the person. The
 * ledger never reaches zero; that is the plate's argument.
 */
function IdentityLayers() {
  const s = 1.55;
  const y = 176;
  const phase = GAIT_PHASES[2];
  const cls = { bone: styles.cBone, boneFar: styles.cBoneFar, joint: styles.cJoint, head: styles.cHead };
  const columns: Array<{ x: number; label: string; ledger: ReturnType<typeof identityLedger> }> = [
    { x: 130, label: "Face removed", ledger: identityLedger("face-removed", { persisted: false, linked: false }) },
    { x: 320, label: "Skeleton", ledger: identityLedger("skeleton", { persisted: false, linked: false }) },
    { x: 510, label: "Trajectories", ledger: identityLedger("trajectories", { persisted: true, linked: false }) },
  ];
  const trails = (x: number) =>
    GAIT_PHASES.map((p, i) => [x - (2 - i) * 16 + p.nearLeg[2][0] * s * 0.45, y - p.lift * s + p.nearLeg[2][1] * s] as Pt);
  return (
    <>
      {columns.map((column, index) => (
        <g key={column.label}>
          <text className={styles.cTiny} x={column.x} y={72} textAnchor="middle">
            {column.label}
          </text>
          <line className={styles.cAxis} x1={column.x - 60} y1={y + 48 * s} x2={column.x + 60} y2={y + 48 * s} />
          {index === 0 && (
            <>
              <path className={styles.cContour} d={bodyMassPath(column.x, y, s)} style={{ fill: "rgb(148 163 184 / 0.28)" }} />
              <rect x={column.x - 9 * s} y={y - 52 * s} width={20 * s} height={17 * s} rx={1} style={{ fill: "rgb(156 100 241 / 0.55)", stroke: "#a78bfa" }} />
            </>
          )}
          {index === 1 && (
            <g transform={`translate(${column.x} ${y - phase.lift * s})`}>
              <PoseFrame phase={phase} s={s} classes={cls} />
            </g>
          )}
          {index === 2 && (
            <>
              <path className={styles.cTrace} d={smooth(trails(column.x))} />
              {trails(column.x).map(([tx, ty], i) => (
                <circle key={i} className={styles.cNodeLit} cx={tx} cy={ty} r={2.4} />
              ))}
              <path className={styles.cPathFaint} d={smooth(trails(column.x).map(([tx, ty]) => [tx, ty - 30 * s] as Pt))} />
            </>
          )}
          {(["face", "appearance", "shape", "gait", "context"] as const).map((cue, i) => {
            const state = column.ledger[cue];
            return (
              <text
                key={cue}
                className={state === "removed" ? styles.cTiny : styles.cTinyWarm}
                x={column.x}
                y={286 + i * 16}
                textAnchor="middle"
                style={state === "removed" ? { opacity: 0.5 } : undefined}
              >
                {cue === "appearance" ? "clothing" : cue === "shape" ? "build" : cue} · {state}
              </text>
            );
          })}
        </g>
      ))}
      <line className={styles.cDash} x1={190} y1={176} x2={260} y2={176} />
      <line className={styles.cDash} x1={380} y1={176} x2={450} y2={176} />
    </>
  );
}

/**
 * A GOOD MODEL CAN STILL BE A BAD SYSTEM. Six links from camera to operator
 * in a row, the network link broken, the model's link marked sound, and
 * beneath them the two answers: what the model saw (nothing) and what
 * reached the person (no alert).
 */
function SystemChain() {
  const failed = new Set<ChainComponent>(["network"]);
  const { outcome, at } = outcomeFor(failed);
  const x0 = 72;
  const gap = (568 - x0) / (CHAIN.length - 1);
  const y = 150;
  return (
    <>
      {CHAIN.map((component, i) => {
        const x = x0 + i * gap;
        const isFailed = failed.has(component);
        const downstream = at !== null && CHAIN.indexOf(component) > CHAIN.indexOf(at);
        return (
          <g key={component} style={{ opacity: downstream ? 0.55 : 1 }}>
            {i < CHAIN.length - 1 && (
              <line
                className={isFailed ? styles.cDash : styles.cTrace}
                x1={x + 26}
                y1={y}
                x2={x + gap - 26}
                y2={y}
                style={isFailed ? { stroke: "var(--c-warm)" } : undefined}
              />
            )}
            <circle className={styles.cRing} cx={x} cy={y} r={24} style={{ opacity: 1, stroke: isFailed ? "var(--c-warm)" : "var(--c-a)" }} />
            {isFailed ? (
              <g style={{ stroke: "var(--c-warm)" }} className={styles.cTrace}>
                <line x1={x - 8} y1={y - 8} x2={x + 8} y2={y + 8} />
                <line x1={x + 8} y1={y - 8} x2={x - 8} y2={y + 8} />
              </g>
            ) : (
              <path className={styles.cTrace} d={`M${x - 8} ${y} L${x - 2} ${y + 7} L${x + 9} ${y - 7}`} style={{ stroke: "var(--c-b)" }} />
            )}
            <text className={isFailed ? styles.cTinyWarm : styles.cTiny} x={x} y={y + 48} textAnchor="middle">
              {COMPONENT_LABEL[component]}
            </text>
            {component === "inference" && (
              <text className={styles.cTiny} x={x} y={y - 40} textAnchor="middle" style={{ fill: "var(--c-b)" }}>
                model right
              </text>
            )}
          </g>
        );
      })}
      <text className={styles.cTiny} x={x0 - 24} y={268}>
        What the model sees
      </text>
      <text className={styles.cLabel} x={x0 - 24} y={290}>
        Nothing — its outputs are correct and go nowhere
      </text>
      <line className={styles.cHair} x1={x0 - 24} y1={306} x2={592} y2={306} />
      <text className={styles.cTiny} x={x0 - 24} y={330}>
        What reaches the person
      </text>
      <text className={styles.cTinyWarm} x={x0 - 24} y={352}>
        {OUTCOME_LABEL[outcome]}
      </text>
    </>
  );
}

/**
 * WHAT IS A PERSONAL MOVEMENT BASELINE. Left, a population distribution with
 * its reference range and one reading inside it; right, the same person's
 * observations over time forming their own narrow band, with the same
 * reading outside it. One axis, two references, two answers.
 */
function Baseline() {
  const left = { x: 48, w: 250 };
  const right = { x: 344, w: 250 };
  const axisY = 264;
  const topY = 96;
  const xIn = (panel: { x: number; w: number }, t: number) => panel.x + t * panel.w;
  const shown = 8;
  const latest = OBSERVATIONS[shown - 1];
  const band = personalBand(shown)!;
  const curve = smooth(populationCurve().map(([x, y]) => [xIn(left, x), axisY - y * (axisY - topY - 24)] as Pt));
  return (
    <>
      <text className={styles.cTiny} x={left.x} y={64}>
        Population reference
      </text>
      <rect className={styles.cBand} x={xIn(left, POPULATION.range[0])} y={topY} width={xIn(left, POPULATION.range[1]) - xIn(left, POPULATION.range[0])} height={axisY - topY} rx={3} />
      <path className={styles.cTrace} d={curve} style={{ stroke: "var(--c-b)" }} />
      <line className={styles.cAxis} x1={left.x} y1={axisY} x2={left.x + left.w} y2={axisY} />
      <line className={styles.cDash} x1={xIn(left, latest)} y1={topY - 12} x2={xIn(left, latest)} y2={axisY} />
      <circle className={styles.cNodeLit} cx={xIn(left, latest)} cy={topY - 12} r={4} />
      <text className={styles.cTiny} x={xIn(left, latest) + 10} y={topY - 8}>
        latest · inside
      </text>
      <text className={styles.cTiny} x={right.x} y={64}>
        Personal baseline
      </text>
      <rect className={styles.cBand} x={xIn(right, POPULATION.range[0])} y={topY} width={xIn(right, POPULATION.range[1]) - xIn(right, POPULATION.range[0])} height={axisY - topY} rx={3} style={{ opacity: 0.35 }} />
      <rect x={xIn(right, band.low)} y={topY} width={xIn(right, band.high) - xIn(right, band.low)} height={axisY - topY} rx={3} style={{ fill: "var(--c-a)", opacity: 0.16 }} />
      <line className={styles.cDash} x1={xIn(right, band.low)} y1={topY} x2={xIn(right, band.low)} y2={axisY} style={{ stroke: "var(--c-a)" }} />
      <line className={styles.cDash} x1={xIn(right, band.high)} y1={topY} x2={xIn(right, band.high)} y2={axisY} style={{ stroke: "var(--c-a)" }} />
      <line className={styles.cAxis} x1={right.x} y1={axisY} x2={right.x + right.w} y2={axisY} />
      {OBSERVATIONS.map((value, i) => {
        const y = topY + 10 + i * ((axisY - topY - 28) / (OBSERVATIONS.length - 1));
        const isLatest = i === shown - 1;
        return <circle key={i} className={isLatest ? styles.cNodeLit : styles.cNode} cx={xIn(right, value)} cy={y} r={isLatest ? 4.5 : 3} style={isLatest ? { fill: "var(--c-warm)" } : undefined} />;
      })}
      <text className={styles.cTinyWarm} x={xIn(right, latest) - 10} y={axisY - 6} textAnchor="end">
        latest · outside own band
      </text>
      <text className={styles.cLabel} x={left.x} y={318}>
        The same reading, two references
      </text>
      <text className={styles.cTiny} x={left.x} y={340}>
        Normal for everyone · a change for this person · illustrative
      </text>
    </>
  );
}

const ART: Record<CoverConcept, () => React.ReactElement> = {
  pipeline: Pipeline,
  divergence: Divergence,
  reduction: Reduction,
  trajectory: Trajectory,
  fusion: Fusion,
  "pose-error": PoseError,
  symmetry: Symmetry,
  viewpoint: Viewpoint,
  "identity-layers": IdentityLayers,
  "system-chain": SystemChain,
  baseline: Baseline,
};

/**
 * The shared frame: the family resemblance. A measured ground, a survey grid,
 * a corner tick at each side and one set of hairline weights — identical on
 * all five, so the set reads as one publication however different the
 * compositions are.
 *
 * Three layers, not one SVG, because the slots these sit in are not one
 * shape: the archive's compact card is 16/9, the tall card is 4/3, the
 * featured card and the article hero are whatever their row is, and a single
 * `slice` viewport cropped the labels off the sides of the narrow ones.
 * Nesting cannot fix that — a nested viewport inherits its parent's
 * non-uniform scale — so each layer is its own element with its own fit:
 *
 *   ground   stretches (a flat fill cannot be distorted)
 *   grid     `slice`, so its cells stay square while it covers the slot
 *   plate    `meet`, so the whole composition is always visible, centred,
 *            and never cropped or stretched at any card width
 *
 * The plate letterboxing against the grid is the intended look: a drawn
 * plate on measured ground, the way a figure sits on a page.
 */
export function JournalCover({
  concept,
  className,
}: {
  concept: CoverConcept;
  className?: string;
}) {
  const Art = ART[concept];
  return (
    <div
      aria-hidden="true"
      className={`${styles.cover} ${styles[concept]} ${className ?? ""}`}
    >
      <svg
        className={styles.layer}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
      >
        <rect className={styles.cGround} x="0" y="0" width={W} height={H} />
      </svg>

      <svg
        className={styles.layer}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <g className={styles.cGrid}>
          {Array.from({ length: 16 }, (_, i) => (
            <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={H} />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 40} x2={W} y2={i * 40} />
          ))}
        </g>
      </svg>

      <svg
        className={styles.layer}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Art />
        {/* corner ticks — on the plate, not the grid, so they always frame
            the composition instead of being cropped away with the edges */}
        {[
          [14, 14, 1, 1],
          [W - 14, 14, -1, 1],
          [14, H - 14, 1, -1],
          [W - 14, H - 14, -1, -1],
        ].map(([x, y, sx, sy], i) => (
          <path
            key={i}
            className={styles.cTick}
            d={`M ${x} ${y + sy * 11} L ${x} ${y} L ${x + sx * 11} ${y}`}
          />
        ))}
      </svg>
    </div>
  );
}

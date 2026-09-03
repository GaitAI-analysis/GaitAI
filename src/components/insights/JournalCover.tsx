import { GAIT_PHASES, type Pt } from "@/components/visuals/gait-phases";
import { PoseFrame } from "@/components/research/PoseFrame";
import type { CoverConcept } from "@/data/insights";
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
   A filmstrip of captured frames on the left, each figure smaller than the
   last, resolving into one signal that owns the right two thirds. The essay's
   argument is that what survives the pipeline is not a picture of a person,
   so the person shrinks across the frame and the signal is the focal element.
   ═══════════════════════════════════════════════════════════════════════════ */

function Pipeline() {
  const frames = [0, 1, 2, 3];
  const trace = (() => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 72; i += 1) {
      const t = i / 72;
      pts.push([
        282 + t * 322,
        212 -
          Math.sin(t * Math.PI * 4) * 46 * (0.5 + t * 0.6) -
          Math.sin(t * Math.PI * 9 + 0.7) * 12,
      ]);
    }
    return smooth(pts);
  })();

  return (
    <>
      {/* the filmstrip */}
      {frames.map((i) => {
        const y = 62 + i * 74;
        /* PoseFrame's local box is ~90 units tall, so the scale has to keep
           the figure inside a 62-unit frame: at 0.86 the head sat above the
           frame's top edge and the feet below its bottom. */
        const s = 0.56 - i * 0.085;
        return (
          <g key={i}>
            <rect
              className={styles.cFrame}
              x={44}
              y={y}
              width={132}
              height={62}
              rx={3}
            />
            {/* sprocket ticks, so it reads as film rather than as a box */}
            {[0, 1, 2, 3].map((k) => (
              <line
                key={k}
                className={styles.cHair}
                x1={50 + k * 32}
                y1={y}
                x2={50 + k * 32}
                y2={y + 5}
              />
            ))}
            <g transform={`translate(${104} ${y + 50})`}>
              <PoseFrame
                phase={GAIT_PHASES[i % GAIT_PHASES.length]}
                s={s}
                classes={{
                  bone: styles.cBone,
                  boneFar: styles.cBoneFar,
                  joint: styles.cJoint,
                  head: styles.cHead,
                }}
                showFar={false}
              />
            </g>
            <text className={styles.cTiny} x={182} y={y + 40}>
              {String(i + 1).padStart(2, "0")}
            </text>
          </g>
        );
      })}

      {/* the transition into signal */}
      <path className={styles.cDash} d="M 214 200 C 246 200 254 206 278 210" />

      {/* the signal: the focal element */}
      <path className={styles.cTrace} d={trace} />
      <line className={styles.cAxis} x1={282} y1={286} x2={604} y2={286} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <line
          key={i}
          className={styles.cHair}
          x1={282 + i * 46}
          y1={286}
          x2={282 + i * 46}
          y2={i % 2 ? 292 : 296}
        />
      ))}
      <text className={styles.cLabel} x={282} y={330}>
        Movement signal
      </text>
      <text className={styles.cTiny} x={44} y={44}>
        Captured frames
      </text>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   02 · DIVERGENCE — "Your Walk Is More Than a Biometric"
   One trace enters from the left and splits into five, each ending at a named
   reading. No figure at all: the essay's point is that the walk is not the
   subject — what can be read off it is. Identity is one of five, and it is
   drawn at the same weight as the rest.
   ═══════════════════════════════════════════════════════════════════════════ */

const READINGS = ["Identity", "Mobility", "Recovery", "Risk", "Safety"];

function Divergence() {
  const originX = 62;
  const originY = 200;
  const splitX = 250;

  return (
    <>
      {/* the single incoming trace */}
      <path
        className={styles.cTrace}
        d={smooth(
          Array.from({ length: 40 }, (_, i) => {
            const t = i / 39;
            return [
              originX + t * (splitX - originX),
              originY - Math.sin(t * Math.PI * 3) * 15,
            ] as Pt;
          }),
        )}
      />
      <text className={styles.cTiny} x={44} y={168}>
        One gait signal
      </text>

      {/* the split node */}
      <circle className={styles.cNodeLit} cx={splitX} cy={originY} r={4.4} />
      <circle className={styles.cRing} cx={splitX} cy={originY} r={11} />

      {/* five readings, fanned */}
      {READINGS.map((label, i) => {
        const y = 74 + i * 63;
        const end = 486;
        return (
          <g key={label}>
            <path
              className={i === 0 ? styles.cBranchLit : styles.cBranch}
              d={`M ${splitX + 12} ${originY} C ${splitX + 96} ${originY} ${
                end - 96
              } ${y} ${end} ${y}`}
            />
            <circle
              className={i === 0 ? styles.cNodeLit : styles.cNode}
              cx={end}
              cy={y}
              r={3.4}
            />
            <text className={styles.cLabel} x={end + 16} y={y + 4}>
              {label}
            </text>
          </g>
        );
      })}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   03 · REDUCTION — "Can AI Understand Movement Without Identifying?"
   Four bands, left to right: pixels, a blurred silhouette, a pose skeleton, a
   bare trajectory. Under them, two bars: what identity information is left,
   and what movement information is left. The figures abstract away as the
   eye travels; the movement bar does not move.
   ═══════════════════════════════════════════════════════════════════════════ */

function Reduction() {
  /* 4 × 138 + 3 × 16 + 40 = 640, exactly the viewBox width, so the fourth
     band's own content was clipped at the edge. */
  const bandW = 120;
  const gap = 13;
  const x0 = 44;
  const top = 56;
  const bandH = 186;
  const ground = top + bandH - 18;

  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const x = x0 + i * (bandW + gap);
        return (
          <g key={i}>
            <rect
              className={styles.cBand}
              x={x}
              y={top}
              width={bandW}
              height={bandH}
              rx={4}
            />

            {/* 1 · pixels */}
            {i === 0 &&
              Array.from({ length: 6 * 9 }, (_, k) => {
                const cx = x + 12 + (k % 6) * 16;
                const cy = top + 28 + Math.floor(k / 6) * 16;
                const lit = rnd(k * 3 + 1);
                return (
                  <rect
                    key={k}
                    className={lit > 0.62 ? styles.cPixelLit : styles.cPixel}
                    x={cx}
                    y={cy}
                    width={12}
                    height={12}
                    rx={1}
                  />
                );
              })}

            {/* 2 · silhouette, no features */}
            {i === 1 && (
              <g
                className={styles.cMass}
                transform={`translate(${x + bandW / 2} ${ground}) scale(1.5)`}
              >
                <ellipse cx={0} cy={-46} rx={16} ry={28} />
                <ellipse cx={1} cy={-80} rx={8} ry={9} />
                <path d="M -9 -20 L -13 0 L -4 0 L -1 -16 L 3 0 L 12 0 L 7 -20 Z" />
              </g>
            )}

            {/* 3 · pose only */}
            {i === 2 && (
              <g transform={`translate(${x + bandW / 2 - 4} ${ground - 58})`}>
                <PoseFrame
                  phase={GAIT_PHASES[0]}
                  s={1.18}
                  classes={{
                    bone: styles.cBone,
                    boneFar: styles.cBoneFar,
                    joint: styles.cJoint,
                    head: styles.cHead,
                  }}
                />
              </g>
            )}

            {/* 4 · movement only */}
            {i === 3 && (
              <>
                <path
                  className={styles.cTrace}
                  d={smooth(
                    Array.from({ length: 30 }, (_, k) => {
                      const t = k / 29;
                      return [
                        x + 16 + t * (bandW - 32),
                        top + 108 - Math.sin(t * Math.PI * 3.2) * 34,
                      ] as Pt;
                    }),
                  )}
                />
                {[0.15, 0.45, 0.75].map((t) => (
                  <circle
                    key={t}
                    className={styles.cNode}
                    cx={x + 16 + t * (bandW - 32)}
                    cy={top + 108 - Math.sin(t * Math.PI * 3.2) * 34}
                    r={2.6}
                  />
                ))}
              </>
            )}

            <line
              className={styles.cHair}
              x1={x + 12}
              y1={ground + 8}
              x2={x + bandW - 12}
              y2={ground + 8}
            />
            {i < 3 && (
              <path
                className={styles.cDash}
                d={`M ${x + bandW + 2} ${top + bandH / 2} L ${
                  x + bandW + gap - 2
                } ${top + bandH / 2}`}
              />
            )}
          </g>
        );
      })}

      {/* the two bars: one falls, one does not */}
      <text className={styles.cTiny} x={40} y={296}>
        Identity information
      </text>
      <rect className={styles.cBarTrack} x={40} y={306} width={560} height={5} rx={2.5} />
      <rect className={styles.cBarWarm} x={40} y={306} width={126} height={5} rx={2.5} />

      <text className={styles.cTiny} x={40} y={340}>
        Movement information
      </text>
      <rect className={styles.cBarTrack} x={40} y={350} width={560} height={5} rx={2.5} />
      <rect className={styles.cBarLit} x={40} y={350} width={540} height={5} rx={2.5} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   04 · TRAJECTORY — "A Fall-Risk Score Is Not Enough"
   Five sessions on a baseline, a descending trace, and a cone of possible
   futures opening from the last reading. No figure and no numbers: a single
   dot is a score, a line is a direction, and the cone is the thing a score
   cannot tell you.
   ═══════════════════════════════════════════════════════════════════════════ */

function Trajectory() {
  const x0 = 66;
  const step = 96;
  const base = 300;
  const ys = [116, 140, 152, 176, 198];
  const pts: Pt[] = ys.map((y, i) => [x0 + i * step, y]);
  const last = pts[pts.length - 1];

  return (
    <>
      {/* the sessions */}
      {pts.map(([x], i) => (
        <g key={i}>
          <line className={styles.cHair} x1={x} y1={base} x2={x} y2={base + 8} />
          <text className={styles.cTiny} x={x} y={base + 26} textAnchor="middle">
            {String(i + 1).padStart(2, "0")}
          </text>
        </g>
      ))}
      <line className={styles.cAxis} x1={40} y1={base} x2={600} y2={base} />
      <text className={styles.cTiny} x={40} y={base + 52}>
        Sessions over time
      </text>

      {/* stems, so each session reads as a reading rather than a point on a
          line — a score, taken five times */}
      {pts.map(([x, y], i) => (
        <line key={i} className={styles.cStem} x1={x} y1={y} x2={x} y2={base} />
      ))}

      {/* the trend */}
      <path className={styles.cTrace} d={smooth(pts)} />
      {pts.map(([x, y], i) => (
        <circle
          key={i}
          className={i === pts.length - 1 ? styles.cNodeLit : styles.cNode}
          cx={x}
          cy={y}
          r={i === pts.length - 1 ? 4.6 : 3.4}
        />
      ))}

      {/* the cone of what a single score cannot say */}
      <path
        className={styles.cCone}
        d={`M ${last[0]} ${last[1]} L 606 ${last[1] - 52} L 606 ${
          last[1] + 62
        } Z`}
      />
      <path
        className={styles.cDash}
        d={`M ${last[0]} ${last[1]} L 606 ${last[1] + 34}`}
      />
      <text className={styles.cLabel} x={498} y={92}>
        Direction
      </text>
      <text className={styles.cTiny} x={40} y={72}>
        One score, five times
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

const ART: Record<CoverConcept, () => React.ReactElement> = {
  pipeline: Pipeline,
  divergence: Divergence,
  reduction: Reduction,
  trajectory: Trajectory,
  fusion: Fusion,
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

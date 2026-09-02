import type { CSSProperties } from "react";
import {
  GAIT_HEAD,
  GAIT_NECK,
  GAIT_PHASES,
  type GaitPhase,
  type Pt,
} from "@/components/visuals/gait-phases";
import { allPublications, type Publication } from "@/data/publications";
import styles from "./coverart.module.css";

/**
 * Research cover art for the publication library.
 *
 * The cards used to show the paper's own first page — a PDF screenshot, which
 * reads as bulky and plain at card size and made nine cards look identical
 * (white page, dark masthead, unreadable body text).
 *
 * These are drawn instead: one shared frame — deep navy ground, survey grid,
 * accent glow, corner ticks, a small motif label and the record number — plus
 * a motif specific to what each paper is actually about. Every publication in
 * the library gets its own motif; nothing is reused across records.
 *
 * WHY SVG RATHER THAN GENERATED IMAGE FILES
 * Vector art cannot be blurry, cannot be stretched and cannot be badly
 * cropped: it renders at whatever density the display has, the viewBox fixes
 * the composition at every card width, and there is no asset to ship, cache
 * or keep in sync with the records. It also means the motifs are built from
 * the same canonical gait poses (`gait-phases`) the rest of the site draws
 * with, so the library is visibly part of the same design system rather than
 * a set of illustrations that merely resemble it.
 *
 * The art stays dark in the light theme on purpose. It is a cover, and a
 * cover keeps its own ground the way a book jacket does; inverting it would
 * cost the palette the whole point of the deep-navy-plus-signal look.
 *
 * TEXT is deliberately minimal — one motif label and one record number, both
 * tiny. The card body already carries the title, venue, date and topics, and
 * a cover crowded with type is exactly what the PDF pages were.
 */

type AccentName = "cyan" | "blue" | "violet" | "teal" | "amber";

const ACCENT: Record<AccentName, { a: string; b: string }> = {
  cyan: { a: "#4FD1FF", b: "#2563FF" },
  blue: { a: "#60A5FA", b: "#2563FF" },
  violet: { a: "#A78BFA", b: "#7C3AED" },
  teal: { a: "#5EEAD4", b: "#0FA3B1" },
  amber: { a: "#FBBF24", b: "#D97706" },
};

/* The composition is fixed at 16:10 and the container matches it, so the art
   is never letterboxed and never cropped at any card width. */
const W = 400;
const H = 250;

/* ── Shared primitives ─────────────────────────────────────────────────── */

/**
 * There are five canonical phases (heel strike → loading → mid-stance →
 * toe-off → swing). Wrapping rather than indexing directly keeps a motif from
 * reaching past the end of the cycle, which is a build-time crash during
 * prerender rather than a visual glitch.
 */
function gaitPhase(i: number): GaitPhase {
  return GAIT_PHASES[((i % GAIT_PHASES.length) + GAIT_PHASES.length) % GAIT_PHASES.length];
}

/** A gait pose in the site's canonical pose language. */
function Pose({
  phase,
  x,
  baseY,
  s,
  dim = false,
  strong = false,
}: {
  phase: GaitPhase;
  x: number;
  baseY: number;
  s: number;
  dim?: boolean;
  strong?: boolean;
}) {
  const pts = (p: readonly Pt[]) =>
    p.map(([px, py]) => `${px * s},${py * s}`).join(" ");
  const cls = dim ? styles.poseDim : strong ? styles.poseStrong : styles.pose;

  return (
    <g className={cls} transform={`translate(${x} ${baseY + phase.lift * s})`}>
      <polyline className={styles.limbFar} points={pts(phase.farArm)} />
      <polyline className={styles.limbFar} points={pts(phase.farLeg)} />
      <path
        className={styles.limb}
        d={`M0 0 C${0.4 * s} ${-12 * s} ${0.9 * s} ${-24 * s} ${1.5 * s} ${-34 * s}`}
      />
      <circle
        className={styles.poseHead}
        cx={GAIT_HEAD[0] * s}
        cy={GAIT_HEAD[1] * s}
        r={4.2 * s}
      />
      <polyline className={styles.limb} points={pts(phase.nearArm)} />
      <polyline className={styles.limb} points={pts(phase.nearLeg)} />
      <line
        className={styles.limb}
        x1={phase.nearFoot[0][0] * s}
        y1={phase.nearFoot[0][1] * s}
        x2={phase.nearFoot[1][0] * s}
        y2={phase.nearFoot[1][1] * s}
      />
      {strong &&
        [...phase.nearArm, ...phase.nearLeg, GAIT_NECK].map(([jx, jy], j) => (
          <circle
            key={j}
            className={styles.landmark}
            cx={jx * s}
            cy={jy * s}
            r={1.9 * s}
          />
        ))}
    </g>
  );
}

/** A short right-pointing connector between two stages. */
function Flow({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <g className={styles.flow}>
      <line x1={x1} y1={y} x2={x2 - 5} y2={y} />
      <polyline points={`${x2 - 6},${y - 3} ${x2 - 1},${y} ${x2 - 6},${y + 3}`} />
    </g>
  );
}

/** A stack of processing layers — the "deep pipeline" element. */
function Layers({
  x,
  y,
  rows,
  w = 62,
  gap = 15,
}: {
  x: number;
  y: number;
  rows: number;
  w?: number;
  gap?: number;
}) {
  return (
    <g>
      {Array.from({ length: rows }, (_, i) => (
        <rect
          key={i}
          className={styles.layer}
          x={x + i * 3}
          y={y + i * gap}
          width={w - i * 6}
          height={9}
          rx={4.5}
        />
      ))}
    </g>
  );
}

/* ── Motifs, one per publication ───────────────────────────────────────── */

/** Covariate conditions entering a deep pipeline, ending at one identity. */
function CovariatePipeline() {
  const glyphs = [
    // carrying: a small bag hanging from the torso line
    <rect key="bag" className={styles.glyph} x={-5} y={-4} width={10} height={9} rx={2} />,
    // clothing: a coat shoulder arc
    <path key="coat" className={styles.glyph} d="M-7 4 C-7 -5 7 -5 7 4" />,
    // view: two rays from a vertex
    <g key="view">
      <path className={styles.glyph} d="M-7 5 L0 -5 L7 5" />
    </g>,
  ];

  return (
    <g>
      {[0, 2, 4].map((idx, i) => (
        <g key={idx}>
          <Pose phase={gaitPhase(idx)} x={48 + i * 46} baseY={166} s={1.35} />
          <g transform={`translate(${48 + i * 46} 74)`}>{glyphs[i]}</g>
        </g>
      ))}
      <Flow x1={186} y={132} x2={230} />
      <Layers x={236} y={100} rows={4} />
      <circle className={styles.outNode} cx={352} cy={132} r={7} />
      <circle className={styles.outNodeCore} cx={352} cy={132} r={2.6} />
      <Flow x1={306} y={132} x2={344} />
    </g>
  );
}

/** One identity, several intra-class variants fanning out of it. */
function IntraClassVariation() {
  const fan = [
    { idx: 1, y: 92 },
    { idx: 3, y: 138 },
    { idx: 4, y: 184 },
  ];

  return (
    <g>
      <ellipse className={styles.spread} cx={268} cy={138} rx={92} ry={62} />
      <Pose phase={gaitPhase(0)} x={92} baseY={170} s={1.7} strong />
      {fan.map(({ idx, y }, i) => (
        <g key={idx}>
          <path
            className={styles.branch}
            d={`M126 140 C170 140 178 ${y} 214 ${y}`}
            style={{ "--i": i } as CSSProperties}
          />
          <Pose phase={gaitPhase(idx)} x={252 + (i % 2) * 20} baseY={y + 26} s={1.02} dim />
        </g>
      ))}
    </g>
  );
}

/** A structured body model: landmarks, segments and joint angles. */
function ModelBasedGait() {
  return (
    <g>
      {/* measurement field behind the model */}
      <g className={styles.measure}>
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={54} y1={92 + i * 26} x2={214} y2={92 + i * 26} />
        ))}
      </g>
      <Pose phase={gaitPhase(2)} x={134} baseY={178} s={2.05} strong />
      {/* joint-angle arcs at hip and knee */}
      <path className={styles.angle} d="M134 130 A16 16 0 0 1 149 138" />
      <path className={styles.angle} d="M140 156 A12 12 0 0 1 151 161" />
      {/* the model's parameter rows */}
      <g>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line
              className={styles.paramRail}
              x1={250}
              y1={104 + i * 24}
              x2={352}
              y2={104 + i * 24}
            />
            <circle
              className={styles.paramNode}
              cx={250 + [0.72, 0.34, 0.55, 0.86][i] * 102}
              cy={104 + i * 24}
              r={3.4}
            />
          </g>
        ))}
      </g>
    </g>
  );
}

/** Walking figure → feature maps → an identity pattern. */
function FeaturePatterns() {
  /* Deterministic map intensities: a fixed lattice, so server and client
     markup match and the tile field never looks like noise. */
  const cell = (r: number, c: number) =>
    0.16 + 0.42 * Math.abs(Math.sin((r * 3 + c * 5) * 0.9));

  return (
    <g>
      <Pose phase={gaitPhase(3)} x={56} baseY={170} s={1.55} />
      <Flow x1={92} y={132} x2={140} />
      <g>
        {Array.from({ length: 4 }, (_, r) =>
          Array.from({ length: 4 }, (_, c) => (
            <rect
              key={`${r}-${c}`}
              className={styles.tile}
              x={148 + c * 24}
              y={94 + r * 24}
              width={19}
              height={19}
              rx={3}
              style={{ opacity: cell(r, c) } as CSSProperties}
            />
          )),
        )}
      </g>
      <Flow x1={250} y={132} x2={288} />
      {/* identity signature: a compact repeating pattern, not a waveform */}
      <g className={styles.signature}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line
            key={i}
            x1={296 + i * 10}
            y1={132 - (4 + 14 * Math.abs(Math.sin(i * 1.1)))}
            x2={296 + i * 10}
            y2={132 + (4 + 9 * Math.abs(Math.cos(i * 0.8)))}
          />
        ))}
      </g>
    </g>
  );
}

/** Raw capture → cleaning → a sparse set of selected features. */
function PreprocessSelect() {
  const raw = Array.from({ length: 26 }, (_, i) => {
    const x = 42 + i * 3.4;
    const jitter =
      Math.sin(i * 2.3) * 7 + Math.sin(i * 5.7) * 4 + Math.sin(i * 0.9) * 9;
    return `${x},${132 + jitter}`;
  }).join(" ");

  const clean = Array.from({ length: 26 }, (_, i) => {
    const x = 176 + i * 3.4;
    return `${x},${132 + Math.sin(i * 0.55) * 11}`;
  }).join(" ");

  /* Feature selection: most candidates are dropped, four are kept. */
  const kept = new Set([2, 6, 9, 13]);

  return (
    <g>
      <polyline className={styles.rawSignal} points={raw} />
      {/* the cleaning gate */}
      <g className={styles.gate}>
        <path d="M146 100 L138 100 L138 164 L146 164" />
        <path d="M164 100 L172 100 L172 164 L164 164" />
      </g>
      <polyline className={styles.cleanSignal} points={clean} />
      {/* selection lattice */}
      <g>
        {Array.from({ length: 15 }, (_, i) => {
          const cx = 288 + (i % 5) * 24;
          const cy = 100 + Math.floor(i / 5) * 32;
          const on = kept.has(i);
          return (
            <circle
              key={i}
              className={on ? styles.keptNode : styles.droppedNode}
              cx={cx}
              cy={cy}
              r={on ? 5 : 3}
            />
          );
        })}
      </g>
      <Flow x1={266} y={132} x2={282} />
    </g>
  );
}

/** Extraction → reduction → transformation → class separation. */
function ExtractReduceClassify() {
  const stages = [
    { x: 52, n: 11, h: 62 },
    { x: 138, n: 7, h: 46 },
    { x: 216, n: 4, h: 30 },
  ];

  return (
    <g>
      {stages.map((s, si) => (
        <g key={si}>
          {Array.from({ length: s.n }, (_, i) => {
            const y = 132 - s.h / 2 + (i * s.h) / (s.n - 1);
            return (
              <line
                key={i}
                className={styles.featureTick}
                x1={s.x}
                y1={y}
                x2={s.x + 26}
                y2={y}
              />
            );
          })}
          {si < stages.length - 1 && (
            <path
              className={styles.converge}
              d={`M${s.x + 30} ${132 - s.h / 2} L${stages[si + 1].x - 4} ${
                132 - stages[si + 1].h / 2
              } M${s.x + 30} ${132 + s.h / 2} L${stages[si + 1].x - 4} ${
                132 + stages[si + 1].h / 2
              }`}
            />
          )}
        </g>
      ))}
      {/* separated classes */}
      <g>
        {[
          { cx: 306, cy: 104, n: 4 },
          { cx: 344, cy: 146, n: 4 },
          { cx: 300, cy: 176, n: 3 },
        ].map((cl, ci) => (
          <g key={ci}>
            <circle className={styles.cluster} cx={cl.cx} cy={cl.cy} r={20} />
            {Array.from({ length: cl.n }, (_, i) => {
              const a = (i / cl.n) * Math.PI * 2 + ci;
              return (
                <circle
                  key={i}
                  className={styles.clusterPoint}
                  cx={cl.cx + Math.cos(a) * 9}
                  cy={cl.cy + Math.sin(a) * 9}
                  r={2.6}
                />
              );
            })}
          </g>
        ))}
      </g>
      <path className={styles.converge} d="M250 118 L282 108 M250 146 L282 154" />
    </g>
  );
}

/** One pose signature holding across viewing conditions. */
function PoseInvariance() {
  return (
    <g>
      {/* the invariance ring, with three sampling positions on it */}
      <ellipse className={styles.ring} cx={140} cy={134} rx={100} ry={74} />
      {[0.16, 0.5, 0.84].map((t, i) => {
        const a = t * Math.PI * 2 - Math.PI / 2;
        return (
          <g key={i}>
            <circle
              className={styles.viewNode}
              cx={140 + Math.cos(a) * 100}
              cy={134 + Math.sin(a) * 74}
              r={4}
            />
            <line
              className={styles.viewRay}
              x1={140 + Math.cos(a) * 100}
              y1={134 + Math.sin(a) * 74}
              x2={140 + Math.cos(a) * 34}
              y2={134 + Math.sin(a) * 26}
            />
          </g>
        );
      })}
      <Pose phase={gaitPhase(4)} x={140} baseY={172} s={1.72} strong />
      {/* the same extracted signature under each condition — identical bars */}
      <g className={styles.invariantSet}>
        {[0, 1, 2].map((k) => (
          <g key={k} transform={`translate(${272} ${86 + k * 46})`}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line
                key={i}
                className={styles.invariantTick}
                x1={i * 12}
                y1={-6 - 8 * Math.abs(Math.sin(i * 1.2))}
                x2={i * 12}
                y2={6 + 5 * Math.abs(Math.cos(i * 0.9))}
              />
            ))}
          </g>
        ))}
      </g>
    </g>
  );
}

/** Identifiable capture transformed into protected, non-identifying data. */
function PrivacyPipeline() {
  /* The "before": a coarse pixel block standing in for identifiable video.
     Deliberately unreadable — that is the point of the transformation. */
  const px = (r: number, c: number) =>
    0.1 + 0.34 * Math.abs(Math.sin((r * 2.7 + c * 4.1) * 0.8));

  return (
    <g>
      <g>
        {Array.from({ length: 7 }, (_, r) =>
          Array.from({ length: 5 }, (_, c) => (
            <rect
              key={`${r}-${c}`}
              className={styles.pixel}
              x={46 + c * 14}
              y={82 + r * 14}
              width={13}
              height={13}
              style={{ opacity: px(r, c) } as CSSProperties}
            />
          )),
        )}
      </g>

      {/* the protection boundary the data passes through */}
      <rect
        className={styles.boundary}
        x={168}
        y={72}
        width={64}
        height={122}
        rx={12}
      />
      <g className={styles.lock} transform="translate(200 133)">
        <rect x={-9} y={-2} width={18} height={14} rx={3.5} />
        <path d="M-5 -2 L-5 -7 A5 5 0 0 1 5 -7 L5 -2" />
      </g>
      <Flow x1={124} y={133} x2={164} />
      <Flow x1={236} y={133} x2={276} />

      {/* the "after": pose only — geometry kept, appearance gone */}
      <Pose phase={gaitPhase(2)} x={324} baseY={176} s={1.62} strong />
    </g>
  );
}

/** Gait inference running on the device rather than in a datacentre. */
function EdgeInference() {
  return (
    <g>
      {/* device outline with its pin rows */}
      <rect
        className={styles.device}
        x={92}
        y={62}
        width={216}
        height={142}
        rx={16}
      />
      <g className={styles.pins}>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line x1={78} y1={86 + i * 24} x2={92} y2={86 + i * 24} />
            <line x1={308} y1={86 + i * 24} x2={322} y2={86 + i * 24} />
          </g>
        ))}
      </g>
      {/* on-device: the movement, and the optimized stack reading it */}
      <Pose phase={gaitPhase(0)} x={140} baseY={172} s={1.36} />
      <Layers x={196} y={102} rows={4} w={86} gap={16} />
      <Flow x1={172} y={133} x2={192} />
      {/* the edge nodes it answers to, kept outside the die */}
      <g>
        {[
          [46, 104],
          [46, 166],
          [354, 133],
        ].map(([cx, cy], i) => (
          <circle key={i} className={styles.edgeNode} cx={cx} cy={cy} r={4.4} />
        ))}
      </g>
    </g>
  );
}

/* ── Record → art mapping ──────────────────────────────────────────────── */

type Art = {
  accent: AccentName;
  /** Tiny label in the cover's lower-left. Two or three words, no more. */
  label: string;
  motif: () => JSX.Element;
  /** Where the accent glow sits, so the light follows the motif's mass. */
  glow: Pt;
};

/**
 * One entry per record in `publications.ts`, keyed by its id. Each motif is
 * drawn from that paper's own subject — its title and its declared keywords —
 * so no two covers in the library repeat.
 */
const ART: Record<string, Art> = {
  "ai-review-2023": {
    accent: "cyan",
    label: "Covariates → pipeline",
    motif: CovariatePipeline,
    glow: [300, 120],
  },
  "neurocomputing-2022": {
    accent: "teal",
    label: "Intra-class variation",
    motif: IntraClassVariation,
    glow: [268, 138],
  },
  "eaai-2024": {
    accent: "blue",
    label: "Model-based gait",
    motif: ModelBasedGait,
    glow: [140, 140],
  },
  "dsp-2024": {
    accent: "violet",
    label: "Pattern recognition",
    motif: FeaturePatterns,
    glow: [200, 130],
  },
  "prl-2023": {
    accent: "cyan",
    label: "Preprocessing · selection",
    motif: PreprocessSelect,
    glow: [330, 130],
  },
  "ivc-2023": {
    accent: "blue",
    label: "Extract → classify",
    motif: ExtractReduceClassify,
    glow: [320, 140],
  },
  "iet-pose-2022": {
    accent: "teal",
    label: "Pose invariance",
    motif: PoseInvariance,
    glow: [140, 134],
  },
  "iet-privacy-2022": {
    accent: "violet",
    label: "Privacy pipeline",
    motif: PrivacyPipeline,
    glow: [200, 133],
  },
  "patent-covariate-gait-edge": {
    accent: "amber",
    label: "Edge inference",
    motif: EdgeInference,
    glow: [200, 133],
  },
};

/**
 * Record-type badge, derived only from data already on the record: the `kind`
 * field, and for papers the wording the authors themselves used in the title.
 * Nothing here is assigned a label its own metadata does not support.
 */
export function publicationKindLabel(pub: Publication): string {
  if (pub.kind === "patent") return "Granted patent";
  const t = pub.title.toLowerCase();
  if (t.includes("review")) return "Review";
  if (t.includes("survey")) return "Survey";
  if (t.includes("comparative study")) return "Comparative study";
  return "Journal article";
}

/** Is there cover art for this record? */
export function hasCoverArt(pub: Publication): boolean {
  return pub.id in ART;
}

/**
 * The record's own number in the library, not its position in the rendered
 * grid. Grid position changes every time the reader filters or re-sorts, and
 * a "paper number" that moves is worse than no number at all.
 */
function recordNumber(pub: Publication) {
  const i = allPublications.findIndex((p) => p.id === pub.id);
  return i < 0 ? undefined : i + 1;
}

export function PublicationCoverArt({
  publication,
  className,
  compact = false,
}: {
  publication: Publication;
  className?: string;
  /** Thumbnail mode: motif and frame only, no type. */
  compact?: boolean;
}) {
  const art = ART[publication.id];
  if (!art) return null;
  const index = recordNumber(publication);

  const { a, b } = ACCENT[art.accent];
  const uid = `pubart-${publication.id}`;
  const Motif = art.motif;

  return (
    <svg
      role="img"
      aria-label={`${art.label} — cover art for ${publication.title}`}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={`${styles.art} ${className ?? ""}`}
      style={{ "--a": a, "--b": b } as CSSProperties}
    >
      <defs>
        <linearGradient id={`${uid}-ground`} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor="#0A1120" />
          <stop offset="1" stopColor="#060A13" />
        </linearGradient>
        <radialGradient
          id={`${uid}-glow`}
          cx={art.glow[0] / W}
          cy={art.glow[1] / H}
          r="0.62"
        >
          <stop offset="0" stopColor={a} stopOpacity="0.2" />
          <stop offset="0.55" stopColor={b} stopOpacity="0.07" />
          <stop offset="1" stopColor={b} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={W} height={H} fill={`url(#${uid}-ground)`} />

      {/* Survey grid — the technical ground the motif sits on. */}
      <g className={styles.grid}>
        {Array.from({ length: Math.floor(W / 25) - 1 }, (_, i) => (
          <line key={`v${i}`} x1={(i + 1) * 25} y1={0} x2={(i + 1) * 25} y2={H} />
        ))}
        {Array.from({ length: Math.floor(H / 25) - 1 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={(i + 1) * 25} x2={W} y2={(i + 1) * 25} />
        ))}
      </g>

      <rect width={W} height={H} fill={`url(#${uid}-glow)`} />

      <Motif />

      {/* Corner ticks — the editorial frame. Three, not four: the card
          overlays its type badge on the top-left corner, and a tick behind a
          badge reads as a misalignment rather than as a frame. */}
      <g className={styles.corners}>
        {[
          [W - 14, 14, -1, 1],
          [14, H - 14, 1, -1],
          [W - 14, H - 14, -1, -1],
        ].map(([cx, cy, sx, sy], i) => (
          <path
            key={i}
            d={`M${cx} ${cy + sy * 11} L${cx} ${cy} L${cx + sx * 11} ${cy}`}
          />
        ))}
      </g>

      {/* Type is inset past the corner ticks so it never sits on one. */}
      {!compact && (
        <>
          <text className={styles.label} x={34} y={H - 19}>
            {art.label}
          </text>
          {index !== undefined && (
            <text className={styles.index} x={W - 34} y={H - 19}>
              {String(index).padStart(2, "0")}
            </text>
          )}
        </>
      )}

      {/* Inner hairline, so the art has its own edge inside the card. */}
      <rect
        className={styles.edge}
        x={0.5}
        y={0.5}
        width={W - 1}
        height={H - 1}
      />
    </svg>
  );
}

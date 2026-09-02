import type { CSSProperties, ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";

type MissionVisionProps = {
  motion?: "ambient" | "gait";
};

type Pt = readonly [number, number];

type GaitPhase = {
  id: string;
  /** Pelvis drop below the mid-stance high point, in local px. */
  lift: number;
  /** shoulder → elbow → wrist */
  nearArm: readonly [Pt, Pt, Pt];
  farArm: readonly [Pt, Pt, Pt];
  /** hip → knee → ankle */
  nearLeg: readonly [Pt, Pt, Pt];
  farLeg: readonly [Pt, Pt, Pt];
  /** ankle → toe */
  nearFoot: readonly [Pt, Pt];
  farFoot: readonly [Pt, Pt];
  /** x positions of ground contact under the figure */
  contacts: readonly number[];
};

/**
 * One stride of a side-view walk, sampled at five canonical gait events.
 * Coordinates are local to the figure: pelvis at (0,0), ground at y≈48,
 * walking direction +x. The near side is drawn in front; the far side sits
 * dimmer behind the torso. Opposite arm/leg swing, knee flexion, pelvic
 * vertical oscillation and trailing/leading foot contact are all encoded
 * in the data — no limbs are placed by transforms.
 */
const GAIT_PHASES: readonly GaitPhase[] = [
  {
    id: "heel-strike",
    lift: 1.5,
    nearArm: [[1.5, -33], [-6, -19], [-12, -5]],
    farArm: [[1.5, -33], [10, -19], [17, -6]],
    nearLeg: [[2, 0], [13, 23], [23, 46]],
    farLeg: [[-2, 0], [-11, 23], [-19, 42]],
    nearFoot: [[23, 46], [32, 43]],
    farFoot: [[-19, 42], [-12, 47]],
    contacts: [23, -12],
  },
  {
    id: "loading",
    lift: 1,
    nearArm: [[1.5, -33], [-4, -19], [-9, -4]],
    farArm: [[1.5, -33], [8, -19], [13, -5]],
    nearLeg: [[2, 0], [12, 24], [19, 45]],
    farLeg: [[-2, 0], [-9, 24], [-15, 43]],
    nearFoot: [[19, 45], [27, 47]],
    farFoot: [[-15, 43], [-9, 47]],
    contacts: [22, -9],
  },
  {
    id: "mid-stance",
    lift: 0,
    nearArm: [[1.5, -33], [0, -19], [-3, -5]],
    farArm: [[1.5, -33], [3, -19], [5, -5]],
    nearLeg: [[2, 0], [3, 25], [3, 47]],
    farLeg: [[-2, 0], [-3, 21], [-9, 35]],
    nearFoot: [[3, 47], [11, 48]],
    farFoot: [[-9, 35], [-4, 40]],
    contacts: [7],
  },
  {
    id: "toe-off",
    lift: 1.5,
    nearArm: [[1.5, -33], [9, -19], [16, -5]],
    farArm: [[1.5, -33], [-7, -19], [-13, -5]],
    nearLeg: [[-1, 0], [-10, 22], [-18, 41]],
    farLeg: [[2, 0], [12, 23], [21, 46]],
    nearFoot: [[-18, 41], [-11, 47]],
    farFoot: [[21, 46], [30, 43]],
    contacts: [-11, 21],
  },
  {
    id: "swing",
    lift: 0.5,
    nearArm: [[1.5, -33], [2, -19], [0, -4]],
    farArm: [[1.5, -33], [1, -19], [3, -5]],
    nearLeg: [[0, 0], [7, 19], [1, 34]],
    farLeg: [[-1, 0], [0, 25], [0, 47]],
    nearFoot: [[1, 34], [7, 38]],
    farFoot: [[0, 47], [8, 48]],
    contacts: [4],
  },
];

const NECK: Pt = [1.5, -34];
const HEAD: Pt = [2, -42];

const WALKER_TONES = {
  cyan: ["cyan", "cyan", "cyan", "cyan", "cyan"],
  violet: ["blue", "blue", "indigo", "violet", "violet"],
} as const;

function MocapFrame({
  phase,
  prevPhase,
  x,
  prevX,
  baseY,
  s,
  order,
  tone,
}: {
  phase: GaitPhase;
  prevPhase: GaitPhase;
  x: number;
  prevX: number;
  baseY: number;
  /** Figure scale — coordinates are multiplied numerically so ghost math stays simple. */
  s: number;
  order: number;
  tone: string;
}) {
  const pts = (p: readonly Pt[]) =>
    p.map(([px, py]) => `${px * s},${py * s}`).join(" ");
  const groundY = (48 - phase.lift) * s;
  const originY = baseY + phase.lift * s;
  const prevOriginY = baseY + prevPhase.lift * s;
  const spine = `M0 0 C${0.4 * s} ${-12 * s} ${0.9 * s} ${-24 * s} ${1.5 * s} ${-34 * s}`;

  const farJoints: readonly Pt[] = [
    phase.farArm[1],
    phase.farArm[2],
    ...phase.farLeg,
  ];
  const nearJoints: readonly Pt[] = [...phase.nearArm, ...phase.nearLeg];

  /* Trailing previous-position dots (·  ·  ●) for hip, knee, ankle and
     wrist, placed along each joint's actual path from the previous
     captured frame. They live inside the frame group so they surface and
     fade with the frame's temporal highlight. */
  const ghostTracks: readonly (readonly [Pt, Pt])[] = [
    [prevPhase.nearLeg[0], phase.nearLeg[0]],
    [prevPhase.nearLeg[1], phase.nearLeg[1]],
    [prevPhase.nearLeg[2], phase.nearLeg[2]],
    [prevPhase.nearArm[2], phase.nearArm[2]],
  ];
  const ghostSteps = [
    { f: 0.45, r: 0.9 * s, o: 0.24 },
    { f: 0.72, r: 1.15 * s, o: 0.42 },
  ] as const;

  return (
    <g
      className={`mission-vision-mocap-frame mission-vision-mocap-frame--${tone}`}
      transform={`translate(${x} ${originY})`}
      style={{ "--mv-i": order } as CSSProperties}
    >
      {phase.contacts.map((contactX) => (
        <ellipse
          key={contactX}
          className="mission-vision-mocap-contact"
          cx={contactX * s}
          cy={groundY}
          rx={8 * s}
          ry={1.8 * s}
        />
      ))}

      {ghostTracks.map(([pj, cj], gi) =>
        ghostSteps.map(({ f, r, o }) => {
          const gx =
            (prevX + pj[0] * s) * (1 - f) + (x + cj[0] * s) * f - x;
          const gy =
            (prevOriginY + pj[1] * s) * (1 - f) +
            (originY + cj[1] * s) * f -
            originY;
          return (
            <circle
              key={`g${gi}-${f}`}
              className="mission-vision-mocap-ghost"
              cx={Math.round(gx * 10) / 10}
              cy={Math.round(gy * 10) / 10}
              r={r}
              opacity={o}
            />
          );
        })
      )}

      <polyline
        className="mission-vision-mocap-bone mission-vision-mocap-bone--far mission-vision-mocap-arm mission-vision-mocap-arm--far"
        points={pts(phase.farArm)}
      />
      <polyline
        className="mission-vision-mocap-bone mission-vision-mocap-bone--far"
        points={pts(phase.farLeg)}
      />
      <line
        className="mission-vision-mocap-bone mission-vision-mocap-bone--far"
        x1={phase.farFoot[0][0] * s}
        y1={phase.farFoot[0][1] * s}
        x2={phase.farFoot[1][0] * s}
        y2={phase.farFoot[1][1] * s}
      />

      <path className="mission-vision-mocap-bone" d={spine} />
      <circle
        className="mission-vision-mocap-head"
        cx={HEAD[0] * s}
        cy={HEAD[1] * s}
        r={4.5 * s}
      />

      <polyline
        className="mission-vision-mocap-bone mission-vision-mocap-arm"
        points={pts(phase.nearArm)}
      />
      <polyline className="mission-vision-mocap-bone" points={pts(phase.nearLeg)} />
      <line
        className="mission-vision-mocap-bone"
        x1={phase.nearFoot[0][0] * s}
        y1={phase.nearFoot[0][1] * s}
        x2={phase.nearFoot[1][0] * s}
        y2={phase.nearFoot[1][1] * s}
      />

      {farJoints.map(([jx, jy], j) => (
        <circle
          key={`f${j}`}
          className="mission-vision-mocap-joint mission-vision-mocap-joint--far"
          cx={jx * s}
          cy={jy * s}
          r={1.7 * s}
        />
      ))}
      {nearJoints.map(([jx, jy], j) => (
        <circle
          key={`n${j}`}
          className="mission-vision-mocap-joint"
          cx={jx * s}
          cy={jy * s}
          r={2.1 * s}
        />
      ))}
      <circle
        className="mission-vision-mocap-joint"
        cx={NECK[0] * s}
        cy={NECK[1] * s}
        r={1.9 * s}
      />

      {/* Temporal samples emitted by this frame, sinking toward the signal. */}
      {[0, 1, 2].map((k) => {
        const h = (6 + ((order * 5 + k * 7) % 11)) * s;
        const tx = (-10 + k * 10) * s;
        return (
          <line
            key={k}
            className="mission-vision-mocap-tick"
            x1={tx}
            y1={groundY + 9 * s}
            x2={tx}
            y2={groundY + 9 * s + h}
          />
        );
      })}
    </g>
  );
}

function MocapWalker({
  variant,
  compact = false,
  className,
}: {
  variant: "cyan" | "violet";
  compact?: boolean;
  className?: string;
}) {
  /* Four clearly separated gait events per side (three on mobile) — wider
     spacing keeps every pose readable instead of overlapping silhouettes. */
  const indices = compact ? [0, 2, 4] : [0, 2, 3, 4];
  const s = compact ? 1.35 : 1.5;
  const spacing = compact ? 66 : 76;
  const width = compact ? 240 : 320;
  const height = compact ? 186 : 208;
  const baseY = compact ? 72 : 78;
  const x0 = compact ? 50 : 46;
  const xs = indices.map((_, i) => x0 + i * spacing);
  const groundY = baseY + 48 * s;
  const phaseShift = variant === "violet" && !compact ? "-1.6s" : "0s";

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      className={`mission-vision-mocap${compact ? " mission-vision-mocap--compact" : ""}${
        className ? ` ${className}` : ""
      }`}
      style={
        {
          "--mv-n": indices.length,
          "--mv-phase": phaseShift,
        } as CSSProperties
      }
    >
      <line
        className="mission-vision-mocap-ground"
        x1="8"
        y1={groundY}
        x2={width - 8}
        y2={groundY}
      />
      {indices.map((phaseIndex, order) => (
        <MocapFrame
          key={GAIT_PHASES[phaseIndex].id}
          phase={GAIT_PHASES[phaseIndex]}
          prevPhase={
            GAIT_PHASES[order === 0 ? indices[indices.length - 1] : indices[order - 1]]
          }
          x={xs[order]}
          prevX={order === 0 ? xs[0] - spacing : xs[order - 1]}
          baseY={baseY}
          s={s}
          order={order}
          tone={WALKER_TONES[variant][phaseIndex]}
        />
      ))}
    </svg>
  );
}

type DnaSample = {
  x: number;
  up: number;
  down: number;
  dot: number | null;
  /** Occasional emphasized sample — reads as a processed key event. */
  strong: boolean;
};

/** Small deterministic PRNG so the signal is identical on server and client. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Motion DNA: irregular vertical temporal samples around a bright baseline.
 * Asymmetric up/down extents and clustered bursts keep it reading as gait
 * data rather than an audio waveform or ECG trace.
 */
function buildDnaSamples(seed: number, width: number, amp: number): readonly DnaSample[] {
  const rand = mulberry32(seed);
  const samples: DnaSample[] = [];
  let x = 14;
  while (x < width - 14) {
    const t = x / width;
    const center = Math.sin(Math.PI * t);
    // Amplitude and density both peak toward the center of the composition.
    const envelope = 0.42 + 0.78 * Math.pow(center, 1.35);
    const burst = rand() < 0.16 ? 1.75 : 1;
    const up = (5 + rand() * 23) * envelope * burst * amp;
    const down = (2.5 + rand() * 12) * envelope * burst * amp;
    const roll = rand();
    const dot =
      roll < 0.16
        ? -(up + 4 + rand() * 7)
        : roll > 0.87
          ? down + 4 + rand() * 6
          : null;
    samples.push({
      x: Math.round(x * 10) / 10,
      up: Math.round(up * 10) / 10,
      down: Math.round(down * 10) / 10,
      dot: dot === null ? null : Math.round(dot * 10) / 10,
      strong: burst > 1,
    });
    x += (3.5 + rand() * 8) * (1.3 - 0.55 * center) + (rand() < 0.05 ? 14 : 0);
  }
  return samples;
}

const DNA_SAMPLES_WIDE = buildDnaSamples(20260831, 1600, 1.15);
const DNA_SAMPLES_COMPACT = buildDnaSamples(77, 400, 0.8);

function MotionDnaSignal({
  idPrefix,
  width,
  height,
  baseline,
  samples,
  pulse,
  travelers,
  preserve,
  className,
}: {
  idPrefix: string;
  width: number;
  height: number;
  baseline: number;
  samples: readonly DnaSample[];
  pulse: { from: string; to: string; rx: number; ry: number };
  /** Luminous data dots drifting along the baseline, left → right. */
  travelers: { count: number; duration: number };
  preserve: string;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={preserve}
      className={className}
      style={
        {
          "--mv-pulse-from": pulse.from,
          "--mv-pulse-to": pulse.to,
          "--mv-travel-dur": `${travelers.duration}s`,
        } as CSSProperties
      }
    >
      <defs>
        <linearGradient
          id={`${idPrefix}-stroke`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2={width}
          y2="0"
        >
          <stop offset="0" stopColor="#4fd1ff" stopOpacity="0" />
          <stop offset="0.08" stopColor="#4fd1ff" stopOpacity="0.62" />
          <stop offset="0.3" stopColor="#4fd1ff" stopOpacity="0.78" />
          <stop offset="0.52" stopColor="#2563ff" stopOpacity="0.8" />
          <stop offset="0.74" stopColor="#8b5cf6" stopOpacity="0.78" />
          <stop offset="0.93" stopColor="#8b5cf6" stopOpacity="0.6" />
          <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id={`${idPrefix}-baseline`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2={width}
          y2="0"
        >
          <stop offset="0" stopColor="#4fd1ff" stopOpacity="0" />
          <stop offset="0.3" stopColor="#67e8f9" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#93c5fd" stopOpacity="0.95" />
          <stop offset="0.7" stopColor="#a78bfa" stopOpacity="0.5" />
          <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${idPrefix}-pulse`}>
          <stop offset="0" stopColor="#bfe8ff" stopOpacity="0.4" />
          <stop offset="0.55" stopColor="#4fa8ff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#4fa8ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className="mission-vision-dna-pulse">
        <ellipse cx="0" cy={baseline} rx={pulse.rx} ry={pulse.ry} fill={`url(#${idPrefix}-pulse)`} />
      </g>

      {/* Gentle amplitude breathing on the sampled waveform. */}
      <g className="mission-vision-dna-wave">
        {/* Faint temporal echo of the signal, one sample-step behind. */}
        <g className="mission-vision-dna-echo">
          {samples.map((s) => (
            <line
              key={`e${s.x}`}
              x1={s.x - 3}
              x2={s.x - 3}
              y1={baseline - s.up * 0.62}
              y2={baseline + s.down * 0.62}
              stroke={`url(#${idPrefix}-stroke)`}
            />
          ))}
        </g>

        {samples.map((s) => (
          <line
            key={s.x}
            className={`mission-vision-dna-sample${
              s.strong ? " mission-vision-dna-sample--strong" : ""
            }`}
            x1={s.x}
            x2={s.x}
            y1={baseline - s.up}
            y2={baseline + s.down}
            stroke={`url(#${idPrefix}-stroke)`}
          />
        ))}
        {samples
          .filter((s) => s.dot !== null)
          .map((s) => (
            <circle
              key={`d${s.x}`}
              className="mission-vision-dna-dot"
              cx={s.x}
              cy={baseline + (s.dot as number)}
              r="1.6"
              fill={`url(#${idPrefix}-stroke)`}
            />
          ))}
      </g>

      <line
        className="mission-vision-dna-baseline"
        x1="10"
        x2={width - 10}
        y1={baseline}
        y2={baseline}
        stroke={`url(#${idPrefix}-baseline)`}
      />

      {/* Signal data dots travelling Mission → Motion DNA → Vision, tinting
          cyan → electric blue → violet as they cross the composition. */}
      {Array.from({ length: travelers.count }, (_, i) => (
        <g
          key={i}
          className="mission-vision-dna-traveler"
          style={
            {
              "--mv-travel-delay": `${(-i * travelers.duration) / travelers.count}s`,
            } as CSSProperties
          }
        >
          <circle className="mission-vision-dna-traveler-halo" cx="0" cy={baseline} r="5.5" />
          <circle className="mission-vision-dna-traveler-core" cx="0" cy={baseline} r="1.9" />
        </g>
      ))}
    </svg>
  );
}

function GaitCard({
  tone,
  title,
  children,
}: {
  tone: "cyan" | "violet";
  title: string;
  children: ReactNode;
}) {
  const isCyan = tone === "cyan";
  return (
    <div className={`mission-vision-card-aura mission-vision-card-aura--${tone} h-full`}>
      <article
        className={`mission-vision-card ${
          isCyan ? "mission-vision-card--mission" : "mission-vision-card--vision"
        } relative z-10 h-full overflow-hidden rounded-3xl border p-6 sm:p-8 lg:px-8 lg:py-7 ${
          isCyan ? "border-cyan-300/25" : "border-violet-300/25"
        }`}
      >
        <div
          className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${
            isCyan ? "via-cyan-300/70" : "via-violet-300/70"
          } to-transparent`}
        />
        <div
          className={`mission-vision-label text-[11px] font-semibold uppercase tracking-[0.2em] ${
            isCyan ? "text-cyan-300" : "text-violet-300"
          }`}
        >
          <span>{title}</span>
          <span
            aria-hidden="true"
            className={`mission-vision-label-signal mission-vision-label-signal--${tone}`}
          />
        </div>
        <p className="mt-4 max-w-[34ch] font-display text-xl leading-[1.42] text-balance text-soft-white/[0.92] sm:text-2xl sm:leading-[1.42] lg:text-[1.3rem] xl:text-[1.38rem]">
          {children}
        </p>
      </article>
    </div>
  );
}

function GaitMissionVision() {
  return (
    <section
      id="mission-vision"
      aria-label="Mission and vision"
      className="mission-vision-section mission-vision-section--gait relative isolate overflow-hidden border-y border-white/[0.06] py-10 sm:py-14 lg:flex lg:min-h-[440px] lg:flex-col lg:justify-center lg:py-7"
    >
      <Reveal
        y={0}
        amount={0.08}
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="mission-vision-effects mission-vision-gait-stage absolute inset-0"
        >
          {/* BACK layer: faint grid only — walking + signal carry the interest */}
          <div className="mission-vision-gait-grid" />

          {/* MIDDLE layer: full-width Motion DNA signal through the center */}
          <div className="mission-vision-dna-band hidden lg:block">
            <MotionDnaSignal
              idPrefix="mv-dna-lg"
              width={1600}
              height={150}
              baseline={78}
              samples={DNA_SAMPLES_WIDE}
              pulse={{ from: "-180px", to: "1780px", rx: 110, ry: 52 }}
              travelers={{ count: 3, duration: 16 }}
              preserve="xMidYMid slice"
              className="mission-vision-dna h-full w-full"
            />
            {/* Sample clusters near each walking sequence brighten once per
                gait cycle, as the active frame lands. */}
            <div className="mission-vision-dna-sync mission-vision-dna-sync--cyan" />
            <div className="mission-vision-dna-sync mission-vision-dna-sync--violet" />
          </div>
        </div>
      </Reveal>

      <div className="relative z-10 mx-auto w-full max-w-[1520px] px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1.8fr)_minmax(0,0.62fr)_minmax(0,1.8fr)_minmax(0,1.12fr)] lg:gap-5 xl:gap-6">
          {/* LEFT: cyan walking capture (desktop) */}
          <Reveal className="hidden lg:block lg:order-1">
            <MocapWalker
              variant="cyan"
              className="lg:-mx-5 lg:w-[calc(100%+2.5rem)] lg:max-w-none"
            />
          </Reveal>

          {/* MISSION */}
          <Reveal delay={0.08} className="order-1 lg:order-2 lg:self-stretch">
            <GaitCard tone="cyan" title="Mission">
              To turn human movement into actionable intelligence that improves
              mobility, performance, safety and security.
            </GaitCard>
          </Reveal>

          {/* Mobile: compact cyan walking capture */}
          <Reveal delay={0.12} className="order-2 lg:hidden">
            <MocapWalker variant="cyan" compact className="mx-auto max-w-[300px]" />
          </Reveal>

          {/* CENTER: Motion DNA label (+ compact signal on mobile) */}
          <Reveal delay={0.16} className="order-3 lg:order-3">
            <div className="flex flex-col items-center text-center lg:-translate-y-12">
              {/* Soft dark pocket (no box) keeps the label readable where the
                  signal is strongest. */}
              <div className="mission-vision-dna-label">
                <div className="flex items-center justify-center gap-3">
                  <span aria-hidden="true" className="mission-vision-dna-label-rule" />
                  <p className="whitespace-nowrap text-[13.5px] font-semibold uppercase tracking-[0.42em] text-soft-white/90 [text-indent:0.42em]">
                    Motion DNA
                  </p>
                  <span
                    aria-hidden="true"
                    className="mission-vision-dna-label-rule mission-vision-dna-label-rule--violet"
                  />
                </div>
                <p className="mt-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-soft-mute">
                  {/* Same words, two layouts. The desktop copy stays in the
                      accessibility tree at every width, so this one is hidden
                      from it — otherwise the line is announced twice. */}
                  <span aria-hidden="true" className="whitespace-nowrap lg:hidden">
                    One signal <span className="text-royal-300">→</span> Multiple
                    intelligences
                  </span>
                  <span className="hidden lg:block">
                    <span className="block whitespace-nowrap">One signal</span>
                    <span
                      aria-hidden="true"
                      className="my-0.5 inline-block rotate-90 text-[11px] text-royal-300"
                    >
                      →
                    </span>
                    <span className="block whitespace-nowrap">
                      Multiple intelligences
                    </span>
                  </span>
                </p>
              </div>
              <MotionDnaSignal
                idPrefix="mv-dna-sm"
                width={400}
                height={100}
                baseline={50}
                samples={DNA_SAMPLES_COMPACT}
                pulse={{ from: "-70px", to: "470px", rx: 56, ry: 34 }}
                travelers={{ count: 2, duration: 12 }}
                preserve="xMidYMid meet"
                className="mission-vision-dna mt-5 w-full lg:hidden"
              />
            </div>
          </Reveal>

          {/* VISION */}
          <Reveal delay={0.16} className="order-4 lg:order-4 lg:self-stretch">
            <GaitCard tone="violet" title="Vision">
              To make movement intelligence a trusted layer of{" "}
              <span className="whitespace-nowrap">decision-making</span> across
              healthcare, sports, enterprise and{" "}
              <span className="whitespace-nowrap">public-safety</span>{" "}
              environments.
            </GaitCard>
          </Reveal>

          {/* Mobile: compact violet walking capture */}
          <Reveal delay={0.2} className="order-5 lg:hidden">
            <MocapWalker variant="violet" compact className="mx-auto max-w-[300px]" />
          </Reveal>

          {/* RIGHT: blue→violet walking capture (desktop) */}
          <Reveal delay={0.08} className="hidden lg:block lg:order-5">
            <MocapWalker
              variant="violet"
              className="lg:-mx-5 lg:w-[calc(100%+2.5rem)] lg:max-w-none"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/**
 * Mission & vision statement pair. Shared by /about (ambient) and the home
 * page, where motion="gait" renders the Motion DNA composition: walking
 * motion-capture sequences flanking the cards and a temporal gait signature
 * running through the center.
 */
export function MissionVision({ motion = "ambient" }: MissionVisionProps) {
  if (motion === "gait") {
    return <GaitMissionVision />;
  }

  return (
    <section
      aria-label="Mission and vision"
      className="mission-vision-section relative isolate overflow-hidden border-y border-white/[0.06] py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="mission-vision-effects pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div className="mission-vision-ambient">
          <span className="mission-vision-glow mission-vision-glow--cyan" />
          <span className="mission-vision-glow mission-vision-glow--violet" />
        </div>
        <div className="mission-vision-grid" />
        <div className="mission-vision-network" />
        <div className="mission-vision-sweep" />
      </div>

      <div className="container-wide relative z-10">
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal className="mission-vision-card-aura mission-vision-card-aura--cyan h-full">
            <article className="mission-vision-card mission-vision-card--mission relative z-10 h-full overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-b from-cyan-300/[0.04] to-transparent p-8 sm:p-10">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
              <div className="mission-vision-label text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                <span>Mission</span>
              </div>
              <p className="mt-5 font-display text-2xl leading-snug text-balance text-soft-white sm:text-3xl">
                To turn human movement into actionable intelligence that
                improves mobility, performance, safety and security.
              </p>
            </article>
          </Reveal>

          <Reveal
            delay={0.08}
            className="mission-vision-card-aura mission-vision-card-aura--violet h-full"
          >
            <article className="mission-vision-card mission-vision-card--vision relative z-10 h-full overflow-hidden rounded-3xl border border-violet-300/20 bg-gradient-to-b from-violet-300/[0.04] to-transparent p-8 sm:p-10">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/70 to-transparent" />
              <div className="mission-vision-label text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">
                <span>Vision</span>
              </div>
              <p className="mt-5 font-display text-2xl leading-snug text-balance text-soft-white sm:text-3xl">
                To make movement intelligence a trusted layer of{" "}
                <span className="whitespace-nowrap">decision-making</span>{" "}
                across healthcare, sports, enterprise and{" "}
                <span className="whitespace-nowrap">public-safety</span>{" "}
                environments.
              </p>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

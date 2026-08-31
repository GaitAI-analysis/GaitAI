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

const SPINE_PATH = "M0 0 C0.4 -12 0.9 -24 1.5 -34";
const NECK: Pt = [1.5, -34];
const HEAD: Pt = [2, -42];

const WALKER_TONES = {
  cyan: ["cyan", "cyan", "cyan", "cyan", "cyan"],
  violet: ["blue", "blue", "indigo", "violet", "violet"],
} as const;

function toPoints(pts: readonly Pt[]) {
  return pts.map(([x, y]) => `${x},${y}`).join(" ");
}

function MocapFrame({
  phase,
  x,
  baseY,
  order,
  tone,
}: {
  phase: GaitPhase;
  x: number;
  baseY: number;
  order: number;
  tone: string;
}) {
  const groundY = 48 - phase.lift;
  const farJoints: readonly Pt[] = [
    phase.farArm[1],
    phase.farArm[2],
    ...phase.farLeg,
  ];
  const nearJoints: readonly Pt[] = [...phase.nearArm, ...phase.nearLeg];

  return (
    <g
      className={`mission-vision-mocap-frame mission-vision-mocap-frame--${tone}`}
      transform={`translate(${x} ${baseY + phase.lift})`}
      style={{ "--mv-i": order } as CSSProperties}
    >
      {phase.contacts.map((contactX) => (
        <ellipse
          key={contactX}
          className="mission-vision-mocap-contact"
          cx={contactX}
          cy={groundY}
          rx="8"
          ry="1.8"
        />
      ))}

      <polyline
        className="mission-vision-mocap-bone mission-vision-mocap-bone--far"
        points={toPoints(phase.farArm)}
      />
      <polyline
        className="mission-vision-mocap-bone mission-vision-mocap-bone--far"
        points={toPoints(phase.farLeg)}
      />
      <line
        className="mission-vision-mocap-bone mission-vision-mocap-bone--far"
        x1={phase.farFoot[0][0]}
        y1={phase.farFoot[0][1]}
        x2={phase.farFoot[1][0]}
        y2={phase.farFoot[1][1]}
      />

      <path className="mission-vision-mocap-bone" d={SPINE_PATH} />
      <circle className="mission-vision-mocap-head" cx={HEAD[0]} cy={HEAD[1]} r="4.5" />

      <polyline className="mission-vision-mocap-bone" points={toPoints(phase.nearArm)} />
      <polyline className="mission-vision-mocap-bone" points={toPoints(phase.nearLeg)} />
      <line
        className="mission-vision-mocap-bone"
        x1={phase.nearFoot[0][0]}
        y1={phase.nearFoot[0][1]}
        x2={phase.nearFoot[1][0]}
        y2={phase.nearFoot[1][1]}
      />

      {farJoints.map(([jx, jy], j) => (
        <circle
          key={`f${j}`}
          className="mission-vision-mocap-joint mission-vision-mocap-joint--far"
          cx={jx}
          cy={jy}
          r="1.7"
        />
      ))}
      {nearJoints.map(([jx, jy], j) => (
        <circle
          key={`n${j}`}
          className="mission-vision-mocap-joint"
          cx={jx}
          cy={jy}
          r="2.1"
        />
      ))}
      <circle className="mission-vision-mocap-joint" cx={NECK[0]} cy={NECK[1]} r="2" />

      {/* Temporal samples emitted by this frame, sinking toward the signal. */}
      {[0, 1, 2, 3, 4].map((k) => {
        const h = 6 + ((order * 5 + k * 7) % 11);
        const tx = -14 + k * 7;
        return (
          <line
            key={k}
            className="mission-vision-mocap-tick"
            x1={tx}
            y1={groundY + 9}
            x2={tx}
            y2={groundY + 9 + h}
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
  const indices = compact ? [0, 2, 4] : [0, 1, 2, 3, 4];
  const width = compact ? 200 : 248;
  const height = compact ? 150 : 200;
  const baseY = compact ? 50 : 60;
  const xs = compact ? [44, 100, 156] : [34, 79, 124, 169, 214];
  const groundY = baseY + 48;
  const phaseShift = variant === "violet" && !compact ? "-2s" : "0s";

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
          x={xs[order]}
          baseY={baseY}
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
    const envelope = 0.55 + 0.45 * Math.sin(Math.PI * t);
    const burst = rand() < 0.14 ? 1.8 : 1;
    const up = (4 + rand() * 20) * envelope * burst * amp;
    const down = (2 + rand() * 10) * envelope * burst * amp;
    const roll = rand();
    const dot =
      roll < 0.12
        ? -(up + 4 + rand() * 6)
        : roll > 0.9
          ? down + 4 + rand() * 5
          : null;
    samples.push({
      x: Math.round(x * 10) / 10,
      up: Math.round(up * 10) / 10,
      down: Math.round(down * 10) / 10,
      dot: dot === null ? null : Math.round(dot * 10) / 10,
    });
    x += 4 + rand() * 9 + (rand() < 0.06 ? 18 : 0);
  }
  return samples;
}

const DNA_SAMPLES_WIDE = buildDnaSamples(20260831, 1600, 1);
const DNA_SAMPLES_COMPACT = buildDnaSamples(77, 400, 0.72);

function MotionDnaSignal({
  idPrefix,
  width,
  height,
  baseline,
  samples,
  pulse,
  preserve,
  className,
}: {
  idPrefix: string;
  width: number;
  height: number;
  baseline: number;
  samples: readonly DnaSample[];
  pulse: { from: string; to: string; rx: number; ry: number };
  preserve: string;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={preserve}
      className={className}
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
          <stop offset="0.08" stopColor="#4fd1ff" stopOpacity="0.5" />
          <stop offset="0.3" stopColor="#4fd1ff" stopOpacity="0.62" />
          <stop offset="0.52" stopColor="#2563ff" stopOpacity="0.6" />
          <stop offset="0.74" stopColor="#8b5cf6" stopOpacity="0.62" />
          <stop offset="0.93" stopColor="#8b5cf6" stopOpacity="0.48" />
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
          <stop offset="0.3" stopColor="#67e8f9" stopOpacity="0.42" />
          <stop offset="0.5" stopColor="#93c5fd" stopOpacity="0.85" />
          <stop offset="0.7" stopColor="#a78bfa" stopOpacity="0.42" />
          <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${idPrefix}-pulse`}>
          <stop offset="0" stopColor="#bfe8ff" stopOpacity="0.3" />
          <stop offset="0.55" stopColor="#4fa8ff" stopOpacity="0.12" />
          <stop offset="1" stopColor="#4fa8ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g
        className="mission-vision-dna-pulse"
        style={
          { "--mv-pulse-from": pulse.from, "--mv-pulse-to": pulse.to } as CSSProperties
        }
      >
        <ellipse cx="0" cy={baseline} rx={pulse.rx} ry={pulse.ry} fill={`url(#${idPrefix}-pulse)`} />
      </g>

      {samples.map((s) => (
        <line
          key={s.x}
          className="mission-vision-dna-sample"
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
            r="1.4"
            fill={`url(#${idPrefix}-stroke)`}
          />
        ))}
      <line
        className="mission-vision-dna-baseline"
        x1="10"
        x2={width - 10}
        y1={baseline}
        y2={baseline}
        stroke={`url(#${idPrefix}-baseline)`}
      />
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
    <div className={`mission-vision-card-aura mission-vision-card-aura--${tone}`}>
      <article
        className={`mission-vision-card ${
          isCyan ? "mission-vision-card--mission" : "mission-vision-card--vision"
        } relative z-10 overflow-hidden rounded-3xl border p-6 sm:p-8 lg:p-7 ${
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
        <p className="mt-4 font-display text-xl leading-snug text-balance text-soft-white sm:text-2xl lg:text-[1.32rem]">
          {children}
        </p>
      </article>
    </div>
  );
}

function GaitMissionVision() {
  return (
    <section
      aria-label="Mission and vision"
      className="mission-vision-section mission-vision-section--gait relative isolate overflow-hidden border-y border-white/[0.06] py-16 sm:py-20 lg:flex lg:min-h-[620px] lg:flex-col lg:justify-center lg:py-10"
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
          {/* BACK layer: faint grid + scattered temporal data points */}
          <div className="mission-vision-gait-grid" />
          <div className="mission-vision-dna-field" />

          {/* MIDDLE layer: full-width Motion DNA signal through the center */}
          <div className="mission-vision-dna-band hidden lg:block">
            <MotionDnaSignal
              idPrefix="mv-dna-lg"
              width={1600}
              height={124}
              baseline={62}
              samples={DNA_SAMPLES_WIDE}
              pulse={{ from: "-180px", to: "1780px", rx: 90, ry: 42 }}
              preserve="xMidYMid slice"
              className="mission-vision-dna h-full w-full"
            />
          </div>
        </div>
      </Reveal>

      <div className="container-wide relative z-10">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,1.5fr)_minmax(0,1.15fr)] lg:gap-5 xl:gap-8">
          {/* LEFT: cyan walking capture (desktop) */}
          <Reveal className="hidden lg:block lg:order-1">
            <MocapWalker variant="cyan" />
          </Reveal>

          {/* MISSION */}
          <Reveal delay={0.08} className="order-1 lg:order-2">
            <GaitCard tone="cyan" title="Mission">
              To turn human movement into actionable intelligence that improves
              mobility, performance, safety and security.
            </GaitCard>
          </Reveal>

          {/* Mobile: compact cyan walking capture */}
          <Reveal delay={0.12} className="order-2 lg:hidden">
            <MocapWalker variant="cyan" compact className="mx-auto max-w-[230px]" />
          </Reveal>

          {/* CENTER: Motion DNA label (+ compact signal on mobile) */}
          <Reveal delay={0.16} className="order-3 lg:order-3">
            <div className="flex flex-col items-center text-center lg:-translate-y-12">
              <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-400">
                Motion DNA
              </p>
              <p className="mt-2 text-[11px] tracking-[0.06em] text-slate-500">
                One movement signal. Multiple intelligences.
              </p>
              <MotionDnaSignal
                idPrefix="mv-dna-sm"
                width={400}
                height={100}
                baseline={50}
                samples={DNA_SAMPLES_COMPACT}
                pulse={{ from: "-70px", to: "470px", rx: 56, ry: 34 }}
                preserve="xMidYMid meet"
                className="mission-vision-dna mt-5 w-full lg:hidden"
              />
            </div>
          </Reveal>

          {/* VISION */}
          <Reveal delay={0.16} className="order-4 lg:order-4">
            <GaitCard tone="violet" title="Vision">
              To make movement intelligence a trusted layer of decision-making
              across healthcare, sports, enterprise and public-safety
              environments.
            </GaitCard>
          </Reveal>

          {/* Mobile: compact violet walking capture */}
          <Reveal delay={0.2} className="order-5 lg:hidden">
            <MocapWalker variant="violet" compact className="mx-auto max-w-[230px]" />
          </Reveal>

          {/* RIGHT: blue→violet walking capture (desktop) */}
          <Reveal delay={0.08} className="hidden lg:block lg:order-5">
            <MocapWalker variant="violet" />
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
                To make movement intelligence a trusted layer of
                decision-making across healthcare, sports, enterprise and
                public-safety environments.
              </p>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

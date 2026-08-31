import { Reveal } from "@/components/ui/Reveal";

type MissionVisionProps = {
  motion?: "ambient" | "gait";
};

type Point = readonly [number, number];

type GaitFrame = {
  x: number;
  phase: string;
  index: string;
  tone: "cyan" | "blue" | "violet";
  nearArm: readonly [Point, Point, Point];
  farArm: readonly [Point, Point, Point];
  nearLeg: readonly [Point, Point, Point];
  farLeg: readonly [Point, Point, Point];
  nearFoot: readonly [Point, Point];
  farFoot: readonly [Point, Point];
  contacts: readonly number[];
};

const GAIT_FRAMES: readonly GaitFrame[] = [
  {
    x: 140,
    index: "01",
    phase: "HEEL STRIKE",
    tone: "cyan",
    nearArm: [[1, -43], [-14, -21], [-25, 3]],
    farArm: [[-1, -43], [15, -21], [29, 0]],
    nearLeg: [[3, 0], [27, 34], [50, 68]],
    farLeg: [[-3, 0], [-21, 32], [-38, 65]],
    nearFoot: [[50, 68], [61, 70]],
    farFoot: [[-38, 65], [-28, 69]],
    contacts: [-28, 61],
  },
  {
    x: 430,
    index: "02",
    phase: "LOADING",
    tone: "cyan",
    nearArm: [[1, -43], [-11, -20], [-19, 4]],
    farArm: [[-1, -43], [12, -20], [22, 2]],
    nearLeg: [[3, 0], [21, 36], [37, 69]],
    farLeg: [[-3, 0], [-14, 32], [-25, 65]],
    nearFoot: [[37, 69], [50, 70]],
    farFoot: [[-25, 65], [-16, 69]],
    contacts: [-16, 50],
  },
  {
    x: 720,
    index: "03",
    phase: "MID-STANCE",
    tone: "blue",
    nearArm: [[1, -43], [-6, -18], [-8, 6]],
    farArm: [[-1, -43], [7, -18], [11, 5]],
    nearLeg: [[3, 0], [3, 35], [1, 69]],
    farLeg: [[-3, 0], [-13, 29], [-22, 53]],
    nearFoot: [[1, 69], [14, 69]],
    farFoot: [[-22, 53], [-11, 57]],
    contacts: [14],
  },
  {
    x: 1010,
    index: "04",
    phase: "TOE-OFF",
    tone: "violet",
    nearArm: [[1, -43], [16, -20], [30, 2]],
    farArm: [[-1, -43], [-14, -20], [-27, 3]],
    nearLeg: [[3, 0], [-21, 32], [-38, 63]],
    farLeg: [[-3, 0], [22, 34], [37, 68]],
    nearFoot: [[-38, 63], [-28, 69]],
    farFoot: [[37, 68], [50, 69]],
    contacts: [-28, 50],
  },
  {
    x: 1300,
    index: "05",
    phase: "SWING",
    tone: "violet",
    nearArm: [[1, -43], [-14, -21], [-25, 3]],
    farArm: [[-1, -43], [15, -21], [29, 0]],
    nearLeg: [[3, 0], [25, 28], [11, 52]],
    farLeg: [[-3, 0], [-5, 35], [-8, 68]],
    nearFoot: [[11, 52], [23, 54]],
    farFoot: [[-8, 68], [5, 69]],
    contacts: [5],
  },
];

function points(points: readonly Point[]) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

function GaitPose({ frame }: { frame: GaitFrame }) {
  const joints = [
    ...frame.nearArm,
    ...frame.farArm,
    ...frame.nearLeg,
    ...frame.farLeg,
  ];

  return (
    <g
      className={`mission-vision-gait-pose mission-vision-gait-pose--${frame.tone}`}
      transform={`translate(${frame.x} 332)`}
    >
      {frame.contacts.map((contactX) => (
        <ellipse
          key={`${frame.index}-contact-${contactX}`}
          className="mission-vision-gait-contact"
          cx={contactX}
          cy="72"
          rx="15"
          ry="2.5"
        />
      ))}
      <path className="mission-vision-gait-spine" d="M0 0 C-1 -17 1 -32 0 -52" />
      <line className="mission-vision-gait-axis" x1="-6" y1="-43" x2="6" y2="-43" />
      <line className="mission-vision-gait-axis" x1="-5" y1="0" x2="5" y2="0" />
      <circle className="mission-vision-gait-head" cx="0" cy="-65" r="8" />

      <polyline className="mission-vision-gait-limb mission-vision-gait-limb--far" points={points(frame.farArm)} />
      <polyline className="mission-vision-gait-limb mission-vision-gait-limb--far" points={points(frame.farLeg)} />
      <line className="mission-vision-gait-limb mission-vision-gait-limb--far" x1={frame.farFoot[0][0]} y1={frame.farFoot[0][1]} x2={frame.farFoot[1][0]} y2={frame.farFoot[1][1]} />

      <polyline className="mission-vision-gait-limb" points={points(frame.nearArm)} />
      <polyline className="mission-vision-gait-limb" points={points(frame.nearLeg)} />
      <line className="mission-vision-gait-limb" x1={frame.nearFoot[0][0]} y1={frame.nearFoot[0][1]} x2={frame.nearFoot[1][0]} y2={frame.nearFoot[1][1]} />

      {joints.map(([x, y], jointIndex) => (
        <circle
          key={`${frame.index}-${jointIndex}`}
          className="mission-vision-gait-joint"
          cx={x}
          cy={y}
          r={jointIndex % 3 === 0 ? 2.25 : 1.7}
        />
      ))}

      <text className="mission-vision-gait-phase-index" x="-34" y="91">{frame.index}</text>
      <text className="mission-vision-gait-phase-label" x="-14" y="91">{frame.phase}</text>
    </g>
  );
}

/**
 * Mission & vision statement pair. Shared by /about and the home page.
 */
export function MissionVision({ motion = "ambient" }: MissionVisionProps) {
  const usesGaitMotion = motion === "gait";

  return (
    <section
      aria-label="Mission and vision"
      className={`mission-vision-section relative isolate overflow-hidden border-y border-white/[0.06] py-20 sm:py-24 lg:py-28${
        usesGaitMotion ? " mission-vision-section--gait" : ""
      }`}
    >
      {usesGaitMotion ? (
        <Reveal
          y={0}
          amount={0.08}
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="mission-vision-effects mission-vision-gait-stage absolute inset-0"
          >
            <div className="mission-vision-gait-grid" />
            <svg
              className="mission-vision-gait-map"
              viewBox="0 0 1440 480"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <linearGradient id="mission-vision-gait-primary" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#4fd1ff" stopOpacity="0" />
                  <stop offset="0.24" stopColor="#4fd1ff" stopOpacity="0.62" />
                  <stop offset="0.6" stopColor="#2563ff" stopOpacity="0.48" />
                  <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="mission-vision-gait-secondary" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#2563ff" stopOpacity="0" />
                  <stop offset="0.38" stopColor="#2563ff" stopOpacity="0.42" />
                  <stop offset="0.76" stopColor="#8b5cf6" stopOpacity="0.52" />
                  <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="mission-vision-gait-ground" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#4fd1ff" stopOpacity="0" />
                  <stop offset="0.18" stopColor="#4fd1ff" stopOpacity="0.28" />
                  <stop offset="0.5" stopColor="#2563ff" stopOpacity="0.22" />
                  <stop offset="0.82" stopColor="#8b5cf6" stopOpacity="0.28" />
                  <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                className="mission-vision-gait-path mission-vision-gait-path--primary"
                d="M-120 286 C18 286 78 188 208 196 S390 330 534 238 S730 164 874 244 S1082 320 1234 218 S1430 190 1560 228"
                stroke="url(#mission-vision-gait-primary)"
              />
              <path
                className="mission-vision-gait-path mission-vision-gait-path--secondary"
                d="M-120 326 C42 322 112 244 246 252 S426 354 566 282 S754 210 900 278 S1104 350 1262 270 S1430 230 1560 252"
                stroke="url(#mission-vision-gait-secondary)"
              />
              <path
                className="mission-vision-gait-path mission-vision-gait-path--rhythm"
                d="M-100 374 H80 C112 374 118 342 148 342 C178 342 184 394 214 394 C244 394 250 358 282 358 H486 C518 358 524 326 554 326 C584 326 590 378 620 378 C650 378 656 346 688 346 H892 C924 346 930 314 960 314 C990 314 996 366 1026 366 C1056 366 1062 334 1094 334 H1540"
              />
              <g className="mission-vision-gait-nodes">
                <circle className="mission-vision-gait-node mission-vision-gait-node--cyan" cx="208" cy="196" r="3" />
                <circle className="mission-vision-gait-node mission-vision-gait-node--blue" cx="534" cy="238" r="3" />
                <circle className="mission-vision-gait-node mission-vision-gait-node--violet" cx="874" cy="244" r="3" />
                <circle className="mission-vision-gait-node mission-vision-gait-node--blue" cx="1234" cy="218" r="3" />
              </g>
              <path
                className="mission-vision-gait-ground"
                d="M30 404 C360 402 1080 406 1410 404"
                stroke="url(#mission-vision-gait-ground)"
              />
              <g className="mission-vision-gait-cycle">
                {GAIT_FRAMES.map((frame) => (
                  <GaitPose key={frame.index} frame={frame} />
                ))}
              </g>
            </svg>
          </div>
        </Reveal>
      ) : (
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
      )}

      <div className="container-wide relative z-10">
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal
            delay={usesGaitMotion ? 0.12 : 0}
            className="mission-vision-card-aura mission-vision-card-aura--cyan h-full"
          >
            <article className="mission-vision-card mission-vision-card--mission relative z-10 h-full overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-b from-cyan-300/[0.04] to-transparent p-8 sm:p-10">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
              <div className="mission-vision-label text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                <span>Mission</span>
                {usesGaitMotion ? (
                  <span aria-hidden="true" className="mission-vision-label-signal mission-vision-label-signal--cyan" />
                ) : null}
              </div>
              <p className="mt-5 font-display text-2xl leading-snug text-balance text-soft-white sm:text-3xl">
                To turn human movement into actionable intelligence that
                improves mobility, performance, safety and security.
              </p>
            </article>
          </Reveal>

          <Reveal
            delay={usesGaitMotion ? 0.22 : 0.08}
            className="mission-vision-card-aura mission-vision-card-aura--violet h-full"
          >
            <article className="mission-vision-card mission-vision-card--vision relative z-10 h-full overflow-hidden rounded-3xl border border-violet-300/20 bg-gradient-to-b from-violet-300/[0.04] to-transparent p-8 sm:p-10">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/70 to-transparent" />
              <div className="mission-vision-label text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">
                <span>Vision</span>
                {usesGaitMotion ? (
                  <span aria-hidden="true" className="mission-vision-label-signal mission-vision-label-signal--violet" />
                ) : null}
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

"use client";

import { useEffect, useRef } from "react";

type Joint = [number, number];
type GaitFrame = Joint[];

const TAU = Math.PI * 2;
const GAIT_CYCLE_MS = 4800;
const FRAME_COUNT = 8;

// head, neck, shoulders, elbows, wrists, hips, knees, ankles and toes.
const bones: [number, number][] = [
  [0, 1],
  [1, 2],
  [1, 3],
  [2, 3],
  [2, 4],
  [3, 5],
  [4, 6],
  [5, 7],
  [1, 8],
  [1, 9],
  [8, 9],
  [8, 10],
  [9, 11],
  [10, 12],
  [11, 13],
  [12, 14],
  [13, 15],
  [14, 16],
];

function extend([x, y]: Joint, length: number, angle: number): Joint {
  return [x + Math.sin(angle) * length, y + Math.cos(angle) * length];
}

/** Build one biomechanical pose from a normalized gait-cycle phase. */
function createGaitPose(phase: number): GaitFrame {
  const angle = phase * TAU;
  const stride = Math.sin(angle);
  const bob = -0.025 * Math.cos(angle * 2);
  const lean = 0.035 * Math.sin(angle - Math.PI / 5);

  const head: Joint = [lean * 1.35, -1.65 + bob];
  const neck: Joint = [lean, -1.27 + bob];
  const leftShoulder: Joint = [-0.28 + lean, -1.17 + bob];
  const rightShoulder: Joint = [0.28 + lean, -1.17 + bob];
  const leftHip: Joint = [-0.1, -0.4 + bob];
  const rightHip: Joint = [0.1, -0.4 + bob];

  // Arms swing opposite the legs, with a restrained elbow bend.
  const leftUpperArm = -0.5 * stride + 0.04;
  const rightUpperArm = 0.5 * stride - 0.04;
  const leftElbow = extend(leftShoulder, 0.48, leftUpperArm);
  const rightElbow = extend(rightShoulder, 0.48, rightUpperArm);
  const leftWrist = extend(leftElbow, 0.43, leftUpperArm + 0.18);
  const rightWrist = extend(rightElbow, 0.43, rightUpperArm - 0.18);

  // Each swing leg flexes at the knee while the stance leg stays longer.
  const leftThigh = 0.5 * stride;
  const rightThigh = -0.5 * stride;
  const leftSwing = Math.max(0, stride);
  const rightSwing = Math.max(0, -stride);
  const leftKnee = extend(leftHip, 0.72, leftThigh);
  const rightKnee = extend(rightHip, 0.72, rightThigh);
  const leftAnkle = extend(leftKnee, 0.7, leftThigh - 0.5 * leftSwing);
  const rightAnkle = extend(rightKnee, 0.7, rightThigh - 0.5 * rightSwing);
  const leftToe: Joint = [leftAnkle[0] + 0.25, leftAnkle[1] + 0.025];
  const rightToe: Joint = [rightAnkle[0] + 0.25, rightAnkle[1] + 0.025];

  return [
    head,
    neck,
    leftShoulder,
    rightShoulder,
    leftElbow,
    rightElbow,
    leftWrist,
    rightWrist,
    leftHip,
    rightHip,
    leftKnee,
    rightKnee,
    leftAnkle,
    rightAnkle,
    leftToe,
    rightToe,
  ];
}

const gaitFrames = Array.from({ length: FRAME_COUNT }, (_, index) =>
  createGaitPose(index / FRAME_COUNT)
);

function catmullRom(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  amount: number
) {
  const amount2 = amount * amount;
  const amount3 = amount2 * amount;

  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * amount +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * amount2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * amount3)
  );
}

/** Smoothly interpolate through the sampled poses without a loop seam. */
function interpolateGaitFrame(progress: number): GaitFrame {
  const wrapped = ((progress % 1) + 1) % 1;
  const scaled = wrapped * FRAME_COUNT;
  const current = Math.floor(scaled);
  const amount = scaled - current;
  const previous = (current - 1 + FRAME_COUNT) % FRAME_COUNT;
  const next = (current + 1) % FRAME_COUNT;
  const afterNext = (current + 2) % FRAME_COUNT;

  return gaitFrames[current].map((_, jointIndex) => [
    catmullRom(
      gaitFrames[previous][jointIndex][0],
      gaitFrames[current][jointIndex][0],
      gaitFrames[next][jointIndex][0],
      gaitFrames[afterNext][jointIndex][0],
      amount
    ),
    catmullRom(
      gaitFrames[previous][jointIndex][1],
      gaitFrames[current][jointIndex][1],
      gaitFrames[next][jointIndex][1],
      gaitFrames[afterNext][jointIndex][1],
      amount
    ),
  ]);
}

interface FigureConfig {
  baseX: number;
  baseY: number;
  className: string;
  glow: boolean;
  jointRadius: number;
  opacity: number;
  phase: number;
  scale: number;
  stroke: string;
  jointFill: string;
}

const figures: FigureConfig[] = [
  {
    baseX: 900,
    baseY: 430,
    className: "hidden sm:block",
    glow: false,
    jointRadius: 4,
    opacity: 0.3,
    phase: -0.16,
    scale: 104,
    stroke: "url(#hero-gait-purple)",
    jointFill: "#9C64F1",
  },
  {
    baseX: 1050,
    baseY: 424,
    className: "hidden sm:block",
    glow: true,
    jointRadius: 4.6,
    opacity: 0.82,
    phase: 0,
    scale: 118,
    stroke: "url(#hero-gait-blue)",
    jointFill: "#92DEFF",
  },
  {
    baseX: 1210,
    baseY: 432,
    className: "hidden sm:block",
    glow: false,
    jointRadius: 3.8,
    opacity: 0.25,
    phase: 0.16,
    scale: 98,
    stroke: "url(#hero-gait-cyan)",
    jointFill: "#4FD1FF",
  },
  {
    baseX: 840,
    baseY: 448,
    className: "sm:hidden",
    glow: true,
    jointRadius: 4.2,
    opacity: 0.56,
    phase: 0,
    scale: 96,
    stroke: "url(#hero-gait-blue)",
    jointFill: "#92DEFF",
  },
];

const networkNodes: Joint[] = [
  [118, 174],
  [228, 104],
  [346, 166],
  [472, 98],
  [602, 162],
  [756, 92],
  [868, 156],
  [1012, 102],
  [1162, 160],
  [1308, 112],
  [190, 512],
  [390, 574],
  [650, 526],
  [830, 588],
];

const networkEdges: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [0, 10],
  [10, 11],
  [11, 12],
  [12, 13],
  [13, 8],
  [2, 11],
  [4, 12],
];

function projectFrame(
  frame: GaitFrame,
  config: FigureConfig,
  horizontalDrift: number
): GaitFrame {
  return frame.map(([x, y]) => [
    config.baseX + horizontalDrift + x * config.scale,
    config.baseY + y * config.scale,
  ]);
}

function number(value: number) {
  return value.toFixed(2);
}

function buildBonePath(frame: GaitFrame) {
  return bones
    .map(([from, to]) => {
      const [x1, y1] = frame[from];
      const [x2, y2] = frame[to];
      return `M${number(x1)} ${number(y1)}L${number(x2)} ${number(y2)}`;
    })
    .join("");
}

function buildJointPath(frame: GaitFrame, radius: number) {
  return frame
    .map(([x, y]) => {
      const left = x - radius;
      const diameter = radius * 2;
      return `M${number(left)} ${number(y)}a${number(radius)} ${number(
        radius
      )} 0 1 0 ${number(diameter)} 0a${number(radius)} ${number(
        radius
      )} 0 1 0 -${number(diameter)} 0`;
    })
    .join("");
}

export default function HeroScene() {
  const rootRef = useRef<SVGSVGElement>(null);
  const boneRefs = useRef<Array<SVGPathElement | null>>([]);
  const jointRefs = useRef<Array<SVGPathElement | null>>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktopQuery = window.matchMedia("(min-width: 640px)");
    let animationFrame: number | null = null;
    let elapsed = 0;
    let lastTimestamp = performance.now();
    let isVisible = true;

    const renderFrame = (elapsedMs: number) => {
      const gaitProgress = elapsedMs / GAIT_CYCLE_MS;
      const travelProgress = elapsedMs / 9000;

      figures.forEach((config, index) => {
        const isMobileFigure = index === figures.length - 1;
        if (desktopQuery.matches === isMobileFigure) return;

        const frame = interpolateGaitFrame(gaitProgress + config.phase);
        const horizontalDrift =
          Math.sin((travelProgress + config.phase) * TAU) *
          (index === figures.length - 1 ? 6 : 11);
        const projected = projectFrame(frame, config, horizontalDrift);
        const bone = boneRefs.current[index];
        const joints = jointRefs.current[index];

        bone?.setAttribute("d", buildBonePath(projected));
        joints?.setAttribute("d", buildJointPath(projected, config.jointRadius));
        joints?.setAttribute(
          "opacity",
          String(config.opacity * (0.72 + 0.16 * Math.sin(gaitProgress * TAU)))
        );
      });
    };

    const shouldAnimate = () =>
      isVisible && !document.hidden && !motionQuery.matches;

    const tick = (timestamp: number) => {
      const delta = Math.min(timestamp - lastTimestamp, 64);
      lastTimestamp = timestamp;
      elapsed += delta;
      renderFrame(elapsed);
      animationFrame = shouldAnimate() ? requestAnimationFrame(tick) : null;
    };

    const syncAnimation = () => {
      if (shouldAnimate() && animationFrame === null) {
        lastTimestamp = performance.now();
        animationFrame = requestAnimationFrame(tick);
      } else if (!shouldAnimate() && animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      if (motionQuery.matches) renderFrame(0);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        syncAnimation();
      },
      { rootMargin: "100px", threshold: 0.01 }
    );

    const handleVisibility = () => syncAnimation();
    const handleMotionPreference = () => syncAnimation();
    const handleViewportChange = () => renderFrame(elapsed);

    renderFrame(0);
    observer.observe(root);
    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener("change", handleMotionPreference);
    desktopQuery.addEventListener("change", handleViewportChange);
    syncAnimation();

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", handleMotionPreference);
      desktopQuery.removeEventListener("change", handleViewportChange);
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <svg
      ref={rootRef}
      aria-hidden="true"
      className="h-full w-full"
      viewBox="0 0 1440 720"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="hero-gait-cyan" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#BDF9FF" />
          <stop offset="55%" stopColor="#4FD1FF" />
          <stop offset="100%" stopColor="#0FA3B1" />
        </linearGradient>
        <linearGradient id="hero-gait-blue" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#92DEFF" />
          <stop offset="50%" stopColor="#5587FF" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="hero-gait-purple" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#5587FF" />
          <stop offset="100%" stopColor="#9C64F1" />
        </linearGradient>
        <radialGradient id="hero-scene-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2563FF" stopOpacity="0.2" />
          <stop offset="60%" stopColor="#4FD1FF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#4FD1FF" stopOpacity="0" />
        </radialGradient>
        <filter id="hero-gait-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="820" cy="360" rx="480" ry="270" fill="url(#hero-scene-halo)" />

      <g fill="none" strokeLinecap="round">
        <ellipse
          cx="730"
          cy="358"
          rx="430"
          ry="218"
          stroke="#4FD1FF"
          strokeDasharray="2 16"
          strokeOpacity="0.34"
        />
        <ellipse
          cx="760"
          cy="355"
          rx="535"
          ry="286"
          stroke="#5587FF"
          strokeDasharray="64 24 6 30"
          strokeOpacity="0.22"
          transform="rotate(-5 760 355)"
        />
        <path
          d="M118 524C338 430 506 610 724 508C940 408 1136 492 1328 372"
          stroke="url(#hero-gait-blue)"
          strokeDasharray="3 13"
          strokeOpacity="0.32"
        />
      </g>

      <g stroke="#5587FF" strokeOpacity="0.2" strokeWidth="1">
        {networkEdges.map(([from, to]) => (
          <line
            key={`${from}-${to}`}
            x1={networkNodes[from][0]}
            y1={networkNodes[from][1]}
            x2={networkNodes[to][0]}
            y2={networkNodes[to][1]}
          />
        ))}
      </g>
      <g fill="#4FD1FF" fillOpacity="0.46">
        {networkNodes.map(([x, y], index) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={index % 3 === 0 ? 3.2 : 2.1} />
        ))}
      </g>

      {figures.map((config, index) => {
        const initialFrame = projectFrame(
          interpolateGaitFrame(config.phase),
          config,
          0
        );

        return (
          <g
            key={`${config.baseX}-${config.phase}`}
            className={config.className}
            filter={config.glow ? "url(#hero-gait-glow)" : undefined}
          >
            <path
              ref={(element) => {
                boneRefs.current[index] = element;
              }}
              d={buildBonePath(initialFrame)}
              fill="none"
              opacity={config.opacity}
              stroke={config.stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={index === 1 ? 2.2 : 1.65}
              vectorEffect="non-scaling-stroke"
            />
            <path
              ref={(element) => {
                jointRefs.current[index] = element;
              }}
              d={buildJointPath(initialFrame, config.jointRadius)}
              fill={config.jointFill}
              opacity={config.opacity * 0.78}
            />
          </g>
        );
      })}
    </svg>
  );
}

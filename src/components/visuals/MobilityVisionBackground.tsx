type GaitPoint = readonly [x: number, y: number];

const BONES = [
  [0, 1],
  [1, 2],
  [1, 3],
  [2, 4],
  [3, 5],
  [4, 6],
  [5, 7],
  [1, 8],
  [8, 9],
  [8, 10],
  [9, 11],
  [10, 12],
] as const;

const APPROACH_POSE: readonly GaitPoint[] = [
  [0, -118],
  [2, -78],
  [-28, -70],
  [31, -68],
  [-49, -32],
  [50, -27],
  [-58, 8],
  [61, 13],
  [7, 4],
  [-17, 61],
  [43, 58],
  [-48, 116],
  [65, 107],
];

const MID_STRIDE_POSE: readonly GaitPoint[] = [
  [4, -124],
  [3, -82],
  [-29, -72],
  [33, -70],
  [-54, -38],
  [56, -34],
  [-72, 2],
  [72, 0],
  [8, 4],
  [-31, 57],
  [48, 50],
  [-76, 105],
  [73, 116],
];

const RELEASE_POSE: readonly GaitPoint[] = [
  [5, -120],
  [3, -79],
  [-29, -69],
  [34, -67],
  [-48, -26],
  [55, -31],
  [-56, 16],
  [68, 8],
  [7, 5],
  [-42, 49],
  [32, 61],
  [-67, 100],
  [48, 119],
];

/** Full-width network node positions: top band (9 nodes) + bottom band (6 nodes). */
const NETWORK_NODES: readonly [number, number][] = [
  // Top band — spanning x: 108 → 1364
  [108, 168],
  [276, 96],
  [444, 166],
  [612, 88],
  [780, 164],
  [948, 86],
  [1116, 168],
  [1284, 92],
  [1364, 158],
  // Bottom band — spanning x: 186 → 1320
  [186, 518],
  [388, 572],
  [628, 520],
  [868, 576],
  [1108, 514],
  [1320, 572],
];

const NETWORK_EDGES: readonly [number, number][] = [
  // Top row
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
  // Bottom row
  [9, 10], [10, 11], [11, 12], [12, 13], [13, 14],
  // Cross-connections
  [1, 10], [3, 11], [5, 12], [7, 13],
];

function GaitFigure({
  points,
  transform,
  opacity,
}: {
  points: readonly GaitPoint[];
  transform: string;
  opacity: number;
}) {
  return (
    <g transform={transform} opacity={opacity}>
      <g
        fill="none"
        stroke="url(#mobility-vision-figure)"
        strokeLinecap="round"
        strokeWidth="2.25"
      >
        {BONES.map(([start, end]) => (
          <line
            key={`${start}-${end}`}
            x1={points[start][0]}
            x2={points[end][0]}
            y1={points[start][1]}
            y2={points[end][1]}
          />
        ))}
      </g>
      <g fill="#06101d" stroke="#71e4ed" strokeWidth="1.5">
        {points.map(([x, y], index) => (
          <circle key={`${x}-${y}-${index}`} cx={x} cy={y} r="3.4" />
        ))}
      </g>
      <circle
        cx={points[0][0]}
        cy={points[0][1]}
        fill="none"
        r="13"
        stroke="#86edf2"
        strokeWidth="2"
      />
    </g>
  );
}

/**
 * Full-width vector gait field for the MobilityCare vision hero.
 * The network nodes, orbit ellipses and gait figures span the entire 1440-wide
 * canvas so the background feels as expansive as the homepage hero.
 * Does NOT depend on the homepage HeroScene component.
 */
export function MobilityVisionBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg
        className="h-full w-full opacity-55 sm:opacity-70 lg:opacity-85"
        focusable="false"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
      >
        <defs>
          {/* Fine grid */}
          <pattern
            id="mobility-vision-grid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="#94a3b8"
              strokeOpacity="0.07"
              strokeWidth="0.75"
            />
          </pattern>

          {/* Gait bone gradient */}
          <linearGradient
            id="mobility-vision-figure"
            x1="0"
            x2="1"
            y1="0"
            y2="1"
          >
            <stop offset="0" stopColor="#86edf2" />
            <stop offset="0.52" stopColor="#4fd1ff" />
            <stop offset="1" stopColor="#5587ff" />
          </linearGradient>

          {/* Trail gradient — full width */}
          <linearGradient id="mobility-vision-trail" x1="0" x2="1">
            <stop offset="0" stopColor="#0fa3b1" stopOpacity="0" />
            <stop offset="0.35" stopColor="#4fd1ff" stopOpacity="0.52" />
            <stop offset="0.72" stopColor="#4fd1ff" stopOpacity="0.48" />
            <stop offset="1" stopColor="#5587ff" stopOpacity="0" />
          </linearGradient>

          {/* Ambient halo — centred on the hero */}
          <radialGradient id="mobility-vision-light" cx="53%" cy="44%" r="56%">
            <stop offset="0" stopColor="#0fa3b1" stopOpacity="0.18" />
            <stop offset="0.52" stopColor="#2563ff" stopOpacity="0.08" />
            <stop offset="1" stopColor="#2563ff" stopOpacity="0" />
          </radialGradient>

          {/* Left-to-right fade mask — more permissive on the left so the
              full-width network is visible even in the text region */}
          <linearGradient id="mobility-vision-fade" x1="0" x2="1">
            <stop offset="0" stopColor="white" stopOpacity="0.28" />
            <stop offset="0.18" stopColor="white" stopOpacity="0.5" />
            <stop offset="0.45" stopColor="white" stopOpacity="0.86" />
            <stop offset="1" stopColor="white" />
          </linearGradient>
          <mask id="mobility-vision-mask">
            <rect width="1440" height="900" fill="url(#mobility-vision-fade)" />
          </mask>

          {/* Glow filter for skeleton figures */}
          <filter
            id="mobility-vision-soft-glow"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Fine grid fills entire canvas */}
        <rect width="1440" height="900" fill="url(#mobility-vision-grid)" />

        {/* Central ambient halo — covers the full hero */}
        <ellipse
          cx="760"
          cy="400"
          fill="url(#mobility-vision-light)"
          rx="720"
          ry="468"
        />

        <g mask="url(#mobility-vision-mask)">
          {/* ── Orbit ellipses — centred around x=760 so they span left ↔ right ── */}
          <g fill="none" stroke="#5587ff" strokeOpacity="0.14" strokeWidth="1">
            {/* Inner orbit */}
            <ellipse
              cx="760"
              cy="404"
              rx="552"
              ry="268"
              transform="rotate(-9 760 404)"
            />
            {/* Outer orbit — dashed */}
            <ellipse
              cx="760"
              cy="404"
              rx="692"
              ry="344"
              strokeDasharray="5 13"
              transform="rotate(13 760 404)"
            />
            {/* Cross-canvas horizontal sweeps */}
            <path d="M108 196 C330 138 528 190 752 148 S988 196 1192 156 S1364 202 1440 176" />
            <path d="M0 656 C210 600 434 650 668 606 S988 656 1224 608 S1400 654 1440 636" />
          </g>

          {/* ── Network edge lines ── */}
          <g
            fill="none"
            stroke="#4fd1ff"
            strokeOpacity="0.15"
            strokeWidth="1"
          >
            {NETWORK_EDGES.map(([from, to]) => (
              <line
                key={`${from}-${to}`}
                x1={NETWORK_NODES[from][0]}
                y1={NETWORK_NODES[from][1]}
                x2={NETWORK_NODES[to][0]}
                y2={NETWORK_NODES[to][1]}
              />
            ))}
          </g>

          {/* ── Network node dots ── */}
          <g fill="#06101d" stroke="#4fd1ff" strokeWidth="1.25">
            {NETWORK_NODES.map(([x, y], i) => (
              <circle key={`node-${i}`} cx={x} cy={y} r="3.25" />
            ))}
          </g>

          {/* ── Gait skeleton figures — three across the canvas ── */}
          <g filter="url(#mobility-vision-soft-glow)">
            {/* Left — small, faint (partially behind text on desktop) */}
            <GaitFigure
              points={APPROACH_POSE}
              transform="translate(384 442) scale(0.86)"
              opacity={0.26}
            />
            {/* Centre — medium presence */}
            <GaitFigure
              points={MID_STRIDE_POSE}
              transform="translate(820 432) scale(1.26)"
              opacity={0.62}
            />
            {/* Right — main hero figure */}
            <GaitFigure
              points={RELEASE_POSE}
              transform="translate(1100 434) scale(1.54)"
              opacity={0.94}
            />
          </g>

          {/* ── Footprint trail across the full hero ── */}
          <g fill="none" strokeLinecap="round">
            <path
              d="M108 574 C340 532 560 578 800 544 S1080 516 1288 554 S1408 578 1440 562"
              stroke="url(#mobility-vision-trail)"
              strokeWidth="2"
            />
            <path
              d="M148 608 C376 568 608 616 856 580 S1128 558 1340 592"
              stroke="#0fa3b1"
              strokeDasharray="2 11"
              strokeOpacity="0.28"
              strokeWidth="1.4"
            />
          </g>

          {/* ── Pulsing accent dots ── */}
          <g fill="#8cf2f5">
            <circle
              className="motion-safe:animate-pulse"
              cx="948"
              cy="86"
              r="3.5"
            />
            <circle
              className="motion-safe:animate-pulse [animation-delay:700ms]"
              cx="612"
              cy="88"
              r="4"
            />
            <circle
              className="motion-safe:animate-pulse [animation-delay:1400ms]"
              cx="1284"
              cy="92"
              r="3"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

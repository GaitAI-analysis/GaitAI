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
 * Vector gait field for the MobilityCare vision hero. The geometry adapts the
 * joint-and-bone language used by the main GaitAI hero without loading WebGL.
 */
export function MobilityVisionBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg
        className="h-full w-full opacity-50 sm:opacity-65 lg:opacity-80"
        focusable="false"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 1080"
      >
        <defs>
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
              strokeOpacity="0.075"
              strokeWidth="0.75"
            />
          </pattern>
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
          <linearGradient id="mobility-vision-trail" x1="0" x2="1">
            <stop offset="0" stopColor="#0fa3b1" stopOpacity="0" />
            <stop offset="0.45" stopColor="#4fd1ff" stopOpacity="0.56" />
            <stop offset="1" stopColor="#5587ff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="mobility-vision-light">
            <stop offset="0" stopColor="#0fa3b1" stopOpacity="0.16" />
            <stop offset="0.58" stopColor="#2563ff" stopOpacity="0.07" />
            <stop offset="1" stopColor="#2563ff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mobility-vision-fade" x1="0" x2="1">
            <stop offset="0" stopColor="white" stopOpacity="0.12" />
            <stop offset="0.3" stopColor="white" stopOpacity="0.3" />
            <stop offset="0.58" stopColor="white" stopOpacity="0.88" />
            <stop offset="1" stopColor="white" />
          </linearGradient>
          <mask id="mobility-vision-mask">
            <rect width="1440" height="1080" fill="url(#mobility-vision-fade)" />
          </mask>
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

        <rect width="1440" height="1080" fill="url(#mobility-vision-grid)" />
        <ellipse
          cx="1070"
          cy="452"
          fill="url(#mobility-vision-light)"
          rx="560"
          ry="455"
        />

        <g mask="url(#mobility-vision-mask)">
          <g
            fill="none"
            stroke="#5587ff"
            strokeOpacity="0.15"
            strokeWidth="1"
          >
            <ellipse
              cx="1070"
              cy="448"
              rx="452"
              ry="244"
              transform="rotate(-9 1070 448)"
            />
            <ellipse
              cx="1070"
              cy="448"
              rx="570"
              ry="326"
              strokeDasharray="5 13"
              transform="rotate(13 1070 448)"
            />
            <path d="M640 184 C800 238 900 178 1024 235 S1268 304 1392 226" />
            <path d="M676 692 C814 606 942 694 1060 630 S1288 568 1420 652" />
          </g>

          <g
            fill="none"
            stroke="#4fd1ff"
            strokeOpacity="0.16"
            strokeWidth="1"
          >
            <path d="M735 300 L855 238 L962 290 L1086 210 L1190 278 L1320 232" />
            <path d="M752 550 L880 486 L986 565 L1118 493 L1244 550 L1364 470" />
            <path d="M855 238 L880 486 M962 290 L986 565 M1086 210 L1118 493 M1190 278 L1244 550" />
          </g>

          <g fill="#06101d" stroke="#4fd1ff" strokeWidth="1.25">
            {[
              [735, 300],
              [855, 238],
              [962, 290],
              [1086, 210],
              [1190, 278],
              [1320, 232],
              [752, 550],
              [880, 486],
              [986, 565],
              [1118, 493],
              [1244, 550],
              [1364, 470],
            ].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="3.25" />
            ))}
          </g>

          <g filter="url(#mobility-vision-soft-glow)">
            <GaitFigure
              points={APPROACH_POSE}
              transform="translate(760 444) scale(0.92)"
              opacity={0.32}
            />
            <GaitFigure
              points={MID_STRIDE_POSE}
              transform="translate(1070 438) scale(1.38)"
              opacity={0.86}
            />
            <GaitFigure
              points={RELEASE_POSE}
              transform="translate(1370 446) scale(0.96)"
              opacity={0.36}
            />
          </g>

          <g fill="none" strokeLinecap="round">
            <path
              d="M662 574 C810 534 892 590 1038 555 S1270 514 1434 555"
              stroke="url(#mobility-vision-trail)"
              strokeWidth="2"
            />
            <path
              d="M704 606 C854 573 958 626 1095 591 S1300 566 1408 590"
              stroke="#0fa3b1"
              strokeDasharray="2 11"
              strokeOpacity="0.3"
              strokeWidth="1.4"
            />
          </g>

          <g fill="#8cf2f5">
            <circle
              className="motion-safe:animate-pulse"
              cx="855"
              cy="238"
              r="3.5"
            />
            <circle
              className="motion-safe:animate-pulse [animation-delay:700ms]"
              cx="1118"
              cy="493"
              r="4"
            />
            <circle
              className="motion-safe:animate-pulse [animation-delay:1400ms]"
              cx="1320"
              cy="232"
              r="3"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

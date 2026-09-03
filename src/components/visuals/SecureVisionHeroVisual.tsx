import type { CSSProperties, ReactNode } from "react";
import styles from "./SecureVisionHeroVisual.module.css";

type Tone = "cyan" | "blue" | "violet" | "slate";
type Travel =
  | "forward"
  | "forwardFast"
  | "reverse"
  | "reverseFast"
  | "selectedTravel";

type Walker = {
  id: string;
  x: number;
  y: number;
  scale: number;
  direction: 1 | -1;
  tone: Tone;
  travel: Travel;
  phase: string;
  delay: string;
  speed: string;
  mobile: boolean;
};

const walkers: Walker[] = [
  { id: "far-a", x: 410, y: 382, scale: 0.43, direction: 1, tone: "slate", travel: "forward", phase: "-.28s", delay: "-8s", speed: "18s", mobile: false },
  { id: "far-b", x: 650, y: 354, scale: 0.36, direction: -1, tone: "violet", travel: "reverse", phase: "-.52s", delay: "-3s", speed: "16s", mobile: false },
  { id: "far-c", x: 890, y: 392, scale: 0.48, direction: 1, tone: "cyan", travel: "forwardFast", phase: "-.14s", delay: "-6s", speed: "13s", mobile: true },
  { id: "far-d", x: 1210, y: 370, scale: 0.4, direction: -1, tone: "slate", travel: "reverseFast", phase: "-.64s", delay: "-10s", speed: "14s", mobile: false },
  { id: "mid-a", x: 470, y: 575, scale: 0.78, direction: 1, tone: "violet", travel: "forwardFast", phase: "-.38s", delay: "-4s", speed: "15s", mobile: false },
  { id: "mid-b", x: 700, y: 635, scale: 0.96, direction: -1, tone: "cyan", travel: "reverse", phase: "-.08s", delay: "-9s", speed: "17s", mobile: true },
  { id: "selected", x: 910, y: 642, scale: 1.13, direction: 1, tone: "blue", travel: "selectedTravel", phase: "-.22s", delay: "0s", speed: "14s", mobile: true },
  { id: "mid-c", x: 1115, y: 602, scale: 0.88, direction: -1, tone: "slate", travel: "reverseFast", phase: "-.58s", delay: "-2s", speed: "12s", mobile: true },
  { id: "near-a", x: 1375, y: 700, scale: 1.24, direction: -1, tone: "violet", travel: "reverse", phase: "-.44s", delay: "-12s", speed: "19s", mobile: false },
  { id: "near-b", x: 1535, y: 565, scale: 0.72, direction: -1, tone: "cyan", travel: "reverseFast", phase: "-.18s", delay: "-5s", speed: "14s", mobile: false },
];

const metrics = [
  { label: "Cadence", value: "112", unit: "steps/min", level: "78%" },
  { label: "Stride length", value: "1.24", unit: "m", level: "84%" },
  { label: "Step symmetry", value: "92", unit: "%", level: "92%" },
  { label: "Posture stability", value: "94", unit: "%", level: "94%" },
  { label: "Gait cycle", value: "0.98", unit: "sec", level: "81%" },
];

function walkerStyle(walker: Walker): CSSProperties {
  return {
    "--walker-x": walker.x,
    "--walker-y": walker.y,
    "--walker-scale": walker.scale,
    "--walker-direction": walker.direction,
    "--gait-phase": walker.phase,
    "--travel-delay": walker.delay,
    "--travel-speed": walker.speed,
  } as CSSProperties;
}

function PersonSilhouette({ tone }: { tone: Tone }) {
  return (
    <g className={`${styles.person} ${styles[`person${tone}`]}`}>
      <g className={styles.bodyBob}>
        <circle className={styles.personHead} cx="0" cy="-76" r="13" />
        <path className={styles.personBody} d="M-13-58Q0-65 13-58L16-10Q10 4 0 5-10 4-16-10Z" />
        <g className={styles.armBack}>
          <path d="M-10-51Q-24-31-27-4" />
          <circle cx="-27" cy="-3" r="5" />
        </g>
        <g className={styles.armFront}>
          <path d="M10-51Q23-28 28-2" />
          <circle cx="28" cy="-1" r="5" />
        </g>
        <g className={styles.legBack}>
          <path d="M-7 0Q-14 25-18 57" />
          <path d="M-18 57L-30 62" />
        </g>
        <g className={styles.legFront}>
          <path d="M7 0Q14 24 21 55" />
          <path d="M21 55L34 59" />
        </g>
      </g>
    </g>
  );
}

function PoseSkeleton({ selected = false }: { selected?: boolean }) {
  return (
    <g className={selected ? styles.selectedSkeleton : styles.skeleton}>
      <g className={styles.bodyBob}>
        <circle cx="0" cy="-76" r="11" />
        <circle cx="0" cy="-59" r="3" />
        <circle cx="0" cy="-28" r="3" />
        <circle cx="0" cy="0" r="3" />
        <path d="M0-65V0M-14-52L0-59 14-52M-9 0H9" />
        <g className={styles.armBack}>
          <path d="M-14-52Q-24-29-27-4" />
          <circle cx="-14" cy="-52" r="3" />
          <circle cx="-21" cy="-29" r="3" />
          <circle cx="-27" cy="-4" r="3" />
        </g>
        <g className={styles.armFront}>
          <path d="M14-52Q24-27 28-2" />
          <circle cx="14" cy="-52" r="3" />
          <circle cx="22" cy="-27" r="3" />
          <circle cx="28" cy="-2" r="3" />
        </g>
        <g className={styles.legBack}>
          <path d="M-9 0Q-14 26-18 57L-30 62" />
          <circle cx="-9" cy="0" r="3" />
          <circle cx="-15" cy="29" r="3" />
          <circle cx="-18" cy="57" r="3" />
        </g>
        <g className={styles.legFront}>
          <path d="M9 0Q14 25 21 55L34 59" />
          <circle cx="9" cy="0" r="3" />
          <circle cx="15" cy="28" r="3" />
          <circle cx="21" cy="55" r="3" />
        </g>
      </g>
    </g>
  );
}

function PlacedWalker({
  walker,
  children,
}: {
  walker: Walker;
  children: ReactNode;
}) {
  return (
    <g
      className={`${styles.walker} ${styles[walker.travel]} ${walker.mobile ? "" : styles.mobileHide}`}
      style={walkerStyle(walker)}
      data-subject={walker.id}
    >
      <g transform={`translate(${walker.x} ${walker.y}) scale(${walker.scale * walker.direction} ${walker.scale})`}>
        {children}
      </g>
    </g>
  );
}

function PublicSpaceScene() {
  return (
    <svg
      className={styles.scene}
      viewBox="0 0 1600 850"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sv-concourse-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#030813" />
          <stop offset=".46" stopColor="#08162a" />
          <stop offset="1" stopColor="#061329" />
        </linearGradient>
        <linearGradient id="sv-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#17334c" stopOpacity=".2" />
          <stop offset="1" stopColor="#020711" stopOpacity=".96" />
        </linearGradient>
        <linearGradient id="sv-light-panel" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#7ddcff" stopOpacity=".22" />
          <stop offset=".5" stopColor="#315cff" stopOpacity=".09" />
          <stop offset="1" stopColor="#9a75ff" stopOpacity=".2" />
        </linearGradient>
        <radialGradient id="sv-depth-glow" cx="68%" cy="36%" r="54%">
          <stop stopColor="#2563ff" stopOpacity=".2" />
          <stop offset=".52" stopColor="#143a9b" stopOpacity=".07" />
          <stop offset="1" stopColor="#030813" stopOpacity="0" />
        </radialGradient>
        <filter id="sv-soft-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id="sv-light-blur" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="24" />
        </filter>
      </defs>

      <rect width="1600" height="850" fill="url(#sv-concourse-bg)" />
      <rect width="1600" height="850" fill="url(#sv-depth-glow)" />

      <g className={styles.environment}>
        <g className={styles.ceiling}>
          <path d="M0 0H1600V220L800 290 0 220Z" />
          <path d="M0 88L800 290 1600 88M0 184L800 290 1600 184" />
          <path d="M140 0L800 290M430 0L800 290M720 0L800 290M1040 0L800 290M1370 0L800 290" />
          <path className={styles.ceilingLight} d="M230 32L650 245M540 18L758 266M1360 34L934 246M1070 18L845 267" />
        </g>

        <g className={styles.lightPanels}>
          <rect x="116" y="150" width="190" height="142" rx="5" />
          <rect x="350" y="179" width="138" height="112" rx="5" />
          <rect x="1100" y="168" width="182" height="126" rx="5" />
          <rect x="1330" y="142" width="206" height="154" rx="5" />
        </g>

        <g className={styles.wayfinding} transform="translate(735 102)">
          <rect width="248" height="72" rx="7" />
          <path d="M78 17V55M168 17V55" />
          <path d="M24 36H58M47 25L58 36 47 47M104 24H144M104 36H137M104 48H129M194 23H224M194 36H217M194 49H209" />
        </g>

        <g className={styles.columns}>
          <path d="M60 80H130L155 596H34Z" />
          <path d="M322 128H371L386 502H305Z" />
          <path d="M1214 124H1268L1285 521H1199Z" />
          <path d="M1492 72H1570L1600 622H1464Z" />
          <path className={styles.columnEdge} d="M130 80L155 596M371 128L386 502M1268 124L1285 521M1570 72L1600 622" />
        </g>

        <path className={styles.horizon} d="M0 302Q800 270 1600 302" />
        <path className={styles.floor} d="M0 292H1600V850H0Z" />

        <g className={styles.floorGrid}>
          <path d="M0 330H1600M0 390H1600M0 470H1600M0 570H1600M0 696H1600" />
          <path d="M800 286L30 850M800 286L262 850M800 286L494 850M800 286L680 850M800 286L920 850M800 286L1106 850M800 286L1338 850M800 286L1570 850" />
        </g>

        <g className={styles.walkingLanes}>
          <path d="M145 850L653 292M425 850L722 292M1176 850L884 292M1476 850L951 292" />
        </g>

        <g className={styles.distantCrowd}>
          <path d="M535 357v-42q0-18 17-27l6-4q-8-7-8-17 0-17 17-17t17 17q0 10-8 17l7 4q17 9 17 27v42Z" />
          <path d="M1010 366v-46q0-19 18-29l7-4q-9-8-9-19 0-18 18-18t18 18q0 11-9 19l7 4q18 10 18 29v46Z" />
          <path d="M755 350v-36q0-16 15-24l5-3q-7-7-7-16 0-15 15-15t15 15q0 9-7 16l6 3q15 8 15 24v36Z" />
        </g>

        <ellipse className={styles.lightBloom} cx="1050" cy="385" rx="280" ry="92" />
      </g>

      <g className={styles.peopleLayer}>
        {walkers.map((walker) => (
          <PlacedWalker key={walker.id} walker={walker}>
            <PersonSilhouette tone={walker.tone} />
          </PlacedWalker>
        ))}
      </g>

      <g className={styles.foregroundBlur}>
        <circle cx="88" cy="530" r="54" />
        <path d="M-28 850V650Q88 545 204 650V850Z" />
      </g>
    </svg>
  );
}

function CrowdFlowLayer() {
  return (
    <g className={styles.flowLayer}>
      <path className={styles.flowPath} pathLength="1" d="M380 566C570 505 730 542 895 485S1195 427 1435 470" />
      <path className={styles.flowPathAlt} pathLength="1" d="M460 706C680 625 858 686 1035 622S1312 560 1515 606" />
      <path className={styles.flowPathDim} pathLength="1" d="M565 410C748 364 930 396 1108 350S1340 332 1490 356" />

      <g className={styles.flowArrows}>
        <path d="M607 514l18 5-14 12M812 506l18-2-10 15M1054 446l18-2-10 15M1283 441l18 4-14 12" />
      </g>

      <g className={styles.flowParticles}>
        <circle className={styles.flowParticleOne} r="4" />
        <circle className={styles.flowParticleTwo} r="3" />
        <circle className={styles.flowParticleThree} r="3.5" />
      </g>

      <g className={styles.zoneA}>
        <ellipse cx="666" cy="525" rx="156" ry="62" />
        <ellipse cx="666" cy="525" rx="126" ry="48" />
        <text x="555" y="470">ZONE A · DENSITY 0.72</text>
      </g>
      <g className={styles.zoneB}>
        <ellipse cx="1190" cy="540" rx="178" ry="72" />
        <ellipse cx="1190" cy="540" rx="142" ry="55" />
        <text x="1070" y="470">ZONE B · DENSITY 0.84</text>
      </g>

      <g className={styles.flowReadout} transform="translate(1290 310)">
        <rect width="176" height="52" rx="7" />
        <text x="14" y="21">FLOW DIRECTION</text>
        <text x="14" y="40">142 / MIN</text>
        <path d="M128 26H157M147 16l10 10-10 10" />
      </g>
    </g>
  );
}

function TrackingLayer() {
  const selected = walkers.find((walker) => walker.id === "selected")!;

  return (
    <>
      <g className={styles.crowdSkeletons}>
        {walkers.map((walker) => (
          <PlacedWalker key={walker.id} walker={walker}>
            <PoseSkeleton />
          </PlacedWalker>
        ))}
      </g>

      <g className={styles.selectedTrajectory}>
        <path className={styles.trajectoryGlow} pathLength="1" d="M550 682C654 654 747 678 834 638S1014 611 1112 578" />
        <path className={styles.trajectoryLine} pathLength="1" d="M550 682C654 654 747 678 834 638S1014 611 1112 578" />
        {[0, 1, 2, 3, 4, 5].map((dot) => (
          <circle key={dot} className={styles.trajectoryNode} style={{ "--node": dot } as CSSProperties} cx={550 + dot * 110} cy={682 - dot * 19} r="4" />
        ))}
      </g>

      <PlacedWalker walker={selected}>
        <g className={styles.selectedSubject}>
          <PoseSkeleton selected />
          <rect className={styles.trackingFrame} x="-47" y="-98" width="94" height="175" rx="5" />
          <path className={styles.trackingCorners} d="M-47-73V-98H-20M20-98H47V-73M47 52V77H20M-20 77H-47V52" />
          <line className={styles.bodyScan} x1="-43" x2="43" y1="-74" y2="-74" />
          <ellipse className={styles.gaitOrbit} cx="0" cy="18" rx="42" ry="23" />
          <g className={styles.trackerLabel} transform="translate(-47 -119)">
            <rect width="152" height="19" rx="3" />
            <text x="8" y="13">GAIT TRACK · G-7A21</text>
          </g>
        </g>
      </PlacedWalker>
    </>
  );
}

function Metric({ label, value, unit, level, index }: (typeof metrics)[number] & { index: number }) {
  return (
    <div className={styles.metric} style={{ "--metric-index": index } as CSSProperties}>
      <div>
        <span>{label}</span>
        <strong>{value} <small>{unit}</small></strong>
      </div>
      <i><span style={{ "--metric-level": level } as CSSProperties} /></i>
    </div>
  );
}

function LiveAnalyticsHud() {
  return (
    <aside className={styles.analyticsHud} aria-hidden="true">
      <div className={styles.hudChrome}>
        <span><i /> SECUREVISION · DEMO</span>
        <span>EDGE · ENCRYPTED</span>
      </div>

      <section className={`${styles.hudStage} ${styles.metricsStage}`}>
        <header>GAIT ANALYTICS · G-7A21</header>
        <div className={styles.metrics}>
          {metrics.map((metric, index) => (
            <Metric key={metric.label} {...metric} index={index} />
          ))}
        </div>
      </section>

      <section className={`${styles.hudStage} ${styles.matchStage}`}>
        <div className={styles.signatureWave}>
          {[18, 32, 48, 26, 56, 38, 22, 45, 30].map((height, index) => (
            <i key={index} style={{ "--wave-height": `${height}px`, "--wave-index": index } as CSSProperties} />
          ))}
        </div>
        <span>GAIT SIGNATURE MATCH</span>
        <strong>G-7A21</strong>
        <b>DEMO</b>
        <small>ILLUSTRATIVE DEMO</small>
      </section>

      <section className={`${styles.hudStage} ${styles.resultStage}`}>
        <div className={styles.resultRing}><span>✓</span></div>
        <span>MOVEMENT NORMAL</span>
        <strong>LOW RISK</strong>
        <div className={styles.privacyStatus}>
          <b>PRIVACY MODE · ON</b>
          <small>NO FACIAL DATA USED</small>
        </div>
      </section>
    </aside>
  );
}

function MobileStatus() {
  return (
    <div className={styles.mobileStatus} aria-hidden="true">
      <strong>G-7A21 · GAIT MATCH · DEMO</strong>
      <span><i /> PRIVACY MODE · ON</span>
    </div>
  );
}

export function SecureVisionHeroVisual({
  backgroundLayer,
}: {
  backgroundLayer?: ReactNode;
} = {}) {
  return (
    <div
      className={styles.visual}
      role="img"
      aria-label="Illustration of privacy-aware movement intelligence analyzing skeleton-only representations of people walking through a public concourse"
    >
      {/* This media surface can later accept video without changing any tracking or HUD layers. */}
      <div className={styles.mediaLayer} aria-hidden="true">
        {backgroundLayer ?? <PublicSpaceScene />}
      </div>

      <svg
        className={styles.intelligenceLayer}
        viewBox="0 0 1600 850"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <CrowdFlowLayer />
        <TrackingLayer />
      </svg>

      <div className={styles.scanSweep} aria-hidden="true" />
      <LiveAnalyticsHud />
      <MobileStatus />

      <div className={styles.sceneStatus} aria-hidden="true">
        <span><i /> PUBLIC CONCOURSE · CAM 04</span>
        <span>SKELETON-ONLY PROCESSING</span>
      </div>

      <div className={styles.copyScrim} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />
    </div>
  );
}

import type { CSSProperties, ReactNode } from "react";
import styles from "./SecureVisionHeroVisual.module.css";

const metrics = [
  { label: "Cadence", value: "112", unit: "spm", level: "72%" },
  { label: "Stride length", value: "1.34", unit: "m", level: "84%" },
  { label: "Step symmetry", value: "96.2", unit: "%", level: "96%" },
  { label: "Posture stability", value: "94.8", unit: "%", level: "95%" },
  { label: "Gait cycle", value: "1.07", unit: "s", level: "78%" },
  { label: "Mobility score", value: "92", unit: "/100", level: "92%" },
];

function Person({ tone = "blue" }: { tone?: "blue" | "violet" | "cyan" }) {
  return (
    <g className={`${styles.person} ${styles[`person${tone}`]}`}>
      <circle cx="0" cy="-50" r="9" />
      <path d="M-7-38 Q0-43 7-38 L10-5 Q7 7 0 9 Q-7 7-10-5Z" />
      <path d="M-6 5 L-11 38 L-4 39 L1 14 L7 39 L14 37 L7 4Z" />
      <path d="M-8-31 L-20-3 L-15 0 L-3-21 L12-2 L17-6 L7-34Z" />
    </g>
  );
}

function Skeleton() {
  return (
    <g className={styles.skeleton}>
      <circle cx="0" cy="-50" r="8" />
      <circle cx="0" cy="-37" r="2.4" />
      <circle cx="0" cy="-10" r="2.4" />
      <circle cx="-10" cy="-31" r="2.1" />
      <circle cx="10" cy="-31" r="2.1" />
      <circle cx="-17" cy="-4" r="2.1" />
      <circle cx="17" cy="-4" r="2.1" />
      <circle cx="-6" cy="6" r="2.1" />
      <circle cx="6" cy="6" r="2.1" />
      <circle cx="-10" cy="37" r="2.1" />
      <circle cx="13" cy="37" r="2.1" />
      <path d="M0-42V-10M-10-31L0-37 10-31M-10-31L-17-4M10-31L17-4M0-10L-6 6M0-10L6 6M-6 6L-10 37M6 6L13 37" />
    </g>
  );
}

function PublicSpaceScene() {
  return (
    <svg
      className={styles.scene}
      viewBox="0 0 760 440"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="secure-scene-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#071425" />
          <stop offset="0.55" stopColor="#0a1d36" />
          <stop offset="1" stopColor="#080d1d" />
        </linearGradient>
        <radialGradient id="secure-scene-glow" cx="38%" cy="42%" r="65%">
          <stop offset="0" stopColor="#2563ff" stopOpacity="0.22" />
          <stop offset="0.56" stopColor="#1438a8" stopOpacity="0.08" />
          <stop offset="1" stopColor="#071425" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="secure-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#132b4a" stopOpacity="0.18" />
          <stop offset="1" stopColor="#020711" stopOpacity="0.86" />
        </linearGradient>
        <filter id="secure-soft-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      <rect width="760" height="440" fill="url(#secure-scene-bg)" />
      <rect width="760" height="440" fill="url(#secure-scene-glow)" />
      <circle cx="274" cy="207" r="86" fill="#2563ff" opacity="0.07" filter="url(#secure-soft-glow)" />

      <g className={styles.architecture}>
        <path d="M0 114H760M0 177H760" />
        <path d="M64 36V293M183 36V286M306 36V281M431 36V281M556 36V286M688 36V296" />
        <path d="M0 177L64 114 183 177 306 114 431 177 556 114 688 177 760 123" />
        <rect x="42" y="60" width="122" height="118" rx="4" />
        <rect x="202" y="60" width="92" height="118" rx="4" />
        <rect x="330" y="60" width="112" height="118" rx="4" />
        <rect x="478" y="60" width="104" height="118" rx="4" />
        <rect x="616" y="60" width="92" height="118" rx="4" />
      </g>

      <path d="M0 266H760V440H0Z" fill="url(#secure-floor)" />
      <g className={styles.floorGrid}>
        <path d="M0 286H760M0 332H760M0 386H760" />
        <path d="M380 244L62 440M380 244L208 440M380 244L326 440M380 244L437 440M380 244L554 440M380 244L716 440" />
      </g>

      <g transform="translate(76 260) scale(.82)">
        <g className={styles.walkerOne}><Person tone="cyan" /></g>
      </g>
      <g transform="translate(164 230) scale(.63)">
        <g className={styles.walkerTwo}><Person tone="violet" /></g>
      </g>
      <g transform="translate(235 262)">
        <g className={styles.selectedWalker}><Person tone="blue" /></g>
      </g>
      <g transform="translate(430 245) scale(.74)">
        <g className={styles.walkerThree}><Person tone="cyan" /></g>
      </g>
      <g transform="translate(590 270) scale(.9)">
        <g className={styles.walkerFour}><Person tone="violet" /></g>
      </g>

      <g className={styles.foregroundBlur}>
        <circle cx="20" cy="320" r="24" />
        <path d="M-18 440V358Q20 320 58 358V440Z" />
      </g>
    </svg>
  );
}

function CrowdSkeletonLayer() {
  return (
    <g className={styles.skeletonLayer}>
      <g transform="translate(76 260) scale(.82)"><g className={styles.walkerOne}><Skeleton /></g></g>
      <g transform="translate(164 230) scale(.63)"><g className={styles.walkerTwo}><Skeleton /></g></g>
      <g transform="translate(235 262)"><g className={styles.selectedWalker}><Skeleton /></g></g>
      <g transform="translate(430 245) scale(.74)"><g className={styles.walkerThree}><Skeleton /></g></g>
      <g transform="translate(590 270) scale(.9)"><g className={styles.walkerFour}><Skeleton /></g></g>
    </g>
  );
}

function SelectedSubjectTracker() {
  return (
    <g transform="translate(235 262)" className={styles.selectionLayer}>
      <g className={styles.selectedWalker}>
        <rect className={styles.trackingBox} x="-30" y="-68" width="60" height="114" rx="5" />
        <path className={styles.cornerMarks} d="M-30-50V-68H-12M12-68H30V-50M30 28V46H12M-12 46H-30V28" />
        <line className={styles.scanLine} x1="-28" x2="28" y1="-46" y2="-46" />
        <g className={styles.gaitAnalysisArcs}>
          <path d="M-23 12Q0 32 23 12" />
          <path d="M-18 23Q0 43 18 23" />
          <circle cx="0" cy="-10" r="35" />
        </g>
        <g className={styles.subjectLabel} transform="translate(-30 -82)">
          <rect width="80" height="15" rx="3" />
          <text x="6" y="10.5">SUBJECT 07</text>
        </g>
      </g>
    </g>
  );
}

function TrajectoryLayer() {
  return (
    <g className={styles.trajectoryLayer}>
      <path
        className={styles.trajectoryGlow}
        pathLength="1"
        d="M228 307C281 289 311 312 351 283S428 278 471 252"
      />
      <path
        className={styles.trajectory}
        pathLength="1"
        d="M228 307C281 289 311 312 351 283S428 278 471 252"
      />
      {[228, 276, 326, 376, 426, 471].map((cx, index) => (
        <circle key={cx} className={styles.trajectoryDot} cx={cx} cy={[307, 296, 298, 274, 270, 252][index]} r="2.6" />
      ))}
    </g>
  );
}

function Metric({ label, value, unit, level }: (typeof metrics)[number]) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricHeader}>
        <span>{label}</span>
        <strong>{value}<small>{unit}</small></strong>
      </div>
      <span className={styles.metricTrack}>
        <span style={{ "--metric-level": level } as CSSProperties} />
      </span>
    </div>
  );
}

function LiveAnalyticsPanel() {
  return (
    <aside className={styles.analyticsPanel} aria-hidden="true">
      <header className={styles.panelHeader}>
        <span>GAIT ANALYSIS</span>
        <span className={styles.signalBars}><i /><i /><i /><i /></span>
      </header>

      <div className={`${styles.panelStage} ${styles.metricsStage}`}>
        <div className={styles.stageEyebrow}>LIVE MOVEMENT PROFILE</div>
        <div className={styles.metricsGrid}>
          {metrics.map((metric) => <Metric key={metric.label} {...metric} />)}
        </div>
      </div>

      <div className={`${styles.panelStage} ${styles.matchStage}`}>
        <div className={styles.signatureMark}>
          <span /><span /><span /><span /><span /><span /><span />
        </div>
        <div className={styles.stageEyebrow}>GAIT SIGNATURE MATCH</div>
        <strong className={styles.matchId}>ID: G-7A21</strong>
        <div className={styles.confidence}>
          <span>MATCH CONFIDENCE</span>
          <strong>98.7%</strong>
        </div>
      </div>

      <div className={`${styles.panelStage} ${styles.privacyStage}`}>
        <div className={styles.privacyShield}>
          <svg viewBox="0 0 40 48" aria-hidden="true">
            <path d="M20 2 36 8v13c0 11-6.7 19.6-16 25C10.7 40.6 4 32 4 21V8Z" />
            <path d="m12 24 5 5 11-12" />
          </svg>
        </div>
        <div className={styles.stageEyebrow}>PRIVACY MODE · ON</div>
        <strong>NO FACIAL DATA USED</strong>
        <span>Movement features only</span>
      </div>

      <div className={`${styles.panelStage} ${styles.outcomeStage}`}>
        <div className={styles.outcomeRing}><span>✓</span></div>
        <div className={styles.stageEyebrow}>MOVEMENT NORMAL</div>
        <strong>ANOMALY RISK: <em>LOW</em></strong>
        <div className={styles.riskBar}><span /></div>
      </div>

      <div className={styles.reducedSummary}>
        <div className={styles.stageEyebrow}>PRIVACY MODE · ON</div>
        <strong>NO FACIAL DATA USED</strong>
        <span>G-7A21 · 98.7% match</span>
        <span>MOVEMENT NORMAL · RISK LOW</span>
      </div>
    </aside>
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
      aria-label="Animated SecureVision simulation showing anonymized crowd tracking, gait analysis, pseudonymous matching and privacy-first safety assessment"
    >
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.topBar} aria-hidden="true">
        <span><i />SECUREVISION · LIVE</span>
        <span>PUBLIC CONCOURSE · CAM 04</span>
      </div>

      {/* Swappable media surface: a future video can replace only this layer. */}
      <div className={styles.mediaLayer} aria-hidden="true">
        {backgroundLayer ?? <PublicSpaceScene />}
      </div>

      <svg
        className={styles.trackingLayer}
        viewBox="0 0 760 440"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <CrowdSkeletonLayer />
        <TrajectoryLayer />
        <SelectedSubjectTracker />
      </svg>

      <LiveAnalyticsPanel />

      <div className={styles.bottomHud} aria-hidden="true">
        <span>PEOPLE · 05</span>
        <span>SKELETON-ONLY PROCESSING</span>
        <span>ENCRYPTED · EDGE</span>
      </div>
      <div className={styles.scanSweep} aria-hidden="true" />
    </div>
  );
}

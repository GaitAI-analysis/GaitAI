import Link from "next/link";
import {
  Cctv,
  Cpu,
  Fingerprint,
  Footprints,
  Grid3x3,
  PersonStanding,
  ShieldCheck,
  Smartphone,
  Video,
  Watch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import styles from "./observatory.module.css";

/**
 * Capture → engine → capabilities, as one instrument panel.
 *
 * The page already argued the record and the evidence map separately. What it
 * never showed in one frame was the shape of the thing the record grounds: what
 * goes in, the four layers it passes through, and which capabilities come out
 * with published work behind them.
 *
 * WHERE EVERY VALUE COMES FROM
 *  - capture rows: the input modalities named in `product-details.ts`
 *    (WalkScan's "Smartphone recording" / "Clinic camera" / "Compatible CCTV
 *    or fixed-camera footage", WatchCare's "IMU / accelerometer" and
 *    "Smartphone motion signals"), which is what the platform documents itself
 *    as accepting.
 *  - engine layers: the stage titles the platform already uses.
 *  - capability rows and their module counts: derived from `researchAreas` in
 *    `evidence.ts`, so only capabilities with a published record appear, and
 *    each count is the number of shipped modules built on that capability.
 *    A capability with no research node mapped to it is absent rather than
 *    listed with a zero — that absence is the honest answer.
 *
 * WHY PER-ROW LEADS AND NOT A CURVE FAN
 * The wiring was first drawn as one SVG stretched behind the grid, with each
 * connector solved from a row index. That cannot hold here: the three panels
 * carry four, four and six rows, so the grid's height is set by the tallest
 * one and every computed endpoint drifts off its row. Each row now carries its
 * own lead and node instead, which is exact at any panel height and any
 * breakpoint, and the engine panel's two edge rails are what the leads meet.
 */

export type PipelineCapability = {
  id: string;
  title: string;
  description: string;
  /** Shipped modules built on this capability. */
  modules: number;
};

/** Input modalities, each with a descriptor taken from the product records. */
const CAPTURE: { icon: LucideIcon; name: string; detail: string }[] = [
  { icon: Video, name: "Walking video", detail: "Smartphone or clinic camera" },
  { icon: Watch, name: "Smartwatch IMU", detail: "IMU / accelerometer" },
  { icon: Smartphone, name: "Mobile sensor", detail: "Smartphone motion signals" },
  { icon: Cctv, name: "CCTV feed", detail: "Compatible fixed-camera footage" },
];

/** The four layers the signal passes through. */
const LAYERS: { icon: LucideIcon; title: string; detail: string }[] = [
  {
    icon: PersonStanding,
    title: "Pose skeleton",
    detail: "Body keypoints at frame rate",
  },
  {
    icon: Footprints,
    title: "Gait features",
    detail: "Cadence, symmetry, variability",
  },
  { icon: Grid3x3, title: "Model layer", detail: "Learning & generalisation" },
  {
    icon: ShieldCheck,
    title: "Edge + privacy",
    detail: "On-device inference & data protection",
  },
];

const CAP_ICON: Record<string, LucideIcon> = {
  "cap-biometrics": Fingerprint,
  "cap-gait": Footprints,
  "cap-reid": Grid3x3,
  "cap-pose": PersonStanding,
  "cap-privacy": ShieldCheck,
  "cap-edge": Cpu,
};

export function ResearchPipeline({
  capabilities,
}: {
  capabilities: PipelineCapability[];
}) {
  return (
    <div className={styles.pipe}>
      <div className={styles.pipeGrid}>
        {/* ── Capture ── */}
        <section className={styles.pPanel}>
          <h3 className={styles.pPanelLabel}>Capture &amp; signals</h3>
          <ul className={styles.pRows}>
            {CAPTURE.map((c) => (
              <li key={c.name} className={styles.pRow}>
                <span aria-hidden="true" className={styles.pLeadOut} />
                <span aria-hidden="true" className={styles.pNodeOut} />
                <span aria-hidden="true" className={styles.pRowIcon}>
                  <c.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className={styles.pRowName}>{c.name}</span>
                  <span className={styles.pRowDetail}>{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Engine ── */}
        <section className={`${styles.pPanel} ${styles.pEngine}`}>
          <span aria-hidden="true" className={styles.pRailIn} />
          <span aria-hidden="true" className={styles.pRailOut} />
          <h3 className={`${styles.pPanelLabel} ${styles.pEngineLabel}`}>
            Movement intelligence engine
          </h3>
          <ol className={styles.pLayers}>
            {LAYERS.map((l, i) => (
              <li
                key={l.title}
                className={styles.pLayer}
                style={{ ["--p-i" as string]: i }}
              >
                <span aria-hidden="true" className={styles.pLayerIndex}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span aria-hidden="true" className={styles.pLayerIcon}>
                  <l.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className={styles.pLayerTitle}>{l.title}</span>
                  <span className={styles.pLayerDetail}>{l.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Capabilities ── */}
        <section className={styles.pPanel}>
          <h3 className={styles.pPanelLabel}>Capabilities</h3>
          <ul className={styles.pRows}>
            {capabilities.map((c) => {
              const Icon = CAP_ICON[c.id] ?? Footprints;
              return (
                <li key={c.id} className={styles.pRow}>
                  <span aria-hidden="true" className={styles.pLeadIn} />
                  <span aria-hidden="true" className={styles.pNodeIn} />
                  <span aria-hidden="true" className={styles.pRowIconViolet}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={styles.pRowName}>{c.title}</span>
                    <span className={styles.pRowDetail}>{c.description}</span>
                  </span>
                  {/* Shipped modules built on this capability. */}
                  <span
                    className={styles.pRowCount}
                    title={`${c.modules} product ${
                      c.modules === 1 ? "module" : "modules"
                    } built on ${c.title}`}
                  >
                    {c.modules}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <p className={styles.pipeNote}>
        Only capabilities with a published record behind them are listed; the
        number is the shipped product modules each one carries. What the
        research establishes, and where a separate implementation takes over,
        is set out in the{" "}
        <Link href="#evidence-map" className={styles.pipeNoteLink}>
          evidence map
        </Link>
        .
      </p>
    </div>
  );
}

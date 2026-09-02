"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./landing.module.css";

/**
 * The five-minute lab — one idea at a time, in about sixty seconds.
 *
 * A reader who is not ready to open a nine-minute essay still has something to
 * do here, and every explainer ends by pointing at the essay that argues it
 * properly. The five ideas are the five hinge points of the collection:
 *
 *   pixels → pose · pose → gait · identity vs movement ·
 *   snapshot vs trajectory · missing vs corrupted
 *
 * Each panel is a drawn contrast, not a paragraph. The contrast IS the idea:
 * two states side by side, and the one line that distinguishes them.
 *
 * The tab list is a real tab pattern — arrow keys and Home/End move through it,
 * every panel is in the DOM, and the selected panel is the only one shown. No
 * information lives behind hover alone.
 */

type Explainer = {
  id: string;
  index: string;
  short: string;
  title: string;
  left: { label: string; lines: string[] };
  right: { label: string; lines: string[]; accent?: boolean };
  takeaway: string;
  href: string;
  hrefLabel: string;
};

const EXPLAINERS: Explainer[] = [
  {
    id: "pixels-pose",
    index: "01",
    short: "Pixels → Pose",
    title: "What a pose model actually keeps",
    left: {
      label: "RAW FRAME",
      lines: ["Clothing", "Lighting", "Background", "Camera noise"],
    },
    right: {
      label: "POSE",
      lines: ["Joint positions", "In space", "Per frame", "Nothing else"],
    },
    takeaway:
      "Raw pixels carry an enormous amount that has nothing to do with how a person walks. The first transformation strips it away.",
    href: "/insights/from-walking-video-to-movement-intelligence/",
    hrefLabel: "Enter the pipeline",
  },
  {
    id: "pose-gait",
    index: "02",
    short: "Pose → Gait",
    title: "Why one frame is not a gait",
    left: {
      label: "ONE FRAME",
      lines: ["A posture", "Joint angles", "A moment", "No rhythm"],
    },
    right: {
      label: "A SEQUENCE",
      lines: ["Cadence", "Stride rhythm", "Symmetry", "Variability"],
    },
    takeaway:
      "A single frame shows a posture. Only a sequence shows a gait — the features that matter exist in time.",
    href: "/insights/from-walking-video-to-movement-intelligence/",
    hrefLabel: "Follow the signal",
  },
  {
    id: "identity-movement",
    index: "03",
    short: "Identity vs Movement",
    title: "How much does the task really need",
    left: {
      label: "IDENTIFYING",
      lines: ["Who is this", "Appearance kept", "Face retained", "Linkable"],
    },
    right: {
      label: "MEASURING",
      lines: ["How are they moving", "Appearance dropped", "Skeleton only", "Task-sufficient"],
    },
    takeaway:
      "The question a privacy-aware architecture asks first is the minimum information required to solve the task.",
    href: "/insights/movement-intelligence-without-identification/",
    hrefLabel: "Explore privacy-first vision",
  },
  {
    id: "snapshot-trajectory",
    index: "04",
    short: "Snapshot vs Trajectory",
    title: "A number, and a direction",
    left: {
      label: "ONE SCORE",
      lines: ["A value today", "No baseline", "No history", "No direction"],
    },
    right: {
      label: "A TRAJECTORY",
      lines: ["Personal baseline", "Repeat assessments", "Rate of change", "Context"],
    },
    takeaway:
      "Two people can share a score and have entirely different trajectories. The direction is usually the finding.",
    href: "/insights/fall-risk-is-a-trend-not-a-number/",
    hrefLabel: "Follow the trajectory",
  },
  {
    id: "missing-corrupted",
    index: "05",
    short: "Missing vs Corrupted",
    title: "The failure you can see, and the one you cannot",
    left: {
      label: "MISSING",
      lines: ["Stream absent", "The model knows", "Can fall back", "Handled"],
    },
    right: {
      label: "CORRUPTED",
      lines: ["Stream present", "Quality is wrong", "Nothing flags it", "May be trusted"],
      accent: true,
    },
    takeaway:
      "Robustness to a missing input is not an edge case. A silently corrupted one is the harder problem.",
    href: "/insights/when-fusion-looks-better-than-it-is/",
    hrefLabel: "Audit the evidence",
  },
];

export function FiveMinuteLab() {
  const [active, setActive] = useState(0);

  const onKey = (e: React.KeyboardEvent) => {
    const last = EXPLAINERS.length - 1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i === last ? 0 : i + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i === 0 ? last : i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(last);
    }
  };

  return (
    <div className={styles.lab}>
      <div
        role="tablist"
        aria-label="Five-minute lab"
        className={styles.labTabs}
        onKeyDown={onKey}
      >
        {EXPLAINERS.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`lab-tab-${item.id}`}
            aria-selected={i === active}
            aria-controls={`lab-panel-${item.id}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={`${styles.labTab} ${i === active ? styles.labTabOn : ""}`}
          >
            <span className={styles.labTabNo}>{item.index}</span>
            {item.short}
          </button>
        ))}
      </div>

      {EXPLAINERS.map((item, i) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`lab-panel-${item.id}`}
          aria-labelledby={`lab-tab-${item.id}`}
          hidden={i !== active}
          className={styles.labPanel}
        >
          <h3 className={styles.labTitle}>{item.title}</h3>

          <div className={styles.labCompare}>
            {[item.left, item.right].map((side, s) => (
              <div
                key={side.label}
                className={`${styles.labSide} ${
                  "accent" in side && side.accent ? styles.labSideAccent : ""
                }`}
              >
                <p className={styles.labSideLabel}>{side.label}</p>
                <ul className={styles.labSideList}>
                  {side.lines.map((line) => (
                    <li key={line} className={styles.labSideItem}>
                      <span aria-hidden="true" className={styles.labSideMark} />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <span aria-hidden="true" className={styles.labVs}>
              vs
            </span>
          </div>

          <p className={styles.labTakeaway}>{item.takeaway}</p>

          <Link href={item.href} className={styles.labLink}>
            {item.hrefLabel}
            {/* The link's own hover widens the gap; the arrow needs no rule
                of its own, and a class the sheet does not define would ship a
                literal class="undefined". */}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      ))}
    </div>
  );
}

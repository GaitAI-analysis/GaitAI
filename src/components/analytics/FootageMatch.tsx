"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FAMILY_LABEL,
  analyticsProducts,
  type AnalyticsProduct,
} from "@/data/analytics";
import styles from "./footage.module.css";

/**
 * WHAT COULD GAITAI READ FROM YOUR FOOTAGE?
 *
 *   your footage → movement understanding → which modules fit, and why
 *
 * NOTHING IS UPLOADED AND NOTHING IS ANALYSED. The reader describes what their
 * footage contains; this matches that description against what each module's
 * own record says it needs. Running a real detector here would mean claiming a
 * production capability on a marketing page, and a "detected" list that was
 * really six toggles would be worse — so the six scene conditions are stated
 * as the reader's answers, not as findings.
 *
 * HOW SUITABILITY IS DERIVED — a requirements match, not a prediction.
 * Each module's requirements are read off its own documented `capabilityIds`
 * and `signalIds`:
 *
 *   needs pose        cap-pose
 *   needs lower limbs cap-gait, or any per-stride signal (cadence, step
 *                     symmetry, stride variability, walking speed)
 *   needs trajectory  cap-trajectory, or the trajectory / crowd signals
 *   needs duration    cap-temporal, or a signal that is itself a trend
 *                     (mobility decline, rehabilitation progress, fall risk)
 *   people in frame   implied by the above: per-stride work is one person at a
 *                     time, crowd and trajectory work is several
 *   capture source    the module's own `sources`, read from its input string
 *
 * A module is HIGH when the footage satisfies everything its record asks for,
 * MEDIUM when one secondary requirement is missing but its primary capability
 * still holds, and LOW when something it names is absent. The WHY panel lists
 * the conditions that produced the answer, so no rating is unexplained.
 *
 * There is no scoring table anywhere in this file: change a module's
 * capabilities in the product data and its rating here changes with it.
 */

const POSE = "cap-pose";
const GAIT = "cap-gait";
const TRAJECTORY = "cap-trajectory";
const TEMPORAL = "cap-temporal";

const STRIDE_SIGNALS = [
  "sig-cadence",
  "sig-step-symmetry",
  "sig-stride-variability",
  "sig-walking-speed",
];
const PATH_SIGNALS = ["sig-trajectory", "sig-crowd-flow"];
const TREND_SIGNALS = ["sig-mobility-decline", "sig-rehab-progress", "sig-fall-risk"];

type Scene = {
  source: "video" | "cctv";
  people: "one" | "several";
  limbs: boolean;
  pose: boolean;
  path: boolean;
  duration: "short" | "long";
};

const DEFAULT_SCENE: Scene = {
  source: "video",
  people: "one",
  limbs: true,
  pose: true,
  path: false,
  duration: "short",
};

type Level = "high" | "medium" | "low";

const LEVEL_LABEL: Record<Level, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

type Need = {
  /** Reads as a sentence in the WHY panel. */
  label: string;
  met: boolean;
  /** A primary need failing caps the module at LOW. */
  primary: boolean;
};

function needsFor(product: AnalyticsProduct, scene: Scene): Need[] {
  const caps = product.capabilityIds;
  const sigs = product.signalIds;

  const needsPose = caps.includes(POSE);
  const needsLimbs =
    caps.includes(GAIT) || sigs.some((id) => STRIDE_SIGNALS.includes(id));
  const needsPath =
    caps.includes(TRAJECTORY) || sigs.some((id) => PATH_SIGNALS.includes(id));
  const needsDuration =
    caps.includes(TEMPORAL) || sigs.some((id) => TREND_SIGNALS.includes(id));

  const needs: Need[] = [];

  needs.push({
    label: `Works from ${scene.source === "cctv" ? "a fixed camera feed" : "a walking video"}`,
    met: product.sources.includes(scene.source),
    primary: true,
  });

  if (needsLimbs) {
    needs.push({
      label: "Lower limbs visible — it measures the stride itself",
      met: scene.limbs,
      primary: true,
    });
    needs.push({
      label: "One person at a time in frame",
      met: scene.people === "one",
      primary: false,
    });
  }

  if (needsPath) {
    needs.push({
      label: "Trajectory trackable across the scene",
      met: scene.path,
      primary: true,
    });
    if (sigs.includes("sig-crowd-flow")) {
      needs.push({
        label: "Several people moving in the space",
        met: scene.people === "several",
        primary: true,
      });
    }
  }

  if (needsPose) {
    needs.push({
      label: "Pose landmarks recoverable from the frames",
      met: scene.pose,
      primary: !needsPath,
    });
  }

  if (needsDuration) {
    needs.push({
      label: "Enough movement to read a change over time",
      met: scene.duration === "long",
      primary: false,
    });
  }

  return needs;
}

function levelFor(needs: Need[]): Level {
  if (needs.length === 0) return "medium";
  const unmet = needs.filter((need) => !need.met);
  if (unmet.length === 0) return "high";
  if (unmet.some((need) => need.primary)) return "low";
  return "medium";
}

const ORDER: Record<Level, number> = { high: 0, medium: 1, low: 2 };

export function FootageMatch() {
  const [scene, setScene] = useState<Scene>(DEFAULT_SCENE);
  const set = <K extends keyof Scene>(key: K, value: Scene[K]) =>
    setScene((current) => ({ ...current, [key]: value }));

  const rated = useMemo(
    () =>
      analyticsProducts
        .map((product) => {
          const needs = needsFor(product, scene);
          return { product, needs, level: levelFor(needs) };
        })
        .sort(
          (a, b) =>
            ORDER[a.level] - ORDER[b.level] ||
            a.product.short.localeCompare(b.product.short),
        ),
    [scene],
  );

  const byFamily = useMemo(
    () => ({
      mobilitycare: rated.filter((r) => r.product.family === "mobilitycare"),
      securevision: rated.filter((r) => r.product.family === "securevision"),
    }),
    [rated],
  );

  /** The conditions themselves, for the WHY panel. */
  const conditions = [
    {
      label: scene.people === "one" ? "Single person detected" : "Multiple people in the scene",
      on: true,
    },
    { label: "Lower limbs visible", on: scene.limbs },
    { label: "Pose tracking possible", on: scene.pose },
    { label: "Trajectory tracking possible", on: scene.path },
    {
      label: scene.source === "cctv" ? "Fixed camera / CCTV scene" : "Walking video from a standard camera",
      on: true,
    },
    { label: "Movement duration sufficient for a trend", on: scene.duration === "long" },
  ];

  const highCount = rated.filter((r) => r.level === "high").length;

  return (
    <div className={styles.match}>
      {/* ── The scene, as the reader describes it ── */}
      <div className={styles.controls}>
        <Segment
          label="Capture"
          value={scene.source}
          options={[
            { id: "video", label: "Walking video" },
            { id: "cctv", label: "CCTV / fixed camera" },
          ]}
          onChange={(v) => set("source", v as Scene["source"])}
        />
        <Segment
          label="People in frame"
          value={scene.people}
          options={[
            { id: "one", label: "One person" },
            { id: "several", label: "Several" },
          ]}
          onChange={(v) => set("people", v as Scene["people"])}
        />
        <Segment
          label="Movement length"
          value={scene.duration}
          options={[
            { id: "short", label: "A few steps" },
            { id: "long", label: "Repeated over time" },
          ]}
          onChange={(v) => set("duration", v as Scene["duration"])}
        />
        <div className={styles.toggles}>
          <Toggle
            label="Lower limbs visible"
            on={scene.limbs}
            onChange={(v) => set("limbs", v)}
          />
          <Toggle
            label="Pose tracking possible"
            on={scene.pose}
            onChange={(v) => set("pose", v)}
          />
          <Toggle
            label="Trajectory trackable"
            on={scene.path}
            onChange={(v) => set("path", v)}
          />
        </div>
      </div>

      <p className={styles.reading} aria-live="polite">
        Movement understanding → {highCount} of {rated.length} modules match this
        footage closely
      </p>

      {/* ── The two families, rated ── */}
      <div className={styles.families}>
        {(["mobilitycare", "securevision"] as const).map((family) => (
          <section
            key={family}
            className={`${styles.family} ${
              family === "securevision" ? styles.famSecure : styles.famCare
            }`}
          >
            <h3 className={styles.familyName}>{FAMILY_LABEL[family]}</h3>
            <ul className={styles.rows}>
              {byFamily[family].map(({ product, level }) => (
                <li key={product.id} className={styles.row}>
                  <Link href={product.href} className={styles.rowName}>
                    {product.short}
                  </Link>
                  <span
                    className={`${styles.level} ${
                      level === "high"
                        ? styles.lvHigh
                        : level === "medium"
                          ? styles.lvMed
                          : styles.lvLow
                    }`}
                  >
                    {LEVEL_LABEL[level]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* ── Why ── */}
      <div className={styles.why}>
        <h3 className={styles.whyTitle}>Why?</h3>
        <ul className={styles.whyList}>
          {conditions.map((condition) => (
            <li
              key={condition.label}
              className={`${styles.whyItem} ${condition.on ? "" : styles.whyOff}`}
            >
              <span aria-hidden="true" className={styles.whyDot} />
              {condition.label}
              {!condition.on && <span className={styles.whyNo}> — no</span>}
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          Nothing is uploaded and nothing is analysed here. Each rating is a
          match between what you describe and what a module&apos;s own record
          says it needs — a module rates High when your footage satisfies
          everything it asks for, and Low when something it names is missing.
        </p>
      </div>
    </div>
  );
}

function Segment({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  return (
    <div className={styles.control}>
      <span className={styles.controlLabel}>{label}</span>
      <div className={styles.segment} role="group" aria-label={label}>
        {options.map((option) => {
          const on = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(option.id)}
              className={`${styles.segOption} ${on ? styles.segOn : ""}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={`${styles.toggle} ${on ? styles.toggleOn : ""}`}
    >
      <span aria-hidden="true" className={styles.toggleDot} />
      {label}
    </button>
  );
}

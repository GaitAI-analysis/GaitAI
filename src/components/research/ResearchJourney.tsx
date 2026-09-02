"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import styles from "./observatory.module.css";

/**
 * The research journey, drawn on a stride path.
 *
 * The track is not a straight rule: it is the same three-harmonic stride
 * function the hero's signal uses, so the timeline literally runs along a gait
 * trace. The bright overlay draws itself from left to right as the section
 * passes through the viewport — one progressive reveal, no per-card animation.
 *
 * The four milestones are the copy the previous rail carried, unchanged. The
 * published-record milestone is the one marked in champagne, because it is the
 * one that includes the granted patent.
 *
 * Below `md` the milestones stack and the drawn path is dropped: a vertical
 * list of four dated entries reads better on a phone than a squeezed track.
 */

type Milestone = {
  year: string;
  label: string;
  detail: string;
  /** The one milestone that includes the granted patent. */
  gold?: boolean;
};

const milestones: Milestone[] = [
  {
    year: "2014",
    label: "Movement research",
    detail:
      "Founder-led research begins on human gait analysis for Parkinson's disease and the early prediction of movement-related disorders.",
  },
  {
    year: "2016",
    label: "Biometrics",
    detail:
      "The work expands into gait recognition for surveillance and security — gait as a non-contact biometric that works at a distance.",
  },
  {
    year: "2022–24",
    label: "Published record",
    detail:
      "Eight peer-reviewed papers with Springer, Elsevier and Wiley · IET, plus granted Indian patent 402202 covering the edge-analytics pipeline.",
    gold: true,
  },
  {
    year: "Today",
    label: "GaitAI platform",
    detail:
      "Two verticals and 23 modular products on one Movement Intelligence Platform, built on that research foundation.",
  },
];

const W = 1000;
const H = 132;
const FROM = 60;
const TO = 940;

/** The track: a damped stride curve rather than a straight rule. */
function trackY(x: number) {
  const t = (x - FROM) / 300;
  const phase = t - Math.floor(t);
  const damp = phase < 0.5 ? 1 : 0.7;
  const v =
    Math.sin(t * Math.PI * 2) * 0.62 + Math.sin(t * Math.PI * 4 + 0.5) * 0.24;
  return 76 - v * 26 * damp;
}

const trackPath = (() => {
  let d = `M${FROM} ${Math.round(trackY(FROM) * 10) / 10}`;
  for (let x = FROM + 10; x <= TO; x += 10) {
    d += `L${x} ${Math.round(trackY(x) * 10) / 10}`;
  }
  return d;
})();

const NODE_X = [FROM + 40, 340, 640, TO - 30];

export function ResearchJourney() {
  const reduce = Boolean(useReducedMotion());
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.4"],
  });
  const drawn = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className={styles.journeyStage}>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${W} ${H}`}
        className={`${styles.journeyTrack} hidden md:block`}
      >
        <path className={styles.jPath} d={trackPath} />
        <motion.path
          className={styles.jProgress}
          d={trackPath}
          pathLength={1}
          style={reduce ? { pathLength: 1 } : { pathLength: drawn }}
        />

        {NODE_X.map((x, i) => {
          const y = trackY(x);
          const gold = Boolean(milestones[i].gold);
          return (
            <g key={milestones[i].year}>
              <line
                className={styles.jPath}
                x1={x}
                y1={y + 10}
                x2={x}
                y2={H - 8}
                strokeDasharray="2 5"
              />
              <circle
                className={`${styles.jNode}${gold ? ` ${styles.jNodeGold}` : ""}`}
                cx={x}
                cy={y}
                r={7}
              />
              <circle
                className={gold ? styles.jNodeDotGold : styles.jNodeDot}
                cx={x}
                cy={y}
                r={2.6}
              />
            </g>
          );
        })}
      </svg>

      <ol className={styles.journeyList}>
        {milestones.map((milestone) => (
          <li key={milestone.year} className={styles.jItem}>
            <span className={styles.jYear}>{milestone.year}</span>
            <h3 className={styles.jTitle}>{milestone.label}</h3>
            <p className={styles.jDetail}>{milestone.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

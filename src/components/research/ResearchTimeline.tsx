"use client";

import { useState } from "react";
import styles from "./evidence.module.css";

/**
 * The research journey, as a rail rather than four prose cards.
 *
 * Horizontal from md up, vertical below it. Each point is a button: hover or
 * focus reveals its two-or-three-line description, and the descriptions are
 * always present in the DOM (not conditionally rendered) so the layout does
 * not jump and a screen reader reaches every one of them.
 *
 * The content is the same four milestones the prose timeline carried, cut to
 * the length a rail can hold. Nothing factual was added: the 2014 and 2016
 * dates, the published span and the platform description all come from the
 * existing journey copy.
 */
const milestones = [
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
  },
  {
    year: "Today",
    label: "GaitAI platform",
    detail:
      "Two verticals and 23 modular products on one Movement Intelligence Platform, built on that research foundation.",
  },
] as const;

export function ResearchTimeline() {
  const [active, setActive] = useState(0);

  return (
    <section id="journey" className="section bg-obsidian-300/25">
      <div className="container-wide">
        <span className="eyebrow">
          <span className="h-1 w-6 rounded-full bg-gradient-brand" />
          Research journey
        </span>
        <h2 className="mt-5 max-w-2xl font-display text-[1.75rem] leading-[1.15] tracking-[-0.02em] text-balance text-soft-white sm:text-[2.125rem]">
          A decade of founder-led work,{" "}
          <span className="text-gradient">in four steps.</span>
        </h2>

        <div className={`${styles.tlRail} mt-12 grid gap-8 md:grid-cols-4 md:gap-6`}>
          {milestones.map((milestone, i) => (
            <button
              key={milestone.year}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              className={`${styles.tlPoint} ${
                active === i ? styles.tlPointOn : ""
              } rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-4 focus-visible:ring-offset-obsidian-300`}
            >
              <span aria-hidden="true" className={styles.tlDot} />
              <span className="block font-mono text-[12px] uppercase tracking-[0.16em] text-cyan-300/80">
                {milestone.year}
              </span>
              <span className="mt-2 block font-display text-[1.0625rem] leading-snug text-soft-white">
                {milestone.label}
              </span>
              <span
                className={`mt-2.5 block max-w-prose text-[12.5px] leading-relaxed transition-colors duration-300 ${
                  active === i ? "text-soft-gray" : "text-soft-mute/70"
                }`}
              >
                {milestone.detail}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

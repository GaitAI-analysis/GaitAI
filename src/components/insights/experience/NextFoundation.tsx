"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CoverConcept } from "@/data/insights";
import { trackInsightEvent } from "@/lib/insight-events";
import styles from "./experience.module.css";
import journal from "../journal.module.css";

/**
 * THE FOUNDATIONS BRIDGE — the end of one essay handing over to the next.
 *
 *   You now know how a walking video becomes movement intelligence.
 *   ────────── a Motion DNA line travels across ──────────
 *   NEXT · What else can one walk reveal?
 *   [ 02 · Your Walk Is More Than a Biometric → ]
 *
 * The line between the two sentences is drawn from the current essay's
 * concept INTO the next one's — a pipeline signal that branches, branches
 * that reduce to a trace, a trace that becomes a trend, a trend that meets
 * other streams — so the five transitions are five different drawings and
 * the reading path feels like one documentary. It draws itself once when it
 * scrolls into view; under reduced motion it is simply complete.
 */
export function NextFoundation({
  articleSlug,
  step,
  total,
  learned,
  nextQuestion,
  from,
  to,
  next,
}: {
  articleSlug: string;
  step: number;
  total: number;
  learned: string;
  nextQuestion: string;
  from: CoverConcept;
  to: CoverConcept | "start";
  next: { href: string; title: string; seriesTitle: string; step: number } | null;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) {
      setOn(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setOn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section aria-label="Next in GaitAI Foundations" className={`${styles.root} ${styles.bridge}`}>
      <p className={journal.seriesTag}>
        GaitAI Foundations · {step} of {total}
        <span aria-hidden="true" className={journal.seriesDots}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`${journal.seriesDot} ${i < step ? journal.seriesDotOn : ""}`} />
          ))}
        </span>
      </p>
      <p className={`${styles.bridgeLearned} mt-5`}>{learned}</p>

      <svg ref={ref} viewBox="0 0 640 72" className={styles.bridgeVisual} data-on={on ? "true" : "false"} aria-hidden="true">
        <BridgeTrace from={from} to={to} />
      </svg>

      <p className={styles.bridgeNext}>{next ? "Next" : "The path completes"}</p>
      <p className={styles.bridgeQuestion}>{nextQuestion}</p>

      {next ? (
        <Link
          href={next.href}
          className={styles.bridgeLink}
          onClick={() =>
            trackInsightEvent("foundation_next_story_clicked", { from: articleSlug, to: next.href })
          }
        >
          <span>
            <span className={styles.bridgeStep}>Foundations {String(next.step).padStart(2, "0")}</span>
            <span className={styles.bridgeTitle}>{next.title}</span>
            <span className={styles.bridgeSub}>{next.seriesTitle}</span>
          </span>
          <span className={styles.bridgeCta}>
            Continue <span aria-hidden="true">→</span>
          </span>
        </Link>
      ) : (
        <Link
          href="/insights/start-here"
          className={styles.bridgeLink}
          onClick={() => trackInsightEvent("foundation_next_story_clicked", { from: articleSlug, to: "start-here" })}
        >
          <span>
            <span className={styles.bridgeStep}>GaitAI Foundations</span>
            <span className={styles.bridgeTitle}>Walk the whole path again</span>
            <span className={styles.bridgeSub}>Five stories, from a walking video to an audited claim</span>
          </span>
          <span className={styles.bridgeCta}>
            Start here <span aria-hidden="true">→</span>
          </span>
        </Link>
      )}
    </section>
  );
}

/** The line from one concept into the next, in the journal's signal language. */
function BridgeTrace({ from, to }: { from: CoverConcept; to: CoverConcept | "start" }) {
  const cyan = "var(--ix-cyan)";
  const violet = "var(--ix-violet)";
  const teal = "var(--ix-teal)";
  const gold = "var(--ix-gold)";
  const mute = "var(--ix-line-mid)";

  /* Left half: where we have been. Right half: where we are going. */
  const left = (() => {
    switch (from) {
      case "pipeline":
        return <path className={styles.bridgePath} pathLength={1} stroke={cyan} d="M0 36 C30 36 34 14 50 14 S74 58 90 58 S114 14 130 14 S154 58 170 58 S194 14 210 14 S234 58 250 58 S290 36 320 36" />;
      case "divergence":
        return (
          <>
            <path className={styles.bridgePath} pathLength={1} stroke={mute} d="M0 12 C120 12 200 36 320 36" />
            <path className={styles.bridgePath} pathLength={1} stroke={mute} d="M0 60 C120 60 200 36 320 36" />
            <path className={styles.bridgePath} pathLength={1} stroke={cyan} d="M0 36 H320" />
          </>
        );
      case "reduction":
        return (
          <>
            <path className={styles.bridgePath} pathLength={1} stroke={violet} d="M0 36 C60 20 100 52 160 36 S260 20 320 36" />
            {[40, 100, 160, 220, 280].map((x, i) => (
              <circle key={x} className={styles.bridgeNode} cx={x} cy={36 + (i % 2 ? 8 : -8)} r={1.8} fill={violet} />
            ))}
          </>
        );
      case "trajectory":
        return (
          <>
            <path className={styles.bridgePath} pathLength={1} stroke={teal} d="M0 30 L64 28 L128 34 L192 31 L256 40 L320 36" />
            {[0, 64, 128, 192, 256].map((x, i) => (
              <circle key={x} className={styles.bridgeNode} cx={x} cy={[30, 28, 34, 31, 40][i]} r={2.4} fill={teal} />
            ))}
          </>
        );
      case "fusion":
        return (
          <>
            <path className={styles.bridgePath} pathLength={1} stroke={mute} d="M0 10 C120 10 200 36 320 36" />
            <path className={styles.bridgePath} pathLength={1} stroke={gold} d="M0 36 H320" strokeDasharray="4 4" />
            <path className={styles.bridgePath} pathLength={1} stroke={mute} d="M0 62 C120 62 200 36 320 36" />
          </>
        );
    }
  })();

  const right = (() => {
    switch (to) {
      case "divergence":
        return (
          <>
            {[8, 22, 36, 50, 64].map((y, i) => (
              <path
                key={y}
                className={`${styles.bridgePath} ${styles.bridgePathDelayed}`}
                pathLength={1}
                stroke={i === 2 ? cyan : mute}
                d={`M320 36 C420 36 480 ${y} 640 ${y}`}
              />
            ))}
          </>
        );
      case "reduction":
        return (
          <>
            <path className={`${styles.bridgePath} ${styles.bridgePathDelayed}`} pathLength={1} stroke={violet} d="M320 36 C380 20 420 52 480 36" />
            {[500, 540, 580, 620].map((x, i) => (
              <circle key={x} className={styles.bridgeNode} cx={x} cy={36 + (i % 2 ? 6 : -6)} r={1.8} fill={violet} />
            ))}
          </>
        );
      case "trajectory":
        return (
          <>
            <path className={`${styles.bridgePath} ${styles.bridgePathDelayed}`} pathLength={1} stroke={teal} d="M320 36 L400 34 L480 40 L560 38 L640 48" />
            {[400, 480, 560, 640].map((x, i) => (
              <circle key={x} className={styles.bridgeNode} cx={x} cy={[34, 40, 38, 48][i]} r={2.4} fill={teal} />
            ))}
          </>
        );
      case "fusion":
        return (
          <>
            <path className={`${styles.bridgePath} ${styles.bridgePathDelayed}`} pathLength={1} stroke={mute} d="M640 10 C520 10 440 36 320 36" />
            <path className={`${styles.bridgePath} ${styles.bridgePathDelayed}`} pathLength={1} stroke={gold} d="M320 36 H640" />
            <path className={`${styles.bridgePath} ${styles.bridgePathDelayed}`} pathLength={1} stroke={mute} d="M640 62 C520 62 440 36 320 36" />
          </>
        );
      case "pipeline":
      case "start":
        return (
          <>
            <path className={`${styles.bridgePath} ${styles.bridgePathDelayed}`} pathLength={1} stroke={cyan} d="M320 36 C360 36 364 14 380 14 S404 58 420 58 S444 14 460 14 S484 58 500 58 S524 14 540 14 S564 58 580 58 S620 36 640 36" />
          </>
        );
    }
  })();

  return (
    <>
      <line x1="0" y1="36" x2="640" y2="36" stroke={mute} strokeWidth="1" strokeDasharray="1 5" opacity="0.5" />
      {left}
      {right}
      <circle className={styles.bridgeNode} cx="320" cy="36" r="3.2" fill="var(--ix-ink)" stroke={cyan} strokeWidth="1.5" />
    </>
  );
}

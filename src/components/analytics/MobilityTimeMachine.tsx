"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  TIME_MACHINE_BOUNDARY,
  deltaFromPrevious,
  mobilityTrajectory,
  movementPhrase,
  timeMachineModules,
  timeMachineSessions,
  timeMachineSignals,
} from "@/data/time-machine";
import { IllustrativeBadge } from "@/components/ui/IllustrativeBadge";
import { AnalyticsPipeline } from "./AnalyticsPipeline";
import { MiniTrendChart, SignalMetric } from "./graphics";
import styles from "./analytics.module.css";

/**
 * MOBILITY TIME MACHINE — scrub five illustrative sessions.
 *
 * Every other movement surface on the site shows ONE capture. The thing
 * MobilityCare is actually built around is the comparison between captures,
 * and a reader has had to take that on trust. This is the smallest instrument
 * that shows it: five stops, three signals, and the change stated in words.
 *
 * IT REUSES THE EXISTING RAIL. The stops are `AnalyticsPipeline` — the same
 * component the two labs and the home teaser use — so the arrow-key
 * behaviour, the "passed" styling and the tablist semantics are the ones a
 * reader has already learned, and this file adds no navigation of its own.
 * The readings are `SignalMetric` and the traces are `MiniTrendChart`, which
 * marks its LAST point: passing the series truncated at the current stop puts
 * the dot exactly where the scrubber is, so scrubbing needed no new chart
 * code at all.
 *
 * WHAT IT REFUSES TO DO. No composite score, because one number climbing over
 * five sessions is indistinguishable from a clinical instrument and GaitAI
 * publishes none — the trajectory is a COUNT of how many signals moved, with
 * the count on screen. No verdict, no recommendation, no "recovery: on track".
 * And the example itself is not a clean line: symmetry stalls at session 04
 * while cadence keeps climbing, which is the actual lesson of longitudinal
 * capture and the reason the signals are read apart rather than averaged.
 *
 * Visually it is one rail, three readings, two lines of text. The restraint is
 * deliberate: this sits inside a family page, not as a dashboard of its own.
 */
export function MobilityTimeMachine() {
  const [index, setIndex] = useState(0);
  const session = timeMachineSessions[index];
  const trajectory = useMemo(() => mobilityTrajectory(index), [index]);

  /* The rail's stops. `note` carries the interval, which is the only place
     time appears — in weeks from baseline, never as a date. */
  const stages = useMemo(
    () =>
      timeMachineSessions.map((entry) => ({
        id: entry.id,
        name: entry.label,
        note: entry.week === 0 ? "Week 0" : `Week ${entry.week}`,
      })),
    [],
  );

  return (
    <div className={styles.lab}>
      {/* ── THE SCRUBBER ── */}
      <AnalyticsPipeline
        stages={stages}
        activeId={session.id}
        onSelect={(id) => {
          const next = timeMachineSessions.findIndex(
            (entry) => entry.id === id,
          );
          if (next >= 0) setIndex(next);
        }}
        label="Session, oldest first"
      />

      {/* ── THE READINGS ── */}
      <div className={`${styles.panel} mt-6`}>
        <div className={styles.panelHead}>
          <span className={styles.label}>
            {session.label} · week {session.week}
          </span>
          <IllustrativeBadge label="Example values" className="ml-auto" />
        </div>

        <div className={styles.panelBody}>
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
            {timeMachineSignals.map((signal) => {
              const phrase = movementPhrase(session, signal);
              const sincePrevious = deltaFromPrevious(index, signal);
              /* Truncated at the current stop, so MiniTrendChart's terminal
                 dot IS the scrubber position. Below two points there is no
                 trace to draw, which is exactly the state at baseline. */
              const series = timeMachineSessions
                .slice(0, index + 1)
                .map((entry) => entry.values[signal.id]);

              return (
                <SignalMetric
                  key={signal.id}
                  label={signal.label}
                  value={String(session.values[signal.id])}
                  unit={signal.unit === "%" ? "%" : ` ${signal.unit}`}
                  note={
                    index === 0
                      ? signal.hint
                      : `${phrase.text}${
                          sincePrevious === 0
                            ? ", and unchanged since the last session"
                            : ""
                        }.`
                  }
                >
                  {series.length > 1 && (
                    <MiniTrendChart
                      series={series}
                      baseline
                      tone={phrase.movement === "away" ? "amber" : "accent"}
                      summary={`${signal.label}: ${series.join(", ")} ${
                        signal.unit
                      }, baseline first. ${phrase.text}.`}
                    />
                  )}
                </SignalMetric>
              );
            })}
          </div>

          <div className={styles.panelRule} />

          {/* ── TRAJECTORY, IN WORDS ──
              Deliberately not a number. The count is shown so a reader can
              see precisely what the phrase is made of. */}
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-[minmax(0,15rem)_1fr]">
            <div>
              <span className={styles.label}>Mobility trajectory</span>
              <p className="mt-2 text-[15px] font-medium leading-snug text-soft-white">
                {trajectory.headline}
              </p>
              <p className={`${styles.note} mt-1.5`}>{trajectory.detail}</p>
            </div>

            {/* The session's own note — what a reader should take from this
                stop, in trend language, with no verdict about the person. */}
            <p className={`${styles.note} !text-[13.5px] leading-relaxed`}>
              {session.note}
            </p>
          </div>
        </div>
      </div>

      {/* ── WHAT ACTUALLY DOES THIS ──
          The instrument is a demonstration; these four modules are the real
          things, and each line is that module's own documented role in a
          repeated-capture workflow. A compact list, not four cards: the page
          this sits on already has cards. */}
      <div className="mt-8">
        <span className={styles.label}>What runs this in practice</span>
        <ul className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {timeMachineModules.map(({ product, role }) => (
            <li key={product.id} className="min-w-0">
              <Link
                href={`/${product.vertical}/${product.id}/`}
                className="text-[14px] font-medium text-cyan-300 underline decoration-cyan-300/30 underline-offset-4 transition-colors hover:text-cyan-200"
              >
                {product.short}
              </Link>
              <p className={`${styles.note} mt-1`}>{role}</p>
            </li>
          ))}
        </ul>
      </div>

      <p className={`${styles.note} mt-8 max-w-3xl`}>
        {TIME_MACHINE_BOUNDARY}
      </p>
    </div>
  );
}

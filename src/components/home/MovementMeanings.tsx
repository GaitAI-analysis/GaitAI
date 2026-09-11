"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  MotionDNAThread,
  READINGS,
  type ReadingId,
} from "./MotionDNAThread";
import styles from "./meanings.module.css";

/**
 * ONE MOVEMENT. MANY MEANINGS.
 * =============================================================================
 * The home page's first section, and the one job it has is to make the
 * platform concept land in a single screen: the same movement signal, read
 * five different ways, and the purpose is what decides which.
 *
 * WHAT IT REPLACED. A five-step scroll narrative — "a person moves" through
 * "intelligence supports action" — with a sticky drawing beside it. The
 * content was good and it was in the wrong place twice over: it told the
 * pipeline story, which is what the Technology section and /movement-lab are
 * for, and it told it by making the visitor scroll about 940px to reach the
 * end of a list. What the top of the page needs is not the pipeline. It is the
 * reason anybody should care about the pipeline.
 *
 * THE INTERACTION IS A STORY STRIP, AND DELIBERATELY NOT A CAROUSEL
 *
 * `MotionDNAThread` is the control and the drawing: one signal into a hub,
 * five branches out of it, and whichever branch is live is traced from the hub
 * outward. This section adds the readout — what that reading actually
 * measures, which family owns it, where to go next.
 *
 *   AUTO-ADVANCES   slowly (3.2s a state), only while the section is on
 *                   screen, and only as an invitation — it is how a visitor
 *                   who never points at anything still learns there are five.
 *   HOVER / FOCUS   pauses it and previews that reading.
 *   CLICK / TAP     locks it. The cycle stays paused until it is released.
 *   SWIPE           moves one reading and locks it, for a phone.
 *   REDUCED MOTION  never advances at all: the first reading is shown at rest
 *                   and every control still works.
 *
 * So it cannot run away from somebody who is reading it, and it cannot sit
 * still in front of somebody who does not know it moves.
 *
 * WHY THE READOUT IS A LIVE REGION. The cycle changes the detail panel without
 * anybody asking it to. `aria-live="polite"` announces that to a screen-reader
 * user rather than silently swapping the text under them — and because the
 * cycle is paused by focus, a keyboard user only ever hears their own changes.
 */
export function MovementMeanings() {
  const [shown, setShown] = useState<ReadingId>(READINGS[0].id);
  /* Identity-stable so the thread's effect does not re-fire every render. */
  const onShownChange = useCallback((id: ReadingId) => setShown(id), []);
  const reading = READINGS.find((entry) => entry.id === shown) ?? READINGS[0];
  const index = READINGS.findIndex((entry) => entry.id === reading.id);

  return (
    <div className={styles.meanings}>
      <div className={styles.head}>
        <p className={styles.eyebrow}>One movement. Many meanings.</p>
        <h2 id="movement-meanings-title" className={styles.title}>
          The same walk answers a{" "}
          <span className="text-gradient">different question</span> each time.
        </h2>
        <p className={styles.lead}>
          Movement carries more than one reading. Which one you get depends on
          what is being asked — and that choice, not the signal, is what
          separates a clinical report from a safety alert.
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.thread}>
          <MotionDNAThread onShownChange={onShownChange} />
        </div>

        {/* The readout. Keyed on the reading so it fades in on every change —
            without that, the text swaps in one frame and the change is easy
            to miss entirely, which is the same reason the capture-chain panel
            in the Technology section is keyed on its input. */}
        <aside className={styles.readout} aria-live="polite">
          <div key={reading.id} className={styles.readoutBody}>
            <p className={styles.meaning}>{reading.label}</p>
            <p className={styles.note}>{reading.note}</p>
            <div className={styles.rule} />
            <dl className={styles.detail}>
              <dt>What is read</dt>
              <dd>{reading.reads}</dd>
              <dt>Where it lives</dt>
              <dd>
                <Link href={reading.href} className={styles.familyLink}>
                  {reading.family}
                  <span aria-hidden="true"> →</span>
                </Link>
              </dd>
            </dl>
          </div>
          {/* Position, not a control: the five readings are already five
              buttons a few pixels away, and a second row of dots that did the
              same thing would be the carousel this section is not. */}
          <p className={styles.position}>
            <span className={styles.count}>
              {String(index + 1).padStart(2, "0")} / {String(READINGS.length).padStart(2, "0")}
            </span>
            <span aria-hidden="true" className={styles.pips}>
              {READINGS.map((entry) => (
                <span
                  key={entry.id}
                  className={styles.pip}
                  data-on={entry.id === reading.id}
                />
              ))}
            </span>
          </p>
        </aside>
      </div>
    </div>
  );
}

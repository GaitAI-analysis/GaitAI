"use client";

import { useState } from "react";
import styles from "./thread.module.css";

/**
 * MOTION DNA — the hero's one interactive thread.
 *
 *   one movement signal → four readings
 *
 * The claim the whole platform rests on, made touchable in about 90px of
 * vertical space: the same walk supports different interpretations depending
 * on what it is being read for. Point at a reading (or tab to it) and its
 * branch lights while the others recede — so the visitor discovers that the
 * signal is shared and the *purpose* is what differs, without a caption
 * saying so.
 *
 * WHY IT IS THIS SMALL. The hero already carries the message, three actions
 * and a 3D scene. A second large visual would compete with all of them, and
 * the brief is explicit that the hero must stay clear. This is a strip under
 * the tagline, not a panel.
 *
 * NO CLAIMS. The four words are reading *purposes* — what someone might look
 * for — not outputs, capabilities or results. Nothing here says GaitAI
 * detects a condition, identifies a person or predicts an event, and no
 * number appears at all.
 *
 * MOTION. Idle state is completely still: the branches simply exist at
 * different weights. Only a pointer or focus changes anything, and each
 * change is one 400ms opacity/stroke transition. Under
 * prefers-reduced-motion the transition is dropped and the highlight is
 * instant — the interaction still works, because it is state, not animation.
 */

const READINGS = [
  { id: "identity", label: "Identity", note: "who is walking — governed use only" },
  { id: "mobility", label: "Mobility", note: "how well someone moves" },
  { id: "recovery", label: "Recovery", note: "how that changes over time" },
  { id: "safety", label: "Safety", note: "what is happening in a space" },
] as const;

const W = 760;
const H = 96;
/** Where the shared signal ends and the branches begin. */
const SPLIT = 300;

export function MotionDNAThread() {
  const [active, setActive] = useState<string | null>(null);

  /* The shared signal: one gait-like trace, drawn once. */
  const signal = Array.from({ length: 70 }, (_, i) => {
    const t = i / 69;
    const x = 16 + t * (SPLIT - 16);
    const y =
      H / 2 -
      Math.sin(t * Math.PI * 4) * 15 * (0.45 + t * 0.55) -
      Math.sin(t * Math.PI * 9 + 0.6) * 4;
    return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-hidden="true">
        {/* the one signal */}
        <path className={styles.signal} d={signal} />
        <circle className={styles.hub} cx={SPLIT} cy={H / 2} r={3.4} />

        {/* four branches out of it */}
        {READINGS.map((reading, i) => {
          const y = 16 + i * 21.5;
          const on = active === reading.id;
          return (
            <path
              key={reading.id}
              className={`${styles.branch} ${on ? styles.branchOn : ""} ${
                active && !on ? styles.branchOff : ""
              }`}
              d={`M ${SPLIT} ${H / 2} C ${SPLIT + 90} ${H / 2} ${
                W - 150
              } ${y} ${W - 60} ${y}`}
            />
          );
        })}
      </svg>

      {/* The labels are the control. Buttons, so a keyboard reaches them and
          a touch device can tap them; the SVG above is decorative. */}
      <ul className={styles.readings}>
        {READINGS.map((reading) => {
          const on = active === reading.id;
          return (
            <li key={reading.id}>
              <button
                type="button"
                onPointerEnter={() => setActive(reading.id)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(reading.id)}
                onBlur={() => setActive(null)}
                onClick={() => setActive(on ? null : reading.id)}
                aria-pressed={on}
                className={`${styles.reading} ${on ? styles.readingOn : ""}`}
              >
                <span className={styles.dot} aria-hidden="true" />
                {reading.label}
                <span className={styles.note}>{reading.note}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className={styles.caption}>
        One movement signal. Four ways to read it — the purpose decides which.
      </p>
    </div>
  );
}

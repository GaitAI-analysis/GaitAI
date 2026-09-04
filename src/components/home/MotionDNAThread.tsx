"use client";

import { useCallback, useRef, useState } from "react";
import { useAutoDemonstrate } from "@/lib/useAutoDemonstrate";
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
 * ─────────────────────────────────────────────────────────────────────────────
 * PREVIEW AND LOCK — the part that was missing
 *
 * The four readings were always the control, but nothing said so: they moved
 * the branches on hover and again on click, both to the same state, so a
 * visitor who pointed at one and moved away saw a flicker and learned
 * nothing. There are now two distinct states and they mean different things:
 *
 *   HOVER / FOCUS → preview. Trace the signal into that branch, and let go
 *                   of it again when the pointer leaves.
 *   CLICK / ENTER → lock. The branch stays, the label keeps a filled marker,
 *                   a hairline underline and a 4% ground, and the preview of
 *                   any other reading is layered on top of it temporarily.
 *
 * `shown = preview ?? locked` is the whole rule, and it makes the difference
 * legible: leaving a hover returns to whatever is locked rather than to
 * nothing, which is what teaches a visitor that the click did something the
 * hover did not.
 *
 * A one-shot trace runs from the hub out along the shown branch whenever the
 * shown branch changes, so switching readings reads as the signal travelling
 * somewhere new rather than as two opacities swapping. It is one 620ms draw,
 * it never loops, and it is off under prefers-reduced-motion — the highlight
 * alone still carries the state, because the state is state, not animation.
 *
 * KEYBOARD. A labelled group of four toggles: Tab reaches the group, arrows
 * (and Home/End) move within it, Enter/Space locks, Escape releases. Focus
 * previews without committing, which is the same bargain the pointer gets.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE BRANCHES ARE CONTROLS TOO
 *
 * The four lines out of the hub now preview and lock the same state the rows
 * do, so the drawing and the labels are one interaction rather than a picture
 * with a legend under it. Each branch gets a second, transparent copy of its
 * own path at an 18px stroke (28px on touch), pinned with
 * `non-scaling-stroke` so the target is 18 CSS px at 390px as well as at
 * 1920px — nobody is asked to hit a 1px curve.
 *
 * The hit paths carry no semantics: the SVG stays `aria-hidden` and the four
 * buttons remain the only accessible control, because a screen-reader user
 * gains nothing from four unlabelled paths that duplicate the rows below.
 *
 * The preview on a hit path is guarded to a mouse. A touch fires
 * pointerenter → click, and if pointerleave never arrives the branch stays
 * lit with nothing under the finger to explain why; the tap still locks,
 * which is what a phone actually needs.
 */

const READINGS = [
  { id: "identity", label: "Identity", note: "who is walking — governed use only" },
  { id: "mobility", label: "Mobility", note: "how well someone moves" },
  { id: "recovery", label: "Recovery", note: "how that changes over time" },
  { id: "safety", label: "Safety", note: "what is happening in a space" },
] as const;

type ReadingId = (typeof READINGS)[number]["id"];

const W = 760;
const H = 96;
/** Where the shared signal ends and the branches begin. */
const SPLIT = 300;

/** One branch's path, so the base line and its trace overlay cannot drift. */
function branchPath(index: number) {
  const y = 16 + index * 21.5;
  return `M ${SPLIT} ${H / 2} C ${SPLIT + 90} ${H / 2} ${W - 150} ${y} ${
    W - 60
  } ${y}`;
}

export function MotionDNAThread() {
  /* Mobility is the lens the movement signal reads as by default, and it
     means the section arrives showing what it does rather than waiting to be
     discovered — which matters more now that the "select a lens" microcopy is
     gone. Every other reading is one pointer or one arrow key away. */
  /** Committed by a click. Survives the pointer leaving. */
  const [locked, setLocked] = useState<ReadingId | null>("mobility");
  /** Held by a hover or a focus. Released when it ends. */
  const [preview, setPreview] = useState<ReadingId | null>(null);

  /**
   * THE DEMONSTRATION — the third tier, and the lowest.
   *
   * Everything above already worked; nothing said it did. The strip rested on
   * Mobility and stayed there, so a visitor who never happened to point at it
   * never discovered that the same signal reads four ways — which is the one
   * claim this component exists to make.
   *
   * So on its first appearance it traces each reading in turn, twice, and then
   * stops for good. Two passes rather than one because a single sweep reads as
   * a loading animation; the second is what makes it legible as a set of
   * states being shown. It never runs again, it pauses off screen, and the
   * first hover, focus, tap or key press ends it permanently — see `release`.
   *
   * Precedence is `preview ?? demo ?? locked`, which keeps the meaning of each
   * tier intact: a hover still beats everything, a lock still survives the
   * pointer leaving, and the demonstration only ever fills the silence before
   * the visitor has done anything at all.
   */
  const demo = useAutoDemonstrate<HTMLDivElement>({
    steps: READINGS.length,
    intervalMs: 1200,
    cycles: 2,
  });
  const demoReading = demo.index === null ? null : READINGS[demo.index].id;

  const shown = preview ?? demoReading ?? locked;

  /* Any deliberate act ends the demonstration. Called from every handler
     below rather than inferred, so there is no path that leaves it running
     underneath a visitor who has taken control. */
  const release = demo.stop;

  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

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

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      release();
      const step =
        event.key === "ArrowRight" || event.key === "ArrowDown"
          ? 1
          : event.key === "ArrowLeft" || event.key === "ArrowUp"
            ? -1
            : 0;

      if (step) {
        event.preventDefault();
        const next = (index + step + READINGS.length) % READINGS.length;
        buttons.current[next]?.focus();
        return;
      }
      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        buttons.current[event.key === "Home" ? 0 : READINGS.length - 1]?.focus();
        return;
      }
      if (event.key === "Escape" && locked) {
        /* Release the lock without leaving the group — the way out of a
           committed state for someone who never touched a mouse. */
        event.preventDefault();
        setLocked(null);
      }
    },
    [locked, release],
  );

  const shownIndex = READINGS.findIndex((r) => r.id === shown);

  return (
    <div ref={demo.ref} className={styles.wrap} data-demo={demo.running}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-hidden="true">
        {/* the one signal */}
        <path className={styles.signal} d={signal} />
        <circle
          className={`${styles.hub} ${shown ? styles.hubOn : ""}`}
          cx={SPLIT}
          cy={H / 2}
          r={3.4}
        />

        {/* four branches out of it */}
        {READINGS.map((reading, i) => {
          const on = shown === reading.id;
          return (
            <path
              key={reading.id}
              className={`${styles.branch} ${on ? styles.branchOn : ""} ${
                shown && !on ? styles.branchOff : ""
              } ${locked === reading.id ? styles.branchLocked : ""}`}
              d={branchPath(i)}
            />
          );
        })}

        {/* The trace: one draw along whichever branch is shown, replayed on
            every change because the key remounts it. Purely additive — the
            branch underneath already carries the state. */}
        {shownIndex >= 0 && (
          <path
            key={shown}
            className={styles.trace}
            pathLength={1}
            d={branchPath(shownIndex)}
          />
        )}

        {/* The targets, last so they sit above everything and nothing above
            them steals the pointer. Same `d` as the visible branch, so the
            drawing's geometry is untouched and the two can never drift. */}
        {READINGS.map((reading, i) => (
          <path
            key={`hit-${reading.id}`}
            className={styles.hit}
            d={branchPath(i)}
            onPointerEnter={(event) => {
              release();
              if (event.pointerType === "mouse") setPreview(reading.id);
            }}
            onPointerLeave={() => setPreview(null)}
            onClick={() => {
              release();
              setLocked((current) =>
                current === reading.id ? null : reading.id,
              );
            }}
          />
        ))}
      </svg>

      {/* The labels are the control. Buttons, so a keyboard reaches them and
          a touch device can tap them; the SVG above is a pointer affordance
          for the same state. The whole row — marker, name and purpose — is
          one target.

          The instruction that used to sit here is gone from the page but kept
          as the group's accessible name: the branches now demonstrate what it
          said, and a screen-reader user still needs to be told what the four
          toggles are for. */}
      <ul
        className={styles.readings}
        role="group"
        aria-label="Select a lens to trace the signal"
      >
        {READINGS.map((reading, i) => {
          const isLocked = locked === reading.id;
          const isShown = shown === reading.id;
          return (
            <li key={reading.id} className={styles.readingItem}>
              <button
                ref={(node) => {
                  buttons.current[i] = node;
                }}
                type="button"
                onPointerEnter={() => {
                  release();
                  setPreview(reading.id);
                }}
                onPointerLeave={() => setPreview(null)}
                onFocus={() => {
                  release();
                  setPreview(reading.id);
                }}
                onBlur={() => setPreview(null)}
                /* A tap fires enter → click → leave, so the lock is what
                   survives on a phone. Nothing here depends on hover. */
                onClick={() => {
                  release();
                  setLocked(isLocked ? null : reading.id);
                }}
                onKeyDown={(event) => onKeyDown(event, i)}
                aria-pressed={isLocked}
                className={`${styles.reading} ${
                  isShown ? styles.readingShown : ""
                } ${isLocked ? styles.readingLocked : ""}`}
              >
                <span className={styles.dot} aria-hidden="true" />
                <span className={styles.label}>{reading.label}</span>
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

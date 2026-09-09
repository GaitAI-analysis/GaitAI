"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";

/**
 * Scrubbing through N discrete stages with a pointer, a finger or the keyboard.
 *
 * The one gesture behind the hero progression, the privacy slider, the stage
 * control and the card mini-interactions. It is written once so all of them
 * agree on the details that make a scrub feel right:
 *
 *   · press anywhere on the track and the nearest stage is chosen at once —
 *     the first tap is never "wasted" revealing UI
 *   · drag and the stage follows the pointer, snapping softly at boundaries;
 *     `fraction` is the continuous position for visuals that want to tween
 *   · release and the value settles on the nearest stage
 *   · Arrow keys step, Home/End jump, so the same element works as a slider
 *     for a keyboard reader (the caller puts role="slider" on it)
 *
 * TOUCH. The caller sets `touch-action: pan-y` on the track (see
 * experience.module.css `.scrubTrack`). A vertical drag stays a page scroll;
 * a horizontal one scrubs. Pointer capture keeps the drag alive when the
 * finger leaves the element.
 *
 * `onChange` fires only when the stage actually changes, so callers can track
 * "the reader moved this" without debouncing.
 */
export function useStageScrub({
  count,
  value,
  onChange,
  trackRef,
  disabled = false,
}: {
  count: number;
  value: number;
  onChange: (next: number, source: "pointer" | "keyboard") => void;
  trackRef: RefObject<HTMLElement>;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [fraction, setFraction] = useState(count > 1 ? value / (count - 1) : 0);
  const pointerId = useRef<number | null>(null);
  const latest = useRef(value);
  latest.current = value;

  /* Keep the continuous position in step with an externally set value when
     the reader is not mid-drag (a stage button, a share link, a story step). */
  useEffect(() => {
    if (!dragging) setFraction(count > 1 ? value / (count - 1) : 0);
  }, [value, count, dragging]);

  const fractionFromEvent = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const track = trackRef.current;
      if (!track) return 0;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return 0;
      return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    },
    [trackRef],
  );

  const commit = useCallback(
    (nextFraction: number, source: "pointer" | "keyboard") => {
      const next = Math.round(nextFraction * (count - 1));
      if (next !== latest.current) onChange(next, source);
    },
    [count, onChange],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (disabled || count < 2) return;
      /* Only the primary button / a finger. */
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const track = trackRef.current;
      if (!track) return;
      pointerId.current = event.pointerId;
      try {
        track.setPointerCapture(event.pointerId);
      } catch {
        /* Capture is a nicety; the drag still works while over the track. */
      }
      setDragging(true);
      const f = fractionFromEvent(event);
      setFraction(f);
      commit(f, "pointer");
    },
    [commit, count, disabled, fractionFromEvent, trackRef],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (pointerId.current !== event.pointerId) return;
      const f = fractionFromEvent(event);
      setFraction(f);
      commit(f, "pointer");
    },
    [commit, fractionFromEvent],
  );

  const end = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (pointerId.current !== event.pointerId) return;
      pointerId.current = null;
      setDragging(false);
      try {
        trackRef.current?.releasePointerCapture(event.pointerId);
      } catch {
        /* Already released. */
      }
      /* Settle on the chosen stage. */
      setFraction(count > 1 ? latest.current / (count - 1) : 0);
    },
    [count, trackRef],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (disabled || count < 2) return;
      let next: number | null = null;
      switch (event.key) {
        case "ArrowRight":
        case "ArrowUp":
          next = Math.min(count - 1, latest.current + 1);
          break;
        case "ArrowLeft":
        case "ArrowDown":
          next = Math.max(0, latest.current - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = count - 1;
          break;
        case "PageUp":
          next = Math.min(count - 1, latest.current + 2);
          break;
        case "PageDown":
          next = Math.max(0, latest.current - 2);
          break;
        default:
          return;
      }
      event.preventDefault();
      if (next !== null && next !== latest.current) onChange(next, "keyboard");
    },
    [count, disabled, onChange],
  );

  return {
    dragging,
    /** 0..1, continuous while dragging, snapped otherwise. */
    fraction,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: end,
      onPointerCancel: end,
      onKeyDown,
    },
  };
}

"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

/**
 * "Hold to reveal" — true while a pointer, a finger or the Space bar is held.
 *
 * Pointer: down starts, up / cancel / leave-with-capture ends. Keyboard: Space
 * or Enter held down starts (repeat events are ignored), keyup ends. A
 * `release` timeout guards the case where the up event never arrives (the
 * pointer left the window), so the hold cannot get stuck.
 */
export function useHoldGesture(options: { onStart?: () => void; onEnd?: () => void } = {}) {
  const [held, setHeld] = useState(false);
  const onStartRef = useRef(options.onStart);
  const onEndRef = useRef(options.onEnd);
  onStartRef.current = options.onStart;
  onEndRef.current = options.onEnd;
  const heldRef = useRef(false);

  const start = useCallback(() => {
    if (heldRef.current) return;
    heldRef.current = true;
    setHeld(true);
    onStartRef.current?.();
  }, []);

  const stop = useCallback(() => {
    if (!heldRef.current) return;
    heldRef.current = false;
    setHeld(false);
    onEndRef.current?.();
  }, []);

  /* A pointer that goes up over another window never sends us pointerup. */
  useEffect(() => {
    const onWindowUp = () => stop();
    window.addEventListener("pointerup", onWindowUp);
    window.addEventListener("blur", onWindowUp);
    return () => {
      window.removeEventListener("pointerup", onWindowUp);
      window.removeEventListener("blur", onWindowUp);
    };
  }, [stop]);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      /* A long press must not select text or open the context menu. */
      event.preventDefault();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* Fine without capture. */
      }
      start();
    },
    [start],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      if (event.repeat) return;
      start();
    },
    [start],
  );

  const onKeyUp = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      stop();
    },
    [stop],
  );

  return {
    held,
    handlers: {
      onPointerDown,
      onPointerUp: stop,
      onPointerCancel: stop,
      onKeyDown,
      onKeyUp,
      onBlur: stop,
      onContextMenu: (event: { preventDefault(): void }) => event.preventDefault(),
    },
  };
}

"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Whether an interactive figure should be animating right now.
 *
 * One answer for the four conditions the brief lists: the figure is on
 * screen, the document is visible, the reader has not asked for reduced
 * motion, and the connection is not in save-data mode. Every figure that runs
 * a loop reads `active` and stops its rAF / interval when it goes false, so no
 * animation runs offscreen or in a hidden tab.
 *
 * `reduced` is exposed separately because a reduced-motion figure still
 * INTERACTS — stage buttons keep working — it just does not travel between
 * states.
 */
export function useFigureActive<T extends HTMLElement = HTMLDivElement>(
  externalRef?: RefObject<T>,
) {
  const ownRef = useRef<T>(null);
  const ref = externalRef ?? ownRef;
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [saveData, setSaveData] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMedia = () => setReduced(media.matches);
    onMedia();
    media.addEventListener("change", onMedia);

    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    setSaveData(Boolean(connection?.saveData));

    const onVisibility = () => setVisible(document.visibilityState !== "hidden");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    const element = ref.current;
    let observer: IntersectionObserver | null = null;
    if (element && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => setInView(entries.some((entry) => entry.isIntersecting)),
        { rootMargin: "120px 0px" },
      );
      observer.observe(element);
    } else {
      setInView(true);
    }

    return () => {
      media.removeEventListener("change", onMedia);
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
    };
  }, [ref]);

  return {
    ref,
    /** True only while a loop should be running. */
    active: hydrated && inView && visible && !reduced && !saveData,
    inView,
    reduced,
    saveData,
    hydrated,
  };
}

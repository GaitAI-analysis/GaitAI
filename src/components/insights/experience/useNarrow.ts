"use client";

import { useEffect, useState } from "react";

/**
 * True below `maxWidth` CSS pixels, once hydrated. Figures use it to stack
 * their panels vertically on a phone instead of shrinking a wide drawing
 * until its labels are unreadable. Server and first client render are
 * `false`, so the wide layout is what gets prerendered; the figure shell's
 * min-height keeps the swap from shifting the article.
 */
export function useNarrow(maxWidth = 640): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [maxWidth]);
  return narrow;
}

"use client";

import { useSyncExternalStore } from "react";

/**
 * `prefers-reduced-motion`, safe to branch markup on.
 *
 * framer-motion's `useReducedMotion()` reads the media query synchronously on
 * the client, so under reduced motion it returns `true` on the very first
 * client render while the server rendered `false`. Any component that changes
 * its element tree on that value (a `<source>` that is or is not there, a Play
 * icon instead of a Pause icon) then fails hydration — React error #418, and
 * the nearest Suspense boundary is thrown away and re-rendered client-side.
 *
 * This hook returns the server's answer (`false`) during hydration and the real
 * preference straight after, so the first client render always matches the
 * HTML, and the reduced-motion branch takes over one render later. It also
 * follows live changes to the setting.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

"use client";

/**
 * Client-only, lazily-mounted host for the live Insights list.
 *
 * `LivePostsList` reads Firestore, so importing it directly puts the whole
 * Firebase client SDK on the critical path of /insights — the route was
 * shipping ~250 kB of JavaScript more than any comparable page for a list
 * that renders nothing at all when there are no verified posts.
 *
 * Two levels of laziness, mirroring `DiscussionMount`:
 *
 * 1. `ssr: false` — the list is inherently client-side (a live Firestore
 *    read), so it stays out of the static prerender the `output: export`
 *    build produces.
 *
 * 2. Viewport-gated — the editorial library leads the page, so the live list
 *    sits below it. Firebase is only fetched once the reader scrolls near.
 *
 * Nothing is reserved visually: `hideWhenEmpty` means the list may legitimately
 * render nothing, and a skeleton for content that may not exist would be a
 * false promise.
 */

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const LivePostsList = dynamic(
  () => import("./LivePostsList").then((m) => m.LivePostsList),
  { ssr: false },
);

export function LivePostsMount({ hideWhenEmpty }: { hideWhenEmpty?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;

    // No IntersectionObserver (very old browsers) → just load it.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // Start loading a screen early so it is ready by the time it is reached.
      { rootMargin: "600px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref}>{visible && <LivePostsList hideWhenEmpty={hideWhenEmpty} />}</div>
  );
}

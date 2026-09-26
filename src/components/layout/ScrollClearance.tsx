"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** One correction point for deep links, delayed layout and keyboard focus.
 * Does not move a reader who has started scrolling or steal keyboard focus. */
export function ScrollClearance() {
  const pathname = usePathname();
  useEffect(() => {
    let userMoved = false;
    let frame = 0;
    const clearance = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-clearance-px")) ||
      (document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 90) + 24;
    const correct = () => {
      if (userMoved || !location.hash) return;
      let id: string;
      try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
      const target = document.getElementById(id);
      if (!target || !target.getClientRects().length) return;
      const top = target.getBoundingClientRect().top;
      if (top < clearance() - 1) window.scrollBy({ top: top - clearance(), behavior: "instant" });
    };
    const queue = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(correct); };
    const move = () => { userMoved = true; };
    const hash = () => { userMoved = false; queue(); };
    const focus = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.closest('[role="dialog"], .site-header')) return;
      const top = target.getBoundingClientRect().top;
      if (top >= 0 && top < clearance()) window.scrollBy({ top: top - clearance(), behavior: "instant" });
    };
    // Resolve the rem-based token through an element, avoiding a second JS height.
    const marker = document.createElement("span");
    marker.style.cssText = "position:fixed;visibility:hidden;pointer-events:none;height:var(--header-clearance)";
    document.body.append(marker);
    const measure = () => {
      document.documentElement.style.setProperty("--header-clearance-px", `${marker.getBoundingClientRect().height}px`);
      queue();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(marker);
    // Observe every top-level block, not only <main>: a client component that
    // swaps a placeholder for content of a different height above the target
    // moves the target without changing <main>'s own height.
    const layout = new ResizeObserver(queue);
    const main = document.querySelector("main") ?? document.body;
    layout.observe(main);
    for (const block of main.children) layout.observe(block);
    // Late layout (fonts, images, hydration) lands within a few seconds; these
    // re-checks catch a move that no observer reported. Each is a no-op once
    // the target already clears the header.
    const timers = [250, 750, 1500, 3000].map((ms) => window.setTimeout(queue, ms));
    measure();
    document.fonts.ready.then(queue);
    window.addEventListener("hashchange", hash);
    window.addEventListener("wheel", move, { passive: true });
    window.addEventListener("touchstart", move, { passive: true });
    document.addEventListener("focusin", focus);
    document.addEventListener("load", queue, true);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); layout.disconnect(); marker.remove();
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("hashchange", hash); window.removeEventListener("wheel", move);
      window.removeEventListener("touchstart", move); document.removeEventListener("focusin", focus);
      document.removeEventListener("load", queue, true);
    };
  }, [pathname]);
  return null;
}

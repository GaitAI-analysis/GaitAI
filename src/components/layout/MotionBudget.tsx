"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Pause decorative CSS motion and autoplay media outside the viewport.
 * User-controlled video remains under the visitor's control. */
export function MotionBudget() {
  const pathname = usePathname();
  useEffect(() => {
    const seen = new Set<Element>();
    const visible = new Map<Element, boolean>();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const apply = (node: Element) => {
      const paused = !visible.get(node) || document.hidden || reduced.matches;
      if (node instanceof HTMLVideoElement) {
        if (paused) node.pause(); else node.play().catch(() => {});
      } else if (node instanceof HTMLElement) node.dataset.motionPaused = String(paused);
    };
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      visible.set(entry.target, entry.isIntersecting); apply(entry.target);
    }));
    const scan = () => document.querySelectorAll("main section, video[autoplay]").forEach(node => {
      if (seen.has(node)) return;
      seen.add(node); observer.observe(node);
    });
    const refresh = () => seen.forEach(apply);
    const mutation = new MutationObserver(scan);
    mutation.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true });
    scan();
    document.addEventListener("visibilitychange", refresh);
    reduced.addEventListener("change", refresh);
    return () => {
      observer.disconnect(); mutation.disconnect();
      document.removeEventListener("visibilitychange", refresh); reduced.removeEventListener("change", refresh);
      seen.forEach(node => { if (node instanceof HTMLElement) delete node.dataset.motionPaused; });
    };
  }, [pathname]);
  return null;
}

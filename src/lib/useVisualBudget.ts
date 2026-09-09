"use client";

import { useEffect, useRef, useState } from "react";

/** Decorative WebGL is optional; content and controls render on every device. */
export function useVisualBudget() {
  const ref = useRef<HTMLElement>(null);
  const [eligible, setEligible] = useState(false);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)');
    const device = navigator as Navigator & { deviceMemory?: number; connection?: {saveData?: boolean} };
    // A context probe: a browser that cannot create WebGL (policy, blocklist,
    // exhausted contexts) must get the static fallback, not a mount-time throw.
    const canRender = () => {
      try {
        const probe = document.createElement('canvas');
        return Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'));
      } catch {
        return false;
      }
    };
    const assess = () => setEligible(query.matches && !device.connection?.saveData && (!device.deviceMemory || device.deviceMemory > 4) && (!device.hardwareConcurrency || device.hardwareConcurrency > 4) && canRender());
    assess();
    query.addEventListener('change', assess);
    const element = ref.current;
    let inView = true;
    const update = () => setVisible(inView && document.visibilityState !== 'hidden');
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {inView = entries.some((entry) => entry.isIntersecting);update();}, {rootMargin: '80px'}) : null;
    if (element) observer?.observe(element);
    document.addEventListener('visibilitychange', update);
    update();
    return () => {query.removeEventListener('change', assess);observer?.disconnect();document.removeEventListener('visibilitychange', update);};
  }, []);
  return { ref, eligible, visible };
}

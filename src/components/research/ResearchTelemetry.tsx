"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import styles from "./observatory.module.css";

/**
 * The record as a telemetry strip, not four statistic cards.
 *
 * Large editorial numerals over tiny technical labels, separated by hairlines
 * rather than boxed. Each figure counts up once, when the strip first enters
 * the viewport, over ~700ms — and only then: no loop, and nothing counts on a
 * reduced-motion preference, where the final figure is rendered immediately.
 *
 * `pad` keeps single digits two-wide ("08", "01") so the row reads as a
 * readout. Values are passed in already derived from the canonical records.
 */

export type TelemetryMetric = {
  /** The number to count to. */
  value: number;
  /** Rendered suffix, e.g. "+" — never a unit that implies a measurement. */
  suffix?: string;
  label: string;
  /** Zero-pad to two digits. */
  pad?: boolean;
};

const DURATION = 700;

function useCountUp(target: number, from: number | null, reduce: boolean) {
  // The server renders the real figure, so the strip reads correctly with no
  // JavaScript at all and never flashes a zero. `from` is set to 0 only once
  // the client has decided this strip will actually be scrolled to.
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (reduce || from === null) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      // Same easing curve the page's transitions use.
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, from, reduce]);

  return value;
}

function Metric({
  metric,
  from,
  reduce,
}: {
  metric: TelemetryMetric;
  from: number | null;
  reduce: boolean;
}) {
  const value = useCountUp(metric.value, from, reduce);
  const shown = metric.pad ? String(value).padStart(2, "0") : String(value);

  return (
    <div className={styles.telItem}>
      <span className={styles.telValue}>
        {shown}
        {metric.suffix}
      </span>
      <span className={styles.telLabel}>{metric.label}</span>
      <span aria-hidden="true" className={styles.telSpark} />
    </div>
  );
}

export function ResearchTelemetry({ metrics }: { metrics: TelemetryMetric[] }) {
  const reduce = Boolean(useReducedMotion());
  const ref = useRef<HTMLDivElement | null>(null);
  /**
   * `null` means "show the figure as-is". It becomes 0 only when the strip is
   * below the fold at mount and later scrolls into view — so a reader who
   * lands further down the page, or who has JavaScript disabled, sees the
   * record rather than a row of zeros.
   */
  const [from, setFrom] = useState<number | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (reduce || !node || typeof IntersectionObserver === "undefined") return;

    const rect = node.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (alreadyVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setFrom(0);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduce]);

  return (
    <div ref={ref} className={styles.telemetry}>
      {metrics.map((metric) => (
        <Metric key={metric.label} metric={metric} from={from} reduce={reduce} />
      ))}
    </div>
  );
}

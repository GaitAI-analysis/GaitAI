import type { CSSProperties } from "react";
import Link from "next/link";
import styles from "./observatory.module.css";

/**
 * Responsible research, as one thin rail.
 *
 * Four principles, set as small tracked type with a slow pulse travelling
 * between the separators — a band, not a fourth four-card grid. The link out
 * to the full Responsible AI documentation is preserved, because the rail
 * states positions and the policy page states the controls.
 */

const points = [
  "Privacy by default",
  "Consent & authority",
  "Explainable outputs",
  "No unsupported claims",
];

export function ResearchPrinciples() {
  return (
    <section className="border-y border-white/[0.07] bg-obsidian-300/30 py-9 sm:py-10">
      <div className="container-wide">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <ul className={styles.rail}>
            {points.map((point, i) => (
              <li key={point} className={styles.railItem}>
                <span
                  aria-hidden="true"
                  className={styles.railDot}
                  style={{ "--i": i } as CSSProperties}
                />
                {point}
              </li>
            ))}
          </ul>

          <Link
            href="/legal/responsible-ai"
            className="group inline-flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300 transition-colors hover:text-emerald-200"
          >
            Read Responsible AI documentation
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

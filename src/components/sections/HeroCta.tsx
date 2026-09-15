"use client";

import Link from "next/link";
import type { HeroPanelId } from "@/lib/hero-panels";
import { trackHeroCta } from "./hero-cta-event";
import styles from "./hero.module.css";

/**
 * ONE OF THE HERO'S THREE PILLS — a real link, at last.
 *
 * In the flattened artwork the pill was paint and the control was a
 * transparent box positioned over it, which is why the old stylesheet carried
 * two hundred lines about lighting a surface that could not itself be styled.
 * Now the pill IS the link: its fill, its outline, its label and its arrow are
 * all DOM, so hover, focus and the press state are ordinary CSS, the label is
 * the accessible name (no `aria-label` restating pixels), and the arrow can
 * travel on hover because nothing is painted underneath it to misregister
 * against.
 *
 * `next/link` keeps the client-side navigation and the prefetch. The click
 * reports which panel was chosen — see hero-cta-event.ts — and does not
 * prevent or delay the navigation in any way.
 */
export function HeroCta({
  panel,
  href,
  label,
}: {
  panel: HeroPanelId;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      data-cta={panel}
      className={styles.cta}
      onClick={() => trackHeroCta({ panel, href })}
    >
      <span className={styles.ctaLabel}>{label}</span>
      {/* The arrow is decorative: the label already names the destination. */}
      <svg
        className={styles.ctaArrow}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M4 12h14M13 6l6 6-6 6" />
      </svg>
    </Link>
  );
}

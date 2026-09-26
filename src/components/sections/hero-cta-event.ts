import type { HeroPanelId } from "@/lib/hero-panels";

/**
 * THE HERO'S THREE CALLS TO ACTION, AS AN EVENT.
 *
 * The pills used to be painted into the artwork, so a click on one was a click
 * on a transparent box over a picture and there was nothing to measure but the
 * navigation itself. They are real links now, and which of the three panels a
 * visitor chooses is the single most useful thing the homepage can report: it
 * says which of health, safety or identity brought them.
 *
 * WHAT IT CARRIES. The panel and its destination. Nothing about the visitor —
 * no identifier, no session, no referrer, no screen. The site's privacy posture
 * is structural (see lib/insight-events.ts, which takes the same line for the
 * journal), and this event has no field that could hold anything else.
 *
 * HOW IT TRAVELS. The same three ways every other site-wide signal does: a
 * `gaitai:` custom event on `window` for QA scripts and any future
 * integration, then `dataLayer` and `gtag` if a tag manager happens to be
 * present. No network call of its own, nothing awaited, and a failure is
 * silent — a broken analytics path must never cost a visitor the navigation
 * they actually asked for.
 */
export const HERO_CTA_EVENT = "gaitai:hero-cta";

export interface HeroCtaDetail {
  readonly panel: HeroPanelId;
  readonly href: string;
}

interface TagWindow extends Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

export function trackHeroCta(detail: HeroCtaDetail): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent<HeroCtaDetail>(HERO_CTA_EVENT, { detail }));
    const w = window as TagWindow;
    if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event: HERO_CTA_EVENT, ...detail });
    if (typeof w.gtag === "function") w.gtag("event", "hero_cta", { ...detail });
  } catch {
    /* Measurement is never allowed to break a link. */
  }
}

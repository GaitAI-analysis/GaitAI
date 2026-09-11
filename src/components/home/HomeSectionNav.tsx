"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { homeSectionIds, homeSections } from "@/data/home-sections";
import styles from "./sectionnav.module.css";

/**
 * THE HOME PAGE'S SECTION NAVIGATOR
 * =============================================================================
 * Eight destinations, sticky under the global header, so the home page stops
 * being one document read top to bottom and becomes eight places a visitor can
 * choose between. The hero above it asks a question; this is the answer sheet.
 *
 * IT IS REAL NAVIGATION, NOT A SCRIPTED SUBSTITUTE FOR IT
 *
 * Every item is an `<a href="#id">` pointing at a section that is really in the
 * document. That one decision buys, for free and without a line of script:
 *
 *   DEEP LINKS      `/#use-cases` pasted into a fresh tab lands on the use
 *                   cases, because the browser resolves the fragment itself.
 *   HISTORY         Clicking pushes an entry; Back returns to the previous
 *                   section. Nothing here calls pushState, so nothing here can
 *                   get the history stack wrong.
 *   KEYBOARD        Links are in the tab order natively, and Enter follows
 *                   them. There is no key handling to forget.
 *   SMOOTH SCROLL   `html { scroll-behavior: smooth }` in globals.css, which
 *                   already switches itself off under prefers-reduced-motion.
 *   OFFSET          `.home-section { scroll-margin-top }` in globals.css
 *                   clears the fixed header AND this rail, so a section never
 *                   arrives underneath either one.
 *
 * The script in here does exactly one thing the platform cannot: it says which
 * section you are currently in.
 *
 * THE ACTIVE SECTION
 *
 * One IntersectionObserver over the eight sections, with a root margin that
 * shrinks the viewport to a band starting just below this rail. The topmost
 * section intersecting that band is the one being read. Choosing the topmost
 * rather than the largest is what makes a short section (Trust) reachable —
 * by area, a tall neighbour would win the moment it appeared.
 *
 * The hash is deliberately NOT the source of truth for the highlight: a
 * visitor who arrives at `/#research` and then scrolls away would otherwise
 * keep Research lit for the rest of the page.
 *
 * ON MOBILE it is a horizontal rail. The active item is scrolled into view
 * inside the rail — by writing `scrollLeft` rather than calling
 * `scrollIntoView`, which would also scroll the page and fight the gesture
 * that caused it.
 */
export function HomeSectionNav() {
  const [active, setActive] = useState<string | null>(null);
  const railRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const elements = homeSectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (elements.length === 0) return;

    /* The detection band: from just under the sticky rail down to 45% of the
       viewport. Expressed against the real header and rail heights so it
       cannot drift from the CSS that positions them. */
    const readToken = (name: string, fallback: number) => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
      const parsed = Number.parseFloat(raw);
      if (Number.isNaN(parsed)) return fallback;
      return raw.trim().endsWith("rem") ? parsed * 16 : parsed;
    };
    const top = readToken("--site-header-height", 90) + readToken("--home-nav-height", 52);

    /**
     * WHICH SECTION AM I IN? — measured, not inferred from the entries.
     *
     * The obvious version ("the first entry still intersecting the band")
     * lags by exactly one section, and it took a test to see why: at the
     * moment section N's top reaches the band, section N-1 is still
     * overlapping it by a pixel or two, and being earlier in the document it
     * keeps winning. Ratios do not fix it either — a tall section beats a
     * short one on area no matter where the reader is.
     *
     * The question is simply "which section have I scrolled past the top
     * of", so it is answered that way: the LAST section whose top edge is at
     * or above the band. The observer stays, but only as the trigger — it
     * fires on exactly the crossings that can change the answer, which is
     * why there is no scroll listener here and no rAF loop.
     */
    const resolve = () => {
      /* The line a section's top has to have crossed to count as the one
         being read. Not the rail's own bottom edge: a deep link parks a
         section a little below the rail, and a line drawn at the rail would
         leave the rail blank on the exact navigation it was asked to
         confirm. A fifth of the viewport below it is far enough to catch
         that and far short of the shortest section on the page. */
      const line = top + window.innerHeight * 0.22;
      let next: string | null = null;
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= line) next = element.id;
        else break;
      }
      /* `null` is a real answer, not a missing one: above the first section
         the reader is in the hero, and lighting a section there would claim
         they are somewhere they have not reached. */
      setActive((current) => (next !== current ? next : current));
    };

    const observer = new IntersectionObserver(resolve, {
      rootMargin: `-${Math.round(top)}px 0px -45% 0px`,
      threshold: 0,
    });

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /* Keep the current item visible in the rail without moving the page. */
  useEffect(() => {
    const rail = railRef.current;
    const item = active ? itemRefs.current[active] : null;
    if (!rail || !item) return;
    if (rail.scrollWidth <= rail.clientWidth) return;
    const target = item.offsetLeft - (rail.clientWidth - item.offsetWidth) / 2;
    const max = rail.scrollWidth - rail.clientWidth;
    rail.scrollTo({
      left: Math.max(0, Math.min(max, target)),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [active]);

  /**
   * A click sets the highlight immediately rather than waiting for the scroll
   * to arrive — a 700px smooth scroll otherwise leaves the rail showing the
   * section you just left. The observer takes over again as soon as the
   * scroll lands, and will correct this if the browser ends up somewhere else.
   */
  const onNavigate = useCallback((id: string) => setActive(id), []);

  return (
    <nav aria-label="Home page sections" className={styles.bar}>
      <div className={styles.inner}>
        <ul ref={railRef} className={styles.rail}>
          {homeSections.map((section) => {
            const on = active === section.id;
            return (
              <li key={section.id} className={styles.item}>
                <a
                  ref={(node) => {
                    itemRefs.current[section.id] = node;
                  }}
                  href={`#${section.id}`}
                  aria-current={on ? "true" : undefined}
                  aria-label={
                    section.description === section.label
                      ? undefined
                      : section.description
                  }
                  onClick={() => onNavigate(section.id)}
                  className={styles.link}
                  data-on={on}
                >
                  {section.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

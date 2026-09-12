"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  homeSectionById,
  homeSectionIds,
  homeSections,
  type HomeSection,
} from "@/data/home-sections";
import styles from "./sectionnav.module.css";

/**
 * THE HOME PAGE'S SECTION NAVIGATOR
 * =============================================================================
 * Eight destinations, sticky under the global header, so the home page stops
 * being one document read top to bottom and becomes eight places a visitor can
 * choose between. The hero above it asks a question; this is the answer sheet.
 *
 * Everything here — the labels, the order, the hrefs, the observer's targets
 * and the active state — comes from `data/home-sections.ts`. There is no
 * second list anywhere in this file.
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
 * The script in here does two things the platform cannot: it puts the rail in
 * page order, and it says which section you are currently in.
 *
 * ── THE ORDER IS MEASURED, NOT DECLARED ──────────────────────────────────
 *
 * The registry is written in page order so the first paint is right, and then
 * re-derived from `compareDocumentPosition` on mount. A rail whose labels run
 * in a different order from the sections under them is not a navigator, it is
 * a second, contradictory story — and that is what a hand-kept list decays
 * into the first time a section moves in page.tsx. Now it cannot: move the
 * section, and its rail item moves with it.
 *
 * ── THE ACTIVE SECTION ───────────────────────────────────────────────────
 *
 * One IntersectionObserver over the sections, with a root margin that shrinks
 * the viewport to a band starting just below this rail. It is only a trigger:
 * every answer is measured from the live rectangles, because the entries
 * describe the moment a boundary was crossed and the question is about where
 * the reader is now.
 *
 * The question is "which section have I scrolled past the top of", so it is
 * answered that way: the LAST section whose top edge is at or above a line a
 * fifth of the viewport below the rail. The obvious version ("the first
 * section still intersecting the band") lags by exactly one, because at the
 * moment section N's top reaches the band, N-1 still overlaps it by a pixel
 * or two and, being earlier in the document, keeps winning. Ratios do not fix
 * it either — a tall section beats a short one on area no matter where the
 * reader is.
 *
 * ── TWO SECTIONS ON ONE ROW ──────────────────────────────────────────────
 *
 * MobilityCare and SecureVision are the two flagship panels, and on a wide
 * screen they sit SIDE BY SIDE. They have the same top edge, to the pixel. So
 * "the last section whose top is above the line" answered SecureVision every
 * single time, including the moment after a visitor clicked MobilityCare and
 * the URL said `#mobilitycare`. No amount of ratio-ranking helps: the two
 * cards genuinely are equally on screen, so no measurement of the viewport
 * can tell them apart. It is not a question geometry can answer.
 *
 * So it is answered by intent instead, in two layers:
 *
 *   A ROW IS RESOLVED AS A SET. Sections whose tops fall within PEER_BAND of
 *   each other are one row. If the section already lit belongs to that row it
 *   stays lit — scrolling past a row never re-picks within it. Only when the
 *   reader arrives at a row from outside does it take the row's first section
 *   in document order, which for the flagship pair is the left-hand card.
 *
 *   NAVIGATION IS AUTHORITATIVE WHILE IT IS HAPPENING. A click, a hashchange,
 *   Back/Forward, or a load with a hash lights that section immediately and
 *   LOCKS it. The observer's answers are ignored until the scroll settles,
 *   which is what stops the neighbouring card stealing the highlight during
 *   the 700px the page is still travelling. When the lock lifts, the row rule
 *   above is what keeps the answer where the visitor put it.
 *
 * A lock is released by `scrollend`, by the reader taking the scroll back
 * with a wheel or a touch, or — if neither ever happens, because the target
 * was already on screen and nothing moved — by a timeout.
 *
 * ── AND ONE RECOMPUTE WHEN THE PAGE STOPS MOVING ─────────────────────────
 *
 * The observer alone is not enough, and the reason is `scroll-behavior:
 * smooth`. Arriving at `/#research` animates the viewport from the top of the
 * page all the way down, the observer fires its crossings DURING that
 * animation, and its last callback lands before the animation finishes — so
 * the highlight is computed from a position the reader never stops at, and
 * nothing recomputes once they do. Live, that left `/#research` lighting
 * Technology every time and `/#use-cases` lighting Products two arrivals in
 * three; the further down the page, the longer the animation and the further
 * behind the last callback fell.
 *
 * It is not a stale-layout problem — the document height and the target's
 * position were identical on every run — so nudging the scroll does not fix
 * it either: a one-pixel move crosses no band edge and produces no callback.
 *
 * `scrollend` fires exactly once when scrolling settles, which is the event
 * this needs. Where it does not exist yet (Safari), a debounced `scroll`
 * listener stands in. `resize` matters too, because the line the answer is
 * measured against is a fraction of the viewport height — and because it is
 * what turns the flagship row into two stacked sections and back.
 *
 * ON MOBILE it is a horizontal rail. The active item is scrolled into view
 * inside the rail — by writing `scrollLeft` rather than calling
 * `scrollIntoView`, which would also scroll the page and fight the gesture
 * that caused it.
 */

/**
 * Two sections whose top edges are within this many pixels are on the same
 * row and cannot be told apart by scroll position. Generous enough to absorb
 * the flagship panels' entrance animation (a 36px rise, staggered), and an
 * order of magnitude short of the gap between any two stacked sections.
 */
const PEER_BAND = 72;

/** Longest a navigation may hold the highlight if `scrollend` never arrives. */
const LOCK_TIMEOUT = 1400;

/** The band's top edge: below the fixed header and below this rail. */
function readBandTop() {
  const read = (name: string, fallback: number) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
    const parsed = Number.parseFloat(raw);
    if (Number.isNaN(parsed)) return fallback;
    return raw.trim().endsWith("rem") ? parsed * 16 : parsed;
  };
  return read("--site-header-height", 90) + read("--home-nav-height", 52);
}

export function HomeSectionNav() {
  const [active, setActive] = useState<string | null>(null);
  /**
   * Whether there is a section to point at right now.
   *
   * Only the vertical rail needs this. Horizontal it is in flow and scrolls
   * away with the page; vertical it is fixed, and a fixed timeline has no
   * business floating over the hero — which it sits above, not beside — or
   * over the footer, which is outside the home page's content shift and
   * would be overlapped by it. Above the first section `active` is already
   * null, so this only has to answer for the far end.
   */
  const [pastEnd, setPastEnd] = useState(false);
  /* Page order. Seeded from the registry — which is written in page order —
     and replaced on mount by what the document actually says. */
  const [items, setItems] = useState<HomeSection[]>(homeSections);
  const railRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  /** The id an explicit navigation is travelling to, or null. */
  const lockRef = useRef<string | null>(null);
  const lockTimerRef = useRef<number | undefined>(undefined);

  const unlock = useCallback(() => {
    lockRef.current = null;
    window.clearTimeout(lockTimerRef.current);
  }, []);

  /** Light a section now and hold it there until the scroll to it settles. */
  const lockTo = useCallback((id: string) => {
    if (!homeSectionById.has(id)) return;
    lockRef.current = id;
    setActive(id);
    window.clearTimeout(lockTimerRef.current);
    lockTimerRef.current = window.setTimeout(() => {
      lockRef.current = null;
    }, LOCK_TIMEOUT);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    /* ONE WALK OF THE PAGE, and the rail and the observer both read its
       result — so they cannot end up describing different pages. */
    const elements = homeSectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element))
      .sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      );
    if (elements.length === 0) return;

    /* The rail, in the order the sections really appear. An entry whose
       section is not in the document is dropped rather than rendered as a
       link to nowhere. */
    const rendered = elements
      .map((element) => homeSectionById.get(element.id))
      .filter((section): section is HomeSection => Boolean(section));
    setItems((current) =>
      current.length === rendered.length &&
      current.every((section, index) => section.id === rendered[index].id)
        ? current
        : rendered,
    );

    const resolve = () => {
      /* An explicit navigation owns the highlight until it lands. */
      if (lockRef.current) return;

      /* The line a section's top has to have crossed to count as the one
         being read. Not the rail's own bottom edge: a deep link parks a
         section a little below the rail, and a line drawn at the rail would
         leave the rail blank on the exact navigation it was asked to
         confirm. A fifth of the viewport below it is far enough to catch
         that and far short of the shortest section on the page. Measured
         each time, because the header's height changes with the breakpoint. */
      const line = readBandTop() + window.innerHeight * 0.22;
      const tops = elements.map((element) => element.getBoundingClientRect().top);

      /* The end of the readable page: the contact block if it is there, else
         the last section the rail knows about. */
      const tail =
        document.getElementById("contact") ?? elements[elements.length - 1];
      const ended = tail.getBoundingClientRect().bottom < readBandTop();
      setPastEnd((current) => (current === ended ? current : ended));


      let last = -1;
      for (let index = 0; index < elements.length; index += 1) {
        if (tops[index] <= line) last = index;
        else break;
      }

      /* `null` is a real answer, not a missing one: above the first section
         the reader is in the hero, and lighting a section there would claim
         they are somewhere they have not reached. */
      if (last < 0) {
        setActive((current) => (current === null ? current : null));
        return;
      }

      /* Widen to the whole row — every section sharing the winner's top edge
         within PEER_BAND. Off a shared row this is a single element and the
         answer is unchanged. */
      let first = last;
      while (first > 0 && Math.abs(tops[first - 1] - tops[last]) <= PEER_BAND) {
        first -= 1;
      }
      const row = elements.slice(first, last + 1).map((element) => element.id);

      setActive((current) => {
        /* Already inside this row? Then nothing about scrolling past it is
           evidence that the reader has switched cards, and re-picking would
           throw away the choice they made. */
        const next = current && row.includes(current) ? current : row[0];
        return next === current ? current : next;
      });
    };

    const observer = new IntersectionObserver(resolve, {
      rootMargin: `-${Math.round(readBandTop())}px 0px -45% 0px`,
      threshold: 0,
    });
    for (const element of elements) observer.observe(element);

    /* The page has stopped moving: whatever navigation was in flight has
       landed, so hand the answer back to measurement. */
    const onSettle = () => {
      unlock();
      resolve();
    };

    /* The reader has taken the scroll back by hand. Their gesture outranks a
       navigation that is still animating. */
    const onGesture = () => {
      if (lockRef.current) unlock();
    };

    let settle: number | undefined;
    const onScroll = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(onSettle, 120);
    };
    const hasScrollEnd = "onscrollend" in window;
    if (hasScrollEnd) {
      window.addEventListener("scrollend", onSettle, { passive: true });
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("wheel", onGesture, { passive: true });
    window.addEventListener("touchstart", onGesture, { passive: true });

    /* One measurement now, for a load with no hash — and for a reload part
       way down the page, where the browser restores the scroll position
       without ever firing a scroll event. */
    resolve();

    return () => {
      observer.disconnect();
      window.clearTimeout(settle);
      if (hasScrollEnd) window.removeEventListener("scrollend", onSettle);
      else window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("wheel", onGesture);
      window.removeEventListener("touchstart", onGesture);
    };
  }, [unlock]);

  /**
   * THE HASH IS AUTHORITATIVE THE MOMENT IT CHANGES — and only then.
   *
   * A load or a refresh on `/#mobilitycare`, and Back/Forward between two
   * sections, are navigations the observer cannot see coming: the browser
   * scrolls, the crossings fire on the way, and the answer gets computed
   * from somewhere in the middle. Each one locks its target instead.
   *
   * It is deliberately not a standing source of truth. A visitor who arrives
   * at `/#research` and then scrolls away would otherwise keep Research lit
   * for the rest of the page.
   */
  useEffect(() => {
    const fromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id && homeSectionById.has(id)) lockTo(id);
      else unlock();
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    window.addEventListener("popstate", fromHash);
    const timer = lockTimerRef;
    return () => {
      window.removeEventListener("hashchange", fromHash);
      window.removeEventListener("popstate", fromHash);
      window.clearTimeout(timer.current);
    };
  }, [lockTo, unlock]);

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

  return (
    <nav
      aria-label="Home page sections"
      className={styles.bar}
      data-docked={active !== null && !pastEnd}
    >
      <div className={styles.inner}>
        {/* The separator lives on this track, not on the bar. The bar spans
            the viewport because its blurred ground is chrome; the line under
            it is not, and a rule running the full width of the page under
            eight short labels reads as a divider for the whole page rather
            than an edge for the rail. The track is `max-content` wide, so it
            ends where USE CASES ends — and capped at the container, so on a
            phone it is the container's width with the labels scrolling
            inside it. */}
        <div className={styles.track}>
          <ul ref={railRef} className={styles.rail}>
          {items.map((section) => {
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
                  /* Lights the target before the scroll starts, and holds it
                     there while the page travels. Clicking the section you
                     are already on fires no hashchange, so the click itself
                     has to do this rather than leaving it to the hash. */
                  onClick={() => lockTo(section.id)}
                  className={styles.link}
                  data-on={on}
                >
                  {/* The node and the connector are the desktop rail's whole
                      vocabulary: a hollow mark on a thin line, filled and lit
                      when you are in that section. Both are decoration —
                      the link's accessible name is the label beside it — so
                      the node is hidden from assistive technology and simply
                      does not render below the breakpoint. */}
                  <span aria-hidden="true" className={styles.node} />
                  <span className={styles.text}>{section.label}</span>
                </a>
              </li>
            );
          })}
          </ul>
        </div>
      </div>
    </nav>
  );
}

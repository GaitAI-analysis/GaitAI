"use client";

import { useEffect, useRef, useState } from "react";
import type { InsightSection } from "@/data/insights";
import styles from "./journal.module.css";

/**
 * The article's section navigator.
 *
 * Two presentations of the same list, because the two contexts want different
 * things:
 *
 *   desktop  a rail beside the column, showing every section by its short
 *            label with the current one lit, plus a hairline that fills as
 *            the reader moves through the essay
 *   mobile   a horizontal scroller under the 2-minute version, which is the
 *            only shape that fits and still says where you are
 *
 * NEITHER IS PINNED. Both sat in the viewport for the whole article — the
 * desktop rail on `site-sticky-below-header`, the mobile strip on its own
 * `position: sticky` — so a table of contents followed a reader who had
 * already used it, down eight sections of an essay. They are in normal flow
 * now: they start beside the article, they move with it, and they leave the
 * viewport and stay gone. Nothing else changes; the observer below still
 * lights the section being read for as long as the rail is on screen, and
 * the anchors keep working after it is not.
 *
 * Labels come from each section's `navLabel` — "Signal", "Pose", "Fusion" —
 * rather than its sentence-length title, which is what makes a rail readable.
 *
 * ACTIVE TRACKING IS DERIVED FROM SCROLL POSITION, NOT FROM VISIBILITY.
 *
 * It used to be an IntersectionObserver watching a thin band under the header
 * (`rootMargin: "-140px 0px -70% 0px"`), and it only called `setActiveId` when
 * something was intersecting that band. A band roughly 130px tall on a 900px
 * viewport is empty most of the time: any section taller than it — which is
 * all of them — leaves no heading inside the band, so nothing intersected,
 * the callback set nothing, and the rail kept whatever it had last. Reading
 * section 04 with "01 Signal" still lit was the visible symptom.
 *
 * The deeper problem is that the observer answers the wrong question. It
 * reports when visibility RATIOS cross thresholds; what the rail needs is
 * where each heading sits relative to a reading line. That is a function of
 * scroll position, so it is computed from scroll position: the active section
 * is the LAST heading that has passed the line, which is correct while
 * scrolling down, while scrolling back up, and in the middle of a section
 * taller than the screen — none of which the band handled.
 *
 * The line is measured from the real header rather than hard-coded, and it is
 * the same offset `[id] { scroll-margin-top }` uses, so clicking a rail entry
 * lands the heading exactly on the line that activates it.
 */
export function SectionRail({
  sections,
  variant,
}: {
  sections: InsightSection[];
  /**
   * Which presentation to render. Each call site picks one, so the page never
   * carries two "Sections" landmarks for a screen reader to step through.
   */
  variant: "rail" | "strip";
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  /* Set by a rail click; see the note in `onScroll`. */
  const holdUntil = useRef(0);

  const choose = (id: string) => {
    holdUntil.current = Date.now() + 900;
    setActiveId(id);
  };

  useEffect(() => {
    /* Resolved from each section's own id, so the rail is coupled to the
       record rather than to array position — reordering the sections cannot
       point an entry at the wrong heading. */
    const headings = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null);
    if (headings.length === 0) return;

    /**
     * The reading line: just below the floating header.
     *
     * Measured from the header element rather than hard-coded, so it follows
     * the real chrome instead of a number that goes stale. It matches the
     * offset every in-page anchor already uses, which is what makes a clicked
     * entry activate exactly as its scroll lands.
     */
    const readingLine = () => {
      const header = document.querySelector("header");
      const bottom = header ? header.getBoundingClientRect().bottom : 90;
      /* The header clears the line, but the line is the UPPER THIRD, not the
         top edge. Measured: clicking a rail entry settles its heading around
         y=236 on a 900px viewport — content below the fold finishes loading
         and pushes it past where `scroll-margin-top` first put it. A line
         just under the header (~132px) sat above that, so the rail showed the
         PREVIOUS section for a heading the reader was plainly looking at. A
         section becomes current once its heading is in the top third, which
         is also what stops a tall section holding the highlight while the
         next heading sits mid-screen.

         0.35 IS MEASURED, NOT PICKED. A deep link or a rail click settles its
         heading at ~292px on a 900px viewport — 32.4% — because the section's
         own top margin sits between `scroll-margin-top` and the heading. With
         the line at 30% (270px) the target landed 22px BELOW it, so a correct
         computation reported the previous section and the highlight was
         one behind after every click and every #hash. 35% clears the real
         landing position with room to spare, and it is the same boundary the
         `-20% / -65%` band in the brief describes. */
      return Math.max(bottom + 28, window.innerHeight * 0.35);
    };

    const compute = () => {
      /* At the very end of the page the last heading may never reach the
         line — a short final section simply runs out of scroll. Without this
         the rail would sit on section 06 through all of section 07. */
      const doc = document.documentElement;
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - 4) {
        setActiveId(headings[headings.length - 1].id);
        return;
      }

      const line = readingLine();
      /* The LAST heading at or above the line. Scanning in document order and
         keeping the most recent match is what makes upward scrolling work as
         naturally as downward: the answer depends only on where things are
         now, never on which direction we arrived from. */
      let current = headings[0].id;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= line) current = heading.id;
        else break;
      }
      setActiveId(current);
    };

    /* One passive listener, coalesced to a frame. There is no shared
       scroll-spy in the codebase to reuse, and the work per frame is seven
       `getBoundingClientRect` reads on elements that are already laid out. */
    let queued = false;
    const onScroll = () => {
      /* A rail click sets its own entry and then the browser scrolls smoothly
         to it, which fires scroll events the whole way — recomputing through
         those would flick the highlight down every section in between before
         landing. The click parks `holdUntil` a moment ahead so the entry the
         reader chose stays lit until the scroll settles, after which position
         governs again. */
      if (Date.now() < holdUntil.current) return;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        compute();
      });
    };

    /*
     * A `#hash` IS the answer, for as long as it takes the page to settle.
     *
     * Deriving the active section from position is right once a reader is
     * reading, but wrong at the moment of a deep link. The browser jumps to
     * the target, then covers below the fold resolve and the discussion
     * mounts, and content growing ABOVE the viewport pushes the target
     * heading back down past the reading line. Position then says — correctly
     * — that the heading above is the one in the reading zone, so opening
     * `#one-engine-different-outcomes` intermittently lit "06 Decision
     * support". Recomputing more often cannot fix that; the computation was
     * not wrong, the question was.
     *
     * So a hash that names a real section wins outright, and is re-asserted
     * across the settling window because the drift arrives in stages. The
     * hold expires quickly, after which the reader's own scrolling governs
     * again — no deep link keeps a section lit once someone starts reading
     * elsewhere.
     */
    const fromHash = () => {
      const raw = window.location.hash.replace(/^#/, "");
      if (!raw) return null;
      let id = raw;
      try {
        id = decodeURIComponent(raw);
      } catch {
        /* A malformed escape is not a section id; fall through to the raw
           value rather than throwing inside an effect. */
      }
      return sections.some((section) => section.id === id) ? id : null;
    };

    const timers: number[] = [];

    const honourHash = () => {
      const id = fromHash();
      if (!id) return false;
      holdUntil.current = Date.now() + 900;
      setActiveId(id);
      /* The drift lands in stages as assets resolve, so re-assert rather than
         trusting one frame. */
      for (const ms of [180, 450, 800]) {
        timers.push(window.setTimeout(() => setActiveId(id), ms));
      }
      return true;
    };

    if (!honourHash()) {
      compute();
      requestAnimationFrame(compute);
      timers.push(window.setTimeout(compute, 350));
    }

    const onHashChange = () => {
      if (!honourHash()) compute();
    };
    window.addEventListener("hashchange", onHashChange);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    /*
     * Recompute when the page's own height changes, not only when the reader
     * moves.
     *
     * The active section is a function of scroll position AND layout, and
     * layout keeps changing after load: covers below the fold resolve, fonts
     * swap, the discussion mounts. On a `#hash` load nothing scrolls after
     * that settling, so with scroll as the only trigger the answer computed
     * during the jump was kept even once the headings had moved out from
     * under it — landing on `#one-engine-different-outcomes` intermittently
     * left "06 Decision support" lit. Watching the body's box makes that
     * deterministic instead of a race with the network.
     */
    const ro = new ResizeObserver(onScroll);
    ro.observe(document.body);

    return () => {
      for (const t of timers) window.clearTimeout(t);
      ro.disconnect();
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);

  const activeIndex = Math.max(
    0,
    sections.findIndex((section) => section.id === activeId),
  );
  const filled = ((activeIndex + 1) / sections.length) * 100;

  if (variant === "strip") {
    return (
      <nav aria-label="Sections" className={styles.railMobile}>
        <div className={styles.railMobileTrack}>
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={() => choose(section.id)}
              aria-current={section.id === activeId ? "true" : undefined}
              className={`${styles.railMobileItem} ${
                section.id === activeId ? styles.railMobileItemActive : ""
              }`}
            >
              {section.number} · {section.navLabel}
            </a>
          ))}
        </div>
      </nav>
    );
  }

  return (
      <nav aria-label="Sections" className={styles.rail}>
        <p className={styles.railLabel}>In this article</p>
        <ol className={styles.railList}>
          {sections.map((section, i) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={() => choose(section.id)}
                aria-current={section.id === activeId ? "true" : undefined}
                className={`${styles.railItem} ${
                  section.id === activeId ? styles.railItemActive : ""
                }`}
              >
                <span className={styles.railIndex}>{section.number}</span>
                <span>{section.navLabel}</span>
              </a>
            </li>
          ))}
        </ol>
        <div className={styles.railProgress} aria-hidden="true">
          <div className={styles.railProgressFill} style={{ width: `${filled}%` }} />
        </div>
      </nav>
  );
}

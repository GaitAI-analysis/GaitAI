"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useDisclosureReveal } from "@/lib/useDisclosureReveal";
import disclosure from "@/components/ui/disclosure.module.css";
import styles from "./researchdisclosure.module.css";

const PANEL_ID = "research-record";
const TOGGLE_ID = "research-record-toggle";

/**
 * THE RESEARCH RECORD, BEHIND ONE ROW.
 * =============================================================================
 * The research section leads with the flow diagram and the line that explains
 * it. Everything after that — the founder record and its dials, the three most
 * recent references, the evidence-map and privacy cards, the responsible-
 * deployment note — is the detail a reader asks for, not the detail a reader
 * is handed. So it is one disclosure now. NOTHING WAS CUT: the panel holds the
 * same children the section rendered inline, in the same order, with the same
 * wording and the same derived counts.
 *
 * WHY NOT `<details>`. A controlled `<details>`/`<summary>` fights the
 * browser's own toggle — the element flips its `open` attribute on click
 * before React hears about it, and re-rendering from state then races the
 * native behaviour. A button carrying `aria-expanded` and `aria-controls`
 * over a labelled region is the same thing to a screen reader with one source
 * of truth. This is the pattern `CaptureChainDisclosure` established.
 *
 * WHY IT IS RENDERED RATHER THAN MOUNTED ON OPEN. The panel is in the
 * server-rendered HTML at all times; closed is a collapsed grid row plus
 * `visibility: hidden`, which keeps the content out of the accessibility tree
 * and out of the tab order without taking it out of the document. A crawler,
 * and a reader whose JavaScript never arrives, still get the whole record.
 * That also means the collapse can animate, which `hidden` cannot.
 *
 * OPENING TRAVELS. The control sits under a full screen of research
 * diagram, so expanding in place opens the record below the fold: the reader
 * clicks, nothing visibly happens, and they have to go hunting. On open the
 * control moves to the top of the readable viewport — below the fixed header
 * and the sticky rail, per `home-reveal-offset` — and the record starts
 * directly under it. Closing only moves the page if the collapse has carried
 * the control off screen. See `lib/useDisclosureReveal`.
 *
 * DEEP LINKS OPEN IT. Anything addressing an element inside the panel — the
 * record block, the references, either decision card — would otherwise land on
 * a closed row. On arrival, and on every later hash change, the panel is asked
 * whether it contains the target; if it does, it opens and brings the target
 * into view once the expansion has settled.
 */
export function ResearchRecordDisclosure({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  /* One ref for the panel, shared with the reveal hook — which reads the
     element's own transition to know when the expansion has settled. */
  const { anchorRef, panelRef, reveal } = useDisclosureReveal<
    HTMLButtonElement,
    HTMLDivElement
  >();

  const toggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    reveal(next);
  }, [open, reveal]);

  useEffect(() => {
    let settle = 0;

    const apply = () => {
      const panel = panelRef.current;
      const hash = window.location.hash.slice(1);
      if (!panel || !hash) return;

      let target: HTMLElement | null = null;
      try {
        target =
          panel.id === hash
            ? panel
            : panel.querySelector<HTMLElement>(`#${CSS.escape(hash)}`);
      } catch {
        target = null;
      }
      if (!target) return;

      setOpen(true);
      /* The panel's final height is only known once the expansion finishes,
         so the scroll waits for it rather than aiming at a moving target. */
      const element = target;
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        element.scrollIntoView({ block: "start" });
      }, 380);
    };

    apply();
    window.addEventListener("hashchange", apply);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("hashchange", apply);
    };
    /* `panelRef` is a ref object with a stable identity; it is listed to
       satisfy the rule, not because this effect can re-run. */
  }, [panelRef]);

  return (
    <div className={styles.disclosure}>
      <div className={disclosure.center}>
        <button
          ref={anchorRef}
          type="button"
          id={TOGGLE_ID}
          aria-expanded={open}
          aria-controls={PANEL_ID}
          onClick={toggle}
          data-open={open}
          className={`home-reveal-offset ${disclosure.control}`}
        >
          <span aria-hidden="true" className={disclosure.dot} />
          <span className={disclosure.label}>
            {open ? "Hide the research record" : "Explore the research record"}
          </span>
          <span aria-hidden="true" className={disclosure.mark} />
        </button>
      </div>

      <div
        ref={panelRef}
        id={PANEL_ID}
        role="region"
        aria-labelledby={TOGGLE_ID}
        data-open={open}
        className={styles.region}
      >
        <div className={styles.regionInner}>{children}</div>
      </div>
    </div>
  );
}

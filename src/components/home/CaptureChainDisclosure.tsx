"use client";

import { useEffect, useState } from "react";
import { MovementTeaser } from "@/components/analytics/MovementTeaser";
import styles from "./disclosure.module.css";

/**
 * THE CAPTURE CHAIN, BEHIND ONE ROW.
 * =============================================================================
 * "What can movement tell us?" — pick an input and follow it through signals,
 * measurements, intelligence and the modules that use them. It is the best
 * explanation of the platform on the page and it is about 480px tall, sitting
 * under a workflow stepper that has just explained the pipeline. Two full
 * explanations in a row is how a section becomes a document again.
 *
 * So it is a disclosure now: one row that states what is inside and opens it.
 * That is progressive disclosure in its plainest form — the content is not
 * reduced, deferred to another page or summarised, it is simply not unrolled
 * until somebody wants it.
 *
 * IT IS RENDERED, NOT LAZY-MOUNTED. The panel is in the server-rendered HTML
 * at all times and the closed state is a `hidden` attribute on it, so a
 * crawler and a reader without JavaScript both get the whole chain. That is
 * the deliberate trade: the chain is text and derived lists, which cost
 * nothing to render and everything to hide from a search engine. The workflow
 * films above it are the opposite — expensive, and genuinely mounted one at a
 * time.
 *
 * WHY NOT `<details>`. A controlled `<details>`/`<summary>` fights the
 * browser's own toggle: the element flips its `open` attribute on click before
 * React hears about it, and re-rendering from state then races the native
 * behaviour. A button with `aria-expanded` and `aria-controls` over a region
 * with `hidden` is the same semantics to a screen reader and has one source of
 * truth.
 */
export function CaptureChainDisclosure() {
  const [open, setOpen] = useState(false);

  /* `/#movement-chain` was a real destination before this section existed, and
     things link to it. Arriving on it opens the chain, so the link lands on
     content rather than on a closed row. */
  useEffect(() => {
    const apply = () => {
      if (window.location.hash === "#movement-chain") setOpen(true);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  return (
    <div id="movement-chain" className={`home-section ${styles.disclosure}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="movement-chain"
        onClick={() => setOpen((value) => !value)}
        className={styles.summary}
        data-open={open}
      >
        <span className={styles.summaryCopy}>
          <span className={styles.eyebrow}>What can movement tell us?</span>
          <span className={styles.headline}>
            One signal in. A structured answer out.
          </span>
          <span className={styles.hint}>
            Choose an input and follow it through the platform — the signals it
            carries, the measurements taken, the intelligence applied and the
            modules that use them.
          </span>
        </span>
        <span aria-hidden="true" className={styles.marker}>
          <span className={styles.markerLabel}>
            {open ? "Close" : "Open the chain"}
          </span>
          <span className={styles.chevron} />
        </span>
      </button>

      <div hidden={!open} className={styles.region}>
        <MovementTeaser nested />
      </div>
    </div>
  );
}

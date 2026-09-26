"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { InsightTerm } from "@/data/insight-terms";
import { trackInsightEvent } from "@/lib/insight-events";
import styles from "./experience.module.css";

/**
 * A term in the prose that opens a small explanation.
 *
 * Dotted underline at rest; hover (after a short delay), focus or a tap opens
 * the popover; Escape, a click elsewhere, or moving away closes it. The
 * popover carries the term, one or two sentences, and at most two doors:
 * "See in the Movement Intelligence Lab" and "Open in GaitScape".
 *
 * ON TOUCH the first tap opens the popover and the second closes it — the
 * term is a button, so nothing is wasted. The popover is positioned below
 * the term and shifted left when it would leave the viewport.
 *
 * It is a <button> inside the paragraph; screen readers get the term, its
 * expanded state and the description, and the underlying text is unchanged
 * for search engines.
 */
export function InspectableTerm({
  term,
  articleSlug,
  children,
}: {
  term: InsightTerm;
  articleSlug?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const popRef = useRef<HTMLSpanElement>(null);
  const hoverTimer = useRef<number>(0);
  const id = useId();

  const show = useCallback(() => {
    setOpen(true);
    trackInsightEvent(
      "term_inspected",
      { article_slug: articleSlug ?? "", term: term.id },
      { once: `${articleSlug}:${term.id}` },
    );
  }, [articleSlug, term.id]);

  /* Keep the popover inside the viewport horizontally. */
  useEffect(() => {
    if (!open) return;
    const pop = popRef.current;
    const wrap = wrapRef.current;
    if (!pop || !wrap) return;
    const rect = pop.getBoundingClientRect();
    const margin = 12;
    let shift = 0;
    if (rect.right > window.innerWidth - margin) shift = window.innerWidth - margin - rect.right;
    if (rect.left + shift < margin) shift = margin - rect.left;
    setOffset(shift);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  return (
    <span
      ref={wrapRef}
      className={`${styles.root} ${styles.termWrap}`}
      onMouseEnter={() => {
        hoverTimer.current = window.setTimeout(show, 140);
      }}
      onMouseLeave={() => {
        window.clearTimeout(hoverTimer.current);
      }}
    >
      <button
        type="button"
        className={styles.term}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-describedby={open ? `${id}-def` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onFocus={show}
        onBlur={(event) => {
          /* Closing on blur would kill the links inside; only close when
             focus leaves the whole wrapper. */
          if (!wrapRef.current?.contains(event.relatedTarget as Node)) setOpen(false);
        }}
      >
        {children}
      </button>
      {open && (
        <span
          ref={popRef}
          id={id}
          role="note"
          className={styles.termPop}
          style={{ ["--pop-x" as string]: `${offset}px` }}
        >
          <span className={styles.termPopTerm}>{capitalise(term.term)}</span>
          <span id={`${id}-def`} className={styles.termPopBody}>
            {term.definition}
          </span>
          {term.lab && (
            <Link
              href="/movement-lab/"
              className={styles.termPopLink}
              onClick={() =>
                trackInsightEvent("research_opened", { article_slug: articleSlug ?? "", destination: "lab" })
              }
            >
              See in the Movement Intelligence Lab →
            </Link>
          )}
          {term.gaitscape && (
            <Link
              href={`/gaitscape/?focus=${encodeURIComponent(term.gaitscape)}`}
              className={styles.termPopLink}
              onClick={() =>
                trackInsightEvent("gaitscape_opened", { article_slug: articleSlug ?? "", node: term.gaitscape ?? "" })
              }
            >
              Open in GaitScape →
            </Link>
          )}
        </span>
      )}
    </span>
  );
}

function capitalise(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { trackInsightEvent } from "@/lib/insight-events";
import styles from "./experience.module.css";

export interface VisualMoment {
  id: string;
  title: string;
  text: string;
  visual: ReactNode;
}

/**
 * VISUAL STORY — five to seven moments, one at a time, in a dialog.
 *
 * It complements the article rather than repeating it: each moment is a
 * figure in one specific state with a title and a single line. Previous /
 * Next / Exit, arrow keys, Escape; the dots are buttons so a moment can be
 * jumped to. Nothing autoplays. Focus is trapped inside the panel while it is
 * open and returned to the trigger on exit; the page behind does not scroll.
 *
 * Rendered in a portal so no ancestor `overflow` or `transform` can clip it.
 */
export function VisualStory({
  articleSlug,
  articleTitle,
  moments,
  open,
  onClose,
}: {
  articleSlug: string;
  articleTitle: string;
  moments: VisualMoment[];
  open: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const reached = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  /* Open: remember the trigger, lock scroll, focus the panel, start at 01. */
  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    setIndex(0);
    reached.current = 0;
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    trackInsightEvent("visual_story_open", { article_slug: articleSlug });
    const frame = requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      html.style.overflow = previousOverflow;
      returnTo.current?.focus?.();
    };
  }, [open, articleSlug]);

  const count = moments.length;
  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(count - 1, next));
      setIndex(clamped);
      if (clamped > reached.current) reached.current = clamped;
      if (clamped === count - 1) {
        trackInsightEvent(
          "visual_story_complete",
          { article_slug: articleSlug },
          { once: articleSlug },
        );
      }
    },
    [articleSlug, count],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          onClose();
          return;
        case "ArrowRight":
          event.preventDefault();
          go(index + 1);
          return;
        case "ArrowLeft":
          event.preventDefault();
          go(index - 1);
          return;
        case "Home":
          event.preventDefault();
          go(0);
          return;
        case "End":
          event.preventDefault();
          go(count - 1);
          return;
        case "Tab": {
          /* A minimal focus trap: cycle within the panel. */
          const panel = panelRef.current;
          if (!panel) return;
          const focusable = panel.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
          return;
        }
        default:
          return;
      }
    },
    [count, go, index, onClose],
  );

  if (!open || !mounted || count === 0) return null;
  const moment = moments[index];

  return createPortal(
    <div
      className={`${styles.root} ${styles.storyBackdrop}`}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Visual story: ${articleTitle}`}
        tabIndex={-1}
        className={styles.storyPanel}
        onKeyDown={onKeyDown}
      >
        <div className={styles.storyBar}>
          <p className={styles.storyKicker}>
            <span>Visual story</span>
            <span aria-hidden="true">·</span>
            <span className={styles.storyKickerTitle}>{articleTitle}</span>
          </p>
          <div className="flex items-center gap-3">
            <span className={styles.storyCount} aria-live="polite">
              {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
            <button type="button" onClick={onClose} className={styles.storyExit}>
              Exit visual story
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        </div>

        <div className={styles.storyBody}>
          <div key={moment.id} className={`${styles.storyVisual} ${styles.storyMoment}`}>
            {moment.visual}
          </div>
          <div key={`${moment.id}-text`} className={`${styles.storyText} ${styles.storyMoment}`}>
            <p className={styles.storyIndex}>Moment {String(index + 1).padStart(2, "0")}</p>
            <h2 className={styles.storyTitle}>{moment.title}</h2>
            <p className={styles.storyLine}>{moment.text}</p>
          </div>
        </div>

        <div className={styles.storyControls}>
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            className={styles.storyBtn}
          >
            <span aria-hidden="true">←</span> Previous
          </button>
          <div className={styles.storyDots} role="tablist" aria-label="Moments">
            {moments.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Moment ${i + 1}: ${item.title}`}
                onClick={() => go(i)}
                className={`${styles.storyDot} ${i === index ? styles.storyDotOn : ""} ${
                  i < index ? styles.storyDotDone : ""
                }`}
              />
            ))}
          </div>
          {index < count - 1 ? (
            <button
              type="button"
              onClick={() => go(index + 1)}
              className={`${styles.storyBtn} ${styles.storyBtnPrimary}`}
            >
              Next <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={`${styles.storyBtn} ${styles.storyBtnPrimary}`}
            >
              Back to the article
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

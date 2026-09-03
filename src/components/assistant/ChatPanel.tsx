"use client";

import { useCallback, useEffect, useId, useMemo, useRef } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "./ChatMessages";
import { openingFor, type PageContext } from "./page-context";
import { useAssistant } from "./use-assistant";
import { recordAssistantEvent } from "@/lib/assistant-stats";
import styles from "./assistant.module.css";

/**
 * The expanded assistant.
 *
 * Desktop: a 410px column anchored above the launcher, never covering the
 * navbar. Mobile: a near-full-height sheet with a fixed header, a scrolling
 * transcript and a composer pinned above the safe-area inset — the layout the
 * on-screen keyboard needs, rather than a desktop card squeezed into 320px.
 *
 * ACCESSIBILITY
 *   role="dialog" aria-modal, labelled by the panel's own name
 *   focus moves to the composer on open and returns to the launcher on close
 *   Tab is trapped inside the panel while it is open
 *   Escape closes
 *   the transcript is a polite live region
 *   every animation is dropped under prefers-reduced-motion
 *
 * The page behind it is NOT scroll-locked on desktop: the panel is a companion
 * to the page, and a reader following a link the assistant gave them should be
 * able to keep scrolling. On mobile, where the sheet covers the page, it is.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ChatPanel({
  page,
  onClose,
  onNavigate,
  initialQuestion = "",
}: {
  page: PageContext;
  onClose: () => void;
  onNavigate: (url: string) => void;
  /** Asked once on mount — a question handed over from the search palette. */
  initialQuestion?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();

  const { turns, pending, streaming, ask, retry, reset } = useAssistant(page);
  const opening = useMemo(() => openingFor(page), [page]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* A handed-over question is asked once, on mount. The ref guard matters
     because `ask` is recreated as the thread grows, and an effect keyed on it
     would re-send the same question on every turn. */
  const handedOff = useRef(false);
  useEffect(() => {
    if (handedOff.current || !initialQuestion) return;
    handedOff.current = true;
    submit(initialQuestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  /* Scroll-lock only where the sheet actually covers the page. */
  useEffect(() => {
    const sheet = window.matchMedia("(max-width: 640px)");
    if (!sheet.matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes?.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  /* Every question goes through here, so the counter cannot drift from what
     was actually sent — typed, picked from a suggestion, or handed over. */
  const submit = useCallback(
    (question: string) => {
      recordAssistantEvent("questions", page.pageType);
      ask(question);
    },
    [ask, page.pageType],
  );

  const pick = useCallback(
    (prompt: string) => {
      /* Counted as well as `questions`: which of the two a visitor reaches for
         is the thing worth knowing about the starters. */
      recordAssistantEvent("prompts", page.pageType);
      submit(prompt);
      inputRef.current?.focus();
    },
    [submit, page.pageType],
  );

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={styles.panel}
      onKeyDown={onKeyDown}
    >
      <ChatHeader
        titleId={titleId}
        canReset={turns.length > 0}
        onReset={reset}
        onClose={onClose}
      />

      <ChatMessages
        turns={turns}
        opening={opening}
        pending={pending}
        streaming={streaming}
        onPick={pick}
        onRetry={retry}
        onNavigate={onNavigate}
      />

      <ChatInput disabled={pending} onSend={submit} ref={inputRef} />
    </div>
  );
}

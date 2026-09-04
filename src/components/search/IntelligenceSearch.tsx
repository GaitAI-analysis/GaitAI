"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SEARCH_GROUPS,
  SEARCH_GROUP_LABEL,
  searchEntries,
  searchStarters,
  type SearchEntry,
} from "@/data/search-index";
import {
  ASK_EVENT,
  ASSISTANT_ENABLED,
  type AskEventDetail,
} from "@/components/assistant/config";
import styles from "./search.module.css";

/**
 * Cmd/Ctrl + K over everything the site knows.
 *
 * A palette, not a search page: it opens over the current route, answers in
 * one keystroke, and closes. The index is derived in data/search-index.ts from
 * the canonical sources, so there is no list of search terms to maintain and
 * no second copy of any product name or route.
 *
 * KEYBOARD IS THE POINT
 *   Cmd/Ctrl + K   open from anywhere       ↑ ↓   move through results
 *   /              open when not typing      Enter navigate
 *   Esc            close                     Tab   stays inside the dialog
 *
 * Results are grouped, and the active result is tracked as a FLAT index across
 * groups so ↓ walks the whole list rather than stopping at a group boundary.
 * `aria-activedescendant` points at it, which is how a screen reader follows
 * arrow keys in a combobox without moving focus off the input.
 *
 * The palette mounts nothing until it is opened — no listener beyond the
 * keydown, no index work — and the index itself is a module-level constant, so
 * opening is instant without a fetch.
 */

const MAX_RESULTS = 24;

/** Anything on the page can ask for the palette by dispatching this. */
export const SEARCH_EVENT = "gaitai:open-search";

export function IntelligenceSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  /** Focus returns here on close — the element that had it when we opened. */
  const restoreRef = useRef<HTMLElement | null>(null);

  const results = useMemo(
    () => (query.trim().length >= 2 ? searchEntries(query, MAX_RESULTS) : searchStarters),
    [query],
  );

  /**
   * Results in group order, so rendering and ↑/↓ share one flat sequence.
   *
   * THE GROUPS FOLLOW RELEVANCE WHEN THERE IS A QUERY. `SEARCH_GROUPS` is a
   * fixed most-used-first order, which is right for the resting state — those
   * are starters, and there is nothing to be more or less relevant than. It is
   * wrong the moment someone types: `results` is already ranked, and rendering
   * groups in a fixed order can put the best match below a worse one.
   *
   * It did. Typing "privacy lens" ranked the Privacy Lens first and then drew
   * it under Pages → GaitAI Labs, because `destination` sorts before `lab`. So
   * the top row was the index that merely mentions the lens, the initial
   * highlight sat on it, and pressing Enter went to the wrong page — the exact
   * failure that giving each lab its own row was meant to fix.
   *
   * Groups are therefore ordered by their best-scoring member while a query is
   * active, and by the canonical order otherwise. `results` arrives sorted, so
   * a group's best member is simply the first one that belongs to it.
   */
  const grouped = useMemo(() => {
    const out: { group: SearchEntry["group"]; entries: SearchEntry[] }[] = [];
    for (const group of SEARCH_GROUPS) {
      const entries = results.filter((r) => r.group === group);
      if (entries.length) out.push({ group, entries });
    }
    if (query.trim().length < 2) return out;
    const rank = (group: SearchEntry["group"]) =>
      results.findIndex((entry) => entry.group === group);
    return out.sort((a, b) => rank(a.group) - rank(b.group));
  }, [results, query]);

  const flat = useMemo(() => grouped.flatMap((g) => g.entries), [grouped]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
    restoreRef.current?.focus();
  }, []);

  const go = useCallback(
    (entry: SearchEntry) => {
      close();
      router.push(entry.href);
    },
    [close, router],
  );

  // ── Global shortcut ──
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        /* TWO BUGS LIVED IN THREE LINES HERE.
           `setOpen(v => !v)` closed the palette without going through
           `close()`, so the query and the highlighted row survived — reopening
           showed a stale search and a stale selection. And capturing
           `activeElement` unconditionally overwrote the element to return
           focus to with the palette's OWN input, which is about to unmount;
           a keyboard user pressing ⌘K twice was dropped at the top of the
           document. Closing now takes the same path as Escape, and the
           restore target is only captured on the way in. */
        if (open) {
          close();
        } else {
          restoreRef.current = document.activeElement as HTMLElement;
          setOpen(true);
        }
        return;
      }
      // "/" is a convention worth having, but never while someone is typing
      // into a real field — including this palette's own input.
      if (event.key === "/" && !typing && !open) {
        event.preventDefault();
        restoreRef.current = document.activeElement as HTMLElement;
        setOpen(true);
      }
    };
    /* The navbar's ⌘K affordance opens the same palette through a custom
       event, so the trigger needs no context provider and the palette stays
       the single owner of its own state. */
    const onRequest = () => {
      restoreRef.current = document.activeElement as HTMLElement;
      setOpen(true);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener(SEARCH_EVENT, onRequest);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(SEARCH_EVENT, onRequest);
    };
  }, [open, close]);

  // Focus the input on open; lock the page behind the dialog.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Keep the active row in view as it moves.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (flat.length ? (i + 1) % flat.length : 0));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const entry = flat[active];
      if (entry) go(entry);
    }
  };

  const activeId = flat[active] ? `gs-opt-${flat[active].id}` : undefined;
  let cursor = -1;

  return (
    <div
      className={styles.scrim}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="GaitAI intelligence search"
        className={styles.palette}
        onKeyDown={onKeyDown}
      >
        <div className={styles.inputRow}>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded
            aria-controls="gs-results"
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, capabilities, environments, research…"
            aria-label="Search products, capabilities, environments, research, publications and journal stories"
            className={styles.input}
          />
          <kbd className={styles.esc}>Esc</kbd>
        </div>

        {/* TWO CAPABILITIES, NAMED.
            The palette finds a page; the assistant answers a question. Those
            are different acts and a visitor who typed a QUESTION into a
            find-a-page box has, until now, had no way to discover the second
            one. So the typed text is offered to the assistant verbatim rather
            than being re-run as a different kind of search — nothing is
            removed, and the palette stays the navigation tool it is.

            Rendered only when the assistant is configured; with no endpoint
            there is nothing to hand off to. */}
        {ASSISTANT_ENABLED && (
          <div className={styles.handoff}>
            <span className={styles.handoffLabel}>Search site</span>
            <button
              type="button"
              className={styles.handoffAction}
              onClick={() => {
                const question = query.trim();
                close();
                window.dispatchEvent(
                  new CustomEvent<AskEventDetail>(ASK_EVENT, {
                    detail: question ? { question } : {},
                  }),
                );
              }}
            >
              <span aria-hidden="true" className={styles.handoffMark}>
                ✦
              </span>
              {query.trim() ? "Ask GaitAI this instead" : "Ask GaitAI"}
              <span aria-hidden="true" className={styles.handoffArrow}>
                →
              </span>
            </button>
          </div>
        )}

        {/* THE RESULT COUNT, ANNOUNCED.
            `aria-activedescendant` already announces the row under the arrow
            keys, but nothing announced the LIST changing shape: typing a
            letter that narrowed twenty-four rows to two, or to none, was
            silent. A sighted user sees the list collapse; a screen-reader user
            had to arrow through it to discover what had happened. The
            listbox itself cannot carry `aria-live` — every option would be
            re-announced on each keystroke — so the count lives in its own
            visually-hidden region. Two sibling surfaces on this site already
            do exactly this (FootageMatch, SignalIntelligenceExplorer). */}
        <p aria-live="polite" className="sr-only">
          {query.trim().length < 2
            ? ""
            : flat.length === 0
              ? `No results for ${query}`
              : `${flat.length} result${flat.length === 1 ? "" : "s"} for ${query}`}
        </p>

        <div
          id="gs-results"
          role="listbox"
          aria-label="Search results"
          ref={listRef}
          className={styles.results}
        >
          {query.trim().length >= 2 && flat.length === 0 && (
            <p className={styles.empty}>
              Nothing matches <span className={styles.emptyTerm}>{query}</span>.
              The palette searches the site&apos;s own vocabulary — module
              names, capabilities, environments, records and articles.
            </p>
          )}

          {query.trim().length < 2 && (
            <p className={styles.starterLead}>Start with a flagship module</p>
          )}

          {grouped.map(({ group, entries }) => (
            <div key={group} className={styles.group}>
              <p className={styles.groupLabel} id={`gs-group-${group}`}>
                {SEARCH_GROUP_LABEL[group]}
              </p>
              <ul aria-labelledby={`gs-group-${group}`} className={styles.list}>
                {entries.map((entry) => {
                  cursor += 1;
                  const isActive = cursor === active;
                  const index = cursor;
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        id={`gs-opt-${entry.id}`}
                        role="option"
                        aria-selected={isActive}
                        data-active={isActive}
                        onMouseMove={() => setActive(index)}
                        onClick={() => go(entry)}
                        className={`${styles.option}${isActive ? ` ${styles.optionOn}` : ""}`}
                      >
                        <span className={styles.optionMain}>
                          <span className={styles.optionTitle}>{entry.title}</span>
                          {entry.detail && (
                            <span className={styles.optionDetail}>{entry.detail}</span>
                          )}
                        </span>
                        {entry.meta && (
                          <span className={styles.optionMeta}>{entry.meta}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <span className={styles.hintGroup}>
            <kbd className={styles.key}>↑</kbd>
            <kbd className={styles.key}>↓</kbd>
            move
          </span>
          <span className={styles.hintGroup}>
            <kbd className={styles.key}>Enter</kbd>
            open
          </span>
          <span className={styles.hintGroup}>
            <kbd className={styles.key}>Esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}

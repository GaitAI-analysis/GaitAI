"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackInsightEvent } from "@/lib/insight-events";
import styles from "./experience.module.css";

/**
 * Share a figure in the state the reader left it in.
 *
 * The link is the article URL plus `?f=<figure>&<key>=<value>…#<figure>`. The
 * state is a handful of SHORT PUBLIC VALUES — a stage index, a toggle, a
 * selected point — and nothing else: no uploaded media, no personal data, no
 * file names, no analysis results. `encodeFigureState` refuses anything but
 * short strings, numbers and booleans, so a caller cannot leak by accident.
 *
 * On a device with the Web Share API (phones) the share sheet opens; on a
 * desktop the link is copied and the button says so for two seconds.
 */

export type FigureState = Record<string, string | number | boolean>;

const STATE_KEY_LIMIT = 24;
const STATE_VALUE_LIMIT = 24;

export function encodeFigureState(figureId: string, state: FigureState): string {
  const params = new URLSearchParams();
  params.set("f", figureId);
  for (const [key, value] of Object.entries(state)) {
    if (!/^[a-z][a-z0-9_-]*$/i.test(key) || key.length > STATE_KEY_LIMIT) continue;
    const text = String(value);
    if (text.length > STATE_VALUE_LIMIT || !/^[a-z0-9._,-]*$/i.test(text)) continue;
    params.set(key, text);
  }
  return params.toString();
}

export function buildShareUrl(figureId: string, state: FigureState): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.search = encodeFigureState(figureId, state);
  url.hash = figureId;
  return url.toString();
}

/**
 * Read a shared state for one figure from the page URL, once, on mount.
 * Returns `null` when the URL is not for this figure.
 */
export function useSharedFigureState(figureId: string): FigureState | null {
  const [state, setState] = useState<FigureState | null>(null);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("f") !== figureId) return;
      const next: FigureState = {};
      params.forEach((value, key) => {
        if (key === "f") return;
        if (key.length > STATE_KEY_LIMIT || value.length > STATE_VALUE_LIMIT) return;
        next[key] = /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
      });
      setState(next);
    } catch {
      /* A malformed query is simply not a shared state. */
    }
  }, [figureId]);
  return state;
}

export function ShareInsight({
  figureId,
  state,
  label = "Share this insight",
  title,
  articleSlug,
}: {
  figureId: string;
  state: FigureState;
  label?: string;
  /** Title for the native share sheet. Defaults to the document title. */
  title?: string;
  articleSlug?: string;
}) {
  const [done, setDone] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const share = useCallback(async () => {
    const url = buildShareUrl(figureId, state);
    if (!url) return;
    const shareTitle = title ?? document.title;
    let method = "copy";
    try {
      const nav = navigator as Navigator & {
        share?: (data: { url: string; title: string }) => Promise<void>;
        canShare?: (data: { url: string; title: string }) => boolean;
      };
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      if (coarse && nav.share && (!nav.canShare || nav.canShare({ url, title: shareTitle }))) {
        await nav.share({ url, title: shareTitle });
        method = "native";
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch (error) {
      /* AbortError is the reader closing the sheet — not a failure. Anything
         else falls back to the clipboard, and if that fails too, we still
         show the link so it can be copied by hand. */
      if ((error as { name?: string })?.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          window.prompt("Copy this link", url);
        }
      } else {
        return;
      }
    }
    setDone(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDone(false), 2200);
    trackInsightEvent("insight_shared", {
      figure: figureId,
      article: articleSlug ?? "",
      method,
    });
  }, [articleSlug, figureId, state, title]);

  return (
    <button
      type="button"
      onClick={share}
      className={`${styles.share} ${done ? styles.shareDone : ""}`}
      aria-live="polite"
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" className={styles.shareMark}>
        {done ? (
          <path
            d="M3 8.5l3 3 7-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <>
            <path
              d="M6.5 9.5l3-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M7 5.2l1.6-1.6a2.4 2.4 0 0 1 3.4 3.4L10.4 8.6M9 10.8l-1.6 1.6a2.4 2.4 0 0 1-3.4-3.4L5.6 7.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
      {done ? "Link copied" : label}
    </button>
  );
}

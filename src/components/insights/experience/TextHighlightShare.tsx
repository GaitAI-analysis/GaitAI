"use client";

import { useEffect, useRef, useState } from "react";
import { trackInsightEvent } from "@/lib/insight-events";
import styles from "./experience.module.css";

/**
 * Copy · Share — a small control that appears above a text selection inside
 * the article body.
 *
 * It does not interfere with the native selection: it waits for `selectionchange`
 * to settle and for the pointer to lift, then positions itself over the
 * selected range. Selections under 12 characters, outside the article, or
 * inside a form control get nothing.
 *
 * SHARE builds a link to the passage using a text fragment (`#:~:text=`), so
 * the browser opening it scrolls to and highlights the words — the passage
 * is public article text, which is the only thing the link carries. What is
 * NOT done: the selected text is never sent anywhere or recorded; the
 * analytics event says only that a selection was shared.
 */
export function TextHighlightShare({ articleId }: { articleId: string }) {
  const [box, setBox] = useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = useState<"copy" | "share" | null>(null);
  const text = useRef("");
  const timer = useRef(0);

  useEffect(() => {
    const article = document.getElementById(articleId);
    if (!article) return;
    let pointerDown = false;

    const hide = () => setBox(null);
    const evaluate = () => {
      if (pointerDown) return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        hide();
        return;
      }
      const range = selection.getRangeAt(0);
      const content = selection.toString().trim();
      if (content.length < 12 || content.length > 600) {
        hide();
        return;
      }
      if (!article.contains(range.commonAncestorContainer)) {
        hide();
        return;
      }
      const anchor = range.startContainer.parentElement;
      if (anchor?.closest("input, textarea, button, [contenteditable]")) {
        hide();
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        hide();
        return;
      }
      text.current = content;
      setBox({ x: rect.left + rect.width / 2, y: Math.max(56, rect.top) });
    };

    const onDown = () => {
      pointerDown = true;
    };
    const onUp = () => {
      pointerDown = false;
      window.setTimeout(evaluate, 10);
    };
    const onSelection = () => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(evaluate, 120);
    };
    const onScroll = () => hide();

    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("selectionchange", onSelection);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer.current);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("selectionchange", onSelection);
      window.removeEventListener("scroll", onScroll);
    };
  }, [articleId]);

  if (!box) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`“${text.current}”\n— ${document.title}\n${location.href.split("#")[0]}`);
      setCopied("copy");
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      /* Clipboard blocked: the native selection is still there to copy. */
    }
  };

  const share = async () => {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = `:~:text=${encodeURIComponent(text.current.slice(0, 200))}`;
    const link = url.toString();
    try {
      const nav = navigator as Navigator & { share?: (data: { url: string; title: string }) => Promise<void> };
      if (window.matchMedia("(pointer: coarse)").matches && nav.share) {
        await nav.share({ url: link, title: document.title });
      } else {
        await navigator.clipboard.writeText(link);
      }
      setCopied("share");
      window.setTimeout(() => setCopied(null), 1600);
      trackInsightEvent("insight_shared", { method: "selection" });
    } catch {
      /* Dismissed or blocked. */
    }
  };

  return (
    <div
      role="toolbar"
      aria-label="Selection"
      className={`${styles.root} ${styles.selectionBar}`}
      style={{ left: box.x, top: box.y }}
      /* Keep the selection alive when the control itself is pressed. */
      onPointerDown={(event) => event.preventDefault()}
    >
      <button type="button" className={styles.selectionBtn} onClick={copy}>
        {copied === "copy" ? "Copied" : "Copy"}
      </button>
      <button type="button" className={styles.selectionBtn} onClick={share}>
        {copied === "share" ? "Link copied" : "Share"}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { getInsightContext, setInsightContext, trackInsightEvent } from "@/lib/insight-events";
import { TwoMinute } from "../TwoMinute";
import { VisualStory, type VisualMoment } from "./VisualStory";
import styles from "./experience.module.css";

type Mode = "read" | "essentials" | "story";

/**
 * READ · X MIN  /  ESSENTIALS · 2 MIN  /  VISUAL STORY
 *
 * Three ways into the same article, offered once, under the opening. READ is
 * the default and changes nothing. ESSENTIALS opens the existing 2-minute
 * version — the same `TwoMinute` component the article has always carried,
 * now controlled from here as well as by its own summary row. VISUAL STORY
 * opens the guided sequence and returns to READ on exit. Nothing is hidden
 * behind any mode: the full essay is always below.
 */
export function ArticleReadingModes({
  articleSlug,
  articleTitle,
  readMinutes,
  twoMinute,
  moments,
}: {
  articleSlug: string;
  articleTitle: string;
  readMinutes: number;
  twoMinute: string[];
  moments: VisualMoment[];
}) {
  const [mode, setMode] = useState<Mode>("read");
  const essentialsOpen = mode === "essentials";

  const choose = (next: Mode) => {
    setMode(next);
    /* The mode travels with every later event on this page, so the dashboard
       can tell whether a figure was used from the essay or the Visual Story. */
    setInsightContext({ ...getInsightContext(), reading_mode: next });
    trackInsightEvent("reading_mode_changed", { article_slug: articleSlug, reading_mode: next });
  };

  return (
    <div className={styles.root}>
      <div className={styles.modes} role="group" aria-label="Reading modes">
        <button
          type="button"
          aria-pressed={mode === "read"}
          onClick={() => choose("read")}
          className={`${styles.mode} ${mode === "read" ? styles.modeOn : ""}`}
        >
          <span className={styles.modeName}>Read · {readMinutes} min</span>
          <span className={styles.modeMeta}>The full article</span>
        </button>
        <button
          type="button"
          aria-pressed={essentialsOpen}
          aria-controls="article-essentials"
          onClick={() => choose(essentialsOpen ? "read" : "essentials")}
          className={`${styles.mode} ${essentialsOpen ? styles.modeOn : ""}`}
        >
          <span className={styles.modeName}>Essentials · 2 min</span>
          <span className={styles.modeMeta}>The argument in {twoMinute.length} points</span>
        </button>
        {moments.length > 0 && (
          <button
            type="button"
            aria-pressed={mode === "story"}
            aria-haspopup="dialog"
            onClick={() => choose("story")}
            className={`${styles.mode} ${styles.modeStory} ${mode === "story" ? styles.modeOn : ""}`}
          >
            <span className={styles.modeName}>Visual story</span>
            <span className={styles.modeMeta}>{moments.length} guided moments</span>
          </button>
        )}
      </div>

      <div id="article-essentials" className={styles.essentials}>
        <TwoMinute
          points={twoMinute}
          open={essentialsOpen}
          onToggle={(next) => setMode(next ? "essentials" : "read")}
        />
      </div>

      <VisualStory
        articleSlug={articleSlug}
        articleTitle={articleTitle}
        moments={moments}
        open={mode === "story"}
        onClose={() => setMode("read")}
      />
    </div>
  );
}

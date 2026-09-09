"use client";

import { useCallback, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import type { PublicationStory } from "@/lib/publication";
import type { ArticleStats } from "@/lib/article-stats";
import { getInsightBySlug } from "@/data/insights";
import { trackInsightEvent } from "@/lib/insight-events";
import { InsightCard } from "./InsightCard";
import styles from "./hub.module.css";

/**
 * THE FOUNDATIONS EXPLORER — an interactive table of contents.
 *
 *   FOUNDATIONS                          ┌──────────────────────────────┐
 *   Five interactive essays …           │  the selected story's card,  │
 *   ● 01 How movement becomes …  ──────▶│  with its own interaction    │
 *     02 Why gait is more than …         │                              │
 *     03 Why privacy belongs …           │  Read the story →            │
 *     04 Why change over time …          └──────────────────────────────┘
 *     05 How to audit …
 *   Begin the path →
 *
 * The five rows are tabs (a real selection control: arrow keys, Home/End,
 * Enter or Space to open the selected story). Hover previews on a mouse;
 * focus previews on a keyboard; a tap previews on touch. The right panel is
 * the story's own card — the same drawing and mini interaction it has
 * everywhere else on the hub — so each of the five looks like itself, and
 * it crossfades in ~360ms (instantly under reduced motion). One quiet
 * live-region sentence announces the change.
 */
export function FoundationsExplorer({
  foundations,
  stats,
  initialSlug,
}: {
  foundations: PublicationStory[];
  stats: Record<string, ArticleStats>;
  initialSlug?: string;
}) {
  const router = useRouter();
  const reduced = Boolean(useReducedMotion());
  const id = useId();
  const [selected, setSelected] = useState(() => initialSlug ?? foundations[foundations.length - 1]?.slug ?? "");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  /* When the selection last changed. A tap focuses a row (which previews it)
     and then clicks it a few milliseconds later; that click must not count
     as "already previewing, so open it". Only a click on a row that has been
     the preview for a moment opens the story. */
  const selectedAt = useRef(0);
  const index = Math.max(0, foundations.findIndex((story) => story.slug === selected));
  const story = foundations[index];
  const article = story ? getInsightBySlug(story.slug) : undefined;

  const select = useCallback((next: number, source: "hover" | "focus" | "tap" | "keys") => {
    const target = foundations[next];
    if (!target) return;
    setSelected((current) => {
      if (current !== target.slug) selectedAt.current = performance.now();
      return target.slug;
    });
    trackInsightEvent("foundation_preview_selected", { article: target.slug, source }, { once: `${target.slug}:${source}` });
  }, [foundations]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let next: number | null = null;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        next = (index + 1) % foundations.length;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        next = (index - 1 + foundations.length) % foundations.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = foundations.length - 1;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (story) router.push(story.href);
        return;
      default:
        return;
    }
    event.preventDefault();
    select(next, "keys");
    tabRefs.current[next]?.focus();
  };

  if (!story) return null;
  const first = foundations[0];
  const panelId = `${id}-panel`;

  return (
    <div className={styles.explorer}>
      {/* ── the index ── */}
      <div className={styles.explorerIndex}>
        <p className={styles.foundationsKicker}>Foundations</p>
        <p className={styles.foundationsTitle}>
          Five interactive essays on how human movement becomes machine-readable intelligence.
        </p>
        <p className={styles.foundationsBody}>
          Choose a story to preview it. Read them in order, from a walking video to an audited
          multimodal claim — or start anywhere.
        </p>

        <div
          role="tablist"
          aria-label="GaitAI Foundations"
          aria-orientation="vertical"
          className={styles.explorerTabs}
          onKeyDown={onKeyDown}
        >
          {foundations.map((item, i) => {
            const on = i === index;
            const step = String(item.seriesOrder ?? i + 1).padStart(2, "0");
            const record = getInsightBySlug(item.slug);
            return (
              <button
                key={item.slug}
                ref={(element) => {
                  tabRefs.current[i] = element;
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${i}`}
                aria-selected={on}
                aria-controls={panelId}
                tabIndex={on ? 0 : -1}
                className={`${styles.explorerRow} ${on ? styles.explorerRowOn : ""}`}
                onPointerEnter={(event: PointerEvent<HTMLButtonElement>) => {
                  if (event.pointerType === "mouse") select(i, "hover");
                }}
                onFocus={() => select(i, "focus")}
                onClick={() => {
                  /* Already previewing this one for a moment: this press opens
                     it. A press that only just selected it (focus, then click)
                     stays a preview. */
                  if (on && performance.now() - selectedAt.current > 600) router.push(item.href);
                  else select(i, "tap");
                }}
              >
                <span aria-hidden="true" className={styles.explorerMark} />
                <span className={styles.explorerIndexNo}>{step}</span>
                <span className={styles.explorerLabel}>{record?.seriesTitle ?? item.title}</span>
              </button>
            );
          })}
        </div>

        {first && (
          <Link
            href={first.href}
            className={styles.foundationsCta}
            onClick={(event) => {
              /* First press selects Foundation 01 in the preview; when it is
                 already the one previewed, the link opens it. */
              if (index !== 0) {
                event.preventDefault();
                select(0, "tap");
                tabRefs.current[0]?.focus();
              }
            }}
          >
            Begin the path <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>

      {/* ── the preview ── */}
      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={`${id}-tab-${index}`}
        className={styles.explorerPreview}
      >
        <div key={story.slug} className={reduced ? undefined : styles.previewEnter}>
          <InsightCard
            story={story}
            step={story.seriesOrder}
            views={stats[story.slug]?.views}
            preview
          />
        </div>
        <p className="sr-only" aria-live="polite">
          Previewing Foundations {String(story.seriesOrder ?? index + 1).padStart(2, "0")}: {story.title}.
          {article ? ` ${article.question}` : ""}
        </p>
      </div>
    </div>
  );
}

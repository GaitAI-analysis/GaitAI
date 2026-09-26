"use client";

import Link from "next/link";
import { pageHref } from "@/lib/publication";
import styles from "./archive.module.css";

/**
 * THE TRANSITION TO OLDER STORIES — pagination as a moment in the journal,
 * not a widget after it.
 *
 *   NEWER                    01 / 02                    OLDER
 *   ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━○
 *   01                                                    02
 *   CURRENT STORIES                          OLDER STORIES →
 *
 * One track runs from the newest page to the oldest; every page is a node on
 * it and the current one is lit in cyan. The words say where the reader is
 * and where the rest is. On hover or focus of a link a small signal travels
 * the track from the current node towards the destination — once, quietly,
 * and not at all under reduced motion.
 *
 * The routes stay crawlable: `/insights/` and `/insights/page/2/` are real
 * links whenever the browser is on a routed page; inside a filtered view
 * (which is not routed) the same controls are buttons.
 *
 * On a phone the nodes are not tap targets — a 6px dot is not one — so the
 * track becomes decoration and the row reads `← NEWER · 1 / 2 · OLDER →`.
 */
/** Bounded page list: every page up to seven, then first, last and the current neighbourhood. */
function navPages(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const values = new Set([1, total, current - 1, current, current + 1]);
  const ordered = [...values].filter((value) => value > 0 && value <= total).sort((a, b) => a - b);
  const output: Array<number | "ellipsis"> = [];
  ordered.forEach((value, index) => {
    if (index > 0 && value - ordered[index - 1] > 1) output.push("ellipsis");
    output.push(value);
  });
  return output;
}

export function PublicationPagination({
  page,
  total,
  basePath,
  routed,
  onChange,
}: {
  page: number;
  total: number;
  basePath: string;
  routed: boolean;
  onChange: (page: number) => void;
}) {
  if (total < 2) return null;
  const pad = (value: number) => String(value).padStart(2, "0");
  const stops = navPages(page, total);
  /* Node positions along the track, as percentages; an ellipsis takes a slot
     too, so the spacing stays even. */
  const at = (index: number) => (stops.length === 1 ? 50 : (index / (stops.length - 1)) * 100);
  const activeIndex = stops.indexOf(page);
  const nextIndex = stops.indexOf(page + 1);
  const prevIndex = stops.indexOf(page - 1);
  const signalStyle = {
    "--pg-from": `${at(activeIndex)}%`,
    "--pg-to-older": `${at(nextIndex >= 0 ? nextIndex : activeIndex)}%`,
    "--pg-to-newer": `${at(prevIndex >= 0 ? prevIndex : activeIndex)}%`,
  } as React.CSSProperties;

  const go = (target: number, className: string, label: React.ReactNode, aria?: string, current?: boolean) =>
    routed ? (
      <Link href={pageHref(basePath, target)} className={className} aria-label={aria} aria-current={current ? "page" : undefined}>
        {label}
      </Link>
    ) : (
      <button type="button" onClick={() => onChange(target)} className={className} aria-label={aria} aria-current={current ? "page" : undefined}>
        {label}
      </button>
    );

  return (
    <nav className={styles.pagination} aria-label={`Publication pages, page ${page} of ${total}`} style={signalStyle}>
      {/* the rail: which way is which, and where we are */}
      <div className={styles.pageRail} aria-hidden="true">
        <span className={styles.pageEnd}>Newer</span>
        <span className={styles.pageState}>
          <b>{pad(page)}</b> / {pad(total)}
        </span>
        <span className={styles.pageEnd}>Older</span>
      </div>

      {/* the track: one node per page, the current one lit */}
      <div className={styles.pageTrack}>
        <span className={styles.pageTrackLine} aria-hidden="true" />
        <span className={styles.pageTrackSignal} aria-hidden="true" />
        <ol className={styles.pageNodes}>
          {stops.map((stop, index) =>
            stop === "ellipsis" ? (
              <li key={`gap-${index}`} className={styles.pageNodeGap} style={{ left: `${at(index)}%` }} aria-hidden="true">
                ···
              </li>
            ) : (
              <li key={stop} className={styles.pageNodeSlot} style={{ left: `${at(index)}%` }}>
                {go(
                  stop,
                  `${styles.pageNode} ${stop === page ? styles.pageNodeOn : ""}`,
                  <>
                    <span className={styles.pageDot} aria-hidden="true" />
                    <span className={styles.pageNo} aria-hidden="true">
                      {pad(stop)}
                    </span>
                  </>,
                  stop === page ? `Page ${stop}, current page` : `Page ${stop}`,
                  stop === page,
                )}
              </li>
            ),
          )}
        </ol>
      </div>

      {/* the words: where this collection is, and where the rest is */}
      <div className={styles.pageWords}>
        {page > 1 ? (
          go(page - 1, `${styles.pageWord} ${styles.pageWordLink}`, <>← Newer stories</>, `Newer stories, page ${page - 1}`)
        ) : (
          <span className={styles.pageWord}>Current stories</span>
        )}
        <span className={`${styles.pageState} ${styles.pageStateInline}`} aria-hidden="true">
          {page} / {total}
        </span>
        {page < total ? (
          go(page + 1, `${styles.pageWord} ${styles.pageWordLink} ${styles.pageWordOlder}`, <>Older stories →</>, `Older stories, page ${page + 1}`)
        ) : (
          <span className={`${styles.pageWord} ${styles.pageWordOlder}`}>Oldest stories</span>
        )}
      </div>
    </nav>
  );
}

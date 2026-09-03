"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  EVIDENCE_LABEL,
  TALK_KIND_LABEL,
  TALK_KIND_PLURAL,
  researchAreaForTalk,
  talkAnchor,
  talkByAnchor,
  talkKindsPresent,
  talkThreads,
  talksNewestFirst,
  type TalkKind,
  type TalkRecord,
} from "@/data/talks";
import styles from "./talks.module.css";

/**
 * THE RESEARCH LINE — research moving through time.
 * =============================================================================
 * The Journal's signal is one thread drawn through ideas as a reader scrolls.
 * This is its counterpart for a dated record: one thin line running down the
 * page, with every talk a node on it, illuminating from the top as the visitor
 * moves through the years. Same grammar — a continuous line, a progress
 * variable, geometry instead of icons — deliberately not the same layout.
 *
 * WHY THIS AND NOT A CV TIMELINE
 * A year column on the left and a stack of paragraphs on the right is the
 * shape of a résumé, and it makes twenty-two records read as a list of
 * credentials. Here the line is the subject: the year sits ON it, each record
 * hangs off it by a short branch, and nothing but the type, the title and the
 * venue is shown until a reader asks for more. The record is identical; the
 * page stops asserting it at you all at once.
 *
 * HOW THE LINE WORKS
 * One passive scroll listener, throttled to a frame, writes `--tl` (0 → 1) on
 * the container. The illuminated overlay is a single absolutely-positioned
 * element with `height: calc(var(--tl) * 100%)`, so no path measuring, no
 * per-node observers, and a filter change that reflows the list needs no
 * recalculation at all. Under `prefers-reduced-motion` the line is simply
 * drawn in full and never animates.
 *
 * GEOMETRY, NOT ICONS
 * Four kinds, four marks, all CSS: a filled disc for an invited talk, a
 * rotated square for a conference presentation, a ring for a paper
 * presentation, a square for the poster. No microphones, no podiums, no
 * calendars. The shapes are decorative — every kind is also stated in words on
 * the record itself, so nothing depends on reading a shape.
 */

type View = "timeline" | "threads";
type Filter = TalkKind | "all";

/* The mark each kind gets on the line. Class names only — the shapes are
   drawn in CSS so they scale with the type and inherit the line's colour. */
const KIND_MARK: Record<TalkKind, string> = {
  "invited-talk": styles.markDisc,
  presentation: styles.markDiamond,
  "conference-presentation": styles.markRing,
  poster: styles.markSquare,
};

export function TalksTimeline() {
  const [view, setView] = useState<View>("timeline");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const shown = useMemo(
    () =>
      filter === "all"
        ? talksNewestFirst
        : talksNewestFirst.filter((t) => t.kind === filter),
    [filter],
  );

  /* Grouped by year for the timeline view. A Map keeps insertion order and the
     source list is already newest-first, so no second sort. */
  const years = useMemo(() => {
    const map = new Map<number, TalkRecord[]>();
    for (const t of shown) {
      if (!map.has(t.year)) map.set(t.year, []);
      map.get(t.year)!.push(t);
    }
    return [...map.entries()];
  }, [shown]);

  const threads = useMemo(
    () =>
      filter === "all"
        ? talkThreads
        : talkThreads
            .map((thread) => ({
              ...thread,
              talks: thread.talks.filter((t) => t.kind === filter),
            }))
            .filter((thread) => thread.talks.length > 0),
    [filter],
  );

  // ── Scroll progress ───────────────────────────────────────────────────────
  useEffect(() => {
    const host = railRef.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const settle = () => {
      /* Reduced motion gets the finished picture, not a blank line that never
         fills because nothing is allowed to animate. */
      host.style.setProperty("--tl", "1");
    };

    if (reduced.matches) {
      settle();
      return;
    }

    let frame = 0;
    const measure = () => {
      frame = 0;
      const box = host.getBoundingClientRect();
      /* Progress is measured to a point a third of the way up the viewport —
         where a reader's eye actually is, rather than at the fold. */
      const eye = window.innerHeight * 0.38;
      const span = box.height - eye;
      const done = eye - box.top;
      const p = span > 0 ? Math.min(1, Math.max(0, done / span)) : 1;
      host.style.setProperty("--tl", p.toFixed(4));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    reduced.addEventListener("change", (e) => (e.matches ? settle() : measure()));

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [view, filter]);

  // ── Deep links ────────────────────────────────────────────────────────────
  /*
   * /research/talks/#electronic-commerce-2010 opens that record.
   *
   * Runs on mount and on hashchange. The scroll is deferred a frame so the
   * expansion has laid out before the browser is asked to bring it into view —
   * otherwise it scrolls to where the collapsed row used to be.
   */
  const openAnchor = useCallback((hash: string) => {
    const anchor = decodeURIComponent(hash.replace(/^#/, ""));
    const talk = talkByAnchor.get(anchor);
    if (!talk) return;

    /* A deep-linked record must be visible whatever the filter would hide. */
    setFilter("all");
    setView("timeline");
    setOpen(talk.id);

    window.requestAnimationFrame(() => {
      document
        .getElementById(anchor)
        ?.scrollIntoView({ block: "center", behavior: "auto" });
    });
  }, []);

  useEffect(() => {
    if (window.location.hash) openAnchor(window.location.hash);
    const onHash = () => openAnchor(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [openAnchor]);

  const toggle = (talk: TalkRecord) =>
    setOpen((current) => (current === talk.id ? null : talk.id));

  return (
    <div className={styles.stage}>
      {/* ── Controls ── */}
      <div className={styles.controls}>
        <div className={styles.views} role="group" aria-label="Arrangement">
          <ViewTab
            active={view === "timeline"}
            onClick={() => setView("timeline")}
            label="Timeline"
          />
          <ViewTab
            active={view === "threads"}
            onClick={() => setView("threads")}
            label="Research threads"
          />
        </div>

        <div className={styles.filters} role="group" aria-label="Filter by kind">
          <FilterTab
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="All"
            count={talksNewestFirst.length}
          />
          {talkKindsPresent.map((k) => (
            <FilterTab
              key={k}
              active={filter === k}
              onClick={() => setFilter(k)}
              label={TALK_KIND_PLURAL[k]}
              count={talksNewestFirst.filter((t) => t.kind === k).length}
            />
          ))}
        </div>
      </div>

      {/* Filter and view changes are silent visual events otherwise. */}
      <p className="sr-only" role="status">
        {view === "timeline"
          ? `${shown.length} records, newest first`
          : `${threads.length} research threads`}
      </p>

      {/* ── The line ── */}
      <div ref={railRef} className={styles.rail} data-view={view}>
        <span aria-hidden="true" className={styles.railTrack} />
        <span aria-hidden="true" className={styles.railLit} />

        {view === "timeline" ? (
          <ol className={styles.years}>
            {years.map(([year, records]) => (
              <li key={year} className={styles.yearGroup}>
                <p className={styles.year}>
                  <span aria-hidden="true" className={styles.yearMark} />
                  <span className={styles.yearLabel}>{year}</span>
                </p>

                <ol className={styles.records}>
                  {records.map((talk) => (
                    <RecordRow
                      key={talk.id}
                      talk={talk}
                      open={open === talk.id}
                      onToggle={() => toggle(talk)}
                    />
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        ) : (
          <ol className={styles.threads}>
            {threads.map((thread) => (
              <li key={thread.id} className={styles.threadGroup}>
                <div className={styles.threadHead}>
                  <span aria-hidden="true" className={styles.yearMark} />
                  <div className={styles.threadHeadText}>
                    <h3 className={styles.threadTitle}>{thread.title}</h3>
                    <p className={styles.threadSummary}>{thread.summary}</p>
                    <p className={styles.threadSpan}>
                      {thread.talks.length}{" "}
                      {thread.talks.length === 1 ? "record" : "records"}
                      <span aria-hidden="true"> · </span>
                      {thread.talks[thread.talks.length - 1].year}–
                      {thread.talks[0].year}
                    </p>
                  </div>
                </div>

                <ol className={styles.records}>
                  {thread.talks.map((talk) => (
                    <RecordRow
                      key={talk.id}
                      talk={talk}
                      open={open === talk.id}
                      onToggle={() => toggle(talk)}
                      showYear
                    />
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

function ViewTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${styles.viewTab} ${active ? styles.tabOn : ""}`}
    >
      {label}
    </button>
  );
}

function FilterTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${styles.filterTab} ${active ? styles.tabOn : ""}`}
    >
      {label}
      <span aria-hidden="true" className={styles.tabCount}>
        {count}
      </span>
    </button>
  );
}

// ── One record ──────────────────────────────────────────────────────────────

/**
 * Collapsed: kind, date, title, venue, and an affordance.
 * Expanded: the description, the research relation and the source evidence.
 *
 * The whole row is one <button>, so it is reachable and operable from the
 * keyboard with no extra handling, and `aria-expanded` states what activating
 * it does. The expanded panel is a sibling rather than a child of the button,
 * because links inside a button are not operable.
 *
 * The height transition animates `grid-template-rows: 0fr → 1fr`, which is the
 * one way to animate to intrinsic height without measuring anything or pinning
 * a max-height that clips a long description.
 */
function RecordRow({
  talk,
  open,
  onToggle,
  showYear = false,
}: {
  talk: TalkRecord;
  open: boolean;
  onToggle: () => void;
  showYear?: boolean;
}) {
  const area = researchAreaForTalk(talk);
  const anchor = talkAnchor(talk);
  const panelId = `${anchor}-panel`;

  return (
    <li id={anchor} className={styles.record} data-open={open}>
      <span aria-hidden="true" className={`${styles.mark} ${KIND_MARK[talk.kind]}`} />
      <span aria-hidden="true" className={styles.branch} />

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={styles.head}
      >
        <span className={styles.meta}>
          <span className={styles.kind}>{TALK_KIND_LABEL[talk.kind]}</span>
          {(talk.date || showYear) && (
            <>
              <span aria-hidden="true" className={styles.metaDot}>
                ·
              </span>
              <span className={styles.date}>{talk.date ?? talk.year}</span>
            </>
          )}
        </span>

        <span className={styles.title}>{talk.title}</span>

        {(talk.event || talk.venue) && (
          <span className={styles.where}>
            {talk.event}
            {talk.event && talk.venue && <span aria-hidden="true"> · </span>}
            {talk.venue}
          </span>
        )}

        <span aria-hidden="true" className={styles.disclose}>
          {open ? "Collapse" : "Explore session"}
          <span className={styles.discloseMark}>{open ? "↑" : "→"}</span>
        </span>
      </button>

      {/* Always rendered, so the panel's own content is in the document for
          search and for a no-JS reader; `visibility` is what removes it from
          the tab order while it is closed. */}
      <div id={panelId} className={styles.panel} data-open={open}>
        <div className={styles.panelInner}>
          {talk.description && <p className={styles.desc}>{talk.description}</p>}

          {(area || talk.evidence.length > 0) && (
            <div className={styles.relations}>
              {/* Only where the work IS that research — talks.ts never infers
                  a relation from wording. */}
              {area && (
                <p className={styles.relation}>
                  <span className={styles.relationLabel}>Related research</span>
                  <Link
                    href="/research/evidence/"
                    className={styles.relationLink}
                    tabIndex={open ? 0 : -1}
                  >
                    {area.title}
                    <span aria-hidden="true"> →</span>
                  </Link>
                </p>
              )}

              {talk.evidence.length > 0 && (
                <p className={styles.relation}>
                  <span className={styles.relationLabel}>Evidence</span>
                  {talk.evidence.map((e) => (
                    <a
                      key={e.href}
                      href={e.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.relationLink}
                      tabIndex={open ? 0 : -1}
                    >
                      {EVIDENCE_LABEL[e.kind]}
                      <span aria-hidden="true"> ↗</span>
                    </a>
                  ))}
                </p>
              )}
            </div>
          )}

          <p className={styles.permalink}>
            <a
              href={`#${anchor}`}
              className={styles.permalinkLink}
              tabIndex={open ? 0 : -1}
            >
              Link to this record
            </a>
          </p>
        </div>
      </div>
    </li>
  );
}

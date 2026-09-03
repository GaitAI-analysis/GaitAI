"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  EVIDENCE_LABEL,
  TALK_KIND_LABEL,
  TALK_KIND_PLURAL,
  researchAreaForTalk,
  talkKindsPresent,
  talksNewestFirst,
  type TalkKind,
  type TalkRecord,
} from "@/data/talks";
import styles from "./talks.module.css";

/**
 * The speaking record, as a dated editorial timeline.
 *
 * NOT A CV LIST, AND NOT A CARD GRID. The organising idea is the one thing
 * every record actually shares: a year. So the year is the spine — set large
 * in the margin, printed once per group — and each record hangs off it on a
 * hairline. That is the shape of a research log, and it is what stops 23
 * academic entries reading as a résumé dump.
 *
 * FILTERS ONLY FOR KINDS THAT EXIST. `talkKindsPresent` is derived from the
 * records, so a category with nothing in it is never offered. There is no
 * "Recorded talks" or "Technical demos" filter because neither source carries
 * a recording or a demo for any record — an empty tab that always says "none"
 * is a worse answer than no tab.
 *
 * EVERY LINK IS SOURCE EVIDENCE. A record shows exactly the artefacts the
 * source links: slides, a certificate, the paper, the poster PDF, a
 * photograph. Nothing is offered that does not resolve, and there is no
 * "watch" control anywhere.
 */
export function TalkRecordList() {
  const [kind, setKind] = useState<TalkKind | "all">("all");

  const shown = useMemo(
    () =>
      kind === "all"
        ? talksNewestFirst
        : talksNewestFirst.filter((t) => t.kind === kind),
    [kind],
  );

  /* Group by year for the spine. A Map preserves insertion order, and the
     list is already newest-first. */
  const years = useMemo(() => {
    const map = new Map<number, TalkRecord[]>();
    for (const t of shown) {
      if (!map.has(t.year)) map.set(t.year, []);
      map.get(t.year)!.push(t);
    }
    return [...map.entries()];
  }, [shown]);

  return (
    <div>
      <div className={styles.filters} role="group" aria-label="Filter by kind">
        <FilterChip
          active={kind === "all"}
          onClick={() => setKind("all")}
          label="All"
          count={talksNewestFirst.length}
        />
        {talkKindsPresent.map((k) => (
          <FilterChip
            key={k}
            active={kind === k}
            onClick={() => setKind(k)}
            label={TALK_KIND_PLURAL[k]}
            count={talksNewestFirst.filter((t) => t.kind === k).length}
          />
        ))}
      </div>

      {/* The count is announced, so a filter change is not a silent visual
          event for a screen-reader user. */}
      <p className="sr-only" role="status">
        {shown.length} records shown
      </p>

      <ol className={styles.timeline}>
        {years.map(([year, records]) => (
          <li key={year} className={styles.yearGroup}>
            <div className={styles.yearSpine}>
              <span className={styles.year}>{year}</span>
              <span aria-hidden="true" className={styles.yearRule} />
            </div>

            <ol className={styles.records}>
              {records.map((talk) => (
                <li key={talk.id} className={styles.record}>
                  <Record talk={talk} />
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FilterChip({
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
      className={`${styles.chip} ${active ? styles.chipOn : ""}`}
    >
      {label}
      <span aria-hidden="true" className={styles.chipCount}>
        {count}
      </span>
    </button>
  );
}

function Record({ talk }: { talk: TalkRecord }) {
  const area = researchAreaForTalk(talk);

  return (
    <article className={styles.body}>
      <p className={styles.meta}>
        <span className={styles.kind}>{TALK_KIND_LABEL[talk.kind]}</span>
        {talk.date && (
          <>
            <span aria-hidden="true">·</span>
            <span>{talk.date}</span>
          </>
        )}
      </p>

      <h3 className={styles.title}>{talk.title}</h3>

      {(talk.event || talk.venue) && (
        <p className={styles.where}>
          {talk.event}
          {talk.event && talk.venue && <span aria-hidden="true"> · </span>}
          {talk.venue}
        </p>
      )}

      {talk.description && <p className={styles.desc}>{talk.description}</p>}

      {(talk.evidence.length > 0 || area) && (
        <div className={styles.actions}>
          {talk.evidence.map((e) => (
            <a
              key={e.href}
              href={e.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.evidence}
            >
              {EVIDENCE_LABEL[e.kind]}
              <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
            </a>
          ))}

          {/* Only where the work IS that research — see talks.ts. */}
          {area && (
            <Link href="/research" className={styles.related}>
              Related research: {area.title}
              <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}
    </article>
  );
}

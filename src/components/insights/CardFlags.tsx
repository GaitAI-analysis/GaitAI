"use client";

import { useEffect, useState } from "react";
import styles from "./journal.module.css";

/**
 * "NEW" — and only when it is true at the moment somebody is looking.
 *
 * WHY THIS IS A CLIENT ISLAND AND NOT A PROP. Freshness is a comparison
 * against *now*, and every surface that shows a card is statically rendered:
 * computed on the server, "now" is the build clock, so a deployment that sat
 * untouched for two months would keep announcing two-month-old writing as new.
 * That is exactly the fabricated activity the journal is not allowed to show.
 * So the comparison happens in the reader's own browser, after mount — which
 * also means there is no server/client mismatch to hydrate around.
 *
 * It renders nothing at all before that first effect, so a stale HTML cache
 * can never serve a stale badge.
 *
 * The window is deliberately short. A fortnight-and-a-week is long enough that
 * a piece is still findable as the new one and short enough that it cannot be
 * true of the whole archive at once — on a journal publishing weekly, at most
 * two or three cards can carry it, and usually one.
 */
const FRESH_DAYS = 21;
const DAY = 24 * 60 * 60 * 1000;

export function NewMark({ date }: { date: string }) {
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    const published = new Date(date).getTime();
    if (Number.isNaN(published)) return;
    const age = Date.now() - published;
    /* A future-dated record is not "new", it is unpublished — and a negative
       age would otherwise sail through an `age < window` test. */
    setFresh(age >= 0 && age < FRESH_DAYS * DAY);
  }, [date]);

  if (!fresh) return null;

  return (
    <span className={`${styles.cardFlag} ${styles.cardFlagNew}`}>New</span>
  );
}

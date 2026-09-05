"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AnswerText } from "./AnswerText";
import { QuickPrompts } from "./QuickPrompts";
import { SourceLinks } from "./SourceLinks";
import type { Opening } from "./page-context";
import type { Turn } from "./use-assistant";
import styles from "./assistant.module.css";

/**
 * The transcript.
 *
 * A question is a small tinted card; an answer is open text on the panel's own
 * ground with a hairline marker — not a second bubble. Two bubbles facing each
 * other is the shape of a support chat, and the assistant is meant to read as
 * part of the site, not as a widget bolted onto it.
 *
 * SCREEN READERS. The list is a polite live region, so a completed answer is
 * announced without interrupting. Answers arrive whole, so there is no
 * token-by-token churn for a reader to sit through.
 *
 * THE WAITING LINE says what is happening in the site's own words — "Tracing
 * GaitAI knowledge…" — and nothing about providers, models or endpoints. The
 * machinery is not the reader's concern; the answer is.
 */

const FAILURE_COPY: Record<NonNullable<Turn["failed"]>, string> = {
  upstream: "I couldn't reach the GaitAI assistant just now.",
  network: "I couldn't reach the GaitAI assistant just now.",
  timeout: "That took longer than expected and I had to stop.",
  declined: "I can't help with that one.",
  rate_limited: "That's a lot of questions in a short time.",
};

const FALLBACK_LINKS = [
  { label: "Products", href: "/products/" },
  { label: "Research", href: "/research/" },
  { label: "Use Cases", href: "/use-cases/" },
];

export function ChatMessages({
  turns,
  opening,
  pending,
  onPick,
  onRetry,
  onNavigate,
}: {
  turns: Turn[];
  opening: Opening;
  pending: boolean;
  onPick: (prompt: string) => void;
  onRetry: () => void;
  onNavigate: (url: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  /* Follow the thread as it grows, but only while the reader is already at
     the bottom — scrolling up to re-read an earlier answer must not be yanked
     back down when the next one lands. */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const distance =
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    if (distance < 140) {
      endRef.current?.scrollIntoView({ block: "end" });
    }
  }, [turns]);

  const empty = turns.length === 0;

  return (
    <div ref={scrollerRef} className={styles.scroller}>
      {empty && (
        <div className={styles.opening}>
          <p className={styles.openingLead}>{opening.lead}</p>
          {opening.detail && (
            <p className={styles.openingDetail}>{opening.detail}</p>
          )}
          <QuickPrompts prompts={opening.prompts} onPick={onPick} />
        </div>
      )}

      <div
        className={styles.thread}
        role="log"
        aria-live="polite"
        aria-label="Conversation with Ask GaitAI"
      >
        {turns.map((turn, index) => {
          if (turn.role === "user") {
            return (
              <div key={turn.id} className={styles.question}>
                {turn.text}
              </div>
            );
          }

          const isLast = index === turns.length - 1;
          const waiting = isLast && pending && !turn.text && !turn.failed;

          if (turn.failed) {
            return (
              <div key={turn.id} className={styles.answer}>
                <span aria-hidden="true" className={styles.answerMark} />
                <div className={styles.failure}>
                  <p className={styles.failureLead}>
                    {FAILURE_COPY[turn.failed]}
                  </p>
                  {turn.failed === "rate_limited" ? (
                    <p className={styles.failureDetail}>
                      Give it a moment and ask again
                      {turn.retryAfter
                        ? ` — about ${Math.ceil(turn.retryAfter / 60)} minute${
                            turn.retryAfter > 90 ? "s" : ""
                          }.`
                        : "."}
                    </p>
                  ) : (
                    <p className={styles.failureDetail}>
                      You can still explore the site directly.
                    </p>
                  )}
                  <div className={styles.failureActions}>
                    {turn.failed !== "declined" && (
                      <button
                        type="button"
                        onClick={onRetry}
                        className={styles.prompt}
                      >
                        Try again
                      </button>
                    )}
                    {FALLBACK_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={styles.prompt}
                        onClick={() => onNavigate(link.href)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={turn.id} className={styles.answer}>
              <span aria-hidden="true" className={styles.answerMark} />
              <div className={styles.answerContent}>
                {waiting ? (
                  <p className={styles.thinking}>
                    <span className={styles.thinkingScan} aria-hidden="true" />
                    Tracing GaitAI knowledge…
                  </p>
                ) : (
                  <AnswerText text={turn.text} />
                )}

                {turn.sources && turn.sources.length > 0 && (
                  <SourceLinks sources={turn.sources} onNavigate={onNavigate} />
                )}

                {turn.cta && (
                  <div className={styles.cta}>
                    <p className={styles.ctaLead}>
                      Interested in exploring this setup?
                    </p>
                    <Link
                      href={turn.cta.href}
                      className={styles.ctaButton}
                      onClick={() => onNavigate(turn.cta!.href)}
                    >
                      {turn.cta.label}
                      <span aria-hidden="true"> →</span>
                    </Link>
                  </div>
                )}

                {turn.suggestions && turn.suggestions.length > 0 && (
                  <QuickPrompts
                    label="Ask next"
                    prompts={turn.suggestions}
                    disabled={pending}
                    onPick={onPick}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div ref={endRef} />
    </div>
  );
}

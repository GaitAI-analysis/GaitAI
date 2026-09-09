"use client";

import { useEffect, useState } from "react";
import { trackInsightEvent, type HelpfulReason } from "@/lib/insight-events";
import styles from "./experience.module.css";

/**
 * "Did this help you understand the idea?" — one line at the foot of a major
 * story, two answers, and for "Not quite" four fixed reasons.
 *
 * Editorial, not a survey: no text field, no stars, no thank-you card. The
 * answer is an anonymous count (`article_helpful_yes` / `_no`, and one
 * `article_helpful_reason` from a closed list). A reader can answer once per
 * story per browser session; the widget then shows what it recorded and
 * nothing more.
 */
const REASONS: Array<{ id: HelpfulReason; label: string }> = [
  { id: "too-technical", label: "Too technical" },
  { id: "visual-unclear", label: "Visual unclear" },
  { id: "more-examples", label: "Needed more examples" },
  { id: "other", label: "Other" },
];

type Answer = "yes" | "no" | null;

export function ArticleFeedback({ slug }: { slug: string }) {
  const key = `gaitai:helpful:${slug}`;
  const [answer, setAnswer] = useState<Answer>(null);
  const [reason, setReason] = useState<HelpfulReason | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored === "yes" || stored === "no") setAnswer(stored);
      if (stored === "no") {
        const storedReason = sessionStorage.getItem(`${key}:reason`) as HelpfulReason | null;
        if (storedReason) setReason(storedReason);
      }
    } catch {
      /* Storage blocked: the widget simply starts unanswered. */
    }
    setHydrated(true);
  }, [key]);

  const remember = (value: string, field = "") => {
    try {
      sessionStorage.setItem(field ? `${key}:${field}` : key, value);
    } catch {
      /* fine */
    }
  };

  const choose = (value: Exclude<Answer, null>) => {
    if (answer) return;
    setAnswer(value);
    remember(value);
    trackInsightEvent(value === "yes" ? "article_helpful_yes" : "article_helpful_no", { article_slug: slug }, { once: slug, session: true });
  };

  const chooseReason = (value: HelpfulReason) => {
    if (reason) return;
    setReason(value);
    remember(value, "reason");
    trackInsightEvent("article_helpful_reason", { article_slug: slug, reason: value }, { once: slug, session: true });
  };

  return (
    <aside className={`${styles.root} ${styles.feedback}`} aria-label="Was this story helpful">
      <p className={styles.feedbackQuestion} id={`${slug}-helpful`}>
        Did this help you understand the idea?
      </p>
      <div className={styles.chips} role="group" aria-labelledby={`${slug}-helpful`}>
        <button
          type="button"
          className={`${styles.chip} ${answer === "yes" ? styles.chipOn : ""}`}
          aria-pressed={answer === "yes"}
          disabled={hydrated && answer !== null && answer !== "yes"}
          onClick={() => choose("yes")}
        >
          Yes
        </button>
        <button
          type="button"
          className={`${styles.chip} ${answer === "no" ? styles.chipOn : ""}`}
          aria-pressed={answer === "no"}
          disabled={hydrated && answer !== null && answer !== "no"}
          onClick={() => choose("no")}
        >
          Not quite
        </button>
      </div>
      {answer === "no" && (
        <div className={styles.feedbackReasons}>
          <p className={styles.feedbackWhy} id={`${slug}-why`}>
            What got in the way?
          </p>
          <div className={styles.chips} role="group" aria-labelledby={`${slug}-why`}>
            {REASONS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.chip} ${reason === item.id ? styles.chipOn : ""}`}
                aria-pressed={reason === item.id}
                disabled={reason !== null && reason !== item.id}
                onClick={() => chooseReason(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className={styles.feedbackNote} role="status" aria-live="polite">
        {answer === "yes"
          ? "Noted — thank you."
          : answer === "no" && reason
            ? "Noted — thank you. That shapes the next story."
            : answer === "no"
              ? ""
              : ""}
      </p>
    </aside>
  );
}

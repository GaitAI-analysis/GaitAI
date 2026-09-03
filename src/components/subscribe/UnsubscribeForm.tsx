"use client";

import { useId, useState } from "react";
import { isValidEmail, unsubscribe } from "@/lib/subscribe";
import styles from "./subscribe.module.css";

/**
 * The unsubscribe field. Same field, node and states as SubscribeForm, and
 * the same rule: nothing is reported as done until the write has landed.
 *
 * "Not on the list" is told plainly rather than absorbed into a friendly
 * confirmation. A silent success for an address that was never subscribed
 * teaches someone that they are off a list they may still be on — usually
 * because they typed a different address from the one they signed up with.
 */
type State =
  | "idle"
  | "invalid"
  | "submitting"
  | "removed"
  | "already"
  | "not-found"
  | "error";

function message(state: State): { text: string; tone: "ok" | "warn" | "bad" } | null {
  switch (state) {
    case "removed":
      return {
        text: "Unsubscribed. That address will not receive GaitAI updates.",
        tone: "ok",
      };
    case "already":
      return { text: "That address is already unsubscribed.", tone: "warn" };
    case "not-found":
      return {
        text: "That address is not on the list. If you subscribed with a different one, try that.",
        tone: "warn",
      };
    case "invalid":
      return { text: "That doesn't look like an email address.", tone: "bad" };
    case "error":
      return {
        text: "That didn't go through. Please try again in a moment.",
        tone: "bad",
      };
    default:
      return null;
  }
}

export function UnsubscribeForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  const fieldId = useId();
  const noteId = `${fieldId}-note`;
  const busy = state === "submitting";
  const note = message(state);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    if (!isValidEmail(email)) {
      setState("invalid");
      return;
    }

    setState("submitting");
    const result = await unsubscribe(email);

    if (result === "unsubscribed") setState("removed");
    else if (result === "already-unsubscribed") setState("already");
    else if (result === "not-found") setState("not-found");
    else if (result === "invalid") setState("invalid");
    else setState("error");
  }

  return (
    <div className={`${styles.block} mt-8`}>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <span aria-hidden="true" className={styles.signal} />

        <label htmlFor={fieldId} className="sr-only">
          Email address to unsubscribe
        </label>
        <input
          id={fieldId}
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="your@email.com"
          value={email}
          disabled={busy}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state !== "idle" && state !== "submitting") setState("idle");
          }}
          aria-invalid={state === "invalid"}
          aria-describedby={note ? noteId : undefined}
          className={styles.input}
        />

        <button
          type="submit"
          disabled={busy}
          className={`${styles.button} ${state === "removed" ? styles.buttonDone : ""}`}
        >
          <span aria-hidden="true" className={styles.node} />
          <span className={styles.buttonLabel}>
            {busy ? "Removing…" : "Unsubscribe"}
          </span>
          <span aria-hidden="true" className={styles.arrow}>
            →
          </span>
        </button>
      </form>

      <p
        id={noteId}
        role="status"
        aria-live="polite"
        className={`${styles.note} ${note ? styles[note.tone] : ""}`}
      >
        {note?.text ?? ""}
      </p>
    </div>
  );
}

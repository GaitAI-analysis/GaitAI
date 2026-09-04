"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  isValidEmail,
  subscribe,
  type SubscribeSource,
} from "@/lib/subscribe";
import styles from "./subscribe.module.css";

/**
 * THE subscription form — one component for all three surfaces.
 *
 *   blog     · the block that closes /insights
 *   article  · the block that closes every article
 *   contact  · a compact line under the deployment card on the contact
 *              section, where somebody who is not ready to ask for a demo is
 *              already thinking about GaitAI. It used to sit in the global
 *              footer, on every page, which is the least considered place a
 *              signup can be.
 *
 * They differ in size and copy, never in behaviour, so a fix to validation,
 * duplicate handling or the failure path lands on all three at once.
 *
 * THE SIGNAL LINE. Every variant draws the site's one editorial device: a
 * hairline that runs toward the field and terminates in a small node beside
 * the button. It brightens while the field has focus and again on success —
 * the signal arriving somewhere. It is CSS on a pseudo-element, not an
 * illustration, and there is no envelope, no megaphone and no paper plane.
 *
 * SUCCESS IS NEVER OPTIMISTIC. The state moves to `success` only when
 * `subscribe()` reports that Firestore accepted the write. A refused write,
 * an unpublished rule or an offline browser all land in `error`, which offers
 * a retry and says plainly that nothing was saved. A form that thanks someone
 * for a subscription it did not store is worse than one that fails.
 *
 * NO POPUP, EVER. This renders in the page flow where a reader has already
 * chosen to be at the end of something. Nothing here opens on a timer, on an
 * exit intent, or on a first visit.
 */

type State =
  | "idle"
  | "invalid"
  | "submitting"
  | "success"
  | "already"
  | "error";

export type SubscribeVariant = "blog" | "article" | "contact";

const COPY: Record<
  SubscribeVariant,
  { title: string; blurb: string; cta: string; source: SubscribeSource }
> = {
  blog: {
    title: "Stay close to the signal",
    blurb:
      "Research notes, product updates, engineering stories and the latest from GaitAI.",
    cta: "Subscribe",
    source: "blog",
  },
  article: {
    title: "Enjoyed this story?",
    blurb: "Get the next signal from GaitAI.",
    cta: "Subscribe",
    source: "article",
  },
  contact: {
    title: "Blog & updates",
    blurb: "Research · Product · Engineering · GaitAI updates",
    cta: "Subscribe",
    /* The STORED value stays "footer". `source` is an enum bounded by the
       deployed security rules — `d.source in ['blog','article','footer',
       'unsubscribe-page']` — so writing "contact" would be refused by
       Firestore until those rules are published again, and every signup from
       here would fail silently. Add 'contact' to the enum, deploy, then flip
       this line; the variant name is already honest about where the block
       lives. */
    source: "footer",
  },
};

/** What the reader is told, per state. Never a lie about persistence. */
function message(state: State): { text: string; tone: "ok" | "warn" | "bad" } | null {
  switch (state) {
    case "success":
      return { text: "Subscribed. The next signal comes to you.", tone: "ok" };
    case "already":
      return { text: "You're already subscribed.", tone: "warn" };
    case "invalid":
      return { text: "That doesn't look like an email address.", tone: "bad" };
    case "error":
      return {
        text: "That didn't save. Please try again in a moment.",
        tone: "bad",
      };
    default:
      return null;
  }
}

export function SubscribeForm({
  variant,
  className,
}: {
  variant: SubscribeVariant;
  className?: string;
}) {
  const copy = COPY[variant];
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  const fieldId = useId();
  const noteId = `${fieldId}-note`;
  const busy = state === "submitting";
  const done = state === "success" || state === "already";
  const note = message(state);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    if (!isValidEmail(email)) {
      setState("invalid");
      return;
    }

    setState("submitting");
    const result = await subscribe(email, copy.source);

    /* Every branch is a real answer from the write path. "resubscribed" is a
       success for someone who had left and come back; there is nothing to be
       gained by telling them the row already existed. */
    if (result === "subscribed" || result === "resubscribed") {
      setState("success");
      setEmail("");
    } else if (result === "already-subscribed") {
      setState("already");
    } else if (result === "invalid") {
      setState("invalid");
    } else {
      setState("error");
    }
  }

  return (
    <section
      className={`${styles.block} ${styles[variant]} ${className ?? ""}`}
      aria-labelledby={`${fieldId}-title`}
    >
      <div className={styles.copy}>
        <h2 id={`${fieldId}-title`} className={styles.title}>
          {copy.title}
        </h2>
        <p className={styles.blurb}>{copy.blurb}</p>
      </div>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {/* The signal: a hairline into the field, terminating at the node
            beside the button. Decorative — the state is in the text. */}
        <span aria-hidden="true" className={styles.signal} />

        <label htmlFor={fieldId} className="sr-only">
          Email address
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
            /* Clear a previous verdict as soon as the address changes, so an
               old "already subscribed" cannot describe a new address. */
            if (state !== "idle" && state !== "submitting") setState("idle");
          }}
          aria-invalid={state === "invalid"}
          aria-describedby={note ? noteId : undefined}
          className={styles.input}
        />

        <button
          type="submit"
          disabled={busy}
          className={`${styles.button} ${done ? styles.buttonDone : ""}`}
        >
          <span aria-hidden="true" className={styles.node} />
          <span className={styles.buttonLabel}>
            {busy ? "Subscribing…" : copy.cta}
          </span>
          <span aria-hidden="true" className={styles.arrow}>
            →
          </span>
        </button>
      </form>

      {/* One live region for every verdict, so a screen reader hears the
          result without the focus moving. */}
      <p
        id={noteId}
        role="status"
        aria-live="polite"
        className={`${styles.note} ${note ? styles[note.tone] : ""}`}
      >
        {note?.text ?? ""}
      </p>

      <p className={styles.legal}>
        By subscribing, you agree to receive GaitAI updates. You can{" "}
        <Link href="/insights/unsubscribe" className={styles.legalLink}>
          unsubscribe
        </Link>{" "}
        at any time. See our{" "}
        <Link href="/legal/privacy" className={styles.legalLink}>
          Privacy Policy
        </Link>
        .
      </p>
    </section>
  );
}

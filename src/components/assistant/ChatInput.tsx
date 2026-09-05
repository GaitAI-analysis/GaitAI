"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { MAX_MESSAGE_LENGTH } from "./config";
import { hostedEnabled } from "@/lib/ask/hosted";
import styles from "./assistant.module.css";

/**
 * The composer.
 *
 * A textarea rather than an input, because a real question about an environment
 * runs to two lines and a single-line field that scrolls sideways makes people
 * write less than they mean to. Enter sends; Shift+Enter breaks the line.
 *
 * The privacy note sits under the field, permanently and quietly. It is the
 * kind of thing that has to be visible before someone types, not after — and
 * it says what is TRUE for this build. With a hosted endpoint configured, the
 * typed question leaves the browser for GaitAI's own inference service, and
 * the line says so. Without one, every answer is composed from the site's
 * knowledge in the tab, and the line says that instead. Neither version claims
 * more privacy than the build delivers.
 */
const PRIVACY_NOTE = hostedEnabled()
  ? "Your text question may be processed by GaitAI’s hosted AI service. Please don’t share sensitive personal or patient information."
  : "Answers come from GaitAI’s local site knowledge. Please don’t share sensitive personal or patient information.";
export const ChatInput = forwardRef<
  HTMLTextAreaElement,
  {
    disabled: boolean;
    onSend: (value: string) => void;
  }
>(function ChatInput({ disabled, onSend }, ref) {
  const [value, setValue] = useState("");
  const localRef = useRef<HTMLTextAreaElement | null>(null);

  /* Grow to fit, up to five lines, then scroll. */
  useEffect(() => {
    const node = localRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 118)}px`;
  }, [value]);

  const submit = () => {
    const question = value.trim();
    if (!question || disabled) return;
    setValue("");
    onSend(question);
  };

  return (
    <div className={styles.composer}>
      <form
        className={styles.inputShell}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <textarea
          ref={(node) => {
            localRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          rows={1}
          value={value}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Ask anything about GaitAI…"
          aria-label="Ask anything about GaitAI"
          className={styles.input}
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className={styles.send}
          aria-label="Send question"
        >
          <span aria-hidden="true">↑</span>
        </button>
      </form>
      <p className={styles.privacyNote}>{PRIVACY_NOTE}</p>
    </div>
  );
});

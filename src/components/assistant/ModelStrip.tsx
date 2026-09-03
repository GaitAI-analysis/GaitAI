"use client";

import type { ModelStatus } from "@/lib/ask/model";
import styles from "./assistant.module.css";

/**
 * THE PREPARATION STRIP — the model's state, and the offer to fetch it.
 * =============================================================================
 * One line above the composer, and it is the only place the assistant talks
 * about its own machinery.
 *
 * WHY THIS IS AN OFFER AND NOT A PROGRESS BAR THAT STARTED ITSELF
 * The weights are 1.14 GiB, measured from the CDN. A launcher press is not
 * consent to a gigabyte — on a phone it may be someone's month — so the size
 * is stated on the button and the visitor decides. The assistant is already
 * answering from records while the strip sits there; nothing is blocked on it,
 * which is what makes an offer honest rather than a paywall.
 *
 * WHAT EACH STATE SAYS
 *   idle          the offer, with the size and where it runs
 *   downloading   a real determinate bar, because the byte totals are known
 *   initialising  the weights are in, WebGPU is starting
 *   ready         a quiet confirmation, and the privacy line it earns
 *   failed        one sentence, and what happens instead
 */
export function ModelStrip({
  status,
  bytes,
  onEnable,
}: {
  status: ModelStatus;
  bytes: number;
  onEnable: () => void;
}) {
  const gib = (bytes / 1024 ** 3).toFixed(2);
  const percent =
    status.progress === null ? null : Math.round(status.progress * 100);

  if (status.stage === "ready") {
    return (
      <p className={styles.modelReady}>
        <span aria-hidden="true" className={styles.modelDot} />
        {/* Only claimed once it is true: the model is loaded and running here,
            so the question genuinely does not leave the browser. */}
        Answers are generated locally in your browser
        {status.device === "webgpu" ? " on WebGPU" : ""}. Your question is not
        sent to an external AI provider.
      </p>
    );
  }

  if (status.stage === "downloading" || status.stage === "initialising") {
    return (
      <div className={styles.modelLoading} aria-live="polite">
        <p className={styles.modelLoadingHead}>
          Preparing GaitAI Assistant
          {percent !== null && (
            <span className={styles.modelPercent}>{percent}%</span>
          )}
        </p>
        {/* A real <progress>: it is determinate, it is announced, and it needs
            no ARIA of its own. Indeterminate only before the first byte
            report, which is a second at most. */}
        <progress
          className={styles.modelBar}
          max={100}
          {...(percent !== null ? { value: percent } : {})}
        />
        <p className={styles.modelNote}>
          {status.detail}. Runs locally in your browser — meanwhile I am
          answering from the site&apos;s records.
        </p>
      </div>
    );
  }

  if (status.stage === "failed") {
    return (
      <p className={styles.modelNote}>
        The local model could not be loaded, so answers are quoted from the
        site&apos;s records instead. Everything below still comes from real
        GaitAI pages.
      </p>
    );
  }

  /* idle — the offer. */
  return (
    <div className={styles.modelOffer}>
      <p className={styles.modelNote}>
        Answers are quoted from GaitAI&apos;s records. For answers written in
        prose, load the open-weight model — {gib} GB, once, cached afterwards,
        and it runs entirely in this browser.
      </p>
      <button type="button" onClick={onEnable} className={styles.modelButton}>
        <span aria-hidden="true" className={styles.modelButtonMark}>
          ✦
        </span>
        Load local model · {gib} GB
      </button>
      {status.device === "wasm" && (
        <p className={styles.modelNote}>
          This browser has no WebGPU, so it would run on the CPU — slower, but
          it works.
        </p>
      )}
    </div>
  );
}

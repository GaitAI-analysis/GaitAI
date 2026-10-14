"use client";

import { useState } from "react";
import styles from "./androidDownload.module.css";

/**
 * "VERIFY DOWNLOAD" — the technical facts a careful installer wants, folded
 * away from the main card: the full SHA-256 of the published APK (with a copy
 * button), the package identifier and how to check the file. A plain
 * <details>, so it opens without JavaScript; only the copy button needs it.
 */
export function VerifyDownload({ sha256, packageId, product }: { sha256: string; packageId: string; product: string }) {
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sha256);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
    window.setTimeout(() => setCopied("idle"), 2400);
  };

  return (
    <details className={styles.verify} data-verify-download={product}>
      <summary className={styles.verifySummary}>
        <span>Verify download</span>
        <span className={styles.verifyHint}>Checksum and technical details</span>
      </summary>
      <div className={styles.verifyBody}>
        <p className={styles.verifyLabel}>SHA-256 checksum</p>
        <div className={styles.hashRow}>
          <code className={styles.hash} data-sha256>{sha256}</code>
          <button type="button" className={styles.copy} onClick={copy} aria-label="Copy SHA-256 checksum">
            {copied === "done" ? "Copied" : copied === "failed" ? "Copy failed" : "Copy"}
          </button>
        </div>
        <span className={styles.srOnly} role="status" aria-live="polite">
          {copied === "done" ? "Checksum copied to the clipboard." : copied === "failed" ? "The checksum could not be copied; select it and copy it manually." : ""}
        </span>
        <p className={styles.verifyText}>
          On a computer, run <code>Get-FileHash</code> in PowerShell or <code>shasum -a 256</code> on macOS and Linux, and compare the result with this value. If they differ, do not install the file.
        </p>
        <dl className={styles.techList}>
          <dt>Package</dt>
          <dd>{packageId}</dd>
          <dt>Signature</dt>
          <dd>GaitAI release key</dd>
          <dt>Distribution</dt>
          <dd>Direct download, outside Google Play</dd>
        </dl>
      </div>
    </details>
  );
}

"use client";

import { Lock, Loader2 } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";

/**
 * Locked discussion card shown on subscriber-only posts when the viewer isn't
 * eligible. Public (non-subscribed) users never see the comment box or any
 * subscriber-only comments — only this clean gate.
 */
export function LockedState({ signedIn }: { signedIn: boolean }) {
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      /* user dismissed / popup blocked — no-op */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card relative overflow-hidden p-8 text-center">
      <div className="ring-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-md">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-400/25 to-cyan-300/15 text-violet-200 ring-1 ring-white/10">
          <Lock className="h-5 w-5" />
        </span>
        <h3 className="mt-5 font-display text-xl text-soft-white">
          Subscriber-only discussion
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-soft-gray">
          The conversation on this post is reserved for GaitAI subscribers.
          {signedIn
            ? " Your account doesn't have an active subscription yet."
            : " Sign in with your subscriber account to read and join in."}
        </p>
        {!signedIn && (
          <button
            type="button"
            onClick={handleSignIn}
            disabled={busy}
            className="btn-primary mt-6 px-5 py-2.5 text-sm disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleGlyph />
            )}
            Sign in to continue
          </button>
        )}
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#FFC107"
        d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.66-5.85-5.94S8.78 6.3 12 6.3c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.7 3.7 14.55 2.8 12 2.8 6.98 2.8 2.9 6.88 2.9 11.9S6.98 21 12 21c5.5 0 9.13-3.86 9.13-9.3 0-.62-.07-1.1-.18-1.6z"
      />
    </svg>
  );
}

"use client";

import Link from "next/link";
import { LostTrajectory } from "@/components/ui/LostTrajectory";

/**
 * Route error boundary. Says what happened and what the reader can do; never
 * the message, stack or digest — those belong in the console, which Next
 * already writes to. `reset` re-renders the segment in place, so a transient
 * failure (a stalled model download, a lost connection) recovers without a
 * full reload.
 */
export default function RouteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="site-page-intro-roomy container-wide grid min-h-[70vh] place-items-center pb-24 text-center">
      <div className="w-full max-w-lg">
        <LostTrajectory variant="interrupted" />
        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Something interrupted this page
        </p>
        <h1 className="mt-4 font-display text-display-md text-balance text-soft-white">
          The signal dropped mid-stride.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-soft-gray">
          Part of this page failed to render in your browser. Nothing you
          typed or selected was sent anywhere. Trying again usually resolves
          it; if it keeps happening, the rest of the site still works.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary">
            Try again
          </button>
          <Link href="/" className="btn-ghost">
            Return home
          </Link>
          <Link href="/gaitscape/" className="btn-ghost">
            Explore GaitScape
          </Link>
        </div>
      </div>
    </div>
  );
}

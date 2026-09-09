"use client";

import { useState } from "react";

/** Public selections only. Never pass filenames, media URLs or measured values. */
const PUBLIC_KEYS = new Set([
  "mode", "stage", "view", "focus", "story", "step", "product", "demo",
  "environment", "goal", "signal", "reading",
]);

export function explorationUrl(path: string, params: Record<string, string | undefined> = {}) {
  // Construct from the public origin, never the current query (which may hold private data).
  const safePath = /^\/[a-z0-9/-]*\/?(?:#[a-z0-9-]+)?$/i.test(path) ? path : "/";
  const url = new URL(safePath, "https://gaitai.in");
  for (const [key, value] of Object.entries(params)) {
    if (PUBLIC_KEYS.has(key) && value && /^[a-z0-9,_-]{1,100}$/i.test(value)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export function ShareExploration({
  path,
  title = "GaitAI movement exploration",
  params = {},
  className = "btn-ghost !px-4 !py-2 text-xs",
}: {
  path: string;
  title?: string;
  params?: Record<string, string | undefined>;
  className?: string;
}) {
  const [status, setStatus] = useState("");
  const [fallback, setFallback] = useState(false);
  const url = explorationUrl(path, params);

  const share = async () => {
    setStatus("");
    setFallback(false);
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setStatus("Exploration shared.");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setStatus("Exploration link copied. No personal media is included.");
      } else {
        setFallback(true);
        setStatus("Copy the public exploration link below.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setFallback(true);
      setStatus("Sharing was unavailable. Copy the link below instead.");
    }
  };

  return (
    <div className="min-w-0">
      <button type="button" className={className} onClick={share}>
        Share this exploration
      </button>
      <span role="status" className="mt-2 block text-xs leading-relaxed text-soft-mute">
        {status}
      </span>
      {fallback && (
        <input
          className="mt-2 w-full min-w-0 rounded-lg border border-white/15 bg-obsidian-200 p-3 text-xs text-soft-white"
          aria-label="Public exploration link — contains no personal media"
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
        />
      )}
    </div>
  );
}

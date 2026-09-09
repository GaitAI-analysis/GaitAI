"use client";

/**
 * THE ASSISTANT'S RUNTIME CONFIGURATION — re-read on every panel open.
 * =============================================================================
 * `public/ask/config.json` is written at build time (scripts/write-ask-config.mjs)
 * and carries the hosted endpoint and a build id. The bundle carries the same
 * two values as constants — but a bundle can be OLD: a tab opened before a
 * deploy, or a phone restoring a suspended tab hours later, keeps running the
 * JavaScript it already has, and Next's hashed chunk names change nothing for
 * code that is already loaded. Until this module existed, such a tab answered
 * from records alone ("no endpoint") while a freshly loaded tab talked to the
 * Worker, and the two looked like different products until a refresh.
 *
 * So the client asks the SERVER what the current configuration is, with
 * `cache: "no-store"` and a per-minute query string that defeats the CDN's
 * 10-minute object cache, and prefers that answer over its own constants:
 *
 *   endpoint   the runtime value wins when the file is readable; the bundled
 *              constant is the fallback when it is not (offline, blocked)
 *   build      when it differs from the bundled id the client is STALE: it
 *              keeps working with the runtime endpoint, and persisted state
 *              written by the other build is discarded (use-assistant.ts)
 *
 * The file is served from the site's own origin; trusting it is the same
 * trust as running the site's JavaScript. Only https endpoints are accepted,
 * and an empty endpoint means the hosted layer is deliberately off.
 *
 * Nothing here is shown to a visitor. The build id is not a debug display; it
 * is the key that keeps a stale client from mixing two configurations.
 */

import { ASK_ENDPOINT } from "@/components/assistant/config";

/** The build id inlined at build time — "" in a build that had no config file. */
export const ASSISTANT_BUILD: string = (process.env.NEXT_PUBLIC_ASK_BUILD_ID ?? "").trim();

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const CONFIG_URL = `${BASE_PATH}/ask/config.json`;
/** How long one successful read is trusted before the file is re-read. */
const TTL_MS = 60_000;
const TIMEOUT_MS = 3_000;

export interface RuntimeConfig {
  build: string;
  endpoint: string;
  corpus: string;
  fetchedAt: number;
}

let cached: RuntimeConfig | null = null;
let inflight: Promise<RuntimeConfig | null> | null = null;

/**
 * Read the runtime configuration. Resolves to the last good read when the
 * network fails, and to null when nothing has ever been read (the caller then
 * uses the bundled constants). Never throws.
 */
export function loadRuntimeConfig(force = false): Promise<RuntimeConfig | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!force && cached && Date.now() - cached.fetchedAt < TTL_MS) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = (async () => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      /* A new URL each minute: the CDN caches by full URL, so this is a fresh
         object at most once a minute per visitor and never a 10-minute-old one. */
      const minute = Math.floor(Date.now() / 60_000);
      const response = await fetch(`${CONFIG_URL}?b=${encodeURIComponent(ASSISTANT_BUILD)}&t=${minute}`, {
        cache: "no-store",
        credentials: "omit",
        signal: controller.signal,
      });
      if (!response.ok) return cached;
      const json: unknown = await response.json();
      if (!json || typeof json !== "object") return cached;
      const record = json as Record<string, unknown>;
      const endpoint = typeof record.endpoint === "string" ? record.endpoint.trim() : "";
      if (endpoint && !/^https:\/\/[^\s/]+\/.+/.test(endpoint)) return cached;
      cached = {
        build: typeof record.build === "string" ? record.build : "",
        endpoint,
        corpus: typeof record.corpus === "string" ? record.corpus : "",
        fetchedAt: Date.now(),
      };
      return cached;
    } catch {
      return cached;
    } finally {
      window.clearTimeout(timer);
      inflight = null;
    }
  })();
  return inflight;
}

/** The endpoint to POST to now: the runtime value when known, else the bundle's. */
export async function resolveEndpoint(): Promise<string> {
  const config = await loadRuntimeConfig();
  return config ? config.endpoint : ASK_ENDPOINT;
}

/** The last runtime read, without a network call. */
export const runtimeConfig = (): RuntimeConfig | null => cached;

/** True when the server's build id is known and differs from this bundle's. */
export function isStaleBundle(config: RuntimeConfig | null = cached): boolean {
  return Boolean(config && config.build && ASSISTANT_BUILD && config.build !== ASSISTANT_BUILD);
}

/** Test seam: forget the cached read. */
export function resetRuntimeConfig(): void {
  cached = null;
  inflight = null;
}

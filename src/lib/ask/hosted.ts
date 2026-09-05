"use client";

/**
 * THE HOSTED LANGUAGE LAYER — one POST to the Ask GaitAI Worker.
 * =============================================================================
 * Ask GaitAI used to ship a 1.2 GB quantized model to the visitor's browser and
 * run it on WebGPU. That made the assistant a download, excluded every phone
 * and every browser without WebGPU, and capped the writer at 1.5B parameters
 * because that is what a laptop GPU can hold. All of it is gone.
 *
 * Generation now happens behind a Cloudflare Worker (worker/) that this module
 * talks to over plain HTTPS. The Worker is provider-agnostic from here: this
 * file knows a URL and a JSON shape, nothing else. Behind the URL the Worker
 * resolves the record ids this browser selected against ITS OWN copy of the
 * canonical corpus, builds the grounding prompt from those canonical records,
 * and calls a hosted model through the Google Gemini Developer API. The
 * Gemini API key is a Worker secret binding and is never in this bundle, in a
 * NEXT_PUBLIC_ variable, in the repository, or in a response.
 *
 * WHAT CROSSES THE WIRE — TEXT, AND ONLY THESE FIELDS
 *   out:  question           the visitor's typed text (≤ 800 chars)
 *         pathname, pageTitle  the route and document title, for page awareness
 *         history            ≤ 6 prior turns of this thread, text only
 *         selectedRecordIds  the ids retrieval chose — ids, never record text.
 *                            The Worker discards any id it does not know.
 *   in:   the answer, the sources the Worker chose from the canonical records,
 *         related records, follow-ups and the CTA — all already checked against
 *         the corpus route allowlist on the Worker, and checked again by
 *         `engine.ts`.
 *
 * WHAT NEVER CROSSES IT. This is a textual assistant request and nothing else.
 * No identifiers, no cookies, no DOM, no storage — and none of Movement Lab's
 * material: no uploaded video, no camera frames, no pose arrays, no health
 * files, no biometric media. Movement Lab has its own architecture and never
 * touches this module; the body below is built from named string fields, so
 * there is no path by which a blob could be attached to it.
 *
 * WHAT THIS MODULE DOES NOT DECIDE. Whether to call the Worker at all is
 * `engine.ts`'s decision, made from local retrieval confidence — and made
 * without a network request when no endpoint is configured. Whether the answer
 * is trustworthy is the Worker's, made from the canonical corpus. This file
 * only speaks HTTP, and it fails loudly with a typed reason so the engine can
 * fall back to the extractive answer without guessing why.
 */

import { ASK_ENDPOINT, HOSTED_TIMEOUT_MS } from "@/components/assistant/config";
import type { AskResult, AskSource } from "./engine";

export type HostedFailure =
  | "disabled"
  | "network"
  | "timeout"
  | "rate_limited"
  | "budget"
  | "upstream"
  | "rejected";

export class HostedError extends Error {
  kind: HostedFailure;
  retryAfter?: number;
  constructor(kind: HostedFailure, retryAfter?: number) {
    super(`hosted:${kind}`);
    this.name = "HostedError";
    this.kind = kind;
    this.retryAfter = retryAfter;
  }
}

export interface HostedTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * The Worker's JSON shape. Kept in step with worker/src/response.ts by hand,
 * in the one place a wire format has to be.
 */
interface HostedResponse {
  answer: string;
  mode: "model" | "retrieval";
  sources: AskSource[];
  relatedLinks: AskSource[];
  suggestions: string[];
  cta?: { label: string; href: string };
  confidence: "high" | "low";
  grounding: {
    records: number;
    recordIds: string[];
    latencyMs: number;
  };
}

/** True when a public Worker URL was configured at build time. */
export const hostedEnabled = () => ASK_ENDPOINT.length > 0;

const asSources = (value: unknown): AskSource[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is AskSource =>
          !!item &&
          typeof item === "object" &&
          typeof (item as AskSource).title === "string" &&
          typeof (item as AskSource).url === "string" &&
          typeof (item as AskSource).kind === "string",
      )
    : [];

/**
 * Ask the Worker. Resolves to an `AskResult`, or throws a `HostedError`.
 *
 * The caller's signal (a newer question, panel closed) and the deadline are
 * combined so either aborts the request. A deadline abort surfaces as
 * `timeout`, the caller's as a plain `AbortError` the engine re-throws.
 */
export async function askHosted(options: {
  question: string;
  pathname: string;
  pageTitle: string;
  history: HostedTurn[];
  selectedRecordIds: string[];
  signal?: AbortSignal;
}): Promise<AskResult> {
  if (!hostedEnabled()) throw new HostedError("disabled");

  const controller = new AbortController();
  let timedOut = false;
  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, HOSTED_TIMEOUT_MS);
  const onOuterAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onOuterAbort, { once: true });

  /* Named string fields only — see the module note. */
  const body = JSON.stringify({
    question: options.question,
    pathname: options.pathname,
    pageTitle: options.pageTitle,
    history: options.history.map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    selectedRecordIds: options.selectedRecordIds,
  });

  let response: Response;
  try {
    response = await fetch(ASK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal,
      /* No cookies, no credentials: the endpoint is anonymous by design. */
      credentials: "omit",
    });
  } catch (error) {
    if (timedOut) throw new HostedError("timeout");
    if (options.signal?.aborted) throw error;
    throw new HostedError("network");
  } finally {
    window.clearTimeout(timer);
    options.signal?.removeEventListener("abort", onOuterAbort);
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("Retry-After") ?? "");
    throw new HostedError(
      "rate_limited",
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    );
  }
  if (response.status === 503) throw new HostedError("budget");
  if (response.status >= 400 && response.status < 500) {
    throw new HostedError("rejected");
  }
  if (!response.ok) throw new HostedError("upstream");

  let payload: HostedResponse;
  try {
    payload = (await response.json()) as HostedResponse;
  } catch {
    throw new HostedError("upstream");
  }
  if (typeof payload?.answer !== "string" || !payload.answer.trim()) {
    throw new HostedError("upstream");
  }

  return {
    text: payload.answer,
    sources: asSources(payload.sources),
    relatedLinks: asSources(payload.relatedLinks),
    suggestions: Array.isArray(payload.suggestions)
      ? payload.suggestions.filter((s): s is string => typeof s === "string")
      : [],
    cta:
      payload.cta &&
      typeof payload.cta.label === "string" &&
      typeof payload.cta.href === "string"
        ? payload.cta
        : undefined,
    mode: payload.mode === "model" ? "model" : "retrieval",
    lowConfidence: payload.confidence === "low",
  };
}

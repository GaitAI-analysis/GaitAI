"use client";

/**
 * THE HOSTED LANGUAGE LAYER — one POST to the project's own Cloud Function.
 * =============================================================================
 * Ask GaitAI used to ship a 1.2 GB quantized model to the visitor's browser and
 * run it on WebGPU. That made the assistant a download, excluded every phone
 * and every browser without WebGPU, and capped the writer at 1.5B parameters
 * because that is what a laptop GPU can hold. All of it is gone.
 *
 * Generation now happens behind `askGaitai`, a Firebase Cloud Function in the
 * same project that already backs comments and counters. The function runs the
 * SAME deterministic retrieval this browser runs (its build copies the modules
 * in this directory), builds the grounding prompt server-side, and calls a
 * hosted conversational model through Hugging Face Inference Providers. The
 * Hugging Face token lives in Secret Manager and is never in this bundle, in a
 * NEXT_PUBLIC_ variable, in the repository, or in a response.
 *
 * WHAT CROSSES THE WIRE
 *   out:  the question, the route, the page title, and a short window of prior
 *         turns — nothing else. No DOM, no identifiers, no storage, no cookies.
 *   in:   the answer, the sources retrieval chose, related records, follow-ups
 *         and the CTA — all of it already checked against the corpus route
 *         allowlist on the server, and checked again in `engine.ts`.
 *
 * WHAT THIS MODULE DOES NOT DECIDE. Whether to call the function at all is
 * `engine.ts`'s decision, made from local retrieval confidence. Whether the
 * answer is trustworthy is the server's, made from the same corpus. This file
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
 * The server's JSON shape. Kept in step with functions/src/ask.ts by hand, in
 * the one place a wire format has to be.
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
 * Ask the function. Resolves to an `AskResult`, or throws a `HostedError`.
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

  let response: Response;
  try {
    response = await fetch(ASK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: options.question,
        pathname: options.pathname,
        pageTitle: options.pageTitle,
        history: options.history,
      }),
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
  if (response.status === 400 || response.status === 403) {
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

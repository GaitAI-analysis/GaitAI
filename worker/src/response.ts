/**
 * RESPONSES — the wire shape, and everything under the answer.
 * =============================================================================
 * The answer is the only thing the model wrote. Everything else in the body is
 * derived from the canonical records the Worker resolved — sources, related
 * links, follow-ups, the CTA — by the same shared functions the browser's
 * extractive path uses, so a source can never name a page the model invented.
 *
 * What is never in a response: the token, the provider's raw reply, the system
 * prompt, a stack trace, or the question text echoed back.
 */

import {
  cleanModelAnswer,
  demoHref,
  relatedLinks,
  selectSources,
  shouldOfferDemo,
  suggestFollowUps,
} from "../../src/lib/ask/answer";
import type { Grounding } from "./grounding";

export interface Link {
  title: string;
  url: string;
  kind: string;
}

/** Mirrored by hand in src/lib/ask/hosted.ts. */
export interface AskResponse {
  answer: string;
  mode: "model";
  sources: Link[];
  relatedLinks: Link[];
  suggestions: string[];
  cta?: { label: string; href: string };
  confidence: "high";
  grounding: {
    records: number;
    recordIds: string[];
    latencyMs: number;
  };
}

export type ErrorCode =
  | "not_found"
  | "origin_not_allowed"
  | "method_not_allowed"
  | "payload_too_large"
  | "malformed"
  | "invalid_request"
  | "no_records"
  | "unconfigured"
  | "model_unconfigured"
  | "rate_limited"
  | "budget"
  | "provider_quota"
  | "provider_capacity"
  | "paid_model_unavailable"
  | "provider_unavailable"
  | "provider_rejected"
  | "timeout"
  | "upstream";

const BASE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export function json(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...BASE_HEADERS, ...headers },
  });
}

export function failure(
  status: number,
  error: ErrorCode,
  headers: Record<string, string> = {},
  extra: Record<string, unknown> = {},
): Response {
  return json(status, { error, ...extra }, headers);
}

/**
 * Turn a raw completion into the response body.
 *
 * Returns null when cleaning leaves nothing — a completion that was all
 * reasoning trace, or all URLs — so the caller can answer 502 and let the
 * browser fall back rather than render an empty answer.
 */
export function buildAnswer(options: {
  raw: string;
  grounding: Grounding;
  question: string;
  userTurns: number;
  startedAt: number;
}): AskResponse | null {
  const { raw, grounding, question, userTurns, startedAt } = options;
  const answer = cleanModelAnswer(raw);
  if (!answer) return null;

  const sources = selectSources(answer, grounding.docs);
  return {
    answer,
    mode: "model",
    sources,
    relatedLinks: relatedLinks(sources, grounding.docs),
    suggestions: suggestFollowUps(grounding.docs, question),
    cta: shouldOfferDemo(grounding.docs, userTurns)
      ? { label: "Request a demo", href: demoHref() }
      : undefined,
    confidence: "high",
    grounding: {
      records: grounding.docs.length,
      recordIds: grounding.docs.map((item) => item.doc.id),
      latencyMs: Date.now() - startedAt,
    },
  };
}

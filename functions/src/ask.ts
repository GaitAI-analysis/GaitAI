/**
 * ANSWERING A QUESTION — the core, with no HTTP in it.
 * =============================================================================
 *   question + page + history
 *     → deterministic retrieval (shared/retrieval.ts — the browser's own)
 *     → low confidence?  the extractive answer, no model call
 *     → otherwise        system policy + history + retrieved records
 *                        → hosted model (hf.ts)
 *                        → cleanModelAnswer: no traces, no bare URLs, allowlisted links
 *     → sources, related links, follow-ups, CTA — all from the retrieval result
 *
 * The model never chooses which pages are authoritative. Retrieval chose them
 * before the model was called; the model only writes prose from what it was
 * handed; and everything under the prose is derived from the same retrieval
 * result, so a source can never name a page the answer did not come from.
 *
 * This module is called by the HTTP handler in index.ts and, unchanged, by the
 * local harness in test-local.ts. What is tested is what is deployed.
 */

import { buildMessages } from "./shared/prompt";
import { retrieveGaitAIContext } from "./shared/retrieval";
import {
  cleanModelAnswer,
  demoHref,
  relatedLinks,
  selectSources,
  shouldOfferDemo,
  suggestFollowUps,
} from "./shared/answer";
import { composeExtractiveAnswer } from "./shared/extractive";
import { ensureCorpus } from "./knowledge";
import { chatCompletion, HfError, type HfFailure } from "./hf";
import type { AskRequest } from "./validate";

export interface Link {
  title: string;
  url: string;
  kind: string;
}

/** The wire format. Mirrored by hand in src/lib/ask/hosted.ts. */
export interface AskResponse {
  answer: string;
  mode: "model" | "retrieval";
  sources: Link[];
  relatedLinks: Link[];
  suggestions: string[];
  cta?: { label: string; href: string };
  confidence: "high" | "low";
  grounding: {
    records: number;
    recordIds: string[];
    latencyMs: number;
  };
}

export interface ModelSettings {
  token: string;
  model: string;
  maxTokens: number;
  timeoutMs: number;
}

/** Diagnostics for the log line. No message content, ever. */
export interface AskMeta {
  pathname: string;
  intent: string;
  records: number;
  lowConfidence: boolean;
  model?: string;
  provider?: string;
  promptTokens?: number;
  completionTokens?: number;
  modelLatencyMs?: number;
}

export type AskOutcome =
  | { ok: true; body: AskResponse; meta: AskMeta; usedModel: boolean }
  | { ok: false; failure: HfFailure; meta: AskMeta; detail: string };

/**
 * Whether a question will need the model at all. Exposed so the handler can
 * charge the daily budget only for calls that will actually reach a provider.
 */
export function needsModel(request: AskRequest): boolean {
  ensureCorpus();
  const priorUserTurns = request.history
    .filter((turn) => turn.role === "user")
    .map((turn) => turn.content);
  const result = retrieveGaitAIContext(request.question, request.pathname, priorUserTurns);
  return !(result.lowConfidence || result.docs.length === 0);
}

export async function answerQuestion(
  request: AskRequest,
  settings: ModelSettings,
): Promise<AskOutcome> {
  ensureCorpus();
  const started = Date.now();
  const { question, pathname, pageTitle, history } = request;

  // ── Retrieve ─────────────────────────────────────────────────────────────
  const priorUserTurns = history
    .filter((turn) => turn.role === "user")
    .map((turn) => turn.content);
  const result = retrieveGaitAIContext(question, pathname, priorUserTurns);
  const turnIndex = history.filter((turn) => turn.role === "user").length;

  const meta: AskMeta = {
    pathname,
    intent: result.intent,
    records: result.docs.length,
    lowConfidence: result.lowConfidence,
  };

  const underneath = (answer: string) => {
    const sources = result.lowConfidence ? [] : selectSources(answer, result.docs);
    return {
      sources,
      relatedLinks: result.lowConfidence ? [] : relatedLinks(sources, result.docs),
      suggestions: suggestFollowUps(result.docs, question),
      cta: shouldOfferDemo(result.docs, turnIndex)
        ? { label: "Request a demo", href: demoHref() }
        : undefined,
      confidence: (result.lowConfidence ? "low" : "high") as "low" | "high",
      grounding: {
        records: result.docs.length,
        recordIds: result.docs.map((item) => item.doc.id),
        latencyMs: Date.now() - started,
      },
    };
  };

  /* Nothing scored, or a person the corpus has no record for: the refusal is
     the site's own wording, and no model token is spent asking for it. */
  if (result.lowConfidence || result.docs.length === 0) {
    const answer = composeExtractiveAnswer(result);
    return {
      ok: true,
      usedModel: false,
      meta,
      body: { answer, mode: "retrieval", ...underneath(answer) },
    };
  }

  // ── Generate ─────────────────────────────────────────────────────────────
  const messages = buildMessages({ question, result, pathname, pageTitle, history });

  try {
    const completion = await chatCompletion({
      token: settings.token,
      model: settings.model,
      messages,
      maxTokens: settings.maxTokens,
      timeoutMs: settings.timeoutMs,
    });

    meta.model = settings.model;
    meta.provider = completion.provider;
    meta.promptTokens = completion.usage.promptTokens;
    meta.completionTokens = completion.usage.completionTokens;
    meta.modelLatencyMs = completion.latencyMs;

    const answer = cleanModelAnswer(completion.text);
    if (!answer) {
      return { ok: false, failure: "empty", meta, detail: "completion cleaned to nothing" };
    }

    return {
      ok: true,
      usedModel: true,
      meta,
      body: { answer, mode: "model", ...underneath(answer) },
    };
  } catch (error) {
    meta.model = settings.model;
    if (error instanceof HfError) {
      return { ok: false, failure: error.kind, meta, detail: error.message };
    }
    return {
      ok: false,
      failure: "upstream",
      meta,
      detail: error instanceof Error ? error.message : "unknown",
    };
  }
}

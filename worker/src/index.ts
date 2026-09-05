/**
 * ASK GAITAI — the hosted half of the movement-intelligence guide.
 * =============================================================================
 *   gaitai.in (GitHub Pages)  →  browser retrieval over the local corpus
 *                             →  selected canonical record IDS
 *                             →  THIS WORKER: validate · resolve ids against the
 *                                canonical corpus · meter · grounded prompt
 *                             →  Google Gemini Developer API (Free Tier)
 *                             →  sanitised answer + sources chosen from the records
 *                             →  browser (which sanitises again)
 *
 *   Any failure on this side  →  the browser's local extractive answer.
 *
 * WHY A WORKER AND NOT A NEXT ROUTE HANDLER OR A FIREBASE FUNCTION
 * The site is a static export on GitHub Pages, which serves files and nothing
 * else; a key anywhere the browser can read it is not a secret. Firebase still
 * backs comments, counters, auth and the admin panel — and none of this: Ask
 * GaitAI's hosted inference has no Firebase dependency at all.
 *
 * ONE ENDPOINT
 *   POST    /api/ask   the question
 *   OPTIONS /api/ask   CORS preflight
 *   anything else      404
 *
 * RESPONSES  200 the answer (see response.ts)
 *            400 malformed JSON or an invalid field · 403 origin · 405 method
 *            413 body too large · 422 none of the ids resolve to a record
 *            429 per-caller limit (Retry-After set)
 *            503 daily budget spent, or the Worker is not configured yet
 *                (GEMINI_API_KEY or GEMINI_MODEL missing), or Gemini quota
 *            502 Gemini rejected the key or the request, blocked or failed
 *            504 Gemini timed out
 * The browser treats every non-200 the same way: it renders the extractive
 * answer from the retrieval it already ran.
 *
 * WHAT IS LOGGED. Structured metadata only — status, record count, timings,
 * token counts, finish reason, failure class — never the question, never the
 * answer, never the key.
 */

import { allowedOrigin, corsHeaders } from "./cors";
import { readConfig, type AskEnv } from "./env";
import { generate, GeminiError } from "./gemini";
import { buildPrompt, resolveRecords } from "./grounding";
import { callerKey, consume } from "./guard";
import { buildAnswer, failure, json } from "./response";
import { LIMITS, validateRequest } from "./validate";

export { AskGuard } from "./guard";

const PATH = "/api/ask";

async function handle(request: Request, env: AskEnv): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== PATH) return failure(404, "not_found");

  const config = readConfig(env);

  // ── Origin, before anything else ────────────────────────────────────────
  const origin = allowedOrigin(request, config.allowedOrigins);
  if (!origin) return failure(403, "origin_not_allowed");
  const cors = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== "POST") {
    return failure(405, "method_not_allowed", { ...cors, Allow: "POST, OPTIONS" });
  }

  // ── Body: bounded, then parsed, then validated ──────────────────────────
  const declared = Number(request.headers.get("Content-Length") ?? "0");
  if (declared > LIMITS.bodyBytes) return failure(413, "payload_too_large", cors);
  const text = await request.text();
  if (text.length > LIMITS.bodyBytes) return failure(413, "payload_too_large", cors);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return failure(400, "malformed", cors);
  }
  const parsed = validateRequest(body);
  if (!parsed.ok) return failure(400, "invalid_request", cors, { detail: parsed.error });
  const ask = parsed.value;

  // ── Canonical records: ids in, records out, unknowns gone ───────────────
  const grounding = resolveRecords(ask.selectedRecordIds, ask.pathname);
  if (grounding.docs.length === 0) return failure(422, "no_records", cors);

  // ── Configuration: fail clearly, before spending anything ───────────────
  if (!config.apiKey) return failure(503, "unconfigured", cors);
  if (!config.model) return failure(503, "model_unconfigured", cors);

  // ── Abuse control ───────────────────────────────────────────────────────
  const decision = await consume(env, await callerKey(request), {
    burstMax: config.burstMax,
    hourlyMax: config.hourlyMax,
    dailyBudget: config.dailyBudget,
  });
  if (!decision.allowed) {
    const retry = { ...cors, "Retry-After": String(decision.retryAfter) };
    if (decision.reason === "budget") {
      console.log(JSON.stringify({ event: "ask.budget_spent" }));
      return failure(503, "budget", retry, { retryAfter: decision.retryAfter });
    }
    return failure(429, "rate_limited", retry, { retryAfter: decision.retryAfter });
  }

  // ── The model ───────────────────────────────────────────────────────────
  const startedAt = Date.now();
  const messages = buildPrompt({
    question: ask.question,
    grounding,
    pathname: ask.pathname,
    pageTitle: ask.pageTitle,
    history: ask.history,
  });

  try {
    const completion = await generate({
      apiKey: config.apiKey,
      model: config.model,
      messages,
      maxOutputTokens: config.maxOutputTokens,
      timeoutMs: config.timeoutMs,
      thinkingLevel: config.thinkingLevel || undefined,
    });

    const answer = buildAnswer({
      raw: completion.text,
      grounding,
      question: ask.question,
      userTurns: ask.history.filter((turn) => turn.role === "user").length,
      startedAt,
    });

    console.log(
      JSON.stringify({
        event: answer ? "ask.answered" : "ask.empty_after_cleaning",
        records: grounding.docs.length,
        finishReason: completion.finishReason,
        promptTokens: completion.usage.promptTokens,
        completionTokens: completion.usage.completionTokens,
        modelLatencyMs: completion.latencyMs,
      }),
    );

    if (!answer) return failure(502, "upstream", cors);
    return json(200, answer, cors);
  } catch (error) {
    /* Never surface a provider error to a visitor: it can carry model names,
       quota state, safety internals and request ids. The browser renders its
       own fallback. The class is logged so the right thing gets fixed — a key,
       a quota, a model name — without a visitor ever seeing it. */
    const kind = error instanceof GeminiError ? error.kind : "upstream";
    const status = error instanceof GeminiError ? error.status : undefined;
    console.log(JSON.stringify({ event: "ask.model_failed", kind, status }));

    if (kind === "timeout") return failure(504, "timeout", cors);
    if (kind === "quota") return failure(503, "provider_quota", cors);
    if (kind === "auth") return failure(502, "provider_auth", cors);
    if (kind === "invalid_request") return failure(502, "provider_rejected", cors);
    /* blocked · empty · malformed · upstream */
    return failure(502, "upstream", cors);
  }
}

export default {
  async fetch(request: Request, env: AskEnv): Promise<Response> {
    try {
      return await handle(request, env);
    } catch {
      /* A bug on this side must not leak a stack trace, and must not take the
         assistant down: a 500 is one more thing the browser falls back from. */
      return failure(500, "upstream");
    }
  },
} satisfies ExportedHandler<AskEnv>;

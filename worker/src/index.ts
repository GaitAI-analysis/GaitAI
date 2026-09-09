/**
 * ASK GAITAI — the hosted half of the movement-intelligence guide.
 * =============================================================================
 *   gaitai.in (GitHub Pages)  →  browser retrieval over the local corpus
 *                             →  selected canonical record IDS
 *                             →  THIS WORKER: validate · resolve ids against the
 *                                canonical corpus · meter · grounded prompt
 *                             →  Cloudflare Workers AI (the `AI` binding)
 *                             →  sanitised answer + sources chosen from the records
 *                             →  browser (which sanitises again)
 *
 *   Any failure on this side  →  the browser's local extractive answer.
 *
 * WHY A WORKER AND NOT A NEXT ROUTE HANDLER OR A FIREBASE FUNCTION
 * The site is a static export on GitHub Pages, which serves files and nothing
 * else. Firebase still backs comments, counters, auth and the admin panel —
 * and none of this: Ask GaitAI's hosted inference has no Firebase dependency.
 * With Workers AI there is no external model API either: the binding is part
 * of the Worker's own environment, so there is no key to keep anywhere.
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
 *            503 the Worker's daily budget spent · WORKERS_AI_MODEL not set ·
 *                Workers AI free allocation used up · out of capacity ·
 *                the configured model requires Workers Paid
 *            502 the model id is invalid, the account may not use it, the
 *                request was rejected, or the model failed / answered nothing
 *            504 the model did not answer within the deadline
 * The browser treats every non-200 the same way: it renders the extractive
 * answer from the retrieval it already ran.
 *
 * WHAT IS LOGGED. Structured metadata only — status, record count, timings,
 * token counts, failure class and Cloudflare's numeric error code — never the
 * question, never the answer, never the provider's message text.
 */

import { allowedOrigin, corsHeaders } from "./cors";
import { readConfig, type AskEnv } from "./env";
import { buildPrompt, resolveRecords, type Grounding } from "./grounding";
import { callerKey, consume } from "./guard";
import { generateWithFallback, resolveProviders } from "./provider";
import { buildAnswer, failure, json, type RetrievalDebug } from "./response";
import { embeddingIndex, retrieveInWorker, type WorkerRetrieval } from "./semantic";
import { LIMITS, validateRequest, type AskRequest } from "./validate";
import { WorkersAiError } from "./workers-ai";

export { AskGuard } from "./guard";

const PATH = "/api/ask";

/**
 * LOCAL DEBUG BLOCK — printed only when ASK_DEBUG is set in .dev.vars, never
 * in production (wrangler.jsonc does not define it). This is the one place
 * the question text is ever written to a log, and it exists so a developer
 * running `wrangler dev` can see the whole RAG path for one question:
 *
 *   [Ask GaitAI]
 *   question: Who is Anubha?
 *   selected: person:anubha-parashar, research:res-gait-biometrics, …
 *   resolved:
 *     person:anubha-parashar — Anubha Parashar
 *     …
 *   provider: workers-ai
 *   model: @cf/meta/llama-3.2-3b-instruct
 *   status: 200
 *   latency: 1241ms
 */
/** The same diagnostics as the console block, as data for the local e2e script. */
function retrievalDebug(
  retrieval: WorkerRetrieval | null,
  grounding: Grounding,
  models: RetrievalDebug["models"],
  latency: Record<string, number>,
): RetrievalDebug {
  const r = retrieval?.result;
  return {
    normalizedQuery: r?.standaloneQuery ?? "",
    intent: r?.retrieval.intent ?? "",
    entity: r ? `${r.retrieval.understanding.entity.title} [${r.retrieval.understanding.entity.via}]` : "",
    domain: r?.retrieval.understanding.domain ? `${r.retrieval.understanding.domain.subject} (${r.retrieval.understanding.askType})` : null,
    semanticUsed: Boolean(retrieval && retrieval.disabled === null && r && r.semantic.length > 0),
    disabled: retrieval?.disabled ?? null,
    degraded: r?.degraded ?? [],
    lexical: (r?.lexical ?? []).slice(0, 10).map((item) => ({ id: item.doc.id, score: Number(item.score.toFixed(2)) })),
    semantic: (r?.semantic ?? []).slice(0, 10).map((hit) => ({ id: hit.id, score: Number(hit.score.toFixed(4)) })),
    hybrid: (r?.merged ?? []).slice(0, 10).map((c) => ({ id: c.id, score: Number(c.hybrid.toFixed(4)) })),
    reranked: r?.reranked ? r.reranked.slice(0, 10).map((item) => ({ id: item.id, score: Number(item.score.toFixed(4)) })) : null,
    final: grounding.docs.map((item) => item.doc.id),
    models,
    latency: r
      ? { ...latency, lexicalMs: r.timings.lexicalMs, embedMs: r.timings.embedMs, cosineMs: r.timings.semanticMs, mergeMs: r.timings.mergeMs, rerankMs: r.timings.rerankMs }
      : latency,
  };
}

function debugBlock(options: {
  ask: AskRequest;
  grounding: Grounding;
  retrieval: WorkerRetrieval | null;
  provider: string;
  model: string;
  embeddingModel: string;
  rerankModel: string;
  status: number;
  latencyMs: number;
  note?: string;
}): string {
  const { ask, grounding, retrieval, provider, model, embeddingModel, rerankModel, status, latencyMs, note } = options;
  const dropped = ask.selectedRecordIds.filter((id) => !grounding.docs.some((item) => item.doc.id === id));
  const r = retrieval?.result;
  const fmt = (n: number) => n.toFixed(3);
  return [
    "[Ask GaitAI retrieval]",
    `original: ${ask.question}`,
    r ? `normalized: ${r.standaloneQuery}` : "",
    r ? `intent: ${r.retrieval.intent} (${r.retrieval.understanding.confidence}) · entity: ${r.retrieval.understanding.entity.title} [${r.retrieval.understanding.entity.via}]${r.retrieval.understanding.domain ? ` · domain: ${r.retrieval.understanding.domain.subject} (${r.retrieval.understanding.askType})` : ""}` : "",
    `pathname: ${ask.pathname}`,
    `browser selected: ${ask.selectedRecordIds.join(", ") || "(none)"}`,
    dropped.length ? `dropped (not in final grounding): ${dropped.join(", ")}` : "",
    retrieval?.disabled ? `semantic stage: OFF — ${retrieval.disabled}` : "",
    r?.degraded.length ? `degraded: ${r.degraded.join("; ")}` : "",
    r ? "LEXICAL" : "",
    ...(r ? r.lexical.slice(0, 8).map((item) => `  ${item.score.toFixed(2).padStart(6)} ${item.doc.id}`) : []),
    r?.semantic.length ? "SEMANTIC (cosine)" : "",
    ...(r ? r.semantic.slice(0, 8).map((hit) => `  ${fmt(hit.score)} ${hit.id}`) : []),
    r?.semantic.length ? `HYBRID (w lex ${r.weights.lexical} · sem ${r.weights.semantic} · meta ${r.weights.metadata})` : "",
    ...(r?.semantic.length ? r.merged.slice(0, 8).map((c) => `  ${fmt(c.hybrid)} ${c.id}  [${c.reasons.join(" ")}]`) : []),
    r?.reranked ? "RERANK" : "",
    ...(r?.reranked ? r.reranked.slice(0, 8).map((item) => `  ${fmt(item.score)} ${item.id}`) : []),
    "FINAL (canonical, resolved)",
    ...grounding.docs.map((item) => `  ${item.doc.id} — ${item.doc.title}${item.doc.sectionTitle ? ` › ${item.doc.sectionTitle}` : ""}`),
    `provider: ${provider}`,
    `generation model: ${model}`,
    `embedding model: ${embeddingModel || "(off)"}`,
    `reranker model: ${rerankModel || "(off)"}`,
    r ? `latency: lexical ${r.timings.lexicalMs}ms · embed ${r.timings.embedMs}ms · cosine ${r.timings.semanticMs}ms · merge ${r.timings.mergeMs}ms · rerank ${r.timings.rerankMs}ms · retrieval total ${r.timings.totalMs}ms` : "",
    `status: ${status}`,
    `total latency: ${latencyMs}ms`,
    note ? `note: ${note}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

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
  // The browser's selection is validated first: a request whose ids resolve
  // to nothing is refused before any model call, exactly as before.
  let grounding = resolveRecords(ask.selectedRecordIds, ask.pathname);
  if (grounding.docs.length === 0) return failure(422, "no_records", cors);

  // ── Configuration: fail clearly, before spending anything ───────────────
  // Provider and model are decided in provider.ts — one seam, so a second
  // provider (a self-hosted primary with Workers AI as fallback) is added
  // there and nowhere else.
  const providers = resolveProviders(env, config);
  if (typeof providers === "string") return failure(503, providers, cors);

  // ── Hybrid retrieval, on the Worker's side of the boundary ──────────────
  // With an embedding model configured and an index bundled, the Worker runs
  // the full pipeline — understand · lexical · embed · cosine · merge · rerank
  // — over ITS canonical corpus and grounds on what it selects. The browser's
  // ids remain the fallback for every degraded path, so a failing embedding
  // or reranker changes the ranking, never the availability. With the stage
  // off, the browser's selection is used as before.
  let retrieval: WorkerRetrieval | null = null;
  const retrievalStarted = Date.now();
  try {
    retrieval = await retrieveInWorker({
      ai: env.AI,
      config,
      question: ask.question,
      pathname: ask.pathname,
      history: ask.history,
    });
    const usedSemantic = retrieval.disabled === null && retrieval.result.semantic.length > 0;
    if (usedSemantic && retrieval.result.final.length > 0) {
      const chosen = resolveRecords(retrieval.result.final.map((item) => item.doc.id), ask.pathname);
      if (chosen.docs.length > 0) grounding = chosen;
    }
  } catch {
    /* A bug in the pipeline must not take the assistant down: the browser's
       own selection grounds the answer, as it did before this stage existed. */
    retrieval = null;
  }
  const retrievalMs = Date.now() - retrievalStarted;

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

  const primary = providers[0];
  try {
    const completion = await generateWithFallback(providers, messages, { timeoutMs: config.timeoutMs });

    const answer = buildAnswer({
      raw: completion.text,
      grounding,
      question: ask.question,
      userTurns: ask.history.filter((turn) => turn.role === "user").length,
      startedAt,
      debug: config.debug
        ? retrievalDebug(retrieval, grounding, {
            provider: completion.provider,
            generation: completion.model,
            embedding: retrieval && !retrieval.disabled ? config.embeddingModel : "",
            rerank: retrieval?.result.reranked ? config.rerankModel : "",
          }, { retrievalMs, modelMs: completion.latencyMs, totalMs: Date.now() - startedAt })
        : undefined,
    });

    /* Production log: structural only. The provider and model ids are
       configuration, not visitor data, and are what an operator needs to see
       when a fallback provider answered instead of the primary. */
    console.log(
      JSON.stringify({
        event: answer ? "ask.answered" : "ask.empty_after_cleaning",
        provider: completion.provider,
        model: completion.model,
        embeddingModel: retrieval && !retrieval.disabled ? config.embeddingModel : "",
        rerankModel: retrieval?.result.reranked ? config.rerankModel : "",
        retrieval: retrieval
          ? {
              intent: retrieval.result.retrieval.intent,
              semantic: retrieval.disabled === null && retrieval.result.semantic.length > 0,
              reranked: retrieval.result.reranked !== null,
              degraded: retrieval.result.degraded,
              ms: retrievalMs,
              embedMs: retrieval.result.timings.embedMs,
              rerankMs: retrieval.result.timings.rerankMs,
            }
          : null,
        records: grounding.docs.length,
        promptTokens: completion.usage.promptTokens,
        completionTokens: completion.usage.completionTokens,
        modelLatencyMs: completion.latencyMs,
      }),
    );

    const status = answer ? 200 : 502;
    if (config.debug) {
      console.log(
        debugBlock({
          ask,
          grounding,
          retrieval,
          provider: completion.provider,
          model: completion.model,
          embeddingModel: retrieval && !retrieval.disabled ? config.embeddingModel : "",
          rerankModel: retrieval?.result.reranked ? config.rerankModel : "",
          status,
          latencyMs: Date.now() - startedAt,
          note: answer ? undefined : "completion was empty after cleaning",
        }),
      );
    }

    if (!answer) return failure(502, "upstream", cors);
    return json(200, answer, cors);
  } catch (error) {
    /* Never surface a provider error to a visitor: Cloudflare's messages carry
       account state, model names and quota detail. The browser renders its
       own fallback; the class and numeric code are logged so the right thing
       gets fixed — a plan, a model id, an allocation — without a visitor ever
       seeing it. */
    const failed = error instanceof WorkersAiError ? error : new WorkersAiError("upstream");
    /* `diagnostics` is structural only — lengths, counts, finish_reason, key
       names — never prompt, record, question, answer or reasoning text. */
    console.log(
      JSON.stringify({
        event: "ask.model_failed",
        provider: primary.name,
        model: primary.model,
        kind: failed.kind,
        code: failed.code,
        diagnostics: failed.diagnostics ?? null,
      }),
    );

    const status = (() => {
      switch (failed.kind) {
        case "timeout":
          return [504, "timeout"] as const;
        case "free_quota":
          return [503, "provider_quota"] as const;
        case "capacity":
          return [503, "provider_capacity"] as const;
        case "paid_model":
          return [503, "paid_model_unavailable"] as const;
        case "permission":
          return [502, "provider_unavailable"] as const;
        case "invalid_model":
        case "invalid_request":
          return [502, "provider_rejected"] as const;
        default:
          /* malformed · empty · upstream */
          return [502, "upstream"] as const;
      }
    })();

    if (config.debug) {
      console.log(
        debugBlock({
          ask,
          grounding,
          retrieval,
          provider: primary.name,
          model: primary.model,
          embeddingModel: retrieval && !retrieval.disabled ? config.embeddingModel : "",
          rerankModel: retrieval?.result.reranked ? config.rerankModel : "",
          status: status[0],
          latencyMs: Date.now() - startedAt,
          note: `${failed.kind}${failed.code ? ` (code ${failed.code})` : ""}`,
        }),
      );
    }
    return failure(status[0], status[1], cors);
  }
}

export default {
  async fetch(request: Request, env: AskEnv): Promise<Response> {
    try {
      /* Decode the bundled vectors on the first request of the isolate, so the
         cost is paid once and never on a per-question basis. */
      embeddingIndex();
      return await handle(request, env);
    } catch {
      /* A bug on this side must not leak a stack trace, and must not take the
         assistant down: a 500 is one more thing the browser falls back from. */
      return failure(500, "upstream");
    }
  },
} satisfies ExportedHandler<AskEnv>;

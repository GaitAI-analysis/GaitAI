/**
 * THE MODEL PROVIDER — one seam between the RAG pipeline and whoever writes.
 * =============================================================================
 * Everything upstream of this file is provider-agnostic: validation, canonical
 * record resolution, the grounding prompt, post-processing, sources. This file
 * is where "which model, through which adapter" is decided, so that decision
 * lives in exactly one place.
 *
 * TODAY: Cloudflare Workers AI through the Worker's own `AI` binding, model
 * from WORKERS_AI_MODEL. Proven end to end on 2026-09-09 with
 * `@cf/meta/llama-3.2-3b-instruct` (grounded answer from supplied context).
 *
 * LATER: a primary self-hosted provider (e.g. an Ollama endpoint) with Workers
 * AI as the fallback, or another hosted provider — each is one more
 * `Provider` here and one more branch in `resolveProviders()`. Nothing in
 * index.ts, grounding.ts or the shared prompt module changes; the handler
 * asks for the provider chain and calls `generate()` on it.
 *
 * WHAT A PROVIDER RETURNS is the shared `Completion` shape from workers-ai.ts:
 * text, latency, token usage and safe structural diagnostics — no raw
 * provider payload ever leaves the adapter.
 */

import type { AskConfig, AskEnv } from "./env";
import { generate, type ChatMessage, type Completion } from "./workers-ai";

export interface Provider {
  /** Short stable name for logs: "workers-ai", later "ollama", …. */
  readonly name: string;
  /** The exact model id this provider will call. */
  readonly model: string;
  generate(messages: ChatMessage[], options: { timeoutMs: number }): Promise<Completion>;
}

/**
 * Retrieval models are routed separately from generation (worker/src/semantic.ts):
 * embeddings and reranking are Workers AI tasks today, and a future generation
 * provider (a self-hosted model) need not supply them. The model ids come from
 * EMBEDDING_MODEL and RERANK_MODEL; see env.ts.
 */

/** Why no provider could be built — mapped to a 503 by the handler. */
export type ProviderGap = "unconfigured" | "model_unconfigured";

function workersAi(env: AskEnv, config: AskConfig): Provider | ProviderGap {
  if (!env.AI) return "unconfigured";
  if (!config.model) return "model_unconfigured";
  const ai = env.AI;
  return {
    name: "workers-ai",
    model: config.model,
    generate: (messages, { timeoutMs }) =>
      generate({
        ai,
        model: config.model,
        messages,
        maxOutputTokens: config.maxOutputTokens,
        timeoutMs,
        reasoningEffort: config.reasoningEffort || undefined,
      }),
  };
}

/**
 * The provider chain, primary first. One entry today. When a second provider
 * is added, return it ahead of Workers AI here and let `generateWithFallback`
 * try them in order.
 */
export function resolveProviders(env: AskEnv, config: AskConfig): Provider[] | ProviderGap {
  const primary = workersAi(env, config);
  return typeof primary === "string" ? primary : [primary];
}

export interface ProviderCompletion extends Completion {
  provider: string;
  model: string;
}

/**
 * Try each provider in order; the first that answers wins. A provider that
 * throws hands the same messages to the next; the LAST error propagates when
 * none answers, so the handler's classification sees a real failure class.
 */
export async function generateWithFallback(
  providers: Provider[],
  messages: ChatMessage[],
  options: { timeoutMs: number },
): Promise<ProviderCompletion> {
  let lastError: unknown = new Error("no provider");
  for (const provider of providers) {
    try {
      const completion = await provider.generate(messages, options);
      return { ...completion, provider: provider.name, model: provider.model };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

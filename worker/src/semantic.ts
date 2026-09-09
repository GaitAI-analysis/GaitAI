/**
 * SEMANTIC RETRIEVAL IN THE WORKER — the binding-facing half.
 * =============================================================================
 * The pipeline itself (understand → lexical → embed → cosine → merge → rerank
 * → final) is the shared, pure module src/lib/ask/semantic.ts. This file gives
 * it what only a Worker has: the record vectors bundled at build time
 * (src/generated/embeddings.json), Workers AI through `env.AI` for the query
 * embedding and the reranker, and two small caches that live as long as the
 * isolate.
 *
 * WHY HERE AND NOT IN THE BROWSER. Cloudflare's embedding and reranking models
 * are reachable only through a Worker's `AI` binding. The browser therefore
 * keeps doing what it already did — deterministic lexical retrieval and the
 * extractive fallback — and sends its selection; the Worker runs the richer
 * pipeline and, when a stage is unavailable, falls back to exactly that
 * browser selection. Nothing the browser sends is evidence; the ids it sends
 * are one candidate list among others.
 *
 * VECTORS ARE CHECKED AGAINST THE MODEL. An index built with one embedding
 * model is meaningless under another; if EMBEDDING_MODEL differs from the
 * index's recorded model the semantic stage is disabled and logged, rather
 * than silently ranking on noise.
 */

import embeddingsFile from "./generated/embeddings.json";
import {
  loadEmbeddingIndex,
  retrieveHybrid,
  type EmbeddingFile,
  type EmbeddingIndex,
  type HybridResult,
  type HybridWeights,
  type SemanticServices,
} from "../../src/lib/ask/semantic";
import type { ChatTurnLike } from "../../src/lib/ask/understand";
import type { AskConfig } from "./env";
import { ensureCorpus } from "./grounding";
import { embedTexts, rerankDocuments, type AiRunner } from "./workers-ai";

let index: EmbeddingIndex | null | undefined;
let indexNote = "";

/** Decode the bundled vectors once per isolate. */
export function embeddingIndex(): { index: EmbeddingIndex | null; note: string } {
  if (index !== undefined) return { index, note: indexNote };
  ensureCorpus();
  const file = embeddingsFile as unknown as EmbeddingFile;
  if (!file.records?.length) {
    index = null;
    indexNote = "no vectors bundled (run `npm run ask:embed`)";
  } else {
    index = loadEmbeddingIndex(file);
    indexNote = `${index.ids.length} vectors · ${index.model} · ${index.dim}d`;
  }
  return { index, note: indexNote };
}

/**
 * Query embeddings for repeated standalone queries. Bounded; the key is the
 * NORMALISED query, which carries no visitor identity — a pronoun has already
 * been resolved to a canonical name and nothing else of the conversation
 * survives into it.
 */
const QUERY_CACHE_MAX = 256;
const queryCache = new Map<string, Float32Array>();
function boundedCache(): Map<string, Float32Array> {
  if (queryCache.size > QUERY_CACHE_MAX) {
    const oldest = queryCache.keys().next().value;
    if (oldest !== undefined) queryCache.delete(oldest);
  }
  return queryCache;
}

/** The services the pipeline needs, from the binding — or null when disabled. */
export function semanticServices(ai: AiRunner | undefined, config: AskConfig, idx: EmbeddingIndex | null): { services: SemanticServices | null; note: string } {
  if (!ai) return { services: null, note: "no AI binding" };
  if (!config.embeddingModel) return { services: null, note: "EMBEDDING_MODEL empty" };
  if (!idx) return { services: null, note: "no index" };
  if (idx.model !== config.embeddingModel) {
    return { services: null, note: `index built with ${idx.model}, EMBEDDING_MODEL is ${config.embeddingModel}` };
  }
  return {
    services: {
      embeddingModel: config.embeddingModel,
      rerankModel: config.rerankModel || undefined,
      embed: (texts) => embedTexts({ ai, model: config.embeddingModel, texts, pooling: idx.pooling === "none" ? undefined : idx.pooling === "mean" ? "mean" : "cls" }),
      rerank: config.rerankModel
        ? (query, documents) => rerankDocuments({ ai, model: config.rerankModel, query, documents })
        : undefined,
    },
    note: "",
  };
}

export interface WorkerRetrieval {
  result: HybridResult;
  /** Why the semantic stage was not used, when it was not. */
  disabled: string | null;
}

/** Run the hybrid pipeline in the Worker for one request. */
export async function retrieveInWorker(options: {
  ai: AiRunner | undefined;
  config: AskConfig;
  question: string;
  pathname: string;
  history: ChatTurnLike[];
}): Promise<WorkerRetrieval> {
  ensureCorpus();
  const { index: idx } = embeddingIndex();
  const { services, note } = semanticServices(options.ai, options.config, idx);
  const weights: HybridWeights | undefined = options.config.hybridWeights ?? undefined;
  const result = await retrieveHybrid({
    question: options.question,
    pathname: options.pathname,
    history: options.history,
    services,
    index: idx,
    weights,
    queryCache: boundedCache(),
  });
  return { result, disabled: services ? null : note };
}

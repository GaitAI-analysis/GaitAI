/**
 * SEMANTIC RETRIEVAL — embeddings, hybrid merge, reranking. Shared.
 * =============================================================================
 * Lexical retrieval over 331 records is precise on names and blind to
 * meaning: "does it do surveillance" shares no word with a record that says
 * "camera", "operator" and "restricted-zone entry". Intent and synonym rules
 * papered over that one phrasing at a time. This module adds meaning:
 *
 *   BUILD TIME   every canonical record gets an embedding of its semantic
 *                search text (title, section, type, topics, aliases, content),
 *                keyed by its stable id and a content hash so only changed
 *                records are re-embedded. scripts/build-embeddings.ts.
 *
 *   QUERY TIME   the standalone query (understand.ts) is embedded once;
 *                cosine similarity against every record vector (in memory —
 *                331 × 384 floats is 500 KB, no vector database needed) gives
 *                the semantic candidates; they merge with the lexical
 *                candidates on a normalised hybrid score; the best 15–20 go to
 *                a reranker that scores query/document relevance directly; the
 *                best 5–7 canonical record IDS go on to grounding.
 *
 * WHAT DOES NOT CHANGE. The output is record ids. The Worker still resolves
 * them against its own canonical corpus; the browser still cannot supply
 * evidence; the prompt policy still decides what may be claimed. Similarity
 * finds SecureVision for "military"; it does not make GaitAI a defence
 * supplier — the Application line and the policy say what may be said.
 *
 * WHERE IT RUNS. Embeddings and reranking need Cloudflare Workers AI, which
 * is reachable only through a Worker's `AI` binding, so the query-time
 * pipeline runs in the Worker (worker/src/index.ts) with the browser's own
 * lexical selection as the always-available fallback. The harnesses run the
 * same pipeline in Node against the loopback bench Worker (scripts/ask-eval.ts).
 * Every provider-facing call is injected (`SemanticServices`), so this module
 * is pure computation and the same in every environment.
 *
 * FAILURE IS DEGRADATION, NOT AN ERROR. No embedding → lexical order. No
 * reranker → hybrid order. The pipeline always returns records, and says in
 * `degraded` which stage stepped aside.
 */

import { docById, knowledge, type KnowledgeDoc } from "./corpus";
import { INTENTS, type Intent } from "./intent";
import { retrieveGaitAIContext, type RetrievalResult, type RetrievedDoc } from "./retrieval";
import type { ChatTurnLike, Understanding } from "./understand";

/**
 * THE QUERY THAT IS EMBEDDED AND RERANKED AGAINST.
 *
 * Not the readable "normalized" sentence: its intent boilerplate ("How does
 * GaitAI handle privacy — …", "Which publications in the GaitAI record
 * cover …") dominates a small embedding, so a misread intent poisoned the
 * semantic stage — a question about someone wandering a storage area became
 * a privacy question in vector space. What is embedded is the visitor's own
 * words with the reference resolved ("it" → "SecureVision"), and, for a
 * domain question, the domain vocabulary's site words appended so "military"
 * can reach the records that say "restricted", "perimeter", "watchlist".
 * Nothing here is an answer; it is search text.
 */
export function semanticQueryText(understanding: Understanding): string {
  let text = understanding.text.replace(/[?!.]+$/g, "").trim();
  /* A bare topic gets its subject: "military" alone embeds poorly; "GaitAI for
     military" is the question that was asked. */
  if (understanding.elliptical && !/\bgaitai\b/i.test(text)) {
    text = `${understanding.entity.title} for ${text}`;
  }
  if (understanding.domain?.concepts.length) {
    const terms = understanding.domain.concepts
      .flatMap((concept) => concept.terms.filter((term) => term.weight >= 0.5).map((term) => term.term))
      .slice(0, 6);
    if (terms.length) text = `${text} — ${terms.join(", ")}`;
  }
  return text;
}

// ── Models — configured, never scattered ─────────────────────────────────────

/** Cloudflare's small English embedding model: 384 dimensions, batchable. */
export const DEFAULT_EMBEDDING_MODEL = "@cf/baai/bge-small-en-v1.5";
export const EMBEDDING_DIM = 384;
/** `cls` pooling, as Cloudflare recommends for accuracy. Stored with the index:
 *  vectors pooled differently are not comparable. */
export const EMBEDDING_POOLING = "cls" as const;
/** Cloudflare's cross-encoder reranker: scores (query, document) relevance. */
export const DEFAULT_RERANK_MODEL = "@cf/baai/bge-reranker-base";

// ── Embedding text ───────────────────────────────────────────────────────────

const TYPE_WORD: Record<string, string> = {
  product: "GaitAI product module",
  "use-case": "deployment environment",
  publication: "publication",
  research: "research area",
  insight: "GaitAI Insights article",
  capability: "AI capability",
  signal: "movement signal",
  deployment: "deployment information",
  policy: "policy",
  page: "site page",
  person: "person",
  talk: "talk",
};

/** How much content goes into the embedding. bge-small reads ~512 tokens. */
const EMBED_CONTENT_CHARS = 1400;

/**
 * The semantic search text of a record — metadata a visitor would ask with
 * (what it is, its aliases, what it is about) ahead of its prose. Only public
 * fields of a public record: aliases are the site's own, and there is no
 * admin, configuration or secret content in the corpus to begin with.
 */
export function embeddingText(doc: KnowledgeDoc): string {
  const lines = [
    `Title: ${doc.title}`,
    doc.sectionTitle ? `Section: ${doc.sectionTitle}` : "",
    `Type: ${TYPE_WORD[doc.type] ?? doc.type}${doc.category ? ` — ${doc.category}` : ""}`,
    doc.topics?.length ? `Topics: ${doc.topics.join(", ")}` : "",
    doc.aliases?.length ? `Aliases: ${doc.aliases.join(", ")}` : "",
    doc.keywords.length ? `Keywords: ${doc.keywords.slice(0, 24).join(", ")}` : "",
    doc.summary ? `Summary: ${doc.summary}` : "",
    `Content: ${doc.content.slice(0, EMBED_CONTENT_CHARS)}`,
  ];
  return lines.filter(Boolean).join("\n");
}

/** Compact text for the reranker: what the record is and its summary. */
export function rerankText(doc: KnowledgeDoc): string {
  return [
    `${doc.title}${doc.sectionTitle ? ` — ${doc.sectionTitle}` : ""}`,
    `${TYPE_WORD[doc.type] ?? doc.type}${doc.category ? `, ${doc.category}` : ""}`,
    doc.topics?.length ? `Topics: ${doc.topics.slice(0, 6).join(", ")}` : "",
    doc.summary,
    doc.content.slice(0, 500),
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * FNV-1a, 64-bit, hex — a deterministic content hash that runs identically in
 * Node and in the Worker with no crypto dependency. Collisions do not matter
 * here: a stale vector for one record would be a ranking wobble, not a fact.
 */
export function contentHash(text: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= c;
    h2 = Math.imul(h2, 0x01000193) >>> 0;
  }
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}

// ── Stored vectors: int8, base64 ─────────────────────────────────────────────

export interface StoredEmbedding {
  id: string;
  /** contentHash(embeddingText(doc)) at the time the vector was made. */
  hash: string;
  /** Per-vector scale: value = q * scale / 127. */
  scale: number;
  /** base64 of Int8Array[dim]. */
  q: string;
}

export interface EmbeddingFile {
  model: string;
  /** "cls" | "mean" for the bge-en family; "none" for models that take no pooling parameter (bge-m3). */
  pooling: string;
  dim: number;
  generatedAt: string;
  records: StoredEmbedding[];
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Bytes → base64 without Buffer or atob, so it runs in Node and workerd alike. */
export function toBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[a >> 2] + B64[((a & 3) << 4) | (b >> 4)];
    out += i + 1 < bytes.length ? B64[((b & 15) << 2) | (c >> 6)] : "=";
    out += i + 2 < bytes.length ? B64[c & 63] : "=";
  }
  return out;
}

export function fromBase64(text: string): Uint8Array {
  const clean = text.replace(/=+$/, "");
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (const char of clean) {
    buffer = (buffer << 6) | B64.indexOf(char);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[index++] = (buffer >> bits) & 0xff;
    }
  }
  return out;
}

/** Unit-normalise in place and return the same array. */
export function normalize(vector: Float32Array): Float32Array {
  let sum = 0;
  for (let i = 0; i < vector.length; i += 1) sum += vector[i] * vector[i];
  const norm = Math.sqrt(sum) || 1;
  for (let i = 0; i < vector.length; i += 1) vector[i] /= norm;
  return vector;
}

/**
 * Quantise a float vector to int8 with a per-vector scale. Cosine similarity
 * on unit vectors survives this within ~0.005 — far below the gaps that decide
 * a ranking — and the index shrinks four-fold against float32, eight-fold
 * against JSON floats.
 */
export function quantize(values: number[]): { scale: number; q: string } {
  const vector = normalize(Float32Array.from(values));
  let max = 0;
  for (const value of vector) max = Math.max(max, Math.abs(value));
  const scale = max || 1;
  const bytes = new Uint8Array(vector.length);
  for (let i = 0; i < vector.length; i += 1) {
    const int = Math.max(-127, Math.min(127, Math.round((vector[i] / scale) * 127)));
    bytes[i] = int & 0xff;
  }
  return { scale, q: toBase64(bytes) };
}

export function dequantize(stored: Pick<StoredEmbedding, "scale" | "q">, dim: number): Float32Array {
  const bytes = fromBase64(stored.q);
  const vector = new Float32Array(dim);
  for (let i = 0; i < dim && i < bytes.length; i += 1) {
    const int = bytes[i] > 127 ? bytes[i] - 256 : bytes[i];
    vector[i] = (int / 127) * stored.scale;
  }
  return normalize(vector);
}

// ── The in-memory index ──────────────────────────────────────────────────────

export interface EmbeddingIndex {
  model: string;
  pooling: string;
  dim: number;
  ids: string[];
  /** Row-major, unit vectors, ids.length × dim. */
  matrix: Float32Array;
}

/**
 * Decode the stored file once per isolate. Records the corpus no longer has
 * are skipped; records with no stored vector are simply absent from semantic
 * retrieval (lexical still finds them).
 */
export function loadEmbeddingIndex(file: EmbeddingFile): EmbeddingIndex {
  const byId = docById();
  const kept = file.records.filter((record) => byId.has(record.id));
  const matrix = new Float32Array(kept.length * file.dim);
  kept.forEach((record, row) => {
    matrix.set(dequantize(record, file.dim), row * file.dim);
  });
  return { model: file.model, pooling: file.pooling, dim: file.dim, ids: kept.map((record) => record.id), matrix };
}

export interface SemanticHit {
  id: string;
  /** Cosine similarity in [-1, 1]; for bge vectors typically 0.4–0.9. */
  score: number;
}

/** Cosine similarity of a unit query vector against every row; top k. */
export function semanticTopK(index: EmbeddingIndex, query: Float32Array, k: number): SemanticHit[] {
  const { dim, ids, matrix } = index;
  const hits: SemanticHit[] = [];
  for (let row = 0; row < ids.length; row += 1) {
    let dot = 0;
    const offset = row * dim;
    for (let i = 0; i < dim; i += 1) dot += matrix[offset + i] * query[i];
    hits.push({ id: ids[row], score: dot });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, k);
}

// ── Services — everything that talks to a provider is injected ──────────────

export interface SemanticServices {
  /** Embed texts with the configured model; unit-normalised on return. */
  embed(texts: string[]): Promise<number[][]>;
  /** Score each document against the query; one score per document, in order. */
  rerank?(query: string, documents: string[]): Promise<number[]>;
  embeddingModel: string;
  rerankModel?: string;
}

// ── Hybrid merge ─────────────────────────────────────────────────────────────

export interface HybridWeights {
  lexical: number;
  semantic: number;
  metadata: number;
}

/** The balanced point; the pipeline moves off it as the lexical engine's own
 *  confidence dictates (see `adaptiveWeights`). Tuned on scripts/ask-eval.ts. */
export const DEFAULT_WEIGHTS: HybridWeights = { lexical: 0.45, semantic: 0.45, metadata: 0.1 };

/**
 * Intents where the deterministic engine is the authority and meaning is a
 * tie-breaker: an exact name, a paper, a place on the site, "latest". The
 * semantic weight is reduced for these so a near-synonym cannot outrank the
 * record the visitor named.
 */
const PRECISE_INTENTS = new Set<Intent>(["PERSON", "PUBLICATION", "NAVIGATION", "INSIGHTS", "COMPARISON", "PRODUCT", "RESEARCH", "LAB_DATASET"]);
const PRECISE_WEIGHTS: HybridWeights = { lexical: 0.7, semantic: 0.2, metadata: 0.1 };

/**
 * TRUST THE ENGINE THAT HAS A SIGNAL. The lexical score is an absolute: a
 * named module scores 20+, a well-matched environment 12–40, and the
 * description-style question that shares no word with any record leaves the
 * best lexical hit at 4–8 — noise. Weights follow that: when lexical is
 * confident it carries most of the score; when it is weak, meaning does.
 * Between the two anchors the weights move linearly.
 */
export function adaptiveWeights(intent: Intent, lexicalMax: number, override?: HybridWeights, structural?: boolean): HybridWeights {
  if (override) return override;
  if (PRECISE_INTENTS.has(intent)) return PRECISE_WEIGHTS;
  let confidence = Math.max(0, Math.min(1, (lexicalMax - 6) / 12));
  /* A STRUCTURAL match — a name, a title, a slug, a documented environment,
     the intent's hub — is a reason to trust the engine whatever the number
     says; a high score built only from body-prose overlap and an intent tilt
     is not ("storage area" lit up the privacy policy). */
  if (structural === true) confidence = Math.max(confidence, 0.8);
  if (structural === false) confidence = Math.min(confidence, 0.35);
  const lexical = 0.25 + 0.5 * confidence;
  const semantic = 0.65 - 0.5 * confidence;
  return { lexical, semantic, metadata: 0.1 };
}

/** Did the lexical engine's top record match on structure, or only on prose?
 *  (An intent hub boost is not structure — it follows the intent, which may
 *  itself be a misreading of the question.) */
const STRUCTURAL_REASON = /\b(entity:|title|title:covered|title:partial|slug|domain:environment|domain:family|expanded)\b/;
export function structuralMatch(top: RetrievedDoc | undefined): boolean | undefined {
  if (!top) return undefined;
  return STRUCTURAL_REASON.test(top.reason);
}

/**
 * COSINE IS ABSOLUTE. bge vectors of a question and an unrelated record sit
 * around 0.45–0.6; a genuine match sits above ~0.7. Relative (min–max)
 * normalisation gave the best hit full weight however weak it was, which is
 * how a privacy page became the "semantic" answer to a question about someone
 * wandering a storage area. The calibration below maps 0.55 → 0 and 0.85 → 1.
 */
const COSINE_FLOOR = 0.55;
const COSINE_CEILING = 0.85;
export const calibrateCosine = (cosine: number) =>
  Math.max(0, Math.min(1, (cosine - COSINE_FLOOR) / (COSINE_CEILING - COSINE_FLOOR)));

/**
 * THE TYPE GATE. A record type the intent demotes as "never" (a talk or a
 * person for a domain question, a person for a publication question — tilts
 * of −4 and below) is not a semantic candidate however well it embeds. Softer
 * demotions (−3: a module on a privacy question) only lower the score, so a
 * misread intent cannot filter the right record out.
 */
const GATE_TILT = -4;

/** How much the reranker's verdict counts against the hybrid score it reordered. */
const RERANK_BLEND = 0.6;

export interface HybridCandidate {
  id: string;
  doc: KnowledgeDoc;
  lexical: number;
  lexicalNorm: number;
  semantic: number | null;
  semanticNorm: number;
  metadata: number;
  hybrid: number;
  reasons: string[];
}

/** Hard preference for the record the question NAMES: it ranks first, whatever the scores. */
function pinnedId(result: RetrievalResult): string | null {
  const entity = result.entity;
  if (!entity || entity.strength < 2) return null;
  /* A brand mention in passing ("where can I try GaitAI") is not a pin. */
  if (entity.entityId === "gaitai" && result.intent !== "GENERAL" && result.intent !== "PRODUCT") return null;
  if (entity.entityId === "gaitai" && result.intent === "PRODUCT" && result.understanding.topic.length > 0) return null;
  return entity.doc.id;
}

export function hybridMerge(
  result: RetrievalResult,
  lexicalIn: RetrievedDoc[],
  semantic: SemanticHit[],
  weights: HybridWeights,
): HybridCandidate[] {
  let lexical = lexicalIn;
  const byId = docById();
  const lexicalMax = Math.max(...lexical.map((item) => item.score), 1e-6);
  const spec = INTENTS[result.intent];
  const prefer = spec.prefer;
  const tilt = { ...spec.prefer, ...spec.demote };
  const pinned = pinnedId(result);
  /* A hard-demoted type the LEXICAL engine still ranked in its top three is
     kept out of the semantic list but stays a lexical candidate at the score
     the engine gave it — the engine has already applied the demotion. */
  const gatedLexical = lexical.filter((item) => (tilt[item.doc.type] ?? 0) > GATE_TILT || item.doc.id === pinned || lexical.indexOf(item) < 3);
  /* The lexical engine's own answer set (its top seven) already applied the
     person-assembly rule; the wider candidate list beyond it has not, so the
     same rule applies here: on a pinned person question, no other person. */
  lexical =
    result.intent === "PERSON" && pinned
      ? gatedLexical.filter((item) => item.doc.type !== "person" || item.doc.id === pinned)
      : gatedLexical;

  const candidates = new Map<string, HybridCandidate>();
  const ensure = (id: string): HybridCandidate | null => {
    const existing = candidates.get(id);
    if (existing) return existing;
    const doc = byId.get(id);
    if (!doc) return null;
    const created: HybridCandidate = {
      id,
      doc,
      lexical: 0,
      lexicalNorm: 0,
      semantic: null,
      semanticNorm: 0,
      metadata: 0,
      hybrid: 0,
      reasons: [],
    };
    candidates.set(id, created);
    return created;
  };

  for (const item of lexical) {
    const candidate = ensure(item.doc.id);
    if (!candidate) continue;
    candidate.lexical = item.score;
    candidate.lexicalNorm = Math.max(0, item.score) / lexicalMax;
    candidate.reasons.push(`lex:${item.reason}`);
  }
  for (const hit of semantic) {
    /* The type gate: a hard-demoted type is not a semantic candidate. It can
       still arrive through the lexical list, where the intent's own demotion
       has already been applied to its score. */
    const doc = byId.get(hit.id);
    if (doc && (tilt[doc.type] ?? 0) <= GATE_TILT && hit.id !== pinned) continue;
    /* "Who is X" is about X: another person's record is not evidence about
       them however close the two embed (every co-author record names the
       founder). The lexical engine already excludes them; so does the merge. */
    if (doc && result.intent === "PERSON" && doc.type === "person" && pinned && hit.id !== pinned) continue;
    const candidate = ensure(hit.id);
    if (!candidate) continue;
    candidate.semantic = hit.score;
    candidate.semanticNorm = calibrateCosine(hit.score);
    candidate.reasons.push("sem");
  }

  for (const candidate of candidates.values()) {
    /* Metadata: the intent's preferred record types, and the named entity. A
       demoted type carries a negative metadata term, so the taxonomy's
       judgement survives the merge. */
    const typeTilt = tilt[candidate.doc.type] ?? 0;
    let metadata = typeTilt > 0 ? Math.min(1, typeTilt / 3) * 0.5 : typeTilt < 0 ? Math.max(-1, typeTilt / 4) : 0;
    if (pinned && candidate.id === pinned) {
      metadata = 1;
      candidate.reasons.push("pinned");
    }
    void prefer;
    candidate.metadata = metadata;
    candidate.hybrid =
      weights.lexical * candidate.lexicalNorm +
      weights.semantic * candidate.semanticNorm +
      weights.metadata * candidate.metadata;
  }

  return [...candidates.values()].sort((a, b) => {
    if (pinned) {
      if (a.id === pinned) return -1;
      if (b.id === pinned) return 1;
    }
    return b.hybrid - a.hybrid;
  });
}

// ── Final selection ──────────────────────────────────────────────────────────

const MAX_FINAL = 7;
const MAX_PER_FAMILY = 2;

/**
 * The best records for grounding, with the same shape rules the lexical
 * engine applies: at most two records of one parent family, and a section
 * travels with its parent so the model knows what page a passage is from.
 */
export function finalize(ordered: { id: string; score: number; reason: string }[], max = MAX_FINAL): RetrievedDoc[] {
  const byId = docById();
  const kept: RetrievedDoc[] = [];
  const keptIds = new Set<string>();
  const perFamily = new Map<string, number>();
  for (const item of ordered) {
    if (kept.length >= max) break;
    const doc = byId.get(item.id);
    if (!doc || keptIds.has(doc.id)) continue;
    const family = doc.parentId ?? doc.id;
    const count = perFamily.get(family) ?? 0;
    if (count >= MAX_PER_FAMILY) continue;
    if (doc.parentId && !keptIds.has(doc.parentId)) {
      const parent = byId.get(doc.parentId);
      if (parent && kept.length < max - 1) {
        kept.push({ doc: parent, score: item.score, reason: `${item.reason}+parent` });
        keptIds.add(parent.id);
        perFamily.set(family, count + 1);
      } else if (parent) {
        continue;
      }
    }
    kept.push({ doc, score: item.score, reason: item.reason });
    keptIds.add(doc.id);
    perFamily.set(family, (perFamily.get(family) ?? 0) + 1);
  }
  return kept;
}

// ── The pipeline ─────────────────────────────────────────────────────────────

export interface HybridOptions {
  question: string;
  pathname: string;
  history?: ChatTurnLike[];
  /** The browser's own lexical selection, used when the Worker recomputes nothing. */
  services: SemanticServices | null;
  index: EmbeddingIndex | null;
  weights?: HybridWeights;
  /** How many merged candidates the reranker sees. */
  rerankCandidates?: number;
  /** How many records go on to grounding. */
  finalCount?: number;
  /** Cache of query embeddings by standalone query text. */
  queryCache?: Map<string, Float32Array>;
}

export interface StageTimings {
  understandMs: number;
  lexicalMs: number;
  embedMs: number;
  semanticMs: number;
  mergeMs: number;
  rerankMs: number;
  totalMs: number;
}

export interface HybridResult {
  retrieval: RetrievalResult;
  /** The standalone query that was embedded and reranked against. */
  standaloneQuery: string;
  lexical: RetrievedDoc[];
  semantic: SemanticHit[];
  merged: HybridCandidate[];
  reranked: { id: string; score: number }[] | null;
  final: RetrievedDoc[];
  /** Stages that stepped aside, and why — never an error to the visitor. */
  degraded: string[];
  timings: StageTimings;
  weights: HybridWeights;
}

/**
 * The query-time pipeline: understand → lexical → embed → semantic → merge →
 * rerank → final. Every provider stage is optional and every failure degrades
 * to the previous stage's order. The lexical engine is always consulted,
 * because it is the only stage that knows about names, dates, intents and the
 * page the visitor is on.
 */
export async function retrieveHybrid(options: HybridOptions): Promise<HybridResult> {
  const started = Date.now();
  const degraded: string[] = [];
  const t = { understand: 0, lexical: 0, embed: 0, semantic: 0, merge: 0, rerank: 0 };

  /* Lexical (which includes the understanding stage): the authority on names,
     intents, dates and the current page; also the always-available fallback. */
  let mark = Date.now();
  const retrieval = retrieveGaitAIContext(options.question, options.pathname, options.history ?? []);
  t.lexical = Date.now() - mark;
  t.understand = 0;
  const standaloneQuery = semanticQueryText(retrieval.understanding);
  const lexicalCandidates = retrieval.candidates.length ? retrieval.candidates : retrieval.docs;

  /* A refusal is a refusal: nothing to embed or rerank. */
  if (retrieval.lowConfidence && retrieval.intent !== "DOMAIN_APPLICATION") {
    return {
      retrieval,
      standaloneQuery,
      lexical: lexicalCandidates,
      semantic: [],
      merged: [],
      reranked: null,
      final: retrieval.docs,
      degraded: ["refused-by-retrieval"],
      timings: { understandMs: 0, lexicalMs: t.lexical, embedMs: 0, semanticMs: 0, mergeMs: 0, rerankMs: 0, totalMs: Date.now() - started },
      weights: options.weights ?? DEFAULT_WEIGHTS,
    };
  }

  const lexicalMax = Math.max(...lexicalCandidates.map((item) => item.score), 0);
  const weights = adaptiveWeights(retrieval.intent, lexicalMax, options.weights, structuralMatch(lexicalCandidates[0]));

  /* Semantic: embed the standalone query once (cached), scan the index. */
  let semantic: SemanticHit[] = [];
  if (options.services && options.index) {
    try {
      mark = Date.now();
      let vector = options.queryCache?.get(standaloneQuery);
      if (!vector) {
        const [values] = await options.services.embed([standaloneQuery]);
        if (!values || values.length !== options.index.dim) throw new Error(`embedding dim ${values?.length ?? 0} ≠ ${options.index.dim}`);
        vector = normalize(Float32Array.from(values));
        options.queryCache?.set(standaloneQuery, vector);
      }
      t.embed = Date.now() - mark;
      mark = Date.now();
      semantic = semanticTopK(options.index, vector, options.rerankCandidates ?? 20);
      t.semantic = Date.now() - mark;
    } catch (error) {
      degraded.push(`embedding: ${(error as Error).message}`);
      semantic = [];
    }
  } else {
    degraded.push(options.index ? "embedding: no service" : "embedding: no index");
  }

  /* Merge. Without semantic hits this is the lexical order with lexical weights. */
  mark = Date.now();
  const merged = hybridMerge(retrieval, lexicalCandidates, semantic, semantic.length ? weights : { lexical: 1, semantic: 0, metadata: 0 });
  t.merge = Date.now() - mark;
  /* The shortlist the reranker sees: the best by hybrid score, plus a
     guaranteed seat for the strongest hits of EACH engine — so a record only
     meaning found (cosine high, no shared word) reaches the reranker even when
     a confident-looking lexical list would otherwise crowd it out. */
  const shortlistSize = options.rerankCandidates ?? 20;
  const shortlistIds = new Set(merged.slice(0, shortlistSize).map((candidate) => candidate.id));
  for (const candidate of merged) {
    if (shortlistIds.size >= shortlistSize + 6) break;
    const strongSemantic = candidate.semantic !== null && candidate.semanticNorm >= 0.6 && semantic.findIndex((hit) => hit.id === candidate.id) < 5;
    const strongLexical = lexicalCandidates.findIndex((item) => item.doc.id === candidate.id) < 5 && candidate.lexical > 0;
    if (strongSemantic || strongLexical) shortlistIds.add(candidate.id);
  }
  const shortlist = merged.filter((candidate) => shortlistIds.has(candidate.id));

  /* Rerank the shortlist against the standalone query. The pinned record stays
     first. NOT for the precise intents — a name, a paper, a place on the site,
     "latest": there the deterministic engine is the authority and a
     relevance model that knows nothing of names or dates only reorders what
     it already got right. */
  let reranked: { id: string; score: number }[] | null = null;
  if (PRECISE_INTENTS.has(retrieval.intent)) {
    degraded.push("rerank: skipped for a precise intent");
  } else if (options.services?.rerank && shortlist.length > 1) {
    try {
      mark = Date.now();
      const scores = await options.services.rerank(standaloneQuery, shortlist.map((candidate) => rerankText(candidate.doc)));
      if (scores.length !== shortlist.length) throw new Error(`reranker returned ${scores.length} scores for ${shortlist.length} documents`);
      t.rerank = Date.now() - mark;
      const pinned = shortlist.find((candidate) => candidate.reasons.includes("pinned"))?.id ?? null;
      /* BLEND, do not replace. The reranker judges query/document relevance
         and knows nothing of names, intents or the page the visitor is on;
         the hybrid score carries those. Both are min–max normalised over the
         shortlist and combined, reranker-heavy. */
      const rerankMax = Math.max(...scores);
      const rerankMin = Math.min(...scores);
      const rerankRange = Math.max(rerankMax - rerankMin, 1e-6);
      const hybridMax = Math.max(...shortlist.map((candidate) => candidate.hybrid));
      const hybridMin = Math.min(...shortlist.map((candidate) => candidate.hybrid));
      const hybridRange = Math.max(hybridMax - hybridMin, 1e-6);
      reranked = shortlist
        .map((candidate, index) => ({
          id: candidate.id,
          score:
            RERANK_BLEND * ((scores[index] - rerankMin) / rerankRange) +
            (1 - RERANK_BLEND) * ((candidate.hybrid - hybridMin) / hybridRange),
        }))
        .sort((a, b) => {
          if (pinned) {
            if (a.id === pinned) return -1;
            if (b.id === pinned) return 1;
          }
          return b.score - a.score;
        });
    } catch (error) {
      degraded.push(`rerank: ${(error as Error).message}`);
      reranked = null;
    }
  } else if (options.services && !options.services.rerank) {
    degraded.push("rerank: no service");
  }

  const orderedForFinal = reranked
    ? reranked.map((item) => ({ id: item.id, score: item.score, reason: "rerank" }))
    : shortlist.map((candidate) => ({ id: candidate.id, score: candidate.hybrid, reason: semantic.length ? "hybrid" : "lexical" }));
  let final = finalize(orderedForFinal, options.finalCount ?? MAX_FINAL);

  /* The page's own record travels with the answer, as the lexical engine does. */
  if (retrieval.pageDoc && retrieval.pageDoc.id !== "page:/" && !final.some((item) => item.doc.id === retrieval.pageDoc!.id)) {
    final = [...final.slice(0, (options.finalCount ?? MAX_FINAL) - 1), { doc: retrieval.pageDoc, score: 0, reason: "page:reserved" }];
  }
  if (!final.length) final = retrieval.docs;

  return {
    retrieval,
    standaloneQuery,
    lexical: lexicalCandidates,
    semantic,
    merged,
    reranked,
    final,
    degraded,
    timings: {
      understandMs: t.understand,
      lexicalMs: t.lexical,
      embedMs: t.embed,
      semanticMs: t.semantic,
      mergeMs: t.merge,
      rerankMs: t.rerank,
      totalMs: Date.now() - started,
    },
    weights,
  };
}

/** Records in the corpus, for the builder and the harness. */
export const corpusDocs = () => knowledge().docs;

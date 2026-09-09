/**
 * ASK GAITAI WORKER — THE HYBRID RETRIEVAL PIPELINE, MODEL MOCKED.
 * =============================================================================
 * The semantic stage runs in the Worker: the standalone query is embedded
 * through `env.AI`, scanned against the bundled record vectors, merged with
 * the lexical candidates, reranked, and the final canonical ids ground the
 * answer. These tests exercise that path with the REAL bundled index and a
 * SCRIPTED binding: the "embedding" of a query is the stored vector of a chosen
 * record, so semantic retrieval deterministically finds that record, and the
 * reranker is a script too. Nothing here calls Workers AI.
 *
 * What is asserted: the Worker grounds on its own selection when the stage is
 * on; falls back to the browser's selection when embedding fails, when the
 * index and EMBEDDING_MODEL disagree, or when the stage is off; degrades to the
 * hybrid order when reranking fails; never lets a hard-demoted record type in
 * through similarity; and exposes diagnostics only under ASK_DEBUG.
 */

import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import worker from "../src/index";
import type { AskEnv } from "../src/env";
import { ensureCorpus } from "../src/grounding";
import { embeddingIndex } from "../src/semantic";
import type { AiRunner } from "../src/workers-ai";
import { knowledge } from "../../src/lib/ask/corpus";

const ORIGIN = "https://gaitai.in";
const URL_ASK = "https://ask.gaitai.in/api/ask";
const GEN = "@cf/test/grounded-model";
const EMBED = "@cf/baai/bge-small-en-v1.5";
const RERANK = "@cf/baai/bge-reranker-base";

interface Seen {
  model: string;
  input: Record<string, unknown>;
}
let seen: Seen[] = [];
let embedWith: string | null = null; // record id whose stored vector the query "embeds" to
let embedThrows: unknown = null;
let rerankThrows: unknown = null;
let rerankFavour: string | null = null; // record id the reranker scores highest
let reply = "grounded answer";

/** The stored unit vector of a record, from the index the Worker itself bundles. */
function storedVector(id: string): number[] {
  const { index } = embeddingIndex();
  if (!index) throw new Error("no index bundled — run `npm run ask:embed`");
  const row = index.ids.indexOf(id);
  if (row < 0) throw new Error(`${id} has no vector`);
  return Array.from(index.matrix.subarray(row * index.dim, (row + 1) * index.dim));
}

const mockAi: AiRunner = {
  async run(model, input) {
    seen.push({ model, input });
    if (model === EMBED) {
      if (embedThrows) throw embedThrows;
      const texts = (input as { text: string[] }).text;
      return { shape: [texts.length, 384], data: texts.map(() => storedVector(embedWith ?? "page:/")) };
    }
    if (model === RERANK) {
      if (rerankThrows) throw rerankThrows;
      const contexts = (input as { contexts: { text: string }[] }).contexts;
      /* Highest score to the context whose text names the favoured record's title; then descending by index. */
      const favouredTitle = rerankFavour ? knowledge().docs.find((d) => d.id === rerankFavour)?.title ?? "" : "";
      return {
        response: contexts.map((context, id) => ({
          id,
          score: favouredTitle && context.text.startsWith(favouredTitle) ? 0.99 : 0.5 - id * 0.01,
        })),
      };
    }
    return {
      choices: [{ index: 0, message: { role: "assistant", content: reply }, finish_reason: "stop" }],
      usage: { prompt_tokens: 900, completion_tokens: 50, total_tokens: 950 },
    };
  },
};

let ipCounter = 0;
const freshIp = () => `192.0.2.${(ipCounter++ % 250) + 1}`;

interface Body {
  answer: string;
  sources: { url: string; kind: string }[];
  grounding: { recordIds: string[] };
  debug?: { semanticUsed: boolean; disabled: string | null; degraded: string[]; reranked: unknown; models: { embedding: string; rerank: string }; final: string[] };
}

async function ask(question: string, selectedRecordIds: string[], overrides: Partial<AskEnv> = {}, history: { role: "user" | "assistant"; content: string }[] = []) {
  ensureCorpus();
  const response = await worker.fetch(
    new Request(URL_ASK, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ORIGIN, "CF-Connecting-IP": freshIp() },
      body: JSON.stringify({ question, pathname: "/", pageTitle: "", history, selectedRecordIds }),
    }),
    { ...(env as unknown as AskEnv), AI: mockAi as unknown as Ai, WORKERS_AI_MODEL: GEN, EMBEDDING_MODEL: EMBED, RERANK_MODEL: RERANK, ...overrides },
  );
  const body = (response.status === 200 ? await response.json() : null) as Body | null;
  const prompt = seen.filter((s) => s.model === GEN).at(-1)?.input as { messages?: { role: string; content: string }[] } | undefined;
  return { response, body, prompt: prompt?.messages?.at(-1)?.content ?? "" };
}

beforeEach(() => {
  seen = [];
  embedWith = null;
  embedThrows = null;
  rerankThrows = null;
  rerankFavour = null;
  reply = "grounded answer";
});

describe("the bundled index", () => {
  it("ships a vector for every canonical record, built with the configured model", () => {
    ensureCorpus();
    const { index } = embeddingIndex();
    expect(index).not.toBeNull();
    expect(index!.model).toBe(EMBED);
    expect(index!.dim).toBe(384);
    expect(index!.ids.length).toBe(knowledge().docs.length);
    /* Unit vectors: the dot product of a row with itself is 1. */
    const row = storedVector("product:suspiciousmotion");
    expect(row.reduce((sum, v) => sum + v * v, 0)).toBeCloseTo(1, 2);
  });
});

describe("hybrid retrieval in the Worker", () => {
  it("grounds on its own selection when the semantic stage finds the record the browser missed", async () => {
    /* The browser's lexical pass on a description-style question found only pages;
       the query embeds next to SuspiciousMotion; the reranker agrees. */
    embedWith = "product:suspiciousmotion";
    rerankFavour = "product:suspiciousmotion";
    reply = "[SuspiciousMotion](/securevision/suspiciousmotion/) surfaces loitering and restricted-zone entry.";
    const { response, body, prompt } = await ask("someone keeps wandering around the storage area at night", ["page:/legal/privacy", "policy:privacy-controls"], { ASK_DEBUG: "1" });
    expect(response.status).toBe(200);
    expect(seen.map((s) => s.model)).toEqual([EMBED, RERANK, GEN]);
    expect(body!.grounding.recordIds).toContain("product:suspiciousmotion");
    expect(prompt).toContain("Title: SuspiciousMotion");
    expect(body!.sources.map((s) => s.url)).toContain("/securevision/suspiciousmotion/");
    expect(body!.debug?.semanticUsed).toBe(true);
    expect(body!.debug?.models.embedding).toBe(EMBED);
    expect(body!.debug?.models.rerank).toBe(RERANK);
    expect(body!.debug?.reranked).not.toBeNull();
  });

  it("keeps the browser's selection when the query embedding fails, and says so", async () => {
    embedThrows = new Error("AiError: 3040: No more data centers to forward the request to");
    const { response, body } = await ask("someone keeps wandering around the loading bay after dark", ["product:campusshield", "page:/securevision"], { ASK_DEBUG: "1" });
    expect(response.status).toBe(200);
    expect(body!.grounding.recordIds).toEqual(["product:campusshield", "page:/securevision"]);
    expect(body!.debug?.semanticUsed).toBe(false);
    expect(body!.debug?.degraded.join(" ")).toMatch(/embedding/);
    /* The reranker is not called when there is nothing semantic to merge? It may be — but the model is. */
    expect(seen.some((s) => s.model === GEN)).toBe(true);
  });

  it("uses the hybrid order when the reranker fails", async () => {
    embedWith = "product:suspiciousmotion";
    rerankThrows = new Error("AiError: 3007: timeout");
    const { response, body } = await ask("a person keeps circling the depot fence at night", ["page:/legal/privacy"], { ASK_DEBUG: "1" });
    expect(response.status).toBe(200);
    expect(body!.debug?.semanticUsed).toBe(true);
    expect(body!.debug?.reranked).toBeNull();
    expect(body!.debug?.degraded.join(" ")).toMatch(/rerank/);
    expect(body!.grounding.recordIds).toContain("product:suspiciousmotion");
  });

  it("disables the semantic stage when EMBEDDING_MODEL does not match the bundled index", async () => {
    const { response, body } = await ask("what is walkscan", ["product:walkscan"], { EMBEDDING_MODEL: "@cf/baai/bge-large-en-v1.5", ASK_DEBUG: "1" });
    expect(response.status).toBe(200);
    expect(seen.map((s) => s.model)).toEqual([GEN]);
    expect(body!.grounding.recordIds).toEqual(["product:walkscan"]);
    expect(body!.debug?.disabled).toMatch(/index built with/);
  });

  it("uses the browser's selection exactly when the stage is off", async () => {
    const { response, body } = await ask("what is walkscan", ["product:walkscan", "use-case:physio"], { EMBEDDING_MODEL: "", RERANK_MODEL: "", ASK_DEBUG: "" });
    expect(response.status).toBe(200);
    expect(seen.map((s) => s.model)).toEqual([GEN]);
    expect(body!.grounding.recordIds).toEqual(["product:walkscan", "use-case:physio"]);
    expect(body!.debug).toBeUndefined();
  });

  it("never lets similarity smuggle a hard-demoted type into a domain question", async () => {
    /* The query "embeds" exactly to the founder's record; a domain question demotes persons by -8. */
    embedWith = "person:anubha-parashar";
    const { response, body } = await ask("does it do military", ["product:suspiciousmotion", "product:accessmotion", "page:/securevision"], { ASK_DEBUG: "1" });
    expect(response.status).toBe(200);
    expect(body!.grounding.recordIds).not.toContain("person:anubha-parashar");
    expect(body!.grounding.recordIds).toContain("product:suspiciousmotion");
  });

  it("pins the named entity first whatever the vectors say", async () => {
    embedWith = "product:crowdsense";
    rerankFavour = "product:crowdsense";
    const { response, body } = await ask("What is WalkScan?", ["product:walkscan"], { ASK_DEBUG: "1" });
    expect(response.status).toBe(200);
    expect(body!.grounding.recordIds[0]).toBe("product:walkscan");
  });

  it("does not rerank a precise question — a name, a paper, a place — and grounds on the lexical answer", async () => {
    embedWith = "person:deepak-gupta";
    const { response, body } = await ask("Who is Anubha?", ["person:anubha-parashar"], { ASK_DEBUG: "1" });
    expect(response.status).toBe(200);
    expect(seen.map((s) => s.model)).toEqual([EMBED, GEN]);
    expect(body!.grounding.recordIds[0]).toBe("person:anubha-parashar");
    expect(body!.grounding.recordIds).not.toContain("person:deepak-gupta");
    expect(body!.debug?.degraded.join(" ")).toMatch(/precise intent/);
  });

  it("resolves 'it' from the conversation before embedding", async () => {
    embedWith = "page:/securevision";
    rerankFavour = "page:/securevision";
    const history = [
      { role: "user" as const, content: "What is SecureVision?" },
      { role: "assistant" as const, content: "SecureVision is the security family." },
    ];
    const { response, body, prompt } = await ask("Does it use CCTV?", ["page:/securevision"], { ASK_DEBUG: "1" }, history);
    expect(response.status).toBe(200);
    const embedded = (seen.find((s) => s.model === EMBED)!.input as { text: string[] }).text[0];
    expect(embedded).toMatch(/SecureVision/);
    expect(embedded).not.toMatch(/\bit\b/i);
    expect(body!.grounding.recordIds).toContain("page:/securevision");
    expect(prompt).toContain('Reference: "it" refers to SecureVision');
  });

  it("caches the query embedding for a repeated standalone query", async () => {
    embedWith = "product:crowdsense";
    await ask("figure out where people bunch up in a stadium", ["product:crowdsense"]);
    const embedsFirst = seen.filter((s) => s.model === EMBED).length;
    seen = [];
    await ask("figure out where people bunch up in a stadium", ["product:crowdsense"]);
    const embedsSecond = seen.filter((s) => s.model === EMBED).length;
    expect(embedsFirst).toBe(1);
    expect(embedsSecond).toBe(0);
  });

  it("exposes no diagnostics without ASK_DEBUG", async () => {
    embedWith = "product:crowdsense";
    const { body } = await ask("where do people cluster in a stadium concourse", ["product:crowdsense"], { ASK_DEBUG: "" });
    expect(body!.debug).toBeUndefined();
    expect(JSON.stringify(body)).not.toMatch(/cosine|rerank|hybrid/i);
  });
});

/**
 * BENCHMARK ENTRY — a separate, local-only Worker that exposes the adapter.
 * =============================================================================
 * Workers AI can only be reached through the `AI` binding, i.e. from inside a
 * Worker — never from a Node script. The benchmark therefore runs in two
 * halves that share everything except the process boundary:
 *
 *   scripts/ask-bench.ts (Node)   retrieval · buildMessages · scoring — the
 *                                 same shared modules the production Worker
 *                                 imports
 *   this Worker (wrangler dev)    the SAME `generate()` from workers-ai.ts,
 *                                 behind one loopback endpoint
 *
 * Nothing is duplicated: grounding lives in the shared modules, the provider
 * call lives in workers-ai.ts, and this file is glue.
 *
 * IT IS NEVER DEPLOYED. It has its own config, wrangler.bench.jsonc, with no
 * routes and `workers_dev: false`, and it refuses anything that is not a POST
 * from the loopback host. Cloudflare documents that Workers AI "always
 * accesses your Cloudflare account … even in local development", so running
 * this spends the account's daily Neuron allocation — which is exactly why
 * the benchmark is a deliberate act, not part of any test or CI step.
 *
 *   cd worker && npm run bench:serve          # wrangler dev on 127.0.0.1:8788
 *   npm run ask:bench                         # at the repo root, in another shell
 */

import { generate, WorkersAiError, type ChatMessage } from "./workers-ai";

interface BenchEnv {
  AI?: Ai;
}

interface BenchRequest {
  model: string;
  messages: ChatMessage[];
  maxOutputTokens?: number;
  timeoutMs?: number;
  /** "low" | "medium" | "high"; validated by the adapter, omitted otherwise. */
  reasoningEffort?: string;
}

const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]"]);

export default {
  async fetch(request: Request, env: BenchEnv): Promise<Response> {
    const url = new URL(request.url);
    if (!LOOPBACK.has(url.hostname)) return new Response("loopback only", { status: 403 });
    if (request.method !== "POST" || url.pathname !== "/generate") {
      return new Response("POST /generate", { status: 404 });
    }
    if (!env.AI) return Response.json({ error: "unconfigured" }, { status: 503 });

    let body: BenchRequest;
    try {
      body = (await request.json()) as BenchRequest;
    } catch {
      return Response.json({ error: "malformed" }, { status: 400 });
    }
    if (!body?.model || !Array.isArray(body.messages)) {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }

    try {
      const completion = await generate({
        ai: env.AI,
        model: body.model,
        messages: body.messages,
        maxOutputTokens: Math.min(body.maxOutputTokens ?? 450, 1200),
        timeoutMs: Math.min(body.timeoutMs ?? 40_000, 60_000),
        reasoningEffort: typeof body.reasoningEffort === "string" ? body.reasoningEffort : undefined,
      });
      return Response.json(completion);
    } catch (error) {
      const failed = error instanceof WorkersAiError ? error : new WorkersAiError("upstream");
      /* The benchmark is a developer tool on loopback: the class, the code and
         the SAFE structural diagnostics (lengths and counts, never text) are
         what it needs to report an empty or malformed result honestly. */
      return Response.json(
        { error: failed.kind, code: failed.code ?? null, diagnostics: failed.diagnostics ?? null },
        { status: 502 },
      );
    }
  },
} satisfies ExportedHandler<BenchEnv>;

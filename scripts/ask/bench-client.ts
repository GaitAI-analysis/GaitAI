/**
 * The loopback bench Worker, from Node: start it if needed, and talk to its
 * /embed and /rerank endpoints through the same adapter shapes the production
 * Worker uses. Workers AI is reachable only through a Worker's `AI` binding, so
 * every Node harness that needs embeddings or reranking goes through here.
 *
 * Every call spends the Cloudflare account's daily Workers AI allocation —
 * which is why the harnesses that use this are deliberate acts, never CI.
 */

import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import path from "node:path";
import type { SemanticServices } from "../../src/lib/ask/semantic";
import { EMBEDDING_POOLING, DEFAULT_RERANK_MODEL } from "../../src/lib/ask/semantic";

const WORKER_DIR = path.join(import.meta.dirname, "..", "..", "worker");
let started: ChildProcess | null = null;

async function reachable(base: string): Promise<boolean> {
  try {
    const response = await fetch(`${base}/generate`, { method: "GET" });
    return response.status === 404 || response.status === 405 || response.status === 200;
  } catch {
    return false;
  }
}

export async function ensureBenchWorker(base: string): Promise<void> {
  if (await reachable(base)) {
    console.log(`bench worker: ${base} (already running)`);
    return;
  }
  const url = new URL(base);
  console.log(`bench worker: starting wrangler dev -c wrangler.bench.jsonc on ${url.host} …`);
  const wrangler = process.platform === "win32" ? "wrangler.cmd" : "wrangler";
  started = spawn(
    path.join(WORKER_DIR, "node_modules", ".bin", wrangler),
    ["dev", "-c", "wrangler.bench.jsonc", "--port", url.port || "8790", "--ip", url.hostname, "--log-level", "warn", "--persist-to", path.join(WORKER_DIR, ".wrangler", "state-bench")],
    { cwd: WORKER_DIR, stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32", windowsHide: true },
  );
  started.stderr?.on("data", (chunk: Buffer) => {
    const text = chunk.toString();
    if (/error/i.test(text)) process.stderr.write(text.replace(/^/gm, "    │ "));
  });
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (await reachable(base)) {
      console.log(`bench worker: ${base} (started)`);
      return;
    }
    if (started.exitCode !== null) throw new Error(`wrangler dev exited with ${started.exitCode}`);
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw new Error("bench worker did not come up within 90 s");
}

export function stopBenchWorker(): void {
  if (!started || started.exitCode !== null) return;
  if (process.platform === "win32" && started.pid) {
    spawnSync("taskkill", ["/pid", String(started.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    started.kill("SIGTERM");
  }
}

async function post<T>(base: string, route: string, body: unknown): Promise<T> {
  const response = await fetch(`${base}${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as T & { error?: string; code?: number };
  if (!response.ok) throw new Error(`${route} ${response.status} ${payload.error ?? ""}${payload.code ? ` (code ${payload.code})` : ""}`);
  return payload;
}

/** Embedding and reranking through the bench Worker. */
export function benchServices(base: string, embeddingModel: string, rerankModel: string = DEFAULT_RERANK_MODEL, pooling: string = EMBEDDING_POOLING): SemanticServices {
  return {
    embeddingModel,
    rerankModel,
    async embed(texts) {
      const out = await post<{ data: number[][] }>(base, "/embed", { model: embeddingModel, texts, ...(pooling === "none" ? {} : { pooling }) });
      return out.data;
    },
    async rerank(query, documents) {
      const out = await post<{ scores: number[] }>(base, "/rerank", { model: rerankModel, query, texts: documents });
      return out.scores;
    },
  };
}

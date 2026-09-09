/**
 * ASK GAITAI — THE REAL RAG PATH, END TO END, AGAINST THE REAL MODEL
 * =============================================================================
 *   npm run ask:e2e -- "Who is Anubha?"
 *   npm run ask:e2e                       # the whole acceptance set
 *   npm run ask:e2e -- --worker http://127.0.0.1:8787 "What is GaitScape?"
 *
 * What runs, in order, exactly as it does for a visitor:
 *
 *   1. the generated corpus is loaded off disk (public/ask/knowledge.json)
 *   2. the browser's OWN retrieval runs over it (src/lib/ask/retrieval.ts)
 *   3. the selected record IDS — never their text — are POSTed to the Ask
 *      GaitAI Worker at POST /api/ask
 *   4. the Worker resolves the ids against ITS canonical corpus, builds the
 *      grounding prompt, calls Cloudflare Workers AI through env.AI
 *   5. the answer and the canonical sources come back and are printed
 *
 * Nothing here constructs context by hand. If the Worker is not already
 * running, this script starts `wrangler dev` in worker/ (which spends the
 * account's Workers AI allocation — every call here is a real inference
 * call) and stops it afterwards. Set ASK_DEBUG=1 in worker/.dev.vars to see
 * the Worker's own per-question block alongside this output.
 *
 * Exit code: 0 when every question answered 200 with a non-empty answer and
 * at least one canonical source; 1 otherwise.
 */

import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import path from "node:path";
import { loadCorpusFromDisk } from "./ask/corpus-node";
import { retrieveGaitAIContext } from "../src/lib/ask/retrieval";

const ROOT = path.join(import.meta.dirname, "..");
const WORKER_DIR = path.join(ROOT, "worker");

const DEFAULT_QUESTIONS = [
  "Who is Anubha Parashar?",
  "Who is Anubha?",
  "Who is Apoorva Parashar?",
  "Who is Apoorva?",
  "What is GaitAI?",
  "What is MobilityCare?",
  "What is SecureVision?",
  "What is GaitScape?",
  "What does GaitAI research?",
  "What publications does GaitAI have?",
  "What happens in the Biometrics Lab?",
  "What is movement intelligence?",
  "How does GaitAI use walking video?",
  "What does GaitAI say about privacy?",
  "What are the latest GaitAI Insights?",
  "Which Fortune 500 companies use GaitAI?",
];

// ── Arguments ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let workerUrl = process.env.ASK_WORKER_URL ?? "http://127.0.0.1:8787";
let origin = "https://gaitai.in";
let pathname = "/";
const questions: string[] = [];
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--worker") workerUrl = args[++i] ?? workerUrl;
  else if (arg === "--origin") origin = args[++i] ?? origin;
  else if (arg === "--path") pathname = args[++i] ?? pathname;
  else if (arg.startsWith("--")) throw new Error(`unknown flag ${arg}`);
  else questions.push(arg);
}
const endpoint = `${workerUrl.replace(/\/$/, "")}/api/ask`;
const asked = questions.length ? questions : DEFAULT_QUESTIONS;

// ── The Worker: reuse a running one, or start wrangler dev ──────────────────

async function reachable(): Promise<boolean> {
  try {
    const response = await fetch(endpoint, { method: "OPTIONS", headers: { Origin: origin } });
    return response.status === 204 || response.status === 403 || response.status === 405;
  } catch {
    return false;
  }
}

let started: ChildProcess | null = null;

async function ensureWorker(): Promise<void> {
  if (await reachable()) {
    console.log(`worker: ${endpoint} (already running)`);
    return;
  }
  const url = new URL(workerUrl);
  console.log(`worker: starting wrangler dev on ${url.host} …`);
  const wrangler = process.platform === "win32" ? "wrangler.cmd" : "wrangler";
  /* Its own persistence directory. workerd has refused to start
     ("std::terminate() called with no exception") against a stale
     `.wrangler/state` left by an earlier wrangler version; a directory this
     script owns cannot be stale in that way, and the Durable Object's
     rate-limit counters start clean for every run. */
  started = spawn(
    path.join(WORKER_DIR, "node_modules", ".bin", wrangler),
    [
      "dev",
      "--port", url.port || "8787",
      "--ip", url.hostname,
      "--log-level", "warn",
      "--persist-to", path.join(WORKER_DIR, ".wrangler", "state-ask-e2e"),
    ],
    { cwd: WORKER_DIR, stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32", windowsHide: true },
  );
  started.stdout?.on("data", (chunk: Buffer) => {
    const text = chunk.toString();
    /* Surface the Worker's ASK_DEBUG block and any warning; drop the banner. */
    if (/\[Ask GaitAI\]|question:|resolved:|provider:|model:|status:|latency:|error|warn/i.test(text)) {
      process.stdout.write(text.replace(/^/gm, "    │ "));
    }
  });
  started.stderr?.on("data", (chunk: Buffer) => process.stderr.write(chunk.toString().replace(/^/gm, "    │ ")));

  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (await reachable()) {
      console.log(`worker: ${endpoint} (started)`);
      return;
    }
    if (started.exitCode !== null) throw new Error(`wrangler dev exited with ${started.exitCode}`);
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw new Error("wrangler dev did not come up within 90 s");
}

function stopWorker(): void {
  if (!started || started.exitCode !== null) return;
  if (process.platform === "win32" && started.pid) {
    spawnSync("taskkill", ["/pid", String(started.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    started.kill("SIGTERM");
  }
}

// ── One question, the whole path ────────────────────────────────────────────

interface AskResponse {
  answer: string;
  mode: string;
  sources: { title: string; url: string; kind: string }[];
  relatedLinks: { title: string; url: string; kind: string }[];
  grounding: { records: number; recordIds: string[]; latencyMs: number };
}

async function askOne(question: string): Promise<boolean> {
  const retrieval = retrieveGaitAIContext(question, pathname);
  const selectedRecordIds = retrieval.docs.map((item) => item.doc.id);

  console.log("─".repeat(78));
  console.log(`Q: ${question}`);
  console.log(`   intent ${retrieval.intent}${retrieval.entity ? ` · entity ${retrieval.entity.entityId}` : ""}${retrieval.lowConfidence ? " · LOW CONFIDENCE" : ""}`);
  console.log("   retrieved (browser-side, deterministic):");
  for (const item of retrieval.docs) {
    console.log(`     ${item.score.toFixed(2).padStart(6)}  ${item.doc.id}${item.doc.sectionTitle ? ` › ${item.doc.sectionTitle}` : ""}`);
  }

  if (retrieval.lowConfidence) {
    console.log("   → the browser refuses locally (low confidence); no Worker call is made for this question.");
    return true;
  }

  const startedAt = Date.now();
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ question, pathname, pageTitle: "", history: [], selectedRecordIds }),
    });
  } catch (error) {
    console.log(`   ✗ network: ${(error as Error).message}`);
    return false;
  }
  const latency = Date.now() - startedAt;

  if (response.status !== 200) {
    let detail = "";
    try {
      detail = JSON.stringify(await response.json());
    } catch {
      /* no body */
    }
    console.log(`   ✗ worker answered ${response.status} ${detail} (${latency} ms)`);
    return false;
  }

  const body = (await response.json()) as AskResponse;
  console.log(`   grounded on (Worker-side, canonical): ${body.grounding.recordIds.join(", ")}`);
  console.log(`   status 200 · mode ${body.mode} · ${latency} ms round trip · ${body.grounding.latencyMs} ms in the Worker`);
  console.log("");
  console.log(body.answer.split("\n").map((line) => `   ${line}`).join("\n"));
  console.log("");
  console.log("   Sources");
  for (const source of body.sources) console.log(`     ${source.title}  ·  ${source.kind}  ·  ${source.url}`);
  if (body.relatedLinks.length) {
    console.log("   Related");
    for (const link of body.relatedLinks) console.log(`     ${link.title}  ·  ${link.kind}  ·  ${link.url}`);
  }
  return body.answer.trim().length > 0 && body.sources.length > 0;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<number> {
  const corpus = loadCorpusFromDisk();
  console.log(`corpus: ${corpus.docs.length} records, ${corpus.routes.length} routes, built ${corpus.generatedAt}`);
  await ensureWorker();

  let failures = 0;
  for (const question of asked) {
    const ok = await askOne(question);
    if (!ok) failures += 1;
  }
  console.log("─".repeat(78));
  console.log(`${asked.length - failures}/${asked.length} questions answered through corpus → retrieval → canonical grounding → Workers AI`);
  return failures ? 1 : 0;
}

process.on("SIGINT", () => {
  stopWorker();
  process.exit(130);
});

main()
  .then((code) => {
    stopWorker();
    process.exit(code);
  })
  .catch((error) => {
    console.error(`\nask:e2e failed: ${(error as Error).message}\n`);
    stopWorker();
    process.exit(1);
  });

/**
 * ASK GAITAI — the server half of the movement-intelligence guide.
 * =============================================================================
 * WHY A CLOUD FUNCTION AND NOT A NEXT ROUTE HANDLER
 * The site is a static export published to GitHub Pages (`output: "export"`),
 * which serves files and nothing else. A Next `/api` route would work in
 * `next dev` and then simply not exist in production — and a token placed
 * anywhere the browser can read it is not a secret. So the model call lives
 * here, on infrastructure the project already owns: the same Firebase project
 * (`gaitai-intelligence`) that backs comments and article stats.
 *
 * WHY HERE AND NOT IN THE BROWSER ANY MORE
 * The previous design ran a 1.5B-parameter model in the visitor's tab on
 * WebGPU. It was a 1.2 GB download, it excluded every phone and every browser
 * without WebGPU, and the model was small because a laptop GPU is small. A
 * hosted model behind this function is reachable from any browser, needs no
 * download, and can be an order of magnitude larger. What did NOT move is the
 * part that decides what is true: retrieval runs in the browser first (to
 * refuse cheaply) and again here (so the prompt is built from records this
 * side of the trust boundary chose).
 *
 * THE TOKEN is a Secret Manager secret, injected into this process at runtime.
 *   firebase functions:secrets:set HF_TOKEN
 * It is never in the repository, never in the client bundle, never in a
 * NEXT_PUBLIC_ variable, and never echoed in a response or a log line.
 *
 * REQUEST   POST { question, pathname, pageTitle, history[] }
 * RESPONSE  200 application/json — see AskResponse in ask.ts
 *           400 malformed · 403 origin not allowed · 405 method
 *           429 per-caller limit (Retry-After set)
 *           503 daily budget spent
 *           502 the hosted model failed — the browser answers from records
 *
 * The browser treats every non-200 the same way: it renders the extractive
 * answer from the retrieval it already ran. None of these responses can make
 * the assistant stop working; they only decide who writes the prose.
 */

import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { defineInt, defineSecret, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { getApps, initializeApp } from "firebase-admin/app";
import type { Request, Response } from "express";
import { answerQuestion, needsModel } from "./ask";
import { callerKey, consumeBudget, consumeCaller } from "./rate-limit";
import { validateRequest } from "./validate";

if (!getApps().length) initializeApp();

setGlobalOptions({ region: "asia-south1", maxInstances: 10 });

/** The Hugging Face token. A secret, never a literal, never a NEXT_PUBLIC_. */
const HF_TOKEN = defineSecret("HF_TOKEN");

/**
 * Which hosted model writes the prose. Chosen by `npm run ask:bench` on the
 * site's own regression questions — see docs/ask-gaitai.md for the numbers —
 * and changeable without a code change: set the parameter and redeploy.
 * An optional `:provider` suffix pins an inference provider.
 */
const HF_MODEL = defineString("HF_MODEL", { default: "Qwen/Qwen3-8B" });

/** Output ceiling per answer. The single largest lever on cost and latency. */
const HF_MAX_TOKENS = defineInt("HF_MAX_TOKENS", { default: 450 });

/** Site-wide model calls per UTC day. Past it, every browser falls back. */
const ASK_DAILY_BUDGET = defineInt("ASK_DAILY_BUDGET", { default: 1500 });

/** Hard ceiling on one provider call, inside the function's own timeout. */
const MODEL_TIMEOUT_MS = 25_000;

/** Origins allowed to call this endpoint. */
const ALLOWED_ORIGINS = new Set(["https://gaitai.in", "https://www.gaitai.in"]);
/** Any local dev server, on any port. */
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const originAllowed = (origin: string) =>
  ALLOWED_ORIGINS.has(origin) || LOCAL_ORIGIN.test(origin);

/**
 * CORS, against an allowlist — and an ORIGIN IS REQUIRED.
 *
 * A browser always sends `Origin` on a cross-origin POST, and this endpoint is
 * always cross-origin (the site is on gaitai.in, the function on
 * cloudfunctions.net). So a request with no `Origin` is not a visitor: it is a
 * script calling the endpoint directly, which is the shape abuse takes on a
 * public endpoint that spends money per call. To exercise it by hand:
 *   curl -H "Origin: http://localhost:3000" …
 */
function applyCors(req: Request, res: Response): boolean {
  const origin = req.headers.origin;
  if (!origin || !originAllowed(origin)) return false;
  res.set("Access-Control-Allow-Origin", origin);
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Max-Age", "3600");
  return true;
}

export const askGaitai = onRequest(
  {
    secrets: [HF_TOKEN],
    timeoutSeconds: 60,
    memory: "512MiB",
    /* Scale to zero. The cold start is a 300 KB JSON parse, which is cheap
       next to the model call that follows; paying to keep an instance warm
       around the clock for a marketing site is not. */
    minInstances: 0,
    concurrency: 20,
    cors: false, // handled explicitly, against an allowlist
  },
  async (req, res) => {
    res.set("Cache-Control", "no-store");

    if (!applyCors(req, res)) {
      res.status(403).json({ error: "Origin not allowed." });
      return;
    }
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed." });
      return;
    }

    const parsed = validateRequest(req.body);
    if (!parsed.ok) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    // ── Per-caller limit, before anything costs money ─────────────────────
    const caller = await consumeCaller(callerKey(req.headers["x-forwarded-for"], req.ip));
    if (!caller.allowed) {
      res.set("Retry-After", String(caller.retryAfter));
      res.status(429).json({ error: "rate_limited", retryAfter: caller.retryAfter });
      return;
    }

    // ── Site-wide budget, charged only for calls that will reach a provider ─
    if (needsModel(parsed.value)) {
      const budget = await consumeBudget(ASK_DAILY_BUDGET.value());
      if (!budget.allowed) {
        res.set("Retry-After", String(budget.retryAfter));
        res.status(503).json({ error: "budget", retryAfter: budget.retryAfter });
        logger.warn("ask-gaitai budget spent", { pathname: parsed.value.pathname });
        return;
      }
    }

    // ── Answer ────────────────────────────────────────────────────────────
    const outcome = await answerQuestion(parsed.value, {
      token: HF_TOKEN.value(),
      model: HF_MODEL.value(),
      maxTokens: HF_MAX_TOKENS.value(),
      timeoutMs: MODEL_TIMEOUT_MS,
    });

    if (!outcome.ok) {
      /* Never surface a provider error to a visitor: it can carry model names,
         quota state and request ids. The browser renders its own fallback. */
      logger.error("ask-gaitai model failed", {
        ...outcome.meta,
        failure: outcome.failure,
        detail: outcome.detail,
      });
      res.status(outcome.failure === "rate_limited" ? 503 : 502).json({ error: "upstream" });
      return;
    }

    res.status(200).json(outcome.body);

    /* Diagnostics only — no message content, no identifiers. */
    logger.info("ask-gaitai answered", {
      ...outcome.meta,
      mode: outcome.body.mode,
      totalLatencyMs: outcome.body.grounding.latencyMs,
    });
  },
);

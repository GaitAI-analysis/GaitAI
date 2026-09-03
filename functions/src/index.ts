/**
 * ASK GAITAI — the server half of the movement-intelligence guide.
 * =============================================================================
 * WHY A CLOUD FUNCTION AND NOT A NEXT ROUTE HANDLER
 * The site is a static export published to GitHub Pages (`output: "export"`),
 * which serves files and nothing else. A Next `/api` route would work in
 * `next dev` and then simply not exist in production — and an API key placed
 * anywhere the browser can read it is not a secret. So the model call lives
 * here, on infrastructure the project already owns: the same Firebase project
 * (`gaitai-intelligence`) that backs comments and article stats.
 *
 * The key is a Secret Manager secret, injected into this process at runtime. It
 * is never in the repository, never in the client bundle, never in a
 * NEXT_PUBLIC_ variable, and never echoed in a response.
 *
 * REQUEST SHAPE
 *   POST { message, pathname, pageTitle, history[] }
 *   ← text/event-stream:
 *       event: delta       {"text": "…"}      one chunk of the answer
 *       event: replace     {"text": "…"}      corrected answer, if a link was
 *                                             stripped after streaming
 *       event: sources     [{title, url, kind}]
 *       event: suggestions ["…"]
 *       event: cta         {label, href}
 *       event: done        {records}
 *       event: error       {code}
 *
 * The answer streams; sources, follow-ups and the CTA are computed from the
 * retrieved records once the text is complete, so none of them can name a page
 * the answer did not come from.
 */

import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest, type Request } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { initializeApp, getApps } from "firebase-admin/app";
import Anthropic from "@anthropic-ai/sdk";
import type { Response } from "express";

import { SYSTEM_PROMPT, buildUserTurn } from "./prompt";
import { buildContextBlock, retrieveGaitAIContext } from "./retrieval";
import { callerKey, consume } from "./rate-limit";
import {
  DEMO_HREF,
  sanitizeLinks,
  selectSources,
  shouldOfferDemo,
  suggestFollowUps,
  validateRequest,
} from "./validate";

if (!getApps().length) initializeApp();

setGlobalOptions({ region: "asia-south1", maxInstances: 10 });

/**
 * The model credential. Set with:
 *   firebase functions:secrets:set LLM_API_KEY
 * Never a literal, never a NEXT_PUBLIC_ variable, never committed.
 */
const LLM_API_KEY = defineSecret("LLM_API_KEY");

/**
 * Model id, so it can be changed without a code deploy.
 *
 * Defaults to Claude Opus 5. Cost is controlled by the things that actually
 * drive it here — a cached system prompt, low effort, seven retrieved records
 * and a short history window — rather than by reaching for a weaker model on a
 * surface where a wrong claim about clinical validation is the expensive
 * outcome. Set LLM_MODEL to override.
 */
const LLM_MODEL = defineString("LLM_MODEL", { default: "claude-opus-5" });

/** Origins allowed to call this endpoint. */
const ALLOWED_ORIGINS = new Set([
  "https://gaitai.in",
  "https://www.gaitai.in",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

const MAX_OUTPUT_TOKENS = 1400;
/** Hard ceiling on one exchange, well inside the function's own timeout. */
const GENERATION_TIMEOUT_MS = 45_000;

/**
 * CORS, against an allowlist — and an ORIGIN IS REQUIRED.
 *
 * A browser always sends `Origin` on a cross-origin POST, and this endpoint is
 * always cross-origin (the site is on gaitai.in, the function on
 * cloudfunctions.net). So a request with no `Origin` is not a visitor: it is a
 * script calling the endpoint directly, which is the shape abuse takes on a
 * public endpoint that spends money per call. Rejecting it costs the site
 * nothing. To exercise the endpoint by hand, send the header:
 *   curl -H "Origin: http://localhost:3000" …
 */
function applyCors(req: Request, res: Response): boolean {
  const origin = req.headers.origin;
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return false;

  res.set("Access-Control-Allow-Origin", origin);
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Max-Age", "3600");
  return true;
}

/** One SSE frame. */
function send(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export const askGaitai = onRequest(
  {
    secrets: [LLM_API_KEY],
    timeoutSeconds: 60,
    memory: "512MiB",
    /* Scale to zero. The cold start is a 300 KB JSON parse and an SDK import,
       which is cheap next to the model call that follows; paying to keep an
       instance warm around the clock for a marketing site is not. Raise this
       if first-token latency ever becomes the complaint. */
    minInstances: 0,
    concurrency: 20,
    cors: false, // handled explicitly, against an allowlist
  },
  async (req, res) => {
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
    const { message, pathname, pageTitle, history } = parsed.value;

    const limit = await consume(
      callerKey(req.headers["x-forwarded-for"] as string | undefined, req.ip),
    );
    if (!limit.allowed) {
      res.set("Retry-After", String(limit.retryAfter));
      res.status(429).json({
        error: "rate_limited",
        retryAfter: limit.retryAfter,
      });
      return;
    }

    // ── Retrieve ─────────────────────────────────────────────────────────────
    const priorUserTurns = history
      .filter((turn) => turn.role === "user")
      .slice(-2)
      .map((turn) => turn.content);

    const retrieval = retrieveGaitAIContext(message, pathname, priorUserTurns);

    const pageLine = retrieval.pageDoc
      ? `The visitor is currently reading: ${retrieval.pageDoc.title} (${retrieval.pageDoc.url}). Resolve vague references ("this", "it", "this product") against that page.`
      : pageTitle
        ? `The visitor is currently on ${pathname} ("${pageTitle}").`
        : `The visitor is currently on ${pathname}.`;

    // ── Stream ───────────────────────────────────────────────────────────────
    res.set("Content-Type", "text/event-stream; charset=utf-8");
    res.set("Cache-Control", "no-cache, no-transform");
    res.set("Connection", "keep-alive");
    /* Cloud Run and any proxy in front of it must not buffer the stream. */
    res.set("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const client = new Anthropic({ apiKey: LLM_API_KEY.value() });

    let answer = "";
    /* Held outside the try so the timeout can abort it. Without this the
       response closes but generation continues, and the site pays for output
       tokens that no longer have anywhere to go. */
    let stream: ReturnType<typeof client.messages.stream> | null = null;

    const timer = setTimeout(() => {
      stream?.abort();
      if (!res.writableEnded) {
        send(res, "error", { code: "timeout" });
        res.end();
      }
    }, GENERATION_TIMEOUT_MS);

    try {
      stream = client.messages.stream({
        model: LLM_MODEL.value(),
        max_tokens: MAX_OUTPUT_TOKENS,
        /* Low effort with adaptive thinking: this is a lookup-and-explain task
           over supplied records, not a reasoning problem, and a website widget
           is judged on how fast the first line lands. */
        output_config: { effort: "low" },
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            /* Byte-stable across every request, so it caches and the policy
               costs ~10% of its tokens after the first call. */
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          ...history.map((turn) => ({
            role: turn.role,
            content: turn.content,
          })),
          {
            role: "user" as const,
            content: buildUserTurn({
              message,
              contextBlock: buildContextBlock(retrieval),
              pageLine,
              lowConfidence: retrieval.lowConfidence,
            }),
          },
        ],
      });

      for await (const event of stream) {
        if (res.writableEnded) break;
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          answer += event.delta.text;
          send(res, "delta", { text: event.delta.text });
        }
      }

      const final = await stream.finalMessage();
      clearTimeout(timer);
      if (res.writableEnded) return;

      if (final.stop_reason === "refusal") {
        send(res, "error", { code: "declined" });
        res.end();
        return;
      }

      // ── Everything under the answer, derived from what was retrieved ──────
      const clean = sanitizeLinks(answer);
      if (clean !== answer) {
        /* A link was invented or pointed off-site. The stream already carried
           the raw text, so the client is given the corrected answer to replace
           what it rendered. */
        send(res, "replace", { text: clean });
      }

      send(res, "sources", selectSources(clean, retrieval.docs));
      send(res, "suggestions", suggestFollowUps(retrieval.docs, message));

      if (shouldOfferDemo(retrieval.docs, history.length / 2)) {
        send(res, "cta", { label: "Request a demo", href: DEMO_HREF });
      }

      send(res, "done", {
        /* Diagnostics only — no message content, no identifiers. */
        records: retrieval.docs.length,
      });
      res.end();

      logger.info("ask-gaitai answered", {
        pathname,
        records: retrieval.docs.length,
        lowConfidence: retrieval.lowConfidence,
        inputTokens: final.usage.input_tokens,
        cachedTokens: final.usage.cache_read_input_tokens ?? 0,
        outputTokens: final.usage.output_tokens,
      });
    } catch (error) {
      clearTimeout(timer);
      /* Never surface a provider error to a visitor: it can carry model names,
         quota state and request ids. The client renders its own fallback. */
      logger.error("ask-gaitai failed", {
        message: error instanceof Error ? error.message : "unknown",
      });
      if (!res.writableEnded) {
        send(res, "error", { code: "upstream" });
        res.end();
      }
    }
  },
);

"use client";

/**
 * THE ENGINE — retrieval in the tab, generation behind the Worker.
 * =============================================================================
 * The pipeline is unchanged in shape and in order:
 *
 *   question + page  →  BM25 retrieval over the corpus      (the source of truth)
 *                    →  top 7 records, capped per record
 *                    →  a grounded answer                   (hosted model, or extract)
 *                    →  link sanitising against the route allowlist
 *                    →  sources, follow-ups, CTA
 *
 * WHERE EACH STEP RUNS
 *   retrieval   here, first, always. It decides whether the question is even
 *               answerable from GaitAI's records. A low-confidence question or
 *               a person the corpus has no record for is refused HERE, in the
 *               site's own wording, without a network request.
 *   generation  in the Ask GaitAI Worker (worker/), a Cloudflare Worker. The
 *               browser sends the IDS of the records retrieval chose — never
 *               their text. The Worker resolves those ids against its own copy
 *               of the canonical corpus, discards any it does not know, builds
 *               the grounding prompt from the canonical records, and calls a
 *               hosted model through Hugging Face Inference Providers. The
 *               model only ever sees those records; it never decides which
 *               pages are authoritative, and it never sees the whole site.
 *   fallback    here. If no endpoint is configured, or the Worker is
 *               unreachable, rate-limited, over budget, timed out or errors,
 *               the extractive answer — the records' own summaries, quoted —
 *               answers from the retrieval that already ran. Ask GaitAI is
 *               useful either way; the model changes how an answer READS,
 *               never whether there is one.
 *
 * WHAT LEFT WITH THE LOCAL MODEL
 *   · `model.ts` — Transformers.js, ONNX Runtime Web, WebGPU detection, the
 *     WASM fallback, the 1.2 GB download and its progress reporting
 *   · `modelReady()` / `modelExpected` — there is no model state in the tab
 *   · the `ModelStrip` — nothing to offer, nothing to download
 *
 * WHAT SURVIVED, AND WHY IT STILL MATTERS
 *   · `sanitizeLinks` — applied on the Worker and again here on every answer
 *     it returns, so a hallucinated or off-site route can never render.
 *   · the extractive answer — it was the default; it is now the floor.
 *   · low-confidence refusal from retrieval — the model is only told.
 */

import { retrieveGaitAIContext, type RetrievalResult } from "./retrieval";
import {
  demoHref,
  sanitizeLinks,
  selectSources,
  shouldOfferDemo,
  suggestFollowUps,
} from "./answer";
import { composeExtractiveAnswer } from "./extractive";
import { loadCorpus } from "./corpus";
import { askHosted, hostedEnabled, type HostedTurn } from "./hosted";

export interface AskSource {
  title: string;
  url: string;
  kind: string;
}

export interface AskResult {
  text: string;
  sources: AskSource[];
  /** Retrieved records that did not make the Sources row. Same allowlist. */
  relatedLinks: AskSource[];
  suggestions: string[];
  cta?: { label: string; href: string };
  /** Which layer wrote the prose: the hosted model, or the records themselves. */
  mode: "model" | "retrieval";
  lowConfidence: boolean;
}

/** Fetch the corpus ahead of the first question. Safe to call repeatedly. */
export async function warmCorpus(basePath = ""): Promise<void> {
  await loadCorpus(basePath);
}

/** An internal, allowlisted route and nothing else. */
const internal = (source: AskSource) =>
  source.url.startsWith("/") && !source.url.startsWith("//");

function finish(
  result: RetrievalResult,
  text: string,
  question: string,
  turnIndex: number,
  mode: AskResult["mode"],
): AskResult {
  const clean = sanitizeLinks(text);
  const sources = result.lowConfidence ? [] : selectSources(clean, result.docs);
  const suggestions = suggestFollowUps(result.docs, question);
  const cta = shouldOfferDemo(result.docs, turnIndex)
    ? { label: "Request a demo", href: demoHref() }
    : undefined;

  return {
    text: clean,
    sources,
    relatedLinks: [],
    suggestions,
    cta,
    mode,
    lowConfidence: result.lowConfidence,
  };
}

/**
 * Answer a question.
 *
 * Retrieval runs first and always. If it finds nothing, the refusal is local
 * and immediate. Otherwise — and only if an endpoint is configured — the
 * hosted model writes the prose from the retrieved records; if the Worker
 * cannot be reached for any reason, the extract answers instead. Both paths
 * return the same shape, so the panel does not branch.
 */
export async function ask(options: {
  question: string;
  pathname: string;
  pageTitle?: string;
  turnIndex?: number;
  /** Prior turns, oldest first. The user turns are a retrieval signal; the
   *  whole window is conversation context for the model. */
  history?: HostedTurn[];
  signal?: AbortSignal;
}): Promise<AskResult> {
  const {
    question,
    pathname,
    pageTitle = "",
    turnIndex = 0,
    history = [],
    signal,
  } = options;

  await loadCorpus();
  const priorUserTurns = history
    .filter((turn) => turn.role === "user")
    .map((turn) => turn.content);
  const result = retrieveGaitAIContext(question, pathname, priorUserTurns);

  /* Nothing scored: refuse from retrieval, and do not spend a model call
     asking a model to decline gracefully. The refusal is the site's own
     wording, every time. */
  if (result.lowConfidence || result.docs.length === 0) {
    return finish(
      result,
      composeExtractiveAnswer(result),
      question,
      turnIndex,
      "retrieval",
    );
  }

  /* No endpoint configured: no request, no timeout, no error, no console
     noise. The extract is the answer. */
  if (hostedEnabled()) {
    try {
      const hosted = await askHosted({
        question,
        pathname,
        pageTitle,
        history,
        selectedRecordIds: result.docs.map((item) => item.doc.id),
        signal,
      });
      if (hosted.text.trim().length > 0) {
        /* The Worker already sanitised and chose sources from the canonical
           records. Sanitise again here anyway: the allowlist in this tab is
           the one that matters for what renders. */
        return {
          ...hosted,
          text: sanitizeLinks(hosted.text),
          sources: hosted.sources.filter(internal),
          relatedLinks: hosted.relatedLinks.filter(internal),
        };
      }
    } catch (error) {
      if ((error as Error)?.name === "AbortError") throw error;
      /* Unreachable, rejected, rate-limited, over budget, timed out, provider
         error, malformed reply — all of them are a reason to answer from
         records, not a reason to show an error. The retrieval that already
         ran is the answer. */
    }
  }

  return finish(
    result,
    composeExtractiveAnswer(result),
    question,
    turnIndex,
    "retrieval",
  );
}

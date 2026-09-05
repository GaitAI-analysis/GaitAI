"use client";

/**
 * THE ENGINE — retrieval in the tab, generation behind the project's function.
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
 *               site's own wording, without spending a model call.
 *   generation  in `askGaitai`, the Cloud Function (functions/src/). It re-runs
 *               the SAME retrieval from the same corpus — the modules in this
 *               directory are copied into the function at build time — builds
 *               the grounding prompt server-side, and calls a hosted model
 *               through Hugging Face Inference Providers. The model only ever
 *               sees the retrieved records; it never decides which pages are
 *               authoritative, and it never sees the whole site.
 *   fallback    here. If the function is unreachable, rate-limited, over budget,
 *               timed out or errors, the extractive answer — the records' own
 *               summaries, quoted — answers from the retrieval that already ran.
 *               Ask GaitAI is useful either way; the model changes how an answer
 *               READS, never whether there is one.
 *
 * WHAT LEFT WITH THE LOCAL MODEL
 *   · `model.ts` — Transformers.js, ONNX Runtime Web, WebGPU detection, the
 *     WASM fallback, the 1.2 GB download and its progress reporting
 *   · `modelReady()` / `modelExpected` — there is no model state in the tab
 *   · the `ModelStrip` — nothing to offer, nothing to download
 *
 * WHAT SURVIVED, AND WHY IT STILL MATTERS
 *   · `sanitizeLinks` — applied server-side and again here on every answer the
 *     server returns, so a hallucinated or off-site route can never render.
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
 * and immediate. Otherwise the hosted model writes the prose from the retrieved
 * records; if the function cannot be reached for any reason, the extract
 * answers instead. Both paths return the same shape, so the panel does not
 * branch.
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

  if (hostedEnabled()) {
    try {
      const hosted = await askHosted({
        question,
        pathname,
        pageTitle,
        history,
        signal,
      });
      if (hosted.text.trim().length > 0) {
        /* The server already sanitised and chose sources from its own
           retrieval. Sanitise again here anyway: the allowlist in this tab is
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
      /* Unreachable, rate-limited, over budget, timed out, provider error —
         all of them are a reason to answer from records, not a reason to
         show an error. The retrieval that already ran is the answer. */
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

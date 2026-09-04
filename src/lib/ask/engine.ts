"use client";

/**
 * THE ENGINE — what the Cloud Function used to be, running in the tab.
 * =============================================================================
 * The pipeline is unchanged in shape and in order:
 *
 *   question + page  →  BM25 retrieval over 113 records   (the source of truth)
 *                    →  top 7 records, capped per record
 *                    →  a grounded answer                 (model, or extract)
 *                    →  link sanitising against the route allowlist
 *                    →  sources, follow-ups, CTA
 *
 * What moved is only WHERE the third step happens. The retrieval, the system
 * policy, the link allowlist, the source selection and the follow-up
 * derivation are the same modules that passed the 25-question suite; they were
 * ported off `node:fs` and nothing else.
 *
 * WHAT WAS DELETED WITH THE FUNCTION
 *   · the Anthropic client and `LLM_API_KEY`
 *   · `NEXT_PUBLIC_ASK_GAITAI_ENDPOINT` and the enabled flag it gated
 *   · the IP-digest rate limiter — there is no shared resource left to
 *     protect. The cost of a question is now borne by the tab that asks it,
 *     which is its own rate limit.
 *   · CORS and the origin allowlist — there is no origin to check
 *
 * WHAT SURVIVED, AND WHY IT STILL MATTERS WITHOUT A SERVER
 *   · `sanitizeLinks` — a local model invents routes as readily as a hosted
 *     one, and a 404 is a 404. The allowlist is now enforced in the tab that
 *     renders the answer, which is the only place it was ever really needed.
 *   · the system policy — it is what keeps the model from answering from its
 *     pretraining instead of from the records.
 *   · low-confidence refusal — retrieval decides, the model is only told.
 */

import {
  buildContextBlock,
  retrieveGaitAIContext,
  type RetrievalResult,
} from "./retrieval";
import { systemPrompt, buildUserTurn } from "./prompt";
import {
  demoHref,
  sanitizeLinks,
  selectSources,
  shouldOfferDemo,
  suggestFollowUps,
} from "./answer";
import {
  composeExtractiveAnswer,
  composeFinalExtractiveAnswer,
} from "./extractive";
import { loadCorpus } from "./corpus";
import { generate, modelReady } from "./model";

export interface AskSource {
  title: string;
  url: string;
  kind: string;
}

export interface AskResult {
  text: string;
  sources: AskSource[];
  suggestions: string[];
  cta?: { label: string; href: string };
  /** Which layer wrote the prose. Shown to the reader as a quiet note. */
  mode: "model" | "retrieval";
  lowConfidence: boolean;
}

/** Ensure the corpus is in memory. Called on panel open, and again defensively. */
export async function warmCorpus(basePath = ""): Promise<void> {
  await loadCorpus(basePath);
}

/* `retrieveGaitAIContext` reads the page context itself, and takes the prior
   turns so a follow-up ("which one works with just video?") resolves against
   what was being discussed. */
function retrieve(
  question: string,
  pathname: string,
  history: string[],
): RetrievalResult {
  return retrieveGaitAIContext(question, pathname, history);
}

function pageLineFor(result: RetrievalResult, pathname: string, title: string) {
  if (result.pageDoc) {
    return `The visitor is currently reading: ${result.pageDoc.title} (${result.pageDoc.url}). Resolve vague references ("this", "it", "this product") against that page.`;
  }
  return title
    ? `The visitor is currently on ${pathname} ("${title}").`
    : `The visitor is currently on ${pathname}.`;
}

function finish(
  result: RetrievalResult,
  text: string,
  question: string,
  turnIndex: number,
  mode: AskResult["mode"],
): AskResult {
  /* Same order as the function: strip disallowed links FIRST, then pick
     sources from what the answer actually kept. */
  const clean = sanitizeLinks(text);
  const retrieved = result.docs.map(({ doc, score }) => ({ doc, score }));

  return {
    text: clean,
    /* A person the site has no record for has no source to cite: the nearest
       record is not evidence about them. */
    sources: result.entityMiss ? [] : selectSources(clean, retrieved),
    suggestions: suggestFollowUps(retrieved, question),
    cta: shouldOfferDemo(retrieved, turnIndex)
      ? { label: "Request a demo", href: demoHref() }
      : undefined,
    mode,
    lowConfidence: result.lowConfidence,
  };
}

/**
 * Answer a question.
 *
 * Retrieval runs first and always. If the model is loaded it writes the prose
 * from the retrieved records; if it is not — no WebGPU, download declined,
 * load failed, or simply not fetched yet — the extract answers instead. Both
 * paths return the same shape, so the panel does not branch.
 *
 * A model failure mid-generation falls through to the extract rather than
 * surfacing an error: the reader asked a question about GaitAI, and there is
 * an answer available that does not need the model.
 */
export async function ask(options: {
  question: string;
  pathname: string;
  pageTitle?: string;
  turnIndex?: number;
  /** Prior turns, oldest first — a quarter-weight retrieval signal. */
  history?: string[];
  /** False when the model will never be available, so the copy can say so. */
  modelExpected?: boolean;
  signal?: AbortSignal;
}): Promise<AskResult> {
  const {
    question,
    pathname,
    pageTitle = "",
    turnIndex = 0,
    history = [],
    modelExpected = true,
    signal,
  } = options;

  await loadCorpus();
  const result = retrieve(question, pathname, history);

  /* Nothing scored: refuse from retrieval, and do not spend a model call
     asking a 1.5B network to decline gracefully. The refusal is the site's
     own wording, every time. */
  if (result.lowConfidence || result.docs.length === 0) {
    return finish(
      result,
      composeFinalExtractiveAnswer(result),
      question,
      turnIndex,
      "retrieval",
    );
  }

  if (modelReady()) {
    try {
      const text = await generate(
        systemPrompt(),
        buildUserTurn({
          message: question,
          contextBlock: buildContextBlock(result),
          pageLine: pageLineFor(result, pathname, pageTitle),
          lowConfidence: result.lowConfidence,
        }),
        signal,
      );

      if (text.trim().length > 0) {
        return finish(result, text, question, turnIndex, "model");
      }
      /* Empty completion: fall through rather than render a blank answer. */
    } catch (error) {
      if ((error as Error)?.name === "AbortError") throw error;
      /* Anything else — an OOM on a small GPU, a runtime fault — is a reason
         to answer from records, not a reason to show an error. */
    }
  }

  return finish(
    result,
    modelExpected
      ? composeExtractiveAnswer(result)
      : composeFinalExtractiveAnswer(result),
    question,
    turnIndex,
    "retrieval",
  );
}

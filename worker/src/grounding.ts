/**
 * GROUNDING — canonical records in, a prompt out.
 * =============================================================================
 * The browser has already run deterministic retrieval and sends the ids of the
 * records it chose. This module is what makes that safe:
 *
 *   1. the ids are resolved against the Worker's OWN copy of the canonical
 *      corpus (src/generated/knowledge.json, derived at build time from the same
 *      file the browser fetches — see scripts/build-corpus.mjs)
 *   2. anything the corpus does not know is discarded, silently
 *   3. the prompt is built from those canonical records by the shared
 *      `buildMessages` — the same function the benchmark calls — so the model
 *      never reads a word the browser typed except the question itself
 *
 * WHY NOT RE-RUN RETRIEVAL HERE. It would be cheap (the index builds in a few
 * milliseconds and the modules are already bundled), and it would be the only
 * option if the browser could not be trusted to SELECT. But selection is not
 * the trust problem; content is. A hostile browser that picks seven odd records
 * gets an answer grounded in seven odd canonical records — no worse than a
 * hostile visitor reading those seven pages. What it cannot do is supply text
 * and have it treated as GaitAI's record, and id resolution closes that on its
 * own. Server-side retrieval is documented in docs/ask-gaitai.md as the
 * upgrade path if browser selection ever proves unreliable.
 */

import knowledge from "./generated/knowledge.json";
import {
  corpusReady,
  docById,
  seedCorpus,
  type Knowledge,
  type KnowledgeDoc,
} from "../../src/lib/ask/corpus";
import { resetIndex, type RetrievedDoc } from "../../src/lib/ask/retrieval";
import { buildMessages, type ChatTurn } from "../../src/lib/ask/prompt";
import type { ChatMessage } from "./workers-ai";

/** Seed the shared corpus module once per isolate. */
export function ensureCorpus(): void {
  if (corpusReady()) return;
  seedCorpus(knowledge as unknown as Knowledge);
  resetIndex();
}

export interface Grounding {
  docs: RetrievedDoc[];
  pageDoc: KnowledgeDoc | null;
}

/**
 * Resolve the browser's selection to canonical records, in the order given.
 * Unknown ids vanish. The page's own record is found from the route, exactly
 * as the browser's retrieval finds it, so "this" resolves the same way here.
 */
export function resolveRecords(ids: string[], pathname: string): Grounding {
  ensureCorpus();
  const byId = docById();
  const docs: RetrievedDoc[] = [];
  for (const id of ids) {
    const doc = byId.get(id);
    if (doc && !docs.some((item) => item.doc.id === doc.id)) {
      docs.push({ doc, score: 0, reason: "selected" });
    }
  }

  const normalised = `/${pathname.replace(/^\/+|\/+$/g, "").split(/[?#]/)[0]}/`.replace(/^\/\/+/, "/");
  let pageDoc: KnowledgeDoc | null = null;
  for (const doc of byId.values()) {
    if (doc.url === normalised) {
      pageDoc = doc;
      break;
    }
  }

  return { docs, pageDoc };
}

export function buildPrompt(options: {
  question: string;
  grounding: Grounding;
  pathname: string;
  pageTitle: string;
  history: ChatTurn[];
}): ChatMessage[] {
  ensureCorpus();
  return buildMessages({
    question: options.question,
    result: { docs: options.grounding.docs, pageDoc: options.grounding.pageDoc, lowConfidence: false },
    pathname: options.pathname,
    pageTitle: options.pageTitle,
    history: options.history,
  });
}

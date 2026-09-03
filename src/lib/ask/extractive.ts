/**
 * RETRIEVAL-ONLY MODE — an answer with no language model at all.
 * =============================================================================
 * This is not a degraded error state. It is the assistant's ground floor, and
 * on most visits it is the whole assistant:
 *
 *   · it answers in tens of milliseconds, after a 323 KB corpus fetch
 *   · it downloads no model, so it costs the visitor nothing on mobile data
 *   · it cannot hallucinate, because it writes no new sentences
 *
 * WHAT IT DOES. It quotes the site. Every sentence in the answer below is a
 * `summary` field written by a person for a page a visitor can open, copied
 * verbatim and attributed. The only text this module authors itself is the
 * connective scaffolding — "Three records cover that:" — which asserts
 * nothing about GaitAI.
 *
 * WHY THAT IS ENOUGH, MOSTLY. The corpus is 113 records of controlled
 * technical vocabulary and the retrieval over it passes a 25-question
 * acceptance suite. For "what does WalkScan measure?" or "which products use
 * wearables?", the right record's own summary IS the answer, and a 1.1 GiB
 * model paraphrasing it is worse: slower, less accurate, and capable of
 * drifting. The model earns its place on questions that need SYNTHESIS across
 * records — "what is the difference between CrowdSense and SuspiciousMotion?"
 * — which is exactly where an extract reads as two summaries stapled together.
 *
 * So both modes ship, the extract answers immediately, and the model is an
 * upgrade the visitor opts into rather than a dependency.
 */

import type { RetrievalResult } from "./retrieval";
import type { KnowledgeDoc } from "./corpus";

/** How many supporting records a composed answer will name. */
const SUPPORTING = 3;

/** A record's own words, trimmed to one or two sentences. */
function brief(doc: KnowledgeDoc, maxChars = 260): string {
  const source = doc.summary?.trim() || doc.content?.trim() || "";
  if (!source) return "";
  if (source.length <= maxChars) return source;

  /* Cut on a sentence end if there is one in range, so the extract never ends
     mid-clause. Falling back to a word boundary and an ellipsis. */
  const window = source.slice(0, maxChars);
  const stop = Math.max(window.lastIndexOf(". "), window.lastIndexOf("? "));
  if (stop > maxChars * 0.5) return window.slice(0, stop + 1);
  const space = window.lastIndexOf(" ");
  return `${window.slice(0, space > 0 ? space : maxChars)}…`;
}

const TYPE_NOUN: Record<string, string> = {
  product: "module",
  "use-case": "environment",
  publication: "record",
  research: "research area",
  insight: "article",
  capability: "capability",
  signal: "signal",
  deployment: "deployment note",
  policy: "policy",
  page: "page",
};

/**
 * Compose an answer from the retrieved records alone.
 *
 * Deterministic: the same question and the same corpus always produce the same
 * text, which is a property no sampled model has and a useful one for a
 * marketing site that has to be quotable.
 */
export function composeExtractiveAnswer(result: RetrievalResult): string {
  if (result.lowConfidence || result.docs.length === 0) {
    return [
      "I have no documented answer to that on the GaitAI platform.",
      "",
      "I answer only from the site's own records — modules, environments, capabilities, publications, research areas and policy pages — and nothing there establishes this. Rephrasing it around a module name, an environment or a capability usually finds the record.",
    ].join("\n");
  }

  const [lead, ...rest] = result.docs;
  const lines: string[] = [];

  const leadBrief = brief(lead.doc, 320);
  if (leadBrief) {
    lines.push(`**${lead.doc.title}** — ${leadBrief}`);
  } else {
    lines.push(`**${lead.doc.title}** is the closest record.`);
  }

  /* Supporting records get one line each, titled and typed, so the reader can
     see WHAT KIND of thing each one is before following it. */
  const supporting = rest
    .filter((item) => item.doc.id !== lead.doc.id)
    .slice(0, SUPPORTING)
    .map((item) => {
      const noun = TYPE_NOUN[item.doc.type] ?? item.doc.type;
      const line = brief(item.doc, 150);
      return `- **${item.doc.title}** (${noun})${line ? ` — ${line}` : ""}`;
    });

  if (supporting.length) {
    lines.push("");
    lines.push(
      supporting.length === 1
        ? "One related record:"
        : `${supporting.length} related records:`,
    );
    lines.push(...supporting);
  }

  /* Said once, at the end, and only in this mode — the reader should know
     they are reading extracts rather than a written answer.
     No `_emphasis_`: AnswerText renders a deliberate subset — bold, links and
     inline code — so underscores would reach the reader as underscores. */
  lines.push("");
  lines.push(
    "Quoted from the records below rather than written — ask again once the local model is ready for a composed answer.",
  );

  return lines.join("\n");
}

/**
 * The same composition, minus the closing note, for when the model is not
 * coming — no WebGPU, a refused download, or a load failure. Promising a
 * "composed answer" that can never arrive would be a worse answer than none.
 */
export function composeFinalExtractiveAnswer(result: RetrievalResult): string {
  return composeExtractiveAnswer(result).replace(
    "Quoted from the records below rather than written — ask again once the local model is ready for a composed answer.",
    "Quoted from the records below rather than written.",
  );
}

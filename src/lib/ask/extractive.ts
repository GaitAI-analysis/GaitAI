/**
 * RETRIEVAL-ONLY MODE — an answer with no language model at all.
 * =============================================================================
 * This is not a degraded error state. It is the assistant's ground floor:
 *
 *   · it answers in tens of milliseconds, after a 315 KB corpus fetch
 *   · it needs no network call beyond that fetch, so it works when the hosted
 *     model does not — provider outage, rate limit, budget, timeout, offline
 *   · it cannot hallucinate, because it writes no new sentences
 *
 * WHAT IT DOES. It quotes the site. Every sentence in the answer below is a
 * `summary` field written by a person for a page a visitor can open, copied
 * verbatim and attributed. The only text this module authors itself is the
 * connective scaffolding — "Three records cover that:" — which asserts
 * nothing about GaitAI.
 *
 * WHERE IT SITS NOW. The hosted model (see `hosted.ts` and functions/src) is
 * the default writer: it reads the same retrieved records and composes prose
 * from them. This module is what answers when that call cannot be made or
 * does not come back — so the assistant is useful either way, and the model
 * only ever changes how an answer READS, never whether there is one.
 */

import type { RetrievalResult, RetrievedDoc } from "./retrieval";
import type { DocType, KnowledgeDoc } from "./corpus";

/** How many supporting records a composed answer will name. */
const SUPPORTING = 3;

/** How many related records a person answer will name. */
const PERSON_RELATED = 4;

/**
 * Said once, at the end, and only in this mode — the reader should know they
 * are reading extracts rather than a written answer. No `_emphasis_`:
 * AnswerText renders a deliberate subset — bold, links and inline code — so
 * underscores would reach the reader as underscores.
 */
const QUOTED_NOTE = "Quoted from the records below rather than written.";

/**
 * The wording for a person the corpus has no record for. Named from the
 * question — "Anubha", "Dr. Smith" — so the visitor can see what was looked
 * up, and pointed at the two routes where people appear on this site.
 */
export function composeEntityMiss(subject: string): string {
  const shown = subject.replace(/["“”]/g, "").trim();
  return `I couldn't find a GaitAI record for “${shown}”. Try a full name, or search [Research](/research/) and [Publications](/publications/).`;
}

/**
 * A PERSON answer: the entity first, then the records that point at it.
 *
 * Shape, deliberately plain:
 *
 *   Person
 *   **Name** — the record's own summary
 *
 *   Related:
 *   - a research area, a paper, a page — up to four, one of each kind first
 *
 * Every sentence is the person record's own `summary`, which build-knowledge
 * assembles from the site's Publications, Research and Talks data. Nothing
 * about the person is written here.
 */
function composePersonAnswer(result: RetrievalResult, lead: RetrievedDoc): string {
  const entityId = lead.doc.entityId ?? result.entity?.entityId;
  const lines: string[] = ["## Person"];

  const summary = brief(lead.doc, 420);
  lines.push(summary ? `**${lead.doc.title}** — ${summary}` : `**${lead.doc.title}**`);

  /* Related records: those that point back at the person, one of each kind
     before a second of any kind, so four slots show four different things. */
  const pool = result.docs.filter(
    (item) =>
      item.doc.id !== lead.doc.id &&
      (!entityId || item.doc.relatedEntityIds?.includes(entityId)),
  );
  const order: DocType[] = ["research", "publication", "page"];
  const chosen: RetrievedDoc[] = [];
  for (const type of order) {
    const first = pool.find(
      (item) => item.doc.type === type && !chosen.includes(item),
    );
    if (first) chosen.push(first);
  }
  for (const item of pool) {
    if (chosen.length >= PERSON_RELATED) break;
    if (!chosen.includes(item)) chosen.push(item);
  }

  if (chosen.length) {
    lines.push("");
    lines.push("Related:");
    for (const item of chosen) {
      const noun = TYPE_NOUN[item.doc.type] ?? item.doc.type;
      const line = brief(item.doc, 140);
      lines.push(`- **${item.doc.title}** (${noun})${line ? ` — ${line}` : ""}`);
    }
  }

  return lines.join("\n");
}

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
  person: "person",
};

/**
 * Compose an answer from the retrieved records alone.
 *
 * Deterministic: the same question and the same corpus always produce the same
 * text, which is a property no sampled model has and a useful one for a
 * marketing site that has to be quotable.
 */
export function composeExtractiveAnswer(result: RetrievalResult): string {
  /* Asked about a person the site has no record for: say which one, and
     where people do appear — not the nearest policy page. */
  if (result.entityMiss) return composeEntityMiss(result.entityMiss);

  if (result.lowConfidence || result.docs.length === 0) {
    return [
      "I have no documented answer to that on the GaitAI platform.",
      "",
      "I answer only from the site's own records — modules, environments, capabilities, publications, research areas and policy pages — and nothing there establishes this. Rephrasing it around a module name, an environment or a capability usually finds the record.",
    ].join("\n");
  }

  const [lead, ...rest] = result.docs;
  const lines: string[] = [];

  /* Answer first, sources second: a question about a person is answered by
     the person record, with the papers and research listed under it. */
  if (lead.doc.type === "person") {
    lines.push(composePersonAnswer(result, lead));
    lines.push("");
    lines.push(QUOTED_NOTE);
    return lines.join("\n");
  }

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

  lines.push("");
  lines.push(QUOTED_NOTE);

  return lines.join("\n");
}

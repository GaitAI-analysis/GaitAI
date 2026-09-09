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
 * WHERE IT SITS NOW. The hosted model (see `hosted.ts` and worker/) is the
 * writer when an endpoint is configured: it reads the same retrieved records
 * and composes prose from them. This module is what answers when no endpoint
 * is set, when that call cannot be made, or when it does not come back — so
 * the assistant is useful either way, and the model only ever changes how an
 * answer READS, never whether there is one.
 */

import type { RetrievalResult, RetrievedDoc } from "./retrieval";
import type { DocType, KnowledgeDoc } from "./corpus";

/** How many related records a person answer will name. */
const PERSON_RELATED = 4;

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

/**
 * The lead record's own words for a records-only answer: its summary, then
 * the opening sentences of its content while they fit — so "Tell me about
 * GaitAI" reads the one-line description AND the two families with their
 * module counts, not the one line alone. Content that merely repeats the
 * summary is not appended twice.
 */
function leadText(doc: KnowledgeDoc, maxChars: number): string {
  const summary = doc.summary?.trim() ?? "";
  const content = (doc.content ?? "").replace(/\s+/g, " ").trim();
  if (!summary) return brief(doc, maxChars);
  if (!content || content.startsWith(summary.slice(0, 40)) && content.length <= summary.length + 20) return brief(doc, maxChars);
  const room = maxChars - summary.length - 1;
  if (room < 60) return summary;
  /* Skip a first content sentence that is the summary restated, and stop at
     the first "Label: value" field — a module record's content is a field
     list after its opening sentence, and a field list is not prose. */
  const LABEL = /^[A-Z][A-Za-z /&-]{2,40}: /;
  const body = (content.startsWith(summary) ? content.slice(summary.length).trim() : content)
    .split(/\s(?=[A-Z][A-Za-z /&-]{2,40}: )/)[0]
    .trim();
  if (!body || LABEL.test(body)) return summary;
  let extra = brief({ ...doc, summary: "", content: body }, room);
  /* Whole sentences only: a trailing fragment ("24 modular products") is cut. */
  if (extra && !/[.!?]$/.test(extra)) {
    const stop = Math.max(extra.lastIndexOf(". "), extra.lastIndexOf("? "), extra.lastIndexOf("! "));
    extra = stop > 0 ? extra.slice(0, stop + 1) : "";
  }
  return extra ? `${summary} ${extra}` : summary;
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
  talk: "talk",
};

/** How many capabilities an application answer lists. */
const APPLICATION_MODULES = 4;

/**
 * An APPLICATION answer — "what can GaitAI do for X" — shaped as an answer,
 * not as a list of hits:
 *
 *   What GaitAI could contribute for X
 *   one or two sentences: the documented environment, or the boundary
 *   Relevant capabilities:
 *   - Module — what it is. Its own summary.
 *   Important boundary: what is and is not documented.
 *
 * Every sentence about GaitAI is a record's own `summary` or `category`; the
 * scaffolding — the heading, "Relevant capabilities", the boundary line —
 * asserts nothing about GaitAI except the one thing the corpus is the
 * authority on: whether an environment record for X exists. That decision is
 * retrieval's (`result.application.documentedEnvironmentIds`), from the
 * corpus, never from the question's wording.
 */
function composeApplicationAnswer(result: RetrievalResult): string {
  const application = result.application!;
  const subject = application.subject;
  const byId = new Map(result.docs.map((item) => [item.doc.id, item]));
  const environments = application.documentedEnvironmentIds
    .map((id) => byId.get(id))
    .filter((item): item is RetrievedDoc => Boolean(item));
  /* A product the site documents as dedicated to the domain (DefenceMotion for
     defence) is named first, as a documented PRODUCT — still not a deployment,
     customer, pilot or clearance, which no record establishes. */
  const dedicatedIds = new Set(application.documentedProductIds);
  const dedicated = application.documentedProductIds
    .map((id) => byId.get(id))
    .filter((item): item is RetrievedDoc => Boolean(item));
  const modules = result.docs.filter(
    (item) => item.doc.type === "product" && !item.doc.parentId && !dedicatedIds.has(item.doc.id),
  );
  const otherCapabilities = result.docs.filter(
    (item) =>
      (item.doc.type === "capability" || item.doc.type === "deployment" || item.doc.type === "policy") &&
      !item.doc.parentId,
  );

  const askType = result.understanding.askType ?? "potential";
  const who = result.understanding.entity.title;
  const lines: string[] = [
    askType === "relationship"
      ? `## Does ${who} work with ${subject}?`
      : askType === "product-exists"
        ? `## Is there a ${subject} product?`
        : `## What ${who} could contribute for ${subject}`,
  ];

  if (environments.length) {
    for (const environment of environments) {
      lines.push(
        `${askType === "relationship" ? `No customer or live deployment is documented, but ` : ""}GaitAI documents **${environment.doc.title}** as a deployment environment — ${brief(environment.doc, 260)}`,
      );
    }
    /* The environment's dedicated product, named in its own line so the answer
       to "is there a product for it" is never only a list. */
    for (const product of dedicated) {
      lines.push(`GaitAI also documents **${product.doc.title}** as a product dedicated to ${subject} — ${brief(product.doc, 260)}`);
    }
  } else if (dedicated.length) {
    for (const product of dedicated) {
      const summary = brief(product.doc, 260);
      lines.push(
        askType === "relationship"
          ? `No customer, contract or live deployment in ${subject} is documented, but GaitAI documents **${product.doc.title}** as a dedicated ${subject} product — ${summary}`
          : askType === "product-exists"
            ? `Yes — GaitAI documents **${product.doc.title}** as its ${subject}-specific product — ${summary}`
            : `GaitAI documents **${product.doc.title}** as its dedicated ${subject} product — ${summary} The available GaitAI information does not document a dedicated ${subject} deployment, customer, pilot or clearance for it.`,
      );
    }
  } else if (askType === "relationship") {
    lines.push(
      `The available GaitAI information does not establish any existing deployment, customer, contract or partnership in ${subject}. The documented capabilities below may be relevant to such an environment; they are potential applications, not a record of use.`,
    );
  } else if (askType === "product-exists") {
    lines.push(
      `No ${subject}-specific product is documented in the GaitAI catalogue. The modules below are the documented ones whose records come closest.`,
    );
  } else {
    lines.push(
      `The available GaitAI information does not document a dedicated ${subject} deployment or ${subject}-specific product. The documented capabilities below may be relevant; they are potential applications, not a record of use in this domain.`,
    );
  }

  const listed = (modules.length ? modules : otherCapabilities).slice(0, APPLICATION_MODULES);
  if (listed.length) {
    lines.push("");
    lines.push("Relevant capabilities:");
    for (const item of listed) {
      const what = item.doc.type === "product" ? item.doc.category : TYPE_NOUN[item.doc.type] ?? item.doc.type;
      const line = brief(item.doc, 150);
      lines.push(`- **${item.doc.title}** — ${what}.${line ? ` ${line}` : ""}`);
    }
  }

  lines.push("");
  lines.push(
    environments.length
      ? `Important boundary: the environment page describes a recommended module mix. No customer, pilot, measured result or certification for ${subject} is documented in the current GaitAI site information.`
      : dedicated.length
        ? `Important boundary: the product page describes intended use and its modes. No dedicated ${subject} deployment, customer, pilot, clearance or certification is documented in the current GaitAI site information.`
        : `Important boundary: no dedicated ${subject} deployment, customer, pilot, clearance or certification is documented in the current GaitAI site information.`,
  );
  return lines.join("\n");
}

/**
 * The graceful answer for what the public record cannot say: pricing,
 * customers, contracts, hiring, finances — or something off-topic. It names
 * the topic that was looked for, says the record does not establish it, and
 * offers the closest real destinations from the retrieved records.
 */
function composeUnsupported(result: RetrievalResult): string {
  const topic = result.understanding.topic || result.understanding.original.replace(/[?.!]+$/g, "");
  const commercial =
    /\b(pric\w*|cost\w*|how much|fees?|subscription|quote|customers?|clients?|who uses|case stud\w*|fortune|contracts?|tenders?)\b/i.test(
      result.understanding.text,
    );
  const nearest = result.docs
    .filter((item) => item.doc.type === "page" || item.doc.type === "product" || item.doc.type === "use-case")
    .slice(0, 2);
  const lines = [
    `The available GaitAI information does not establish ${topic ? `"${topic}"` : "that"}.`,
    "",
    commercial
      ? "Pricing, customers, contracts and commercial terms are not part of the public record. For a commercial or partnership conversation, [request a demo](/#contact)."
      : "I answer from GaitAI's own records — modules, environments, capabilities, publications, research and policy pages — and nothing there covers this.",
  ];
  if (nearest.length) {
    lines.push("");
    lines.push(`Closest documented pages: ${nearest.map((item) => `[${item.doc.title}](${item.doc.url})`).join(" · ")}.`);
  }
  return lines.join("\n");
}

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

  /* "What can GaitAI do for X": an answer with its boundary, not a hit list. */
  if (result.application && !result.lowConfidence && result.docs.length > 0) {
    return composeApplicationAnswer(result);
  }

  /* A question the public record cannot answer by its nature — pricing,
     customers, hiring — or off-topic. Say so, and point somewhere real. */
  if (result.intent === "UNSUPPORTED") return composeUnsupported(result);

  /* A domain question whose domain nothing documents and nothing scores:
     the graceful answer names what was looked for. */
  if (result.lowConfidence && result.understanding.domain) {
    const subject = result.understanding.domain.subject;
    return [
      `I couldn't find a documented GaitAI ${subject} deployment or ${subject}-specific product.`,
      "",
      `I can show you which GaitAI capabilities may be relevant to that kind of environment — try asking about the [SecureVision](/securevision/) or [MobilityCare](/mobilitycare/) family, or browse the documented [use cases](/use-cases/).`,
    ].join("\n");
  }

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
    return lines.join("\n");
  }

  /* "How does GaitAI work": the platform record IS the sequence — render its
     pipeline section whole rather than a 300-character extract that stops
     mid-stage. */
  if (result.intent === "ARCHITECTURE" && lead.doc.id === "platform:gaitai-end-to-end") {
    return composeArchitectureAnswer(lead.doc);
  }

  /* The shape a reader expects from a records-only answer: a one-line frame,
     the best record's own words as the answer, and — when a second record
     genuinely adds to it — one more short paragraph. The "N related records"
     list that used to follow read as a search engine's results page; those
     records now live under Sources and the Related-evidence disclosure, where
     the interface already puts them. */
  lines.push(FRAME);
  lines.push("");
  const leadBrief = leadText(lead.doc, 420);
  lines.push(leadBrief ? `**${lead.doc.title}** — ${leadBrief}` : `**${lead.doc.title}** is the closest record.`);

  const second = rest.find(
    (item) =>
      item.doc.id !== lead.doc.id &&
      item.doc.parentId !== lead.doc.id &&
      item.doc.id !== lead.doc.parentId &&
      item.score >= lead.score * 0.6 &&
      item.doc.type !== "talk" &&
      item.doc.type !== "person",
  );
  if (second) {
    const secondBrief = brief(second.doc, 220);
    if (secondBrief) {
      lines.push("");
      lines.push(`**${second.doc.title}** — ${secondBrief}`);
    }
  }

  return lines.join("\n");
}

/** The frame every records-only answer opens with. */
const FRAME = "**Here’s what GaitAI’s site says:**";

/**
 * The architecture answer from the platform record: the frame, the pipeline's
 * four steps each on its own line, the one-engine line and the human-review
 * line — all of them the record's own sentences.
 */
function composeArchitectureAnswer(doc: KnowledgeDoc): string {
  const sections = doc.content.split("\n");
  const section = (label: RegExp) => sections.find((line) => label.test(line))?.replace(/^[^:]+:\s*/, "") ?? "";
  const steps = section(/^The pipeline in four steps/)
    .split(/\s+·\s+/)
    .map((step) => step.trim())
    .filter((step) => /^\d+\./.test(step));
  const lines = [FRAME, "", "GaitAI works as a movement-intelligence pipeline:", ""];
  for (const step of steps) lines.push(step);
  const engine = section(/^One engine, two product families/).split(/\s+·\s+/)[0];
  if (engine) lines.push("", engine);
  const human = section(/^Where a human decides/);
  if (human) lines.push("", human);
  return lines.join("\n");
}

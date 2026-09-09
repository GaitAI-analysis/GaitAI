/**
 * QUERY UNDERSTANDING — from what a visitor typed to what they asked.
 * =============================================================================
 * People do not type polished questions into a chat panel. They type
 *
 *   "does it do military"        "military?"        "what about defence"
 *   "can it work in hospitals"   "CCTV?"            "what papers did she write"
 *
 * Retrieval is lexical: on those strings it matched "do" and "for" against
 * the whole corpus and answered with whatever mentioned GaitAI most often —
 * the Insights hub, the Talks page, the founder. This stage runs BEFORE intent
 * classification and retrieval and turns the typed text into a retrieval-
 * friendly question, deterministically:
 *
 *   1. REFERENCE RESOLUTION. "it", "this", "the platform", "you" refer to
 *      GaitAI unless the recent conversation names another canonical entity
 *      — a family, a module, a person. "she"/"he" refer to the last person
 *      named. The entity's NAME is substituted into the working text, so
 *      "does it use CCTV" after "what is SecureVision" becomes "does
 *      SecureVision use CCTV" and the ordinary entity boost does the rest.
 *
 *   2. CONTINUATION. "what about X", "and X?", "how about X" inherit the
 *      previous question's intent (and entity) and replace its topic.
 *
 *   3. ELLIPSIS. A question that is only a topic — "military?", "for
 *      elderly?", "papers?" — is classified from the topic word: a domain
 *      word is an application question, "papers" a publication question.
 *
 *   4. DOMAIN EXTRACTION. "does X do Y", "can X work in Y", "for Y", the
 *      "what can X do for Y" forms — Y is checked against the domain
 *      vocabulary and the environment records. Three kinds of domain
 *      question are told apart and passed on as `askType`:
 *        relationship    "does GaitAI work WITH the military" — an existing
 *                        deployment, customer or partnership
 *        product-exists  "does GaitAI HAVE a military product"
 *        potential       "what could GaitAI do for military", "does it do
 *                        military", "military?" — relevant capabilities
 *
 *   5. NORMALISATION. A readable internal question is composed from the
 *      pieces ("Which GaitAI capabilities are relevant to military or
 *      defence environments?"). It is for the debug log and the prompt's
 *      framing; the visitor's own words are never replaced on screen.
 *
 * WHAT HISTORY IS FOR, AND WHAT IT IS NOT FOR. The conversation decides what
 * "it" and "what about" REFER TO. It decides nothing about what is TRUE: the
 * assistant's earlier prose is never read as evidence, and every answer is
 * grounded in freshly retrieved canonical records. The Worker runs this same
 * function on the question and history it receives, so the framing it gives
 * the model is derived on its side of the trust boundary.
 *
 * NO MODEL CALL. Everything here is patterns, a small vocabulary and the
 * corpus's own entity aliases — inspectable, testable, the same in the
 * browser, in the Worker and in the harnesses.
 */

import { knowledge, type DocType, type KnowledgeDoc } from "./corpus";
import { matchDomains, type DomainConcept } from "./domains";
import { resolveEntities, type EntityMatch } from "./entities";
import {
  applicationSubject,
  classifyIntent,
  cleanSubject,
  INTENTS,
  personSubject,
  WHO_PATTERN,
  type Intent,
} from "./intent";
import { STOPWORDS, tokenize } from "./text";

export interface ChatTurnLike {
  role: "user" | "assistant";
  content: string;
}

export type EntityKind = "company" | "family" | "product" | "person" | "other";

export interface ResolvedEntity {
  kind: EntityKind;
  id: string;
  title: string;
  /** How it was resolved: named in the question, carried from history, or the default. */
  via: "explicit" | "history" | "default";
}

/** Which of the three domain questions was asked. */
export type AskType = "relationship" | "product-exists" | "potential";

export interface DomainContext {
  /** The domain as the visitor named it: "military", "railway station". */
  subject: string;
  concepts: DomainConcept[];
}

export interface Understanding {
  /** Exactly what the visitor typed. Shown; never rewritten. */
  original: string;
  /** The working text: pronouns replaced by the entity they refer to. What retrieval tokenises. */
  text: string;
  /** A readable internal question composed from the pieces. Debug and prompt framing only. */
  normalized: string;
  intent: Intent;
  confidence: "high" | "medium" | "low";
  entity: ResolvedEntity;
  domain: DomainContext | null;
  askType: AskType | null;
  /** The topic the question is about, once forms and fillers are stripped. */
  topic: string;
  elliptical: boolean;
  continuation: boolean;
  /** What came from the conversation rather than the question itself. */
  carried: ("entity" | "intent" | "domain")[];
  /** The pronoun that was resolved, when one was. */
  pronoun: string | null;
}

// ── Patterns ─────────────────────────────────────────────────────────────────

const THING_PRONOUN =
  /\b(it|its|this|that|the\s+(?:system|platform|product|tool|solution|module|company|software|technology)|this\s+(?:system|platform|product|tool|thing|technology)|you|your|yours|gaitai's)\b/i;
const PERSON_PRONOUN = /\b(she|he|her|him|his|hers|they|them|their)\b/i;

/** "what about X", "and X", "how about X", "also X", "ok and for X". */
const CONTINUATION =
  /^\s*(?:(?:and|also|ok(?:ay)?|so|then|plus)[,\s]+)*(?:what\s+about|how\s+about|and\s+what\s+about|what\s+of|and\s+for|and\s+in|and)\s+(.+?)\s*[?.!]*\s*$/i;

/** "does X do Y", "can X work in Y", "is X used in Y", "X for Y?" — Y is the domain candidate. */
const DOMAIN_FORMS: RegExp[] = [
  /^\s*(?:does|do|can|could|would|will|is|are)\s+\S+(?:\s+\S+)?\s+(?:do|handle|cover|support|offer|address|serve|target|work\s+(?:in|for|with|at|on)|be\s+used\s+(?:in|for|at|by|with|on)|be\s+(?:relevant|useful|applied|deployed|suitable|applicable|helpful)\s+(?:to|for|in|at|on)|apply\s+(?:to|in)|help\s+(?:in|with|at)?|operate\s+in|fit\s+(?:into|in)|have\s+(?:anything|something|a\s+(?:product|module|solution|offering)|products?|modules?|solutions?|offerings?|applications?)\s+(?:for|in)|have\s+(?:\w+\s+)?(?:applications?|uses?|relevance)\s+(?:for|in|to)|used\s+(?:in|by|for|at|on))\s+(.+?)\s*[?.!]*\s*$/i,
  /* "is GaitAI relevant to the armed forces", "are you useful for hospitals" */
  /^\s*(?:is|are|was|were)\s+\S+(?:\s+\S+)?\s+(?:relevant|useful|suitable|applicable|used|deployed|available|helpful|good|designed|meant|intended)\s+(?:to|for|in|at|with|by|on)\s+(.+?)\s*[?.!]*\s*$/i,
  /* "does GaitAI have a military product", "is there a defence product", "any military solutions?" */
  /\b(?:have|has|got|offer|offers|sell|sells|is\s+there|are\s+there|any|exist(?:s)?)\s+(?:a|an|any|some|dedicated|specific)?\s*(.+?)\s+(?:products?|modules?|solutions?|offerings?|packages?|editions?|versions?|deployments?)\s*[?.!]*\s*$/i,
  /^\s*(?:for|in|at|about|regarding|re)\s+(.+?)\s*[?.!]*\s*$/i,
  /^\s*(.+?)\s+(?:use|uses|usage|applications?|deployments?|sector|industry|environments?|settings?|contexts?)\s*[?.!]*\s*$/i,
];

const RELATIONSHIP_ASK =
  /\b(work(?:s|ing|ed)?\s+with|partner\w*|customers?|clients?|deployed\s+(?:at|in|with|by|for)|used\s+by|contracts?|sell\w*|sold|serv(?:e|es|ing)\s+the|relationship|deal\s+with|already\s+(?:in|used|deployed)|do\s+(?:you|they)\s+(?:have|work)\s+(?:any\s+)?(?:with|for)\s+the|currently\s+(?:in|used|deployed)|any\s+(?:deployments?|installations?|sites?)\s+(?:in|with|at))\b/i;
const PRODUCT_EXISTS_ASK =
  /\b(?:have|has|got|offer|offers|sell|sells|is\s+there|are\s+there|exist)\b[^?]*\b(?:products?|modules?|solutions?|offerings?|packages?|editions?|versions?)\b|\b(?:products?|modules?|solutions?)\s+(?:for|aimed\s+at|dedicated\s+to)\b|\b(?:dedicated|specific)\s+(?:\w+\s+)?(?:products?|modules?|solutions?)\b/i;

const QUESTION_VERBS = new Set([
  "is", "are", "was", "were", "do", "does", "did", "can", "could", "would", "will", "should", "may", "might",
  "have", "has", "what", "which", "who", "how", "where", "when", "why", "tell", "show", "explain", "describe",
  "compare", "list", "give", "find", "help", "need", "want", "use", "using", "work", "works", "detect", "measure",
]);

// ── Corpus-backed hooks (the seeded corpus is the only state) ────────────────

let vocabulary: Set<string> | null = null;
let vocabularyFor: KnowledgeDoc[] | null = null;

/** Every stemmed token in the corpus. Built once per corpus. */
function corpusVocabulary(): Set<string> {
  const docs = knowledge().docs;
  if (vocabulary && vocabularyFor === docs) return vocabulary;
  const set = new Set<string>();
  for (const doc of docs) {
    for (const term of tokenize(`${doc.title} ${doc.sectionTitle ?? ""} ${doc.keywords.join(" ")} ${doc.summary} ${doc.content}`)) {
      set.add(term);
    }
  }
  vocabulary = set;
  vocabularyFor = docs;
  return set;
}

/** The corpus has a record of `type` whose whole title appears in the text. */
function namesType(type: DocType, text: string): boolean {
  const lower = text.toLowerCase();
  return knowledge().docs.some(
    (doc) => doc.type === type && !doc.parentId && doc.title.length > 3 && lower.includes(doc.title.toLowerCase()),
  );
}

/**
 * An environment whose title the subject's words cover: every subject word is
 * in the title AND the subject accounts for at least half the title's words.
 * "hospital" ⊂ "Hospitals" (1/1); "clinical trials" ⊂ "Research & clinical
 * trials" (2/3). "research" alone does NOT cover it (1/3) — a bare word that
 * happens to sit in a long environment title is not that environment.
 */
export function coversEnvironmentTitle(subject: string, title: string): boolean {
  const terms = tokenize(subject);
  const titleTerms = tokenize(title);
  if (!terms.length || !titleTerms.length) return false;
  const titleSet = new Set(titleTerms);
  return terms.every((term) => titleSet.has(term)) && terms.length * 2 >= titleTerms.length;
}

function coversEnvironment(subject: string): boolean {
  return knowledge().docs.some(
    (doc) => doc.type === "use-case" && !doc.parentId && coversEnvironmentTitle(subject, doc.title),
  );
}

const entityKind = (match: EntityMatch): EntityKind => {
  if (match.doc.type === "person") return "person";
  if (match.doc.type === "product") return "product";
  if (match.entityId === "gaitai") return "company";
  if (match.entityId === "mobilitycare" || match.entityId === "securevision") return "family";
  return "other";
};

const toEntity = (match: EntityMatch, via: ResolvedEntity["via"]): ResolvedEntity => ({
  kind: entityKind(match),
  id: match.entityId,
  title: match.doc.title,
  via,
});

const GAITAI: ResolvedEntity = { kind: "company", id: "gaitai", title: "GaitAI", via: "default" };

/** The strongest non-company entity a text names, or the company, or null. */
function explicitEntity(text: string, options: { allowCompany: boolean } = { allowCompany: true }): EntityMatch | null {
  const matches = resolveEntities(text);
  const specific = matches.find((match) => match.entityId !== "gaitai");
  if (specific) return specific;
  return options.allowCompany ? matches.find((match) => match.entityId === "gaitai") ?? null : null;
}

/**
 * The entity the conversation is about, for pronoun resolution: the most
 * recent USER turn that names a family, module or person; failing that, the
 * most recent assistant turn that names one. User turns first because they
 * are what the visitor meant; assistant prose is a weaker signal and is only
 * ever used to find a NAME, never a fact.
 */
function historyEntity(history: ChatTurnLike[], wantPerson: boolean): ResolvedEntity | null {
  const turns = [...history].reverse();
  for (const role of ["user", "assistant"] as const) {
    for (const turn of turns) {
      if (turn.role !== role || !turn.content.trim()) continue;
      const matches = resolveEntities(turn.content).filter((match) => match.entityId !== "gaitai");
      const match = wantPerson
        ? matches.find((m) => m.doc.type === "person")
        : matches.find((m) => m.doc.type !== "person") ?? matches[0];
      if (match) return toEntity(match, "history");
    }
  }
  return null;
}

/** Is this text a bare topic rather than a question? */
function isElliptical(text: string): boolean {
  const all = text.toLowerCase().replace(/[?.!,]+/g, " ").split(/\s+/).filter(Boolean);
  const content = all.filter((word) => !STOPWORDS.has(word));
  if (all.length === 0) return true;
  if (all.some((word) => QUESTION_VERBS.has(word))) return false;
  return content.length <= 3 && all.length <= 5;
}

/** The domain a question names, if it names one the site can place. */
function readDomain(text: string, elliptical: boolean, topic: string): DomainContext | null {
  /* Each candidate both raw and cleaned: "restricted facilities" matches the
     vocabulary as written, and would not once "facilities" is trimmed off. */
  const candidates: string[] = [];
  const push = (raw: string) => {
    const trimmed = raw.replace(/[?.!,;:]+$/g, "").trim();
    if (trimmed) candidates.push(trimmed);
    const cleaned = cleanSubject(raw);
    if (cleaned && cleaned !== trimmed) candidates.push(cleaned);
  };
  const explicit = applicationSubject(text);
  if (explicit) push(explicit);
  for (const form of DOMAIN_FORMS) {
    const match = form.exec(text);
    if (match) push(match[1]);
  }
  if (elliptical && topic) push(topic);

  for (const candidate of candidates) {
    if (!candidate || candidate.length < 3) continue;
    /* A pronoun or the brand is never a domain. */
    if (/^(?:it|this|that|you|gaitai|gait\s*ai|the\s+platform|me|us|them)$/i.test(candidate)) continue;
    const concepts = matchDomains(candidate);
    if (concepts.length || coversEnvironment(candidate) || namesType("use-case", candidate)) {
      const subject = cleanSubject(candidate) || candidate;
      /* Keep the wording that matched when trimming would lose the match. */
      return { subject: matchDomains(subject).length || coversEnvironment(subject) ? subject : candidate, concepts };
    }
  }
  return null;
}

function readAskType(text: string): AskType {
  if (RELATIONSHIP_ASK.test(text)) return "relationship";
  if (PRODUCT_EXISTS_ASK.test(text)) return "product-exists";
  return "potential";
}

function normalizedQuestion(u: Omit<Understanding, "normalized">): string {
  const who = u.entity.title;
  const domain = u.domain?.subject;
  const conceptNames = u.domain?.concepts.map((c) => c.id.replace(/-/g, " ")) ?? [];
  const domainPhrase = domain
    ? conceptNames.length && !conceptNames.some((name) => domain.toLowerCase().includes(name))
      ? `${domain} (${conceptNames.join(", ")}) environments`
      : `${domain} environments`
    : `${u.topic.replace(/^(?:for|in|at|to)\s+/i, "") || "this"} (a domain the GaitAI record does not know)`;
  switch (u.intent) {
    case "DOMAIN_APPLICATION":
      if (u.askType === "relationship") {
        return `Does the GaitAI record document an existing deployment, customer or partnership in ${domainPhrase}?`;
      }
      if (u.askType === "product-exists") {
        return `Does the GaitAI catalogue include a product specific to ${domainPhrase}?`;
      }
      return `Which ${who} capabilities are relevant to ${domainPhrase}?`;
    case "SECURITY":
      return `Does ${who} support security or surveillance-related movement capabilities${u.topic ? ` — ${u.topic}` : ""}?`;
    case "HEALTH_MOBILITY":
      return `Which ${who} clinical or mobility capabilities cover ${u.topic || "this"}?`;
    case "PERSON":
      return `Who is ${u.topic || "this person"} in the GaitAI record?`;
    case "PUBLICATION":
      return `Which publications in the GaitAI record cover ${u.topic || "this"}?`;
    case "RESEARCH":
      return `What does the GaitAI research record say about ${u.topic || "this"}?`;
    case "PRIVACY":
      return `How does ${who} handle privacy${u.topic ? ` — ${u.topic}` : ""}?`;
    case "DEPLOYMENT":
      return `How is ${who} deployed${u.topic ? ` — ${u.topic}` : ""}?`;
    case "CAPABILITY":
      return `Can ${who} ${u.topic || "do this"}, according to its capability records?`;
    case "ARCHITECTURE":
      return `How does ${who} work as a platform — the movement-intelligence pipeline from capture to human review?`;
    case "COMPARISON":
      return `How do ${u.topic || "these"} compare on their records?`;
    case "NAVIGATION":
      return `Where on the site is ${u.topic || "this"}?`;
    case "INSIGHTS":
      return `Which GaitAI Insights articles cover ${u.topic || "this"}?`;
    case "LAB_DATASET":
      return `What do GaitAI Labs and the Movement Intelligence Lab document about ${u.topic || "this"}?`;
    case "EVIDENCE":
      return `What evidence status does the GaitAI record give for ${u.topic || "this"}?`;
    case "PRODUCT":
      return `What is ${u.topic || who} and what does it take in and produce?`;
    case "UNSUPPORTED":
      return `Does the GaitAI public record establish anything about ${u.topic || "this"}?`;
    default:
      return u.text;
  }
}

/** The topic: the working text minus the question frame, fillers and the entity name. */
function readTopic(text: string, entity: ResolvedEntity, intent: Intent, domain: DomainContext | null): string {
  if (domain) return domain.subject;
  const person = personSubject(text);
  if (intent === "PERSON" && person) return person;
  let topic = text
    .replace(/[?.!]+$/g, "")
    .replace(/^\s*(?:(?:so|and|ok|okay|hey|hi|also|then)[,\s]+)*/i, "")
    .replace(
      /^(?:what\s+(?:is|are|does|do|can|could|about)|how\s+(?:does|do|can|could|would|about)|does|do|can|could|would|is|are|tell\s+me\s+about|show\s+me|which|where\s+(?:is|are|can)|who\s+(?:is|are))\s+/i,
      "",
    )
    .trim();
  const name = entity.title.toLowerCase();
  topic = topic
    .toLowerCase()
    .replace(new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:'s)?\\b`, "g"), "")
    .replace(/\b(?:gaitai|gait\s*ai)(?:'s)?\b/g, "")
    .replace(/^\s*(?:it|this|that|you|the\s+platform)\s+/i, "")
    .replace(/^\s*(?:do|does|have|has|support|offer|provide|use|work\s+(?:in|for|with)|be\s+used\s+(?:in|for))\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return topic;
}

// ── The stage ────────────────────────────────────────────────────────────────

/**
 * Understand one question in the context of the conversation so far.
 *
 * `history` is oldest first, user and assistant turns; only its NAMES are
 * read. `depth` guards the one level of recursion used to understand the
 * previous user turn for continuation and intent carry-over.
 */
export function understand(question: string, history: ChatTurnLike[] = [], depth = 0): Understanding {
  const original = question.trim();
  const carried: Understanding["carried"] = [];

  /* The previous user turn, understood on its own (one level only), for
     "what about X" and for the entity "it" refers to. */
  const priorUserIndex = (() => {
    for (let i = history.length - 1; i >= 0; i -= 1) if (history[i].role === "user" && history[i].content.trim()) return i;
    return -1;
  })();
  const prior =
    depth === 0 && priorUserIndex >= 0
      ? understand(history[priorUserIndex].content, history.slice(0, priorUserIndex), 1)
      : null;

  // ── 1 · continuation ────────────────────────────────────────────────────
  // The frame — "what about", "how about", "and" — is stripped whether or not
  // there is a previous turn: "what about defence?" asked cold is the
  // question "defence?". It COUNTS as a continuation (and inherits intent and
  // entity) only when a previous turn exists.
  const continuationMatch = CONTINUATION.exec(original);
  const continuation = continuationMatch !== null && prior !== null;
  let working = continuationMatch ? continuationMatch[1].trim() : original;

  // ── 2 · reference resolution ────────────────────────────────────────────
  let pronoun: string | null = null;
  let entity: ResolvedEntity = GAITAI;
  const explicitBefore = explicitEntity(working, { allowCompany: false });

  const personPronoun = PERSON_PRONOUN.exec(working);
  if (personPronoun && !explicitBefore) {
    const person = historyEntity(history, true);
    if (person) {
      pronoun = personPronoun[1];
      working = working.replace(PERSON_PRONOUN, (word) => (/^(?:her|his|hers|their)$/i.test(word) ? `${person.title}'s` : person.title));
      entity = person;
      carried.push("entity");
    }
  }

  const thingPronoun = THING_PRONOUN.exec(working);
  if (!pronoun && thingPronoun && !explicitBefore) {
    const referent = historyEntity(history, false) ?? (continuation && prior ? prior.entity : null);
    const target = referent && referent.kind !== "person" ? referent : GAITAI;
    pronoun = thingPronoun[1];
    /* "you"/"your" are always GaitAI; "it"/"this" follow the conversation. */
    const resolved = /^(?:you|your|yours)$/i.test(pronoun) ? GAITAI : target;
    working = working.replace(THING_PRONOUN, (word) => (/^(?:its|your|yours|gaitai's)$/i.test(word) ? `${resolved.title}'s` : resolved.title));
    entity = resolved.via === "default" ? GAITAI : { ...resolved, via: "history" };
    if (entity.via === "history") carried.push("entity");
  }

  const explicitAfter = explicitEntity(working, { allowCompany: true });
  if (explicitAfter && !pronoun) {
    entity = toEntity(explicitAfter, "explicit");
  } else if (explicitBefore) {
    entity = toEntity(explicitBefore, "explicit");
  }
  /* A continuation with no entity of its own keeps the previous one. */
  if (continuation && prior && entity.via === "default" && prior.entity.via !== "default") {
    entity = { ...prior.entity, via: "history" };
    carried.push("entity");
  }

  // ── 3 · ellipsis and topic ──────────────────────────────────────────────
  const elliptical = isElliptical(working);
  const bareTopic = elliptical
    ? working
        .replace(/[?.!]+$/g, "")
        .replace(/^\s*(?:for|about|on|in|at|and|the|a|an|any|does|do|can)\s+/i, "")
        .replace(/\s+(?:use|uses|usage|too|also|then|please)$/i, "")
        .trim()
    : "";

  // ── 4 · domain ──────────────────────────────────────────────────────────
  let domain = readDomain(working, elliptical, bareTopic);
  const askType: AskType | null = domain ? readAskType(working) : null;

  // ── 5 · intent ──────────────────────────────────────────────────────────
  const entities = resolveEntities(working);
  const terms = tokenize(working);
  const vocab = corpusVocabulary();
  const knownVocabulary = terms.length === 0 || terms.some((term) => vocab.has(term));
  const askedSubject = personSubject(working);
  const subjectUnknown = askedSubject !== null && tokenize(askedSubject).some((term) => !vocab.has(term));
  const namesProductName = entities.some((match) => match.doc.type === "product") || namesType("product", working);
  const productCount = new Set(entities.filter((match) => match.doc.type === "product").map((match) => match.entityId)).size;

  let intent = classifyIntent(working, {
    namesPerson: entities.some((match) => match.doc.type === "person"),
    namesProduct: namesProductName,
    productCount,
    namesEnvironment: namesType("use-case", working),
    namesCapability: namesType("capability", working) || namesType("signal", working),
    subjectUnknown,
    domainSubject: domain?.subject ?? null,
    elliptical,
    knownVocabulary,
  });

  /* A continuation inherits the previous intent when its own words decide
     nothing ("what about defence" after "what can GaitAI do for hospitals"
     keeps DOMAIN_APPLICATION; "and for elderly?" likewise). The previous
     domain is never inherited — the whole point of the continuation is a new
     topic. */
  if (continuation && prior) {
    if (intent === "GENERAL" || (elliptical && intent !== "DOMAIN_APPLICATION" && prior.intent === "DOMAIN_APPLICATION" && domain)) {
      intent = prior.intent;
      carried.push("intent");
    }
    if (intent === "DOMAIN_APPLICATION" && !domain && prior.domain && !bareTopic) {
      domain = prior.domain;
      carried.push("domain");
    }
  }
  /* An elliptical topic the corpus does not know at all is off-topic, not general. */
  if (elliptical && intent === "GENERAL" && !knownVocabulary && !domain) intent = "UNSUPPORTED";

  const topic = readTopic(working, entity, intent, domain) || bareTopic;

  const decided: boolean =
    domain !== null ||
    entity.via !== "default" ||
    INTENTS[intent].triggers.some((t) => t.test(working)) ||
    elliptical;
  const confidence: Understanding["confidence"] =
    intent === "GENERAL" ? "low" : decided ? "high" : "medium";

  const partial: Omit<Understanding, "normalized"> = {
    original,
    text: working,
    intent,
    confidence,
    entity,
    domain,
    askType,
    topic,
    elliptical,
    continuation,
    carried,
    pronoun,
  };
  return { ...partial, normalized: normalizedQuestion(partial) };
}

/** True when a user question is in the "who is X" shape. */
export const isWhoQuestion = (text: string) => WHO_PATTERN.test(text.trim());

/**
 * RETRIEVAL — which GaitAI records a question is actually about.
 * =============================================================================
 * A weighted term-frequency search with inverse-document-frequency weighting
 * over 113 records, plus three GaitAI-specific signals: the page the visitor is
 * standing on, the canonical environment→module table, and relation expansion.
 *
 * WHY NOT A VECTOR DATABASE
 * The corpus is 113 records of controlled technical vocabulary — module names,
 * capability names, environments, venues. Lexical matching over that is not a
 * compromise; it is the more predictable tool. It also cannot hallucinate a
 * neighbour, needs no embedding call on the request path, and costs nothing.
 * If the corpus grows an order of magnitude, add embeddings as a re-ranker over
 * these candidates rather than replacing them.
 *
 * THE ONE RULE
 * Everything this file returns is a real record with a real route. Nothing is
 * synthesised. If nothing scores, the caller is told so, and the assistant says
 * it has no documented answer rather than inventing one.
 *
 * PORTED FROM THE CLOUD FUNCTION, UNCHANGED WHERE IT COUNTS. The scoring — the
 * field weights, K1, B, the idf, the page bonus, whole-title coverage and
 * relation expansion — is the same code that passes the 25-question suite. The
 * only structural change is that the index is built on FIRST USE rather than
 * at module load, because in a browser the corpus arrives over the network and
 * a module-scope `knowledge.docs.map(...)` would run before it exists.
 */

import { docById, knowledge, type DocType, type KnowledgeDoc } from "./corpus";
import { resetEntityIndex, resolveEntities, type EntityMatch } from "./entities";
import { classifyIntent, personSubject, type Intent } from "./intent";

// ── Tokenisation ────────────────────────────────────────────────────────────

/**
 * Words carrying no retrieval signal. Deliberately short: a stopword list that
 * strips domain words ("care", "vision", "motion") would break the module
 * names, which are the single most important thing to match.
 */
const STOPWORDS = new Set([
  "a", "about", "an", "and", "any", "are", "as", "at", "be", "been", "but",
  "by", "can", "could", "did", "do", "does", "for", "from", "get", "give",
  "had", "has", "have", "how", "i", "if", "in", "into", "is", "it", "its",
  "just", "like", "may", "me", "might", "my", "need", "of", "on", "one", "only",
  "or", "our", "out", "over", "please", "should", "show", "so", "some", "tell",
  "that", "the", "their", "them", "then", "there", "these", "they", "this",
  "to", "up", "us", "use", "used", "using", "want", "was", "we", "were", "what",
  "when", "where", "which", "who", "why", "will", "with", "would", "you",
  "your",
]);

/**
 * Crude, deliberate stemming: fold a trailing plural so "clinics" matches
 * "clinic" and "publications" matches "publication". Anything more aggressive
 * (Porter, say) starts mangling "analysis", "gait" and "SecureVision".
 */
function stem(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith("ses")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }
  return word;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
    .map(stem);
}

// ── Index ───────────────────────────────────────────────────────────────────

interface IndexedDoc {
  doc: KnowledgeDoc;
  /** term → weighted frequency */
  terms: Map<string, number>;
  /** Total weighted term mass — BM25's document length. */
  length: number;
  titleLower: string;
  /** Stemmed title tokens, for the "question contains the whole title" test. */
  titleTerms: string[];
  haystack: string;
}

/** Field weights: a hit in a title means far more than a hit in body prose. */
const FIELD_WEIGHT = {
  title: 12,
  keywords: 5,
  summary: 3,
  category: 3,
  content: 1,
} as const;

function addTerms(target: Map<string, number>, text: string, weight: number) {
  for (const term of tokenize(text)) {
    target.set(term, (target.get(term) ?? 0) + weight);
  }
}

/**
 * BM25 parameters.
 *
 * The first version normalised by √length, which is far too aggressive for a
 * corpus this uneven: the home-page record is a few hundred words and a product
 * record is several thousand, so / ranked first for every question asked. `b`
 * at 0.6 is partial length normalisation — a short record still gets credit for
 * being about one thing, without out-ranking the module record that actually
 * answers the question.
 */
const K1 = 1.4;
const B = 0.6;

interface Index {
  docs: IndexedDoc[];
  averageLength: number;
  documentFrequency: Map<string, number>;
  total: number;
}

/**
 * Built once, on the first question, and reused for the rest of the session.
 *
 * 113 records is a few milliseconds of work, so there is nothing to gain from
 * precomputing it into the corpus file — and a great deal to lose: the index
 * holds Maps keyed by stemmed term, and serialising those would freeze the
 * tokeniser's behaviour into a generated artefact that no longer changes when
 * this file does.
 */
let cached: Index | null = null;

function index(): Index {
  if (cached) return cached;

  const docs: IndexedDoc[] = knowledge().docs.map((doc) => {
    const terms = new Map<string, number>();
    addTerms(terms, doc.title, FIELD_WEIGHT.title);
    addTerms(terms, doc.keywords.join(" "), FIELD_WEIGHT.keywords);
    addTerms(terms, doc.summary, FIELD_WEIGHT.summary);
    addTerms(terms, doc.category, FIELD_WEIGHT.category);
    addTerms(terms, doc.content, FIELD_WEIGHT.content);

    let mass = 0;
    for (const value of terms.values()) mass += value;

    return {
      doc,
      terms,
      length: Math.max(mass, 1),
      titleLower: doc.title.toLowerCase(),
      titleTerms: tokenize(doc.title),
      haystack: `${doc.title} ${doc.keywords.join(" ")} ${doc.summary}`.toLowerCase(),
    };
  });

  const documentFrequency = new Map<string, number>();
  for (const entry of docs) {
    for (const term of entry.terms.keys()) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }

  cached = {
    docs,
    averageLength:
      docs.reduce((sum, entry) => sum + entry.length, 0) / Math.max(docs.length, 1),
    documentFrequency,
    total: docs.length,
  };
  return cached;
}

/** Drop the index — used by the test harness between corpora. */
export function resetIndex() {
  cached = null;
  resetEntityIndex();
}

const idf = (term: string, ix: Index) =>
  Math.log(1 + ix.total / (1 + (ix.documentFrequency.get(term) ?? 0)));


// ── Page context ────────────────────────────────────────────────────────────

export interface PageContext {
  pathname: string;
  /** "product" | "use-case" | "publication" | "insight" | hub name | "" */
  pageType: string;
  slug: string;
  family: string;
}

/**
 * What page is the visitor standing on.
 *
 * Derived from the pathname against the corpus's own routes, so a route that
 * does not exist yields an empty context instead of a guess.
 */
export function readPageContext(rawPath: string | undefined): PageContext {
  const pathname = `/${String(rawPath ?? "/").replace(/^\/+|\/+$/g, "")}/`.replace(
    /^\/\/+/,
    "/",
  );
  const parts = pathname.split("/").filter(Boolean);
  const empty = { pathname, pageType: "", slug: "", family: "" };
  if (!parts.length) return { ...empty, pageType: "home" };

  const [first, second] = parts;

  if (first === "mobilitycare" || first === "securevision") {
    return second
      ? { pathname, pageType: "product", slug: second, family: first }
      : { pathname, pageType: "family", slug: first, family: first };
  }
  if (first === "use-cases") {
    return { pathname, pageType: second ? "use-case" : "use-cases", slug: second ?? "", family: "" };
  }
  if (first === "publications") {
    return { pathname, pageType: second ? "publication" : "publications", slug: second ?? "", family: "research" };
  }
  if (first === "insights") {
    return { pathname, pageType: second ? "insight" : "insights", slug: second ?? "", family: "journal" };
  }
  if (first === "research") {
    return { pathname, pageType: "research", slug: second ?? "", family: "research" };
  }
  if (first === "legal") {
    return { pathname, pageType: "legal", slug: second ?? "", family: "platform" };
  }
  return { pathname, pageType: first, slug: second ?? "", family: "platform" };
}

// ── Scoring ─────────────────────────────────────────────────────────────────

export interface RetrievedDoc {
  doc: KnowledgeDoc;
  score: number;
  /** Why it was retrieved — used for diagnostics, never shown to the reader. */
  reason: string;
}

export interface RetrievalResult {
  docs: RetrievedDoc[];
  /** The record for the page the visitor is on, if there is one. */
  pageDoc: KnowledgeDoc | null;
  /** True when nothing scored well enough to answer from. */
  lowConfidence: boolean;
  page: PageContext;
  /** What kind of thing the question asked for. See intent.ts. */
  intent: Intent;
  /** The named entity the question is about, when it names one we index. */
  entity: EntityMatch | null;
  /**
   * Set when the question asked about a person the corpus has no record for —
   * the subject of "who is X", so the answer can say which X it looked for
   * instead of returning whatever happened to be nearest.
   */
  entityMiss: string | null;
}

const MAX_DOCS = 7;

// ── Entity and intent weighting ─────────────────────────────────────────────

/**
 * An alias hit on the record that IS the entity. Larger than any lexical
 * score a single word can earn, because a name is decisive: a visitor who
 * types "anubha" is asking about that person, whatever else the word is near.
 */
const ENTITY_BOOST: Record<EntityMatch["strength"], number> = { 3: 14, 2: 12, 1: 8 };
/** A second entity the question also names, when another is the subject. */
const SECONDARY_ENTITY_BOOST = 4;
/** The company named in passing — most questions mention the brand. */
const BRAND_MENTION_BOOST = 0;
/** A record that points at the subject through `relatedEntityIds`. */
const RELATED_ENTITY_BOOST = 3;

/**
 * Per-intent tilt by record type. Positive numbers favour the types that
 * answer that kind of question; negative numbers are the mismatch penalties
 * the brief asks for — a PERSON question must not be answered by a policy.
 * Modest everywhere except PERSON, where the failure being fixed lived.
 */
const INTENT_TYPE_BOOST: Record<Intent, Partial<Record<DocType, number>>> = {
  PERSON: {
    person: 10,
    publication: 0.5,
    research: 0.5,
    policy: -6,
    deployment: -6,
    page: -3,
    product: -2,
    "use-case": -3,
    capability: -3,
    signal: -3,
    insight: -2,
  },
  PRODUCT: { product: 2, page: 0.5 },
  CAPABILITY: { capability: 2, signal: 2, product: 0.5 },
  RESEARCH: { research: 2, publication: 1.2, person: 0.5, page: -2 },
  PUBLICATION: { publication: 2, research: 1.2, person: 0.5, page: -2 },
  USE_CASE: { "use-case": 2, product: 1 },
  /* "how do you store my video" is about handling, not about a retail
     STORE — a light penalty on modules and environments keeps the policy
     and legal records ahead of a lexical coincidence. A module named in the
     question still wins through its entity boost. */
  PRIVACY: { policy: 2, deployment: 1.5, product: -1, "use-case": -1 },
  SECURITY: { policy: 2, deployment: 1.5, product: -1, "use-case": -1 },
  NAVIGATION: { page: 1.5 },
  GENERAL: {},
};

/** Legal and Trust routes are pages, but they answer privacy and security. */
const GOVERNANCE_PAGE = /^\/(legal|trust)\//;

/**
 * Where a person question's records should sit, by type. Applied only when a
 * person entity matched: the person first, then the research and papers that
 * point back at them, then the site context, then everything else.
 */
const PERSON_TYPE_RANK: Partial<Record<DocType, number>> = {
  person: 0,
  research: 1,
  publication: 2,
  page: 3,
};

/**
 * Confidence floor.
 *
 * Below this the assistant is told, in its context, that the corpus has no
 * documented answer — which is the behaviour a research-grade site needs.
 * Calibrated so a real question about a module or an environment clears it
 * comfortably and an off-topic question ("what's the weather") does not.
 */
const CONFIDENCE_FLOOR = 1.6;

/** Types a "which product should I use" question should surface first. */
const RECOMMENDATION_HINTS =
  /\b(recommend|suggest|which|what should|best for|right (product|module|solution|fit)|fit for|suitable|help me choose|i (run|manage|own|have|work))\b/i;

const RESEARCH_HINTS =
  /\b(paper|papers|publication|published|research|study|studies|patent|journal|doi|evidence|cite|citation|peer.?reviewed)\b/i;

const READING_HINTS = /\b(article|read|journal|essay|insight|blog|story)\b/i;

const NAVIGATION_HINTS =
  /\b(where|find|show me|link|page|take me|navigate|go to|located)\b/i;

/**
 * Rank the corpus against one question.
 *
 * @param query        The visitor's message.
 * @param followUp     Earlier user turns, used only to keep a pronoun-bearing
 *                     follow-up ("which one works with just video?") anchored
 *                     to what was being discussed. Weighted far below the
 *                     current question so it cannot hijack a topic change.
 */
export function retrieveGaitAIContext(
  query: string,
  pathname: string | undefined,
  followUp: string[] = [],
): RetrievalResult {
  const page = readPageContext(pathname);
  const queryLower = query.toLowerCase();

  const queryTerms = tokenize(query);
  /* Prior turns contribute at a quarter weight: enough to resolve "which one",
     not enough to keep answering the previous question. */
  const contextTerms = tokenize(followUp.join(" "));

  const weighted = new Map<string, number>();
  for (const term of queryTerms) weighted.set(term, (weighted.get(term) ?? 0) + 1);
  for (const term of contextTerms) {
    weighted.set(term, (weighted.get(term) ?? 0) + 0.25);
  }

  const queryTermSet = new Set(queryTerms);

  const wantsRecommendation = RECOMMENDATION_HINTS.test(query);
  const wantsResearch = RESEARCH_HINTS.test(query);
  const wantsReading = READING_HINTS.test(query);
  const wantsNavigation = NAVIGATION_HINTS.test(query);

  const ix = index();

  const pageDoc =
    ix.docs.find((entry) => entry.doc.url === page.pathname)?.doc ??
    (page.slug
      ? ix.docs.find((entry) => entry.doc.slug === page.slug)?.doc ?? null
      : null);

  // ── Entity resolution and intent ──────────────────────────────────────────
  // Who or what the question names, and what kind of answer it wants. Both
  // are decided before any record is scored, so they can shape the scoring
  // rather than patch its output.
  const entities = resolveEntities(query);
  const namesType = (type: DocType) =>
    ix.docs.some(
      (entry) =>
        entry.doc.type === type &&
        entry.titleLower.length > 3 &&
        queryLower.includes(entry.titleLower),
    );
  /* The subject of a "who is X" form, and whether the corpus has ever seen
     the words in it — the difference between a person we do not index and a
     person we do not have a record for. */
  const askedSubject = personSubject(query);
  const subjectUnknown =
    askedSubject !== null &&
    tokenize(askedSubject).some((term) => !ix.documentFrequency.has(term));
  const intent = classifyIntent(query, {
    namesPerson: entities.some((match) => match.doc.type === "person"),
    namesProduct:
      entities.some((match) => match.doc.type === "product") || namesType("product"),
    namesEnvironment: namesType("use-case"),
    namesCapability: namesType("capability") || namesType("signal"),
    subjectUnknown,
  });
  /* The subject: for a person question, the person named — even when the
     company is named too ("who founded gaitai"). Otherwise the strongest hit. */
  const entity =
    (intent === "PERSON"
      ? entities.find((match) => match.doc.type === "person")
      : null) ??
    entities[0] ??
    null;
  const typeBoost = INTENT_TYPE_BOOST[intent];
  /* Does the question name the entity and nothing else? "what is gaitai" →
     yes; "where can I try gaitai" → no ("try" is not part of any alias). */
  const queryIsOnlyEntity = (() => {
    if (!entity) return false;
    const aliasTerms = new Set(
      [entity.doc.title, ...(entity.doc.aliases ?? [])].flatMap((alias) => tokenize(alias)),
    );
    return queryTerms.length > 0 && queryTerms.every((term) => aliasTerms.has(term));
  })();

  const scored: RetrievedDoc[] = [];

  for (const entry of ix.docs) {
    let score = 0;
    const lengthPenalty =
      K1 * (1 - B + (B * entry.length) / ix.averageLength);

    for (const [term, queryWeight] of weighted) {
      const tf = entry.terms.get(term);
      if (!tf) continue;
      /* BM25's saturating term frequency: the twentieth mention of "gait" in a
         long product record adds nothing the first three did not. */
      score += queryWeight * idf(term, ix) * ((tf * (K1 + 1)) / (tf + lengthPenalty));
    }

    const reasons: string[] = score > 0 ? ["lexical"] : [];

    /* The home page's title is the brand. "Does GaitAI diagnose Parkinson's?"
       names it without being about it, and with the current-page bonus that
       title hit made the home record lead every brand-mentioning question
       asked from "/". The company earns its title and entity boosts only when
       the question is about the company. */
    const brandInPassing =
      entry.doc.type === "page" && entry.doc.entityId !== undefined && !queryIsOnlyEntity;

    // ── Entity-aware ranking ────────────────────────────────────────────────
    // The record that IS the named entity, and the records that point at it.
    // Applied before the `score <= 0` cut so an entity record is never lost to
    // a question that names it in a way the tokeniser stems differently.
    if (entity && entry.doc.entityId === entity.entityId) {
      /* On a PERSON question a non-person entity is context, not the subject:
         "who works on gaitai research" names the company, but the answer is
         the person the company record points at. */
      const isSubject = intent !== "PERSON" || entity.doc.type === "person";
      let boost = isSubject ? ENTITY_BOOST[entity.strength] : SECONDARY_ENTITY_BOOST;
      /* The BRAND is in most questions ("where can I try gaitai?") without
         being what they are about. The company record is the subject only
         when the question names nothing else — "what is gaitai". */
      if (brandInPassing) boost = Math.min(boost, BRAND_MENTION_BOOST);
      score += boost;
      if (boost > 0) reasons.push(`entity:${entity.alias}`);
    } else if (
      entry.doc.entityId &&
      entities.some((match) => match.entityId === entry.doc.entityId)
    ) {
      score += SECONDARY_ENTITY_BOOST;
      reasons.push("entity:secondary");
    }
    /* Pointing at the SUBJECT is evidence; pointing at the brand mentioned in
       passing is not — every record is about GaitAI in that sense. */
    if (
      entity &&
      (entity.doc.type !== "page" || intent === "PERSON") &&
      entry.doc.relatedEntityIds?.includes(entity.entityId)
    ) {
      score += RELATED_ENTITY_BOOST;
      reasons.push("entity:related");
    }

    if (score <= 0) continue;

    // ── Intent tilt ─────────────────────────────────────────────────────────
    // A PERSON question penalises policy and deployment records outright; a
    // PRIVACY question lifts them. Governance pages count as policy here.
    {
      const isGovernancePage = entry.doc.type === "page" && GOVERNANCE_PAGE.test(entry.doc.url);
      let tilt = typeBoost[entry.doc.type] ?? 0;
      if (isGovernancePage) {
        if (intent === "PRIVACY" || intent === "SECURITY") tilt = 1.5;
        else if (intent === "PERSON") tilt = typeBoost.policy ?? tilt;
      }
      /* A page that points at the person (Publications, Talks) is context
         for a person question, not a mismatch. */
      if (intent === "PERSON" && entity && entry.doc.relatedEntityIds?.includes(entity.entityId)) {
        tilt = Math.max(tilt, 0);
      }
      if (tilt !== 0) {
        score += tilt;
        reasons.push(`intent:${intent.toLowerCase()}${tilt < 0 ? ":penalty" : ""}`);
      }
    }

    // An exact module / paper / environment name in the question is decisive.
    // A ONE-WORD title is not: "research" and "privacy" are titles of hub and
    // policy pages and also ordinary words in a question about something else
    // ("research on privacy" is about the privacy research area, not the
    // Research page). Those get a smaller boost; multi-word titles keep it.
    if (
      !brandInPassing &&
      entry.titleLower.length > 3 &&
      queryLower.includes(entry.titleLower)
    ) {
      score += entry.titleTerms.length > 1 ? 6 : 3;
      reasons.push("title");
    } else if (
      !brandInPassing &&
      entry.titleTerms.length > 0 &&
      entry.titleTerms.every((term) => queryTermSet.has(term))
    ) {
      /* The whole title is present in the question, allowing for plurals and
         word order: "I run a physiotherapy clinic" names the "Physiotherapy
         clinics" environment as surely as quoting it would. Without this, an
         environment competes on body prose against every neighbouring
         environment and loses to whichever one happens to be wordier. */
      score += 5;
      reasons.push("title:covered");
    }
    if (entry.doc.slug.length > 4 && queryLower.includes(entry.doc.slug)) {
      /* Same reasoning as the title: a one-word slug that is also a common
         word ("research", "privacy", "publications") is weak evidence. */
      score += entry.doc.slug.includes("-") ? 4 : 2;
      reasons.push("slug");
    }

    // Intent priors, applied to whole record types rather than to guesses.
    if (wantsRecommendation && (entry.doc.type === "product" || entry.doc.type === "use-case")) {
      score += 1.2;
      reasons.push("intent:recommend");
    }
    if (wantsResearch && (entry.doc.type === "publication" || entry.doc.type === "research")) {
      score += 1.2;
      reasons.push("intent:research");
    }
    if (wantsReading && entry.doc.type === "insight") {
      score += 1.2;
      reasons.push("intent:reading");
    }
    /* Gated by the classifier: "show me research on privacy" trips the
       navigation regex on "show me" but is a research question, and the
       Research hub page was outranking the privacy research area on it. */
    if (wantsNavigation && intent === "NAVIGATION" && entry.doc.type === "page") {
      score += 1.5;
      reasons.push("intent:navigate");
    }

    // The page the visitor is standing on, and its neighbourhood.
    if (pageDoc) {
      if (entry.doc.id === pageDoc.id) {
        score += 3.5;
        reasons.push("page");
      } else if (
        pageDoc.relatedProducts.includes(entry.doc.slug) ||
        pageDoc.relatedResearch.includes(entry.doc.slug)
      ) {
        score += 1;
        reasons.push("page:related");
      } else if (entry.doc.family === pageDoc.family && entry.doc.family !== "platform") {
        score += 0.4;
        reasons.push("page:family");
      }
    }

    scored.push({ doc: entry.doc, score, reason: reasons.join("+") });
  }

  scored.sort((a, b) => b.score - a.score);

  const best = scored[0]?.score ?? 0;
  /*
   * Low confidence means "nothing in the corpus is about this". A vague
   * question asked ON a record's own page ("what can this do?") is not that
   * case — the page record answers it — so the presence of a page record
   * clears the flag.
   */
  const personEntity = entity?.doc.type === "person" ? entity : null;
  /*
   * A resolved entity clears the floor by definition: the question named a
   * record. Conversely a PERSON question that resolves to nobody, and whose
   * subject is a word the corpus has never seen, is a MISS — the visitor asked
   * about someone the site has no record for, and the right answer says so
   * rather than offering the nearest neighbour.
   */
  const entityMiss =
    intent === "PERSON" && !personEntity && (best < CONFIDENCE_FLOOR || subjectUnknown)
      ? askedSubject ?? query.trim()
      : null;
  const lowConfidence =
    entityMiss !== null || (best < CONFIDENCE_FLOOR && !pageDoc && !entity);

  // ── Relation expansion ────────────────────────────────────────────────────
  // An environment record names its modules; a research area names the modules
  // it grounds. Pulling those in is what lets "I run a physiotherapy clinic"
  // answer with WalkScan and RehabTrack rather than with the environment page
  // alone — and it reuses the canonical mapping instead of a second one.
  const picked = new Map<string, RetrievedDoc>();
  const take = (item: RetrievedDoc) => {
    const existing = picked.get(item.doc.id);
    if (!existing || existing.score < item.score) picked.set(item.doc.id, item);
  };

  for (const item of scored.slice(0, MAX_DOCS)) take(item);

  /*
   * Expansion is DELIBERATELY NARROW: only from records that are clearly what
   * the question is about (within a quarter of the best score), and at a light
   * discount. Expanding from everything in the top five, steeply discounted,
   * meant "I run a physiotherapy clinic" retrieved four neighbouring
   * environments and none of the three modules the physiotherapy record
   * actually names — the modules lost their slots to environments that merely
   * share the word "clinic". A near-miss environment must not bring its own
   * module list along.
   */
  const EXPANSION_FLOOR = best * 0.75;
  for (const item of scored.slice(0, 5)) {
    if (item.doc.type !== "use-case" && item.doc.type !== "research") continue;
    if (item.score < EXPANSION_FLOOR) continue;
    for (const productId of item.doc.relatedProducts) {
      const related = docById().get(`product:${productId}`);
      if (related) {
        take({ doc: related, score: item.score * 0.8, reason: "expanded" });
      }
    }
  }

  let ranked = [...picked.values()].sort((a, b) => b.score - a.score);

  /*
   * ── Person questions are assembled, not just sorted ──────────────────────
   * When the question is about a person we index, the answering layer wants
   * the person record first and then the records that point back at them —
   * research areas, then papers, then the site pages that carry the record —
   * rather than whichever seven records the lexical score happened to favour.
   * Everything shown still has to have scored; this only orders and fills.
   */
  if (personEntity) {
    const related = scored.filter(
      (item) =>
        item.doc.id !== personEntity.doc.id &&
        item.doc.relatedEntityIds?.includes(personEntity.entityId),
    );
    const person = scored.find((item) => item.doc.id === personEntity.doc.id) ?? {
      doc: personEntity.doc,
      score: ENTITY_BOOST[personEntity.strength],
      reason: `entity:${personEntity.alias}`,
    };
    const byPersonRank = (a: RetrievedDoc, b: RetrievedDoc) =>
      (PERSON_TYPE_RANK[a.doc.type] ?? 9) - (PERSON_TYPE_RANK[b.doc.type] ?? 9) ||
      b.score - a.score;
    const assembled = new Map<string, RetrievedDoc>();
    assembled.set(person.doc.id, person);
    for (const item of related.sort(byPersonRank)) {
      if (assembled.size >= MAX_DOCS) break;
      assembled.set(item.doc.id, item);
    }
    for (const item of ranked) {
      if (assembled.size >= MAX_DOCS) break;
      if (!assembled.has(item.doc.id)) assembled.set(item.doc.id, item);
    }
    ranked = [...assembled.values()];
  }

  /*
   * The page's own record always travels with the answer, so a question asked
   * on a module page is answered about that module even when phrased vaguely.
   *
   * It gets a RESERVED SLOT rather than a boosted score. Promoting it to the
   * top of the ranking made the home-page record lead every question asked from
   * "/" — it outranked WalkScan on "What is WalkScan?". Leaving it to compete on
   * score alone dropped it entirely: "which one works with just video?" asked on
   * /use-cases/hospitals/ filled all seven slots with modules and lost the very
   * environment the word "one" referred to. Reserving one slot is what both
   * cases actually need. Where the current page IS the answer, its own score
   * plus the +3.5 page bonus already puts it first on merit.
   */
  let docs = ranked.slice(0, MAX_DOCS);
  if (pageDoc && !docs.some((item) => item.doc.id === pageDoc.id)) {
    docs = [
      ...docs.slice(0, MAX_DOCS - 1),
      picked.get(pageDoc.id) ?? { doc: pageDoc, score: 0, reason: "page:reserved" },
    ];
  }

  return { docs, pageDoc, lowConfidence, page, intent, entity, entityMiss };
}

// ── Context assembly ────────────────────────────────────────────────────────

/** Per-record character budget. Seven records at this size is roughly 3k
 *  tokens of context — enough to answer well, small enough to stay cheap. */
const PER_DOC_CHARS = 1500;

const TYPE_LABEL: Record<string, string> = {
  product: "GaitAI product module",
  "use-case": "Deployment environment",
  publication: "Publication record",
  research: "Research area",
  insight: "Blog article",
  capability: "AI capability",
  signal: "Movement signal",
  deployment: "Deployment information",
  policy: "Policy and governance",
  page: "Site page",
  person: "Person record",
};

/**
 * Render the retrieved records as the reference block the model reads.
 *
 * Each record is fenced and labelled with its route so the model can cite a
 * real link, and the whole block is introduced as DATA. See prompt.ts for the
 * instruction that keeps it that way.
 */
export function buildContextBlock(result: Pick<RetrievalResult, "docs">): string {
  if (!result.docs.length) return "No GaitAI records matched this question.";

  return result.docs
    .map((item, index) => {
      const { doc } = item;
      const body =
        doc.content.length > PER_DOC_CHARS
          ? `${doc.content.slice(0, PER_DOC_CHARS)}…`
          : doc.content;
      return [
        `<record index="${index + 1}" type="${TYPE_LABEL[doc.type] ?? doc.type}">`,
        `Title: ${doc.title}`,
        `Link: ${doc.url}`,
        doc.family && doc.family !== "platform" ? `Family: ${doc.family}` : "",
        `Summary: ${doc.summary}`,
        body,
        `</record>`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

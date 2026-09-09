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
import { matchDomains, type DomainConcept, type Family } from "./domains";
import { resetEntityIndex, resolveEntities, type EntityMatch } from "./entities";
import { applicationSubject, classifyIntent, personSubject, type Intent } from "./intent";

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
  /* A chunk's section heading is what that chunk is ABOUT — nearly a title,
     kept just under it so the parent record (title only) still leads on a
     question that names only the page. */
  sectionTitle: 9,
  keywords: 5,
  summary: 3,
  category: 3,
  topics: 2,
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
    if (doc.sectionTitle) addTerms(terms, doc.sectionTitle, FIELD_WEIGHT.sectionTitle);
    addTerms(terms, doc.keywords.join(" "), FIELD_WEIGHT.keywords);
    addTerms(terms, doc.summary, FIELD_WEIGHT.summary);
    addTerms(terms, doc.category, FIELD_WEIGHT.category);
    if (doc.topics?.length) addTerms(terms, doc.topics.join(" "), FIELD_WEIGHT.topics);
    addTerms(terms, doc.content, FIELD_WEIGHT.content);

    let mass = 0;
    for (const value of terms.values()) mass += value;

    return {
      doc,
      terms,
      length: Math.max(mass, 1),
      titleLower: doc.title.toLowerCase(),
      titleTerms: tokenize(doc.title),
      haystack: `${doc.title} ${doc.sectionTitle ?? ""} ${doc.keywords.join(" ")} ${doc.summary}`.toLowerCase(),
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
   * Set for an APPLICATION question: the domain the visitor named, the
   * environment records the site documents for it (empty when it documents
   * none — "military"), and the family the domain plainly belongs to. The
   * answer layers use it to say whether the domain is a documented
   * deployment environment or only a set of potentially relevant capabilities.
   */
  application: ApplicationContext | null;
  /**
   * Set when the question asked about a person the corpus has no record for —
   * the subject of "who is X", so the answer can say which X it looked for
   * instead of returning whatever happened to be nearest.
   */
  entityMiss: string | null;
}

const MAX_DOCS = 7;

export interface ApplicationContext {
  /** The domain as the visitor named it: "military", "railway station". */
  subject: string;
  /** Domain concepts the vocabulary matched, table order. */
  concepts: DomainConcept[];
  /** `use-case:<id>` record ids the site documents for the domain. */
  documentedEnvironmentIds: string[];
  family: Family | null;
}

/**
 * Read an APPLICATION question's domain against the vocabulary and the
 * corpus's own environment records. A subject the vocabulary does not know
 * still resolves if its words are an environment's title ("hospitals" →
 * Hospitals), so the table never has to list what the site already names.
 */
function readApplication(query: string, ix: Index): ApplicationContext | null {
  const subject = applicationSubject(query);
  if (subject === null) return null;
  const concepts = matchDomains(subject);
  const environmentIds = new Set(concepts.flatMap((concept) => concept.environmentIds).map((id) => `use-case:${id}`));

  /* An environment whose title the subject covers — every subject word, as
     a stem, is in the title ("hospital" ⊂ "Hospitals"). */
  const subjectTerms = tokenize(subject);
  if (subjectTerms.length) {
    for (const entry of ix.docs) {
      if (entry.doc.type !== "use-case" || entry.doc.parentId) continue;
      const titleTerms = new Set(entry.titleTerms);
      if (subjectTerms.every((term) => titleTerms.has(term))) environmentIds.add(entry.doc.id);
    }
  }

  const families = new Set(concepts.map((concept) => concept.family).filter(Boolean));
  for (const id of environmentIds) {
    const family = docById().get(id)?.family;
    if (family === "mobilitycare" || family === "securevision") families.add(family);
  }
  return {
    subject,
    concepts,
    documentedEnvironmentIds: [...environmentIds],
    family: families.size === 1 ? ([...families][0] as Family) : null,
  };
}

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
    talk: 0.5,
    policy: -6,
    deployment: -6,
    page: -3,
    product: -2,
    "use-case": -3,
    capability: -3,
    signal: -3,
    insight: -2,
  },
  /* A talk record is the founder's academic speaking record. It answers
     person and research questions; it must not answer "does GaitAI diagnose
     Parkinson's" because a conference title shares the word. */
  PRODUCT: { product: 2, page: 0.5, talk: -3 },
  CAPABILITY: { capability: 2, signal: 2, product: 0.5, talk: -2 },
  RESEARCH: { research: 2, publication: 1.2, person: -1, talk: 0.5, page: -2 },
  /* "What publications does GaitAI have?" is answered by the publications
     and their hub page — not by the eight author records that each list
     them. A person named in the question still wins through the entity
     boost. */
  PUBLICATION: { publication: 2, research: 1.2, person: -2, page: -2 },
  USE_CASE: { "use-case": 2, product: 1, talk: -3 },
  /* "What can GaitAI do for X": environments first, then the modules, the
     deployment facts and the capabilities; policy where the domain is a
     security one. A person, a talk, an essay, a paper or a hub page is not
     what GaitAI can DO for anyone — they are demoted hard enough that only
     an explicit mention could lift them back. Family and Use Cases pages are
     lifted separately below; they consolidate a whole family's answer. */
  APPLICATION: {
    "use-case": 3,
    product: 2,
    deployment: 1.5,
    capability: 1,
    signal: 0.5,
    policy: 0.5,
    research: -1,
    publication: -4,
    insight: -4,
    person: -8,
    talk: -8,
    page: -2,
  },
  /* "how do you store my video" is about handling, not about a retail
     STORE — a penalty on modules and environments keeps the policy and legal
     records ahead of a lexical coincidence, and a light one on ordinary site
     pages keeps the Movement Lab (which lists a "Privacy Lens" experiment)
     from answering "what does GaitAI say about privacy". Governance pages
     are lifted separately below. A module named in the question still wins
     through its entity boost. */
  PRIVACY: { policy: 3, deployment: 1.5, product: -3, "use-case": -2, page: -1.5, talk: -3 },
  SECURITY: { policy: 3, deployment: 1.5, product: -3, "use-case": -2, page: -1.5, talk: -3 },
  NAVIGATION: { page: 1.5, talk: -2 },
  GENERAL: { talk: -2 },
};

/**
 * How many chunks of ONE parent record may reach the model. A long essay is
 * seven section records; without a cap, a question squarely about it fills
 * every slot with that essay and loses the module or policy that should sit
 * beside it. Two — the overview and the best section, or the two best
 * sections — is what an answer actually uses.
 */
const MAX_PER_PARENT = 2;

/**
 * APPLICATION questions: the environment record the domain vocabulary maps
 * the domain to ("railway station" → Airports, metro & rail) is as decisive
 * as a named entity; the family page that consolidates the answer
 * (SecureVision for a defence question) is lifted less. Expansion terms are
 * added to the query at the weights the vocabulary gives them.
 */
const DOMAIN_ENVIRONMENT_BOOST = 8;
const DOMAIN_ENVIRONMENT_CHUNK_BOOST = 3;
const DOMAIN_FAMILY_PAGE_BOOST = 3.5;
const USE_CASES_HUB_BOOST = 1.5;

/** "latest", "recent", "new" — a question that wants dated records newest first. */
const LATEST_HINTS = /\b(latest|recent|recently|newest|new|last|this (?:week|month|year)|just published)\b/i;
/** A recency tilt for dated editorial records on such a question. */
const LATEST_BOOST = 5;

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
  talk: 4,
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

const READING_HINTS = /\b(articles?|read|reading|journal|essays?|insights?|blog|stories|story|posts?|published|publish)\b/i;

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
  const wantsLatest = LATEST_HINTS.test(query);

  const ix = index();

  /* Dated parent article records, newest first → rank. Built only when the
     question asks for the latest; a handful of records, so it is cheap. */
  const recencyRank = new Map<string, number>();
  if (wantsLatest) {
    ix.docs
      .filter((entry) => entry.doc.type === "insight" && !entry.doc.parentId && entry.doc.date)
      .sort((a, b) => String(b.doc.date).localeCompare(String(a.doc.date)))
      .forEach((entry, rank) => recencyRank.set(entry.doc.id, rank));
  }

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

  // ── Application questions: expand the domain through the site's vocabulary
  // "military" is not a word the corpus uses; "restricted", "perimeter",
  // "tailgating" and "watchlist" are. The expansion terms join the query at
  // the vocabulary's reduced weights, so the modules that describe those
  // capabilities can score without the visitor's words being changed.
  const application = intent === "APPLICATION" ? readApplication(query, ix) : null;
  if (application) {
    for (const concept of application.concepts) {
      for (const { term, weight } of concept.terms) {
        for (const token of tokenize(term)) {
          weighted.set(token, Math.max(weighted.get(token) ?? 0, weight));
        }
      }
    }
  }
  const documentedEnvironments = new Set(application?.documentedEnvironmentIds ?? []);
  const familyPageUrl = application?.family ? `/${application.family}/` : null;

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

    // ── Domain-aware ranking ────────────────────────────────────────────────
    // The environment the site documents for the named domain, and the
    // family page that consolidates the answer. Applied before the cut, like
    // an entity: a documented environment IS the answer to "what can GaitAI
    // do for a railway station", whatever the lexical score says.
    if (application) {
      const familyKey = entry.doc.parentId ?? entry.doc.id;
      if (entry.doc.type === "use-case" && documentedEnvironments.has(familyKey)) {
        score += entry.doc.parentId ? DOMAIN_ENVIRONMENT_CHUNK_BOOST : DOMAIN_ENVIRONMENT_BOOST;
        reasons.push("domain:environment");
      } else if (entry.doc.type === "page" && familyPageUrl && entry.doc.url === familyPageUrl) {
        score += DOMAIN_FAMILY_PAGE_BOOST;
        reasons.push("domain:family");
      } else if (entry.doc.id === "page:/use-cases") {
        score += USE_CASES_HUB_BOOST;
        reasons.push("domain:hub");
      }
    }

    if (score <= 0) continue;

    // ── Intent tilt ─────────────────────────────────────────────────────────
    // A PERSON question penalises policy and deployment records outright; a
    // PRIVACY question lifts them. Governance pages count as policy here.
    {
      const isGovernancePage = entry.doc.type === "page" && GOVERNANCE_PAGE.test(entry.doc.url);
      let tilt = typeBoost[entry.doc.type] ?? 0;
      if (isGovernancePage) {
        if (intent === "PRIVACY" || intent === "SECURITY") tilt = 2.5;
        else if (intent === "PERSON") tilt = typeBoost.policy ?? tilt;
      }
      /* The pages that answer an application question — a family landing
         page, the Use Cases hub, Trust — are not "generic navigation" and
         keep a neutral tilt; every other page takes the penalty. */
      if (
        intent === "APPLICATION" &&
        entry.doc.type === "page" &&
        (entry.doc.url === familyPageUrl || entry.doc.id === "page:/use-cases" || entry.doc.id === "page:/trust")
      ) {
        tilt = 0;
      }
      /* A page that points at the person (Publications, Talks) is context
         for a person question, not a mismatch. */
      if (intent === "PERSON" && entity && entry.doc.relatedEntityIds?.includes(entity.entityId)) {
        tilt = Math.max(tilt, 0);
      }
      /* ANOTHER person is not the answer to "who is X". Every co-author
         record names the founder, and the founder's names each co-author's
         papers; the person tilt belongs to the record that IS the subject. */
      if (
        intent === "PERSON" &&
        entry.doc.type === "person" &&
        entity?.doc.type === "person" &&
        entry.doc.entityId !== entity.entityId
      ) {
        tilt = -4;
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
    } else if (!brandInPassing && entry.titleTerms.length >= 3) {
      /* HALF A LONG TITLE. An article is titled in a sentence — "From
         Walking Video to Movement Intelligence" — and a visitor asks with
         half of it: "how does GaitAI use walking video", "what is movement
         intelligence". Body prose alone cannot lift a 3 000-character essay
         over a module that mentions the same two words; a proportional
         title-coverage credit can, without touching one-word module titles. */
      const matched = entry.titleTerms.filter((term) => queryTermSet.has(term)).length;
      const coverage = matched / entry.titleTerms.length;
      if (matched >= 2 && coverage >= 0.5) {
        score += 4 * coverage;
        reasons.push("title:partial");
      }
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
    /* "What are the latest GaitAI Insights?" wants the articles, newest
       first — not the home page and whatever module shares a word. The
       PARENT article records (not their sections) are lifted, by recency
       rank, so the answer can list them in order. */
    if (wantsLatest && wantsReading && entry.doc.type === "insight" && !entry.doc.parentId) {
      const rank = recencyRank.get(entry.doc.id);
      if (rank !== undefined) {
        score += LATEST_BOOST + Math.max(0, 3 - rank);
        reasons.push("intent:latest");
      }
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
  /* An application question whose domain the vocabulary or an environment
     record knows has an honest answer even at a low lexical score — the
     capabilities, with the boundary stated. A domain nobody knows ("for
     astronauts") falls through to the floor like any other question. */
  const applicationKnown =
    application !== null &&
    (application.concepts.length > 0 || application.documentedEnvironmentIds.length > 0);
  /* An unknown domain on an application question: every environment record
     earns the intent tilt (+3) on the question's own words alone, so the
     floor for "something actually matched" sits above tilt plus a small
     lexical hit. Below it the honest answer is the generic refusal, not a
     list of environments that merely share "do" and "for". */
  const applicationUnknown =
    application !== null && !applicationKnown && best < CONFIDENCE_FLOOR + 6;
  const lowConfidence =
    entityMiss !== null ||
    applicationUnknown ||
    (best < CONFIDENCE_FLOOR && !pageDoc && !entity && !applicationKnown);

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
    /* A chunk names the same modules as its parent; expanding from both
       would count them twice. The parent carries the mapping. */
    if (item.doc.parentId) continue;
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
   * ── One parent, at most two records ──────────────────────────────────────
   * A chunk and its parent share a `parentId` family; keep the best two of
   * any family and let the next-best OTHER record take the freed slot. The
   * candidates come from the full scored list, so the slot is refilled
   * rather than left empty.
   */
  {
    const perFamily = new Map<string, number>();
    const family = (item: RetrievedDoc) => item.doc.parentId ?? item.doc.id;
    const kept: RetrievedDoc[] = [];
    const keptIds = new Set<string>();
    const scoredById = new Map(scored.map((item) => [item.doc.id, item]));
    /* A "which products / what should I use" question wants the modules
       themselves, one slot each, competing on their OWN records — not a
       module lifted by a section that mentions the input in passing
       ("compatible CCTV where appropriate"), and not a module and its
       deployment section twice over. Chunks are out of the running; their
       parents answer on merit. */
    const chunksAllowed = !wantsRecommendation && intent !== "APPLICATION";
    let candidates = [...ranked, ...scored.filter((item) => !picked.has(item.doc.id))];
    if (!chunksAllowed) {
      /* The module's sections still count as EVIDENCE about the module —
         a deployment section that says "CCTV" three times is why the module
         is a CCTV module — so each parent inherits half of its best
         section's score, and the parents are re-ranked on that. The section
         itself does not take a slot. */
      const bestChunk = new Map<string, number>();
      for (const item of scored) {
        if (!item.doc.parentId) continue;
        bestChunk.set(item.doc.parentId, Math.max(bestChunk.get(item.doc.parentId) ?? 0, item.score));
      }
      const parents = new Map<string, RetrievedDoc>();
      for (const item of candidates) {
        if (item.doc.parentId) {
          if (!parents.has(item.doc.parentId) && !scored.some((s) => s.doc.id === item.doc.parentId)) {
            const parentDoc = docById().get(item.doc.parentId);
            if (parentDoc) parents.set(parentDoc.id, { doc: parentDoc, score: 0, reason: "parent" });
          }
          continue;
        }
        parents.set(item.doc.id, item);
      }
      candidates = [...parents.values()]
        .map((item) => {
          const chunk = bestChunk.get(item.doc.id) ?? 0;
          return chunk > 0
            ? { ...item, score: item.score + chunk * 0.5, reason: `${item.reason}+sections` }
            : item;
        })
        .sort((a, b) => b.score - a.score);
    }
    for (const item of candidates) {
      if (kept.length >= MAX_DOCS) break;
      if (keptIds.has(item.doc.id)) continue;
      const key = family(item);
      const count = perFamily.get(key) ?? 0;
      if (count >= MAX_PER_PARENT) continue;

      if (item.doc.parentId) {
        const parentId = item.doc.parentId;
        /* A SECTION TRAVELS WITH ITS PARENT. The chunk says what one passage
           says; the parent says what the page IS — a module's identity and
           route, an article's title and standfirst. The model needs both to
           answer and to cite. The parent takes the slot first, at the chunk's
           score, so the pair sits together; a second chunk of the same
           family is then over the cap and yields to another record. */
        if (!keptIds.has(parentId)) {
          if (kept.length >= MAX_DOCS - 1) continue;
          const parentDoc = docById().get(parentId);
          if (!parentDoc) continue;
          const parent = scoredById.get(parentId);
          perFamily.set(key, count + 2);
          keptIds.add(parentId);
          keptIds.add(item.doc.id);
          kept.push({
            doc: parentDoc,
            score: Math.max(parent?.score ?? 0, item.score),
            reason: parent ? `${parent.reason}+parent` : "parent",
          });
          kept.push(item);
          continue;
        }
      }

      perFamily.set(key, count + 1);
      keptIds.add(item.doc.id);
      kept.push(item);
    }
    ranked = kept;
  }

  /*
   * ── Person questions are assembled, not just sorted ──────────────────────
   * When the question is about a person we index, the answering layer wants
   * the person record first and then the records that point back at them —
   * research areas, then papers, then the site pages that carry the record —
   * rather than whichever seven records the lexical score happened to favour.
   * Everything shown still has to have scored; this only orders and fills.
   */
  if (personEntity) {
    /* Records ABOUT the person: research, papers, pages, talks. Not other
       people — a co-author record points at the founder, and the founder's
       at each co-author, but "who is Anubha" is not answered by listing
       everyone she has written with. */
    const related = scored.filter(
      (item) =>
        item.doc.id !== personEntity.doc.id &&
        item.doc.type !== "person" &&
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
  /* The HOME record is the one page that is not "this": a visitor on "/"
     asking "which products work with CCTV" is not asking about the home
     page, and reserving a slot for it there cost the seventh CCTV module its
     place on every question asked from the front door. The home record
     still competes on score — "what is GaitAI" puts it first on merit. */
  const reserveSlot = pageDoc !== null && pageDoc.id !== "page:/";
  if (reserveSlot && pageDoc && !docs.some((item) => item.doc.id === pageDoc.id)) {
    docs = [
      ...docs.slice(0, MAX_DOCS - 1),
      picked.get(pageDoc.id) ?? { doc: pageDoc, score: 0, reason: "page:reserved" },
    ];
  }

  return { docs, pageDoc, lowConfidence, page, intent, entity, entityMiss, application };
}

// ── Context assembly ────────────────────────────────────────────────────────

/** Per-record character budget. Seven records at this size is roughly 3k
 *  tokens of context — enough to answer well, small enough to stay cheap. */
const PER_DOC_CHARS = 1500;
/**
 * The LEAD record — the one retrieval ranked first — answers the question, so
 * it gets more room: a person record's provenance and "not documented" lines,
 * a module's overview and outputs, all reach the model whole. Mirrored by
 * worker/scripts/build-corpus.mjs, which trims the Worker's copy to this.
 */
export const LEAD_DOC_CHARS = 2600;

const TYPE_LABEL: Record<string, string> = {
  product: "GaitAI product module",
  "use-case": "Deployment environment",
  publication: "Publication record",
  research: "Research area",
  insight: "GaitAI Insights article",
  capability: "AI capability",
  signal: "Movement signal",
  deployment: "Deployment information",
  policy: "Policy and governance",
  page: "Site page",
  person: "Person record",
  talk: "Talk or presentation record",
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
      const budget = index === 0 ? LEAD_DOC_CHARS : PER_DOC_CHARS;
      const body =
        doc.content.length > budget ? `${doc.content.slice(0, budget)}…` : doc.content;
      return [
        `<record index="${index + 1}" type="${TYPE_LABEL[doc.type] ?? doc.type}">`,
        `Title: ${doc.title}`,
        doc.sectionTitle ? `Section: ${doc.sectionTitle}` : "",
        `Link: ${doc.url}`,
        doc.family && doc.family !== "platform" ? `Family: ${doc.family}` : "",
        doc.date ? `Date: ${doc.date}` : "",
        `Summary: ${doc.summary}`,
        body,
        `</record>`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

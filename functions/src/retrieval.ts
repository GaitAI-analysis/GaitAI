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
 */

import { docById, knowledge, type KnowledgeDoc } from "./knowledge";

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

const indexed: IndexedDoc[] = knowledge.docs.map((doc) => {
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

/**
 * BM25 parameters.
 *
 * The first version normalised by √length, which is far too aggressive for a
 * corpus this uneven: the home-page record is a few hundred words and a product
 * record is several thousand, so /​ ranked first for every question asked. `b`
 * at 0.6 is partial length normalisation — a short record still gets credit for
 * being about one thing, without out-ranking the module record that actually
 * answers the question.
 */
const K1 = 1.4;
const B = 0.6;

const AVERAGE_LENGTH =
  indexed.reduce((sum, entry) => sum + entry.length, 0) / Math.max(indexed.length, 1);

/** term → number of documents containing it. */
const documentFrequency = (() => {
  const df = new Map<string, number>();
  for (const entry of indexed) {
    for (const term of entry.terms.keys()) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }
  return df;
})();

const TOTAL_DOCS = indexed.length;

const idf = (term: string) =>
  Math.log(1 + TOTAL_DOCS / (1 + (documentFrequency.get(term) ?? 0)));

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
}

const MAX_DOCS = 7;

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

  const pageDoc =
    knowledge.docs.find((doc) => doc.url === page.pathname) ??
    (page.slug
      ? knowledge.docs.find((doc) => doc.slug === page.slug) ?? null
      : null);

  const scored: RetrievedDoc[] = [];

  for (const entry of indexed) {
    let score = 0;
    const lengthPenalty =
      K1 * (1 - B + (B * entry.length) / AVERAGE_LENGTH);

    for (const [term, queryWeight] of weighted) {
      const tf = entry.terms.get(term);
      if (!tf) continue;
      /* BM25's saturating term frequency: the twentieth mention of "gait" in a
         long product record adds nothing the first three did not. */
      score += queryWeight * idf(term) * ((tf * (K1 + 1)) / (tf + lengthPenalty));
    }
    if (score <= 0) continue;

    const reasons: string[] = ["lexical"];

    // An exact module / paper / environment name in the question is decisive.
    if (entry.titleLower.length > 3 && queryLower.includes(entry.titleLower)) {
      score += 6;
      reasons.push("title");
    } else if (
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
      score += 4;
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
    if (wantsNavigation && entry.doc.type === "page") {
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
  const lowConfidence = best < CONFIDENCE_FLOOR && !pageDoc;

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
      const related = docById.get(`product:${productId}`);
      if (related) {
        take({ doc: related, score: item.score * 0.8, reason: "expanded" });
      }
    }
  }

  const ranked = [...picked.values()].sort((a, b) => b.score - a.score);

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

  return { docs, pageDoc, lowConfidence, page };
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
  insight: "Journal article",
  capability: "AI capability",
  signal: "Movement signal",
  deployment: "Deployment information",
  policy: "Policy and governance",
  page: "Site page",
};

/**
 * Render the retrieved records as the reference block the model reads.
 *
 * Each record is fenced and labelled with its route so the model can cite a
 * real link, and the whole block is introduced as DATA. See prompt.ts for the
 * instruction that keeps it that way.
 */
export function buildContextBlock(result: RetrievalResult): string {
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

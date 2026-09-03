/**
 * THE GAITAI KNOWLEDGE CORPUS, IN THE BROWSER.
 * =============================================================================
 * Same 113-record corpus, same generator, same guarantee that every field
 * traces back to a record a visitor can read on the site. What changed is only
 * where it is read: the backend loaded `knowledge.json` off disk with
 * `node:fs`, and there is no disk here.
 *
 * IT IS FETCHED, NOT BUNDLED. 323 KB of JSON inlined into a JavaScript chunk
 * is 323 KB that has to be parsed as source and re-downloaded on every deploy
 * whose bundle hash changes. As a static asset under `/ask/` it is one
 * cacheable file with its own lifetime, it stays out of the panel chunk, and
 * the browser serves it from cache on every subsequent visit.
 *
 * LOADING IS EXPLICIT. `loadCorpus()` is called once, when the assistant is
 * opened, and everything derived from the corpus is built lazily behind it.
 * The backend could afford a module-level `const knowledge = loadKnowledge()`
 * because a cold function start is allowed to read a file synchronously; a
 * module that does that in a browser blocks the panel on a network request it
 * has not asked for yet.
 */

export type DocType =
  | "product"
  | "use-case"
  | "publication"
  | "research"
  | "insight"
  | "capability"
  | "signal"
  | "deployment"
  | "policy"
  | "page";

export interface KnowledgeDoc {
  id: string;
  type: DocType;
  title: string;
  slug: string;
  url: string;
  family: string;
  category: string;
  summary: string;
  content: string;
  keywords: string[];
  relatedProducts: string[];
  relatedResearch: string[];
}

export interface EnvironmentMapping {
  id: string;
  industry: string;
  vertical: string;
  productIds: string[];
  url: string;
}

export interface Knowledge {
  generatedAt: string;
  counts: Record<string, number>;
  environmentMap: EnvironmentMapping[];
  /** Every route the assistant may link to. Anything else is stripped. */
  routes: string[];
  docs: KnowledgeDoc[];
}

/** Where `build:knowledge` writes the browser copy. */
export const CORPUS_URL = "/ask/knowledge.json";

let corpus: Knowledge | null = null;
let inFlight: Promise<Knowledge> | null = null;

/**
 * Fetch the corpus once per page load.
 *
 * Concurrent callers share one request — the panel asks for it on open and the
 * first question may arrive before that settles.
 */
export async function loadCorpus(basePath = ""): Promise<Knowledge> {
  if (corpus) return corpus;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const response = await fetch(`${basePath}${CORPUS_URL}`, {
      cache: "force-cache",
    });
    if (!response.ok) {
      throw new Error(`corpus ${response.status}`);
    }
    const loaded = (await response.json()) as Knowledge;
    if (!Array.isArray(loaded.docs) || loaded.docs.length === 0) {
      throw new Error("corpus is empty");
    }
    corpus = loaded;
    return loaded;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

/**
 * Hand the corpus in directly, instead of fetching it.
 *
 * For the Node harnesses (`ask:test`, `ask:bench`), which read the generated
 * file off disk and must exercise exactly the retrieval the browser runs — not
 * a second copy of it kept in step by hand.
 */
export function seedCorpus(loaded: Knowledge): void {
  corpus = loaded;
  byId = null;
  routes = null;
}

/** True once the corpus is in memory. Nothing below may be called before it. */
export const corpusReady = () => corpus !== null;

function required(): Knowledge {
  if (!corpus) {
    throw new Error("corpus not loaded — call loadCorpus() first");
  }
  return corpus;
}

export const knowledge = () => required();

/** id → record. Built on first use, then reused. */
let byId: Map<string, KnowledgeDoc> | null = null;
export function docById(): Map<string, KnowledgeDoc> {
  if (!byId) {
    byId = new Map(required().docs.map((doc) => [doc.id, doc]));
  }
  return byId;
}

/** Route allowlist as a set, for link validation. */
let routes: Set<string> | null = null;
export function allowedRoutes(): Set<string> {
  if (!routes) {
    routes = new Set(required().routes);
  }
  return routes;
}

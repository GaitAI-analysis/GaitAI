/**
 * The GaitAI knowledge corpus, as loaded by the backend.
 *
 * `knowledge.json` is GENERATED — never edit it. It is written by
 * `npm run build:knowledge` at the repository root, which reads the site's own
 * typed data modules (products, product details, use cases, publications,
 * research areas, journal articles, the capability graph, the trust record and
 * the legal pages) and flattens them. Every field here therefore traces back to
 * a record a visitor can read on the site.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

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

/**
 * Read once per instance, not per request.
 *
 * The file sits beside the compiled output rather than being `import`ed, so a
 * corpus rebuild does not require a TypeScript rebuild, and `lib/` stays free
 * of a 300 KB inlined constant.
 */
function loadKnowledge(): Knowledge {
  const candidates = [
    path.join(__dirname, "..", "..", "knowledge.json"), // lib/src → functions/
    path.join(__dirname, "..", "knowledge.json"),
    path.join(process.cwd(), "knowledge.json"),
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(readFileSync(candidate, "utf8")) as Knowledge;
    } catch {
      /* try the next location */
    }
  }
  throw new Error(
    "knowledge.json not found. Run `npm run build:knowledge` at the repository root.",
  );
}

export const knowledge: Knowledge = loadKnowledge();

export const docById = new Map(knowledge.docs.map((doc) => [doc.id, doc]));

/** Route allowlist as a set, for link validation. */
export const allowedRoutes = new Set(knowledge.routes);

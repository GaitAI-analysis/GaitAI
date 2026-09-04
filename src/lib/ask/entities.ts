/**
 * ENTITY RESOLUTION — is this question about a named thing we index?
 * =============================================================================
 * Before the lexical ranking runs, the question is checked against the
 * ALIASES of every record that carries an `entityId`: the founder's person
 * record ("anubha", "anubha parashar", "the founder"), the company ("gaitai",
 * "gait ai") and each module (its short and full names). A hit is decisive
 * for ranking — see retrieval.ts — and for a person it is what makes "who is
 * anubha" answer with the person rather than with the nine papers that list
 * her as an author.
 *
 * NORMALISATION, DELIBERATELY SMALL. Lowercase, punctuation folded to spaces,
 * honorifics dropped ("dr", "prof", "mr", "ms"), possessives stripped
 * ("anubha's" → "anubha"), and one edit of tolerance on a name token of six or
 * more letters so "anubah" still finds "anubha". Nothing here is a stemmer or
 * a synonym table: the founder-word variants ("founded", "co-founder") are
 * folded because the alias list says "founder", and that is the whole list.
 *
 * NOTHING HERE IS INVENTED. The aliases come out of `build-knowledge.mjs`,
 * which derives them from the same data modules the pages render. This file
 * only matches them.
 */

import { knowledge, type KnowledgeDoc } from "./corpus";

export interface EntityMatch {
  doc: KnowledgeDoc;
  entityId: string;
  /** The alias that matched, normalised. */
  alias: string;
  /**
   * How sure the match is.
   *   3 — the record's full title or a multi-word alias is in the question
   *   2 — a single-word alias unique to this entity ("anubha")
   *   1 — a fuzzy (one-edit) match on a long name token
   */
  strength: 1 | 2 | 3;
}

const HONORIFICS = new Set([
  "dr", "prof", "professor", "mr", "mrs", "ms", "miss", "sir", "madam",
]);

/**
 * Fold the words that mean "founder" onto the alias the person record carries.
 * "who founded gaitai" → "founder gaitai". Kept to this one family because it
 * is the one the site actually uses ("founder-led", "founder research record").
 */
const FOLDS: Record<string, string> = {
  founded: "founder",
  founders: "founder",
  cofounder: "founder",
  cofounders: "founder",
  founding: "founder",
};

export function normalizeEntityText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['’]s\b/g, "")
    .replace(/co-founder/g, "cofounder")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((word) => !HONORIFICS.has(word))
    .map((word) => FOLDS[word] ?? word);
}

interface IndexedEntity {
  doc: KnowledgeDoc;
  entityId: string;
  /** Each alias as a normalised token sequence. */
  aliases: string[][];
}

let cached: IndexedEntity[] | null = null;
/** Single-word aliases that belong to exactly one entity. */
let uniqueSingles: Map<string, IndexedEntity> = new Map();

function index(): IndexedEntity[] {
  if (cached) return cached;
  const entities: IndexedEntity[] = [];
  for (const doc of knowledge().docs) {
    if (!doc.entityId) continue;
    const seen = new Set<string>();
    const aliases: string[][] = [];
    for (const raw of [doc.title, ...(doc.aliases ?? [])]) {
      const tokens = normalizeEntityText(raw);
      if (!tokens.length) continue;
      const key = tokens.join(" ");
      if (seen.has(key)) continue;
      seen.add(key);
      aliases.push(tokens);
    }
    entities.push({ doc, entityId: doc.entityId, aliases });
  }

  const singles = new Map<string, IndexedEntity | null>();
  for (const entity of entities) {
    for (const alias of entity.aliases) {
      if (alias.length !== 1) continue;
      const word = alias[0];
      singles.set(word, singles.has(word) ? null : entity);
    }
  }
  uniqueSingles = new Map();
  for (const [word, entity] of singles) {
    if (entity) uniqueSingles.set(word, entity);
  }

  cached = entities;
  return entities;
}

/** Drop the entity index — the test harness calls this between corpora. */
export function resetEntityIndex() {
  cached = null;
  uniqueSingles = new Map();
}

/** True when `needle` occurs as a contiguous run inside `haystack`. */
function containsSequence(haystack: string[], needle: string[]): boolean {
  if (needle.length === 0 || needle.length > haystack.length) return false;
  outer: for (let start = 0; start + needle.length <= haystack.length; start += 1) {
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (haystack[start + offset] !== needle[offset]) continue outer;
    }
    return true;
  }
  return false;
}

/**
 * One substitution, insertion, deletion or adjacent transposition apart.
 * Enough to say "within one edit"; nothing more general is needed.
 */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    const diffs: number[] = [];
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) diffs.push(i);
      if (diffs.length > 2) return false;
    }
    if (diffs.length === 1) return true;
    const [i, j] = diffs;
    return j === i + 1 && a[i] === b[j] && a[j] === b[i];
  }
  const [longer, shorter] = a.length > b.length ? [a, b] : [b, a];
  let i = 0;
  let j = 0;
  let skipped = false;
  while (i < longer.length && j < shorter.length) {
    if (longer[i] === shorter[j]) {
      i += 1;
      j += 1;
      continue;
    }
    if (skipped) return false;
    skipped = true;
    i += 1;
  }
  return true;
}

/**
 * Every indexed entity the question names, strongest first.
 *
 * A multi-word alias must appear whole and in order. A single-word alias
 * counts only when it is unique to one entity — "founder" resolves, "gait"
 * would not even if some record listed it. Fuzzy matching is restricted to
 * PERSON records and to tokens of six or more letters, because a one-letter
 * slip in "FallRisk" is more likely a different word than a typo.
 */
export function resolveEntities(query: string): EntityMatch[] {
  const tokens = normalizeEntityText(query);
  if (!tokens.length) return [];

  const matches = new Map<string, EntityMatch>();
  const record = (match: EntityMatch) => {
    const existing = matches.get(match.entityId);
    if (!existing || existing.strength < match.strength) {
      matches.set(match.entityId, match);
    }
  };

  const entities = index();

  for (const entity of entities) {
    for (const alias of entity.aliases) {
      if (alias.length > 1) {
        if (containsSequence(tokens, alias)) {
          record({
            doc: entity.doc,
            entityId: entity.entityId,
            alias: alias.join(" "),
            strength: 3,
          });
        }
        continue;
      }
      const word = alias[0];
      if (uniqueSingles.get(word) === entity && tokens.includes(word)) {
        record({ doc: entity.doc, entityId: entity.entityId, alias: word, strength: 2 });
      }
    }
  }

  /* One edit of tolerance on person-name tokens, only where nothing exact
     matched that entity already. */
  for (const entity of entities) {
    if (entity.doc.type !== "person" || matches.has(entity.entityId)) continue;
    for (const alias of entity.aliases) {
      for (const aliasWord of alias) {
        if (aliasWord.length < 6 || uniqueSingles.get(aliasWord) !== entity) continue;
        const hit = tokens.find(
          (token) => token.length >= 6 && withinOneEdit(token, aliasWord),
        );
        if (hit) {
          record({ doc: entity.doc, entityId: entity.entityId, alias: aliasWord, strength: 1 });
        }
      }
    }
  }

  return [...matches.values()].sort((a, b) => b.strength - a.strength);
}

/** The entity a question is primarily about, or null. */
export function primaryEntity(query: string): EntityMatch | null {
  return resolveEntities(query)[0] ?? null;
}

/** Records that point at an entity through `relatedEntityIds`. */
export function relatedToEntity(entityId: string): KnowledgeDoc[] {
  return knowledge().docs.filter((doc) => doc.relatedEntityIds?.includes(entityId));
}

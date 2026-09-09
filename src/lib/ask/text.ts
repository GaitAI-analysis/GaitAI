/**
 * TOKENISATION — shared by retrieval and query understanding.
 * =============================================================================
 * One tokenizer, so a word stems the same way in the question, in the index,
 * in the domain vocabulary and in the understanding stage. It used to live in
 * retrieval.ts; understanding needs it too, and the two must not drift.
 */

/**
 * Words carrying no retrieval signal. Deliberately short: a stopword list that
 * strips domain words ("care", "vision", "motion") would break the module
 * names, which are the single most important thing to match.
 */
export const STOPWORDS = new Set([
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
export function stem(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith("ses")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }
  return word;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
    .map(stem);
}

/** Every word, stopwords included, lowercased — for pattern work. */
export function words(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9']+/).filter(Boolean);
}

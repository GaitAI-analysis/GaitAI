/**
 * REQUEST VALIDATION AND RESPONSE POST-PROCESSING
 * =============================================================================
 * Everything crossing the trust boundary in either direction is checked here:
 * what a browser may send in, and what a model may send out.
 */

import { allowedRoutes, knowledge, type KnowledgeDoc } from "./knowledge";

export const LIMITS = {
  /** One question. Long enough to describe an environment, short enough that
   *  the endpoint cannot be used as a general-purpose LLM proxy. */
  message: 800,
  /** Turns of history the browser may send back. Four exchanges is enough for
   *  "which one works with just video?" to resolve, and caps the token bill. */
  historyTurns: 8,
  historyChars: 1600,
  pathname: 256,
  pageTitle: 200,
} as const;

export interface AskRequest {
  message: string;
  pathname: string;
  pageTitle: string;
  history: { role: "user" | "assistant"; content: string }[];
}

export type ValidationResult =
  | { ok: true; value: AskRequest }
  | { ok: false; error: string };

const asString = (value: unknown, max: number): string =>
  typeof value === "string" ? value.slice(0, max).trim() : "";

export function validateRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Malformed request." };
  }
  const raw = body as Record<string, unknown>;

  const message = asString(raw.message, LIMITS.message);
  if (!message) return { ok: false, error: "A question is required." };
  if (message.length < 2) return { ok: false, error: "That question is too short." };

  /* Control characters are never legitimate here and are the cheap way to try
     to break out of the prompt's own framing. */
  const clean = message.replace(/[\u0000-\u001f\u007f-\u009f]/g, " ");

  const history: AskRequest["history"] = [];
  if (Array.isArray(raw.history)) {
    for (const item of raw.history.slice(-LIMITS.historyTurns)) {
      if (!item || typeof item !== "object") continue;
      const entry = item as Record<string, unknown>;
      const role = entry.role === "assistant" ? "assistant" : "user";
      const content = asString(entry.content, LIMITS.historyChars);
      if (content) history.push({ role, content });
    }
  }

  /* The API requires the first turn to be a user turn; a trimmed window can
     easily start on an assistant reply. */
  while (history.length && history[0].role === "assistant") history.shift();

  return {
    ok: true,
    value: {
      message: clean,
      pathname: asString(raw.pathname, LIMITS.pathname) || "/",
      pageTitle: asString(raw.pageTitle, LIMITS.pageTitle),
      history,
    },
  };
}

// ── Outbound ────────────────────────────────────────────────────────────────

/**
 * Strip every link the model produced that is not a real GaitAI route.
 *
 * The model is told to link only to supplied routes; this is what makes that
 * true. A markdown link whose target is not in the corpus's route allowlist is
 * replaced by its own label, so an invented or off-site destination degrades to
 * plain text rather than shipping a broken or hostile link to a reader.
 *
 * Runs on the buffered answer AFTER streaming, so the source list and the
 * stored history are clean; the client applies the same allowlist as it renders.
 */
export function sanitizeLinks(markdown: string): string {
  /* The target allows one level of nested parentheses, so `[x](a(b))` is
     consumed whole rather than ending at the inner ")" and leaving the
     remainder behind as stray punctuation once the href is rejected. */
  return markdown.replace(
    /\[([^\]\n]+)\]\(((?:[^\s()]|\([^\s()]*\))+)\)/g,
    (whole, label: string, href: string) => {
      if (isAllowedHref(href)) return whole;
      return label;
    },
  );
}

export function isAllowedHref(href: string): boolean {
  if (!href.startsWith("/")) return false;
  if (href.startsWith("//")) return false;

  const [pathPart] = href.split(/[?#]/);
  /* "/#contact" is a real destination — the contact form on the home page. */
  const normalized = pathPart === "" ? "/" : pathPart.endsWith("/") ? pathPart : `${pathPart}/`;
  return allowedRoutes.has(normalized) || allowedRoutes.has(pathPart);
}

/**
 * The Sources block under an answer.
 *
 * Chosen from the records that were actually retrieved, preferring the ones the
 * answer visibly used. When nothing matches, the single best-scoring record
 * stands in, so a grounded answer always carries at least one way to verify it.
 * Never more than three: a wall of links reads as a citation dump, not as a
 * next step.
 */
export function selectSources(
  answer: string,
  retrieved: { doc: KnowledgeDoc; score: number }[],
): { title: string; url: string; kind: string }[] {
  const lower = answer.toLowerCase();

  /*
   * A source is a record the answer actually pointed at. Two tests, in order
   * of precision:
   *
   *   1. The answer LINKS to the record's route. Unambiguous.
   *   2. The answer NAMES the record, on a word boundary.
   *
   * The word boundary matters: a plain substring test made "GaitAI" — the
   * title of the home-page record — a source under almost every answer, since
   * the brand name appears in most sentences the assistant writes. The
   * home-page record is excluded from the naming test for the same reason:
   * saying "GaitAI" is not citing a page.
   */
  const named = (title: string) => {
    if (title.length < 4) return false;
    const escaped = title.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(lower);
  };

  /* Matched as a markdown TARGET, not as a substring. `answer.includes(doc.url)`
     made the home record — whose url is "/" — a source under every answer that
     contained a slash anywhere, which is all of them. */
  const linked = retrieved.filter(({ doc }) => answer.includes(`](${doc.url})`));
  const linkedIds = new Set(linked.map(({ doc }) => doc.id));
  const mentioned = retrieved.filter(
    ({ doc }) =>
      !linkedIds.has(doc.id) && doc.id !== "page:/" && named(doc.title),
  );

  const used = [...linked, ...mentioned];

  const chosen = (used.length ? used : retrieved.slice(0, 1))
    .filter(({ doc }) => isAllowedHref(doc.url))
    .slice(0, 3);

  return chosen.map(({ doc }) => ({
    title: doc.title,
    url: doc.url,
    kind: SOURCE_KIND[doc.type] ?? "Page",
  }));
}

/**
 * The qualifier beside a source link.
 *
 * A record's `category` is its own descriptive label — for a module that is a
 * full line like "Camera-based gait assessment report", which set in mono
 * uppercase beside the title is longer than the title and reads as noise. What
 * the row needs is the one word that says what KIND of thing the reader is
 * about to open.
 */
const SOURCE_KIND: Record<KnowledgeDoc["type"], string> = {
  product: "Module",
  "use-case": "Environment",
  publication: "Publication",
  research: "Research",
  insight: "Journal",
  capability: "Capability",
  signal: "Signal",
  deployment: "Deployment",
  policy: "Governance",
  page: "Page",
};

/**
 * "Ask next" — follow-ups built from the records in play, not from a second
 * model call.
 *
 * Deriving them means they can only ever ask about something the site actually
 * documents, they cost nothing, and they arrive with the answer instead of a
 * second latency step behind it.
 */
export function suggestFollowUps(
  retrieved: { doc: KnowledgeDoc }[],
  asked: string,
): string[] {
  const askedLower = asked.toLowerCase();
  const out: string[] = [];

  const push = (question: string) => {
    if (out.length >= 3) return;
    if (askedLower.includes(question.toLowerCase().slice(0, 18))) return;
    if (!out.includes(question)) out.push(question);
  };

  /*
   * ONE suggestion per record, so three follow-ups cover three different
   * things. Offering "How does WalkScan work?" and "What input data does
   * WalkScan need?" together spends two of the three slots on one module and
   * leaves the rest of the answer unexplored.
   */
  for (const { doc } of retrieved) {
    if (out.length >= 3) break;
    switch (doc.type) {
      case "product":
        push(`How does ${doc.title} work?`);
        break;
      case "use-case":
        push(`How does GaitAI deploy in ${doc.title.toLowerCase()}?`);
        break;
      case "publication":
        push(`Which GaitAI capability does this paper ground?`);
        break;
      case "research":
        push(`Which modules does ${doc.title} inform?`);
        break;
      case "insight":
        push(`What should I read after "${doc.title}"?`);
        break;
      case "policy":
        push(`What does GaitAI explicitly not claim?`);
        break;
      default:
        break;
    }
  }

  /* A floor of real, always-answerable questions so the row is never empty. */
  push("Which GaitAI solution fits my environment?");
  push("How does GaitAI work end to end?");

  return out.slice(0, 3);
}

/**
 * Whether to offer the demo CTA under this answer.
 *
 * Only after a genuinely commercial exchange — a module or an environment was
 * discussed — and never on the first turn, so the assistant answers a question
 * before it asks for anything. The caller additionally suppresses it if it was
 * already shown recently in this conversation.
 */
export function shouldOfferDemo(
  retrieved: { doc: KnowledgeDoc }[],
  turnIndex: number,
): boolean {
  if (turnIndex < 1) return false;
  const commercial = retrieved.filter(
    ({ doc }) => doc.type === "product" || doc.type === "use-case",
  ).length;
  return commercial >= 2;
}

/** The contact route, read from the corpus rather than written here. */
export const DEMO_HREF =
  knowledge.docs.find((doc) => doc.id === "page:/#contact")?.url ?? "/#contact";

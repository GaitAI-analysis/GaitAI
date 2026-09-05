/**
 * REQUEST VALIDATION — what a browser may send in.
 * =============================================================================
 * Everything crossing the trust boundary inbound is bounded here, before a
 * single Firestore read or model token is spent on it.
 */

export const LIMITS = {
  /** One question. Long enough to describe an environment, short enough that
   *  the endpoint cannot be used as a general-purpose LLM proxy. */
  question: 800,
  /** Turns of history the browser may send back: three exchanges. Enough for
   *  "which one works with just video?" to resolve; small enough to cap the
   *  token bill on every call. */
  historyTurns: 6,
  historyChars: 1600,
  pathname: 256,
  pageTitle: 200,
} as const;

export interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AskRequest {
  question: string;
  pathname: string;
  pageTitle: string;
  history: HistoryTurn[];
}

export type ValidationResult =
  | { ok: true; value: AskRequest }
  | { ok: false; error: string };

const asString = (value: unknown, max: number): string =>
  typeof value === "string" ? value.slice(0, max).trim() : "";

/* Control characters are never legitimate here and are the cheap way to try to
   break out of the prompt's own framing. */
const stripControl = (text: string) =>
  text.replace(/[\u0000-\u001f\u007f-\u009f]/g, " ");

export function validateRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Malformed request." };
  }
  const raw = body as Record<string, unknown>;

  const question = stripControl(asString(raw.question, LIMITS.question)).trim();
  if (!question) return { ok: false, error: "A question is required." };
  if (question.length < 2) return { ok: false, error: "That question is too short." };

  const history: HistoryTurn[] = [];
  if (Array.isArray(raw.history)) {
    for (const item of raw.history.slice(-LIMITS.historyTurns)) {
      if (!item || typeof item !== "object") continue;
      const entry = item as Record<string, unknown>;
      const role = entry.role === "assistant" ? "assistant" : "user";
      const content = stripControl(asString(entry.content, LIMITS.historyChars)).trim();
      if (content) history.push({ role, content });
    }
  }

  /* A route, or nothing. Anything that is not a site-relative path becomes
     "/": the pathname only steers page awareness, and a hostile value would
     otherwise be echoed into the prompt. */
  let pathname = asString(raw.pathname, LIMITS.pathname);
  if (!/^\/[A-Za-z0-9\-._~/#?=&%]*$/.test(pathname)) pathname = "/";

  return {
    ok: true,
    value: {
      question,
      pathname,
      pageTitle: stripControl(asString(raw.pageTitle, LIMITS.pageTitle)),
      history,
    },
  };
}

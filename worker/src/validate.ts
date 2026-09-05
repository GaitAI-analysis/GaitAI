/**
 * REQUEST VALIDATION — what a browser may send in.
 * =============================================================================
 * Everything crossing the trust boundary inbound is bounded here, before a
 * single Durable Object read or model token is spent on it.
 *
 * THE ONE THING THE BROWSER MAY NOT SEND IS EVIDENCE. It sends the IDS of the
 * records its retrieval chose; the Worker resolves those against its own copy
 * of the canonical corpus (grounding.ts) and discards any it does not know. A
 * `recordContent`, `records`, `context` or any other field carrying text that
 * would be read as GaitAI's record is ignored — unknown keys are dropped, not
 * interpreted. The same shape rule keeps Movement Lab material out by
 * construction: there is no field for a frame, a pose array, a video or a
 * file, and nothing that is not one of the five named string fields survives.
 */

export const LIMITS = {
  /** One question. Long enough to describe an environment, short enough that
   *  the endpoint cannot be used as a general-purpose LLM proxy. */
  question: 800,
  /** Turns of history: three exchanges. Enough for "which one works with just
   *  video?" to resolve; small enough to cap the token bill on every call. */
  historyTurns: 6,
  historyChars: 1600,
  pathname: 256,
  pageTitle: 200,
  /** Retrieval never chooses more than seven; the Worker never accepts more. */
  records: 7,
  recordId: 120,
  /** The whole JSON body. Generous against the fields above; tiny against a
   *  payload that is trying to be something else. */
  bodyBytes: 32 * 1024,
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
  selectedRecordIds: string[];
}

export type ValidationResult =
  | { ok: true; value: AskRequest }
  | { ok: false; error: string };

/* Control characters are never legitimate here and are the cheap way to try to
   break out of the prompt's own framing. */
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/g;
const clean = (value: unknown, max: number): string =>
  typeof value === "string" ? value.replace(CONTROL, " ").slice(0, max).trim() : "";

/** Record ids look like `product:walkscan` or `page:/movement-lab`. */
const RECORD_ID = /^[a-z-]+:[A-Za-z0-9/#._-]+$/;

export function validateRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Malformed request." };
  }
  const raw = body as Record<string, unknown>;

  if (typeof raw.question !== "string") {
    return { ok: false, error: "A question is required." };
  }
  if (raw.question.length > LIMITS.question) {
    return { ok: false, error: `The question is longer than ${LIMITS.question} characters.` };
  }
  const question = clean(raw.question, LIMITS.question);
  if (question.length < 2) return { ok: false, error: "That question is too short." };

  const history: HistoryTurn[] = [];
  if (raw.history !== undefined) {
    if (!Array.isArray(raw.history)) return { ok: false, error: "History must be a list." };
    if (raw.history.length > LIMITS.historyTurns) {
      return { ok: false, error: `History is longer than ${LIMITS.historyTurns} turns.` };
    }
    for (const item of raw.history) {
      if (!item || typeof item !== "object") return { ok: false, error: "Malformed history turn." };
      const entry = item as Record<string, unknown>;
      if (typeof entry.content !== "string") return { ok: false, error: "Malformed history turn." };
      if (entry.content.length > LIMITS.historyChars) {
        return { ok: false, error: `A history turn is longer than ${LIMITS.historyChars} characters.` };
      }
      const content = clean(entry.content, LIMITS.historyChars);
      if (!content) continue;
      history.push({ role: entry.role === "assistant" ? "assistant" : "user", content });
    }
  }

  if (!Array.isArray(raw.selectedRecordIds)) {
    return { ok: false, error: "selectedRecordIds must be a list." };
  }
  if (raw.selectedRecordIds.length > LIMITS.records) {
    return { ok: false, error: `More than ${LIMITS.records} records were selected.` };
  }
  const selectedRecordIds: string[] = [];
  for (const id of raw.selectedRecordIds) {
    if (typeof id !== "string" || id.length > LIMITS.recordId || !RECORD_ID.test(id)) continue;
    if (!selectedRecordIds.includes(id)) selectedRecordIds.push(id);
  }

  /* A route, or nothing. Anything that is not a site-relative path becomes
     "/": the pathname only steers page awareness, and a hostile value would
     otherwise be echoed into the prompt. */
  let pathname = clean(raw.pathname, LIMITS.pathname);
  if (!/^\/[A-Za-z0-9\-._~/#?=&%]*$/.test(pathname)) pathname = "/";

  return {
    ok: true,
    value: {
      question,
      pathname,
      pageTitle: clean(raw.pageTitle, LIMITS.pageTitle),
      history,
      selectedRecordIds,
    },
  };
}

/**
 * CLIENT CONFIGURATION
 * =============================================================================
 * One thing to configure, and it is not a secret.
 *
 * `ASK_ENDPOINT` is the URL of `askGaitai`, the Cloud Function that runs
 * retrieval server-side and calls a hosted model through Hugging Face Inference
 * Providers. The Hugging Face token lives in Secret Manager on the function's
 * side of that call; nothing in this bundle can reach a model directly.
 *
 * The URL is public by nature — a browser has to know where to POST — so it is
 * a build-time constant with an environment override, not a secret. Leave it
 * EMPTY to switch the hosted layer off deliberately: retrieval and the
 * extractive answer keep working in the tab, which is exactly what happens at
 * runtime if the function is unreachable.
 */

export const ASSISTANT_ENABLED = true;

/**
 * Cloud Functions (2nd gen) URL for `askGaitai` in the project's region. Set
 * NEXT_PUBLIC_ASK_GAITAI_ENDPOINT to point a build somewhere else (a local
 * emulator, a staging project), or to "" to run retrieval-only.
 */
const DEFAULT_ENDPOINT =
  "https://asia-south1-gaitai-intelligence.cloudfunctions.net/askGaitai";

export const ASK_ENDPOINT: string =
  process.env.NEXT_PUBLIC_ASK_GAITAI_ENDPOINT === undefined
    ? DEFAULT_ENDPOINT
    : process.env.NEXT_PUBLIC_ASK_GAITAI_ENDPOINT.trim();

/**
 * How long the tab waits for the function before answering from records.
 *
 * A 7B-class hosted model writes three short paragraphs in a few seconds; a
 * provider having a bad minute can take far longer. The extractive answer is
 * already computed by then, so waiting past this buys nothing a reader would
 * thank us for.
 */
export const HOSTED_TIMEOUT_MS = 28_000;

/**
 * The longest question accepted. Mirrors the server-side limit, which refuses
 * anything longer, so the composer never lets a visitor type something that
 * will be rejected.
 */
export const MAX_MESSAGE_LENGTH = 800;

/** Prior turns kept in the browser and sent back as conversation context. */
export const HISTORY_TURNS = 6;

export const ASSISTANT_NAME = "Ask GaitAI";

/** The status line under the name, inside the panel. */
export const ASSISTANT_TAGLINE = "Movement intelligence guide";

/**
 * What the assistant is for, in one sentence. Used where the assistant has to
 * introduce itself to someone who has not opened it yet — the search palette's
 * hand-off row, and the launcher's accessible name.
 */
export const ASSISTANT_BLURB =
  "Explore movement intelligence, products, research and applications.";

/**
 * Anything on the page may open the assistant by dispatching this, optionally
 * with a question to ask on arrival:
 *
 *   window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail: { question } }))
 *
 * It is the same shape the search palette already uses to open itself
 * (SEARCH_EVENT), so neither surface has to import the other's component or
 * lift state into a shared provider.
 */
export const ASK_EVENT = "gaitai:open-ask";

export interface AskEventDetail {
  question?: string;
}

/**
 * CLIENT CONFIGURATION
 * =============================================================================
 * One thing to configure, and it is not a secret.
 *
 * `ASK_ENDPOINT` is the PUBLIC URL of the Ask GaitAI Worker — a Cloudflare
 * Worker (see worker/) that validates the records the browser selected against
 * the canonical corpus, builds the grounding prompt, and calls a hosted model
 * through the Google Gemini Developer API. The Gemini API key is a secret
 * binding on the Worker's side of that call; nothing in this bundle can reach a
 * model directly, and nothing in this bundle knows the key exists.
 *
 * The URL is public by nature — a browser has to know where to POST — so it
 * comes from NEXT_PUBLIC_ASK_GAITAI_ENDPOINT at build time. When it is unset
 * or empty the hosted layer is OFF: the engine makes no network request, has
 * nothing to time out, logs nothing, and answers from the records it retrieved
 * — which is exactly what happens at runtime if the Worker is unreachable.
 *
 *   NEXT_PUBLIC_ASK_GAITAI_ENDPOINT=https://ask.gaitai.in/api/ask
 */

export const ASSISTANT_ENABLED = true;

export const ASK_ENDPOINT: string = (
  process.env.NEXT_PUBLIC_ASK_GAITAI_ENDPOINT ?? ""
).trim();

/**
 * How long the tab waits for the Worker before answering from records.
 *
 * The Worker itself gives the provider about 22 seconds; a few more here
 * cover the hop. The extractive answer is already computed by then, so waiting
 * past this buys nothing a reader would thank us for.
 */
export const HOSTED_TIMEOUT_MS = 26_000;

/**
 * The longest question accepted. Mirrors the Worker's limit, which refuses
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

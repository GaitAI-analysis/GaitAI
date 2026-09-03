/**
 * CLIENT CONFIGURATION
 * =============================================================================
 * There is nothing to configure any more, and that is the point.
 *
 * This file used to hold `ASK_ENDPOINT` and `ASSISTANT_ENABLED`: the assistant
 * needed a Cloud Function URL, the function needed an Anthropic key in Secret
 * Manager, and with either missing the whole feature silently rendered
 * nothing. Retrieval and generation both run in the visitor's own browser now
 * — see `lib/ask/engine.ts` — so there is no endpoint, no key, no billing
 * account and no environment variable standing between a clone of this
 * repository and a working assistant.
 *
 * `ASSISTANT_ENABLED` is kept, and is `true`. It exists so a build can still
 * switch the launcher off deliberately, which is a different thing from
 * switching off by accident because a variable was never set.
 */

export const ASSISTANT_ENABLED = true;

/**
 * The longest question accepted.
 *
 * It used to mirror a server-side limit that refused oversized requests. The
 * limit stays because the reason survives the server: a very long question
 * crowds out the retrieved records in a 1.5B model's context window, which
 * makes the answer worse, not longer.
 */
export const MAX_MESSAGE_LENGTH = 800;

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

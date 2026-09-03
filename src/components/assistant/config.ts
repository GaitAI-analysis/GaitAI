/**
 * CLIENT CONFIGURATION
 * =============================================================================
 * The ONLY thing the browser is told about the assistant's backend is where it
 * lives. An endpoint URL is not a secret; the model credential never leaves
 * Secret Manager and is read only inside the Cloud Function.
 *
 * If `NEXT_PUBLIC_ASK_GAITAI_ENDPOINT` is unset the assistant does not mount at
 * all. A launcher that opens onto a dead endpoint is worse than no launcher, and
 * a fresh clone with no backend configured should render the site unchanged.
 *
 * Set it in `.env.local` for development and as a GitHub Actions repository
 * variable for the deploy — see docs/ask-gaitai.md.
 */

export const ASK_ENDPOINT = (
  process.env.NEXT_PUBLIC_ASK_GAITAI_ENDPOINT ?? ""
).trim();

export const ASSISTANT_ENABLED = ASK_ENDPOINT.length > 0;

/** Mirrors LIMITS.message in functions/src/validate.ts. */
export const MAX_MESSAGE_LENGTH = 800;

export const ASSISTANT_NAME = "Ask GaitAI";
export const ASSISTANT_TAGLINE = "Your guide to movement intelligence.";

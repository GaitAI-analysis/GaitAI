/**
 * Canonical public contact routes.
 *
 * WHY THIS FILE EXISTS. Four legal pages and the footer each hard-coded their
 * own address, all of them on `gaitai.com` — a domain that appears nowhere
 * else in this repository. Everything that establishes the organisation's
 * domain says `gaitai.in`: `metadataBase` and every canonical URL, the
 * Organization JSON-LD, the Cloud Function CORS allowlist
 * (`functions/src/index.ts`), the Firebase authorised domains in
 * `COMMENTS_SETUP.md`, the security-headers note, and the assistant's own
 * system prompt. A mailbox on a domain the project does not otherwise use is
 * far more likely to be a template leftover than a working inbox, and a dead
 * privacy address is worse than no address — a reader with a data-subject
 * request gets silence.
 *
 * TODO (needs the company's confirmation, not a guess): verify that each
 * mailbox below is actually provisioned and monitored. If a purpose has no
 * mailbox, point that surface at `FORM` instead of inventing one — the demo
 * form is the one channel this repository can prove works, since
 * `src/components/sections/CTA.tsx` posts it to a configured Formspree
 * endpoint. Do not add an address here without checking it exists.
 */

const DOMAIN = "gaitai.in";

export const contact = {
  /** General enquiries. */
  general: `hello@${DOMAIN}`,
  /** Privacy questions and data-subject requests. */
  privacy: `privacy@${DOMAIN}`,
  /** Terms, IP and the agreement that would govern a pilot. */
  legal: `legal@${DOMAIN}`,
  /** Security disclosure and procurement review. */
  security: `security@${DOMAIN}`,
  /** Responsible-use and governance questions. */
  responsibleAi: `responsible-ai@${DOMAIN}`,
} as const;

/** The on-site form, which is always available as a fallback route. */
export const CONTACT_FORM_HREF = "/#contact";

export const mailto = (address: string) => `mailto:${address}`;

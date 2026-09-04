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
  /**
   * The public route the footer's mail icon opens, alongside the social
   * profiles.
   *
   * Deliberately not on the site domain: it is the founder mailbox the
   * company publishes next to its LinkedIn and X accounts, and it is the
   * one address here confirmed rather than inferred from the domain. The
   * purpose-specific boxes above stay as they are — a privacy request should
   * still reach `privacy@`, not a personal inbox.
   */
  social: "gait.ai.founder@gmail.com",
} as const;

/**
 * The public profiles, in the order they are presented everywhere.
 *
 * WHY THIS LIVES HERE. The footer held these four URLs inline and was the
 * only place in the repository that knew them, so the Organization JSON-LD in
 * `layout.tsx` asserted no `sameAs` at all — the profiles existed on the page
 * but not in the structured data, which is the half search engines read. One
 * exported list, two consumers.
 *
 * THE GITHUB URL WAS WRONG, and this is the note explaining why it changed.
 * The footer pointed at `github.com/gaitai`, which is a real account — a
 * stranger's, with no bio, no affiliation and one public repository called
 * "Movie". The company's actual organisation is `GaitAI-analysis`, which is
 * where this very repository is hosted (`git remote -v`) and which publicly
 * describes itself as "a research-led AI platform for gait biometrics...".
 * Every visitor who clicked the footer's GitHub glyph was sent to an
 * unrelated person's profile. Verified against both URLs on 2026-09-04 before
 * changing it.
 *
 * ORDER IS DELIBERATE and matches the footer's rationale: the company page
 * first, then the way to reach a person, then the feed, then the code.
 */
export const socialProfiles = {
  linkedin: "https://www.linkedin.com/company/gaitai-analysis/",
  x: "https://x.com/GaitAI4all",
  github: "https://github.com/GaitAI-analysis",
} as const;

/**
 * The same profiles as a flat list, for the `sameAs` array in structured
 * data. The mailbox is not included: `sameAs` takes URLs that identify the
 * organisation, and a `mailto:` is a contact route, not an identity.
 */
export const socialProfileUrls = Object.values(socialProfiles);

/** The on-site form, which is always available as a fallback route. */
export const CONTACT_FORM_HREF = "/#contact";

export const mailto = (address: string) => `mailto:${address}`;

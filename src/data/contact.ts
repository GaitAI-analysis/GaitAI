/**
 * Canonical public contact routes.
 *
 * WHY THIS FILE EXISTS. Four legal pages and the footer each hard-coded their
 * own address. This is the one place a public contact address is written, so
 * changing it is one edit rather than a search.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THERE IS ONE PUBLIC ADDRESS, AND IT IS THE ONE THAT WORKS.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * This file used to publish five role addresses on `gaitai.in` —
 * `privacy@`, `legal@`, `security@`, `responsible-ai@` and `hello@` — derived
 * from the site domain, with a standing TODO to confirm the mailboxes existed.
 * They did not. `gaitai.in` has no MX record, so every one of those addresses
 * silently discards mail; `npm run site:doctor` reports it and failed on it.
 *
 * A dead privacy address is worse than no address: a reader exercising a
 * data-subject right gets silence and has no way to know it. So the role
 * addresses are gone — not commented out, not kept behind a flag, not
 * constructed from DOMAIN. They are not written anywhere in this repository,
 * because a string that exists is a string that eventually renders.
 *
 * Every purpose below now resolves to PUBLIC_CONTACT_EMAIL, which is a
 * verified, monitored mailbox — the same account the comment-moderation rules
 * in `firestore.rules` and `src/lib/comments/config.ts` already trust as the
 * site's owner.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THE PURPOSE KEYS SURVIVE, POINTING AT ONE ADDRESS.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Collapsing the call sites to a single constant would have been fewer lines
 * and worse. Each surface still declares WHICH channel it means, so when
 * `gaitai.in` gets mail hosting, a real `privacy@` mailbox is a one-line
 * change here that moves only the privacy page — rather than a hunt through
 * four legal pages to work out which of them meant "legal" and which meant
 * "security". The keys are the migration plan.
 *
 * MIGRATING LATER — the order matters:
 *   1. Configure MX / mail hosting for gaitai.in and provision the mailbox.
 *   2. Send a test message to it and confirm a human receives it.
 *   3. Only then point that one key at it here.
 * Do not add an address to this file that has not had step 2 done. That is
 * the mistake this file is a correction of.
 */

/**
 * The verified working public mailbox. One address, one definition.
 *
 * Not on the site domain, deliberately: `gaitai.in` cannot receive mail, and
 * an address that looks more official while going nowhere is the worse of the
 * two options.
 */
export const PUBLIC_CONTACT_EMAIL = "gait.ai.founder@gmail.com";

export const contact = {
  /** General enquiries. */
  general: PUBLIC_CONTACT_EMAIL,
  /** Privacy questions and data-subject requests. */
  privacy: PUBLIC_CONTACT_EMAIL,
  /** Terms, IP and the agreement that would govern a pilot. */
  legal: PUBLIC_CONTACT_EMAIL,
  /** Security disclosure and procurement review. */
  security: PUBLIC_CONTACT_EMAIL,
  /** Responsible-use and governance questions. */
  responsibleAi: PUBLIC_CONTACT_EMAIL,
  /** The route the footer's mail icon opens, beside the social profiles. */
  social: PUBLIC_CONTACT_EMAIL,
} as const;

/**
 * The public profiles, in the order they are presented everywhere.
 *
 * WHY THIS LIVES HERE. The footer held these URLs inline and was the only
 * place in the repository that knew them, so the Organization JSON-LD in
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

/** The on-site form, which is always available as a second route. */
export const CONTACT_FORM_HREF = "/#contact";

export const mailto = (address: string) => `mailto:${address}`;

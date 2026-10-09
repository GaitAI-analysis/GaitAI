/**
 * Canonical public contact routes.
 *
 * WHY THIS FILE EXISTS. Four legal pages, the trust page, the contact section
 * and the footer all show an address. This is the one place a public address
 * is written, so changing it is one edit rather than a search.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THREE PUBLIC MAILBOXES ON THE COMPANY DOMAIN.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `gaitai.in` has mail hosting (MX mx1/mx2.hostinger.com, SPF
 * `include:_spf.mail.hostinger.com`, confirmed by DNS lookup on 2026-10-08),
 * and the company provisioned three role mailboxes for the public:
 *
 *   contact@gaitai.in   general enquiries, and every policy/legal purpose below
 *   demo@gaitai.in      demo, pilot and commercial conversations
 *   support@gaitai.in   technical and customer support
 *
 * Earlier this file published a personal Gmail inbox because the domain had no
 * MX record and every `@gaitai.in` address silently discarded mail. That is no
 * longer true; `npm run site:doctor` checks the MX record on every run and
 * will fail again if it disappears.
 *
 * NEVER PUBLISH A PERSON'S MAILBOX. Individual `@gaitai.in` accounts are
 * internal aliases. They do not appear in this file, the footer, metadata or
 * structured data. A role mailbox survives staff changes; a name does not.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THE PURPOSE KEYS SURVIVE, MOSTLY POINTING AT ONE ADDRESS.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Each surface declares WHICH channel it means. If a dedicated `privacy@` or
 * `security@` mailbox is ever provisioned, it is a one-line change here that
 * moves only that page. Before pointing a key at a new mailbox, send it a test
 * message and confirm a person receives it.
 */

/** General enquiries. The address Organization structured data publishes. */
export const PUBLIC_CONTACT_EMAIL = "contact@gaitai.in";
/** Demo, pilot and commercial conversations. */
export const DEMO_EMAIL = "demo@gaitai.in";
/** Technical and customer support. */
export const SUPPORT_EMAIL = "support@gaitai.in";

export const contact = {
  /** General enquiries. */
  general: PUBLIC_CONTACT_EMAIL,
  /** Demo requests, pilots and commercial terms. */
  demo: DEMO_EMAIL,
  /** Technical and customer support. */
  support: SUPPORT_EMAIL,
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
 * Subject lines prefilled when a visitor opens their mail app from the
 * footer or the contact section, so the inbox can be sorted at a glance.
 */
export const mailSubjects = {
  general: "GaitAI Enquiry",
  demo: "GaitAI Demo Request",
  support: "GaitAI Support Request",
} as const;

/**
 * The three direct routes in the order the footer and the contact section
 * present them: the general address first, the commercial ask second, help
 * last.
 */
export const directEmails = [
  { key: "general", label: "Contact", address: PUBLIC_CONTACT_EMAIL, subject: mailSubjects.general },
  { key: "demo", label: "Book a Demo", address: DEMO_EMAIL, subject: mailSubjects.demo },
  { key: "support", label: "Support", address: SUPPORT_EMAIL, subject: mailSubjects.support },
] as const;

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
  /* GaitAI Research Labs. Verified 2026-10-10: `@GaitAI-Labs` and the older
     handle `@GaitAI-b3f` both resolve to channel UCLCFIrMoMzaAWxPZKmhWmgQ
     ("Gait AI"), whose canonical handle is `@GaitAI-Labs` — so that is the
     URL published. */
  youtube: "https://www.youtube.com/@GaitAI-Labs",
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

/**
 * Meeting booking through Cal.com. One definition for the header button, the
 * footer link and the /book-demo page.
 *
 * Verified 2026-10-10 against cal.com: the profile `gait-ai-kbqznq` publishes
 * "15 min meeting" and "30 min meeting", both with open weekday slots from
 * 09:00 IST. The profile also has a hidden "Secret meeting" event; it is
 * deliberately not listed here and must not be linked publicly.
 */
export const BOOK_DEMO_HREF = "/book-demo";
export const CAL_ORIGIN = "https://app.cal.com";
export const CAL_EMBED_SCRIPT = `${CAL_ORIGIN}/embed/embed.js`;
export const CAL_USERNAME = "gait-ai-kbqznq";

/* Titles must match the event names in Cal.com (Event Types → title), which
   appear on Cal.com's confirmation, the calendar invitation and the emails. */
export const meetingTypes = [
  {
    id: "15min",
    calLink: `${CAL_USERNAME}/15min`,
    minutes: 15,
    title: "Quick Introduction",
    description: "For initial conversations, project inquiries, and research introductions.",
  },
  {
    id: "30min",
    calLink: `${CAL_USERNAME}/30min`,
    minutes: 30,
    title: "Product Demo & Technical Discussion",
    description: "Explore MobilityCare, SecureVision, Pose Analysis, technical capabilities, and potential collaborations.",
  },
] as const;

/** Cal.com's own pages for an existing booking: cancel, reschedule, view. */
export const calBookingUrl = (uid: string) => `https://cal.com/booking/${encodeURIComponent(uid)}`;
export const calRescheduleUrl = (uid: string) => `https://cal.com/reschedule/${encodeURIComponent(uid)}`;

export type MeetingType = (typeof meetingTypes)[number];
/** The public Cal.com page for a meeting type: the fallback when the embed cannot load. */
export const calPublicUrl = (m: MeetingType) => `https://cal.com/${m.calLink}`;

/** `mailto:` link, with an optional prefilled subject (percent-encoded). */
export const mailto = (address: string, subject?: string) =>
  subject ? `mailto:${address}?subject=${encodeURIComponent(subject)}` : `mailto:${address}`;

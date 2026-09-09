# Trust review — 9 September 2026

The public site was audited against the current repository before changes.
The existing design, routes, module catalogue, research joins and local pose
analysis remain the source of truth. No clinical result, benchmark number,
deployment outcome or regulatory status was invented.

## Comment contact data — historical remediation remains open

The former comment form asked for an optional email address and described it as
"never shown". `src/lib/comments/service.ts` placed that email and a sign-in UID
inside `comments/{id}`. `firestore.rules` allows public reads of each visible
comment document in full; omitting fields from the visible UI does not make them
private. This finding establishes a storage/read design issue, not whether anyone
accessed the information. No production records were inspected in this review.

New forms no longer request or attach those identifiers. The service writes
`email: null` and `userId: null` to remain compatible with deployed rules. Neither
field authorizes comment changes: moderation checks the administrator's verified
Firebase Authentication identity. Replies, public display names, moderation,
reporting and existing comment records remain supported.

The proposed `firestore.rules` change requires null for both fields on new
comments; it preserves reads and administrator update/delete rules for old
records. **This source change does not remove historical identifiers, change
deployed Firestore rules or prevent a caller using the old rules from supplying
them.** Production rules were not deployed and an emulator was not run here.

Owner follow-up, requiring an authenticated production review:

1. Inventory visible and hidden `comments` records for non-null `email`/`userId`
   using an admin session. Report counts only; do not export addresses into the
   repository, logs, screenshots or a public issue.
2. Assess the historical data and any notification obligations with the person
   responsible for privacy. Do not infer a breach or a legal deadline from the
   repository alone.
3. Prepare a reviewed migration that replaces only those two fields with null,
   preserving IDs, display names, messages, timestamps, replies and moderation
   state. Approve the exact target/project and recovery approach before applying.
4. Review the included public-create rule change requiring null fields; test new
   comment creation and admin moderation with the Firebase emulator, then deploy
   the reviewed rules. A new code deployment alone does not deploy Firebase rules.
5. Verify public reads and new writes against the production rules. If private
   reply contact is ever needed, implement a separate private collection and
   authenticated access, not a private-looking field in a public document.

The subscription design also allows looking up a record when an email address is
already known. The privacy policy now describes that limitation; hashing is not
presented as encryption or authentication.

## Behaviour checked

- Contact form: Formspree (`src/components/sections/CTA.tsx`).
- Public comments/reports: Firestore; Turnstile is optional and its current
  browser challenge is not a server-enforced verification boundary.
- Subscription and unsubscribe records: `src/lib/subscribe.ts`; no fixed
  automatic deletion job is configured for subscriptions, comments or contact.
- Article counters and assistant counters: aggregate Firestore records; no
  question text or media in those schemas.
- Ask GaitAI: optional Cloudflare Worker/Workers AI; named text fields only,
  six previous turns maximum, no media or credentials attached. Worker metadata
  logging omits request/response text. Rate limiting stores daily IP-derived
  hashes and timestamps; cleanup runs at six-hour intervals.
- Pose analyser: real MediaPipe inference in the browser. Own-origin model
  weights and jsDelivr runtime downloads; video and pose results are not uploaded.
- Site domains: gaitai.in. Public contact comes from `src/data/contact.ts`, using
  the existing configured mailbox. No invented role addresses were added.
- Evidence: public research/capability joins reused; all module implementation,
  benchmark, product/clinical validation and pilot gaps remain explicit. Review
  dates identify this inventory review, not publication or clinical study dates.

## Processor references checked

- [GitHub Pages data collection](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection)
- [Formspree privacy policy](https://formspree.io/legal/privacy-policy/)
- [Firebase privacy and security](https://firebase.google.com/support/privacy)
- [Cloudflare Workers AI data usage](https://developers.cloudflare.com/workers-ai/platform/data-usage/)

The updated pages describe observed website behaviour. Registered entity details,
applicable legal bases, contractual provider settings and jurisdiction-specific
obligations still require the organisation's own review. No general compliance
certification or guaranteed provider retention/deletion window is asserted.

## Local verification

The TypeScript check and targeted ESLint checks pass. The comment submission
client now matches both the current permissive null-compatible rules and the
proposed null-only create rule. Existing comment read permissions and moderator
authentication rules are unchanged; this is not a substitute for the emulator
and production verification described above.

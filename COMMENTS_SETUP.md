# GaitAI Insights — Moderated Comments: Setup Note

A secure, admin-moderated discussion system added **on top of** the existing
publications. Nothing existing was deleted, renamed, or migrated — this is
additive only (new files + new Firestore collections).

Pipeline: every visitor submission is written as **`pending`** and is invisible
to the public until the admin **approves** it from `/admin-comments.html`.

---

## 1. What was added

```
src/lib/firebase.ts                      Firebase client SDK (env-driven, public keys)
src/lib/comments/types.ts                Comment / report / thread types
src/lib/comments/config.ts               Admin allowlist, limits, blocklist, paths
src/lib/comments/service.ts              Public submit / read-approved / report + threading
src/lib/comments/subscription.ts         Subscriber gate (PLUGGABLE STUB — returns false)
src/lib/comments/format.ts               initials / relative-time helpers
src/components/comments/DiscussionSection.tsx   Orchestrator (mounted on post pages)
src/components/comments/CommentForm.tsx
src/components/comments/CommentItem.tsx          Nested replies (capped) + report
src/components/comments/LockedState.tsx          Subscriber-locked card
src/components/comments/Turnstile.tsx            Optional CAPTCHA (off by default)
src/components/comments/Toast.tsx
public/admin-comments.html               Standalone admin moderation page
firestore.rules                          Complete security rules (paste into console)
```

Integration point: `src/app/publications/[slug]/page.tsx` now renders
`<DiscussionSection postSlug={post.slug} contentType={post.category} … />` below
the article body. An optional `subscriberOnly?: boolean` field was added to the
`Post` type (absent on existing posts → behaviour unchanged).

---

## 2. Install & run

```bash
npm install            # firebase@^12 is now in package.json
npm run dev            # or: npm run build  (static export to ./out)
```

The production build emits the admin page verbatim to `out/admin-comments.html`,
so the live URL is **https://gaitai.in/admin-comments.html**.

---

## 3. Environment variables

All optional — `src/lib/firebase.ts` ships working defaults for the
`gaitai-33c7f` project. Set these (e.g. in `.env.local`, already gitignored) to
override per environment. See `.env.example` for the full list.

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBvQFrPJPgGkizJC-loZjeEIZemAKA-eYw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gaitai-33c7f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gaitai-33c7f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gaitai-33c7f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=52857173308
NEXT_PUBLIC_FIREBASE_APP_ID=1:52857173308:web:9ecefc164e3f6eea91da39

# Optional CAPTCHA — leave blank to keep it disabled
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

> The `apiKey` is a **public client identifier**, not a secret — it is safe to
> ship in the static bundle. No service-account key is used anywhere, and the
> Firebase Admin SDK is never imported in the frontend.

---

## 4. Firestore security rules (do this — it's the real enforcement)

1. Firebase Console → **Firestore Database → Rules**.
2. Paste the entire contents of **`firestore.rules`** and click **Publish**.

The rules enforce: public can only *create pending* and *read approved*; only
`anubhaparashar1025@gmail.com` (verified) can read pending, approve, reject,
delete, and manage reports; message length / required fields / `status:pending`
are validated server-side.

> This file is the complete ruleset for the project's Firestore. The live site
> doesn't otherwise use Firestore, so default-deny on everything else is safe.
> If you later add unrelated collections, merge their rules in.

---

## 5. Manual Firebase Console steps (must be done by hand)

1. **Cloud Firestore** — create the database in **Production mode** (NOT Realtime
   Database) if it doesn't exist yet. Region of your choice.
2. **Authentication → Sign-in method** — enable the **Google** provider.
3. **Authentication → Settings → Authorized domains** — ensure these are listed:
   `gaitai.in`, `www.gaitai.in`, `localhost`.
4. **Publish the rules** from step 4 above.
5. Sign in to `/admin-comments.html` with **anubhaparashar1025@gmail.com** to
   confirm moderation access. Any other account sees an "access denied" screen.

No collections need to be pre-created — they're created on first write.

---

## 6. How it works

- **Submit** → one atomic batch writes `pendingComments/{slug}/comments/{id}`
  *and* the flat mirror `pendingCommentQueue/{slug}__{id}`. Visitor sees:
  *"Thank you. Your comment has been submitted for approval."*
- **Moderate** → the admin page live-streams `pendingCommentQueue`. Approve copies
  the comment into `postComments/{slug}/comments/{id}` (the only public-readable
  collection) and stamps `approvedAt` / `approvedBy`; reject marks `rejected`;
  delete removes it everywhere including the public copy.
- **Public render** → post pages subscribe in real time to
  `postComments/{slug}/comments` (approved only) and thread replies up to a
  capped depth.
- **Replies** go through the same pending → approved pipeline.
- **Report** → readers flag an approved comment, writing to `reportedComments`
  for the admin's "Reported" tab.

---

## 7. Abuse protection — what's enforced where

| Protection | Where |
|---|---|
| Max comment / name length, required fields, `status:pending` | **Firestore rules** (authoritative) + client |
| Blocked-words list | Client (`config.ts → BLOCKED_WORDS`) |
| Duplicate prevention (same author + text) | Client (localStorage fingerprint + approved-query) |
| Rate-limit cooldown (30s/browser) | Client (localStorage) |
| CAPTCHA (Cloudflare Turnstile) | Pluggable — set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to enable |

> **Honest limitation:** true per-IP rate limiting and CAPTCHA *verification*
> require a server (Cloud Functions) or Firebase **App Check**, which can't run
> in a static export. The client cooldown + rules validation stop casual abuse;
> enable **App Check** in the console for stronger bot protection later. No IP /
> device fingerprinting is collected (privacy/compliance safe).

---

## 8. Subscriber-only posts

`subscriberOnly` is a pluggable stub today (`src/lib/comments/subscription.ts`):
it reports "not subscribed" for everyone, so a post marked `subscriberOnly: true`
shows the clean **locked card** instead of the comment box, and its comments are
not shown. To make a post subscriber-only, set `subscriberOnly: true` on the post
in your content source. When you have a real subscription model, implement
`resolveSubscription()` (and optionally the `isSubscriber()` placeholder already
in `firestore.rules`) — no UI changes needed.

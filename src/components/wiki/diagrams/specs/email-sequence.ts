import type { SequenceSpec } from "../types";

/** Verified against api/mailer.py, api/email_verification.py, api/password_reset.py, api/web_origin.py, supabase/functions/mail-relay/index.ts, supabase/functions/_shared/{policy,guard,smtp}.js, migrations/versions/0012_mail_relay_guard.py, web/gaitai.js, web/password.js, mobile/www-src/mobile.js. */
export const emailSequence: SequenceSpec = {
  kind: "sequence",
  id: "email-sequence",
  title: "Account email delivery: API → Edge Function relay → Hostinger SMTP",
  description: "The API answers the client before any mail is sent, then a background task posts an HMAC-signed request to the mail-relay Edge Function. The relay verifies the signature window and nonce, applies a content policy, reserves a slot in a PostgreSQL replay and rate guard, and submits the message to Hostinger over implicit TLS. The emailed link carries its token in the URL fragment and is completed by a second API call.",
  relationships: [
    "Sign-up, resend-verification and forgot-password requests pass the auth rate limit and origin allow-list, store a new token hash (older unused tokens are invalidated) and return immediately: 201 for registration, 202 with a generic message for the others.",
    "Password-reset requests never reveal whether an account exists, and the per-address limit of three per hour is enforced silently; verification resends return 429 after three per user per hour.",
    "A background task probes the configured public web origin (cached), builds the link with the token in the URL fragment and posts to the relay with X-Relay-Timestamp, X-Relay-Nonce and an HMAC-SHA256 X-Relay-Signature over the timestamp, nonce and body; the request times out after 40 seconds and is not retried.",
    "The Edge Function rejects bad or stale signatures (±300 s) with 401, a body over 32 KiB with 413, and policy violations (one recipient, allowed subjects only, allowed link origins, no scripts or forms) with 422.",
    "mail_relay_reserve, a SECURITY DEFINER function reached through PostgREST with the service role, refuses replayed nonces (401) and recipient, hourly and daily limits (429); if the guard itself fails the relay answers 503.",
    "The SMTP client connects with implicit TLS on port 465, authenticates with AUTH PLAIN and sends a multipart/alternative message; on failure the reserved slot is released and 502 is returned, on success 202.",
    "Any delivery failure ends inside the background task: the API logs a warning without the address and the user can request another message.",
    "On Android a verified App Link delivers the URL to the app's appUrlOpen handler; otherwise the browser opens it. The app reads and strips the fragment, then confirms the action with the API, which checks the token hash, single use and expiry (reset confirmation also signs out every session).",
  ],
  width: 1120,
  participants: [
    { id: "user", label: "User", kind: "actor" },
    { id: "app", label: "Client app", sublabel: "browser or Android" },
    { id: "api", label: "Care API", sublabel: "FastAPI · Render" },
    { id: "relay", label: "mail-relay", sublabel: "Supabase Edge Function" },
    { id: "guard", label: "Relay guard", sublabel: "PostgreSQL RPC", kind: "store" },
    { id: "smtp", label: "Hostinger SMTP", sublabel: "port 465 · TLS", kind: "external" },
    { id: "inbox", label: "Mailbox", kind: "external" },
  ],
  steps: [
    { type: "divider", label: "Request" },
    { type: "message", from: "user", to: "app", label: "Sign up · resend · forgot password" },
    { type: "message", from: "app", to: "api", label: "Request", detail: "POST · auth rate limit · origin allow-list", activate: true },
    { type: "self", at: "api", label: "Invalidate older tokens · store new token hash", detail: "verify: 24 h · reset: 30 min · audit row" },
    { type: "message", from: "api", to: "app", label: "201 or 202 · generic message", detail: "reset never reveals whether the account exists", style: "return", deactivate: true },
    { type: "note", over: ["app", "api"], text: ["Verification resends: 3 per user per hour → 429.", "Reset requests: 3 per address per hour, enforced silently with 202."] },
    { type: "divider", label: "Background delivery" },
    { type: "self", at: "api", label: "Probe the public web origin (cached) · build the link", detail: "token travels in the URL fragment" },
    { type: "message", from: "api", to: "relay", label: "POST /send", detail: "signed JSON ≤ 32 KiB · timestamp + nonce", activate: true },
    { type: "self", at: "relay", label: "Verify HMAC-SHA256 signature · ±300 s window · nonce format" },
    { type: "fragment", kind: "alt", label: "signature invalid or stale", steps: [
      { type: "message", from: "relay", to: "api", label: "401 unauthorized", style: "return" },
    ], alternatives: [
      { label: "policy violation: recipient, subject, link origins, markup", steps: [
        { type: "message", from: "relay", to: "api", label: "422 with the reason", style: "return" },
      ] },
      { label: "request accepted so far", steps: [
        { type: "message", from: "relay", to: "guard", label: "mail_relay_reserve(nonce, hash)", detail: "PostgREST RPC · service role", activate: true },
        { type: "fragment", kind: "alt", label: "nonce seen before", steps: [
          { type: "message", from: "guard", to: "relay", label: "replay", style: "return" },
          { type: "message", from: "relay", to: "api", label: "401", style: "return" },
        ], alternatives: [
          { label: "recipient 6/hour, 120/hour or 600/day exceeded", steps: [
            { type: "message", from: "guard", to: "relay", label: "limit", style: "return" },
            { type: "message", from: "relay", to: "api", label: "429 rate limited", style: "return" },
          ] },
          { label: "guard unavailable", steps: [
            { type: "message", from: "relay", to: "api", label: "503 relay unavailable", style: "return" },
          ] },
          { label: "slot reserved", steps: [
            { type: "message", from: "guard", to: "relay", label: "ok · send id", style: "return", deactivate: true },
            { type: "message", from: "relay", to: "smtp", label: "EHLO · AUTH PLAIN · MAIL FROM · RCPT TO · DATA", detail: "implicit TLS on port 465 · multipart/alternative", activate: true },
            { type: "fragment", kind: "alt", label: "250 accepted", steps: [
              { type: "message", from: "smtp", to: "relay", label: "250", style: "return", deactivate: true },
              { type: "message", from: "relay", to: "api", label: "202 accepted", style: "return", deactivate: true },
              { type: "message", from: "smtp", to: "inbox", label: "Deliver the message", style: "async" },
            ], alternatives: [{ label: "SMTP failure", steps: [
              { type: "message", from: "relay", to: "guard", label: "mail_relay_release(send id)" },
              { type: "message", from: "relay", to: "api", label: "502 delivery failed", style: "return" },
            ] }] },
          ] },
        ] },
      ] },
    ] },
    { type: "note", over: ["api", "relay"], text: ["Every failure ends in the background task: the API logs a warning", "without the address; the user can request another message."] },
    { type: "divider", label: "Link opened" },
    { type: "message", from: "inbox", to: "user", label: "Verification or reset email", style: "async" },
    { type: "message", from: "user", to: "app", label: "Tap or click the link", detail: "care.gaitai.in/#verify-email=… or #reset-password=…" },
    { type: "fragment", kind: "alt", label: "Android with a verified App Link", steps: [
      { type: "self", at: "app", label: "appUrlOpen → applyLink() sets the hash" },
    ], alternatives: [{ label: "browser, or an unverified association", steps: [
      { type: "self", at: "app", label: "gaitai.js / password.js read and strip the fragment" },
    ] }] },
    { type: "message", from: "app", to: "api", label: "Confirm verify · or reset", detail: "POST · token · no session needed", activate: true },
    { type: "self", at: "api", label: "Token hash lookup · single use · expiry" },
    { type: "message", from: "api", to: "app", label: "200 ok · or 400 invalid", detail: "reset confirmation also signs out every session", style: "return", deactivate: true },
  ],
  legend: [
    { style: "solid", label: "Synchronous call" },
    { style: "dashed", label: "Response" },
    { style: "dotted", label: "Asynchronous delivery" },
    { style: "accent", label: "Activation" },
  ],
};

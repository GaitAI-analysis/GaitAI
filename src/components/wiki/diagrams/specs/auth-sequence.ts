import type { SequenceSpec } from "../types";

/** Verified against api/main.py (register, login, logout), api/security.py (hashing, require_user, own_patient), api/email_verification.py, api/guardrails.py. */
export const authSequence: SequenceSpec = {
  kind: "sequence",
  id: "auth-sequence",
  title: "Registration, verification, sign-in and protected access",
  description: "Passwords are hashed with PBKDF2-SHA256 and sessions are opaque random tokens stored only as SHA-256 hashes. A new account receives a session immediately but cannot read records until the emailed verification token is confirmed; every protected request re-derives the user from the session row and checks profile ownership.",
  relationships: [
    "Registration validates consent, rejects duplicate emails, hashes the password with PBKDF2-SHA256 (random salt), stores a 24-hour verification token as a SHA-256 hash and returns a session token (or an httpOnly cookie for same-origin web clients) with status 201.",
    "The verification email is sent after the response, as a background task; the link carries the token in the URL fragment, which browsers never send to a server.",
    "Confirming verification needs no session: the API looks the token up by hash, rejects used or expired tokens with 400, and otherwise marks the token used and sets email_verified_at.",
    "Login compares PBKDF2 hashes in constant time and issues a fresh session row (36-byte token hashed, 14-day expiry); a mismatch returns 401 without saying which field was wrong.",
    "Protected requests pass through require_user: missing or malformed credentials and unknown or expired sessions return 401; an unverified account receives 403 except on a short allow-list (profile, logout, verification, deletion).",
    "Profile scope is enforced by own_patient: a profile the caller neither owns nor has caregiver access to returns 404, and writes by read-only caregivers return 403.",
    "Cookie-authenticated writes additionally need an X-Requested-With header; the hosted web app and Android both use bearer tokens.",
  ],
  width: 1000,
  participants: [
    { id: "user", label: "Account holder", kind: "actor" },
    { id: "client", label: "Client app", sublabel: "browser or Android" },
    { id: "api", label: "Care API", sublabel: "FastAPI on Render" },
    { id: "db", label: "PostgreSQL", sublabel: "users · sessions · tokens", kind: "store" },
    { id: "mail", label: "Mail relay", sublabel: "Edge Function → SMTP", kind: "external" },
  ],
  steps: [
    { type: "divider", label: "Registration" },
    { type: "message", from: "user", to: "client", label: "Email, password, privacy consent" },
    { type: "message", from: "client", to: "api", label: "Register", detail: "POST · JSON · client = web or mobile", activate: true },
    { type: "self", at: "api", label: "Guardrails: origin, auth rate limit, body size" },
    { type: "self", at: "api", label: "Consent required · duplicate email", detail: "422 or 409 on failure" },
    { type: "self", at: "api", label: "PBKDF2-SHA256, 390,000 iterations, random salt" },
    { type: "message", from: "api", to: "db", label: "Insert user and audit row" },
    { type: "message", from: "api", to: "db", label: "Insert verification token", detail: "SHA-256 of the token · 24 h expiry" },
    { type: "message", from: "api", to: "client", label: "201 · session token or httpOnly cookie", style: "return", deactivate: true },
    { type: "message", from: "api", to: "mail", label: "Send verification email", detail: "background task after the response", style: "async" },
    { type: "note", over: ["db", "mail"], text: ["The link carries the token in the URL fragment: /#verify-email=…", "Fragments never reach a server, so the token is read by the app."] },
    { type: "divider", label: "Email verification" },
    { type: "message", from: "mail", to: "user", label: "Email with a one-time link", style: "async" },
    { type: "message", from: "user", to: "client", label: "Open the link" },
    { type: "message", from: "client", to: "api", label: "Confirm verification", detail: "POST · token from the fragment · no session needed", activate: true },
    { type: "message", from: "api", to: "db", label: "Look up token by hash" },
    { type: "fragment", kind: "alt", label: "token exists, unused and not expired", steps: [
      { type: "message", from: "api", to: "db", label: "Set used_at · set users.email_verified_at" },
      { type: "message", from: "api", to: "client", label: "200 ok", style: "return" },
    ], alternatives: [{ label: "invalid, already used or expired", steps: [
      { type: "message", from: "api", to: "client", label: "400 invalid", style: "return", deactivate: true },
    ] }] },
    { type: "divider", label: "Sign-in" },
    { type: "message", from: "user", to: "client", label: "Email and password" },
    { type: "message", from: "client", to: "api", label: "Login", detail: "POST · auth bucket: 30 requests per minute per IP", activate: true },
    { type: "message", from: "api", to: "db", label: "Load user by email" },
    { type: "self", at: "api", label: "Compare PBKDF2 hashes in constant time" },
    { type: "fragment", kind: "alt", label: "credentials match", steps: [
      { type: "message", from: "api", to: "db", label: "Insert session row", detail: "SHA-256 of a 36-byte token · 14 days" },
      { type: "message", from: "api", to: "client", label: "200 · bearer token or cookie", style: "return" },
    ], alternatives: [{ label: "mismatch", steps: [
      { type: "message", from: "api", to: "client", label: "401 Incorrect email or password", style: "return", deactivate: true },
    ] }] },
    { type: "self", at: "client", label: "Keep the token", detail: "sessionStorage on the web · Keystore-encrypted store on Android" },
    { type: "divider", label: "Protected record access" },
    { type: "message", from: "client", to: "api", label: "Read a profile's documents", detail: "GET · Authorization: Bearer", activate: true },
    { type: "message", from: "api", to: "db", label: "Session by token hash → user" },
    { type: "fragment", kind: "alt", label: "no credentials, malformed header, unknown or expired session", steps: [
      { type: "message", from: "api", to: "client", label: "401", style: "return" },
    ], alternatives: [
      { label: "email unverified while verification is required", steps: [
        { type: "message", from: "api", to: "client", label: "403 unverified account", detail: "allowed: profile, logout, verification, deletion", style: "return" },
      ] },
      { label: "profile not owned by or shared with the caller", steps: [
        { type: "message", from: "api", to: "client", label: "404", style: "return" },
      ] },
      { label: "authorized", steps: [
        { type: "message", from: "api", to: "db", label: "Query rows scoped to patient_id" },
        { type: "message", from: "api", to: "client", label: "200 · JSON", detail: "hashes, ciphertext and object names stripped", style: "return", deactivate: true },
      ] },
    ] },
    { type: "note", over: ["client", "api"], text: ["Cookie mode adds an X-Requested-With check on writes.", "Read-only caregivers receive 403 on write requests."] },
  ],
  legend: [
    { style: "solid", label: "Synchronous call" },
    { style: "dashed", label: "Response" },
    { style: "dotted", label: "Asynchronous or out-of-band" },
    { style: "accent", label: "Activation on the API" },
  ],
};

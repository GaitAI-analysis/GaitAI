/* CLIENT-SAFE configuration for the moderated comment system.
 *
 * IMPORTANT: every limit defined here that protects data integrity (length,
 * required fields, allowed status) is ALSO enforced in firestore.rules. The
 * client copy is a UX convenience; the rules are the real boundary. Keep the
 * two in sync — the numbers below mirror the constants in firestore.rules.
 */

import type { ContentType } from "./types";

/** Digests avoid publishing personal account addresses in client assets.
 * This is a UI check only; unchanged Firestore rules enforce authorization. */
const ADMIN_EMAIL_HASHES: readonly string[] = [
  "be06df14191adca9f7f6f32bb2cdd785492c78ee3f54af70b0a6c41f821471cc",
  "5349769a9c56901f9007f7c6591ad46764720a1e9c5a824189ce81c816e415fb"
];

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email.toLowerCase()));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return ADMIN_EMAIL_HASHES.includes(hex);
}

/** Message bounds — enforced client-side AND in firestore.rules. */
export const MIN_COMMENT_LENGTH = 2;
export const MAX_COMMENT_LENGTH = 2000;

/** Display-name bounds — enforced client-side AND in firestore.rules. */
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 80;

/** How deep replies may visually nest before being flattened to the cap. */
export const MAX_REPLY_DEPTH = 3;

/** Minimum gap between two submissions from the same browser (ms). */
export const RATE_LIMIT_COOLDOWN_MS = 30_000;

/** localStorage key holding the last-submit epoch for client-side cooldown. */
export const RATE_LIMIT_STORAGE_KEY = "gaitai:lastCommentAt";

/** The publication categories a discussion thread may carry. */
export const ALLOWED_CONTENT_TYPES: readonly ContentType[] = [
  "research",
  "announcement",
  "documentation",
  "approval",
  "blog",
  "demo",
];

/**
 * Lightweight profanity / abuse blocklist. Intentionally conservative — matches
 * whole words, case-insensitive. Extend as needed; the admin can also reject
 * anything that slips through. (Kept deliberately small/SFW in source.)
 */
export const BLOCKED_WORDS: readonly string[] = [
  "viagra",
  "casino",
  "porn",
  "xxx",
  "f4nny", // placeholder examples — replace with your real list
];

/**
 * Cloudflare Turnstile (CAPTCHA) — pluggable & toggleable. The gate is OFF
 * unless a site key is provided via env. When enabled, the public form renders
 * the widget and submission requires a token.
 */
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export const CAPTCHA_ENABLED = TURNSTILE_SITE_KEY.length > 0;

/* ---- Firestore collection paths (single source of truth) ----------------- */

export const COLLECTIONS = {
  /**
   * comments/{commentId} — every comment on the site, in one flat collection.
   * Each doc carries `postId` (the post slug) and a `hidden` flag. Comments
   * publish instantly; hiding and deleting are admin-only.
   */
  comments: "comments",
  /** reportedComments/{reportId} */
  reports: "reportedComments",
} as const;

/* CLIENT-SAFE configuration for the moderated comment system.
 *
 * IMPORTANT: every limit defined here that protects data integrity (length,
 * required fields, allowed status) is ALSO enforced in firestore.rules. The
 * client copy is a UX convenience; the rules are the real boundary. Keep the
 * two in sync — the numbers below mirror the constants in firestore.rules.
 */

import type { ContentType } from "./types";

/** The ONLY accounts permitted to moderate. Mirrored in firestore.rules. */
export const ADMIN_EMAILS: readonly string[] = [
  "anubhaparashar1025@gmail.com",
  "naveenmalhotra148@gmail.com",
  "gait.ai.founder@gmail.com",
];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
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

"use client";

/**
 * Blog subscriptions — real records in Firestore, written from the browser.
 *
 *   subscribers/{sha256(email)} → { email, emailHash, status, source,
 *                                   createdAt, updatedAt }
 *
 * WHY THE DOCUMENT ID IS A HASH OF THE ADDRESS. This site is a static export
 * with no server of its own, so the browser writes to Firestore directly and
 * `firestore.rules` is the enforcement layer. That leaves two problems a
 * mailing list has to solve — never storing the same address twice, and
 * letting someone off the list again — and a random document id solves
 * neither: you cannot find "this address" without reading the collection,
 * and a collection of email addresses is the last thing that should be
 * publicly readable.
 *
 * Addressing each subscriber by `sha256(lowercased email)` makes both
 * possible with no read access to the list at all:
 *
 *   duplicate  · the write is a `create`, and Firestore refuses a create on a
 *                document that exists. One address can only ever hold one row.
 *   unsubscribe· the same address computes the same id, so a visitor can flip
 *                their own row to `unsubscribed` without anyone enumerating
 *                anything.
 *
 * WHAT THE RULES ALLOW, AND WHAT THAT COSTS. `get` is permitted so this file
 * can tell "already subscribed" from "failed", and so the unsubscribe page
 * can tell "not on the list" from "removed". `list` is refused, so the
 * collection cannot be enumerated: to look a row up you must already know the
 * exact address. That is the standard trade for a serverless list and it is
 * stated in the rules; the alternative — inferring "already subscribed" from
 * a denied write — cannot distinguish a duplicate from a misconfiguration,
 * which is exactly the failure this project has been bitten by before.
 *
 * NOTHING IS INVENTED. Every function returns what actually happened. There
 * is no optimistic success: if Firestore is unreachable, unconfigured or the
 * rules are unpublished, the caller gets "error" and the form says so rather
 * than thanking someone for a subscription that was never stored.
 */

import { fbFail } from "@/lib/firebase-logger";

const COLLECTION = "subscribers";

/** Where a subscription came from, for nothing more than knowing which
 *  surface earns them. A closed list, mirrored in `firestore.rules`. */
export type SubscribeSource = "blog" | "article" | "footer" | "unsubscribe-page";

export type SubscribeResult =
  | "subscribed"
  | "already-subscribed"
  | "resubscribed"
  | "invalid"
  | "error";

export type UnsubscribeResult =
  | "unsubscribed"
  | "not-found"
  | "already-unsubscribed"
  | "invalid"
  | "error";

const reported = new Set<string>();

function reportOnce(step: string, err: unknown) {
  if (reported.has(step)) return;
  reported.add(step);
  fbFail(`subscribers · ${step}`, err);
}

async function firestore() {
  const [fs, { db }] = await Promise.all([
    import("firebase/firestore"),
    import("@/lib/firebase"),
  ]);
  return { fs, db };
}

/**
 * Deliberately permissive, and deliberately not a spec-complete RFC 5322
 * regex: the only question worth asking in a browser is "could this plausibly
 * be an address", because the only real proof is a mail that arrives. It
 * rejects the mistakes people actually make — no @, no dot in the domain,
 * spaces, a trailing comma — and nothing else.
 */
const EMAIL = /^[^\s@,]+@[^\s@,]+\.[^\s@,]{2,}$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(raw: string): boolean {
  const email = normalizeEmail(raw);
  return email.length >= 6 && email.length <= 254 && EMAIL.test(email);
}

/**
 * SHA-256 of the normalized address, hex. `crypto.subtle` needs a secure
 * context — https, or localhost — which every surface this runs on is.
 */
async function emailHash(email: string): Promise<string | null> {
  try {
    const bytes = new TextEncoder().encode(email);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch (err) {
    /* No SubtleCrypto — an insecure context, or a very old browser. Without a
       stable id there is no dedupe and no unsubscribe, so this is a real
       failure and not something to paper over with a random id. */
    reportOnce("hash the address", err);
    return null;
  }
}

/**
 * Add an address to the list.
 *
 * The read first is what separates "already subscribed" from "failed" and
 * what allows someone who once unsubscribed to come back — a bare `create`
 * would refuse both identically.
 */
export async function subscribe(
  rawEmail: string,
  source: SubscribeSource,
): Promise<SubscribeResult> {
  if (!isValidEmail(rawEmail)) return "invalid";

  const email = normalizeEmail(rawEmail);
  const id = await emailHash(email);
  if (!id) return "error";

  try {
    const { fs, db } = await firestore();
    const ref = fs.doc(db, COLLECTION, id);
    const snap = await fs.getDoc(ref);

    if (snap.exists()) {
      const status = (snap.data() as { status?: unknown }).status;
      if (status === "unsubscribed") {
        /* Back on the list. Only the two fields the rules allow to move. */
        await fs.updateDoc(ref, {
          status: "active",
          updatedAt: fs.serverTimestamp(),
        });
        return "resubscribed";
      }
      return "already-subscribed";
    }

    await fs.setDoc(ref, {
      email,
      emailHash: id,
      status: "active",
      source,
      createdAt: fs.serverTimestamp(),
      updatedAt: fs.serverTimestamp(),
    });
    return "subscribed";
  } catch (err) {
    reportOnce("subscribe", err);
    return "error";
  }
}

/**
 * Take an address off the list.
 *
 * The row is kept and flagged rather than deleted, because a deleted row
 * cannot stop the address being added again by a stale export, and because
 * "when did they leave" is the one thing an unsubscribe has to be able to
 * answer. Nothing is sent to anyone with `status: "unsubscribed"`.
 */
export async function unsubscribe(rawEmail: string): Promise<UnsubscribeResult> {
  if (!isValidEmail(rawEmail)) return "invalid";

  const email = normalizeEmail(rawEmail);
  const id = await emailHash(email);
  if (!id) return "error";

  try {
    const { fs, db } = await firestore();
    const ref = fs.doc(db, COLLECTION, id);
    const snap = await fs.getDoc(ref);

    if (!snap.exists()) return "not-found";
    if ((snap.data() as { status?: unknown }).status === "unsubscribed") {
      return "already-unsubscribed";
    }

    await fs.updateDoc(ref, {
      status: "unsubscribed",
      updatedAt: fs.serverTimestamp(),
    });
    return "unsubscribed";
  } catch (err) {
    reportOnce("unsubscribe", err);
    return "error";
  }
}

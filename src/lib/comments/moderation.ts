"use client";

/**
 * ADMIN-ONLY comment moderation surface.
 *
 * Comments publish instantly, so there's no approval queue. Moderation is
 * after-the-fact: an admin can HIDE a comment (it stays in the database but
 * disappears from the public site) or DELETE it outright.
 *
 * Every write here is gated by firestore.rules `isAdmin()`, so it only succeeds
 * for a signed-in moderator on the allowlist. Imported only by the admin
 * control panel, never by the public bundle.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fbOk, fbFail } from "@/lib/firebase-logger";
import { COLLECTIONS } from "./config";
import { mapComment } from "./service";
import type { CommentDoc, ReportDoc } from "./types";

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function mapReport(data: DocumentData): ReportDoc {
  return {
    reportId: String(data.reportId ?? ""),
    postId: String(data.postId ?? ""),
    commentId: String(data.commentId ?? ""),
    reason: String(data.reason ?? ""),
    reportedBy: data.reportedBy ?? null,
    createdAt: toIso(data.createdAt),
    resolved: Boolean(data.resolved ?? false),
  };
}

/* -------------------------------------------------------------- reads ----- */

/**
 * Every comment on the site, newest first — including hidden ones, which only
 * an admin can read. No filters, so no index is required.
 */
export async function fetchAllComments(): Promise<CommentDoc[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.comments));
  const list = snap.docs.map((d) => mapComment(d.data()));
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  fbOk(`Loaded ${list.length} comment(s) for moderation`);
  return list;
}

/** All reported comments, newest first. */
export async function fetchReports(): Promise<ReportDoc[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.reports));
  const list = snap.docs.map((d) => mapReport(d.data()));
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return list;
}

/* -------------------------------------------------------------- actions --- */

/**
 * Hide or unhide a comment. Hidden comments stay in the database for the
 * record but are unreadable by the public — enforced in the security rules.
 */
export async function setCommentHidden(
  commentId: string,
  hidden: boolean,
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.comments, commentId), { hidden });
    fbOk(`Comment ${commentId} ${hidden ? "hidden" : "restored"}`);
  } catch (err) {
    fbFail(`${hidden ? "Hide" : "Unhide"} failed for ${commentId}`, err);
    throw err;
  }
}

/** Permanently delete a comment. */
export async function deleteComment(commentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.comments, commentId));
    fbOk(`Comment ${commentId} deleted`);
  } catch (err) {
    fbFail(`Delete failed for ${commentId}`, err);
    throw err;
  }
}

/** Mark a report resolved (kept for audit rather than deleted). */
export async function resolveReport(reportId: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.reports, reportId), { resolved: true });
    fbOk(`Report ${reportId} resolved`);
  } catch (err) {
    fbFail(`Resolve failed for ${reportId}`, err);
    throw err;
  }
}

/**
 * Firebase step-by-step console logger.
 *
 * Every Firebase interaction (init, reads, writes, live subscriptions) reports
 * here so the browser console tells you exactly what happened and why.
 * Errors include the Firestore error `code` plus a plain-English hint for the
 * common failure modes (rules not published, DB missing, offline, etc.).
 */

const TAG = "%c[GaitAI ⋅ Firebase]";
const STYLE_INFO = "color:#0ea5e9;font-weight:600";
const STYLE_OK = "color:#22c55e;font-weight:600";
const STYLE_ERR = "color:#ef4444;font-weight:600";

export function fbLog(step: string, ...details: unknown[]) {
  console.info(TAG, STYLE_INFO, step, ...details);
}

export function fbOk(step: string, ...details: unknown[]) {
  console.info(TAG, STYLE_OK, `✓ ${step}`, ...details);
}

/** Extracts the Firestore error code (e.g. "permission-denied") if present. */
export function fbErrorCode(err: unknown): string {
  return (err as { code?: string })?.code ?? "unknown";
}

/** Maps common Firestore error codes to actionable, human hints. */
function hintFor(code: string): string {
  switch (code) {
    case "permission-denied":
      return "Firestore security rules rejected this. Publish `firestore.rules` in Firebase Console → Firestore Database → Rules.";
    case "not-found":
      return "The Firestore database may not exist yet. Create it in Firebase Console → Firestore Database → Create database.";
    case "failed-precondition":
      return "A required index may be missing — check the full error for an index-creation link.";
    case "unavailable":
      return "Network unreachable or Firestore temporarily down — the SDK will retry automatically.";
    case "unauthenticated":
      return "This action requires a signed-in user.";
    case "invalid-argument":
      return "The data sent didn't match what Firestore expects (check field types).";
    default:
      return "See the raw error below for details.";
  }
}

export function fbFail(step: string, err: unknown) {
  const code = fbErrorCode(err);
  console.error(TAG, STYLE_ERR, `✗ ${step} — code: ${code}`);
  console.error(TAG, STYLE_ERR, `  hint: ${hintFor(code)}`);
  console.error(err);
  return code;
}

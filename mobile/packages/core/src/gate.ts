/**
 * The entitlement gate: the one place premium metric VALUES leave storage.
 *
 * `gate(session, entitlement)` returns a ResultView. For a free user the
 * premium array is `null` and `locked` holds names and descriptions only;
 * for a Pro (or DEV) entitlement the values are included. Screens render
 * ResultView, never AnalysisSession, so a UI bug cannot leak premium values.
 *
 * Safety messaging is never premium: if any metric carries a `safety` note
 * it is moved to the free set here, whatever its flag.
 */
import type { AnalysisSession, Entitlement, Metric, ResultView } from "./schema";
import { toLockedPreview } from "./schema";

export function isEntitled(e: Entitlement): boolean {
  if (e.tier !== "pro") return false;
  if (e.expiresAt && new Date(e.expiresAt).getTime() < Date.now() && !e.inGracePeriod) return false;
  return true;
}

export function gate(session: AnalysisSession, entitlement: Entitlement): ResultView {
  const { premiumMetrics, ...rest } = session;
  const safetyFirst = (m: Metric) => m.description.toLowerCase().includes("safety");
  const free = [...session.freeMetrics, ...premiumMetrics.filter(safetyFirst).map((m) => ({ ...m, isPremium: false }))];
  const premiumOnly = premiumMetrics.filter((m) => !safetyFirst(m));
  const entitled = isEntitled(entitlement);
  return {
    session: rest,
    free,
    premium: entitled ? premiumOnly : null,
    locked: entitled ? [] : premiumOnly.map(toLockedPreview),
    entitlement,
  };
}

// ============================================================================
// RESPONSIBLE-USE STATEMENTS — ONE CANONICAL SOURCE
// ----------------------------------------------------------------------------
// Four separate blocks used to say this: SHARED_PRIVACY in product-details.ts,
// SECURE_PRIVACY in product-details-secure.ts, and CARE_PRIVACY /
// SECURE_PRIVACY_UC in usecase-details.ts. They drifted, and every one of them
// stated configurable architecture as accomplished deployment fact —
// "recordings ARE captured with consent", "uploads ARE encrypted", "activity
// IS logged" — which made a product detail page assert more than
// /legal/security/ does.
//
// LANGUAGE RULE (same as trust.ts)
// These are architectural capabilities, not operational facts. No movement
// pipeline, retention job, audit writer or blur stage exists in this
// repository — it is the marketing site. So the controls sentence is phrased
// as design intent, and the deployment sentence hands the actual requirements
// back to the deploying organisation. A detail page must never claim more
// than the security page.
//
// The controls sentence is shared verbatim; only the closing decision-support
// clause differs, because "does not diagnose" and "not autonomous
// enforcement" are genuinely different boundaries.
// ============================================================================

/**
 * The shared controls + deployment boundary. Identical wherever
 * responsible-use language appears, so the site cannot make a stronger
 * privacy or security claim on one page than on another.
 */
export const RESPONSIBLE_USE_CONTROLS =
  "Designed to support consent-based capture, encrypted transfer, configurable retention and role-based access, with activity logging and skeleton-only processing modes. Deployment requirements depend on the applicable environment, organization and jurisdiction.";

/** Clinical boundary — assessment support, never diagnosis. */
const CARE_BOUNDARY =
  "GaitAI outputs are AI-generated movement metrics intended as decision support — they do not diagnose medical conditions and do not replace clinical judgement.";

/** Security boundary — operator review, never autonomous enforcement. */
const SECURE_BOUNDARY =
  "Movement analytics are designed to run without identifying individuals unless a deployment lawfully and explicitly requires it, and identity-related capabilities are intended only for lawful, authorized deployments with appropriate governance, access control and auditability. Outputs are decision support for trained operators — not autonomous enforcement.";

/** MobilityCare products and clinical use-case deployments. */
export const RESPONSIBLE_USE_CARE = `${RESPONSIBLE_USE_CONTROLS} ${CARE_BOUNDARY}`;

/** SecureVision products and safety use-case deployments. */
export const RESPONSIBLE_USE_SECURE = `${RESPONSIBLE_USE_CONTROLS} ${SECURE_BOUNDARY}`;

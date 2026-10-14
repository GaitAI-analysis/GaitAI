/**
 * THE ANDROID SUBSCRIPTIONS, as the website mentions them — which is barely.
 * =============================================================================
 * Founder decision, 2026-10-14: the website is product discovery and APK
 * download. Plans, prices, taxes, checkout, receipts and cancellation live
 * INSIDE the MobilityCare and SecureVision apps, which read them from the
 * billing Worker (billing/src/catalog.ts). No page on gaitai.in prints a
 * price, a plan comparison, a discount or a subscribe/checkout button, and no
 * structured data carries an offer. scripts/check-no-pricing.mjs enforces
 * this on the built site.
 *
 * What the site may say is the one discreet line below.
 */
import type { ProductAppId } from "./product-apps";

/** The only subscription copy the public site carries. */
export const SUBSCRIPTION_NOTE =
  "Free download. An active subscription is required to use the application's features. Plans and payment options are available inside the app.";

/** Live collection switch, mirrored from the billing Worker. Flip only after the founder activates Razorpay live mode. */
export const payments = {
  live: false,
  statusLine: "Subscriptions coming soon. Until in-app payments open, you can install the app, create your account and see the subscription details inside it; analysis stays locked.",
} as const;

export const downloadHref = (product: ProductAppId) => `/${product}/download/`;

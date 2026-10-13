/**
 * THE ANDROID SUBSCRIPTIONS, as the website presents them.
 * =============================================================================
 * Prices mirror billing/src/catalog.ts in the billing Worker — the Worker is
 * authoritative at checkout; this file lets the static pages print the same
 * numbers without a network call. Approved as PROPOSED pricing on 2026-10-13;
 * live payment collection is NOT enabled (see `payments`).
 *
 *   MobilityCare  ₹999 / month   ₹9,590.40 / year   (20% off twelve months)
 *   SecureVision  ₹1,499 / month ₹14,390.40 / year  (20% off twelve months)
 *
 * GST: whether these prices include tax is `tax.mode`, "unconfirmed" until
 * the founder decides. Every surface prints the mode rather than assuming.
 */
import type { ProductAppId } from "./product-apps";

export const BILLING_API_URL = (process.env.NEXT_PUBLIC_BILLING_API ?? "https://gaitai-billing.gait-ai-founder.workers.dev").replace(/\/$/, "");
export const BILLING_SANDBOX = BILLING_API_URL.includes("-sandbox");

/** Live collection switch, mirrored from the Worker's state for the static copy. Flip only after the founder activates Razorpay. */
export const payments = {
  live: false,
  statusLine: "Subscriptions open soon. These are the announced plans; payments are not yet switched on.",
} as const;

export const ANNUAL_DISCOUNT_PERCENT = 20;
const MONTHLY_PAISE: Record<ProductAppId, number> = { mobilitycare: 99900, securevision: 149900 };

export interface Plan {
  id: string;
  cycle: "monthly" | "annual";
  label: string;
  amountPaise: number;
  amount: string;
  perMonth: string;
  renews: string;
  savingsPercent: number;
  savings: string;
  highlight: boolean;
}

export function formatInr(paise: number): string {
  const rupees = Math.floor(paise / 100);
  const p = paise % 100;
  const s = rupees.toString();
  const grouped = s.length > 3 ? `${s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${s.slice(-3)}` : s;
  return `₹${grouped}.${p.toString().padStart(2, "0")}`;
}

export function plansFor(product: ProductAppId): Plan[] {
  const monthly = MONTHLY_PAISE[product];
  const annual = Math.round(monthly * 12 * (100 - ANNUAL_DISCOUNT_PERCENT) / 100);
  return [
    { id: `${product}_monthly`, cycle: "monthly", label: "Monthly", amountPaise: monthly, amount: formatInr(monthly), perMonth: formatInr(monthly), renews: "every month", savingsPercent: 0, savings: formatInr(0), highlight: false },
    { id: `${product}_annual`, cycle: "annual", label: "Annual", amountPaise: annual, amount: formatInr(annual), perMonth: formatInr(Math.round(annual / 12)), renews: "every 12 months", savingsPercent: ANNUAL_DISCOUNT_PERCENT, savings: formatInr(monthly * 12 - annual), highlight: true },
  ];
}

export const tax = {
  mode: "unconfirmed" as "inclusive" | "exclusive" | "unconfirmed",
  ratePercent: 18,
  text: "GST treatment is being confirmed before launch. The final price, including any applicable 18% GST, is shown before you pay.",
};

export const disclosures = {
  recurring: "Subscriptions renew automatically at the end of each billing period until cancelled.",
  cancellation: "Cancel any time from Manage subscription in the app or at gaitai.in/account. Access continues until the end of the period already paid for; no further charges are taken.",
  refunds: "Refund requests go to support@gaitai.in. A refunded payment ends access for the period it covered.",
  separate: "Each product is a separate subscription: a MobilityCare plan does not unlock SecureVision, and the reverse.",
  download: "Downloading the Android app is free. Analysis, history and reports need an active subscription on your GaitAI account; the app checks it with GaitAI's servers before every analysis.",
  payments: "Payments are processed by Razorpay. GaitAI never sees or stores card numbers.",
} as const;

export const ACCOUNT_HREF = "/account/";
export const subscribeHref = (product: ProductAppId, cycle: Plan["cycle"] = "annual") => `${ACCOUNT_HREF}?product=${product}&plan=${cycle}`;
export const androidHref = (product: ProductAppId) => `/${product}/android/`;
export const TERMS_SUBSCRIPTIONS_HREF = "/legal/terms/#subscriptions";

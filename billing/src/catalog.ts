/**
 * THE CATALOGUE — four plans, two products, proposed prices approved on
 * 2026-10-13 for sandbox use. Live collection is not enabled; see README.
 *
 * Annual = 12 × monthly × 0.8, to the paisa:
 *   MobilityCare  999 × 12 × 0.8 = 9,590.40  → 959,040 paise
 *   SecureVision 1499 × 12 × 0.8 = 14,390.40 → 1,439,040 paise
 *
 * Amounts are integers in paise (Razorpay's unit for INR). Whether the
 * prices include GST is `TAX_MODE`, "unconfirmed" until the founder decides;
 * every surface prints the mode rather than assuming one.
 */
import type { Config } from "./env";

export type Product = "mobilitycare" | "securevision";
export type Cycle = "monthly" | "annual";

export const PRODUCTS: Product[] = ["mobilitycare", "securevision"];
export const CYCLES: Cycle[] = ["monthly", "annual"];

export const PRODUCT_META: Record<Product, { name: string; short: string; package: string; site: string; features: string[] }> = {
  mobilitycare: {
    name: "GaitAI MobilityCare",
    short: "MobilityCare",
    package: "in.gaitai.mobilitycare",
    site: "https://gaitai.in/mobilitycare/",
    features: ["WalkScan gait analysis from a phone video", "RehabTrack progress comparisons", "Full metric set, trends and history", "Shareable reports"],
  },
  securevision: {
    name: "GaitAI SecureVision",
    short: "SecureVision",
    package: "in.gaitai.securevision",
    site: "https://gaitai.in/securevision/",
    features: ["CrowdSense density and flow analysis", "Zone occupancy and dwell analysis", "Full metric set and activity history", "Shareable reports"],
  },
};

export const MONTHLY_PAISE: Record<Product, number> = { mobilitycare: 99900, securevision: 149900 };
export const ANNUAL_DISCOUNT_PERCENT = 20;

export const annualPaise = (product: Product) => Math.round(MONTHLY_PAISE[product] * 12 * (100 - ANNUAL_DISCOUNT_PERCENT) / 100);

export const PLAN_PAISE: Record<Product, Record<Cycle, number>> = {
  mobilitycare: { monthly: MONTHLY_PAISE.mobilitycare, annual: annualPaise("mobilitycare") },
  securevision: { monthly: MONTHLY_PAISE.securevision, annual: annualPaise("securevision") },
};

/** Razorpay plan period/interval for each cycle, and how many cycles a subscription runs (Razorpay charges for at most 10 years). */
export const CYCLE_RAZORPAY: Record<Cycle, { period: "monthly" | "yearly"; interval: 1; total_count: number; label: string; renews: string }> = {
  monthly: { period: "monthly", interval: 1, total_count: 120, label: "Monthly", renews: "every month" },
  annual: { period: "yearly", interval: 1, total_count: 10, label: "Annual", renews: "every 12 months" },
};

export const isProduct = (v: unknown): v is Product => typeof v === "string" && (PRODUCTS as string[]).includes(v);
export const isCycle = (v: unknown): v is Cycle => typeof v === "string" && (CYCLES as string[]).includes(v);

/** ₹ with Indian grouping and two decimals: 959040 → "₹9,590.40". */
export function formatInr(paise: number): string {
  const rupees = Math.floor(paise / 100);
  const p = paise % 100;
  const s = rupees.toString();
  let grouped: string;
  if (s.length > 3) {
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    grouped = `${rest},${last3}`;
  } else grouped = s;
  return `₹${grouped}.${p.toString().padStart(2, "0")}`;
}

export interface PlanView {
  id: string; // "<product>_<cycle>"
  product: Product;
  cycle: Cycle;
  label: string;
  amountPaise: number;
  amount: string;
  perMonthPaise: number;
  perMonth: string;
  renews: string;
  savingsPercent: number;
  savingsPaise: number;
  savings: string;
  highlight: boolean;
}

export function planId(product: Product, cycle: Cycle) {
  return `${product}_${cycle}`;
}

export function parsePlanId(id: string): { product: Product; cycle: Cycle } | null {
  const [product, cycle] = id.split("_");
  return isProduct(product) && isCycle(cycle) ? { product, cycle } : null;
}

export function planView(product: Product, cycle: Cycle): PlanView {
  const amountPaise = PLAN_PAISE[product][cycle];
  const monthly = MONTHLY_PAISE[product];
  const perMonthPaise = cycle === "monthly" ? amountPaise : Math.round(amountPaise / 12);
  const savingsPaise = cycle === "monthly" ? 0 : monthly * 12 - amountPaise;
  return {
    id: planId(product, cycle),
    product,
    cycle,
    label: CYCLE_RAZORPAY[cycle].label,
    amountPaise,
    amount: formatInr(amountPaise),
    perMonthPaise,
    perMonth: formatInr(perMonthPaise),
    renews: CYCLE_RAZORPAY[cycle].renews,
    savingsPercent: cycle === "annual" ? ANNUAL_DISCOUNT_PERCENT : 0,
    savingsPaise,
    savings: formatInr(savingsPaise),
    highlight: cycle === "annual",
  };
}

export function taxDisclosure(config: Config): { mode: Config["taxMode"]; ratePercent: number; text: string } {
  const r = config.gstRatePercent;
  const text =
    config.taxMode === "inclusive"
      ? `Prices include ${r}% GST. A GST invoice is issued for every payment.`
      : config.taxMode === "exclusive"
        ? `Prices exclude GST; ${r}% GST is added at checkout and shown before you pay. A GST invoice is issued for every payment.`
        : `GST treatment is being confirmed before launch. The final price, including any applicable ${r}% GST, is shown before you pay.`;
  return { mode: config.taxMode, ratePercent: r, text };
}

export function catalog(config: Config) {
  return {
    currency: "INR",
    annualDiscountPercent: ANNUAL_DISCOUNT_PERCENT,
    tax: taxDisclosure(config),
    paymentsActive: config.paymentsActive,
    mode: config.provider,
    disclosures: {
      recurring: "Subscriptions renew automatically at the end of each billing period until cancelled.",
      cancellation: "Cancel any time in the app: Profile, then Manage subscription. Access continues until the end of the period already paid for; no further charges are taken.",
      refunds: "Refund requests go to support@gaitai.in. A refunded payment ends access for the period it covered.",
      separate: "Each product is a separate subscription: a MobilityCare plan does not unlock SecureVision, and the reverse.",
    },
    products: PRODUCTS.map((product) => ({
      product,
      ...PRODUCT_META[product],
      plans: CYCLES.map((cycle) => planView(product, cycle)),
    })),
  };
}

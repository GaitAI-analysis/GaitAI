/**
 * The billing Worker's API, typed. Every call carries the Firebase ID token;
 * the Worker re-derives the verdict from its ledger on each request.
 */
import { API_BASE_URL } from "./config";
import { auth } from "./firebase-auth";

export type ProductId = "mobilitycare" | "securevision";
export type Cycle = "monthly" | "annual";

export interface PlanView {
  id: string;
  product: ProductId;
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

export interface Catalog {
  currency: string;
  annualDiscountPercent: number;
  tax: { mode: "inclusive" | "exclusive" | "unconfirmed"; ratePercent: number; text: string };
  paymentsActive: boolean;
  mode: "razorpay" | "sandbox";
  disclosures: { recurring: string; cancellation: string; refunds: string; separate: string };
  products: Array<{ product: ProductId; name: string; short: string; features: string[]; plans: PlanView[] }>;
}

export type EntitlementState = "active" | "grace" | "pending" | "cancelled" | "expired" | "halted" | "refunded" | "none" | "awaiting_payment";

export interface ServerEntitlement {
  product: ProductId;
  entitled: boolean;
  state: EntitlementState;
  until: number | null;
  subscriptionId: string | null;
  cycle: Cycle | null;
  renewsAt: number | null;
  cancelAtCycleEnd: boolean;
  reason: string;
  token: string | null;
}

export interface SubscriptionView {
  id: string;
  product: ProductId;
  cycle: Cycle;
  plan: PlanView;
  status: string;
  amount: number;
  currency: string;
  currentStart: number | null;
  currentEnd: number | null;
  renewsAt: number | null;
  endedAt: number | null;
  paidCount: number;
  cancelAtCycleEnd: boolean;
  refunded: boolean;
  verdict: Omit<ServerEntitlement, "token">;
  createdAt: number;
}

export interface Me {
  account: { uid: string; email: string; emailVerified: boolean };
  mode: "razorpay" | "sandbox";
  paymentsActive: boolean;
  entitlements: Record<ProductId, ServerEntitlement>;
  subscriptions: SubscriptionView[];
  tax: Catalog["tax"];
}

export interface CheckoutStart {
  mode: "razorpay" | "sandbox";
  subscriptionId: string;
  keyId: string;
  plan: PlanView;
  checkoutUrl: string;
  checkoutToken: string;
  expiresAt: number;
  tax: Catalog["tax"];
}

export interface PaymentView {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: "captured" | "failed" | "refunded";
  method: string | null;
  invoiceId: string | null;
  refundId: string | null;
  error: string | null;
  at: number;
}

export class BillingApiError extends Error {
  constructor(public status: number, public code: string, message: string, public extra?: Record<string, unknown>) {
    super(message);
  }
}

const FRIENDLY: Record<string, string> = {
  payments_not_activated: "Subscriptions are not open yet. GaitAI will announce when payments go live.",
  email_unverified: "Verify your email address before subscribing. Check your inbox for the link.",
  already_subscribed: "This account already has an active subscription for this product.",
  subscription_required: "An active subscription is required for this feature.",
  missing_token: "Sign in to continue.",
  token_expired: "Your session expired. Sign in again.",
  invalid_token: "Your session is no longer valid. Sign in again.",
  gateway_error: "The payment gateway did not respond. Try again in a moment.",
  network: "GaitAI could not be reached. Check your connection and try again.",
};

async function request<T>(path: string, init: RequestInit & { auth?: boolean; json?: unknown } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("x-gaitai-client", "android-app");
  if (init.auth !== false) {
    const token = await auth.idToken();
    if (!token) throw new BillingApiError(401, "missing_token", FRIENDLY.missing_token);
    headers.set("authorization", `Bearer ${token}`);
  }
  if (init.json !== undefined) headers.set("content-type", "application/json");
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, body: init.json !== undefined ? JSON.stringify(init.json) : init.body });
  } catch {
    throw new BillingApiError(0, "network", FRIENDLY.network);
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const code = typeof data.error === "string" ? data.error : "error";
    const { error: _e, message, ...extra } = data;
    void _e;
    throw new BillingApiError(res.status, code, FRIENDLY[code] ?? (typeof message === "string" ? message : "Something went wrong. Try again."), extra);
  }
  return data as T;
}

export const billingApi = {
  catalog: () => request<Catalog>("/v1/catalog", { auth: false }),
  keys: () => request<{ keys: Array<{ kty: string; crv: string; x: string; kid?: string }> }>("/v1/keys", { auth: false }),
  me: () => request<Me>("/v1/me"),
  entitlement: (product: ProductId) => request<ServerEntitlement>(`/v1/entitlement?product=${product}`),
  analysisGrant: (product: ProductId, kind: string) => request<{ ok: true; grant: string | null; expiresIn: number }>("/v1/analysis/grant", { method: "POST", json: { product, kind } }),
  checkout: (product: ProductId, cycle: Cycle) => request<CheckoutStart>("/v1/checkout", { method: "POST", json: { product, cycle } }),
  cancel: (subscriptionId: string, atCycleEnd = true) => request<{ ok: true; subscription: SubscriptionView; entitlement: ServerEntitlement }>(`/v1/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, { method: "POST", json: { at_cycle_end: atCycleEnd } }),
  history: () => request<{ payments: PaymentView[] }>("/v1/billing/history"),
  deleteAccount: () => request<{ ok: true; cancelled: number }>("/v1/account/delete", { method: "POST", json: {} }),
  /** Sandbox Worker only; 404 elsewhere. */
  simulate: (subscriptionId: string, scenario: string) => request<{ ok: true; subscription: SubscriptionView; entitlement: ServerEntitlement }>("/v1/sandbox/simulate", { method: "POST", json: { subscription_id: subscriptionId, scenario } }),
};

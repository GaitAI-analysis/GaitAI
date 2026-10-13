/**
 * The payment gateway behind the ledger.
 *
 * RazorpayGateway talks to api.razorpay.com with Basic auth (key_id:key_secret)
 * and verifies checkout signatures the way Razorpay documents:
 *   HMAC_SHA256(razorpay_payment_id + "|" + subscription_id, key_secret)
 * using the subscription id STORED ON THE SERVER, never the one Checkout
 * echoes back.
 *
 * SandboxGateway produces the same shapes with synthetic ids and signs them
 * with the sandbox "key secret", so every verification path exercised in
 * tests is the production code. It exists only on a *-sandbox Worker.
 */
import { CYCLE_RAZORPAY, PRODUCT_META, type Cycle, type Product } from "./catalog";
import { hmacSha256Hex, randomId, timingSafeEqual } from "./crypto";
import type { Config } from "./env";
import { ApiError } from "./http";

export interface GatewaySubscription {
  id: string;
  plan_id: string;
  status: string;
  current_start: number | null;
  current_end: number | null;
  charge_at: number | null;
  ended_at: number | null;
  paid_count: number;
  short_url: string | null;
  customer_id?: string | null;
  notes?: Record<string, string>;
}

export interface Gateway {
  readonly name: "razorpay" | "sandbox";
  readonly keyId: string;
  createPlan(product: Product, cycle: Cycle, amountPaise: number): Promise<{ id: string }>;
  createSubscription(input: { planId: string; cycle: Cycle; uid: string; product: Product; email: string }): Promise<GatewaySubscription>;
  fetchSubscription(id: string): Promise<GatewaySubscription>;
  cancelSubscription(id: string, atCycleEnd: boolean): Promise<GatewaySubscription>;
  verifyCheckoutSignature(paymentId: string, storedSubscriptionId: string, signature: string): Promise<boolean>;
  webhookSecrets(): string[];
  /** The gateway's record of one payment, for the ledger; optional for gateways that only report through webhooks. */
  fetchPayment?(id: string): Promise<GatewayPayment | null>;
}

export interface GatewayPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string | null;
  invoice_id?: string | null;
  error_code?: string | null;
  error_description?: string | null;
  created_at?: number;
}

/* ── Razorpay ──────────────────────────────────────────────────────────── */

export class RazorpayGateway implements Gateway {
  readonly name = "razorpay" as const;
  readonly keyId: string;
  constructor(private cfg: NonNullable<Config["razorpay"]>, private fetcher: typeof fetch = fetch) {
    this.keyId = cfg.keyId;
  }

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await this.fetcher(`${this.cfg.apiBase}${path}`, {
      method,
      headers: {
        authorization: `Basic ${btoa(`${this.cfg.keyId}:${this.cfg.keySecret}`)}`,
        "content-type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      const err = (data as { error?: { code?: string; description?: string } })?.error;
      throw new ApiError(502, "gateway_error", err?.description ?? `Razorpay ${res.status}`, { gatewayCode: err?.code ?? null, status: res.status });
    }
    return data as T;
  }

  async createPlan(product: Product, cycle: Cycle, amountPaise: number) {
    const c = CYCLE_RAZORPAY[cycle];
    return this.call<{ id: string }>("POST", "/v1/plans", {
      period: c.period,
      interval: c.interval,
      item: { name: `${PRODUCT_META[product].name} — ${c.label}`, amount: amountPaise, currency: "INR", description: `${PRODUCT_META[product].short} subscription, billed ${c.renews}` },
      notes: { product, cycle },
    });
  }

  async createSubscription(input: { planId: string; cycle: Cycle; uid: string; product: Product; email: string }) {
    return this.call<GatewaySubscription>("POST", "/v1/subscriptions", {
      plan_id: input.planId,
      total_count: CYCLE_RAZORPAY[input.cycle].total_count,
      quantity: 1,
      customer_notify: 1,
      notes: { uid: input.uid, product: input.product, cycle: input.cycle },
    });
  }

  fetchSubscription(id: string) {
    return this.call<GatewaySubscription>("GET", `/v1/subscriptions/${encodeURIComponent(id)}`);
  }

  cancelSubscription(id: string, atCycleEnd: boolean) {
    return this.call<GatewaySubscription>("POST", `/v1/subscriptions/${encodeURIComponent(id)}/cancel`, { cancel_at_cycle_end: atCycleEnd ? 1 : 0 });
  }

  async fetchPayment(id: string) {
    try {
      return await this.call<GatewayPayment>("GET", `/v1/payments/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
  }

  async verifyCheckoutSignature(paymentId: string, storedSubscriptionId: string, signature: string) {
    const expected = await hmacSha256Hex(this.cfg.keySecret, `${paymentId}|${storedSubscriptionId}`);
    return timingSafeEqual(expected, signature.toLowerCase());
  }

  webhookSecrets() {
    return [this.cfg.webhookSecret, ...(this.cfg.webhookSecretPrevious ? [this.cfg.webhookSecretPrevious] : [])];
  }
}

/* ── Sandbox ───────────────────────────────────────────────────────────── */

/**
 * In-ledger synthetic gateway. Subscription state lives in our own D1 rows,
 * so "fetch" is answered from a callback the router supplies; the gateway
 * itself only mints ids and signatures.
 */
export class SandboxGateway implements Gateway {
  readonly name = "sandbox" as const;
  readonly keyId = "rzp_test_sandbox_stub";
  constructor(
    private secrets: { keySecret: string; webhookSecret: string },
    private lookup: (id: string) => Promise<GatewaySubscription | null>,
    private publicBaseUrl: string,
  ) {}

  async createPlan(product: Product, cycle: Cycle) {
    return { id: `plan_sbx_${product}_${cycle}` };
  }

  async createSubscription(input: { planId: string; cycle: Cycle; uid: string; product: Product }) {
    const id = randomId("sub_sbx");
    return {
      id,
      plan_id: input.planId,
      status: "created",
      current_start: null,
      current_end: null,
      charge_at: null,
      ended_at: null,
      paid_count: 0,
      short_url: `${this.publicBaseUrl}/v1/checkout/page?sub=${id}`,
      notes: { uid: input.uid, product: input.product, cycle: input.cycle },
    };
  }

  async fetchSubscription(id: string) {
    const s = await this.lookup(id);
    if (!s) throw new ApiError(502, "gateway_error", "sandbox subscription not found");
    return s;
  }

  async cancelSubscription(id: string, atCycleEnd: boolean) {
    const s = await this.fetchSubscription(id);
    // The router applies the resulting event; here we only describe the outcome.
    return atCycleEnd && s.current_end ? { ...s, status: "active" } : { ...s, status: "cancelled", ended_at: Math.floor(Date.now() / 1000) };
  }

  async verifyCheckoutSignature(paymentId: string, storedSubscriptionId: string, signature: string) {
    const expected = await hmacSha256Hex(this.secrets.keySecret, `${paymentId}|${storedSubscriptionId}`);
    return timingSafeEqual(expected, signature.toLowerCase());
  }

  /** What a successful synthetic checkout hands back — signed like Razorpay would. */
  async mintCheckoutResult(subscriptionId: string) {
    const paymentId = randomId("pay_sbx");
    const signature = await hmacSha256Hex(this.secrets.keySecret, `${paymentId}|${subscriptionId}`);
    return { razorpay_payment_id: paymentId, razorpay_subscription_id: subscriptionId, razorpay_signature: signature };
  }

  webhookSecrets() {
    return [this.secrets.webhookSecret];
  }
}

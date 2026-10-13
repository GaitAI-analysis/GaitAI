/** Thin, typed access to the D1 ledger. Every write goes through here. */
import type { Cycle, Product } from "./catalog";
import type { Provider } from "./env";

export type SubStatus = "created" | "authenticated" | "active" | "pending" | "halted" | "cancelled" | "completed" | "expired";
export const SUB_STATUSES: SubStatus[] = ["created", "authenticated", "active", "pending", "halted", "cancelled", "completed", "expired"];

export interface CustomerRow {
  uid: string;
  email: string;
  email_verified: number;
  provider_customer_id: string | null;
  created_at: number;
  last_seen_at: number;
  deleted_at: number | null;
}

export interface PlanRow {
  product: Product;
  cycle: Cycle;
  provider: Provider;
  provider_plan_id: string;
  amount_paise: number;
  currency: string;
  created_at: number;
}

export interface SubscriptionRow {
  id: string;
  uid: string;
  product: Product;
  cycle: Cycle;
  provider: Provider;
  plan_id: string;
  status: SubStatus;
  amount_paise: number;
  currency: string;
  current_start: number | null;
  current_end: number | null;
  charge_at: number | null;
  ended_at: number | null;
  paid_count: number;
  cancel_at_cycle_end: number;
  refunded_at: number | null;
  short_url: string | null;
  last_event_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface PaymentRow {
  id: string;
  subscription_id: string;
  uid: string;
  amount_paise: number;
  currency: string;
  status: "captured" | "failed" | "refunded";
  method: string | null;
  invoice_id: string | null;
  error_code: string | null;
  error_description: string | null;
  refund_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface WebhookEventRow {
  id: string;
  event: string;
  subscription_id: string | null;
  signature_ok: number;
  outcome: "applied" | "duplicate" | "unmatched" | "rejected" | "stale";
  body_sha256: string;
  received_at: number;
}

export class Db {
  constructor(private d1: D1Database) {}

  /* customers */
  async upsertCustomer(uid: string, email: string, emailVerified: boolean, at: number): Promise<CustomerRow> {
    await this.d1
      .prepare(
        `INSERT INTO customers (uid, email, email_verified, created_at, last_seen_at) VALUES (?1, ?2, ?3, ?4, ?4)
         ON CONFLICT(uid) DO UPDATE SET email = excluded.email, email_verified = excluded.email_verified, last_seen_at = excluded.last_seen_at, deleted_at = NULL`,
      )
      .bind(uid, email, emailVerified ? 1 : 0, at)
      .run();
    return (await this.d1.prepare("SELECT * FROM customers WHERE uid = ?1").bind(uid).first<CustomerRow>())!;
  }

  getCustomer(uid: string) {
    return this.d1.prepare("SELECT * FROM customers WHERE uid = ?1").bind(uid).first<CustomerRow>();
  }

  async setProviderCustomer(uid: string, providerCustomerId: string) {
    await this.d1.prepare("UPDATE customers SET provider_customer_id = ?2 WHERE uid = ?1").bind(uid, providerCustomerId).run();
  }

  async markDeleted(uid: string, at: number) {
    await this.d1.prepare("UPDATE customers SET deleted_at = ?2, email = '' WHERE uid = ?1").bind(uid, at).run();
  }

  /* plans */
  getPlan(product: Product, cycle: Cycle, provider: Provider) {
    return this.d1.prepare("SELECT * FROM plans WHERE product = ?1 AND cycle = ?2 AND provider = ?3").bind(product, cycle, provider).first<PlanRow>();
  }

  async upsertPlan(row: Omit<PlanRow, "created_at">, at: number) {
    await this.d1
      .prepare(
        `INSERT INTO plans (product, cycle, provider, provider_plan_id, amount_paise, currency, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(product, cycle, provider) DO UPDATE SET provider_plan_id = excluded.provider_plan_id, amount_paise = excluded.amount_paise, currency = excluded.currency`,
      )
      .bind(row.product, row.cycle, row.provider, row.provider_plan_id, row.amount_paise, row.currency, at)
      .run();
  }

  /* subscriptions */
  async insertSubscription(row: SubscriptionRow) {
    await this.d1
      .prepare(
        `INSERT INTO subscriptions (id, uid, product, cycle, provider, plan_id, status, amount_paise, currency, current_start, current_end, charge_at, ended_at, paid_count, cancel_at_cycle_end, refunded_at, short_url, last_event_at, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20)`,
      )
      .bind(
        row.id, row.uid, row.product, row.cycle, row.provider, row.plan_id, row.status, row.amount_paise, row.currency,
        row.current_start, row.current_end, row.charge_at, row.ended_at, row.paid_count, row.cancel_at_cycle_end, row.refunded_at,
        row.short_url, row.last_event_at, row.created_at, row.updated_at,
      )
      .run();
  }

  getSubscription(id: string) {
    return this.d1.prepare("SELECT * FROM subscriptions WHERE id = ?1").bind(id).first<SubscriptionRow>();
  }

  async listSubscriptions(uid: string, product?: Product): Promise<SubscriptionRow[]> {
    const q = product
      ? this.d1.prepare("SELECT * FROM subscriptions WHERE uid = ?1 AND product = ?2 ORDER BY created_at DESC").bind(uid, product)
      : this.d1.prepare("SELECT * FROM subscriptions WHERE uid = ?1 ORDER BY created_at DESC").bind(uid);
    return (await q.all<SubscriptionRow>()).results;
  }

  async updateSubscription(id: string, patch: Partial<SubscriptionRow>, at: number) {
    const keys = Object.keys(patch) as (keyof SubscriptionRow)[];
    if (!keys.length) return;
    const sets = keys.map((k, i) => `${k} = ?${i + 2}`).join(", ");
    await this.d1
      .prepare(`UPDATE subscriptions SET ${sets}, updated_at = ?${keys.length + 2} WHERE id = ?1`)
      .bind(id, ...keys.map((k) => patch[k] as unknown), at)
      .run();
  }

  /* payments */
  async upsertPayment(row: Omit<PaymentRow, "updated_at">, at: number) {
    await this.d1
      .prepare(
        `INSERT INTO payments (id, subscription_id, uid, amount_paise, currency, status, method, invoice_id, error_code, error_description, refund_id, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
         ON CONFLICT(id) DO UPDATE SET status = excluded.status, method = COALESCE(excluded.method, payments.method), invoice_id = COALESCE(excluded.invoice_id, payments.invoice_id),
           error_code = excluded.error_code, error_description = excluded.error_description, refund_id = COALESCE(excluded.refund_id, payments.refund_id), updated_at = excluded.updated_at`,
      )
      .bind(row.id, row.subscription_id, row.uid, row.amount_paise, row.currency, row.status, row.method, row.invoice_id, row.error_code, row.error_description, row.refund_id, row.created_at, at)
      .run();
  }

  getPayment(id: string) {
    return this.d1.prepare("SELECT * FROM payments WHERE id = ?1").bind(id).first<PaymentRow>();
  }

  async listPayments(uid: string): Promise<PaymentRow[]> {
    return (await this.d1.prepare("SELECT * FROM payments WHERE uid = ?1 ORDER BY created_at DESC LIMIT 200").bind(uid).all<PaymentRow>()).results;
  }

  async latestCapturedPayment(subscriptionId: string) {
    return this.d1
      .prepare("SELECT * FROM payments WHERE subscription_id = ?1 AND status IN ('captured','refunded') ORDER BY created_at DESC LIMIT 1")
      .bind(subscriptionId)
      .first<PaymentRow>();
  }

  /* webhook events */
  getEvent(id: string) {
    return this.d1.prepare("SELECT * FROM webhook_events WHERE id = ?1").bind(id).first<WebhookEventRow>();
  }

  async recordEvent(row: WebhookEventRow) {
    await this.d1
      .prepare(
        `INSERT INTO webhook_events (id, event, subscription_id, signature_ok, outcome, body_sha256, received_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(id) DO NOTHING`,
      )
      .bind(row.id, row.event, row.subscription_id, row.signature_ok, row.outcome, row.body_sha256, row.received_at)
      .run();
  }

  async audit(uid: string | null, action: string, detail: unknown, at: number) {
    await this.d1.prepare("INSERT INTO audit_log (at, uid, action, detail) VALUES (?1, ?2, ?3, ?4)").bind(at, uid, action, JSON.stringify(detail ?? null)).run();
  }
}

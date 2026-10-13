/**
 * Applying a gateway event to the ledger — the one path for webhooks, for
 * the post-checkout reconciliation, and for sandbox simulations.
 *
 * Idempotent by event id; monotonic by the provider's timestamp (an older
 * event may add a payment row but never regress the subscription's status).
 */
import type { Db, PaymentRow, SubscriptionRow, SubStatus } from "./db";
import { SUB_STATUSES } from "./db";
import type { GatewaySubscription } from "./provider";

export interface GatewayPayment {
  id: string;
  amount: number;
  currency: string;
  status: string; // captured | failed | authorized | refunded
  method?: string | null;
  invoice_id?: string | null;
  error_code?: string | null;
  error_description?: string | null;
  created_at?: number;
}

export interface GatewayRefund {
  id: string;
  payment_id: string;
  amount: number;
  status: string; // processed | pending | failed
  created_at?: number;
}

export interface NormalisedEvent {
  id: string;
  event: string;
  createdAt: number;
  subscription?: GatewaySubscription | null;
  payment?: GatewayPayment | null;
  refund?: GatewayRefund | null;
}

export type ApplyOutcome = "applied" | "unmatched" | "stale";

const asStatus = (s: string): SubStatus | null => (SUB_STATUSES as string[]).includes(s) ? (s as SubStatus) : null;

/** Map a Razorpay webhook body to the normalised shape. */
export function normaliseRazorpayWebhook(id: string, body: Record<string, unknown>): NormalisedEvent | null {
  const event = typeof body.event === "string" ? body.event : null;
  if (!event) return null;
  const payload = (body.payload ?? {}) as Record<string, { entity?: Record<string, unknown> }>;
  const sub = payload.subscription?.entity as GatewaySubscription | undefined;
  const pay = payload.payment?.entity as GatewayPayment | undefined;
  const refund = payload.refund?.entity as GatewayRefund | undefined;
  return {
    id,
    event,
    createdAt: typeof body.created_at === "number" ? body.created_at : Math.floor(Date.now() / 1000),
    subscription: sub ?? null,
    payment: pay ?? null,
    refund: refund ?? null,
  };
}

export async function applyEvent(db: Db, ev: NormalisedEvent, now: number): Promise<{ outcome: ApplyOutcome; subscriptionId: string | null }> {
  // Resolve the subscription this event is about.
  let subId: string | null = ev.subscription?.id ?? null;
  if (!subId && ev.refund) {
    const p = await db.getPayment(ev.refund.payment_id);
    subId = p?.subscription_id ?? null;
  }
  if (!subId && ev.payment?.id) {
    const p = await db.getPayment(ev.payment.id);
    subId = p?.subscription_id ?? null;
  }
  if (!subId) return { outcome: "unmatched", subscriptionId: null };
  const row = await db.getSubscription(subId);
  if (!row) return { outcome: "unmatched", subscriptionId: subId };

  const stale = row.last_event_at !== null && ev.createdAt < row.last_event_at;

  // Payments are facts regardless of order.
  if (ev.payment?.id) {
    const captured = ev.payment.status === "captured" || ev.payment.status === "authorized";
    const status: PaymentRow["status"] = ev.payment.status === "refunded" ? "refunded" : captured ? "captured" : "failed";
    await db.upsertPayment(
      {
        id: ev.payment.id,
        subscription_id: row.id,
        uid: row.uid,
        amount_paise: ev.payment.amount,
        currency: ev.payment.currency ?? "INR",
        status,
        method: ev.payment.method ?? null,
        invoice_id: ev.payment.invoice_id ?? null,
        error_code: status === "failed" ? (ev.payment.error_code ?? null) : null,
        error_description: status === "failed" ? (ev.payment.error_description ?? null) : null,
        refund_id: null,
        created_at: ev.payment.created_at ?? ev.createdAt,
      },
      now,
    );
  }

  const patch: Partial<SubscriptionRow> = {};

  if (ev.refund && (ev.refund.status === "processed" || ev.refund.status === "created" || ev.event === "refund.processed" || ev.event === "refund.created")) {
    const p = await db.getPayment(ev.refund.payment_id);
    if (p) {
      await db.upsertPayment({ ...p, status: "refunded", refund_id: ev.refund.id, created_at: p.created_at }, now);
      // Revoke only if the refunded payment is the one funding the current period.
      const latest = await db.latestCapturedPayment(row.id);
      if (!latest || latest.id === p.id) patch.refunded_at = ev.refund.created_at ?? ev.createdAt;
    }
  }

  if (ev.subscription && !stale) {
    const s = ev.subscription;
    const st = asStatus(s.status);
    if (st) patch.status = st;
    if (s.current_start !== undefined) patch.current_start = s.current_start;
    if (s.current_end !== undefined) patch.current_end = s.current_end;
    if (s.charge_at !== undefined) patch.charge_at = s.charge_at;
    if (s.ended_at !== undefined) patch.ended_at = s.ended_at;
    if (typeof s.paid_count === "number") patch.paid_count = s.paid_count;
    if (s.short_url) patch.short_url = s.short_url;
    if (ev.event === "subscription.cancelled") patch.status = "cancelled";
    if (ev.event === "subscription.updated" && (s as { has_scheduled_changes?: boolean }).has_scheduled_changes) patch.cancel_at_cycle_end = 1;
    // A fresh successful charge after a refund funds a new period: clear the revocation.
    if ((ev.event === "subscription.charged" || ev.event === "subscription.activated") && ev.payment && ev.payment.status === "captured") patch.refunded_at = null;
    patch.last_event_at = ev.createdAt;
  }

  if (Object.keys(patch).length) await db.updateSubscription(row.id, patch, now);
  return { outcome: stale ? "stale" : "applied", subscriptionId: row.id };
}

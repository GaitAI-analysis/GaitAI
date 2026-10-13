/**
 * gaitai-billing — subscriptions and entitlements for the paid GaitAI
 * Android apps (MobilityCare, SecureVision).
 *
 *   GET  /health
 *   GET  /v1/catalog                      plans, prices, disclosures (public)
 *   GET  /v1/keys                         public key for entitlement tokens (public)
 *   GET  /v1/me                           account, entitlements, subscriptions
 *   GET  /v1/entitlement?product=…        verdict + signed token for one product
 *   POST /v1/analysis/grant               {product, kind} → short-lived grant, or 402
 *   POST /v1/checkout                     {product, cycle} → subscription + checkout URL
 *   GET  /v1/checkout/page?t=…            hosted checkout page (token-addressed)
 *   POST /v1/checkout/verify              checkout result → verified + reconciled
 *   POST /v1/subscriptions/:id/cancel     {at_cycle_end}
 *   GET  /v1/billing/history              payments
 *   POST /v1/account/delete               cancel + anonymise
 *   POST /v1/webhooks/razorpay            signed gateway events
 *   POST /v1/sandbox/pay, /v1/sandbox/simulate   *-sandbox Workers only
 *
 * Every protected route re-derives the verdict from the ledger on each call.
 * The device is never asked what it is entitled to.
 */
import { requireCaller, type Caller } from "./auth";
import { CYCLE_RAZORPAY, PRODUCT_META, PLAN_PAISE, catalog, isCycle, isProduct, planId, planView, taxDisclosure, type Cycle, type Product } from "./catalog";
import { renderCheckoutPage } from "./checkout-page";
import { hmacSha256Hex, publicJwkFromPrivate, randomId, sha256Hex, signCompact, timingSafeEqual, verifyCompact } from "./crypto";
import { Db, type SubscriptionRow } from "./db";
import { evaluateProduct, evaluateSubscription, issueAnalysisGrant, issueEntitlementToken, type Entitlement } from "./entitlement";
import { ConfigError, now as unixNow, readConfig, type Config, type Env } from "./env";
import { applyEvent, normaliseRazorpayWebhook, type NormalisedEvent } from "./events";
import { ApiError, corsHeaders, errorResponse, json, readJson, withCors } from "./http";
import { RazorpayGateway, SandboxGateway, type Gateway, type GatewaySubscription } from "./provider";

export interface Deps {
  fetch: typeof fetch;
  now: () => number;
}

const PERIOD_SECONDS: Record<Cycle, number> = { monthly: 30 * 86400, annual: 365 * 86400 };

interface CheckoutToken {
  sub: string;
  uid: string;
  email: string;
  exp: number;
}

function gatewayFor(config: Config, env: Env, db: Db, deps: Deps): Gateway | null {
  if (config.sandbox) {
    return new SandboxGateway(
      { keySecret: env.RAZORPAY_KEY_SECRET ?? "sandbox", webhookSecret: env.RAZORPAY_WEBHOOK_SECRET ?? "sandbox" },
      async (id) => {
        const row = await db.getSubscription(id);
        return row ? toGatewayShape(row) : null;
      },
      config.publicBaseUrl,
    );
  }
  return config.razorpay ? new RazorpayGateway(config.razorpay, deps.fetch) : null;
}

const toGatewayShape = (row: SubscriptionRow): GatewaySubscription => ({
  id: row.id,
  plan_id: row.plan_id,
  status: row.status,
  current_start: row.current_start,
  current_end: row.current_end,
  charge_at: row.charge_at,
  ended_at: row.ended_at,
  paid_count: row.paid_count,
  short_url: row.short_url,
});

async function entitlementsFor(db: Db, env: Env, config: Config, uid: string, now: number) {
  const subs = await db.listSubscriptions(uid);
  const out: Record<Product, Entitlement & { token: string | null }> = {} as never;
  for (const product of ["mobilitycare", "securevision"] as Product[]) {
    const e = evaluateProduct(product, subs, config, now);
    out[product] = { ...e, token: await issueEntitlementToken(env, config, uid, e, now) };
  }
  return { subs, entitlements: out };
}

const subView = (s: SubscriptionRow, config: Config, now: number) => ({
  id: s.id,
  product: s.product,
  cycle: s.cycle,
  plan: planView(s.product, s.cycle),
  status: s.status,
  amount: s.amount_paise,
  currency: s.currency,
  currentStart: s.current_start,
  currentEnd: s.current_end,
  renewsAt: s.cancel_at_cycle_end ? null : s.charge_at,
  endedAt: s.ended_at,
  paidCount: s.paid_count,
  cancelAtCycleEnd: s.cancel_at_cycle_end === 1,
  refunded: s.refunded_at !== null,
  verdict: evaluateSubscription(s, config, now),
  createdAt: s.created_at,
});

export function createHandler(deps: Partial<Deps> = {}) {
  const d: Deps = { fetch: deps.fetch ?? ((...a) => fetch(...a)), now: deps.now ?? unixNow };

  return async function handle(request: Request, env: Env, workerName?: string): Promise<Response> {
    let config: Config;
    try {
      config = readConfig(env, workerName);
    } catch (e) {
      return json({ error: "misconfigured", message: (e as ConfigError).message }, 500);
    }
    const cors = corsHeaders(config, request);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    try {
      const res = await route(request, env, config, d);
      return withCors(res, cors);
    } catch (e) {
      if (e instanceof ApiError) return withCors(errorResponse(e), cors);
      console.error("billing: unhandled", e);
      return withCors(json({ error: "internal" }, 500), cors);
    }
  };
}

async function route(request: Request, env: Env, config: Config, deps: Deps): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const db = new Db(env.DB);
  const now = deps.now();
  const gateway = gatewayFor(config, env, db, deps);

  if (path === "/health" && request.method === "GET") {
    return json({ ok: true, mode: config.provider, paymentsActive: config.paymentsActive, time: now });
  }
  if (path === "/v1/catalog" && request.method === "GET") {
    return json(catalog(config), 200, { "cache-control": "public, max-age=300" });
  }
  if (path === "/v1/keys" && request.method === "GET") {
    if (!env.ENTITLEMENT_PRIVATE_JWK) return json({ keys: [] });
    return json({ keys: [await publicJwkFromPrivate(env.ENTITLEMENT_PRIVATE_JWK)] }, 200, { "cache-control": "public, max-age=3600" });
  }

  /* ── Gateway webhook (signature-authenticated) ──────────────────────── */
  if (path === "/v1/webhooks/razorpay" && request.method === "POST") {
    if (!gateway) throw new ApiError(503, "payments_not_activated");
    const raw = await request.text();
    const sig = request.headers.get("x-razorpay-signature") ?? "";
    const bodyHash = await sha256Hex(raw);
    const eventId = request.headers.get("x-razorpay-event-id") || `body_${bodyHash.slice(0, 32)}`;
    let signatureOk = false;
    for (const secret of gateway.webhookSecrets()) {
      if (sig && timingSafeEqual(await hmacSha256Hex(secret, raw), sig.toLowerCase())) {
        signatureOk = true;
        break;
      }
    }
    if (!signatureOk) {
      await db.recordEvent({ id: `rejected_${bodyHash.slice(0, 40)}_${now}`, event: "?", subscription_id: null, signature_ok: 0, outcome: "rejected", body_sha256: bodyHash, received_at: now });
      throw new ApiError(401, "invalid_signature");
    }
    const existing = await db.getEvent(eventId);
    if (existing) return json({ ok: true, outcome: "duplicate", eventId });
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new ApiError(400, "invalid_json");
    }
    const ev = normaliseRazorpayWebhook(eventId, body);
    if (!ev) throw new ApiError(400, "invalid_event");
    const result = await applyEvent(db, ev, now);
    await db.recordEvent({ id: eventId, event: ev.event, subscription_id: result.subscriptionId, signature_ok: 1, outcome: result.outcome, body_sha256: bodyHash, received_at: now });
    return json({ ok: true, outcome: result.outcome, eventId });
  }

  /* ── Hosted checkout page (token-addressed) ─────────────────────────── */
  if (path === "/v1/checkout/page" && request.method === "GET") {
    if (!gateway) throw new ApiError(503, "payments_not_activated");
    const t = url.searchParams.get("t") ?? "";
    const tok = env.CHECKOUT_TOKEN_SECRET ? await verifyCompact<CheckoutToken>(env.CHECKOUT_TOKEN_SECRET, t, now) : null;
    if (!tok) return new Response("This checkout link has expired. Return to the app and start again.", { status: 401, headers: { "content-type": "text/plain" } });
    const sub = await db.getSubscription(tok.sub);
    if (!sub || sub.uid !== tok.uid) return new Response("Unknown checkout.", { status: 404 });
    const html = renderCheckoutPage({
      mode: config.provider,
      keyId: gateway.keyId,
      subscriptionId: sub.id,
      token: t,
      productName: PRODUCT_META[sub.product].name,
      planLabel: CYCLE_RAZORPAY[sub.cycle].label,
      amountPaise: sub.amount_paise,
      renews: CYCLE_RAZORPAY[sub.cycle].renews,
      email: tok.email,
      taxText: taxDisclosure(config).text,
      apiBase: config.publicBaseUrl,
    });
    return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", "referrer-policy": "no-referrer" } });
  }

  /* ── Checkout verification (bearer OR checkout token) ───────────────── */
  if (path === "/v1/checkout/verify" && request.method === "POST") {
    if (!gateway) throw new ApiError(503, "payments_not_activated");
    const body = await readJson<{ checkout_token?: string; razorpay_payment_id?: string; razorpay_subscription_id?: string; razorpay_signature?: string }>(request);
    let uid: string;
    let subId: string;
    if (body.checkout_token) {
      const tok = env.CHECKOUT_TOKEN_SECRET ? await verifyCompact<CheckoutToken>(env.CHECKOUT_TOKEN_SECRET, body.checkout_token, now) : null;
      if (!tok) throw new ApiError(401, "checkout_token_invalid");
      uid = tok.uid;
      subId = tok.sub;
    } else {
      const caller = await requireCaller(request, env, config, deps.fetch, now);
      uid = caller.uid;
      if (typeof body.razorpay_subscription_id !== "string") throw new ApiError(400, "missing_subscription");
      subId = body.razorpay_subscription_id;
    }
    const sub = await db.getSubscription(subId);
    if (!sub || sub.uid !== uid) throw new ApiError(404, "subscription_not_found");
    if (typeof body.razorpay_payment_id !== "string" || typeof body.razorpay_signature !== "string") throw new ApiError(400, "missing_fields");
    if (body.razorpay_subscription_id && body.razorpay_subscription_id !== sub.id) throw new ApiError(400, "subscription_mismatch");
    // Signature over the STORED subscription id — a forged id cannot verify.
    const ok = await gateway.verifyCheckoutSignature(body.razorpay_payment_id, sub.id, body.razorpay_signature);
    if (!ok) {
      await db.audit(uid, "checkout.verify.rejected", { sub: sub.id, payment: body.razorpay_payment_id }, now);
      throw new ApiError(400, "invalid_signature");
    }
    // Reconcile with the gateway's own record — the signature proves the
    // checkout happened; the gateway says what state the subscription is in.
    const live = await gateway.fetchSubscription(sub.id);
    const payment = await gateway.fetchPayment?.(body.razorpay_payment_id);
    await applyEvent(
      db,
      {
        id: `verify_${body.razorpay_payment_id}`,
        event: "checkout.verified",
        createdAt: now,
        subscription: live,
        payment: payment ?? { id: body.razorpay_payment_id, amount: sub.amount_paise, currency: sub.currency, status: "captured", created_at: now },
      },
      now,
    );
    await db.audit(uid, "checkout.verified", { sub: sub.id, payment: body.razorpay_payment_id, status: live.status }, now);
    const { entitlements } = await entitlementsFor(db, env, config, uid, now);
    return json({ ok: true, subscription: subView((await db.getSubscription(sub.id))!, config, now), entitlement: entitlements[sub.product] });
  }

  /* ── Sandbox-only simulation endpoints ──────────────────────────────── */
  if (path.startsWith("/v1/sandbox/")) {
    if (!config.sandbox || !(gateway instanceof SandboxGateway)) throw new ApiError(404, "not_found");
    if (path === "/v1/sandbox/pay" && request.method === "POST") {
      const body = await readJson<{ checkout_token?: string; outcome?: string }>(request);
      const tok = env.CHECKOUT_TOKEN_SECRET && body.checkout_token ? await verifyCompact<CheckoutToken>(env.CHECKOUT_TOKEN_SECRET, body.checkout_token, now) : null;
      if (!tok) throw new ApiError(401, "checkout_token_invalid");
      const sub = await db.getSubscription(tok.sub);
      if (!sub || sub.uid !== tok.uid) throw new ApiError(404, "subscription_not_found");
      if (sub.status !== "created") throw new ApiError(409, "already_paid");
      if (body.outcome === "failure") {
        await applyEvent(db, { id: randomId("evt_sbx"), event: "payment.failed", createdAt: now, subscription: toGatewayShape(sub), payment: { id: randomId("pay_sbx"), amount: sub.amount_paise, currency: "INR", status: "failed", error_code: "BAD_REQUEST_ERROR", error_description: "Simulated decline", created_at: now } }, now);
        return json({ ok: false, outcome: "failure" });
      }
      const result = await gateway.mintCheckoutResult(sub.id);
      const period = PERIOD_SECONDS[sub.cycle];
      const entity: GatewaySubscription = { ...toGatewayShape(sub), status: "active", current_start: now, current_end: now + period, charge_at: now + period, paid_count: 1 };
      await applyEvent(db, { id: randomId("evt_sbx"), event: "subscription.authenticated", createdAt: now, subscription: { ...entity, status: "authenticated" } }, now);
      await applyEvent(db, { id: randomId("evt_sbx"), event: "subscription.activated", createdAt: now, subscription: entity }, now);
      await applyEvent(db, { id: randomId("evt_sbx"), event: "subscription.charged", createdAt: now, subscription: entity, payment: { id: result.razorpay_payment_id, amount: sub.amount_paise, currency: "INR", status: "captured", method: "upi", invoice_id: randomId("inv_sbx"), created_at: now } }, now);
      return json(result);
    }
    if (path === "/v1/sandbox/simulate" && request.method === "POST") {
      const caller = await requireCaller(request, env, config, deps.fetch, now);
      const body = await readJson<{ subscription_id?: string; scenario?: string }>(request);
      const sub = body.subscription_id ? await db.getSubscription(body.subscription_id) : null;
      if (!sub || sub.uid !== caller.uid) throw new ApiError(404, "subscription_not_found");
      const ev = sandboxScenario(sub, body.scenario ?? "", now, await db.latestCapturedPayment(sub.id));
      if (!ev) throw new ApiError(400, "unknown_scenario");
      const r = await applyEvent(db, ev, now);
      const fresh = (await db.getSubscription(sub.id))!;
      return json({ ok: true, outcome: r.outcome, subscription: subView(fresh, config, now), entitlement: evaluateProduct(sub.product, [fresh], config, now) });
    }
    throw new ApiError(404, "not_found");
  }

  /* ── Everything below needs an account ──────────────────────────────── */
  const caller = await requireCaller(request, env, config, deps.fetch, now);
  await db.upsertCustomer(caller.uid, caller.email, caller.emailVerified, now);

  if (path === "/v1/me" && request.method === "GET") {
    const { subs, entitlements } = await entitlementsFor(db, env, config, caller.uid, now);
    return json({
      account: { uid: caller.uid, email: caller.email, emailVerified: caller.emailVerified },
      mode: config.provider,
      paymentsActive: config.paymentsActive,
      entitlements,
      subscriptions: subs.map((s) => subView(s, config, now)),
      tax: taxDisclosure(config),
    });
  }

  if (path === "/v1/entitlement" && request.method === "GET") {
    const product = url.searchParams.get("product");
    if (!isProduct(product)) throw new ApiError(400, "invalid_product");
    const { entitlements } = await entitlementsFor(db, env, config, caller.uid, now);
    return json(entitlements[product]);
  }

  if (path === "/v1/analysis/grant" && request.method === "POST") {
    const body = await readJson<{ product?: string; kind?: string }>(request);
    if (!isProduct(body.product)) throw new ApiError(400, "invalid_product");
    const kind = typeof body.kind === "string" ? body.kind.slice(0, 40) : "analysis";
    const subs = await db.listSubscriptions(caller.uid, body.product);
    const e = evaluateProduct(body.product, subs, config, now);
    if (!e.entitled) {
      await db.audit(caller.uid, "analysis.denied", { product: body.product, kind, state: e.state }, now);
      throw new ApiError(402, "subscription_required", e.reason, { entitlement: e });
    }
    const grant = await issueAnalysisGrant(env, config, caller.uid, body.product, kind, now);
    return json({ ok: true, grant, expiresIn: config.analysisGrantSeconds, entitlement: e });
  }

  if (path === "/v1/checkout" && request.method === "POST") {
    if (!gateway) throw new ApiError(503, "payments_not_activated", "Payments are not yet activated for GaitAI subscriptions.");
    if (!env.CHECKOUT_TOKEN_SECRET) throw new ApiError(503, "checkout_unavailable");
    if (config.requireVerifiedEmail && !caller.emailVerified) throw new ApiError(403, "email_unverified", "Verify your email address before subscribing.");
    const body = await readJson<{ product?: string; cycle?: string }>(request);
    if (!isProduct(body.product) || !isCycle(body.cycle)) throw new ApiError(400, "invalid_plan");
    const existing = evaluateProduct(body.product, await db.listSubscriptions(caller.uid, body.product), config, now);
    if (existing.entitled && existing.state !== "cancelled") throw new ApiError(409, "already_subscribed", "This account already has an active subscription for this product.", { entitlement: existing });
    let plan = await db.getPlan(body.product, body.cycle, config.provider);
    if (!plan) {
      if (!config.sandbox) throw new ApiError(503, "plan_not_configured", "Run scripts/razorpay-sync-plans.mjs to create the Razorpay plans.");
      const created = await gateway.createPlan(body.product, body.cycle, PLAN_PAISE[body.product][body.cycle]);
      await db.upsertPlan({ product: body.product, cycle: body.cycle, provider: "sandbox", provider_plan_id: created.id, amount_paise: PLAN_PAISE[body.product][body.cycle], currency: "INR" }, now);
      plan = (await db.getPlan(body.product, body.cycle, "sandbox"))!;
    }
    const gs = await gateway.createSubscription({ planId: plan.provider_plan_id, cycle: body.cycle, uid: caller.uid, product: body.product, email: caller.email });
    const row: SubscriptionRow = {
      id: gs.id,
      uid: caller.uid,
      product: body.product,
      cycle: body.cycle,
      provider: config.provider,
      plan_id: plan.provider_plan_id,
      status: "created",
      amount_paise: plan.amount_paise,
      currency: plan.currency,
      current_start: null,
      current_end: null,
      charge_at: gs.charge_at ?? null,
      ended_at: null,
      paid_count: 0,
      cancel_at_cycle_end: 0,
      refunded_at: null,
      short_url: gs.short_url ?? null,
      last_event_at: null,
      created_at: now,
      updated_at: now,
    };
    await db.insertSubscription(row);
    const token = await signCompact(env.CHECKOUT_TOKEN_SECRET, { sub: gs.id, uid: caller.uid, email: caller.email, exp: now + 1800 } satisfies CheckoutToken);
    await db.audit(caller.uid, "checkout.created", { sub: gs.id, product: body.product, cycle: body.cycle, mode: config.provider }, now);
    return json({
      mode: config.provider,
      subscriptionId: gs.id,
      keyId: gateway.keyId,
      plan: planView(body.product, body.cycle),
      checkoutUrl: `${config.publicBaseUrl}/v1/checkout/page?t=${encodeURIComponent(token)}`,
      checkoutToken: token,
      expiresAt: now + 1800,
      tax: taxDisclosure(config),
    });
  }

  const cancelMatch = /^\/v1\/subscriptions\/([A-Za-z0-9_]+)\/cancel$/.exec(path);
  if (cancelMatch && request.method === "POST") {
    if (!gateway) throw new ApiError(503, "payments_not_activated");
    const sub = await db.getSubscription(cancelMatch[1]);
    if (!sub || sub.uid !== caller.uid) throw new ApiError(404, "subscription_not_found");
    if (["cancelled", "completed", "expired"].includes(sub.status)) throw new ApiError(409, "already_ended");
    const body = await readJson<{ at_cycle_end?: boolean }>(request);
    const atCycleEnd = body.at_cycle_end !== false;
    const live = await gateway.cancelSubscription(sub.id, atCycleEnd);
    if (atCycleEnd && live.status !== "cancelled") {
      await db.updateSubscription(sub.id, { cancel_at_cycle_end: 1, charge_at: null }, now);
    } else {
      await applyEvent(db, { id: randomId("evt_cancel"), event: "subscription.cancelled", createdAt: now, subscription: { ...live, status: "cancelled", ended_at: live.ended_at ?? now } }, now);
    }
    await db.audit(caller.uid, "subscription.cancel", { sub: sub.id, atCycleEnd }, now);
    const fresh = (await db.getSubscription(sub.id))!;
    return json({ ok: true, subscription: subView(fresh, config, now), entitlement: evaluateProduct(sub.product, await db.listSubscriptions(caller.uid, sub.product), config, now) });
  }

  if (path === "/v1/billing/history" && request.method === "GET") {
    const payments = await db.listPayments(caller.uid);
    return json({
      payments: payments.map((p) => ({ id: p.id, subscriptionId: p.subscription_id, amount: p.amount_paise, currency: p.currency, status: p.status, method: p.method, invoiceId: p.invoice_id, refundId: p.refund_id, error: p.error_description, at: p.created_at })),
    });
  }

  if (path === "/v1/account/delete" && request.method === "POST") {
    const subs = await db.listSubscriptions(caller.uid);
    for (const s of subs) {
      if (["active", "authenticated", "pending", "halted", "created"].includes(s.status) && gateway) {
        try {
          const live = await gateway.cancelSubscription(s.id, false);
          await applyEvent(db, { id: randomId("evt_del"), event: "subscription.cancelled", createdAt: now, subscription: { ...live, status: "cancelled", ended_at: now } }, now);
        } catch (e) {
          await db.audit(caller.uid, "account.delete.cancel_failed", { sub: s.id, error: String(e) }, now);
        }
      }
    }
    await db.markDeleted(caller.uid, now);
    await db.audit(caller.uid, "account.deleted", { subscriptions: subs.length }, now);
    return json({ ok: true, cancelled: subs.length });
  }

  throw new ApiError(404, "not_found");
}

/** Sandbox scenarios: the gateway events a real subscription would produce. */
function sandboxScenario(sub: SubscriptionRow, scenario: string, now: number, latestPayment: { id: string; amount_paise: number } | null): NormalisedEvent | null {
  const base = toGatewayShape(sub);
  const period = PERIOD_SECONDS[sub.cycle];
  const id = randomId("evt_sbx");
  switch (scenario) {
    case "renewal_charged": {
      const start = sub.current_end ?? now;
      const entity = { ...base, status: "active", current_start: start, current_end: start + period, charge_at: start + period, paid_count: sub.paid_count + 1 };
      return { id, event: "subscription.charged", createdAt: now, subscription: entity, payment: { id: randomId("pay_sbx"), amount: sub.amount_paise, currency: "INR", status: "captured", method: "card", invoice_id: randomId("inv_sbx"), created_at: now } };
    }
    case "renewal_failed":
      return { id, event: "subscription.pending", createdAt: now, subscription: { ...base, status: "pending" }, payment: { id: randomId("pay_sbx"), amount: sub.amount_paise, currency: "INR", status: "failed", error_code: "BAD_REQUEST_ERROR", error_description: "Simulated: card declined", created_at: now } };
    case "halted":
      return { id, event: "subscription.halted", createdAt: now, subscription: { ...base, status: "halted" } };
    case "cancel_immediate":
      return { id, event: "subscription.cancelled", createdAt: now, subscription: { ...base, status: "cancelled", ended_at: now, current_end: now } };
    case "cycle_ended_after_cancel":
      return { id, event: "subscription.cancelled", createdAt: now, subscription: { ...base, status: "cancelled", ended_at: now, current_end: now - 1 } };
    case "expire":
      // The paid period and both grace windows are over and no renewal arrived.
      return { id, event: "subscription.updated", createdAt: now, subscription: { ...base, status: "active", current_end: now - 10 * 86400, charge_at: now - 10 * 86400 } };
    case "complete":
      return { id, event: "subscription.completed", createdAt: now, subscription: { ...base, status: "completed", ended_at: now } };
    case "refund":
      if (!latestPayment) return null;
      return { id, event: "refund.processed", createdAt: now, refund: { id: randomId("rfnd_sbx"), payment_id: latestPayment.id, amount: latestPayment.amount_paise, status: "processed", created_at: now } };
    default:
      return null;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return createHandler()(request, env);
  },
};

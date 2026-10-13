import { describe, expect, it } from "vitest";
import { verifyJwtEd25519 } from "../src/crypto";
import { readConfig } from "../src/env";
import { body, makeHarness, purchase, req, webhook } from "./helpers";

type Ent = { entitled: boolean; state: string; until: number | null; token: string | null; product: string; subscriptionId: string | null };

describe("catalogue and pricing", () => {
  it("publishes the four approved plans with 20% annual savings and no tax assumption", async () => {
    const h = await makeHarness();
    const c = await body<{ products: Array<{ product: string; plans: Array<{ id: string; amountPaise: number; amount: string; savingsPercent: number; highlight: boolean; perMonth: string }> }>; tax: { mode: string; text: string }; paymentsActive: boolean; mode: string }>(
      await h.handle(req("/v1/catalog")),
    );
    const plans = Object.fromEntries(c.products.flatMap((p) => p.plans.map((pl) => [pl.id, pl])));
    expect(Object.keys(plans).sort()).toEqual(["mobilitycare_annual", "mobilitycare_monthly", "securevision_annual", "securevision_monthly"]);
    expect(plans.mobilitycare_monthly.amountPaise).toBe(99900);
    expect(plans.mobilitycare_monthly.amount).toBe("₹999.00");
    expect(plans.mobilitycare_annual.amountPaise).toBe(959040);
    expect(plans.mobilitycare_annual.amount).toBe("₹9,590.40");
    expect(plans.securevision_monthly.amountPaise).toBe(149900);
    expect(plans.securevision_monthly.amount).toBe("₹1,499.00");
    expect(plans.securevision_annual.amountPaise).toBe(1439040);
    expect(plans.securevision_annual.amount).toBe("₹14,390.40");
    expect(plans.mobilitycare_annual.savingsPercent).toBe(20);
    expect(plans.mobilitycare_annual.highlight).toBe(true);
    expect(plans.mobilitycare_monthly.highlight).toBe(false);
    expect(plans.securevision_annual.perMonth).toBe("₹1,199.20");
    expect(c.tax.mode).toBe("unconfirmed");
    expect(c.tax.text).toMatch(/being confirmed/);
    expect(c.mode).toBe("sandbox");
    expect(c.paymentsActive).toBe(true);
  });
});

describe("authentication", () => {
  it("rejects missing, forged, foreign-audience and expired tokens", async () => {
    const h = await makeHarness();
    expect((await h.handle(req("/v1/me"))).status).toBe(401);
    const other = (await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
    const forged = await h.token("u1", { key: other.privateKey });
    expect((await h.handle(req("/v1/me", { token: forged }))).status).toBe(401);
    const unknownKid = await h.token("u1", { kid: "nope" });
    expect((await h.handle(req("/v1/me", { token: unknownKid }))).status).toBe(401);
    const wrongAud = await h.token("u1", { aud: "someone-else" });
    expect((await h.handle(req("/v1/me", { token: wrongAud }))).status).toBe(401);
    const expired = await h.token("u1", { exp: h.now() - 5 });
    const r = await h.handle(req("/v1/me", { token: expired }));
    expect(r.status).toBe(401);
    expect((await body(r)).error).toBe("token_expired");
    expect((await h.handle(req("/v1/me", { token: "garbage" }))).status).toBe(401);
  });

  it("admits a valid token and creates the customer record", async () => {
    const h = await makeHarness();
    const r = await h.handle(req("/v1/me", { token: await h.token("u-me", { email: "me@example.test" }) }));
    expect(r.status).toBe(200);
    const me = await body<{ account: { uid: string; email: string }; entitlements: Record<string, Ent>; subscriptions: unknown[] }>(r);
    expect(me.account).toMatchObject({ uid: "u-me", email: "me@example.test" });
    expect(me.entitlements.mobilitycare.entitled).toBe(false);
    expect(me.entitlements.securevision.entitled).toBe(false);
    expect(me.subscriptions).toEqual([]);
  });
});

describe("unpaid access", () => {
  it("denies entitlement, analysis grants and protected data without a subscription", async () => {
    const h = await makeHarness();
    const t = await h.token("u-free");
    const e = await body<Ent>(await h.handle(req("/v1/entitlement?product=mobilitycare", { token: t })));
    expect(e).toMatchObject({ entitled: false, state: "none", token: null });
    const g = await h.handle(req("/v1/analysis/grant", { method: "POST", token: t, json: { product: "mobilitycare", kind: "walkscan" } }));
    expect(g.status).toBe(402);
    expect((await body(g)).error).toBe("subscription_required");
    const g2 = await h.handle(req("/v1/analysis/grant", { method: "POST", token: t, json: { product: "securevision", kind: "crowdsense" } }));
    expect(g2.status).toBe(402);
  });

  it("refuses checkout until the email is verified (default), and the sandbox may relax it for QA accounts", async () => {
    const h = await makeHarness({ REQUIRE_VERIFIED_EMAIL: "true" });
    const t = await h.token("u-unverified", { verified: false });
    const r = await h.handle(req("/v1/checkout", { method: "POST", token: t, json: { product: "mobilitycare", cycle: "monthly" } }));
    expect(r.status).toBe(403);
    expect((await body(r)).error).toBe("email_unverified");
    const relaxed = await makeHarness({ REQUIRE_VERIFIED_EMAIL: "false" });
    const r2 = await relaxed.handle(req("/v1/checkout", { method: "POST", token: await relaxed.token("u-qa", { verified: false }), json: { product: "mobilitycare", cycle: "monthly" } }));
    expect(r2.status).toBe(200);
    // Production never relaxes it, whatever the variable says.
    const { readConfig: rc } = await import("../src/env");
    const prod = rc({ ...relaxed.env, BILLING_PROVIDER: "razorpay", RAZORPAY_KEY_ID: "rzp_test_x", RAZORPAY_KEY_SECRET: "s", RAZORPAY_WEBHOOK_SECRET: "w", REQUIRE_VERIFIED_EMAIL: "false" }, "gaitai-billing");
    expect(prod.requireVerifiedEmail).toBe(true);
  });
});

describe("checkout, payment and unlock (sandbox gateway, production verification code)", () => {
  it("creates a subscription, serves the hosted checkout page, verifies the signed result and unlocks exactly that product", async () => {
    const h = await makeHarness();
    const t = await h.token("u-buyer", { email: "buyer@example.test" });
    const co = await h.handle(req("/v1/checkout", { method: "POST", token: t, json: { product: "mobilitycare", cycle: "annual" } }));
    expect(co.status).toBe(200);
    const c = await body<{ subscriptionId: string; checkoutUrl: string; checkoutToken: string; plan: { amountPaise: number }; mode: string }>(co);
    expect(c.subscriptionId).toMatch(/^sub_sbx_/);
    expect(c.plan.amountPaise).toBe(959040);
    expect(c.mode).toBe("sandbox");

    // The hosted page renders for the token and refuses without it.
    const page = await h.handle(new Request(c.checkoutUrl.replace("https://billing.test", "https://billing.test")));
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain("GaitAI MobilityCare");
    expect(html).toContain("₹9,590.40");
    expect(html).toContain("Simulate successful payment");
    expect(html).not.toContain("checkout.razorpay.com"); // sandbox never loads the live script
    expect((await h.handle(req("/v1/checkout/page?t=bogus.token"))).status).toBe(401);

    // Still locked before payment.
    const before = await body<Ent>(await h.handle(req("/v1/entitlement?product=mobilitycare", { token: t })));
    expect(before).toMatchObject({ entitled: false, state: "awaiting_payment" });

    // Pay (synthetic) and verify with the production verification path.
    const pay = await body<{ razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }>(
      await h.handle(req("/v1/sandbox/pay", { method: "POST", json: { checkout_token: c.checkoutToken, outcome: "success" } })),
    );
    expect(pay.razorpay_subscription_id).toBe(c.subscriptionId);
    const ver = await h.handle(req("/v1/checkout/verify", { method: "POST", json: { checkout_token: c.checkoutToken, ...pay } }));
    expect(ver.status).toBe(200);
    const v = await body<{ entitlement: Ent; subscription: { status: string; paidCount: number } }>(ver);
    expect(v.subscription.status).toBe("active");
    expect(v.subscription.paidCount).toBe(1);
    expect(v.entitlement.entitled).toBe(true);

    // Entitlement + offline token verifiable with the public key.
    const after = await body<Ent>(await h.handle(req("/v1/entitlement?product=mobilitycare", { token: t })));
    expect(after.entitled).toBe(true);
    expect(after.state).toBe("active");
    expect(after.until).toBeGreaterThan(h.now() + 364 * 86400);
    const keys = await body<{ keys: JsonWebKey[] }>(await h.handle(req("/v1/keys")));
    const claims = await verifyJwtEd25519(keys.keys[0], after.token!, h.now());
    expect(claims).toMatchObject({ sub: "u-buyer", prod: "mobilitycare", ent: true });
    expect((claims!.exp as number) - h.now()).toBeLessThanOrEqual(24 * 3600);

    // Analysis grant now issued.
    const g = await body<{ grant: string }>(await h.handle(req("/v1/analysis/grant", { method: "POST", token: t, json: { product: "mobilitycare", kind: "walkscan" } })));
    const gc = await verifyJwtEd25519(keys.keys[0], g.grant, h.now());
    expect(gc).toMatchObject({ typ: "grant", prod: "mobilitycare", kind: "walkscan" });

    // The OTHER product stays locked: product-specific entitlement.
    const sv = await body<Ent>(await h.handle(req("/v1/entitlement?product=securevision", { token: t })));
    expect(sv.entitled).toBe(false);
    expect((await h.handle(req("/v1/analysis/grant", { method: "POST", token: t, json: { product: "securevision" } }))).status).toBe(402);

    // A second checkout for the same product is refused.
    const again = await h.handle(req("/v1/checkout", { method: "POST", token: t, json: { product: "mobilitycare", cycle: "monthly" } }));
    expect(again.status).toBe(409);

    // Billing history shows the captured payment.
    const hist = await body<{ payments: Array<{ id: string; status: string; amount: number }> }>(await h.handle(req("/v1/billing/history", { token: t })));
    expect(hist.payments).toHaveLength(1);
    expect(hist.payments[0]).toMatchObject({ id: pay.razorpay_payment_id, status: "captured", amount: 959040 });
  });

  it("a SecureVision subscription does not unlock MobilityCare", async () => {
    const h = await makeHarness();
    const { token } = await purchase(h, "u-sv", "securevision", "monthly");
    const sv = await body<Ent>(await h.handle(req("/v1/entitlement?product=securevision", { token })));
    const mc = await body<Ent>(await h.handle(req("/v1/entitlement?product=mobilitycare", { token })));
    expect(sv.entitled).toBe(true);
    expect(mc.entitled).toBe(false);
    expect((await h.handle(req("/v1/analysis/grant", { method: "POST", token, json: { product: "mobilitycare" } }))).status).toBe(402);
    expect((await h.handle(req("/v1/analysis/grant", { method: "POST", token, json: { product: "securevision" } }))).status).toBe(200);
  });

  it("a failed payment starts nothing", async () => {
    const h = await makeHarness();
    const t = await h.token("u-fail");
    const c = await body<{ checkoutToken: string }>(await h.handle(req("/v1/checkout", { method: "POST", token: t, json: { product: "securevision", cycle: "monthly" } })));
    const r = await h.handle(req("/v1/sandbox/pay", { method: "POST", json: { checkout_token: c.checkoutToken, outcome: "failure" } }));
    expect((await body(r)).outcome).toBe("failure");
    const e = await body<Ent>(await h.handle(req("/v1/entitlement?product=securevision", { token: t })));
    expect(e.entitled).toBe(false);
    const hist = await body<{ payments: Array<{ status: string }> }>(await h.handle(req("/v1/billing/history", { token: t })));
    expect(hist.payments[0].status).toBe("failed");
  });

  it("rejects forged checkout results: bad signature, swapped subscription id, someone else's subscription", async () => {
    const h = await makeHarness();
    const t = await h.token("u-forge");
    const c = await body<{ subscriptionId: string; checkoutToken: string }>(await h.handle(req("/v1/checkout", { method: "POST", token: t, json: { product: "mobilitycare", cycle: "monthly" } })));
    const bad = await h.handle(req("/v1/checkout/verify", { method: "POST", json: { checkout_token: c.checkoutToken, razorpay_payment_id: "pay_forged", razorpay_subscription_id: c.subscriptionId, razorpay_signature: "00".repeat(32) } }));
    expect(bad.status).toBe(400);
    expect((await body(bad)).error).toBe("invalid_signature");
    const swapped = await h.handle(req("/v1/checkout/verify", { method: "POST", json: { checkout_token: c.checkoutToken, razorpay_payment_id: "pay_forged", razorpay_subscription_id: "sub_other", razorpay_signature: "00".repeat(32) } }));
    expect(swapped.status).toBe(400);
    expect((await body(swapped)).error).toBe("subscription_mismatch");
    // Bearer path: another account cannot verify my subscription.
    const t2 = await h.token("u-other");
    const foreign = await h.handle(req("/v1/checkout/verify", { method: "POST", token: t2, json: { razorpay_payment_id: "pay_x", razorpay_subscription_id: c.subscriptionId, razorpay_signature: "00".repeat(32) } }));
    expect(foreign.status).toBe(404);
    // Still locked.
    const e = await body<Ent>(await h.handle(req("/v1/entitlement?product=mobilitycare", { token: t })));
    expect(e.entitled).toBe(false);
  });
});

describe("webhooks", () => {
  it("accepts a correctly signed renewal, is idempotent on event id, and rejects forgery", async () => {
    const h = await makeHarness();
    const { subscriptionId, token: first, fresh } = await purchase(h, "u-wh", "mobilitycare", "monthly");
    const before = await body<Ent>(await h.handle(req("/v1/entitlement?product=mobilitycare", { token: first })));
    h.advance(30 * 86400 - 60); // just before the period ends
    const token = await fresh();
    const start = h.now();
    const event = {
      entity: "event",
      event: "subscription.charged",
      created_at: start,
      contains: ["subscription", "payment"],
      payload: {
        subscription: { entity: { id: subscriptionId, status: "active", current_start: start, current_end: start + 30 * 86400, charge_at: start + 30 * 86400, paid_count: 2, ended_at: null } },
        payment: { entity: { id: "pay_renew_1", amount: 99900, currency: "INR", status: "captured", method: "card", invoice_id: "inv_1", created_at: start } },
      },
    };
    const ok = await webhook(h, event, { eventId: "evt_1" });
    expect(ok.status).toBe(200);
    expect((await body(ok)).outcome).toBe("applied");
    const after = await body<Ent>(await h.handle(req("/v1/entitlement?product=mobilitycare", { token })));
    expect(after.until!).toBeGreaterThan(before.until!);
    // Replay: same event id → duplicate, no second payment row.
    const dup = await webhook(h, event, { eventId: "evt_1" });
    expect((await body(dup)).outcome).toBe("duplicate");
    const hist = await body<{ payments: unknown[] }>(await h.handle(req("/v1/billing/history", { token })));
    expect(hist.payments).toHaveLength(2);
    // Forgery: wrong secret / tampered body → 401, nothing applied.
    expect((await webhook(h, { ...event, created_at: start + 5 }, { secret: "wrong", eventId: "evt_2" })).status).toBe(401);
    expect((await webhook(h, { ...event, created_at: start + 5 }, { tamper: true, eventId: "evt_3" })).status).toBe(401);
    const noSig = await h.handle(new Request("https://billing.test/v1/webhooks/razorpay", { method: "POST", body: JSON.stringify(event) }));
    expect(noSig.status).toBe(401);
    // Unknown subscription: acknowledged (200) but unmatched, so Razorpay does not retry forever.
    const unknown = await webhook(h, { ...event, payload: { subscription: { entity: { ...event.payload.subscription.entity, id: "sub_unknown" } } } }, { eventId: "evt_4" });
    expect((await body(unknown)).outcome).toBe("unmatched");
  });

  it("never lets a stale, out-of-order event regress a newer status", async () => {
    const h = await makeHarness();
    const { subscriptionId, token } = await purchase(h, "u-order", "securevision", "monthly");
    const t0 = h.now();
    // Newer event first: halted.
    await webhook(h, { event: "subscription.halted", created_at: t0 + 100, payload: { subscription: { entity: { id: subscriptionId, status: "halted" } } } }, { eventId: "e-new" });
    expect((await body<Ent>(await h.handle(req("/v1/entitlement?product=securevision", { token })))).entitled).toBe(false);
    // Older event arrives late: pending — must not override halted.
    const late = await webhook(h, { event: "subscription.pending", created_at: t0 + 50, payload: { subscription: { entity: { id: subscriptionId, status: "pending" } } } }, { eventId: "e-old" });
    expect((await body(late)).outcome).toBe("stale");
    expect((await body<Ent>(await h.handle(req("/v1/entitlement?product=securevision", { token })))).state).toBe("halted");
  });
});

describe("lifecycle: renewals, grace, cancellation, expiry, refunds", () => {
  const simulate = async (h: Awaited<ReturnType<typeof makeHarness>>, token: string, subscription_id: string, scenario: string) =>
    body<{ entitlement: Ent; subscription: { status: string; cancelAtCycleEnd: boolean; renewsAt: number | null } }>(
      await h.handle(req("/v1/sandbox/simulate", { method: "POST", token, json: { subscription_id, scenario } })),
    );

  it("failed renewal → grace → halted → locked; a later successful charge restores access", async () => {
    const h = await makeHarness();
    const { subscriptionId, fresh } = await purchase(h, "u-renew", "mobilitycare", "monthly");
    h.advance(30 * 86400 + 60); // period over, renewal due
    const pending = await simulate(h, await fresh(), subscriptionId, "renewal_failed");
    expect(pending.subscription.status).toBe("pending");
    expect(pending.entitlement).toMatchObject({ entitled: true, state: "grace" }); // 3-day grace while the gateway retries
    h.advance(4 * 86400); // grace over
    expect((await body<Ent>(await h.handle(req("/v1/entitlement?product=mobilitycare", { token: await fresh() })))).entitled).toBe(false);
    const halted = await simulate(h, await fresh(), subscriptionId, "halted");
    expect(halted.entitlement).toMatchObject({ entitled: false, state: "halted" });
    expect((await h.handle(req("/v1/analysis/grant", { method: "POST", token: await fresh(), json: { product: "mobilitycare" } }))).status).toBe(402);
    const charged = await simulate(h, await fresh(), subscriptionId, "renewal_charged");
    expect(charged.entitlement).toMatchObject({ entitled: true, state: "active" });
  });

  it("cancel at cycle end keeps access until the paid period ends, then locks; immediate cancel locks now", async () => {
    const h = await makeHarness();
    const { subscriptionId, token, fresh } = await purchase(h, "u-cancel", "securevision", "annual");
    const r = await body<{ subscription: { cancelAtCycleEnd: boolean; renewsAt: number | null }; entitlement: Ent }>(
      await h.handle(req(`/v1/subscriptions/${subscriptionId}/cancel`, { method: "POST", token, json: { at_cycle_end: true } })),
    );
    expect(r.subscription.cancelAtCycleEnd).toBe(true);
    expect(r.subscription.renewsAt).toBeNull();
    expect(r.entitlement.entitled).toBe(true);
    h.advance(200 * 86400);
    expect((await body<Ent>(await h.handle(req("/v1/entitlement?product=securevision", { token: await fresh() })))).entitled).toBe(true);
    h.advance(170 * 86400); // past the 365-day period and the renewal grace
    const ended = await simulate(h, await fresh(), subscriptionId, "cycle_ended_after_cancel");
    expect(ended.entitlement).toMatchObject({ entitled: false, state: "cancelled" });
    expect((await h.handle(req(`/v1/subscriptions/${subscriptionId}/cancel`, { method: "POST", token: await fresh(), json: {} }))).status).toBe(409);

    const h2 = await makeHarness();
    const p2 = await purchase(h2, "u-cancel-now", "securevision", "monthly");
    const now = await body<{ entitlement: Ent }>(await h2.handle(req(`/v1/subscriptions/${p2.subscriptionId}/cancel`, { method: "POST", token: p2.token, json: { at_cycle_end: false } })));
    expect(now.entitlement.entitled).toBe(false);
    // Nobody else can cancel my subscription.
    const h3t = await h2.token("u-stranger");
    expect((await h2.handle(req(`/v1/subscriptions/${p2.subscriptionId}/cancel`, { method: "POST", token: h3t, json: {} }))).status).toBe(404);
  });

  it("expiry with no renewal locks after the grace window", async () => {
    const h = await makeHarness();
    const { subscriptionId, fresh } = await purchase(h, "u-expire", "mobilitycare", "monthly");
    h.advance(30 * 86400 + 47 * 3600); // inside the 48h renewal grace
    expect((await body<Ent>(await h.handle(req("/v1/entitlement?product=mobilitycare", { token: await fresh() })))).entitled).toBe(true);
    h.advance(2 * 3600);
    const e = await body<Ent>(await h.handle(req("/v1/entitlement?product=mobilitycare", { token: await fresh() })));
    expect(e).toMatchObject({ entitled: false, state: "expired" });
    const sim = await simulate(h, await fresh(), subscriptionId, "expire");
    expect(sim.entitlement.entitled).toBe(false);
  });

  it("a refund revokes access; the next captured charge restores it", async () => {
    const h = await makeHarness();
    const { subscriptionId, token } = await purchase(h, "u-refund", "securevision", "monthly");
    const refunded = await simulate(h, token, subscriptionId, "refund");
    expect(refunded.entitlement).toMatchObject({ entitled: false, state: "refunded" });
    const hist = await body<{ payments: Array<{ status: string; refundId: string | null }> }>(await h.handle(req("/v1/billing/history", { token })));
    expect(hist.payments[0].status).toBe("refunded");
    expect(hist.payments[0].refundId).toMatch(/^rfnd_sbx/);
    h.advance(30 * 86400);
    const charged = await simulate(h, await h.token("u-refund"), subscriptionId, "renewal_charged");
    expect(charged.entitlement.entitled).toBe(true);
  });

  it("restore on another device is just signing in: the ledger, not the phone, holds the entitlement", async () => {
    const h = await makeHarness();
    await purchase(h, "u-restore", "mobilitycare", "annual");
    const secondDevice = await h.token("u-restore"); // a fresh token, no local state
    const e = await body<Ent>(await h.handle(req("/v1/entitlement?product=mobilitycare", { token: secondDevice })));
    expect(e.entitled).toBe(true);
  });

  it("account deletion cancels subscriptions and anonymises the customer", async () => {
    const h = await makeHarness();
    const { token } = await purchase(h, "u-delete", "mobilitycare", "monthly");
    const r = await body<{ ok: boolean; cancelled: number }>(await h.handle(req("/v1/account/delete", { method: "POST", token })));
    expect(r.ok).toBe(true);
    const e = await body<Ent>(await h.handle(req("/v1/entitlement?product=mobilitycare", { token })));
    expect(e.entitled).toBe(false);
  });
});

describe("production safety", () => {
  it("refuses the sandbox provider on a Worker not named *-sandbox", async () => {
    const h = await makeHarness({}, "gaitai-billing");
    const r = await h.handle(req("/health"));
    expect(r.status).toBe(500);
    expect((await body(r)).error).toBe("misconfigured");
  });

  it("in razorpay mode without keys, payments are inert: catalogue says so, checkout is 503, sandbox routes vanish", async () => {
    const h = await makeHarness({ BILLING_PROVIDER: "razorpay", RAZORPAY_KEY_ID: "", RAZORPAY_KEY_SECRET: "", RAZORPAY_WEBHOOK_SECRET: "", AUTH_TEST_JWKS: undefined }, "gaitai-billing");
    const c = await body<{ paymentsActive: boolean; mode: string }>(await h.handle(req("/v1/catalog")));
    expect(c).toMatchObject({ paymentsActive: false, mode: "razorpay" });
    expect((await h.handle(req("/v1/sandbox/pay", { method: "POST", json: {} }))).status).toBe(404);
    expect((await h.handle(req("/v1/sandbox/simulate", { method: "POST", json: {} }))).status).toBe(404);
    expect((await h.handle(req("/v1/webhooks/razorpay", { method: "POST", body: "{}" }))).status).toBe(503);
  });

  it("ignores the test JWKS unless the Worker is a sandbox", () => {
    const cfg = readConfig({ BILLING_PROVIDER: "razorpay", AUTH_TEST_JWKS: "{}", FIREBASE_PROJECT_ID: "p", ALLOWED_ORIGINS: "", TAX_MODE: "", GST_RATE_PERCENT: "18", PENDING_GRACE_DAYS: "3", RENEWAL_GRACE_HOURS: "48", ENTITLEMENT_TOKEN_HOURS: "24", ANALYSIS_GRANT_MINUTES: "15", PUBLIC_BASE_URL: "", DB: {} as never }, "gaitai-billing");
    expect(cfg.sandbox).toBe(false);
    expect(cfg.paymentsActive).toBe(false);
  });

  it("refuses the synthetic sandbox key as a Razorpay key", () => {
    expect(() =>
      readConfig(
        { BILLING_PROVIDER: "razorpay", RAZORPAY_KEY_ID: "rzp_test_sandbox_stub", RAZORPAY_KEY_SECRET: "x", RAZORPAY_WEBHOOK_SECRET: "y", FIREBASE_PROJECT_ID: "p", ALLOWED_ORIGINS: "", TAX_MODE: "", GST_RATE_PERCENT: "18", PENDING_GRACE_DAYS: "3", RENEWAL_GRACE_HOURS: "48", ENTITLEMENT_TOKEN_HOURS: "24", ANALYSIS_GRANT_MINUTES: "15", PUBLIC_BASE_URL: "", DB: {} as never },
        "gaitai-billing",
      ),
    ).toThrow(/not a Razorpay key/);
  });

  it("CORS admits only the website origins; native apps (no Origin) are admitted by token", async () => {
    const h = await makeHarness();
    const good = await h.handle(new Request("https://billing.test/v1/catalog", { headers: { origin: "https://gaitai.in" } }));
    expect(good.headers.get("access-control-allow-origin")).toBe("https://gaitai.in");
    const bad = await h.handle(new Request("https://billing.test/v1/catalog", { headers: { origin: "https://evil.example" } }));
    expect(bad.headers.get("access-control-allow-origin")).toBeNull();
    const pre = await h.handle(new Request("https://billing.test/v1/me", { method: "OPTIONS", headers: { origin: "https://gaitai.in" } }));
    expect(pre.status).toBe(204);
  });
});

describe("Razorpay gateway (scripted API)", () => {
  it("creates the subscription with the documented body and verifies signatures against the stored id", async () => {
    const h = await makeHarness(
      { BILLING_PROVIDER: "razorpay", RAZORPAY_KEY_ID: "rzp_test_abc", RAZORPAY_KEY_SECRET: "secret-xyz", RAZORPAY_WEBHOOK_SECRET: "wh-secret", RAZORPAY_API_BASE: "https://rzp.test" },
      "gaitai-billing",
    );
    // Production Worker: AUTH_TEST_JWKS is ignored, so the auth fetch must be scripted too.
    const jwks = JSON.parse(h.env.AUTH_TEST_JWKS!) as { keys: JsonWebKey[] };
    h.scriptFetch((url, init) => {
      if (url.includes("googleapis.com/service_accounts")) return new Response(JSON.stringify(jwks), { headers: { "content-type": "application/json", "cache-control": "max-age=60" } });
      if (url === "https://rzp.test/v1/subscriptions" && init?.method === "POST") {
        const b = JSON.parse(String(init.body)) as Record<string, unknown>;
        expect(b).toMatchObject({ plan_id: "plan_live_mc_monthly", total_count: 120, quantity: 1, customer_notify: 1, notes: { product: "mobilitycare", cycle: "monthly" } });
        expect(init.headers).toMatchObject({ authorization: `Basic ${btoa("rzp_test_abc:secret-xyz")}` });
        return new Response(JSON.stringify({ id: "sub_live_1", plan_id: b.plan_id, status: "created", current_start: null, current_end: null, charge_at: null, ended_at: null, paid_count: 0, short_url: "https://rzp.io/i/x" }), { status: 200 });
      }
      if (url === "https://rzp.test/v1/subscriptions/sub_live_1") return new Response(JSON.stringify({ id: "sub_live_1", plan_id: "plan_live_mc_monthly", status: "active", current_start: h.now(), current_end: h.now() + 30 * 86400, charge_at: h.now() + 30 * 86400, ended_at: null, paid_count: 1 }));
      if (url === "https://rzp.test/v1/payments/pay_live_1") return new Response(JSON.stringify({ id: "pay_live_1", amount: 99900, currency: "INR", status: "captured", method: "upi", created_at: h.now() }));
      return null;
    });
    // Seed the plan row the sync script would have written.
    await h.env.DB.prepare("INSERT INTO plans (product, cycle, provider, provider_plan_id, amount_paise, currency, created_at) VALUES ('mobilitycare','monthly','razorpay','plan_live_mc_monthly',99900,'INR',1)").run();
    const t = await h.token("u-live");
    const co = await h.handle(req("/v1/checkout", { method: "POST", token: t, json: { product: "mobilitycare", cycle: "monthly" } }));
    expect(co.status).toBe(200);
    const c = await body<{ subscriptionId: string; keyId: string; checkoutToken: string; checkoutUrl: string }>(co);
    expect(c.subscriptionId).toBe("sub_live_1");
    expect(c.keyId).toBe("rzp_test_abc");
    const page = await h.handle(new Request(c.checkoutUrl));
    const html = await page.text();
    expect(html).toContain("checkout.razorpay.com/v1/checkout.js");
    expect(html).toContain("PAYMENTS BY RAZORPAY");
    expect(html).not.toContain("Simulate");
    // Signature computed the Razorpay way over the STORED id.
    const { hmacSha256Hex } = await import("../src/crypto");
    const good = await hmacSha256Hex("secret-xyz", "pay_live_1|sub_live_1");
    const ver = await h.handle(req("/v1/checkout/verify", { method: "POST", json: { checkout_token: c.checkoutToken, razorpay_payment_id: "pay_live_1", razorpay_subscription_id: "sub_live_1", razorpay_signature: good } }));
    expect(ver.status).toBe(200);
    const v = await body<{ entitlement: Ent; subscription: { status: string } }>(ver);
    expect(v.subscription.status).toBe("active");
    expect(v.entitlement.entitled).toBe(true);
    // Rotated webhook secret: both current and previous verify.
    const h2 = await makeHarness({ BILLING_PROVIDER: "razorpay", RAZORPAY_KEY_ID: "rzp_test_abc", RAZORPAY_KEY_SECRET: "s", RAZORPAY_WEBHOOK_SECRET: "new", RAZORPAY_WEBHOOK_SECRET_PREVIOUS: "old" }, "gaitai-billing");
    const ev = { event: "subscription.updated", created_at: 1, payload: { subscription: { entity: { id: "sub_none", status: "active" } } } };
    expect((await webhook(h2, ev, { secret: "old", eventId: "a" })).status).toBe(200);
    expect((await webhook(h2, ev, { secret: "new", eventId: "b" })).status).toBe(200);
    expect((await webhook(h2, ev, { secret: "older", eventId: "c" })).status).toBe(401);
  });
});

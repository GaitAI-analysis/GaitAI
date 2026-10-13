/**
 * Test harness: a fake Firebase (RSA key + JWKS), fresh entitlement and
 * checkout secrets, and a request helper that calls the handler directly
 * with the sandbox env plus those secrets.
 */
import { env as baseEnv } from "cloudflare:test";
import { b64url, generateEd25519Jwk, hmacSha256Hex } from "../src/crypto";
import type { Env } from "../src/env";
import { createHandler, type Deps } from "../src/index";

const enc = new TextEncoder();
const PROJECT = "gaitai-intelligence";

export interface Harness {
  env: Env;
  handle: (req: Request) => Promise<Response>;
  token: (uid: string, opts?: { email?: string; verified?: boolean; exp?: number; aud?: string; iss?: string; key?: CryptoKey; kid?: string }) => Promise<string>;
  publicJwk: JsonWebKey;
  now: () => number;
  setNow: (t: number) => void;
  advance: (seconds: number) => void;
  checkoutSecret: string;
  webhookSecret: string;
  keySecret: string;
  fetchLog: Array<{ url: string; init?: RequestInit }>;
  scriptFetch: (fn: (url: string, init?: RequestInit) => Response | Promise<Response> | null) => void;
}

export async function makeHarness(overrides: Partial<Env> = {}, name = "gaitai-billing-sandbox"): Promise<Harness> {
  const rsa = (await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const pubJwk = await crypto.subtle.exportKey("jwk", rsa.publicKey);
  const jwks = { keys: [{ ...pubJwk, kid: "test-kid", alg: "RS256", use: "sig" }] };
  const ed = await generateEd25519Jwk();
  const checkoutSecret = "test-checkout-secret";
  const env: Env = {
    ...(baseEnv as unknown as Env),
    AUTH_TEST_JWKS: JSON.stringify(jwks),
    ENTITLEMENT_PRIVATE_JWK: JSON.stringify(ed.privateJwk),
    CHECKOUT_TOKEN_SECRET: checkoutSecret,
    ...overrides,
  };
  let clock = 1_800_000_000; // 2027-01-15, fixed
  const fetchLog: Harness["fetchLog"] = [];
  let script: ((url: string, init?: RequestInit) => Response | Promise<Response> | null) | null = null;
  const fetcher: typeof fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    fetchLog.push({ url, init });
    const r = script ? await script(url, init) : null;
    if (r) return r;
    return new Response(JSON.stringify({ error: { code: "TEST_UNSCRIPTED", description: `unscripted ${url}` } }), { status: 599 });
  };
  const deps: Deps = { fetch: fetcher, now: () => clock };
  const handler = createHandler(deps);
  const sign = async (claims: Record<string, unknown>, key: CryptoKey, kid: string) => {
    const h = b64url(enc.encode(JSON.stringify({ alg: "RS256", kid, typ: "JWT" })));
    const b = b64url(enc.encode(JSON.stringify(claims)));
    const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(`${h}.${b}`));
    return `${h}.${b}.${b64url(sig)}`;
  };
  return {
    env,
    handle: (req) => handler(req, env, name),
    token: (uid, o = {}) =>
      sign(
        {
          iss: o.iss ?? `https://securetoken.google.com/${PROJECT}`,
          aud: o.aud ?? PROJECT,
          sub: uid,
          user_id: uid,
          email: o.email ?? `${uid}@example.test`,
          email_verified: o.verified ?? true,
          iat: clock - 10,
          exp: o.exp ?? clock + 3600,
          auth_time: clock - 10,
        },
        o.key ?? rsa.privateKey,
        o.kid ?? "test-kid",
      ),
    publicJwk: ed.publicJwk,
    now: () => clock,
    setNow: (t) => (clock = t),
    advance: (s) => (clock += s),
    checkoutSecret,
    webhookSecret: env.RAZORPAY_WEBHOOK_SECRET ?? "",
    keySecret: env.RAZORPAY_KEY_SECRET ?? "",
    fetchLog,
    scriptFetch: (fn) => (script = fn),
  };
}

export const req = (path: string, init: RequestInit & { token?: string; json?: unknown } = {}) => {
  const headers = new Headers(init.headers);
  if (init.token) headers.set("authorization", `Bearer ${init.token}`);
  if (init.json !== undefined) headers.set("content-type", "application/json");
  return new Request(`https://billing.test${path}`, { ...init, headers, body: init.json !== undefined ? JSON.stringify(init.json) : init.body });
};

export const body = async <T = Record<string, unknown>>(res: Response) => (await res.json()) as T;

/** Sign a webhook body like Razorpay: HMAC-SHA256 over the raw body with the webhook secret. */
export async function webhook(h: Harness, event: Record<string, unknown>, opts: { secret?: string; eventId?: string; tamper?: boolean } = {}) {
  const raw = JSON.stringify(event);
  const sig = await hmacSha256Hex(opts.secret ?? h.webhookSecret, opts.tamper ? raw + " " : raw);
  const headers: Record<string, string> = { "content-type": "application/json", "x-razorpay-signature": sig };
  if (opts.eventId) headers["x-razorpay-event-id"] = opts.eventId;
  return h.handle(new Request("https://billing.test/v1/webhooks/razorpay", { method: "POST", headers, body: raw }));
}

/** Drive a full sandbox purchase for a user and return the subscription id. */
export async function purchase(h: Harness, uid: string, product: string, cycle: string) {
  const t = await h.token(uid);
  const co = await body<{ subscriptionId: string; checkoutToken: string; checkoutUrl: string }>(await h.handle(req("/v1/checkout", { method: "POST", token: t, json: { product, cycle } })));
  const pay = await body<{ razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }>(
    await h.handle(req("/v1/sandbox/pay", { method: "POST", json: { checkout_token: co.checkoutToken, outcome: "success" } })),
  );
  const ver = await h.handle(req("/v1/checkout/verify", { method: "POST", json: { checkout_token: co.checkoutToken, ...pay } }));
  if (ver.status !== 200) throw new Error(`verify failed: ${ver.status} ${await ver.text()}`);
  // `fresh()` mints a new token: tests advance the clock by days, past any token's hour-long life.
  return { subscriptionId: co.subscriptionId, paymentId: pay.razorpay_payment_id, token: t, uid, fresh: () => h.token(uid) };
}

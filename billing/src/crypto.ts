/** WebCrypto helpers: HMAC, SHA-256, base64url, Ed25519 JWTs, constant-time compare. */

const enc = new TextEncoder();

export function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of u8) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function hex(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(u8, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const buf = typeof data === "string" ? enc.encode(data) : data;
  return hex(await crypto.subtle.digest("SHA-256", buf as BufferSource));
}

export async function hmacSha256Hex(secret: string, data: string | Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const buf = typeof data === "string" ? enc.encode(data) : data;
  return hex(await crypto.subtle.sign("HMAC", key, buf as BufferSource));
}

/** Constant-time string equality (same length required). */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function randomId(prefix: string, bytes = 10): string {
  const u8 = new Uint8Array(bytes);
  crypto.getRandomValues(u8);
  return `${prefix}_${hex(u8).slice(0, 14)}`;
}

/* ── HMAC-signed compact tokens (checkout page, analysis grants) ───────── */

export async function signCompact(secret: string, payload: Record<string, unknown>): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const mac = await hmacSha256Hex(secret, body);
  return `${body}.${mac}`;
}

export async function verifyCompact<T = Record<string, unknown>>(secret: string, token: string, nowSec = Math.floor(Date.now() / 1000)): Promise<T | null> {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = await hmacSha256Hex(secret, body);
  if (!timingSafeEqual(expected, mac)) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as T & { exp?: number };
    if (typeof payload.exp === "number" && payload.exp < nowSec) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ── Ed25519 JWTs (entitlement tokens the app can verify offline) ──────── */

/**
 * Node's WebCrypto exports Ed25519 JWKs with `alg: "Ed25519"`; workerd's
 * importKey rejects that field (it expects "EdDSA" or none). Strip the
 * fields that describe usage rather than the key before importing.
 */
const bareJwk = (jwk: JsonWebKey & { alg?: string; kid?: string }): JsonWebKey => {
  const { alg: _alg, key_ops: _ops, ext: _ext, kid: _kid, ...rest } = jwk as JsonWebKey & { alg?: string; kid?: string };
  void _alg; void _ops; void _ext; void _kid;
  return rest;
};

export async function importEd25519Private(jwkJson: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkJson) as JsonWebKey;
  return crypto.subtle.importKey("jwk", bareJwk(jwk), { name: "Ed25519" }, true, ["sign"]);
}

export async function publicJwkFromPrivate(jwkJson: string): Promise<JsonWebKey> {
  const jwk = JSON.parse(jwkJson) as JsonWebKey & { kid?: string };
  const { d: _d, ...pub } = bareJwk(jwk);
  void _d;
  return { ...pub, kid: jwk.kid, key_ops: ["verify"] } as JsonWebKey;
}

export async function signJwtEd25519(privateKey: CryptoKey, kid: string, claims: Record<string, unknown>): Promise<string> {
  const header = b64url(enc.encode(JSON.stringify({ alg: "EdDSA", typ: "JWT", kid })));
  const body = b64url(enc.encode(JSON.stringify(claims)));
  const sig = await crypto.subtle.sign({ name: "Ed25519" }, privateKey, enc.encode(`${header}.${body}`));
  return `${header}.${body}.${b64url(sig)}`;
}

export async function verifyJwtEd25519(publicJwk: JsonWebKey, token: string, nowSec = Math.floor(Date.now() / 1000)): Promise<Record<string, unknown> | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const key = await crypto.subtle.importKey("jwk", bareJwk(publicJwk), { name: "Ed25519" }, false, ["verify"]);
  const ok = await crypto.subtle.verify({ name: "Ed25519" }, key, b64urlDecode(parts[2]) as BufferSource, enc.encode(`${parts[0]}.${parts[1]}`));
  if (!ok) return null;
  const claims = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1]))) as Record<string, unknown>;
  if (typeof claims.exp === "number" && claims.exp < nowSec) return null;
  return claims;
}

/** Generate a fresh Ed25519 key pair as JWKs (used by scripts/keygen and tests). */
export async function generateEd25519Jwk(): Promise<{ privateJwk: JsonWebKey; publicJwk: JsonWebKey; kid: string }> {
  const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const privateJwk = (await crypto.subtle.exportKey("jwk", pair.privateKey)) as JsonWebKey;
  const publicJwk = (await crypto.subtle.exportKey("jwk", pair.publicKey)) as JsonWebKey;
  const kid = (await sha256Hex(JSON.stringify(publicJwk.x))).slice(0, 16);
  return { privateJwk: { ...privateJwk, kid } as unknown as JsonWebKey, publicJwk: { ...publicJwk, kid } as unknown as JsonWebKey, kid };
}

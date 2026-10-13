/**
 * Offline verification of the Worker's signed entitlement token.
 *
 * The Worker signs `{sub, prod, ent, until, exp}` with Ed25519; the app
 * holds the PUBLIC key (from app config, refreshed from /v1/keys). When the
 * network is away the app may honour a cached token until its `exp` (≤ 24 h
 * after it was issued) — and no longer. This is a convenience for a paying
 * customer on a train, not the security boundary: anything that runs on the
 * device can be patched out of the APK, which is why the Worker re-derives
 * every verdict from the ledger and why protected API calls never trust
 * this token.
 */
import nacl from "tweetnacl";
import * as SecureStore from "expo-secure-store";
import { ENTITLEMENT_PUBLIC_JWK } from "./config";
import type { ProductId } from "./billing-client";

const KEY = "gaitai.entitlement.token.v1";
const KEYS_KEY = "gaitai.entitlement.keys.v1";

export interface TokenClaims {
  iss: string;
  sub: string;
  prod: ProductId;
  ent: boolean;
  state: string;
  until: number;
  sid: string | null;
  iat: number;
  exp: number;
}

const b64urlToBytes = (s: string): Uint8Array => {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = globalThis.atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
const utf8 = (s: string) => new TextEncoder().encode(s);
const decodeJson = <T>(s: string): T => JSON.parse(new TextDecoder().decode(b64urlToBytes(s))) as T;

type Jwk = { kty: string; crv: string; x: string; kid?: string };

async function knownKeys(): Promise<Jwk[]> {
  const keys: Jwk[] = ENTITLEMENT_PUBLIC_JWK ? [ENTITLEMENT_PUBLIC_JWK] : [];
  try {
    const raw = await SecureStore.getItemAsync(KEYS_KEY);
    if (raw) for (const k of JSON.parse(raw) as Jwk[]) if (!keys.some((e) => e.x === k.x)) keys.push(k);
  } catch {
    /* ignore */
  }
  return keys;
}

/** Remember the Worker's current public keys (fetched online) for offline checks later. */
export async function rememberKeys(keys: Jwk[]) {
  try {
    await SecureStore.setItemAsync(KEYS_KEY, JSON.stringify(keys.filter((k) => k.kty === "OKP" && k.crv === "Ed25519")));
  } catch {
    /* ignore */
  }
}

export async function verifyEntitlementToken(token: string, nowSec = Math.floor(Date.now() / 1000)): Promise<TokenClaims | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  let header: { alg?: string; kid?: string };
  let claims: TokenClaims;
  try {
    header = decodeJson(parts[0]);
    claims = decodeJson(parts[1]);
  } catch {
    return null;
  }
  if (header.alg !== "EdDSA") return null;
  const keys = await knownKeys();
  const candidates = header.kid ? keys.filter((k) => k.kid === header.kid).concat(keys.filter((k) => k.kid !== header.kid)) : keys;
  const msg = utf8(`${parts[0]}.${parts[1]}`);
  const sig = b64urlToBytes(parts[2]);
  for (const k of candidates) {
    try {
      if (nacl.sign.detached.verify(msg, sig, b64urlToBytes(k.x))) {
        if (claims.iss !== "gaitai-billing" || claims.exp < nowSec) return null;
        return claims;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

export const entitlementTokenStore = {
  async get(product: ProductId): Promise<string | null> {
    try {
      const raw = await SecureStore.getItemAsync(`${KEY}.${product}`);
      return raw || null;
    } catch {
      return null;
    }
  },
  async set(product: ProductId, token: string | null) {
    try {
      if (token) await SecureStore.setItemAsync(`${KEY}.${product}`, token);
      else await SecureStore.deleteItemAsync(`${KEY}.${product}`);
    } catch {
      /* ignore */
    }
  },
};

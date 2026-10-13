/**
 * Who is calling: a Firebase Authentication ID token (RS256), verified
 * against Google's published keys for the `securetoken` issuer.
 *
 *   iss  https://securetoken.google.com/<project>
 *   aud  <project>
 *   sub  the uid — the only identity the ledger knows
 *
 * The apps and the website obtain the token from Firebase Auth (email +
 * password). No password ever reaches this Worker. Google's JWKS is cached
 * for the lifetime its Cache-Control allows; in sandbox tests a JWKS can be
 * injected (AUTH_TEST_JWKS) and is ignored on a production Worker.
 */
import { ApiError } from "./http";
import { b64urlDecode } from "./crypto";
import type { Config, Env } from "./env";

export interface Caller {
  uid: string;
  email: string;
  emailVerified: boolean;
  token: string;
}

const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

type Jwk = JsonWebKey & { kid: string };
let cache: { keys: Jwk[]; until: number } | null = null;

async function jwks(env: Env, config: Config, fetcher: typeof fetch): Promise<Jwk[]> {
  if (config.sandbox && env.AUTH_TEST_JWKS) return (JSON.parse(env.AUTH_TEST_JWKS) as { keys: Jwk[] }).keys;
  const t = Date.now();
  if (cache && cache.until > t) return cache.keys;
  const res = await fetcher(JWKS_URL);
  if (!res.ok) throw new ApiError(503, "auth_keys_unavailable");
  const body = (await res.json()) as { keys: Jwk[] };
  const maxAge = /max-age=(\d+)/.exec(res.headers.get("cache-control") ?? "")?.[1];
  cache = { keys: body.keys, until: t + (maxAge ? Number(maxAge) * 1000 : 3600_000) };
  return body.keys;
}

const dec = new TextDecoder();
const parse = (s: string) => JSON.parse(dec.decode(b64urlDecode(s))) as Record<string, unknown>;

export async function verifyFirebaseToken(token: string, env: Env, config: Config, fetcher: typeof fetch = fetch, nowSec = Math.floor(Date.now() / 1000)): Promise<Caller> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new ApiError(401, "invalid_token");
  let header: Record<string, unknown>, claims: Record<string, unknown>;
  try {
    header = parse(parts[0]);
    claims = parse(parts[1]);
  } catch {
    throw new ApiError(401, "invalid_token");
  }
  if (header.alg !== "RS256" || typeof header.kid !== "string") throw new ApiError(401, "invalid_token", "unsupported token header");
  const keys = await jwks(env, config, fetcher);
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new ApiError(401, "invalid_token", "unknown signing key");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64urlDecode(parts[2]) as BufferSource,
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!ok) throw new ApiError(401, "invalid_token", "bad signature");
  const now = nowSec;
  if (claims.iss !== `https://securetoken.google.com/${config.firebaseProjectId}`) throw new ApiError(401, "invalid_token", "issuer");
  if (claims.aud !== config.firebaseProjectId) throw new ApiError(401, "invalid_token", "audience");
  if (typeof claims.exp !== "number" || claims.exp <= now) throw new ApiError(401, "token_expired");
  if (typeof claims.iat !== "number" || claims.iat > now + 300) throw new ApiError(401, "invalid_token", "issued in the future");
  if (typeof claims.sub !== "string" || !claims.sub) throw new ApiError(401, "invalid_token", "subject");
  return {
    uid: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    emailVerified: claims.email_verified === true,
    token,
  };
}

export async function requireCaller(request: Request, env: Env, config: Config, fetcher: typeof fetch = fetch, nowSec = Math.floor(Date.now() / 1000)): Promise<Caller> {
  const auth = request.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) throw new ApiError(401, "missing_token");
  return verifyFirebaseToken(m[1].trim(), env, config, fetcher, nowSec);
}

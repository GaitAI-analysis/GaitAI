/**
 * Accounts: Firebase Authentication (email + password) over its REST API.
 * The password goes to Google's Identity Toolkit over TLS and nowhere else;
 * what the app keeps is an ID token (an hour) and a refresh token, in the
 * platform keystore through expo-secure-store.
 *
 * The billing Worker verifies the ID token's signature against Google's
 * published keys, so the account is the same identity on every device and
 * the ledger — not the phone — decides what it is entitled to.
 */
import * as SecureStore from "expo-secure-store";
import { FIREBASE_API_KEY } from "./config";

const ID = "https://identitytoolkit.googleapis.com/v1";
const TOKEN = "https://securetoken.googleapis.com/v1/token";
const KEY = "gaitai.auth.session.v1";

export interface AuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
}

interface Stored {
  uid: string;
  email: string;
  emailVerified: boolean;
  idToken: string;
  refreshToken: string;
  /** Unix ms when idToken expires. */
  expiresAt: number;
}

export class AuthError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

const MESSAGES: Record<string, string> = {
  EMAIL_EXISTS: "An account with this email already exists. Sign in instead.",
  EMAIL_NOT_FOUND: "No account with this email. Check the address or create an account.",
  INVALID_PASSWORD: "That password is not right.",
  INVALID_LOGIN_CREDENTIALS: "The email or password is not right.",
  INVALID_EMAIL: "That does not look like an email address.",
  WEAK_PASSWORD: "Choose a longer password (at least 8 characters).",
  USER_DISABLED: "This account has been disabled. Contact support@gaitai.in.",
  TOO_MANY_ATTEMPTS_TRY_LATER: "Too many attempts. Wait a few minutes and try again.",
  OPERATION_NOT_ALLOWED: "Email sign-in is not enabled. Contact support@gaitai.in.",
  USER_NOT_FOUND: "This account no longer exists.",
  TOKEN_EXPIRED: "Your session has expired. Sign in again.",
  INVALID_ID_TOKEN: "Your session is no longer valid. Sign in again.",
  CREDENTIAL_TOO_OLD_LOGIN_AGAIN: "For this action, sign in again first.",
  NETWORK: "GaitAI could not be reached. Check your connection and try again.",
};

async function call<T>(url: string, body: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new AuthError("NETWORK", MESSAGES.NETWORK);
  }
  const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } } & T;
  if (!res.ok) {
    const raw = data.error?.message ?? "UNKNOWN";
    const code = raw.split(" ")[0].split(":")[0];
    throw new AuthError(code, MESSAGES[code] ?? "Something went wrong with your account. Try again.");
  }
  return data;
}

let cached: Stored | null | undefined;
const listeners = new Set<(u: AuthUser | null) => void>();
const emit = () => {
  const u = toUser(cached ?? null);
  for (const l of listeners) l(u);
};
const toUser = (s: Stored | null): AuthUser | null => (s ? { uid: s.uid, email: s.email, emailVerified: s.emailVerified } : null);

async function load(): Promise<Stored | null> {
  if (cached !== undefined) return cached;
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    cached = raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    cached = null;
  }
  return cached;
}

async function save(s: Stored | null) {
  cached = s;
  try {
    if (s) await SecureStore.setItemAsync(KEY, JSON.stringify(s), { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    /* keep in memory */
  }
  emit();
}

interface TokenResponse {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  email: string;
}

async function fromTokens(t: TokenResponse): Promise<Stored> {
  const info = await lookup(t.idToken).catch(() => null);
  return {
    uid: t.localId,
    email: info?.email ?? t.email,
    emailVerified: info?.emailVerified ?? false,
    idToken: t.idToken,
    refreshToken: t.refreshToken,
    expiresAt: Date.now() + (Number(t.expiresIn) - 60) * 1000,
  };
}

async function lookup(idToken: string): Promise<{ email: string; emailVerified: boolean }> {
  const r = await call<{ users: Array<{ email: string; emailVerified: boolean }> }>(`${ID}/accounts:lookup?key=${FIREBASE_API_KEY}`, { idToken });
  const u = r.users?.[0];
  if (!u) throw new AuthError("USER_NOT_FOUND", MESSAGES.USER_NOT_FOUND);
  return { email: u.email, emailVerified: !!u.emailVerified };
}

export const auth = {
  subscribe(l: (u: AuthUser | null) => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },

  async current(): Promise<AuthUser | null> {
    return toUser(await load());
  },

  async signUp(email: string, password: string): Promise<AuthUser> {
    const t = await call<TokenResponse>(`${ID}/accounts:signUp?key=${FIREBASE_API_KEY}`, { email: email.trim(), password, returnSecureToken: true });
    const s = await fromTokens(t);
    await save(s);
    await this.sendVerification().catch(() => {});
    return toUser(s)!;
  },

  async signIn(email: string, password: string): Promise<AuthUser> {
    const t = await call<TokenResponse>(`${ID}/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, { email: email.trim(), password, returnSecureToken: true });
    const s = await fromTokens(t);
    await save(s);
    return toUser(s)!;
  },

  async signOut() {
    await save(null);
  },

  /** A fresh ID token, refreshed when within a minute of expiry. Null when signed out. */
  async idToken(): Promise<string | null> {
    const s = await load();
    if (!s) return null;
    if (Date.now() < s.expiresAt) return s.idToken;
    try {
      const res = await fetch(`${TOKEN}?key=${FIREBASE_API_KEY}`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(s.refreshToken)}` });
      const d = (await res.json()) as { id_token?: string; refresh_token?: string; expires_in?: string; error?: { message?: string } };
      if (!res.ok || !d.id_token) {
        const code = d.error?.message ?? "TOKEN_EXPIRED";
        if (["TOKEN_EXPIRED", "USER_NOT_FOUND", "USER_DISABLED", "INVALID_REFRESH_TOKEN"].includes(code)) await save(null);
        return null;
      }
      const next: Stored = { ...s, idToken: d.id_token, refreshToken: d.refresh_token ?? s.refreshToken, expiresAt: Date.now() + (Number(d.expires_in ?? 3600) - 60) * 1000 };
      await save(next);
      return next.idToken;
    } catch {
      // Offline: the old token may still be accepted by a server with clock
      // skew tolerance; the caller treats a 401 as "re-check later".
      return s.idToken;
    }
  },

  /** Re-reads the account (email verification flips here after the link is clicked). */
  async refreshUser(): Promise<AuthUser | null> {
    const s = await load();
    if (!s) return null;
    const token = await this.idToken();
    if (!token) return toUser(await load());
    try {
      const info = await lookup(token);
      const next = { ...(await load())!, email: info.email, emailVerified: info.emailVerified };
      await save(next);
      return toUser(next);
    } catch {
      return toUser(s);
    }
  },

  async sendVerification() {
    const token = await this.idToken();
    if (!token) throw new AuthError("INVALID_ID_TOKEN", MESSAGES.INVALID_ID_TOKEN);
    await call(`${ID}/accounts:sendOobCode?key=${FIREBASE_API_KEY}`, { requestType: "VERIFY_EMAIL", idToken: token });
  },

  async sendPasswordReset(email: string) {
    await call(`${ID}/accounts:sendOobCode?key=${FIREBASE_API_KEY}`, { requestType: "PASSWORD_RESET", email: email.trim() });
  },

  /** Deletes the Firebase account. The caller deletes the GaitAI ledger record first. */
  async deleteAccount() {
    const token = await this.idToken();
    if (!token) throw new AuthError("INVALID_ID_TOKEN", MESSAGES.INVALID_ID_TOKEN);
    await call(`${ID}/accounts:delete?key=${FIREBASE_API_KEY}`, { idToken: token });
    await save(null);
  },
};

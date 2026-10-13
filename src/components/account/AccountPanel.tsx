"use client";

/**
 * THE ACCOUNT PANEL — sign in or register with email and password (Firebase
 * Authentication, the same accounts the Android apps use), then see each
 * product's subscription, start a checkout, cancel at period end and read
 * billing history. Every verdict comes from the billing Worker; the browser
 * holds nothing but the Firebase session.
 *
 * Checkout opens the Worker's hosted page in a new tab; when it reports a
 * result (postMessage to window.opener) the panel re-reads the account.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import styles from "@/components/care/care.module.css";
import panel from "./account.module.css";
import { productApps, type ProductAppId } from "@/data/product-apps";
import { BILLING_API_URL, androidHref, disclosures, plansFor } from "@/data/subscriptions";

type Cycle = "monthly" | "annual";
interface Entitlement { entitled: boolean; state: string; until: number | null; subscriptionId: string | null; cycle: Cycle | null; renewsAt: number | null; cancelAtCycleEnd: boolean; reason: string }
interface Subscription { id: string; product: ProductAppId; cycle: Cycle; status: string; currentEnd: number | null; renewsAt: number | null; paidCount: number; cancelAtCycleEnd: boolean; plan: { label: string; amount: string } }
interface Me { account: { email: string; emailVerified: boolean }; mode: "razorpay" | "sandbox"; paymentsActive: boolean; entitlements: Record<ProductAppId, Entitlement>; subscriptions: Subscription[]; tax: { text: string } }
interface Payment { id: string; amount: number; currency: string; status: string; method: string | null; invoiceId: string | null; at: number }

const PRODUCTS: ProductAppId[] = ["mobilitycare", "securevision"];
const fmtDate = (unix: number | null | undefined) => (unix ? new Date(unix * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—");
const fmtInr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const authMessage = (code: string) =>
  ({
    "auth/email-already-in-use": "An account with this email already exists. Sign in instead.",
    "auth/invalid-credential": "The email or password is not right.",
    "auth/wrong-password": "The email or password is not right.",
    "auth/user-not-found": "No account with this email.",
    "auth/invalid-email": "That does not look like an email address.",
    "auth/weak-password": "Choose a longer password (at least 8 characters).",
    "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
  })[code] ?? "Something went wrong. Try again.";

async function api<T>(path: string, user: User, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  headers.set("x-gaitai-client", "web");
  if (init.json !== undefined) headers.set("content-type", "application/json");
  const res = await fetch(`${BILLING_API_URL}${path}`, { ...init, headers, body: init.json !== undefined ? JSON.stringify(init.json) : init.body });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(typeof data.message === "string" ? data.message : typeof data.error === "string" ? data.error : `HTTP ${res.status}`);
  return data as T;
}

export function AccountPanel() {
  const params = useSearchParams();
  const wantedProduct = params.get("product") as ProductAppId | null;
  const wantedPlan = (params.get("plan") as Cycle | null) ?? "annual";
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [mode, setMode] = useState<"signin" | "register" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  const load = useCallback(async (u: User) => {
    setApiError(null);
    try {
      const [m, h] = await Promise.all([api<Me>("/v1/me", u), api<{ payments: Payment[] }>("/v1/billing/history", u)]);
      setMe(m);
      setPayments(h.payments);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => { if (user) load(user); else { setMe(null); setPayments(null); } }, [user, load]);

  // The hosted checkout tab reports back here.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { type?: string; status?: string } | null;
      if (d?.type === "gaitai-checkout" && user) {
        setNotice(d.status === "verified" ? "Payment verified. Your subscription is active." : d.status === "failed" ? "The payment did not go through. Nothing was charged." : "Checkout closed.");
        load(user);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [user, load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    try {
      if (mode === "signin") await signInWithEmailAndPassword(auth, email.trim(), password);
      else if (mode === "register") {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await sendEmailVerification(cred.user).catch(() => {});
        setNotice(`Account created. We sent a verification link to ${email.trim()}; verify it before subscribing.`);
      } else {
        await sendPasswordResetEmail(auth, email.trim());
        setNotice("If an account exists for that email, a reset link is on its way.");
      }
    } catch (err) {
      setError(authMessage((err as { code?: string }).code ?? ""));
    } finally { setBusy(false); }
  };

  const checkout = async (product: ProductAppId, cycle: Cycle) => {
    if (!user) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const co = await api<{ checkoutUrl: string }>("/v1/checkout", user, { method: "POST", json: { product, cycle } });
      const win = window.open(co.checkoutUrl, "_blank", "noopener=false");
      if (!win) setNotice("Your browser blocked the checkout window. Allow pop-ups for gaitai.in and try again.");
      else setNotice("Checkout opened in a new tab. This page updates when it finishes.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const cancel = async (sub: Subscription) => {
    if (!user) return;
    if (!window.confirm(`Cancel the ${productApps[sub.product].name} subscription at the end of the paid period (${fmtDate(sub.currentEnd)})? No further charges will be taken.`)) return;
    setBusy(true); setError(null);
    try { await api(`/v1/subscriptions/${sub.id}/cancel`, user, { method: "POST", json: { at_cycle_end: true } }); setNotice("Cancelled. Access continues until the end of the paid period."); await load(user); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const verifiedNotice = useMemo(() => (user && !user.emailVerified ? "Verify your email before subscribing — tap the link we sent, then reload this page." : null), [user]);

  return (
    <div className={panel.root}>
      <div>
        {user === undefined ? <p className={styles.small}>Checking your session…</p> : null}

        {user === null ? (
          <div className={styles.downloadGrid}>
            <section className={styles.releaseCard} aria-labelledby="account-auth-title">
              <h2 id="account-auth-title">{mode === "signin" ? "Sign in" : mode === "register" ? "Create your account" : "Reset your password"}</h2>
              <form onSubmit={submit} className={panel.form}>
                <label className={panel.field}><span>Email</span><input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                {mode !== "reset" ? <label className={panel.field}><span>Password</span><input type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={mode === "register" ? 8 : 6} value={password} onChange={(e) => setPassword(e.target.value)} /></label> : null}
                {error ? <p className={panel.error} role="alert">{error}</p> : null}
                {notice ? <p className={panel.notice} role="status">{notice}</p> : null}
                <div className={styles.actions}>
                  <button type="submit" className={styles.primary} disabled={busy}>{mode === "signin" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}</button>
                  {mode !== "signin" ? <button type="button" className={styles.secondary} onClick={() => { setMode("signin"); setError(null); }}>Back to sign in</button> : null}
                </div>
              </form>
              {mode === "signin" ? (
                <p className={styles.small}>
                  <button type="button" className={panel.linkButton} onClick={() => setMode("register")}>Create an account</button> · <button type="button" className={panel.linkButton} onClick={() => setMode("reset")}>Forgotten your password?</button>
                </p>
              ) : null}
              <p className={styles.small}>Your email and subscription records are kept by GaitAI; payments are processed by Razorpay. GaitAI never stores card numbers.</p>
            </section>
            <section className={styles.instructions} aria-labelledby="account-how-title">
              <h2 id="account-how-title">How it works</h2>
              <ol>
                <li>Download the Android app for <Link href={androidHref("mobilitycare")}>MobilityCare</Link> or <Link href={androidHref("securevision")}>SecureVision</Link>. Installing is free.</li>
                <li>Create one GaitAI account and verify your email.</li>
                <li>Choose a monthly or annual plan here or in the app and pay through the secure checkout.</li>
                <li>Features unlock when the payment is confirmed. Sign in on any phone to restore them.</li>
              </ol>
              <p>{disclosures.separate} {disclosures.cancellation}</p>
            </section>
          </div>
        ) : null}

        {user ? (
          <>
            <section className={styles.releaseCard} aria-labelledby="account-status-title" style={{ marginBottom: 40 }}>
              <h2 id="account-status-title">Signed in</h2>
              <p>{user.email}{user.emailVerified ? " · verified" : " · not verified"}</p>
              {verifiedNotice ? <p className={panel.notice}>{verifiedNotice} <button type="button" className={panel.linkButton} onClick={() => sendEmailVerification(user).then(() => setNotice("Verification email sent.")).catch(() => setError("Could not send the email. Try again shortly."))}>Resend link</button></p> : null}
              {apiError ? <p className={panel.error}>GaitAI could not be reached: {apiError}</p> : null}
              {notice && !verifiedNotice ? <p className={panel.notice} role="status">{notice}</p> : null}
              {error ? <p className={panel.error} role="alert">{error}</p> : null}
              {me && !me.paymentsActive ? <p className={panel.notice}>Subscriptions are not open yet. The plans below are the announced prices; payments are not switched on.</p> : null}
              <div className={styles.actions}>
                <button type="button" className={styles.secondary} onClick={() => signOut(auth)}>Sign out</button>
                <button type="button" className={styles.secondary} onClick={() => load(user)}>Refresh</button>
              </div>
            </section>

            <div className={panel.products}>
              {PRODUCTS.map((product) => {
                const app = productApps[product];
                const ent = me?.entitlements[product];
                const sub = me?.subscriptions.find((s) => s.id === ent?.subscriptionId) ?? me?.subscriptions.find((s) => s.product === product);
                const plans = plansFor(product);
                const highlight = wantedProduct === product;
                return (
                  <section key={product} className={`${styles.releaseCard} ${highlight ? panel.wanted : ""}`} aria-labelledby={`${product}-sub-title`}>
                    <h2 id={`${product}-sub-title`}>{app.name}</h2>
                    <p>{ent ? (ent.entitled ? `Active${ent.cycle ? ` · ${ent.cycle}` : ""}. ${ent.cancelAtCycleEnd ? `Access ends ${fmtDate(ent.until)}.` : ent.renewsAt ? `Renews ${fmtDate(ent.renewsAt)}.` : ""}` : ent.state === "none" ? "No subscription." : ent.reason) : "Loading…"}</p>
                    {sub ? (
                      <dl>
                        <dt>Plan</dt><dd>{sub.plan.label} · {sub.plan.amount}</dd>
                        <dt>Status</dt><dd>{sub.status}{sub.cancelAtCycleEnd ? " (ends at period end)" : ""}</dd>
                        <dt>Paid until</dt><dd>{fmtDate(sub.currentEnd)}</dd>
                        <dt>Payments</dt><dd>{sub.paidCount}</dd>
                      </dl>
                    ) : null}
                    {ent?.entitled && sub && !sub.cancelAtCycleEnd ? (
                      <div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => cancel(sub)} disabled={busy}>Cancel at period end</button></div>
                    ) : null}
                    {!ent?.entitled ? (
                      <div className={panel.planRow}>
                        {plans.map((p) => (
                          <button key={p.id} type="button" className={p.cycle === wantedPlan && highlight ? styles.primary : styles.secondary} disabled={busy || !me?.paymentsActive || !user.emailVerified} onClick={() => checkout(product, p.cycle)}>
                            {p.label} · {p.amount}{p.highlight ? ` · save ${p.savingsPercent}%` : ""}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <p className={styles.small}>{me?.tax.text}</p>
                    <div className={styles.legalLinks}><Link href={`${app.productHref}#pricing`}>Plans</Link><Link href={androidHref(product)}>Android app</Link></div>
                  </section>
                );
              })}
            </div>

            <section className={styles.instructions} aria-labelledby="account-history-title" style={{ marginTop: 40 }}>
              <h2 id="account-history-title">Billing history</h2>
              {payments === null ? <p>Loading…</p> : payments.length === 0 ? <p>No payments yet.</p> : (
                <table className={panel.table}>
                  <thead><tr><th>Date</th><th>Amount</th><th>Status</th><th>Method</th><th>Invoice</th></tr></thead>
                  <tbody>{payments.map((p) => <tr key={p.id}><td>{new Date(p.at * 1000).toLocaleString("en-IN")}</td><td>{fmtInr(p.amount)}</td><td>{p.status}</td><td>{p.method ?? "—"}</td><td>{p.invoiceId ?? p.id}</td></tr>)}</tbody>
                </table>
              )}
              <p>{disclosures.refunds}</p>
              <div className={styles.legalLinks}><Link href="/legal/terms/#subscriptions">Subscription terms</Link><Link href="/legal/privacy/">Privacy policy</Link><a href="mailto:support@gaitai.in?subject=GaitAI%20subscription">Contact support</a></div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

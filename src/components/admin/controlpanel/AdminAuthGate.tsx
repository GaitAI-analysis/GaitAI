"use client";

/**
 * Google sign-in gate for the admin control panel.
 *
 * Renders its children ONLY for a signed-in Google account on the moderator
 * allowlist (src/lib/comments/config.ts → ADMIN_EMAILS, mirrored in
 * firestore.rules). Everyone else sees a sign-in / not-authorized screen.
 * The verified admin email is passed to children so writes can be attributed.
 */

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { AlertTriangle, LogOut, ShieldCheck } from "lucide-react";
import { auth, googleProvider } from "@/lib/firebase";
import { isAdminEmail } from "@/lib/comments/config";
import { Logo } from "@/components/ui/Logo";

type Phase = "loading" | "signed-out" | "denied" | "authorized";

export function AdminAuthGate({
  children,
}: {
  children: (adminEmail: string) => React.ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setPhase("signed-out");
      else if (isAdminEmail(u.email)) setPhase("authorized");
      else setPhase("denied");
    });
  }, []);

  async function handleSignIn() {
    setError(null);
    setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setError(
        code === "auth/popup-closed-by-user"
          ? "Sign-in was cancelled."
          : code === "auth/unauthorized-domain"
            ? "This domain isn't authorized in Firebase Auth settings."
            : "Sign-in failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
  }

  if (phase === "authorized" && user?.email) {
    return (
      <>
        <SignedInBar email={user.email} onSignOut={handleSignOut} />
        {children(user.email)}
      </>
    );
  }

  return (
    <div className="site-viewport-section relative grid w-full place-items-center px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(34,211,238,0.08),transparent_70%)]"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <div className="flex justify-center">
          <Logo />
        </div>
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-cyan-300/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300 ring-1 ring-cyan-300/30">
          <ShieldCheck className="h-3 w-3" />
          Control Panel
        </span>

        {phase === "loading" && (
          <p className="mt-6 text-sm text-soft-mute">Checking your session…</p>
        )}

        {phase === "signed-out" && (
          <>
            <h1 className="mt-6 font-display text-xl font-semibold text-soft-white">
              Moderator sign-in
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-soft-gray">
              Sign in with an authorized Google account to manage content and
              moderate community comments.
            </p>
            <button
              onClick={handleSignIn}
              disabled={busy}
              className="mt-7 inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-soft-white transition-all hover:border-white/25 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleGlyph />
              {busy ? "Opening Google…" : "Continue with Google"}
            </button>
          </>
        )}

        {phase === "denied" && (
          <>
            <div className="mt-6 flex justify-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-amber-300/10 text-amber-300 ring-1 ring-amber-300/30">
                <AlertTriangle className="h-5 w-5" />
              </span>
            </div>
            <h1 className="mt-4 font-display text-xl font-semibold text-soft-white">
              Not authorized
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-soft-gray">
              <span className="text-soft-white">{user?.email}</span> isn&apos;t on
              the moderator allowlist. Ask an existing admin to add you, then
              sign in again.
            </p>
            <button
              onClick={handleSignOut}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-soft-white transition-all hover:border-white/25 hover:bg-white/[0.08]"
            >
              <LogOut className="h-4 w-4" />
              Sign out & switch account
            </button>
          </>
        )}

        {error && (
          <p className="mt-4 text-xs text-rose-300/90">{error}</p>
        )}
      </div>
    </div>
  );
}

function SignedInBar({
  email,
  onSignOut,
}: {
  email: string;
  onSignOut: () => void;
}) {
  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-white/10 bg-obsidian/70 px-2.5 py-1.5 text-[11px] text-soft-gray shadow-lg backdrop-blur-md">
      <span className="hidden items-center gap-1.5 sm:inline-flex">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="text-soft-white">{email}</span>
      </span>
      <button
        onClick={onSignOut}
        title="Sign out"
        className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-2 py-1 text-soft-mute transition-colors hover:bg-white/[0.1] hover:text-soft-white"
      >
        <LogOut className="h-3 w-3" />
        Sign out
      </button>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.1s2.69-6.1 6-6.1c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.9 3.86 14.68 3 12 3 6.98 3 3 6.98 3 12s3.98 9 9 9c5.2 0 8.64-3.66 8.64-8.8 0-.59-.06-1.04-.14-1.5H12z"
      />
    </svg>
  );
}

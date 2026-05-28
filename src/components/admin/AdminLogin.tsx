"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Invalid password");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative grid min-h-screen w-full place-items-center overflow-hidden px-5 pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-radial-glow opacity-60 blur-3xl" />
      </div>
      <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="card relative w-full max-w-md overflow-hidden p-8 sm:p-10"
      >
        <div className="ring-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative">
          <Logo />
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-cyan-300/[0.08] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-300 ring-1 ring-cyan-300/25">
            <ShieldCheck className="h-3 w-3" />
            Internal · Admin only
          </div>
          <h1 className="mt-4 font-display text-3xl text-soft-white">
            Sign in to GaitAI
          </h1>
          <p className="mt-2 text-sm text-soft-mute">
            Manage publications, research notes, documentation and approvals.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-soft-mute">
                Admin password
              </span>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-soft-mute" />
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] py-3 pl-9 pr-3 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
                />
              </div>
            </label>

            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-400/[0.06] px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-[11px] text-soft-mute">
            Default password is{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-cyan-300">
              gaitai-admin
            </code>
            . Override by setting{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-cyan-300">
              ADMIN_PASSWORD
            </code>{" "}
            in your env.
          </p>
        </div>
      </motion.div>
    </section>
  );
}

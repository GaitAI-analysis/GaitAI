"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Trophy,
  Watch,
} from "lucide-react";

const interests = [
  { id: "mobilitycare", label: "MobilityCare pilot", icon: HeartPulse },
  { id: "securevision", label: "SecureVision pilot", icon: ShieldCheck },
  { id: "watchcare", label: "WatchCare program", icon: Watch },
  { id: "sports", label: "Sports academy", icon: Trophy },
  { id: "enterprise", label: "Enterprise deployment", icon: Building2 },
  { id: "research", label: "Research / Investor", icon: Sparkles },
];

export function CTA() {
  const [picked, setPicked] = useState<string>("mobilitycare");
  const [sent, setSent] = useState(false);

  return (
    <section id="contact" className="section relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-radial-glow opacity-50 blur-3xl" />
      </div>

      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-8 sm:p-14 lg:p-20"
        >
          <div className="ring-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="noise" />

          <div className="relative grid gap-12 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <span className="eyebrow">
                <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                Request a demo · Start a pilot · Partner with us
              </span>
              <h2 className="mt-5 font-display text-display-lg text-balance text-soft-white">
                Bring movement intelligence to your{" "}
                <span className="text-gradient">organization.</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-soft-gray">
                Whether you&apos;re a hospital, physiotherapy clinic, sports
                academy, elderly-care home, enterprise security team, smart-city
                operator or research collaborator — let&apos;s talk about deploying
                GaitAI where it matters most.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <div className="flex -space-x-2">
                  {["#4FD1FF", "#2563FF", "#7C3AED"].map((c) => (
                    <span
                      key={c}
                      className="h-9 w-9 rounded-full border-2 border-obsidian"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="text-sm text-soft-mute">
                  <div className="text-soft-white">Trusted by pioneers</div>
                  in healthcare, security and smart-infrastructure
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="relative rounded-2xl border border-white/8 bg-obsidian-200/70 p-6 backdrop-blur-xl sm:p-8"
            >
              <div className="grid gap-2">
                <label className="text-xs font-medium uppercase tracking-[0.16em] text-soft-mute">
                  I’m interested in
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {interests.map((opt) => {
                    const Icon = opt.icon;
                    const active = picked === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setPicked(opt.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all ${
                          active
                            ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-300"
                            : "border-white/10 bg-white/[0.02] text-soft-mute hover:border-white/20 hover:text-soft-white"
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Field label="Full name" type="text" placeholder="Anubha Parashar" />
                <Field label="Work email" type="email" placeholder="you@org.com" />
              </div>
              <div className="mt-3">
                <Field label="Organization" type="text" placeholder="Hospital / Agency / Company" />
              </div>
              <div className="mt-3">
                <label className="text-xs font-medium uppercase tracking-[0.16em] text-soft-mute">
                  How can we help?
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us about the environment, scale and intended outcome."
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
                />
              </div>

              <button type="submit" className="btn-primary mt-6 w-full">
                {sent ? (
                  <>
                    <Check className="h-4 w-4" />
                    We&apos;ll be in touch
                  </>
                ) : (
                  <>
                    Request a demo
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-[11px] text-soft-mute">
                By submitting, you agree to our terms & privacy. We&apos;ll only
                use your details to respond.
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Field({
  label,
  type,
  placeholder,
}: {
  label: string;
  type: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-[0.16em] text-soft-mute">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
      />
    </div>
  );
}

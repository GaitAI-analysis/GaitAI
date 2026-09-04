"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { type FormEvent, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { PILOT_SCOPE } from "@/data/trust";
import { ctas } from "@/data/content";
import { SubscribeForm } from "@/components/subscribe/SubscribeForm";

const interestGroups = [
  {
    label: "MobilityCare",
    options: [
      "Clinical gait & mobility",
      "Fall-risk & elderly care",
      "Rehabilitation & recovery",
      "Neurological movement",
      "Wearable mobility monitoring",
      "Sports performance",
    ],
  },
  {
    label: "SecureVision",
    options: [
      "Surveillance & security",
      "Crowd intelligence",
      "Public safety",
      "Enterprise deployment",
    ],
  },
  {
    label: "Research & Growth",
    options: ["Research collaboration", "Investment / partnership"],
  },
];

export function CTA() {
  const [selectedInterest, setSelectedInterest] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    setSubmissionStatus("sending");

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: new FormData(form),
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Form submission failed");
      }

      form.reset();
      setSelectedInterest("");
      setSubmissionStatus("success");
    } catch {
      setSubmissionStatus("error");
    }
  }

  return (
    <section id="contact" className="relative w-full overflow-hidden py-10 sm:py-14 lg:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-radial-glow opacity-50 blur-3xl" />
      </div>

      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-7 sm:p-10 lg:p-12"
        >
          <div className="ring-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="noise" />

          <div className="relative grid gap-10 lg:grid-cols-[43fr_57fr] lg:gap-12">
            <div className="min-w-0">
              <span className="eyebrow">
                <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                {ctas.demo.label} · {ctas.pilot.label} · {ctas.research.label}
              </span>
              <h2 className="mt-4 font-display text-[clamp(2rem,3vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-balance text-soft-white">
                Bring movement intelligence to{" "}
                <span className="text-gradient">your organization.</span>
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-soft-gray">
                Tell us about the environment and the outcome that matters
                there, and we&apos;ll map the right product mix.
              </p>

              {/* Previously "Trusted by pioneers in healthcare, security and
                  smart-infrastructure", next to three avatar circles. There is
                  no named customer or deployment to support that, so it now
                  states what the platform is built for and what a pilot
                  actually looks like. */}
              <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                <div className="text-sm font-semibold text-soft-white">
                  Built for healthcare, mobility and public-safety environments
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-soft-mute">
                  A pilot is scoped around one environment and the modules it
                  needs. {PILOT_SCOPE}{" "}
                  <Link
                    href="/products#deploy"
                    className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 transition-colors hover:text-cyan-200"
                  >
                    See how deployment works
                  </Link>
                  .
                </p>
              </div>

              {/* The other thing a visitor can say yes to. Directly under the
                  deployment card, at the same column width, as a lighter
                  section rather than a second card — the reader who is not
                  ready to ask for a pilot is exactly the reader worth
                  offering the writing to, and this is the only place on the
                  site the signup now appears. */}
              <SubscribeForm variant="contact" className="mt-10" />
            </div>

            <form
              action="https://formspree.io/f/xzebbzed"
              method="POST"
              onSubmit={handleSubmit}
              className="relative w-full min-w-0 rounded-2xl border border-white/8 bg-obsidian-200/70 p-6 backdrop-blur-xl sm:p-8"
            >
              <div className="grid gap-2">
                <label
                  htmlFor="interest"
                  className="text-xs font-medium uppercase tracking-[0.16em] text-soft-mute"
                >
                  I’m interested in
                </label>
                <div className="relative mt-1">
                  <select
                    id="interest"
                    name="interest"
                    value={selectedInterest}
                    onChange={(event) =>
                      setSelectedInterest(event.currentTarget.value)
                    }
                    className={`h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.02] px-4 pr-11 text-sm focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15 ${
                      selectedInterest ? "text-soft-white" : "text-soft-mute"
                    }`}
                  >
                    <option value="" disabled className="bg-obsidian-200">
                      Select an area of interest
                    </option>
                    {interestGroups.map((group) => (
                      <optgroup
                        key={group.label}
                        label={group.label}
                        className="bg-obsidian-200 text-soft-white"
                      >
                        {group.options.map((option) => (
                          <option
                            key={option}
                            value={option}
                            className="bg-obsidian-200 text-soft-white"
                          >
                            {option}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-soft-mute"
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Field
                  label="Full name"
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  required
                />
                <Field
                  label="Work email"
                  name="email"
                  type="email"
                  placeholder="you@org.com"
                  required
                />
              </div>
              <div className="mt-3">
                <Field
                  label="Organization"
                  name="organization"
                  type="text"
                  placeholder="Hospital / Agency / Company"
                />
              </div>
              <div className="mt-3">
                <label
                  htmlFor="cta-message"
                  className="text-xs font-medium uppercase tracking-[0.16em] text-soft-mute"
                >
                  How can we help?
                </label>
                <textarea
                  id="cta-message"
                  name="message"
                  rows={3}
                  placeholder="Tell us about the environment, scale and intended outcome."
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
                />
              </div>

              <button
                type="submit"
                disabled={submissionStatus === "sending"}
                className="btn-primary mt-6 w-full"
              >
                {submissionStatus === "sending" ? (
                  "Sending..."
                ) : (
                  <>
                    {ctas.demo.label}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {submissionStatus === "success" && (
                <p
                  role="status"
                  aria-live="polite"
                  className="mt-3 text-center text-sm text-soft-white"
                >
                  Thanks — your request has been received. We&rsquo;ll be in touch
                  soon.
                </p>
              )}

              {submissionStatus === "error" && (
                <p
                  role="alert"
                  className="mt-3 text-center text-sm text-soft-white"
                >
                  Something went wrong. Please try again.
                </p>
              )}

              {/* Linked, not just named — and it says what we do with the
                  details rather than gesturing at a policy. */}
              <p className="mt-3 text-center text-[11px] leading-relaxed text-soft-mute">
                By submitting, you agree to our{" "}
                <Link
                  href="/legal/privacy"
                  className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 transition-colors hover:text-cyan-200"
                >
                  Privacy Policy
                </Link>
                . We&apos;ll use your details to respond to your request.
                Please don&apos;t include health or clinical information.
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
  name,
  type,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  required?: boolean;
}) {
  // The label is bound to the input by id — without htmlFor/id, screen
  // readers announced these fields with no name at all.
  const id = `cta-${name}`;

  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-[0.16em] text-soft-mute"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
      />
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { type FormEvent, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";

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
              action="https://formspree.io/f/xzebbzed"
              method="POST"
              onSubmit={handleSubmit}
              className="relative rounded-2xl border border-white/8 bg-obsidian-200/70 p-6 backdrop-blur-xl sm:p-8"
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
                <label className="text-xs font-medium uppercase tracking-[0.16em] text-soft-mute">
                  How can we help?
                </label>
                <textarea
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
                    Request a demo
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
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-[0.16em] text-soft-mute">
        {label}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
      />
    </div>
  );
}

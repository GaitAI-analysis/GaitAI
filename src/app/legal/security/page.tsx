import type { Metadata } from "next";
import Link from "next/link";
import { notClaimed, privacyControls } from "@/data/trust";

export const metadata: Metadata = {
  alternates: { canonical: "/legal/security" },
  title: "Security & privacy controls",
  description:
    "What GaitAI's architecture supports, control by control: processing location, non-identifying modes, face blur, retention, role-based access, audit logs, consent and biometric governance — and what is explicitly not claimed.",
};

/**
 * Technical control documentation for security and privacy reviewers.
 *
 * Every entry comes from `privacyControls` in src/data/trust.ts, which
 * restates what the product architecture already documents (PrivacyGuard and
 * its detail page, the shared privacy notes, the patent's edge pipeline).
 * Language is capability-only — "supports", "designed for", "configurable" —
 * and `notClaimed` is rendered in full, because a reviewer is better served
 * by a plain statement of what is absent than by silence.
 */
export default function SecurityPage() {
  return (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
        Security &amp; privacy controls
      </div>
      <h1 className="mt-4 font-display text-display-md text-soft-white">
        What the architecture supports
      </h1>
      <p className="mt-6 text-soft-gray">
        GaitAI processes human movement, so privacy and access control are part
        of the pipeline rather than a layer on top of it. This page documents
        what the architecture supports, control by control, in the language a
        security or procurement reviewer needs: what is available, what is
        configurable, and what remains the deploying organisation&apos;s
        decision.
      </p>

      <p className="mt-8 text-[13.5px] leading-relaxed text-soft-mute">
        Evidence, privacy, security and responsible deployment are collected
        together in the{" "}
        <a className="text-cyan-300 transition-colors hover:text-cyan-200" href="/trust/">
          Trust Center
        </a>
        .
      </p>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        Control areas
      </h2>
      <dl className="mt-6 border-t border-white/[0.08]">
        {privacyControls.map((control) => (
          <div key={control.topic} className="border-b border-white/[0.08] py-5">
            <dt className="text-sm font-semibold text-soft-white">
              {control.topic}
            </dt>
            <dd className="mt-1.5 text-[13.5px] leading-relaxed text-soft-gray">
              {control.support}
              <span className="mt-2 block text-[11px] uppercase tracking-[0.14em] text-soft-mute">
                Documented in: {control.source}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        This website
      </h2>
      <p className="mt-4 text-soft-gray">
        Separate from the product controls above, here is what the site itself
        runs on — verified against the code rather than described in general
        terms.
      </p>
      <dl className="mt-6 border-t border-white/[0.08]">
        {[
          {
            topic: "Static delivery",
            detail:
              "The site is pre-rendered to static files and served over HTTPS. There is no application server handling your page requests and no visitor database.",
          },
          {
            topic: "No analytics or tracking",
            detail:
              "No analytics platform, tag manager, advertising pixel or session-recording script is present. Visits are not measured.",
          },
          {
            topic: "Form submissions",
            detail:
              "Demo and contact requests are delivered by Formspree, a third-party form processor. Fields are interest, name, work email, organization and message — no health or clinical data is requested.",
          },
          {
            topic: "Comments",
            detail:
              "Comment areas store a display name, message, optional email and moderation state in Google Firebase (Firestore), with access governed by Firestore security rules. Submission is gated by a Cloudflare Turnstile bot check.",
          },
          {
            topic: "Administration",
            detail:
              "The content control panel is behind Firebase Authentication and is not reachable without a credential.",
          },
          {
            topic: "Browser storage",
            detail:
              "Only your light/dark theme choice is stored locally, by next-themes. No tracking cookie is set.",
          },
        ].map((item) => (
          <div key={item.topic} className="border-b border-white/[0.08] py-5">
            <dt className="text-sm font-semibold text-soft-white">
              {item.topic}
            </dt>
            <dd className="mt-1.5 text-[13.5px] leading-relaxed text-soft-gray">
              {item.detail}
            </dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        What GaitAI does not claim
      </h2>
      <p className="mt-4 text-soft-gray">
        Stated explicitly so nothing above is read as more than it is. GaitAI
        does not currently hold or assert:
      </p>
      <ul className="mt-5 space-y-2.5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.03] p-5 sm:p-6">
        {notClaimed.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-soft-gray"
          >
            <span
              aria-hidden="true"
              className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300/60"
            />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-[13.5px] leading-relaxed text-soft-mute">
        Where a control needs to meet a specific regulatory obligation in your
        jurisdiction, that is a deployment conversation — the lawful basis,
        consent management and data-protection assessment stay with the
        deploying organisation.
      </p>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        Related reading
      </h2>
      <ul className="mt-4 space-y-2 text-[13.5px] text-soft-gray">
        <li>
          <Link
            className="text-cyan-300 transition-colors hover:text-cyan-200"
            href="/securevision#privacyguard"
          >
            PrivacyGuard
          </Link>{" "}
          — where these controls are applied in the SecureVision pipeline.
        </li>
        <li>
          <Link
            className="text-cyan-300 transition-colors hover:text-cyan-200"
            href="/securevision/privacyguard/"
          >
            PrivacyGuard technical view
          </Link>{" "}
          — pipeline stages, output schema and documented limitations.
        </li>
        <li>
          <Link
            className="text-cyan-300 transition-colors hover:text-cyan-200"
            href="/legal/responsible-ai"
          >
            Responsible AI
          </Link>{" "}
          — how identity-bearing capabilities are governed.
        </li>
        <li>
          <Link
            className="text-cyan-300 transition-colors hover:text-cyan-200"
            href="/products#deploy"
          >
            Deploy GaitAI
          </Link>{" "}
          — inputs, outputs, integration and pilot shape.
        </li>
      </ul>

      <p className="mt-10 text-soft-gray">
        Enterprise deployments receive deployment-specific documentation. For
        details contact{" "}
        <a
          className="text-cyan-300 transition-colors hover:text-cyan-200"
          href="mailto:security@gaitai.com"
        >
          security@gaitai.com
        </a>
        .
      </p>
    </>
  );
}

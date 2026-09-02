import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Responsible AI",
  description:
    "How GaitAI governs movement intelligence: identity-free capabilities by default, lawful authority for biometric and watchlist use, explainable outputs and no overclaiming.",
};

export default function ResponsibleAIPage() {
  return (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
        Legal · Responsible AI
      </div>
      <h1 className="mt-4 font-display text-display-md text-soft-white">
        Responsible AI commitment
      </h1>

      <p className="mt-6 text-soft-gray">
        GaitAI reads human movement, which makes restraint part of the product
        rather than a caveat attached to it. SecureVision leads with anomaly
        detection, crowd flow, worker safety and post-event investigation —
        capabilities that do not require identification. Biometric,
        re-identification and watchlist capabilities deploy only with lawful
        authority, consent and a full audit trail.
      </p>

      <p className="mt-4 text-soft-gray">
        PrivacyGuard, the privacy-preserving analytics layer, is enabled by
        default across SecureVision deployments: skeleton-only analytics,
        optional face blur applied before analytics, role-based access,
        configurable retention and exportable audit logs. It is privacy-aware
        architecture — it minimises identifiable data and governs access — and
        not a guarantee of anonymity.
      </p>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        Where the boundaries sit
      </h2>
      <ul className="mt-5 space-y-3 text-[13.5px] leading-relaxed text-soft-gray">
        <li>
          <span className="font-semibold text-soft-white">
            Decision support, not decisions.
          </span>{" "}
          MobilityCare outputs are assessment and monitoring metrics; they do
          not diagnose medical conditions and do not replace clinical
          judgement. SecureVision surfaces movement events for a trained
          operator to review — it detects patterns, not intent.
        </li>
        <li>
          <span className="font-semibold text-soft-white">
            Explainable by construction.
          </span>{" "}
          Every score is built from named movement features, so the person
          acting on it can see what moved the number.
        </li>
        <li>
          <span className="font-semibold text-soft-white">
            No overclaiming.
          </span>{" "}
          GaitAI claims no compliance certification, clinical approval or
          measured accuracy figure. Example values shown on product pages are
          labelled as illustrative report values, and what the research record
          does not cover is stated on the{" "}
          <Link
            className="text-cyan-300 transition-colors hover:text-cyan-200"
            href="/research#areas"
          >
            research page
          </Link>
          .
        </li>
        <li>
          <span className="font-semibold text-soft-white">
            Lawful basis stays with the deployer.
          </span>{" "}
          Controls govern the GaitAI pipeline; consent management, lawful basis
          and data-protection assessment remain the deploying
          organisation&apos;s responsibility.
        </li>
      </ul>

      <p className="mt-10 text-soft-gray">
        The control-by-control documentation lives on the{" "}
        <Link
          className="text-cyan-300 transition-colors hover:text-cyan-200"
          href="/legal/security"
        >
          security &amp; privacy controls page
        </Link>
        . For anything else, contact{" "}
        <a
          className="text-cyan-300 transition-colors hover:text-cyan-200"
          href="mailto:responsible-ai@gaitai.com"
        >
          responsible-ai@gaitai.com
        </a>
        .
      </p>
    </>
  );
}

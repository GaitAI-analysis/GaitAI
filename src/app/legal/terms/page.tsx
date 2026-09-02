import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "Terms covering use of the GaitAI website, its research content and its comment areas, and the basis on which product information is published.",
};

/**
 * Written to cover what this website actually offers today: informational
 * content, a research library, a demo-request form and moderated comment
 * areas. It deliberately does not pretend to be a product licence or a
 * services agreement, because no product is sold through this site.
 *
 * TODO (needs the company's own legal input, not a guess):
 *   - registered entity name, address and governing jurisdiction
 *   - the pilot/evaluation agreement these terms should point to
 *   - liability, indemnity and dispute-resolution positions
 * Until those are settled this page states scope and limits truthfully rather
 * than presenting invented clauses.
 */
export default function TermsPage() {
  return (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
        Legal · Terms
      </div>
      <h1 className="mt-4 font-display text-display-md text-soft-white">
        Terms of use
      </h1>
      <p className="mt-6 text-soft-gray">
        These terms cover your use of this website. They are not a product
        licence and not a services agreement — nothing is sold or provisioned
        through this site. Any pilot or deployment is governed by a separate
        written agreement.
      </p>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        Using this site
      </h2>
      <ul className="mt-5 space-y-3 text-[13.5px] leading-relaxed text-soft-gray">
        <li>
          <span className="font-semibold text-soft-white">
            Informational content.
          </span>{" "}
          Product pages describe what GaitAI&apos;s modules are designed to do.
          Figures shown inside dashboards, reports and console visuals are
          illustrative synthetic values, labelled as such, and are not measured
          results.
        </li>
        <li>
          <span className="font-semibold text-soft-white">
            Not medical advice.
          </span>{" "}
          Nothing on this site is medical, clinical or diagnostic advice, and no
          GaitAI output diagnoses a condition. Clinical decisions remain with a
          qualified professional.
        </li>
        <li>
          <span className="font-semibold text-soft-white">
            Research content.
          </span>{" "}
          Papers listed in the{" "}
          <Link
            className="text-cyan-300 transition-colors hover:text-cyan-200"
            href="/publications"
          >
            research library
          </Link>{" "}
          remain the copyright of their publishers and authors. We link to the
          publisher of record; please obtain the work from there and cite it
          accordingly.
        </li>
        <li>
          <span className="font-semibold text-soft-white">Comments.</span>{" "}
          Where comments are enabled, keep them lawful and civil, and do not
          post personal, health or confidential information about yourself or
          anyone else. Comments are moderated and may be hidden or removed.
        </li>
        <li>
          <span className="font-semibold text-soft-white">
            Brand and content.
          </span>{" "}
          The GaitAI name, wordmark, product names and site content are ours.
          Please don&apos;t reproduce them in a way that suggests endorsement or
          affiliation.
        </li>
      </ul>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        Responsible-use conditions
      </h2>
      <p className="mt-4 text-soft-gray">
        Identity-related capabilities — re-identification, gait-assisted access
        control and watchlist matching — are offered only to lawful, authorized
        environments with appropriate access controls, governance and
        auditability, and are not offered for general-public surveillance. The
        conditions are set out in the{" "}
        <Link
          className="text-cyan-300 transition-colors hover:text-cyan-200"
          href="/legal/responsible-ai"
        >
          Responsible AI policy
        </Link>
        .
      </p>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        No warranty on published information
      </h2>
      <p className="mt-4 text-soft-gray">
        The site is provided as-is. We keep it accurate and correct it when we
        find an error, but we make no warranty that every description is
        complete or current, and product capabilities may change. GaitAI claims
        no certification, regulatory clearance or measured performance figure
        anywhere on this site.
      </p>

      <p className="mt-8 text-soft-gray">
        The governing entity, jurisdiction and the full contractual terms for
        pilots will be published here before commercial launch. For anything in
        the meantime, contact{" "}
        <a
          className="text-cyan-300 transition-colors hover:text-cyan-200"
          href="mailto:legal@gaitai.com"
        >
          legal@gaitai.com
        </a>
        .
      </p>
    </>
  );
}

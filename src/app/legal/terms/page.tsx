import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "Terms covering use of the GaitAI website: informational content, demo requests, intellectual property, acceptable use, and the basis on which product information and demo visuals are published.",
};

/**
 * Scoped to what this website actually is: an informational site with a
 * research library, a demo-request form and moderated comment areas. It is
 * not a product licence and not a services agreement, because nothing is sold
 * or provisioned here — so it says that rather than gesturing at terms that
 * do not exist yet.
 *
 * TODO (needs the company's own legal input — must not be guessed):
 *   - registered entity name, address and governing jurisdiction
 *   - the pilot/evaluation agreement these terms should reference
 *   - liability, indemnity and dispute-resolution positions
 * Anything in that list is omitted from the page rather than approximated.
 * No governing law, warranty, contracting entity or enterprise term is
 * stated anywhere below.
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
        These terms cover your use of this website. Commercial engagements —
        pilots, evaluations and deployments — are governed by a separate
        written agreement with the contracting entity for that engagement;
        nothing on this site creates one.
      </p>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        Informational use
      </h2>
      <p className="mt-4 text-soft-gray">
        This site exists to explain what GaitAI is and what its products are
        designed to do. Product pages describe intended capability. They are
        not a specification, and capabilities may change as the platform
        develops.
      </p>
      <p className="mt-4 text-soft-gray">
        Dashboards, reports, consoles and console footage shown on this site
        use{" "}
        <span className="text-soft-white">
          illustrative synthetic values, labelled as such
        </span>
        . They are design demonstrations, not measured results, not output from
        a real assessment, and not data from any real person or organisation.
      </p>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        No medical or professional advice
      </h2>
      <p className="mt-4 text-soft-gray">
        Nothing on this site is medical, clinical, diagnostic, legal or
        security advice, and no GaitAI output diagnoses a condition. Movement
        metrics are decision support for a qualified professional; clinical,
        safety and operational decisions remain theirs. Do not rely on anything
        here in place of professional judgement.
      </p>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        Demo and contact requests
      </h2>
      <p className="mt-4 text-soft-gray">
        Submitting the form is a request to be contacted — it does not create
        an agreement, reserve capacity or commit either side to a pilot. Please
        give accurate details so we can respond, and please do not include
        health, clinical, personal or confidential information. How the
        submission is handled is set out in the{" "}
        <Link
          className="text-cyan-300 transition-colors hover:text-cyan-200"
          href="/legal/privacy"
        >
          Privacy Policy
        </Link>
        .
      </p>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        Intellectual property
      </h2>
      <p className="mt-4 text-soft-gray">
        The GaitAI name, wordmark, product names, site design, copy and visuals
        are owned by GaitAI. You may read, share and quote this site with
        attribution; please don&apos;t reproduce or adapt it in a way that
        suggests endorsement, affiliation or that the material is your own.
      </p>
      <p className="mt-4 text-soft-gray">
        Papers listed in the{" "}
        <Link
          className="text-cyan-300 transition-colors hover:text-cyan-200"
          href="/publications"
        >
          research library
        </Link>{" "}
        remain the copyright of their publishers and authors, and the granted
        patent is held by its named inventors. We link to the publisher of
        record; obtain the work from there and cite it accordingly.
      </p>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        Acceptable use
      </h2>
      <ul className="mt-5 space-y-3 text-[13.5px] leading-relaxed text-soft-gray">
        <li>
          Don&apos;t attempt to disrupt, probe or gain unauthorised access to
          the site or the services behind it.
        </li>
        <li>
          Don&apos;t scrape or republish the site wholesale, or misrepresent
          its content as a capability, certification or result GaitAI has not
          stated.
        </li>
        <li>
          Where comments are enabled, keep them lawful and civil, and don&apos;t
          post personal, health or confidential information about yourself or
          anyone else. Comments are moderated and may be hidden or removed.
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
        Third-party links and services
      </h2>
      <p className="mt-4 text-soft-gray">
        This site links to publishers, patent registries and other external
        sites, and uses third-party services to deliver the demo form,
        comments and embedded media. Those destinations and providers apply
        their own terms and privacy practices, which we don&apos;t control.
      </p>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        Availability and accuracy
      </h2>
      <p className="mt-4 text-soft-gray">
        The site is provided as-is and as-available. We don&apos;t guarantee
        uninterrupted access, and content may be updated or corrected at any
        time. We keep it accurate and fix errors when we find them, but we
        don&apos;t warrant that every description is complete or current.
        GaitAI claims no certification, regulatory clearance or measured
        performance figure anywhere on this site.
      </p>

      <p className="mt-10 text-soft-gray">
        Questions about these terms, or about the agreement that would govern a
        pilot:{" "}
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

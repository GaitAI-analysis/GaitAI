import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What this website collects and who processes it, and how GaitAI's products handle movement data — written from what the site actually does.",
};

/**
 * Two distinct things, deliberately separated: what THIS WEBSITE does with
 * your data, and what the PRODUCTS are built to do with movement data.
 * Conflating them is what made the previous version read as a placeholder.
 *
 * Everything in the website section was verified against the code:
 *   - the demo form posts to Formspree (src/components/sections/CTA.tsx)
 *   - comments are stored in Firebase Firestore (src/lib/comments/*)
 *   - comment submission is gated by Cloudflare Turnstile
 *   - theme choice is kept in browser localStorage by next-themes
 *   - embedded post media can come from youtube-nocookie.com / Vimeo
 *   - there is NO analytics, tag manager or advertising script anywhere
 *
 * TODO (needs the company's own legal input, not a guess):
 *   - registered entity name, address and jurisdiction
 *   - the controller/processor position and lawful basis per region
 *   - concrete retention periods for form submissions and comments
 *   - a data-subject request process and response window
 * Until those are settled this page states behaviour and points to a contact
 * address. It must not assert a compliance position.
 */
export default function PrivacyPage() {
  return (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
        Legal · Privacy
      </div>
      <h1 className="mt-4 font-display text-display-md text-soft-white">
        Privacy at GaitAI
      </h1>
      <p className="mt-6 text-soft-gray">
        This page covers two separate things: what this website does with your
        data, and how GaitAI&apos;s products are built to handle movement data.
      </p>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        This website
      </h2>
      <p className="mt-4 text-soft-gray">
        The site is a static site. There is no account system, no advertising,
        and no analytics, tag manager or tracking script of any kind — we do not
        measure your visit.
      </p>

      <dl className="mt-6 border-t border-white/[0.08]">
        <div className="border-b border-white/[0.08] py-5">
          <dt className="text-sm font-semibold text-soft-white">
            Demo and contact requests
          </dt>
          <dd className="mt-1.5 text-[13.5px] leading-relaxed text-soft-gray">
            The form asks for your area of interest, name, work email,
            organization and message. It is delivered to us by Formspree, a
            third-party form service, which processes the submission on our
            behalf. We use those details to respond to your enquiry. No health
            or clinical information is requested — please don&apos;t include
            any.
          </dd>
        </div>
        <div className="border-b border-white/[0.08] py-5">
          <dt className="text-sm font-semibold text-soft-white">Comments</dt>
          <dd className="mt-1.5 text-[13.5px] leading-relaxed text-soft-gray">
            Where an article or publication page allows comments, your display
            name, your message and — if you supply one — your email address are
            stored in Google Firebase (Firestore). Comment forms are protected
            by Cloudflare Turnstile, which performs a bot check. Comments are
            moderated and can be hidden by an administrator.
          </dd>
        </div>
        <div className="border-b border-white/[0.08] py-5">
          <dt className="text-sm font-semibold text-soft-white">
            Theme preference
          </dt>
          <dd className="mt-1.5 text-[13.5px] leading-relaxed text-soft-gray">
            Your light or dark choice is saved in your browser&apos;s local
            storage so the site remembers it. It never leaves your device and is
            not a tracking cookie.
          </dd>
        </div>
        <div className="border-b border-white/[0.08] py-5">
          <dt className="text-sm font-semibold text-soft-white">
            Embedded media
          </dt>
          <dd className="mt-1.5 text-[13.5px] leading-relaxed text-soft-gray">
            Some articles embed video from YouTube (via its no-cookie domain)
            or Vimeo. Playing an embedded video means that provider receives a
            request from your browser and applies its own privacy terms.
          </dd>
        </div>
      </dl>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        GaitAI products
      </h2>
      <p className="mt-4 text-soft-gray">
        The products analyse how people move, which makes privacy an
        architectural decision rather than a policy footnote. The pipeline is
        designed to work on movement features rather than identifiable video:
        skeleton-only processing, optional face blur applied before analytics,
        configurable retention, role-based access and logged activity are
        available across deployments.
      </p>
      <p className="mt-4 text-soft-gray">
        Clinical captures are taken with informed consent and retained only as
        long as the care workflow requires. In SecureVision, capabilities that
        do not require identity are the default; identity, re-identification
        and watchlist capabilities are a separate group that deploys only where
        there is lawful authority, access control and a full audit trail.
      </p>

      <div className="mt-8 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-5 sm:p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Control-by-control documentation
        </div>
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-soft-gray">
          Processing location, non-identifying mode, face blur, raw-video
          handling, retention, access model, audit logs, consent, biometric
          governance and training-data handling are each documented — along
          with what GaitAI explicitly does not claim — on the{" "}
          <Link
            className="text-cyan-300 transition-colors hover:text-cyan-200"
            href="/legal/security"
          >
            security &amp; privacy controls page
          </Link>
          .
        </p>
      </div>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        What we do not claim
      </h2>
      <p className="mt-4 text-soft-gray">
        GaitAI holds no privacy or security certification and asserts no
        compliance status — not GDPR, DPDP Act, HIPAA, ISO 27001 or SOC 2. For
        a product deployment, the lawful basis for processing, consent
        management and any data-protection assessment rest with the deploying
        organisation. A full jurisdiction-specific policy, naming the
        contracting entity and retention periods, will be published here before
        commercial launch.
      </p>

      <p className="mt-8 text-soft-gray">
        Questions about this page, or a request relating to your data:{" "}
        <a
          className="text-cyan-300 transition-colors hover:text-cyan-200"
          href="mailto:privacy@gaitai.com"
        >
          privacy@gaitai.com
        </a>
        .
      </p>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { contact, mailto, CONTACT_FORM_HREF } from "@/data/contact";

export const metadata: Metadata = {
  alternates: { canonical: "/legal/privacy" },
  title: "Privacy Policy",
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
 *   - comment forms can load Cloudflare Turnstile when configured
 *   - theme choice is kept in browser localStorage by next-themes
 *   - embedded post media can come from youtube-nocookie.com / Vimeo
 *   - journal articles keep a view and like counter in Firestore
 *     (src/lib/article-stats.ts); the dedup key is sessionStorage-only
 *   - blog subscriptions store the address in Firestore, keyed by its own
 *     SHA-256 so the list cannot be enumerated (src/lib/subscribe.ts)
 *   - the Movement Lab analyser runs MediaPipe in the tab and uploads
 *     nothing (src/components/analytics/usePoseAnalysis.ts)
 *   - Ask GaitAI uses aggregate Firestore counters and optional Workers AI
 *     hosted requests (src/lib/assistant-stats.ts, src/lib/ask/hosted.ts)
 *   - there is no advertising analytics suite or session replay script
 *
 * The "no analytics of any kind" line this page used to carry became untrue
 * the moment article counters landed. A counter is a measurement, even a
 * crude anonymous one, so it is disclosed as one rather than argued around.
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
        Privacy Policy
      </h1>
      <p className="mt-4 text-xs text-soft-mute">
        Last updated: <time dateTime="2026-09-09">9 September 2026</time> · gaitai.in
      </p>
      <p className="mt-6 text-soft-gray">
        This policy explains what gaitai.in collects, why it is processed,
        the services involved, and how to request help with your data.
        Product deployment arrangements are described separately below.
      </p>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        This website
      </h2>
      <p className="mt-4 text-soft-gray">
        You can browse without creating an account. Pages are delivered as
        static files, with separate services for contact forms, comments,
        subscriptions and Ask GaitAI. We use aggregate article and assistant
        counters, described below. The site does not include advertising pixels,
        a tag manager or session-recording software. Administrator sign-in uses
        Firebase Authentication; it is separate from public browsing.
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
            name, your message, the article/reply reference and a timestamp are
            stored in Google Firebase (Firestore) and made public. New comments
            do not request or attach an email address or sign-in identifier.
            Earlier versions accepted optional email addresses; contact us about
            removal of an earlier record. Comments appear when submitted and
            administrators can hide or delete them. Reports about comments are
            available to administrators and may include the reporting account&apos;s
            email if signed in. When configured, the form loads Cloudflare
            Turnstile for a verification challenge. Do not post private information.
          </dd>
        </div>
        <div className="border-b border-white/[0.08] py-5">
          <dt className="text-sm font-semibold text-soft-white">
            Blog subscription
          </dt>
          <dd className="mt-1.5 text-[13.5px] leading-relaxed text-soft-gray">
            <strong className="font-semibold text-soft-white">
              What is collected.
            </strong>{" "}
            If you subscribe on the blog, an article page or in the footer, we
            store the email address you type, which of those three places you
            typed it, and the times the record was created and last changed.
            The subscription record contains no name, IP address, device
            fingerprint or marketing profile. It is held in Google Firebase
            (Firestore); service-level request information is described below.
            <br />
            <br />
            <strong className="font-semibold text-soft-white">Purpose.</strong>{" "}
            To subscribe you to GaitAI blog and product updates — research notes,
            engineering stories and company news. The address is stored for
            that purpose; it is not published as a subscriber list or sent to
            an advertising network by this website.
            <br />
            <br />
            <strong className="font-semibold text-soft-white">
              How the record is stored.
            </strong>{" "}
            Each subscription is filed under a hash of the normalized email
            address to detect duplicates and support unsubscribe requests.
            The database rules prevent listing all subscribers. This is not
            encryption or anonymity: a person who already knows an address
            can look up its subscription record.
            <br />
            <br />
            <strong className="font-semibold text-soft-white">
              Unsubscribing.
            </strong>{" "}
            Use the{" "}
            <Link
              href="/insights/unsubscribe"
              className="text-cyan-300 underline decoration-cyan-300/35 underline-offset-4"
            >
              unsubscribe page
            </Link>{" "}
            at any time — enter the address you subscribed with; no account or
            sign-in is needed. Your record is then marked as unsubscribed and
            stops receiving anything.
            <br />
            <br />
            <strong className="font-semibold text-soft-white">
              Retention.
            </strong>{" "}
            An active subscription is kept until you unsubscribe. An
            unsubscribed record is kept — flagged, and never sent to — so that
            a later import cannot quietly put you back on the list. If you want
            the record deleted outright rather than flagged, ask us at the
            address below and we will remove it.
          </dd>
        </div>
        <div className="border-b border-white/[0.08] py-5">
          <dt className="text-sm font-semibold text-soft-white">
            Browser storage and cookies
          </dt>
          <dd className="mt-1.5 text-[13.5px] leading-relaxed text-soft-gray">
            Local storage remembers your theme, article like choices, whether
            you have seen the assistant introduction, and recent comment
            submissions to reduce duplicates. Session storage keeps a short
            Ask GaitAI conversation and article/assistant counter markers.
            You can clear these through your browser&apos;s site-data controls;
            this also clears remembered preferences. We do not set advertising
            cookies. Third-party embeds, verification and sign-in services
            may use their own storage under their privacy terms.
          </dd>
        </div>
        <div className="border-b border-white/[0.08] py-5">
          <dt className="text-sm font-semibold text-soft-white">
            Blog article views and likes
          </dt>
          <dd className="mt-1.5 text-[13.5px] leading-relaxed text-soft-gray">
            Each journal article keeps a running count of views and likes in
            Google Firebase (Firestore). The stored record is two whole numbers
            and a timestamp — no IP address, no device or browser fingerprint,
            and no visitor identifier in the counter record. To avoid counting
            the same visit repeatedly, your browser
            keeps a marker in its own session storage saying it has already
            counted that article; the marker never leaves your device and is
            cleared when you close the tab. If a like is registered, the same
            kind of marker is kept in local storage so the button reflects your
            own choice.
          </dd>
        </div>
        <div className="border-b border-white/[0.08] py-5">
          <dt className="text-sm font-semibold text-soft-white">Ask GaitAI</dt>
          <dd className="mt-1.5 text-[13.5px] leading-relaxed text-soft-gray">
            When a hosted answer is enabled, your question, current page path
            and title, up to six previous conversation turns and selected public
            content identifiers are sent to our Cloudflare Worker and Workers AI
            to prepare an answer. Cookies and uploaded video are not attached.
            The website can also answer from its public records locally when
            the hosted service is unavailable or not configured. Do not include
            patient details, confidential information or sensitive personal data.
            The short conversation is kept in this tab&apos;s session storage;
            use the assistant&apos;s reset control or clear browser site data to
            remove it. The Worker does not write questions or answers to its
            application logs. It records operational counts, timing and error
            categories. Abuse prevention stores request timestamps against a
            daily hash derived from the connecting IP address; this is a
            pseudonymous identifier, not a guarantee of anonymity. Its cleanup
            runs every six hours, removing callers idle for an hour and daily
            totals older than the previous day. Provider processing is covered
            by the linked Cloudflare terms below.
          </dd>
        </div>
        <div className="border-b border-white/[0.08] py-5">
          <dt className="text-sm font-semibold text-soft-white">Aggregate assistant usage</dt>
          <dd className="mt-1.5 text-[13.5px] leading-relaxed text-soft-gray">
            Firebase stores counts of assistant opens, questions, suggested-prompt
            selections and answer-link clicks, grouped by page type. Those
            records contain counters and an update timestamp, with no question,
            answer, conversation identifier, video or file name. They help us
            understand which parts of the guide people use. Administrator access
            is required to read these counts.
          </dd>
        </div>
        <div className="border-b border-white/[0.08] py-5">
          <dt className="text-sm font-semibold text-soft-white">
            Movement Lab video
          </dt>
          <dd className="mt-1.5 text-[13.5px] leading-relaxed text-soft-gray">
            The Movement Lab analyser reads a clip you choose entirely inside
            your browser. The file is opened through a local object URL and
            handed frame by frame to a pose model that runs in the tab; neither
            the video nor anything derived from it is uploaded, stored or sent
            to us by the analyser. Model weights are downloaded from this site;
            the runtime is downloaded from jsDelivr when analysis starts. Those
            downloads expose ordinary request information to the serving
            providers, but do not contain your video or pose results. If
            you record a short clip with your camera instead, that recording is
            held in the tab&apos;s memory. Replacing or clearing the clip releases
            the local object URL; leaving the page ends the analysis. Built-in
            demonstrations and illustrative report examples are distinct from
            measurements of your clip. Sharing an exploration link does not
            publish a selected private video.
          </dd>
        </div>
        <div className="border-b border-white/[0.08] py-5">
          <dt className="text-sm font-semibold text-soft-white">
            Embedded media
          </dt>
          <dd className="mt-1.5 text-[13.5px] leading-relaxed text-soft-gray">
            Some articles embed video from YouTube (via its no-cookie domain)
            or Vimeo. Loading an embedded player or following an external link
            can send request information to that provider, which applies its own
            privacy terms. A no-cookie domain does not mean no network processing.
          </dd>
        </div>
      </dl>

      <h2 className="mt-12 font-display text-xl text-soft-white">Hosting, logs and service providers</h2>
      <p className="mt-4 text-soft-gray">
        GitHub Pages hosts the public site. GitHub states that visitor IP
        addresses are logged for security, including visits made without signing
        in. Formspree, Firebase, Cloudflare, jsDelivr and embedded-media providers
        receive the requests needed to serve the features you use. Their
        operational records can include IP addresses, browser information,
        request times and error details. We do not promise that provider logs
        are absent or share the retention period of a browser-only feature.
      </p>
      <ul className="mt-5 space-y-2 text-sm text-soft-gray">
        {[
          ["GitHub Pages data collection", "https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection"],
          ["Formspree privacy policy", "https://formspree.io/legal/privacy-policy/"],
          ["Firebase privacy and security", "https://firebase.google.com/support/privacy"],
          ["Cloudflare privacy policy", "https://www.cloudflare.com/privacypolicy/"],
          ["Workers AI data usage", "https://developers.cloudflare.com/workers-ai/platform/data-usage/"],
        ].map(([label, href]) => (
          <li key={href}><a className="text-cyan-300 underline underline-offset-4" href={href} target="_blank" rel="noopener noreferrer">{label}</a></li>
        ))}
      </ul>

      <h2 className="mt-12 font-display text-xl text-soft-white">Retention and your choices</h2>
      <p className="mt-4 text-soft-gray">
        Contact correspondence is retained to handle your enquiry and any
        follow-up. Public comments remain until removed; aggregate counters do
        not have an automatic expiry. The website does not currently set a fixed
        automatic deletion period for contact records, comments or subscriptions.
        Subscription retention is described above. Service-provider logs and
        backups follow the relevant provider settings and terms. We do not
        promise an unverified deletion deadline.
      </p>
      <p className="mt-4 text-soft-gray">
        You can request access, correction or deletion of information you have
        supplied, ask to stop receiving updates, or raise a privacy concern at
        the contact below. Include the relevant page or service and enough
        information to locate the record; do not send identity documents or
        medical records with an initial request. We may need to verify a request
        before changing a record. Available rights and any required exceptions
        depend on applicable law and the processing involved. Clearing browser
        storage does not delete records held by the services listed above.
      </p>

      <h2 className="mt-12 font-display text-xl text-soft-white">Security</h2>
      <p className="mt-4 text-soft-gray">
        The public site and service requests use HTTPS. Database rules restrict
        administrative changes and access to private collections. No transmission
        or storage system is risk-free. Please report a suspected issue through
        our <Link href="/legal/security/" className="text-cyan-300 underline underline-offset-4">security contact</Link>.
      </p>

      <h2 className="mt-12 font-display text-xl text-soft-white">Children and international visitors</h2>
      <p className="mt-4 text-soft-gray">
        The website is intended for professional and general educational
        exploration, and does not ask children to provide personal information.
        A parent or guardian can contact us about information a child may have
        submitted. Do not submit a child&apos;s private or health information in
        forms, comments or Ask GaitAI.
      </p>
      <p className="mt-4 text-soft-gray">
        Our service providers operate internationally, so information sent to
        them may be processed outside your country. Applicable privacy rights,
        contractual arrangements and safeguards depend on the service and
        jurisdiction. The use of a provider does not itself establish GaitAI&apos;s
        compliance with a particular law.
      </p>

      <h2 className="mt-12 font-display text-xl text-soft-white">
        GaitAI products
      </h2>
      <p className="mt-4 text-soft-gray">
        The products analyse how people move, which makes privacy an
        architectural decision rather than a policy footnote. The pipeline is
        designed to work on movement features rather than identifiable video:
        skeleton-only processing, optional face blur applied before analytics,
        configurable retention, role-based access and logged activity are
        architectural capabilities, configured per deployment rather than
        guaranteed everywhere.
      </p>
      <p className="mt-4 text-soft-gray">
        Clinical captures are intended to be collected with informed consent and
        appropriate authorization, and retained only as
        long as the care workflow requires. In SecureVision, capabilities that
        do not require identity are the default; identity, re-identification
        and watchlist capabilities are a separate group that is intended only
        for lawful, authorized deployments with appropriate governance, access
        control and auditability.
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
        GaitAI claims no privacy or security certification and asserts no
        compliance status — not GDPR, DPDP Act, HIPAA, ISO 27001 or SOC 2. For
        a product deployment, privacy roles, lawful basis, consent and any
        required assessments must be established for the actual deployment
        and the parties involved.
      </p>
      <p className="mt-4 text-soft-gray">
        For commercial deployments, contractual privacy terms, retention
        periods and jurisdiction-specific requirements are defined for the
        applicable deployment and contracting entity. Movement data, retention
        and access obligations differ too much between a clinic, a campus and a
        transport hub for a single blanket policy to be meaningful.
      </p>

      <h2 className="mt-12 font-display text-xl text-soft-white">Policy changes and contact</h2>
      <p className="mt-4 text-soft-gray">
        We will update this page when website behaviour or these disclosures
        change, with the revision date shown above. Check the current policy
        before sharing information through a new feature.
      </p>
      <p className="mt-4 text-soft-gray">
        Questions about this page, or a request relating to your data:{" "}
        <a
          className="text-cyan-300 transition-colors hover:text-cyan-200"
          href={mailto(contact.privacy)}
        >
          {contact.privacy}
        </a>
        {/* Was "If a message bounces" — a hedge written when this address
            was an unverified role mailbox on a domain with no MX. It is a
            verified inbox now, so raising the possibility of a bounce next to
            it would be worse than saying nothing. The form stays offered as a
            second route. */}
        . The{" "}
        <Link
          className="text-cyan-300 transition-colors hover:text-cyan-200"
          href={CONTACT_FORM_HREF}
        >
          contact form
        </Link>{" "}
        is the other way through.
      </p>
    </>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Responsible AI" };

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
        GaitAI deploys movement intelligence responsibly. SecureVision leads
        with anomaly detection, crowd flow, worker safety and post-event
        investigation — capabilities that do not require identification.
        Biometric, watchlist or identification capabilities deploy only with
        lawful authority, consent and full audit trails.
      </p>
      <p className="mt-4 text-soft-gray">
        PrivacyGuard — our privacy-preserving analytics layer — is enabled by
        default across every SecureVision deployment, with skeleton-only
        analytics, face blur, configurable retention and audit logs.
      </p>
      <p className="mt-4 text-soft-gray">
        Read the full Responsible AI policy on the{" "}
        <a className="text-cyan-300" href="/research">
          /research page
        </a>{" "}
        or contact{" "}
        <a className="text-cyan-300" href="mailto:responsible-ai@gaitai.com">
          responsible-ai@gaitai.com
        </a>
        .
      </p>
    </>
  );
}

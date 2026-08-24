import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Responsible AI",
  alternates: { canonical: "/legal/responsible-ai" },
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
        GaitAI&apos;s stated commitment is to use movement intelligence with human
        oversight, proportionality and inspectable outputs. SecureVision
        prioritizes anomaly, crowd-flow, worker-safety and post-event workflows
        that need not depend on identity. Sensitive biometric or watchlist uses
        require lawful authority, governance and audit controls.
      </p>
      <p className="mt-4 text-soft-gray">
        PrivacyGuard is presented as SecureVision&apos;s privacy-preserving analytics
        layer. The product architecture describes skeleton-oriented analytics,
        face blur, configurable retention and audit controls for sensitive uses.
      </p>
      <p className="mt-4 text-soft-gray">
        Explore the research and product principles on the{" "}
        <Link className="text-cyan-300" href="/research">
          research page
        </Link>{" "}
        or contact{" "}
        <a className="text-cyan-300" href="mailto:responsible-ai@gaitai.com">
          responsible-ai@gaitai.com
        </a>
        .
      </p>
    </>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/legal/privacy" } };

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
        This public notice is not a substitute for a jurisdiction-specific
        privacy policy. GaitAI treats data minimization, purpose limitation,
        configurable retention, controlled access and auditability as
        requirements for movement-data implementations.
      </p>
      <p className="mt-4 text-soft-gray">
        A full policy should accompany any commercial service before personal
        data is collected. For privacy and implementation questions,
        please contact{" "}
        <a className="text-cyan-300" href="mailto:privacy@gaitai.com">
          privacy@gaitai.com
        </a>
        .
      </p>
    </>
  );
}

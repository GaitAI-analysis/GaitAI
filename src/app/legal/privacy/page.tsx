import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

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
        This is a placeholder for our full privacy policy. GaitAI processes
        movement data with privacy by default: skeleton-only analytics, face
        blur, configurable retention, role-based access and audit logs are
        built into every deployment.
      </p>
      <p className="mt-4 text-soft-gray">
        We will publish the full, jurisdiction-specific policy here ahead of
        commercial launch. For specific deployment questions in the meantime,
        please contact{" "}
        <a className="text-cyan-300" href="mailto:privacy@gaitai.com">
          privacy@gaitai.com
        </a>
        .
      </p>
    </>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Security", alternates: { canonical: "/legal/security" } };

export default function SecurityPage() {
  return (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
        Legal · Security
      </div>
      <h1 className="mt-4 font-display text-display-md text-soft-white">
        Security at GaitAI
      </h1>
      <p className="mt-6 text-soft-gray">
        This public notice does not claim a certified security posture. GaitAI
        treats access control, encryption, configurable retention, auditability
        and appropriate on-device processing as implementation requirements.
      </p>
      <p className="mt-4 text-soft-gray">
        Security controls must be documented for the specific product,
        environment and data flow before use. For details contact{" "}
        <a className="text-cyan-300" href="mailto:security@gaitai.com">
          security@gaitai.com
        </a>
        .
      </p>
    </>
  );
}

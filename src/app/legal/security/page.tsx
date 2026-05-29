import type { Metadata } from "next";

export const metadata: Metadata = { title: "Security" };

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
        This is a placeholder for our security overview. GaitAI ships with
        role-based access, encrypted-at-rest and in-transit data handling,
        configurable retention, audit logging, and on-device processing options
        where appropriate.
      </p>
      <p className="mt-4 text-soft-gray">
        Enterprise customers receive deployment-specific security
        documentation. For details contact{" "}
        <a className="text-cyan-300" href="mailto:security@gaitai.com">
          security@gaitai.com
        </a>
        .
      </p>
    </>
  );
}

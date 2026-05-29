import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

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
        This is a placeholder for our full terms of use. The final terms will
        cover acceptable use, pilot conditions, data ownership, service-level
        commitments and the responsible-deployment policies that apply to the
        SecureVision product family.
      </p>
      <p className="mt-4 text-soft-gray">
        For specific questions, contact{" "}
        <a className="text-cyan-300" href="mailto:legal@gaitai.com">
          legal@gaitai.com
        </a>
        .
      </p>
    </>
  );
}

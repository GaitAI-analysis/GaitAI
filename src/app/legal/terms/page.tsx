import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms", alternates: { canonical: "/legal/terms" } };

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
        This public notice is not a complete service agreement. Product access,
        pilot conditions, data ownership, service commitments and acceptable
        use must be set out in the applicable written agreement.
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

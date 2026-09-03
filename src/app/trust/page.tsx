import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { TrustPillar } from "@/components/trust/TrustPillar";
import { TrustEvidence } from "@/components/trust/TrustEvidence";
import { privacyControls, notClaimed } from "@/data/trust";
import { researchAreas } from "@/data/evidence";
import { evidenceTotals } from "@/data/evidence-status";
import { papers, patent } from "@/data/publications";
import { productCount } from "@/data/products";
import { RESPONSIBLE_USE_CONTROLS } from "@/data/responsible-use";
import { ctas } from "@/data/content";
import styles from "@/components/trust/trust.module.css";

export const metadata: Metadata = {
  title: "GaitAI Trust Center",
  description:
    "How GaitAI states evidence, privacy, security and responsible deployment — the published record, the architectural controls, and what is explicitly not claimed.",
  alternates: { canonical: "/trust" },
  openGraph: {
    title: "GaitAI Trust Center",
    description:
      "Trust through evidence, privacy and responsible deployment: the published research record, privacy-aware architecture, security controls and what GaitAI does not claim.",
    type: "website",
    url: "/trust",
  },
};

/**
 * The Trust Center.
 *
 * Not a new set of assurances — one place that collects the four things
 * already documented across the site and states them together: what the
 * research record establishes, how the pipeline treats identity, what the
 * architecture supports, and where a human stays in the loop.
 *
 * EVERY FIGURE IS DERIVED. Counts come from publications.ts, products.ts and
 * evidence-status.ts, so the page cannot quote a number the underlying data
 * does not support. The `notClaimed` list from trust.ts is rendered as
 * prominently as the pillars, because saying plainly that there is no
 * certification, no compliance status and no measured performance figure is
 * the most useful thing this page does for a reviewer.
 *
 * Security rows are read straight out of `privacyControls`, which is already
 * phrased as architectural capability rather than running deployment — so this
 * page cannot accidentally state them more strongly than /legal/security does.
 *
 * Deliberately not in the primary navbar: linked from the footer, the security
 * and privacy pages, and the evidence-status panel on every module page.
 */

/** The four control areas a security reviewer asks about first. */
const SECURITY_TOPICS = [
  "Processing location",
  "Retention controls",
  "Role-based access",
  "Audit logs",
];

export default function TrustPage() {
  const records = papers.length + 1;
  const securityRows = privacyControls
    .filter((c) => SECURITY_TOPICS.includes(c.topic))
    .map((c) => ({ label: c.topic, value: c.support }));

  return (
    <div className={styles.page}>
      {/* ── HERO ── */}
      <section className="site-page-intro relative overflow-hidden pb-14">
        <div className="container-wide">
          <div className="max-w-3xl">
            <span className={styles.eyebrow}>
              <span aria-hidden="true" className={styles.eyebrowRule} />
              Trust Center
            </span>
            <h1 className="mt-6 font-display text-display-xl text-balance text-soft-white">
              Trust through evidence, privacy and{" "}
              <span className="text-gradient">responsible deployment.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-soft-gray sm:text-lg">
              What the published record establishes, how the pipeline is
              designed to treat identity, which controls the architecture
              supports — and, just as plainly, what GaitAI does not claim.
            </p>
          </div>

          <TrustEvidence
            records={records}
            papers={papers.length}
            patentNumber={patent.patentNumber ?? ""}
            areas={researchAreas.length}
            modules={productCount}
            withFoundation={evidenceTotals.withResearchFoundation}
          />
        </div>
      </section>

      {/* ── FOUR PILLARS ── */}
      <section className="section border-t border-white/[0.07]">
        <div className="container-wide">
          <div className={styles.pillars}>
            <Reveal>
              <TrustPillar
                index="01"
                title="Evidence"
                lead="Research establishes the methodological foundation. Product-specific validation establishes fitness for a particular use. The two are stated separately everywhere on this site."
                rows={[
                  {
                    label: "Published record",
                    value: `${papers.length} peer-reviewed papers and granted Indian patent ${patent.patentNumber}.`,
                  },
                  {
                    label: "Research areas",
                    value: `${researchAreas.length} areas, each resolved to the records that back it and the capabilities it informs.`,
                  },
                  {
                    label: "Modules with a research foundation",
                    value: `${evidenceTotals.withResearchFoundation} of ${evidenceTotals.modules}. A published record informs a capability those modules are built on.`,
                  },
                  {
                    label: "Product-specific validation",
                    value:
                      "None. No study in the record evaluates a module's output for a particular intended use, and every module page says so.",
                  },
                ]}
                links={[
                  { href: "/research", label: "Research record" },
                  { href: "/research/evidence", label: "Evidence explorer" },
                  { href: "/publications", label: "Publications" },
                ]}
              />
            </Reveal>

            <Reveal>
              <TrustPillar
                index="02"
                title="Privacy"
                lead="SecureVision leads with capabilities that do not require identity. Identity-related capabilities are a separate, smaller group, intended only for lawful, authorized deployments with appropriate governance, access control and auditability."
                rows={[
                  {
                    label: "Default posture",
                    value:
                      "Identity-free movement analytics — anomaly detection, crowd flow, worker safety and campus monitoring run on movement features rather than identity.",
                  },
                  {
                    label: "Data minimization",
                    value:
                      "Skeleton-only processing and face blur are designed as pipeline stages applied before analytics rather than after.",
                  },
                  {
                    label: "Lawful basis",
                    value:
                      "Lawful basis, consent management and any data-protection assessment rest with the deploying organisation.",
                  },
                  {
                    label: "Anonymity",
                    value:
                      "Not guaranteed. Privacy-aware architecture is not a guarantee of anonymity, and the site does not claim one.",
                  },
                ]}
                links={[
                  { href: "/legal/privacy", label: "Privacy" },
                  {
                    href: "/securevision#privacy-aware",
                    label: "Identity-free capability group",
                  },
                ]}
              />
            </Reveal>

            <Reveal>
              <TrustPillar
                index="03"
                title="Security"
                lead="These are architectural capabilities of the GaitAI pipeline rather than a description of a running deployment. What a given site enables is agreed with it."
                rows={securityRows}
                links={[
                  {
                    href: "/legal/security",
                    label: "Control-by-control documentation",
                  },
                ]}
              />
            </Reveal>

            <Reveal>
              <TrustPillar
                index="04"
                title="Responsible AI"
                lead="Every output is decision support. No module diagnoses, and none acts on its own."
                rows={[
                  {
                    label: "Human review",
                    value:
                      "A clinician, therapist or caregiver reviews clinical outputs; a trained operator reviews safety events.",
                  },
                  {
                    label: "Explainability",
                    value:
                      "An indicator surfaces the named signals that drove it rather than a confidence score, so a reviewer can sanity-check the call.",
                  },
                  {
                    label: "Identity capabilities",
                    value:
                      "Intended only for lawful, authorized deployments with appropriate governance, access control and auditability. Candidates are for trained review — never proof of identity.",
                  },
                  {
                    label: "Shared responsible-use statement",
                    value: RESPONSIBLE_USE_CONTROLS,
                  },
                ]}
                links={[
                  { href: "/legal/responsible-ai", label: "Responsible AI" },
                  { href: "/movement-lab", label: "Explainability in the Lab" },
                ]}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── WHAT IS NOT CLAIMED ──
          As prominent as the pillars. For a security or clinical reviewer this
          is the most useful section on the page. */}
      <section className="section border-t border-white/[0.07] bg-obsidian-300/25">
        <div className="container-wide">
          <div className="max-w-3xl">
            <span className={styles.eyebrow}>
              <span aria-hidden="true" className={styles.eyebrowRule} />
              Stated explicitly
            </span>
            <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
              What GaitAI does{" "}
              <span className="text-gradient">not claim.</span>
            </h2>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-soft-gray">
              Nothing in this repository establishes any of the following, so
              no page on this site implies them.
            </p>
          </div>

          <ul className={styles.notClaimed}>
            {notClaimed.map((item) => (
              <li key={item} className={styles.notClaimedRow}>
                <span aria-hidden="true" className={styles.notClaimedMark} />
                <span className={styles.notClaimedText}>
                  {item}
                  <span className="sr-only"> — not claimed</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section">
        <div className="container-wide">
          <div className={styles.cta}>
            <h2 className="font-display text-display-md text-balance text-soft-white">
              Reviewing GaitAI for an environment of your own?
            </h2>
            <p className="mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-soft-gray">
              Deployment requirements depend on the applicable environment,
              organization and jurisdiction. We would rather work through
              yours than publish a blanket answer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={ctas.pilot.href} className="btn-primary">
                {ctas.pilot.label}
              </Link>
              <Link href="/legal/security" className="btn-ghost">
                Security &amp; privacy controls
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

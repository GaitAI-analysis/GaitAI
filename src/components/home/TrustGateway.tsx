import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PrivacyLayerMotif } from "@/components/visuals/ResearchMotifs";
import { privacyControls } from "@/data/trust";

/**
 * TRUST — four principles and two doors.
 * =============================================================================
 * The home page had no Trust section at all. What it had was a privacy card
 * and a responsible-deployment paragraph at the bottom of the research
 * section, which is where a reader looking for "can we actually deploy this?"
 * would never think to look.
 *
 * Four principles, in the order a buyer asks them:
 *
 *   PRIVACY BY DESIGN    what the pipeline does before analytics
 *   HUMAN OVERSIGHT      who decides, and what the output is
 *   LAWFUL DEPLOYMENT    the boundary on identity-related capability
 *   AUDITABILITY         what can be shown afterwards
 *
 * EVERY LINE IS CAPABILITY LANGUAGE, NOT OPERATIONAL FACT. The `source` note
 * under each principle names the control record in `trust.ts` it restates, and
 * `trust.ts` is explicit that these are things the architecture is DESIGNED to
 * support — no certification, no compliance status and no guarantee is claimed
 * here or there. The Trust Center is where the full control table, the
 * deployment steps and the list of what is deliberately NOT claimed live; this
 * section's job is to say the four things and open that door.
 *
 * THE PRINCIPLES ARE NOT A CONTROL. No tabs, no cycling, no disclosure. Four
 * short statements a visitor reads in one pass — this is the section where the
 * answer being immediately visible matters more than it being explorable.
 */

/**
 * The control records each principle restates, by `topic`. Written as ids
 * rather than prose so a renamed or deleted control shows up as a missing
 * source line rather than as a claim with nothing behind it.
 */
const PRINCIPLES = [
  {
    title: "Privacy by design",
    body: "Skeleton-only processing can replace identifiable video as the analytic substrate, and face blur is a pipeline stage applied before analytics rather than after.",
    topics: ["Non-identifying mode", "Face blur"],
  },
  {
    title: "Human oversight",
    body: "Outputs are decision support for a clinician or an operator to review, with the movement evidence behind them. GaitAI does not diagnose and does not decide.",
    topics: ["Scope of the controls"],
  },
  {
    title: "Lawful deployment",
    body: "Identity-related capabilities are intended only for lawful, authorized deployments with governance and access control. Where non-identifying movement intelligence is sufficient, that is the intended default.",
    topics: ["Biometric and identity processing"],
  },
  {
    title: "Auditability",
    body: "Role-based access and exportable audit logs are designed in at the pipeline level, with configurable retention.",
    topics: ["Role-based access", "Audit logs"],
  },
];

export function TrustGateway() {
  /* A principle's sources, resolved from the control records. A topic that no
     longer exists simply contributes nothing, so this can never name a control
     the Trust Center does not carry. */
  const sourcesFor = (topics: string[]) =>
    topics
      .map((topic) => privacyControls.find((control) => control.topic === topic))
      .filter(Boolean)
      .map((control) => control!.topic);

  return (
    <section
      id="trust"
      aria-label="Trust and responsible deployment"
      className="home-section section relative overflow-hidden"
    >
      <div className="container-wide">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
          <div>
            <SectionHeading
              eyebrow="Trust"
              title={
                <>
                  Designed to be{" "}
                  <span className="text-gradient">deployed responsibly.</span>
                </>
              }
              description="What the architecture is designed to support, stated as capability rather than as compliance. The Trust Center carries the full control table — and the list of what GaitAI deliberately does not claim."
              align="left"
              size="lg"
            />

            <div className="mt-7 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <PrivacyLayerMotif />
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-2">
              <Link
                href="/trust"
                className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300 transition-colors hover:text-emerald-200"
              >
                Visit Trust Center
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/legal/security"
                className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-soft-white transition-colors hover:text-emerald-200"
              >
                Read the control documentation
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <ul className="grid gap-px self-start overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] sm:grid-cols-2">
            {PRINCIPLES.map((principle) => {
              const sources = sourcesFor(principle.topics);
              return (
                <li
                  key={principle.title}
                  className="bg-obsidian-300/60 p-5 sm:p-6"
                >
                  <h3 className="font-display text-base font-semibold text-soft-white">
                    {principle.title}
                  </h3>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-soft-mute">
                    {principle.body}
                  </p>
                  {sources.length > 0 && (
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-soft-mute/70">
                      {sources.join(" · ")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* The claim boundary. It used to be the last paragraph of the research
            section; it is the last word of the trust section now, which is
            where somebody reading about deployment will actually meet it. */}
        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-soft-white">
            Responsible deployment
          </div>
          <p className="mt-1 text-sm leading-relaxed text-soft-mute">
            Identity-related capabilities — biometric, watchlist and
            identification — are intended only for lawful, authorized
            deployments with appropriate governance, access control and
            auditability. Where non-identifying movement intelligence is
            sufficient, that is the intended default. GaitAI outputs are
            decision support — they do not diagnose, and no compliance
            certification is claimed.
          </p>
        </div>
      </div>
    </section>
  );
}

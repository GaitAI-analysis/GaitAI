import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Lock } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { SecureCapabilityGroups } from "@/components/products/SecureCapabilityGroups";
import { MovementIntelligenceSection } from "@/components/sections/MovementIntelligenceSection";
import { MovementXRay } from "@/components/visuals/MovementXRay";
import { industryUseCases, productById, secureProducts } from "@/data/products";
import { intelligenceVocabularyFor } from "@/data/taxonomy";
import { assetPath } from "@/lib/paths";
import { ctas } from "@/data/content";
import { productOverview } from "@/data/product-details";

export const metadata: Metadata = {
  alternates: { canonical: "/securevision" },
  title: "SecureVision — Privacy-aware movement intelligence",
  description:
    "GaitAI SecureVision — Privacy-aware movement intelligence for safer campuses, transport hubs, factories, events and public spaces.",
};

const secureUseCases = industryUseCases.filter(
  (u) => u.vertical === "securevision"
);

/**
 * Signal + capability vocabulary from the canonical taxonomy, so SecureVision,
 * GaitScape, the research page and the product pages all name the same things.
 */
const secureSignals = intelligenceVocabularyFor("securevision");

export default function SecureVisionPage() {
  const privacy = productById("privacyguard");

  return (
    <>
      {/* HERO — video is a direct child of the section (full browser width),
          never inside any max-width container. Content sits on top. */}
      {/* The desktop min-height is a utility rather than a rule in
          globals.css because Tailwind's `utilities` layer wins over the
          `components` layer that holds `.securevision-hero`, whatever the
          selector's specificity. It reads `min-height`, never `height`: the
          hero fills the screen below the navbar when the content fits and
          grows when it does not — a fixed height used to clip the last
          capability row outright on a wide, short window. */}
      <section className="securevision-hero site-page-intro min-h-[780px] pb-20 sm:min-h-[820px] sm:pb-24 lg:min-h-[max(600px,calc(100svh_-_var(--site-header-height)))] lg:pb-14 lg:pt-0">
        {/* Extracted first frame as the poster, so the hero paints before the
            video decodes; `preload="metadata"` instead of "auto" so the file
            is not fetched in full up front. Reduced motion is a CSS concern —
            see .securevision-hero-video. */}
        <video
          className="securevision-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={assetPath(
            "/assets/videos/securevision/securevision-hero-poster.jpg",
          )}
          aria-hidden="true"
        >
          <source
            src={assetPath("/assets/videos/securevision/securevision-hero.mp4")}
            type="video/mp4"
          />
        </video>

        {/* Left-side readability gradient — fades to transparent so the
            tracking visuals and analytics panel stay bright */}
        <div className="securevision-video-shade" aria-hidden="true" />

        <div className="securevision-hero-inner container-wide flex min-h-[650px] items-center sm:min-h-[680px] lg:h-full lg:min-h-0">
          <div className="w-full max-w-[680px]">
              <div className="inline-flex items-center rounded-full border border-royal-300/30 bg-royal-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-royal-300">
                GaitAI SecureVision · Privacy-first
              </div>
              <h1 className="mt-6 font-display text-display-2xl text-balance text-soft-white lg:mt-5">
                Privacy-aware{" "}
                <span className="text-gradient-secure">movement intelligence</span>{" "}
                for safer public spaces.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-soft-gray sm:text-lg lg:mt-5 lg:text-base">
                {secureProducts.length} modular products built around safety
                analytics, crowd flow, anomaly detection and post-event
                investigation — grounded in{" "}
                <span className="text-soft-white">
                  a decade of founder research in gait and human movement
                </span>
                , with PrivacyGuard defining the default design posture and
                auditability by design.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3 lg:mt-6">
                <Link href="#products" className="btn-primary">
                  See all {secureProducts.length} products
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <Link href="/#contact" className="btn-ghost">
                  Request enterprise consultation
                </Link>
              </div>

              {/* The illustrative-values pill that used to sit here — between the
                  CTAs and the capability chips, on top of the hero footage —
                  is gone, along with its twin on the MobilityCare hero and the
                  two on the home page's console visuals. One badge repeated on
                  every product visual reads as chrome, not as disclosure.
                  Nothing replaces it: the capability grid carries its own 3rem
                  top margin, so the column closes up rather than leaving a gap
                  where the badge was. */}

              {/* Capability chips — text-only, two rows, each chip snug around
                  its own label so they stay readable over the moving video */}
              <div className="securevision-capability-grid">
                {[
                  ["Anomaly alerts", "Crowd analytics"],
                  ["Worker safety", "Privacy-first"],
                ].map((row) => (
                  <div key={row[0]} className="securevision-capability-row">
                    {row.map((label) => (
                      <div key={label} className="securevision-capability-chip">
                        {label}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
          </div>
        </div>
      </section>

      {/* GOVERNANCE NOTE */}
      <section className="border-y border-white/[0.06] bg-obsidian-300/40 py-6">
        <div className="container-wide">
          <div className="text-[12.5px] leading-relaxed text-soft-mute">
            <span className="font-semibold text-soft-white">
              Responsible deployment.
            </span>{" "}
            SecureVision leads with{" "}
            <Link
              href="#privacy-aware"
              className="text-royal-300 underline decoration-royal-300/40 underline-offset-2 transition-colors hover:text-royal-200"
            >
              identity-free safety intelligence
            </Link>{" "}
            — anomaly detection, crowd flow, worker safety and campus
            monitoring.{" "}
            <Link
              href="#authorized-identity"
              className="text-amber-300 underline decoration-amber-300/40 underline-offset-2 transition-colors hover:text-amber-200"
            >
              Identity and investigation capabilities
            </Link>{" "}
            are a separate, smaller group, intended only for lawful, authorized
            deployments with access controls, governance and auditability.
          </div>
        </div>
      </section>

      {/* MOVEMENT X-RAY
          Placed immediately after the governance note, which has just used
          the phrase "identity-free safety intelligence". That phrase is the
          whole SecureVision proposition and, as text, it is unfalsifiable —
          a reader has no way to check it. This shows it: the human view has a
          person in it, the AI view has a skeleton, two trajectories and two
          temporal channels, and nothing that distinguishes one walker from
          another.

          It is separated from the PrivacyGuard block further down the page on
          purpose. This answers "what does the model read?"; the privacy lens
          there answers "what is discarded, and at which step?" — different
          questions, and adjacent they would read as one repeated visual. */}
      <section id="x-ray" className="section site-anchor-offset">
        <div className="container-wide">
          <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
            <div>
              <SectionHeading
                eyebrow="Movement X-Ray"
                title={
                  <>
                    What the camera sees, and{" "}
                    <span className="text-gradient-secure">
                      what the model reads.
                    </span>
                  </>
                }
                description="Identity-free is a claim about what reaches the model. Switch the view and see what that leaves: geometry and timing, with no appearance in it."
                align="left"
              />
            </div>
            <MovementXRay
              family="securevision"
              humanCaption="Five moments in one walk. Everything that identifies a person — face, clothing, build, colour — is in this view, and none of it is what SecureVision's identity-free modules are looking for."
              aiCaption="The same walk as geometry and timing: a pose skeleton, ground contacts, the paths two landmarks trace, and those paths as temporal channels. An anomaly, a crowd flow or a safety event is read from this, which is why it can be read without knowing who is walking."
              reads={[
                {
                  label: "Pose geometry",
                  detail:
                    "Body keypoints and the skeleton between them. No appearance is carried forward from the frame.",
                },
                {
                  label: "Trajectory",
                  detail:
                    "Where movement goes. Direction, dwell and path shape are what crowd-flow and anomaly modules work from.",
                },
                {
                  label: "Timing channels",
                  detail:
                    "Landmark positions over time — the signal a movement anomaly appears in, before any judgement is made about it.",
                },
                {
                  label: "What is not here",
                  detail:
                    "No face, no clothing, no identity. SecureVision's identity capabilities are a separate, governed group and are not part of this path.",
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* PRODUCT SUITE — split into privacy-aware and authorized-identity
          groups, because the two carry different governance requirements and
          should never read as interchangeable. */}
      <section id="products" className="section">
        <div className="container-wide">
          <SectionHeading
            eyebrow="SecureVision · Product suite"
            title={
              <>
                {secureProducts.length} modular products,{" "}
                <span className="text-gradient-secure">two governance tiers.</span>
              </>
            }
            description="Each group carries its own governance requirements, and the two are never interchangeable."
            align="left"
          />
          <div className="mt-14">
            <SecureCapabilityGroups />
          </div>
        </div>
      </section>

      {/* PRIVACYGUARD DEEP BLOCK */}
      {privacy && (
        <section id={privacy.id} className="section bg-obsidian-300/40">
          <div className="container-wide">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  <Lock className="h-3.5 w-3.5" />
                  GaitAI PrivacyGuard
                </div>
                <h2 className="mt-5 font-display text-display-lg text-balance text-soft-white">
                  Movement intelligence —{" "}
                  <span
                    style={{
                      background:
                        "linear-gradient(135deg, #10B981 0%, #4FD1FF 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    without invasive surveillance.
                  </span>
                </h2>
                <p className="mt-5 max-w-md text-base leading-relaxed text-soft-gray">
                  {productOverview(privacy.id)}
                </p>
                <ul className="mt-6 grid gap-2">
                  {privacy.outputs.map((o) => (
                    <li
                      key={o}
                      className="flex items-center gap-2 text-sm text-soft-white"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {o}
                    </li>
                  ))}
                </ul>

                <p className="mt-6 max-w-md text-[12.5px] leading-relaxed text-soft-mute">
                  PrivacyGuard is privacy-aware architecture — it minimises
                  identifiable data and governs access. It is not a guarantee
                  of anonymity, and no compliance certification is claimed.
                </p>

                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                  <Link
                    href="/legal/security"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300 transition-colors hover:text-emerald-200"
                  >
                    Control documentation
                    <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/research#res-privacy"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 transition-colors hover:text-cyan-200"
                  >
                    Research basis
                    <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Privacy stack diagram */}
              <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6">
                <div className="ring-grid pointer-events-none absolute inset-0 opacity-30" />
                <div className="relative space-y-2.5">
                  {[
                    "Raw video feed",
                    "Face blur · skeleton extraction",
                    "Movement features only",
                    "Role-based access · audit logs",
                    "Retention policies · consent logs",
                    "Privacy-aware aggregated dashboards & reports",
                  ].map((layer, i) => (
                    <div
                      key={layer}
                      className="flex items-center gap-3 rounded-xl border border-emerald-300/20 bg-emerald-400/8 px-4 py-3"
                      style={{ marginLeft: `${i * 6}px` }}
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-300/15 text-emerald-300 ring-1 ring-emerald-300/30">
                        <Lock className="h-3 w-3" />
                      </span>
                      <span className="text-xs font-medium text-soft-white">
                        {layer}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* DEPLOYMENT ENVIRONMENTS */}
      <section className="section bg-obsidian-300/40">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Application environments"
            title={
              <>
                From transport hubs to{" "}
                <span className="text-gradient">smart cities.</span>
              </>
            }
            description="SecureVision is built for a range of operational environments — each with its own problem, product mix and output."
            align="left"
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {secureUseCases.map((u, i) => {
              const products = u.productIds
                .map((id) => productById(id))
                .filter((p): p is NonNullable<typeof p> => Boolean(p));
              return (
                <Reveal key={u.id} delay={(i % 3) * 0.08}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:border-royal-300/30 hover:bg-white/[0.04]">
                    <h3 className="font-display text-xl text-soft-white">
                      {u.industry}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-soft-mute">
                      {u.problem}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {products.map((p) => (
                        <span
                          key={p.id}
                          className="rounded-full border border-royal-300/30 bg-royal-300/8 px-2 py-0.5 text-[10.5px] font-medium text-royal-200"
                        >
                          {p.short}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.02] p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
                        Outputs
                      </div>
                      <div className="mt-1 text-[12.5px] leading-relaxed text-soft-white">
                        {u.outcome}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-10 sm:p-14">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-40 blur-3xl"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(45,108,223,0.3), transparent 70%)",
              }}
            />
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <span className="eyebrow">
                  <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                  Enterprise SecureVision · Smart-city &amp; campus deployments
                </span>
                <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
                  Request an enterprise safety analytics consultation.
                </h2>
              </div>
              <div className="flex gap-3">
                <Link href="/#contact" className="btn-primary">
                  {ctas.demo.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#privacyguard"
                  className="btn-ghost"
                >
                  See PrivacyGuard
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MovementIntelligenceSection
        id="securevision-intelligence-title"
        eyebrow="SECUREVISION INTELLIGENCE"
        emphasis="every movement."
        description="From gait identity and movement patterns to unusual behaviour and safety events — SecureVision turns human-motion signals into privacy-aware, actionable insight."
        rowOne={secureSignals}
      />
    </>
  );
}

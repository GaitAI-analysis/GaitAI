import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Lock,
  ShieldCheck,
  Siren,
  UsersRound,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ProductGrid } from "@/components/products/ProductGrid";
import { CrowdHeatmapVisual } from "@/components/visuals/CrowdHeatmapVisual";
import { industryUseCases, productById } from "@/data/products";

export const metadata: Metadata = {
  title: "SecureVision — Privacy-aware movement intelligence",
  description:
    "GaitAI SecureVision — Privacy-aware movement intelligence for safer campuses, transport hubs, factories, events and public spaces.",
};

const secureUseCases = industryUseCases.filter(
  (u) => u.vertical === "securevision"
);

export default function SecureVisionPage() {
  const suspicious = productById("suspiciousmotion");
  const crowdsense = productById("crowdsense");
  const industrial = productById("industrialsafety");
  const privacy = productById("privacyguard");

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden pt-36 pb-24 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-1/2 top-[10%] h-[640px] w-[1000px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(45,108,223,0.28), transparent 70%)",
            }}
          />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-40" />

        <div className="container-wide">
          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-royal-300/30 bg-royal-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-royal-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                GaitAI SecureVision · Privacy-first
              </div>
              <h1 className="mt-6 font-display text-display-2xl text-balance text-soft-white">
                Privacy-aware{" "}
                <span className="text-gradient-secure">movement intelligence</span>{" "}
                for safer public spaces.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-soft-gray sm:text-lg">
                Eleven AI-powered products built around safety analytics, crowd
                flow, anomaly detection and post-event investigation — backed
                by{" "}
                <span className="text-soft-white">a decade of gait research</span>,
                with PrivacyGuard enabled by default and full audit controls.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="#products" className="btn-primary">
                  See all 11 products
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/#contact" className="btn-ghost">
                  Request enterprise consultation
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: Siren, label: "Anomaly alerts" },
                  { icon: UsersRound, label: "Crowd analytics" },
                  { icon: Building2, label: "Worker safety" },
                  { icon: Lock, label: "Privacy-first" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-3"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-royal-400/10 text-royal-300 ring-1 ring-royal-300/20">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[11px] font-medium text-soft-white">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-glow relative h-[420px] overflow-hidden p-0">
              <div className="ring-grid absolute inset-0 opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <CrowdHeatmapVisual />
              </div>
              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/40 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-royal-300 backdrop-blur-md">
                <span className="pill-dot" />
                Crowd heatmap · live
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GOVERNANCE NOTE */}
      <section className="border-y border-white/[0.06] bg-obsidian-300/40 py-6">
        <div className="container-wide">
          <div className="flex items-start gap-3 text-[12.5px] leading-relaxed text-soft-mute">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/30">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <span className="font-semibold text-soft-white">
                Responsible deployment.
              </span>{" "}
              SecureVision leads with anomaly detection, crowd flow, worker
              safety and post-event investigation. Biometric, watchlist or
              identification capabilities deploy only with lawful authority,
              consent, audit controls and enterprise data governance.
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT GRID */}
      <section id="products" className="section">
        <div className="container-wide">
          <SectionHeading
            eyebrow="SecureVision · Product suite"
            title={
              <>
                Eleven products. One{" "}
                <span className="text-gradient-secure">privacy-first engine.</span>
              </>
            }
            description="Filter by capability area. PrivacyGuard is enabled by default across every deployment."
            align="left"
          />
          <div className="mt-10">
            <ProductGrid vertical="securevision" />
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
                  {privacy.description}
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
                    "Anonymized dashboards & reports",
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

      {/* SUSPICIOUSMOTION + CROWDSENSE + INDUSTRIAL */}
      <section className="section">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Featured · Anomaly · Crowd · Worker safety"
            title={
              <>
                Three engines.{" "}
                <span className="text-gradient-secure">One safety layer.</span>
              </>
            }
            description="From restricted-zone anomalies to stadium-scale crowd intelligence — SecureVision is built for the operations rooms running real spaces."
            align="left"
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {[suspicious, crowdsense, industrial].filter(Boolean).map((p, i) => {
              if (!p) return null;
              const Icon = p.icon;
              return (
                <Reveal key={p.id} delay={i * 0.1}>
                  <article
                    id={p.id}
                    className="card-glow relative h-full overflow-hidden p-7"
                  >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-royal-400/20 to-cyan-300/10 text-royal-300 ring-1 ring-royal-300/30">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="mt-5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-royal-300">
                      GaitAI · {p.short}
                    </div>
                    <h3 className="mt-1.5 font-display text-lg font-semibold text-soft-white">
                      {p.headline}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-soft-mute">
                      {p.description}
                    </p>
                  </div>
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {p.outputs.map((o) => (
                        <span
                          key={o}
                          className="rounded-full border border-royal-300/30 bg-royal-300/8 px-2 py-0.5 text-[10px] font-medium text-royal-200"
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* DEPLOYMENT ENVIRONMENTS */}
      <section className="section bg-obsidian-300/40">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Deployment environments"
            title={
              <>
                From transport hubs to{" "}
                <span className="text-gradient">smart cities.</span>
              </>
            }
            description="SecureVision is deployed across diverse operational environments — each with its own product mix and outcome."
            align="left"
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {secureUseCases.map((u, i) => {
              const Icon = u.icon;
              const products = u.productIds
                .map((id) => productById(id))
                .filter((p): p is NonNullable<typeof p> => Boolean(p));
              return (
                <Reveal key={u.id} delay={(i % 3) * 0.08}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:border-royal-300/30 hover:bg-white/[0.04]">
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-royal-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-display text-xl text-soft-white">
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
                        Outcome
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
                  Request a demo
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
    </>
  );
}

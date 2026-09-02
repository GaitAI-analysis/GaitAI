import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { productCount } from "@/data/products";
import { InvestorSignal } from "./InvestorSignal";

/**
 * Wording policy: this section previously asserted "multiple live pilots in
 * healthcare and sports" and "clinical-grade" products. Neither is documented
 * anywhere in this repository, so both were removed. What remains describes
 * the platform as built and the direction being funded. Nothing here states a
 * round size, valuation, revenue, traction figure, named investor or incubator.
 */

/* ── Icons — custom line-art, sized and weighted to match the section ──
   Deliberately not from an icon library: each one is a domain mark rather
   than a generic glyph. */

function IconPosition() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="7.6" r="4" />
      <circle className="inv-icon-fill" cx="10" cy="7.6" r="1.3" />
      <path d="M10 11.9v3.2" />
      <path d="M2.6 16.6h14.8" />
      <path d="M5.2 15.1v1.5M14.8 15.1v1.5" />
    </svg>
  );
}

function IconSystem() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 2.4 17 6.4v7.2L10 17.6 3 13.6V6.4Z" />
      <path d="M10 2.4v7.6" />
      <path d="M10 10 17 6.4M10 10 3 6.4" />
      <circle className="inv-icon-fill" cx="10" cy="10" r="1.1" />
    </svg>
  );
}

function IconPartners() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="7.1" cy="7.4" r="3.3" />
      <circle cx="12.9" cy="12.6" r="3.3" />
      <path d="M9.5 9.6 10.5 10.4" />
      <path d="M3.1 16.4c.7-1.7 2.1-2.6 4-2.6" />
      <path d="M16.9 3.6c-.7 1.7-2.1 2.6-4 2.6" />
    </svg>
  );
}

type Tone = "cyan" | "royal" | "violet";

/**
 * Full class names, written out. Tailwind scans source for literal class
 * strings and drops any @layer components rule it cannot find, so composing
 * these by interpolation (`inv-card--${tone}`) silently loses the per-card
 * accent at build time.
 */
const CARD_CLASS: Record<Tone, string> = {
  cyan: "inv-card inv-card--cyan",
  royal: "inv-card inv-card--royal",
  violet: "inv-card inv-card--violet",
};

type Dimension = {
  tone: Tone;
  eyebrow: string;
  title: string;
  desc: string;
  icon: ReactNode;
};

const dimensions: Dimension[] = [
  {
    tone: "cyan",
    eyebrow: "01 · Platform state",
    title: "Where we are",
    desc: `A movement-intelligence platform with two verticals and ${productCount} modular products, built on a peer-reviewed gait research record and a granted Indian patent.`,
    icon: <IconPosition />,
  },
  {
    tone: "royal",
    eyebrow: "02 · Direction",
    title: "What we're building",
    desc: "Taking the MobilityCare assessment products — WalkScan, FallRisk, RehabTrack and WatchCare — from platform to pilot-backed commercial workflows, alongside privacy-aware SecureVision deployments in campus and public-space environments.",
    icon: <IconSystem />,
  },
  {
    tone: "violet",
    eyebrow: "03 · Partners",
    title: "Who we want to work with",
    desc: "Deep-tech and healthcare-focused investors, incubators, research grants, and partners with a long view of human-centric AI.",
    icon: <IconPartners />,
  },
];

/**
 * Investors & incubation.
 *
 * The section is built as one signal system: a walking motion-capture sequence
 * is sampled into a gait signal, gathered at a convergence node, and fanned
 * along three traces into the three investment dimensions — movement becoming
 * intelligence becoming scale. Motion is CSS-only and slow by design; the
 * whole choreography runs on a single 8s loop and stops entirely under
 * prefers-reduced-motion.
 */
export function Investors() {
  return (
    /* `isolate` matters: the ambient layer sits at -z-10, and without a stacking
       context on the section it would paint behind the section's own background
       rather than above it. */
    <section
      id="investors"
      className="inv-section section relative isolate overflow-hidden bg-obsidian-300/40"
    >
      {/* ── Ambient depth — faint cyan left, faint violet right ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="inv-ambient inv-ambient--cyan" />
        <div className="inv-ambient inv-ambient--violet" />
        <div className="inv-dotfield" />
      </div>

      <div className="container-wide">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.06fr] lg:gap-16 xl:gap-20">
          {/* ─────────── LEFT — statement + signal ─────────── */}
          <div>
            <Reveal>
              <span className="inv-eyebrow">
                <span aria-hidden className="inv-eyebrow-rule" />
                Investors &amp; incubation
              </span>
              <h2 className="mt-5 max-w-[23ch] font-display text-display-md text-balance text-soft-white">
                We&apos;re raising for the next stage of{" "}
                <span className="inv-champagne">movement intelligence.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.08}>
              <p className="mt-6 max-w-md text-[0.9875rem] leading-[1.75] text-soft-gray">
                Backing the intelligence layer that will transform how the world
                moves, performs and stays safe.
              </p>
            </Reveal>

            <Reveal delay={0.16} className="mt-10 lg:mt-12">
              <figure className="inv-stage">
                <InvestorSignal className="hidden sm:block" />
                <InvestorSignal compact className="sm:hidden" />
                <figcaption className="inv-stage-legend">
                  <span>Gait capture</span>
                  <span aria-hidden className="inv-stage-legend-rule" />
                  <span>Movement signal</span>
                  <span aria-hidden className="inv-stage-legend-rule" />
                  <span>Platform scale</span>
                </figcaption>
              </figure>
            </Reveal>
          </div>

          {/* ─────────── RIGHT — three investment dimensions ─────────── */}
          <div className="inv-rail">
            {dimensions.map((dimension, i) => (
              <Reveal key={dimension.title} delay={0.22 + i * 0.1}>
                <article
                  className={CARD_CLASS[dimension.tone]}
                  style={{ "--inv-c": i } as CSSProperties}
                >
                  <span aria-hidden className="inv-card-lead" />
                  <span aria-hidden className="inv-card-node" />
                  <div className="inv-card-inner">
                    <span aria-hidden className="inv-card-icon">
                      {dimension.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="inv-card-eyebrow">{dimension.eyebrow}</p>
                      <h3 className="inv-card-title">{dimension.title}</h3>
                      <p className="inv-card-desc">{dimension.desc}</p>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}

            <Reveal delay={0.56}>
              <Link href="/#contact" className="inv-cta">
                <span className="inv-cta-label">Talk to us about investment</span>
                <svg
                  className="inv-cta-arrow"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M3.5 10h12" />
                  <path d="M10.8 5.2 15.6 10l-4.8 4.8" />
                </svg>
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

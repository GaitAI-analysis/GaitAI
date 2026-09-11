"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeImage, ThemeVideo } from "@/components/ui/ThemeMedia";
import type { ThemeMediaKey } from "@/lib/theme-media";
import { mobilityProducts, secureProducts } from "@/data/products";

/**
 * THE TWO FAMILIES — one band each, and each one addressable.
 * =============================================================================
 * This was a single section holding two tall panels side by side: brand,
 * headline, description, a 21rem console, four featured capabilities and a
 * CTA, twice. About 1,700px, and — the reason it had to change — two panels
 * inside ONE section, which meant `/#mobilitycare` and `/#securevision` could
 * not both be real places. Side by side they also share a scroll position, so
 * a section navigator could never say which of them you were looking at.
 *
 * They are now two sections, each `id`'d as its family, each a two-column band
 * of copy and console. That buys three things at once: the navigator can
 * highlight exactly one of them, both hashes are genuine destinations, and the
 * stacked pair is shorter than the side-by-side pair was, because the console
 * sits BESIDE the copy instead of under it.
 *
 * WHAT LEFT THIS BAND. The four "featured capabilities" per family — which were
 * the same four products the Products section directly below renders as cards,
 * stated twice on one page in two different treatments. The count line that
 * described them ("4 of 12 products") moved with them; what stays here is the
 * total, because "twelve modules" is a fact about the family and the band is
 * the family's statement.
 *
 * The console footage, the wordmarks, the accent system and the panel
 * treatment are all untouched.
 */

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
  },
};

type PanelTone = "care" | "secure";

interface FamilyBandProps {
  /** The element id, and therefore the hash: `#mobilitycare`. */
  id: string;
  tone: PanelTone;
  name: string;
  descriptor: string;
  headline: string;
  headlineAccent: string;
  description: string;
  href: string;
  /** Key into `lib/theme-media.ts` for the product wordmark. */
  brandKey: ThemeMediaKey;
  /** Key into `lib/theme-media.ts` for the console footage. */
  consoleKey: ThemeMediaKey;
  visualLabel: string;
  /** Corner tag on the console surface. These are rendered demo footage,
   *  not a live feed, so the tag must not say "Live". */
  consoleTag: string;
  totalProducts: number;
  reduceMotion: boolean;
  /** The console goes on the left for the second band, so the pair alternates
   *  rather than reading as the same layout printed twice. */
  mirrored?: boolean;
}

const tones = {
  care: {
    panel: "flagship-panel--care",
    accent: "text-gradient-mobility",
    visual: "product-visual-shell--care",
    status: "bg-teal-300 text-teal-200",
    cta: "product-accent-text hover:border-teal-300/40 focus-visible:ring-teal-300/70",
  },
  secure: {
    panel: "flagship-panel--secure",
    accent: "text-gradient-secure",
    visual: "product-visual-shell--secure",
    status: "bg-royal-300 text-royal-200",
    cta: "product-accent-text hover:border-royal-300/40 focus-visible:ring-royal-300/70",
  },
} as const;

function PlatformSplit() {
  return (
    <div
      className="relative mx-auto h-[9.25rem] max-w-5xl sm:h-[10rem]"
      role="img"
      aria-label="One shared GaitAI intelligence layer powers both product systems"
    >
      <div className="platform-core-node absolute left-1/2 top-0 z-10 -translate-x-1/2">
        <Logo variant="icon" size="lg" />
        <span className="text-left">
          <span className="block whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.16em] text-soft-gray sm:text-xs">
            Shared intelligence layer
          </span>
          <span className="mt-1 block whitespace-nowrap font-display text-lg font-bold tracking-[-0.02em] text-soft-white sm:text-[22px]">
            GaitAI Core
          </span>
        </span>
      </div>

      <svg
        aria-hidden="true"
        className="absolute inset-x-0 top-[4.25rem] h-24 w-full overflow-visible sm:top-[4.75rem]"
        viewBox="0 0 1000 112"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M500 0V24"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinecap="round"
          className="text-cyan-300/45"
        />
        <path
          d="M500 24C500 58 250 42 250 104"
          stroke="#0FA3B1"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.54"
        />
        <path
          d="M500 24C500 58 750 42 750 104"
          stroke="#5B8CFF"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.54"
        />
        <circle cx="250" cy="104" r="3" fill="#0FA3B1" fillOpacity="0.82" />
        <circle cx="750" cy="104" r="3" fill="#5B8CFF" fillOpacity="0.82" />
      </svg>
    </div>
  );
}

function FamilyBand({
  id,
  tone,
  name,
  descriptor,
  headline,
  headlineAccent,
  description,
  href,
  brandKey,
  consoleKey,
  visualLabel,
  consoleTag,
  totalProducts,
  reduceMotion,
  mirrored = false,
}: FamilyBandProps) {
  const style = tones[tone];
  const titleId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="home-section relative w-full pb-9 pt-9 sm:pb-11 sm:pt-11"
    >
      <div className="container-wide">
        <motion.article
          initial={reduceMotion ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={cardVariants}
          /* Not a whole-panel link, deliberately: this is a section-sized
             surface with autoplaying console footage in the middle of it, and
             a click target that big is a surprise rather than an affordance.
             What it does take from the shared language is the hint — hovering
             anywhere on the panel brightens its CTA. */
          className={`flagship-panel ${style.panel} group/panel grid items-center gap-7 overflow-hidden p-5 sm:p-7 lg:grid-cols-2 lg:gap-10 lg:p-9`}
        >
          <div className={mirrored ? "lg:order-2" : undefined}>
            <header className="flex min-h-14 items-center sm:min-h-16">
              <h2 id={titleId} className="sr-only">
                {name}
              </h2>
              <p className="sr-only">{descriptor}</p>
              {/* One image, resolved to the active theme — not two `<Image>`
                  elements with `dark:hidden` on one, which downloaded both
                  PNGs for every visitor and showed one. */}
              <div className="relative h-14 w-full max-w-[13rem] sm:h-16 sm:max-w-[15rem]">
                <ThemeImage
                  mediaKey={brandKey}
                  alt={name}
                  fill
                  sizes="(max-width: 640px) calc(100vw - 5rem), 256px"
                  className="object-contain object-left"
                />
              </div>
            </header>

            <h3 className="mt-4 font-display text-[clamp(1.8rem,3.1vw,2.6rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-soft-white">
              <span className="block">{headline}</span>
              <span className={`mt-1 block ${style.accent}`}>
                {headlineAccent}
              </span>
            </h3>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-soft-gray sm:text-[15px]">
              {description}
            </p>

            <Link
              href={href}
              className={`group/cta mt-6 flex min-h-14 max-w-md items-center justify-between gap-5 border-t border-white/12 pt-5 text-[15px] font-bold transition-colors focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-obsidian ${style.cta}`}
            >
              <span>
                Explore {name}
                <span className="ml-2 text-[11px] font-medium uppercase tracking-[0.14em] text-soft-mute">
                  {totalProducts} modules
                </span>
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-current/40 transition-[transform,border-color] duration-300 group-hover/panel:border-current/60 group-hover/cta:translate-x-1 group-hover/cta:border-current/60">
                <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
            </Link>
          </div>

          <div
            aria-hidden="true"
            className={`product-visual-shell ${style.visual} relative -mx-5 h-[13rem] overflow-hidden border-y sm:-mx-7 sm:h-[15rem] lg:mx-0 lg:h-[16.5rem] lg:rounded-xl lg:border ${
              mirrored ? "lg:order-1" : ""
            }`}
          >
            <div className="ring-grid absolute inset-0 opacity-25" />
            <div className="absolute left-5 top-5 z-10 inline-flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${style.status}`} />
              <span className="text-[9px] font-semibold uppercase tracking-[0.17em] text-soft-mute sm:text-[10px]">
                {visualLabel}
              </span>
            </div>
            <div className="absolute right-5 top-4 z-10 rounded-md border border-white/10 bg-obsidian/70 px-2.5 py-1 font-mono text-[9px] text-soft-gray shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:text-[10px]">
              {consoleTag}
            </div>
            {/* The console surface: one cinematic render, both themes. The
                footage IS what is being shown here — its navy, its cyan, its
                overlays and its contrast are the product's own console — so a
                theme may change the page around it and must not restage it.
                Reduced motion gets this film's own poster frame. */}
            <ThemeVideo
              mediaKey={consoleKey}
              className="platform-console-video"
              reduceMotion={reduceMotion}
              sizes="(max-width: 1024px) 100vw, 620px"
            />
          </div>
          <p className="sr-only">
            The console above is illustrative demo footage with example values,
            not a live feed or a real deployment.
          </p>
        </motion.article>
      </div>
    </section>
  );
}

/** The shared-core diagram and the two family bands under it. */
export function Verticals() {
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <>
      <div className="relative w-full pt-9 sm:pt-11">
        <div className="container-wide">
          {/* Eyebrow pill — same badge language as the hero pill in Hero.tsx */}
          <div className="mb-6 flex justify-center sm:mb-7">
            <span className="inline-flex max-w-[calc(100vw-3rem)] items-center rounded-full border border-cyan-300/20 bg-obsidian/55 px-4 py-1.5 text-center text-[10px] font-semibold tracking-[0.14em] text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:text-xs">
              Building the future of human movement intelligence.
            </span>
          </div>

          <PlatformSplit />
        </div>
      </div>

      <FamilyBand
        id="mobilitycare"
        tone="care"
        name="MobilityCare"
        descriptor="Clinical movement intelligence"
        headline="Clinical mobility"
        headlineAccent="intelligence."
        // "built with clinicians, for clinicians" claimed a co-design
        // relationship nothing in the repository documents. What is true is
        // the design constraint: clinician-reviewable outputs.
        description="Camera-based gait assessment, rehabilitation tracking, fall-risk screening, sports movement analytics and smartwatch monitoring — every output structured for a clinician to review, not a black-box score."
        href="/mobilitycare"
        brandKey="mobilityCareWordmark"
        consoleKey="mobilityCareHome"
        visualLabel="Clinical mobility console"
        consoleTag="WalkScan · Demo"
        totalProducts={mobilityProducts.length}
        reduceMotion={reduceMotion}
      />

      <FamilyBand
        id="securevision"
        tone="secure"
        name="SecureVision"
        descriptor="Privacy-aware spatial intelligence"
        headline="Privacy-aware"
        headlineAccent="movement intelligence."
        description="Movement anomaly detection, crowd flow analytics, worker safety, defence personnel readiness and post-event investigation — designed around privacy-first architecture, lawful deployment and auditability."
        href="/securevision"
        brandKey="secureVisionWordmark"
        consoleKey="secureVisionHome"
        visualLabel="Privacy-aware ops console"
        consoleTag="SecureVision · Demo"
        totalProducts={secureProducts.length}
        reduceMotion={reduceMotion}
        mirrored
      />
    </>
  );
}

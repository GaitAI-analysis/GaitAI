"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeImage, ThemeVideo } from "@/components/ui/ThemeMedia";
import { MobilityDashboardVisual } from "@/components/visuals/MobilityDashboardVisual";
import { SecureOperationsVisual } from "@/components/visuals/SecureOperationsVisual";
import type { ThemeMediaKey } from "@/lib/theme-media";
import { capabilityIconById } from "@/components/icons/CapabilityIcons";
import {
  mobilityProducts,
  secureProducts,
  type GaitProduct,
} from "@/data/products";

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.85,
      ease: [0.16, 1, 0.3, 1],
      delay: i * 0.1,
    },
  }),
};

const mobilityHighlights = mobilityProducts
  .filter((product) => product.featured)
  .slice(0, 4);
const secureHighlights = secureProducts
  .filter((product) => product.featured)
  .slice(0, 4);

type PanelTone = "care" | "secure";

interface FlagshipPanelProps {
  id: string;
  index: number;
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
  /** What light mode draws in place of the dark film. */
  lightConsole: ReactNode;
  visualLabel: string;
  /** Corner tag on the console surface. These are rendered demo footage,
   *  not a live feed, so the tag must not say "Live". */
  consoleTag: string;
  products: GaitProduct[];
  totalProducts: number;
  reduceMotion: boolean;
}

const tones = {
  care: {
    panel: "flagship-panel--care",
    accent: "text-gradient-mobility",
    visual: "product-visual-shell--care",
    status: "bg-teal-300 text-teal-200",
    capabilityIcon:
      "border-teal-300/20 bg-teal-300/[0.07] product-accent-text group-hover/capability:border-teal-300/35 group-hover/capability:bg-teal-300/[0.1]",
    capability:
      "hover:border-teal-300/25 hover:bg-teal-300/[0.035]",
    cta: "product-accent-text hover:border-teal-300/40 focus-visible:ring-teal-300/70",
  },
  secure: {
    panel: "flagship-panel--secure",
    accent: "text-gradient-secure",
    visual: "product-visual-shell--secure",
    status: "bg-royal-300 text-royal-200",
    capabilityIcon:
      "border-royal-300/20 bg-royal-300/[0.07] product-accent-text group-hover/capability:border-royal-300/35 group-hover/capability:bg-royal-300/[0.1]",
    capability:
      "hover:border-royal-300/25 hover:bg-royal-300/[0.035]",
    cta: "product-accent-text hover:border-royal-300/40 focus-visible:ring-royal-300/70",
  },
} as const;

function PlatformSplit() {
  return (
    <div
      className="relative mx-auto h-[12.25rem] max-w-5xl sm:h-[13.25rem]"
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
        className="absolute inset-x-0 top-[4.75rem] h-28 w-full overflow-visible sm:top-[5.75rem]"
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

function FlagshipPanel({
  id,
  index,
  tone,
  name,
  descriptor,
  headline,
  headlineAccent,
  description,
  href,
  brandKey,
  consoleKey,
  lightConsole,
  visualLabel,
  consoleTag,
  products,
  totalProducts,
  reduceMotion,
}: FlagshipPanelProps) {
  const style = tones[tone];
  const titleId = `${id}-title`;

  return (
    <motion.div
      initial={reduceMotion ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={cardVariants}
      custom={index}
      className="h-full"
    >
      {/* Not a whole-panel link, deliberately: this is a section-sized surface
          with autoplaying console footage in the middle of it, and a click
          target that big is a surprise rather than an affordance. What it does
          take from the shared language is the hint — hovering anywhere on the
          panel brightens its CTA, so the destination announces itself before
          the pointer reaches it. */}
      <article
        id={id}
        aria-labelledby={titleId}
        className={`flagship-panel ${style.panel} group/panel flex h-full flex-col overflow-hidden p-5 sm:p-7 lg:p-8`}
      >
        <header className="flex min-h-20 items-center sm:min-h-24">
          <h2 id={titleId} className="sr-only">
            {name}
          </h2>
          <p className="sr-only">{descriptor}</p>
          {/* One image, resolved to the active theme. This used to be two
              `<Image>` elements with `dark:hidden` on one of them, which
              downloaded both PNGs for every visitor and showed one. */}
          <div className="relative h-20 w-full max-w-[17rem] sm:h-24 sm:max-w-[19rem]">
            <ThemeImage
              mediaKey={brandKey}
              alt={name}
              fill
              sizes="(max-width: 640px) calc(100vw - 5rem), 304px"
              className="object-contain object-left"
            />
          </div>
        </header>

        <div className="mt-8 sm:mt-10">
          <h3 className="font-display text-[clamp(2.25rem,4.25vw,3.7rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-soft-white">
            <span className="block">{headline}</span>
            <span className={`mt-1.5 block ${style.accent}`}>
              {headlineAccent}
            </span>
          </h3>
          <p className="mt-4 max-w-xl text-sm leading-[1.4] text-soft-gray sm:text-[15px]">
            {description}
          </p>
        </div>

        <div
          aria-hidden="true"
          className={`product-visual-shell ${style.visual} relative -mx-5 mt-8 h-[21rem] overflow-hidden border-y sm:-mx-7 sm:mt-9 lg:-mx-8`}
        >
          <div className="ring-grid absolute inset-0 opacity-25" />
          <div className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 sm:left-7 sm:top-6">
            <span className={`h-1.5 w-1.5 rounded-full ${style.status}`} />
            <span className="text-[9px] font-semibold uppercase tracking-[0.17em] text-soft-mute sm:text-[10px]">
              {visualLabel}
            </span>
          </div>
          <div className="absolute right-5 top-4 z-10 rounded-md border border-white/10 bg-obsidian/70 px-2.5 py-1 font-mono text-[9px] text-soft-gray shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:right-7 sm:top-5 sm:text-[10px]">
            {consoleTag}
          </div>
          {/* The console surface, per theme.

              DARK plays the cinematic render, unchanged and frozen — the same
              file, the same poster, the same framing that shipped.

              LIGHT draws the vector console for this product instead. The film
              is lit for a night laboratory: on a white page it read as a hole
              punched through the panel, and dimming or brightening a
              photographic asset would only have made it a grey hole. The
              vector version carries the same subject — walking figure, pose
              tracking, movement analytics, the product's own console — in the
              light palette, at the same aspect in the same frame, and it costs
              no download at all.

              Reduced motion still gets a still frame of whichever source the
              theme is actually showing, never the other theme's poster.

              The disclosure is unchanged: the tag above says "Demo", and the
              sr-only line below states in full that this is illustrative
              footage with example values. */}
          <ThemeVideo
            mediaKey={consoleKey}
            className="platform-console-video"
            lightVisual={lightConsole}
            reduceMotion={reduceMotion}
            sizes="(max-width: 1024px) 100vw, 640px"
          />
        </div>
        <p className="sr-only">
          The console above is illustrative demo footage with example values,
          not a live feed or a real deployment.
        </p>

        <div className="mt-8 sm:mt-9">
          <div className="flex items-end justify-between gap-4 border-b border-white/8 pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-soft-white">
              Featured capabilities
            </h3>
            <span className="text-[10px] text-soft-mute">
              4 of {totalProducts} products
            </span>
          </div>
          <ul
            className="grid sm:grid-cols-2"
            aria-label={`${name} featured capabilities`}
          >
            {products.map((product) => {
              // Refined motion-analysis pictograms for the featured eight;
              // any other product falls back to its Lucide glyph.
              const CapabilityIcon =
                capabilityIconById[
                  product.id as keyof typeof capabilityIconById
                ];
              const ProductIcon = product.icon;
              return (
                <li
                  key={product.id}
                  className={`group/capability flex min-h-[5.25rem] items-start gap-3 border-b border-white/8 px-1 py-4 transition-colors duration-300 sm:odd:pr-4 sm:even:border-l sm:even:pl-4 ${style.capability}`}
                >
                  <span
                    className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors duration-300 ${style.capabilityIcon}`}
                  >
                    {CapabilityIcon ? (
                      <CapabilityIcon className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <ProductIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-soft-white">
                      {product.short}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-soft-mute">
                      {product.label}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <Link
          href={href}
          className={`group/cta mt-auto flex min-h-16 items-center justify-between gap-5 border-t border-white/12 pt-6 text-[15px] font-bold transition-colors focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-obsidian ${style.cta}`}
        >
          <span>Explore {name}</span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-current/40 transition-[transform,border-color] duration-300 group-hover/panel:border-current/60 group-hover/cta:translate-x-1 group-hover/cta:border-current/60">
            <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
        </Link>
      </article>
    </motion.div>
  );
}

export function Verticals() {
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <section
      id="platform-verticals"
      className="relative w-full pb-28 pt-20 sm:pb-32 sm:pt-24 lg:pb-40 lg:pt-28"
    >
      <div className="container-wide">
        {/* Eyebrow pill — same badge language as the hero pill in Hero.tsx */}
        <div className="mb-8 flex justify-center sm:mb-10">
          <span className="inline-flex max-w-[calc(100vw-3rem)] items-center rounded-full border border-cyan-300/20 bg-obsidian/55 px-4 py-1.5 text-center text-[10px] font-semibold tracking-[0.14em] text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:text-xs">
            Building the future of human movement intelligence.
          </span>
        </div>

        <PlatformSplit />

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-7">
          <FlagshipPanel
            id="mobilitycare-card"
            index={0}
            tone="care"
            name="MobilityCare"
            descriptor="Clinical movement intelligence"
            headline="Clinical mobility"
            headlineAccent="intelligence."
            // "built with clinicians, for clinicians" claimed a co-design
            // relationship nothing in the repository documents. What is true
            // is the design constraint: clinician-reviewable outputs.
            description="Camera-based gait assessment, rehabilitation tracking, fall-risk screening, sports movement analytics and smartwatch monitoring — every output structured for a clinician to review, not a black-box score."
            href="/mobilitycare"
            brandKey="mobilityCareWordmark"
            consoleKey="mobilityCareHome"
            lightConsole={<MobilityDashboardVisual />}
            visualLabel="Clinical mobility console"
            consoleTag="WalkScan · Demo"
            products={mobilityHighlights}
            totalProducts={mobilityProducts.length}
            reduceMotion={reduceMotion}
          />

          <FlagshipPanel
            id="securevision-card"
            index={1}
            tone="secure"
            name="SecureVision"
            descriptor="Privacy-aware spatial intelligence"
            headline="Privacy-aware"
            headlineAccent="movement intelligence."
            description="Movement anomaly detection, crowd flow analytics, worker safety and post-event investigation — designed around privacy-first architecture, lawful deployment and auditability."
            href="/securevision"
            brandKey="secureVisionWordmark"
            consoleKey="secureVisionHome"
            lightConsole={<SecureOperationsVisual />}
            visualLabel="Privacy-aware ops console"
            consoleTag="SecureVision · Demo"
            products={secureHighlights}
            totalProducts={secureProducts.length}
            reduceMotion={reduceMotion}
          />
        </div>
      </div>
    </section>
  );
}

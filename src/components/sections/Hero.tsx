"use client";

import { productCount } from "@/data/products";
import { TryGaitAI } from "@/components/home/TryGaitAI";
import { HeroSlider, type HeroFrame } from "./HeroSlider";

/**
 * THE HOMEPAGE HERO — three approved frames behind live copy.
 *
 * The background is `HeroSlider`, cycling the three bands cut from the
 * approved artwork in `public/images/hero/`. Everything a visitor reads here
 * is HTML: the three frames' copy lives in `FRAMES` below and is what to edit
 * when the words change. `HeroMotionBackground` — the WebGL walk this section
 * carried before — is untouched and still renders behind /research/talks.
 *
 * The frames' copy is the copy painted into the approved artwork, made live:
 * the same eyebrow, headline (with its one accented phrase), sub-line and CTA
 * per frame. The demo and the evidence line are constant across frames and
 * are passed in beneath the CTA.
 */
const FRAMES: HeroFrame[] = [
  {
    id: "gaitai",
    image: "gaitai-hero-01",
    width: 2172,
    height: 193,
    pos: "49% 50%",
    posNarrow: "49% 50%",
    alt: "",
    short: "GaitAI",
    eyebrow: "Human movement intelligence",
    title: (
      <>
        What can movement tell us <em>before</em> we can see it?
      </>
    ),
    sub: "GaitAI turns everyday movement into intelligence for health, safety and identity.",
    cta: { label: "Explore GaitAI", href: "/products/" },
    words: ["Movement", "People", "Health", "Safety", "Identity", "A more inclusive world"],
    tagline: "Every step holds a brighter tomorrow.",
  },
  {
    id: "mobilitycare",
    image: "gaitai-hero-02-mobilitycare",
    width: 2172,
    height: 193,
    pos: "45% 50%",
    posNarrow: "44% 50%",
    alt: "",
    short: "MobilityCare",
    eyebrow: "MobilityCare · Health-first",
    title: (
      <>
        What if walking could signal risk <em>before a fall happens?</em>
      </>
    ),
    sub: "MobilityCare turns movement into actionable insights for early detection, rehabilitation and better outcomes.",
    cta: { label: "Explore MobilityCare", href: "/mobilitycare/" },
    words: ["Predict", "Prevent", "Support", "Rehabilitate", "Empower", "Healthier tomorrows"],
    tagline: "Movement for a better quality of life.",
  },
  {
    id: "securevision",
    image: "gaitai-hero-03-securevision",
    width: 2172,
    height: 194,
    pos: "52% 50%",
    posNarrow: "53% 50%",
    alt: "",
    short: "SecureVision",
    eyebrow: "SecureVision · Privacy-first",
    title: (
      <>
        Can movement make physical spaces <em>safer?</em>
      </>
    ),
    sub: "SecureVision brings privacy-aware movement intelligence for public and operational environments.",
    cta: { label: "Explore SecureVision", href: "/securevision/" },
    words: ["Detect", "Alert", "Protect", "Respect privacy", "Enable safer spaces", "People-centric AI"],
    tagline: "Safer spaces for stronger communities.",
  },
];

export function Hero() {
  return (
    <section
      id="platform"
      aria-labelledby="home-hero-title"
      /* No padding here: the slider paints the artwork over the whole section
         and carries the copy's vertical breathing room itself. */
      className="site-viewport-section relative w-full overflow-hidden"
    >
      <HeroSlider frames={FRAMES}>
        <TryGaitAI />
        <p className="basis-full pt-1 text-[13px] leading-relaxed text-slate-300/75 sm:text-sm">
          Clinical mobility and privacy-aware public safety, on one platform —
          MobilityCare and SecureVision, {productCount} connected modules.
        </p>
      </HeroSlider>
    </section>
  );
}

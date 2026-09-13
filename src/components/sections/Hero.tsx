"use client";

import { productCount } from "@/data/products";
import { TryGaitAI } from "@/components/home/TryGaitAI";
import { HeroSlider, type HeroFrame } from "./HeroSlider";
import styles from "./heroSlider.module.css";

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
    /* 39%, from 42%: the central walker stood at x≈990 of 1440, shoulder to
       shoulder with the end of the headline's first line. Three points shift
       the window ~100px so he walks in the clear space to the right of the
       copy. The window's left edge lands at ~27.4% of the band, just past the
       painted CTA (which ends at ~27.3%), and the left vignette covers the
       first 7% of the viewport anyway. Narrow screens keep their own crop. */
    pos: "39% 50%",
    posNarrow: "49% 50%",
    /* The walker stood a little large at the default strip; ~12% shorter
       shows ~30% of the band instead of ~26%, so he is smaller in frame and
       the 193px source is upscaled ~2.2× instead of ~2.5× — the same pixels,
       fewer screen pixels each, nothing blurred. */
    strip: "clamp(52%, 30vw, 100%)",
    alt: "",
    short: "GaitAI",
    eyebrow: "Human movement intelligence",
    title: (
      <>
        <span className={styles.line}>What can movement tell us</span>
        <span className={styles.line}>
          <em>before</em> we can see it?
        </span>
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
    pos: "38% 50%",
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
    overlay: "securevision-event-overlay.svg",
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
        <p className="basis-full pt-1 text-[13px] leading-relaxed text-slate-200/70 sm:text-sm">
          Clinical mobility and privacy-aware public safety, on one platform —
          MobilityCare and SecureVision, {productCount} connected modules.
        </p>
      </HeroSlider>
    </section>
  );
}

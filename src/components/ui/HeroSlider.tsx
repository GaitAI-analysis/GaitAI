"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTheme } from "next-themes";
import { ThemePicture } from "@/components/ui/ThemePicture";
import { ThemeVideo } from "@/components/ui/ThemeMedia";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import type { ThemeMediaKey } from "@/lib/theme-media";

/**
 * THE TWO-SLIDE HERO — a supplied still first, the existing film second.
 * =============================================================================
 * The /mobilitycare/ and /securevision/ heroes each had one background layer:
 * a ThemeVideo pair (dark film, light film). The founder supplied a finished
 * premium picture for each page's hero — the light one first, then a dark
 * companion (both 2026-09-22) — and asked for it to be what a visitor sees
 * first, with the film kept as a second slide rather than deleted. This is
 * that: two absolutely positioned layers in one clipped box, cross-faded —
 * never cut — on a slow clock.
 *
 * ── ONE SLIDER, TWO THEMES ─────────────────────────────────────────────────
 * The slide order is the same in both themes: still, then film. What the
 * theme changes is the pair of files —
 *
 *   light: [stills.light, the film's light companion]
 *   dark:  [stills.dark,  the film's dark original]
 *
 * — and that choice is made by the site's own theme-aware media, not here:
 * the still is one `ThemePicture` with a dark and a light candidate, the
 * film is the registered `ThemeVideo` pair. Both resolve the theme in the
 * inline bootstrap before first paint (a dark visitor never downloads the
 * light picture, and there is no flash of the other theme's art) and swap
 * their file in place when the theme toggles. The clock is untouched by a
 * toggle: the slide index carries on and only the pictures change, so a
 * reader who toggles mid-fade sees the same slide in the other theme. The
 * still is slide 0 and paints first in both themes, so it is the LCP
 * candidate and there is no flash of film before it.
 *
 * Framing is per theme AND per hero: each still has its own focal point and
 * left inset in globals.css (four pictures, four sets of numbers), and each
 * theme's readability shade is a gradient localised to the copy column,
 * never a wash over the picture — the dark art keeps its blacks, navy and
 * cyan exactly as delivered.
 *
 * ── THE CLOCK ──────────────────────────────────────────────────────────────
 * 7 s a slide, 1.4 s cross-fade (both in CSS custom properties on the root
 * so the stylesheet and the timer agree). The active still drifts to 1.03×
 * over its whole stay — the only motion on it — and the film slide only
 * fades, so the film's framing and the daylight overlay registered to it are
 * untouched. The film plays only while its slide is showing (`active`), so a
 * hidden film costs no decode.
 *
 * The clock stops when it should: while the tab is hidden, while the hero is
 * scrolled out of view, while a pointer or focus rests on the pagination,
 * under `prefers-reduced-motion` (the still simply stays), and for good once
 * the reader has chosen a slide by hand — a slider that overrides a choice
 * is a slider nobody trusts. The dots remain the manual control in every
 * case; under reduced motion they switch without a fade.
 *
 * The component returns a fragment: the clipped media box (the caller's
 * background layer; each slide carries its own copy of the caller's
 * readability shade, so the shade fades with its picture) and, as a
 * sibling, the pagination — which has to sit above the hero's content layer
 * to be clickable.
 */

export interface HeroStill {
  /** Public path of the still (WebP). */
  readonly src: string;
  readonly width: number;
  readonly height: number;
  /** Short, for the pagination button's accessible name. */
  readonly name: string;
}

/**
 * The first slide, per theme. Each page supplies both, so the slider reads
 *
 *   light: [stills.light, the film's light companion]
 *   dark:  [stills.dark,  the film's dark original]
 *
 * and the theme decides which pair is on screen — through ThemePicture and
 * ThemeVideo, the site's own theme-aware media, never a second theme check.
 */
export interface HeroStills {
  readonly light: HeroStill;
  readonly dark: HeroStill;
}

export interface HeroSliderProps {
  /** The caller's background-layer class (positions the box; see CSS). */
  readonly className: string;
  readonly stills: HeroStills;
  readonly mediaKey: ThemeMediaKey;
  /** Class for the `<video>`, so the film keeps its existing rules. */
  readonly videoClassName: string;
  /** Drawn inside the film slide, above the film (SecureVision's daylight cues). */
  readonly filmOverlay?: ReactNode;
  /** The readability shade's class, rendered once inside each slide, on top. */
  readonly shadeClassName: string;
  /** Short, for the pagination button's accessible name. */
  readonly filmName: string;
  /** Whether the film should set its source at parse time (an above-the-fold hero). */
  readonly eager?: boolean;
}

const SLIDE_MS = 7000;

/** The site theme once mounted; null while the server HTML is authoritative. */
function useResolvedTheme(): "light" | "dark" | null {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return resolvedTheme === "light" ? "light" : "dark";
}

export function HeroSlider({
  className,
  stills,
  mediaKey,
  videoClassName,
  filmOverlay,
  shadeClassName,
  filmName,
  eager = false,
}: HeroSliderProps) {
  const theme = useResolvedTheme();
  const reduce = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  const [index, setIndex] = useState<0 | 1>(0);
  const [chosen, setChosen] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [resting, setResting] = useState(false);

  /* In view? A hero is at the top of its page, but the clock should not run
     for a reader who has scrolled past it. */
  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      { threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* Where the copy ends. The readability shade is the copy column's, not
     the picture's: on laptops and up the CSS masks it off below the copy so
     the product strip painted across the bottom of every still shows in
     full. The copy's height depends on the viewport (the headline wraps to
     more lines as it scales), so the mask reads `--hero-copy-bottom`, the
     copy block's bottom edge as a percentage of the hero, measured here and
     kept current by a ResizeObserver. Until it is measured the CSS falls
     back to the full-height shade, so nothing the copy sits on is ever bare. */
  useEffect(() => {
    const root = rootRef.current;
    const hero = root?.parentElement;
    const copy = hero?.querySelector("h1")?.parentElement;
    if (!root || !hero || !copy || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const h = hero.getBoundingClientRect();
      const c = copy.getBoundingClientRect();
      if (h.height <= 0) return;
      const pct = Math.min(100, Math.max(0, ((c.bottom - h.top) / h.height) * 100));
      root.style.setProperty("--hero-copy-bottom", `${pct.toFixed(1)}%`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(hero);
    observer.observe(copy);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  /* The clock runs in both themes once the theme is known; a theme change
     does not touch it — the same slide index carries on with the other
     theme's pictures. */
  const running =
    theme !== null && !reduce && !chosen && inView && tabVisible && !resting;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(
      () => setIndex((current) => (current === 0 ? 1 : 0)),
      SLIDE_MS,
    );
    return () => window.clearInterval(id);
  }, [running]);

  const choose = useCallback((next: 0 | 1) => {
    setChosen(true);
    setIndex(next);
  }, []);

  /* Only the showing slide's film plays. Pre-mount: no gate, so the server
     markup is the plain hero's and the film can start as it always did. */
  const filmActive = theme !== null ? index === 1 : undefined;
  const still = theme === "light" ? stills.light : stills.dark;
  const slides: readonly [string, string] = [still.name, filmName];

  return (
    <>
      <div
        ref={rootRef}
        className={`hero-slider ${className}`}
        data-slide={index}
        aria-hidden="true"
        style={
          {
            "--hero-slide-ms": `${SLIDE_MS}ms`,
          } as React.CSSProperties
        }
      >
        {/* Slide 0 — the still, one file per theme. ThemePicture picks the
            theme's file before first paint from the site's own theme class
            and swaps it on toggle, so a dark visitor never downloads the
            light picture and vice versa. `priority`: this is the LCP element
            in both themes. */}
        <div
          className="hero-slider__slide hero-slider__slide--still"
          data-active={index === 0}
        >
          <ThemePicture
            className="hero-slider__still"
            sources={[
              {
                type: "image/webp",
                darkSrcSet: `${stills.dark.src} ${stills.dark.width}w`,
                lightSrcSet: `${stills.light.src} ${stills.light.width}w`,
              },
            ]}
            darkSrc={stills.dark.src}
            lightSrc={stills.light.src}
            sizes="100vw"
            alt=""
            width={stills.dark.width}
            height={stills.dark.height}
            priority
          />
          {/* The shade lives INSIDE each slide so it fades with its picture:
              the still's copy column needs a firmer, narrower lift than the
              film's (see the per-hero rules in globals.css), and a shade that
              switched at the cut would jump while the pictures cross-fade. */}
          <div className={shadeClassName} aria-hidden="true" />
        </div>

        {/* Slide 1 — the film the hero always had, with its own overlay. */}
        <div
          className="hero-slider__slide hero-slider__slide--film"
          data-active={index === 1}
        >
          <ThemeVideo
            mediaKey={mediaKey}
            eager={eager}
            className={videoClassName}
            active={filmActive}
          />
          {filmOverlay}
          <div className={shadeClassName} aria-hidden="true" />
        </div>
      </div>

      {/* Pagination. Two dots, bottom centre, above the content layer, in
          both themes. */}
      <div
        className="hero-slider__dots"
        role="group"
        aria-label="Hero visuals"
        onPointerEnter={() => setResting(true)}
        onPointerLeave={() => setResting(false)}
        onFocus={() => setResting(true)}
        onBlur={(event) => {
          if (
            !event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            setResting(false);
          }
        }}
      >
        {slides.map((name, i) => (
          <button
            key={name}
            type="button"
            className="hero-slider__dot"
            aria-label={`Show ${name}`}
            aria-pressed={index === i}
            data-active={index === i}
            onClick={() => choose(i as 0 | 1)}
          />
        ))}
      </div>
    </>
  );
}

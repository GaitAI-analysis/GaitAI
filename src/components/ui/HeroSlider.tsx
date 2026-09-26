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
import { assetPath } from "@/lib/paths";
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
 * ── DARK ROTATES; LIGHT IS ONE PERMANENT PICTURE ───────────────────────────
 * The two themes no longer carry the same slide list:
 *
 *   dark:  [stills.dark, the film's dark original]  cross-faded, two dots
 *   light: [stills.light]                           one picture, no controls
 *
 * The founder's light artwork IS the light hero (2026-09-23), so in light
 * there is no second slide and so no clock, no cross-fade, no pagination and
 * nothing to rotate to. The film slide is not rendered at all in light, and
 * `skipInLight` stops its parse-time bootstrap setting a source — without
 * that the light page downloaded the whole light film (3.4 MB on
 * MobilityCare, 1.0 MB on SecureVision, measured) for a slide it never
 * shows, because the element is only dropped at hydration. Dropping it also
 * takes SecureVision's daylight cues with it: they are registered to the
 * film's frames, not the still's, and the light still carries its own
 * analytics artwork.
 *
 * Dark is untouched — same two slides, same order, same clock, same dots,
 * same parse-time source.
 *
 * Which FILES a slide uses is still the site's own theme-aware media rather
 * than a second theme check here:
 * the still is one `ThemePicture` with a dark and a light candidate, the
 * film is the registered `ThemeVideo` pair. Both resolve the theme in the
 * inline bootstrap before first paint — nothing of the other theme is on
 * the critical path, and there is no flash of the other theme's art — and
 * swap their file in place when the theme toggles. The other theme's still
 * is then fetched at idle, once the page has loaded, so that swap has
 * something to show (see "THE OTHER THEME'S STILL" below). A toggle also restarts the
 * slider on slide 0 — the new theme's still is introduced first, exactly as
 * on a fresh load — and a back/forward-cache restore does the same, so a
 * reader never opens the page on the old film because they left it there.
 * Nothing about the slide is persisted anywhere. The still is slide 0 and
 * paints first in both themes, so it is the LCP candidate and there is no
 * flash of film before it.
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
 * The clock stops when it should: in light, where there is one slide and
 * nothing to advance to, while the tab is hidden, while the hero is
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
     full, and the MobilityCare hero grows so that strip starts below the
     copy. The copy's height depends on the viewport (the headline wraps to
     more lines as it scales), so both read `--hero-copy-bottom-px`, the copy
     block's bottom edge in pixels from the hero's top, measured here on the
     hero and kept current by a ResizeObserver. It is a length, not a share
     of the hero, so a hero that grows because of it does not move it (the
     copy is anchored to the top where the growth rule applies). Until it is
     measured the CSS falls back to the full-height shade and the plain
     viewport height, so nothing the copy sits on is ever bare. */
  useEffect(() => {
    const root = rootRef.current;
    const hero = root?.parentElement;
    const copy = hero?.querySelector("h1")?.parentElement;
    if (!root || !hero || !copy || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const h = hero.getBoundingClientRect();
      const c = copy.getBoundingClientRect();
      if (h.height <= 0) return;
      const px = Math.max(0, Math.round(c.bottom - h.top));
      hero.style.setProperty("--hero-copy-bottom-px", `${px}px`);
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

  /* EVERY FRESH VIEW STARTS ON THE STILL. The index is plain component state
     — nothing is written to localStorage, sessionStorage, the URL or the
     theme store — so a new navigation always mounts on slide 0. Two paths
     resurrect an OLD state and are reset here: a back/forward-cache restore
     (`pageshow` with `persisted`), which brings the page back frozen on
     whatever slide it left on, and a theme change, which swaps the whole
     asset collection — the new theme's still is the one to introduce first.
     The manual hold is released with it, so the clock runs again. */
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setChosen(false);
      setIndex(0);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const seenTheme = useRef<"light" | "dark" | null>(null);
  useEffect(() => {
    if (theme === null) return;
    if (seenTheme.current !== null && seenTheme.current !== theme) {
      setChosen(false);
      setIndex(0);
    }
    seenTheme.current = theme;
  }, [theme]);

  /* THE OTHER THEME'S STILL, FETCHED WHEN NOTHING ELSE NEEDS THE NETWORK.
     ==========================================================================
     Every theme-dependent asset here is fetched only when its theme becomes
     active, which keeps the other theme's artwork off the critical path. The
     cost is that a theme toggle has nothing to show: the slider restarts on
     the new theme's still (above), that picture has never been downloaded,
     and the hero paints bare ground colour until it lands. Measured on the
     live site at 1440x900, per animation frame: 0.1-0.2 s on a fast
     connection and 2.9-3.6 s at 4 Mbps, at full opacity, on both pages in
     both directions. Nothing can cover that gap — the film and its poster
     are equally uncached, and holding the outgoing picture would show dark
     art in light — so the only fix is to have the file already.

     One file per hero is enough: because a toggle always restarts on slide
     0, the still is always the blocking asset, and the film loads behind it
     while the reader looks at the picture. So this fetches exactly the
     other theme's still, and only once the page has finished loading and
     the main thread is idle, at low priority — never in competition with
     the LCP image, which is this hero's own still. A reader who asked their
     browser to save data, or who is on a 2G-class connection, is left alone
     and keeps the transient. */
  useEffect(() => {
    if (theme === null) return;
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (connection?.saveData) return;
    if (connection?.effectiveType && /2g$/.test(connection.effectiveType)) {
      return;
    }

    const url = assetPath(
      theme === "light" ? stills.dark.src : stills.light.src,
    );
    let cancelled = false;
    let idleHandle: number | undefined;
    let timer: number | undefined;

    const fetchIt = () => {
      if (cancelled) return;
      const image = new window.Image();
      /* An attribute, not the property: the property is newer than the DOM
         types this project builds against, and the hint is advisory. */
      image.setAttribute("fetchpriority", "low");
      image.decoding = "async";
      image.src = url;
    };
    const schedule = () => {
      if (cancelled) return;
      const idle = window.requestIdleCallback;
      if (typeof idle === "function") {
        idleHandle = idle(fetchIt, { timeout: 4000 });
      } else {
        timer = window.setTimeout(fetchIt, 1500);
      }
    };

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      if (idleHandle !== undefined) window.cancelIdleCallback?.(idleHandle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [theme, stills]);

  /* ── LIGHT HAS NO SECOND SLIDE ───────────────────────────────────────────
     `showFilm` is false only once the theme is KNOWN to be light: the server
     cannot read the theme, so its markup keeps the film and light drops it on
     the first mounted render.

     Everything below reads `activeIndex`, never `index`. A reader who toggles
     dark → light while the film is showing would otherwise spend one render
     with slide 1 gone and slide 0 not yet active — a frame of bare ground.
     The state still resets to 0 in its own effect; this makes the render in
     between correct too. */
  const showFilm = theme !== "light";
  const activeIndex: 0 | 1 = showFilm ? index : 0;

  /* The clock runs only where there is a second slide to reach. */
  const running =
    showFilm && theme !== null && !reduce && !chosen && inView && tabVisible && !resting;

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
  const filmActive = theme !== null ? activeIndex === 1 : undefined;
  const still = theme === "light" ? stills.light : stills.dark;
  const slides: readonly [string, string] = [still.name, filmName];

  return (
    <>
      <div
        ref={rootRef}
        className={`hero-slider ${className}`}
        data-slide={activeIndex}
        /* One slide: the CSS holds the still at the framing it was delivered
           with, instead of drifting it towards a handover that never comes. */
        data-single={!showFilm}
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
          data-active={activeIndex === 0}
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

        {/* Slide 1 — the film the hero always had, with its own overlay.
            Dark only, plus the server's markup, which cannot know the theme;
            `skipInLight` keeps the light page from fetching a film it drops
            at hydration. */}
        {showFilm && (
          <div
            className="hero-slider__slide hero-slider__slide--film"
            data-active={activeIndex === 1}
          >
            <ThemeVideo
              mediaKey={mediaKey}
              eager={eager}
              skipInLight
              className={videoClassName}
              active={filmActive}
            />
            {filmOverlay}
            <div className={shadeClassName} aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Pagination. Two dots, bottom centre, above the content layer — only
          where there are two slides. A control that reaches the picture you
          are already looking at is not a control. */}
      {showFilm && (
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
              aria-pressed={activeIndex === i}
              data-active={activeIndex === i}
              onClick={() => choose(i as 0 | 1)}
            />
          ))}
        </div>
      )}
    </>
  );
}

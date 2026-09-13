"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { assetPath } from "@/lib/paths";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import styles from "./heroSlider.module.css";

/**
 * THE HOMEPAGE HERO SLIDER — three approved frames, one live copy block.
 * =============================================================================
 * The artwork IS the background. Three cinematic bands, cut from the approved
 * composite in `public/images/hero/`, crossfade behind copy that stays real
 * HTML: the eyebrow, headline, sub-line and CTA of each frame are text a
 * screen reader hears and a search engine indexes, not pixels.
 *
 * WHAT WAS CUT OUT OF THE ARTWORK, AND WHAT COULD NOT BE. The composite was
 * three complete page-header mock-ups stacked, each with a mock navbar, the
 * headline copy, arrows, indicator dots and a word list painted in. The mock
 * navbars are stripped at the crop (rows 46 / 270 / 512 of the source), so
 * the site's real fixed navbar is the only navbar. The painted copy could not
 * be removed from pixels; it sits in the LEFT ~25% of each band, and every
 * frame's `pos` places the visible window on the people to the right of it,
 * so at every tested viewport the painted text is off-canvas and only the
 * live copy is read. Should a viewport ever show it, the scrim on the left
 * is what keeps the live text legible over it.
 *
 * RESOLUTION IS THE HONEST LIMIT. Each band is 2172×~205. A 1440×620 hero
 * needs roughly 3× upscale; a phone shows a ~5%-wide slice at ~3.3×. The
 * files are shipped at native size — upscaling in the encoder would add bytes
 * and no detail — and the source asset without the UI mock, at full
 * resolution, is what would sharpen this. See the note on the page.
 *
 * PREVIEW VS SELECTION. Two indices, not one. `active` is the selected frame
 * — what autoplay advances and what the running line beside a label reports.
 * `preview` is a frame the pointer is resting on (or keyboard focus is
 * visiting) in the control list; while it is set, the artwork and the copy
 * show it, and the moment the pointer leaves they fall back to `active`.
 * Clicking (or Enter / Space) promotes the preview to the selection and
 * restarts the clock. Preview never touches `aria-current` and mutes the copy
 * block's live region, so assistive tech hears selections, not hovers. Touch
 * has no hover, so on a coarse pointer there is no preview: a tap selects.
 *
 * Two speeds. A preview is a glance, so it crosses in ~380 ms and the copy
 * lifts in 300 ms; a selection or an auto-advance is a scene change and keeps
 * the ~800 ms fade. `data-fast` on the root switches the variables, and it
 * lingers ~450 ms after a preview ends so the fall-back is as quick as the
 * glance was.
 *
 * THE COPY IS STACKED, NOT SWAPPED. All three frames' copy blocks are
 * rendered into one grid cell and crossfaded in place, so the block is always
 * as tall as the tallest of them. The first version re-mounted one block per
 * frame, and a preview of a frame with a shorter headline shrank the block,
 * moved the controls up out from under the pointer, ended the preview, grew
 * the block back — and looped. Stable height is what makes hovering a control
 * a stable act. The CTA row, the demo and the evidence line sit below the
 * stack and never move; only the CTA's label and href follow the frame.
 *
 * MOTION. Auto-advance every 7.5 s with an ~800 ms opacity crossfade — no
 * horizontal travel. Autoplay pauses while the pointer is over the hero,
 * while any control inside it has focus, while the tab is hidden, and on
 * request via the pause button (WCAG 2.2.2 wants a control, not just a
 * hover). A manual choice restarts the interval from zero. Under
 * `prefers-reduced-motion` there is no autoplay and frames swap instantly.
 *
 * PERFORMANCE. Frame 01 is the LCP image: rendered eagerly with
 * `fetchpriority="high"`, WebP only, and preloaded from the page so the
 * scanner finds it before hydration. Frames 02/03 are not in the DOM until
 * the browser is idle (or 1.2 s, whichever first), then load as AVIF with a
 * WebP fallback — `loading="lazy"` would not defer them, since they sit in
 * the viewport. Every image is absolutely positioned inside a section whose
 * height is already fixed by `.site-viewport-section`, so nothing shifts.
 */

export interface HeroFrame {
  id: string;
  /** Asset stem in /images/hero, e.g. "gaitai-hero-01". */
  image: string;
  /** Optional label correction in the artwork's intrinsic coordinate space. */
  overlay?: string;
  /** Intrinsic size of the band, for the img attributes. */
  width: number;
  height: number;
  /** `object-position` — where the subject stands, so cover never crops it. */
  pos: string;
  /** Position on narrow screens, where only a sliver of the band is shown. */
  posNarrow?: string;
  /**
   * The strip's height as a CSS length — how tall the band is drawn, and so
   * how large its subject stands and how far the 193px source is upscaled.
   * Omit for the default (`clamp(58%, 34vw, 100%)`); a frame whose subject
   * reads too large sets a smaller one and gets a wider, sharper window.
   */
  strip?: string;
  alt: string;
  /** The control-list label beside the frame number, e.g. "MobilityCare". */
  short: string;
  eyebrow: string;
  title: ReactNode;
  sub: string;
  cta: { label: string; href: string };
  /** The short word list the approved artwork carries on the right. */
  words: string[];
  tagline: string;
}

const INTERVAL_MS = 7500;
const SWIPE_PX = 44;

export function HeroSlider({
  frames,
  children,
}: {
  frames: HeroFrame[];
  /** Constant content under the per-frame copy — the demo, the evidence line. */
  children?: ReactNode;
}) {
  /* Hydration-safe: the Play/Pause glyph below is chosen on this value, so
     the first client render has to agree with the server (see the hook). */
  const reduce = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  /* A frame being glanced at from the control list; null when none. */
  const [preview, setPreview] = useState<number | null>(null);
  const [fast, setFast] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const node = heroRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const [userPaused, setUserPaused] = useState(false);
  const [restIdle, setRestIdle] = useState(false);
  /* A tick that restarts the interval after a manual selection, even when
     the chosen frame is the one already showing. */
  const [epoch, setEpoch] = useState(0);
  const baseId = useId();
  const count = frames.length;

  const go = useCallback(
    (index: number) => {
      setActive(((index % count) + count) % count);
      setPreview(null);
      setEpoch((e) => e + 1);
    },
    [count],
  );

  /* Fast while previewing, and for a beat afterwards so the return to the
     selected frame moves at the same speed the preview did. */
  useEffect(() => {
    if (preview !== null) {
      setFast(true);
      return;
    }
    const t = window.setTimeout(() => setFast(false), 450);
    return () => window.clearTimeout(t);
  }, [preview]);

  /* Frames 02+ join the DOM once the main thread is quiet. */
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setRestIdle(true), { timeout: 1200 });
      return () => (w as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(() => setRestIdle(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState === "hidden");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const playing = inView && !reduce && !hovered && !focused && !hidden && !userPaused && count > 1;

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => go(active + 1), INTERVAL_MS);
    return () => window.clearTimeout(t);
    /* `epoch` is what makes a manual pick restart the clock. */
  }, [playing, active, epoch, go]);

  /* Swipe: horizontal travel past the threshold, more sideways than down. */
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse") return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    go(dx < 0 ? active + 1 : active - 1);
  };

  const shown = preview ?? active;
  const frame = frames[shown];
  const copyId = `${baseId}-copy`;

  return (
    <div
      className={styles.slider}
      ref={heroRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="GaitAI, MobilityCare and SecureVision"
      data-reduce={reduce ? "true" : undefined}
      data-fast={fast ? "true" : undefined}
      data-shown={shown}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
      /* Keyboard focus pauses the show; a mouse click that happens to leave
         focus on a button must not, or "restart the timer after a manual
         selection" would silently become "stop after a manual selection". */
      onFocusCapture={(e) => {
        if ((e.target as HTMLElement).matches?.(":focus-visible")) setFocused(true);
      }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (start.current = null)}
    >
      {/* ── THE ARTWORK ── one layer per frame, all stacked, opacity does
          the crossfade. Decorative: the live copy carries the meaning. */}
      <div className={styles.backdrop} aria-hidden="true">
        {frames.map((f, i) => {
          const on = i === shown;
          /* A previewed frame must exist to be shown, whatever idle said. */
          if (i > 0 && !restIdle && i !== shown) return null;
          const webp = assetPath(`/images/hero/${f.image}.webp`);
          const avif = assetPath(`/images/hero/${f.image}.avif`);
          return (
            <div
              key={f.id}
              className={`${styles.frame} ${on ? styles.frameOn : ""}`}
              style={
                {
                  "--pos": f.pos,
                  "--pos-narrow": f.posNarrow ?? f.pos,
                  ...(f.strip ? { "--strip": f.strip } : {}),
                } as React.CSSProperties
              }
            >
              <picture>
                {/* Frame 01 is WebP-only so the single preload and the chosen
                    source are the same bytes; the rest prefer AVIF. */}
                {i > 0 && <source srcSet={avif} type="image/avif" />}
                <img
                  src={webp}
                  alt=""
                  width={f.width}
                  height={f.height}
                  decoding="async"
                  loading="eager"
                  fetchPriority={i === 0 ? "high" : "low"}
                  className={styles.img}
                />
              </picture>
              {f.overlay && (
                <img
                  src={assetPath(`/images/hero/${f.overlay}`)}
                  alt=""
                  width={f.width}
                  height={f.height}
                  className={`${styles.img} ${styles.labelOverlay}`}
                />
              )}
            </div>
          );
        })}
        {/* Legibility scrim over the artwork — heavier on the left where the
            copy sits, and a fade into the page ground at the foot. */}
        <div className={styles.scrim} />
      </div>

      {/* ── THE LIVE COPY ── */}
      <div className="container-wide relative z-10">
        <div className={styles.stage}>
          <div className={styles.copyCol}>
            <div
              id={copyId}
              className={styles.copyStack}
              aria-live={preview !== null ? "off" : "polite"}
            >
              {frames.map((f, i) => {
                const on = i === shown;
                return (
                  <div
                    key={f.id}
                    className={`${styles.copy} ${on ? styles.copyOn : ""}`}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${i + 1} of ${count}${on && preview !== null ? " (preview)" : ""}`}
                    aria-hidden={!on}
                  >
                    <p className={styles.eyebrow}>{f.eyebrow}</p>
                    {/* One id, on the block that is showing, so the section's
                        aria-labelledby always resolves to the visible title. */}
                    <h1 id={on ? "home-hero-title" : undefined} className={styles.title}>
                      {f.title}
                    </h1>
                    <p className={styles.sub}>{f.sub}</p>
                  </div>
                );
              })}
            </div>

            <div className={styles.actions}>
              <Link href={frame.cta.href} className={styles.cta}>
                {frame.cta.label}
                <ArrowRight className={styles.ctaArrow} aria-hidden="true" />
              </Link>
              {children}
            </div>
          </div>

          <aside className={styles.words} aria-hidden="true">
            {frames.map((f, i) => (
              <div key={f.id} className={`${styles.wordsPane} ${i === shown ? styles.wordsOn : ""}`}>
                <ul>
                  {f.words.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
                <p className={styles.tagline}>{f.tagline}</p>
              </div>
            ))}
          </aside>
        </div>

        {/* ── CONTROLS ── indicators with a running progress line, previous /
            next, and a pause toggle. */}
        <div className={styles.controls}>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowPrev}`}
            onClick={() => go(active - 1)}
            aria-label="Previous frame"
          >
            <ChevronLeft aria-hidden="true" />
          </button>

          {/* The list and its pause are one cluster; see .chapters. */}
          <div className={styles.chapters}>
            <ol className={styles.dots} aria-label="Frames">
              {frames.map((f, i) => {
                const on = i === active;
                const glance = preview === i && !on;
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      className={`${styles.dot} ${on ? styles.dotOn : ""} ${glance ? styles.dotGlance : ""}`}
                      onClick={() => go(i)}
                      /* Mouse only: a touch "enter" is the start of a tap, and a
                         tap should select, not glance. */
                      onPointerEnter={(e) => e.pointerType === "mouse" && setPreview(i)}
                      onPointerLeave={(e) => e.pointerType === "mouse" && setPreview((p) => (p === i ? null : p))}
                      /* Keyboard focus previews the way hover does; Enter and
                         Space are the button's own click. */
                      onFocus={(e) => e.currentTarget.matches(":focus-visible") && setPreview(i)}
                      onBlur={() => setPreview((p) => (p === i ? null : p))}
                      aria-label={`Show frame ${i + 1} of ${count}: ${f.short}`}
                      aria-current={on ? "true" : undefined}
                      aria-controls={copyId}
                    >
                      <span className={styles.dotNum}>{String(i + 1).padStart(2, "0")}</span>
                      <span className={styles.dotLabel}>{f.short}</span>
                      <span
                        className={styles.dotTrack}
                        data-running={on && playing ? "true" : undefined}
                        style={{ "--interval": `${INTERVAL_MS}ms` } as React.CSSProperties}
                      />
                    </button>
                  </li>
                );
              })}
            </ol>

            <button
              type="button"
              className={styles.pause}
              onClick={() => setUserPaused((p) => !p)}
              aria-pressed={userPaused}
              aria-label={userPaused ? "Resume auto-advance" : "Pause auto-advance"}
              disabled={!!reduce}
            >
              {userPaused || reduce ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            </button>
          </div>

          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowNext}`}
            onClick={() => go(active + 1)}
            aria-label="Next frame"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

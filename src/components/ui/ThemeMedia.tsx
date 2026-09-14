"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTheme } from "next-themes";
import { assetPath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import {
  resolveThemeMediaEntry,
  themeMedia,
  themeMediaByDarkPath,
  themeMediaFromSources,
  type ThemeMediaEntry,
  type ThemeMediaKey,
} from "@/lib/theme-media";

/**
 * THEME-AWARE MEDIA — one file fetched, chosen before first paint.
 *
 * Every film and diagram in `lib/theme-media.ts` exists twice: the dark
 * original and a light companion rendered offline from the same frames.
 * These two components pick one of the two files by the resolved theme and
 * keep the element in sync when the theme changes — without a reload, and
 * for video without losing the playhead.
 *
 * ── WHY NOT `dark:hidden` ────────────────────────────────────────────────
 * Rendering both variants and hiding one is the obvious approach and the
 * wrong one: `display: none` does not cancel a request, so every visitor pays
 * for both files. With two cinematic videos that doubles the weight of the
 * page for an asset nobody sees. Here exactly one source is ever set.
 *
 * ── WHY THE INLINE SCRIPT ────────────────────────────────────────────────
 * The theme lives in a class on <html> that next-themes writes before the
 * body renders. React cannot read it during server rendering, and waiting
 * for hydration means either a blank box or — worse — the dark film flashing
 * for a light-mode visitor and then swapping. So the element is rendered with
 * both paths in `data-*` attributes and NO `src`, and a tiny classic script
 * right after it reads the class and sets `src`/`poster` while the HTML is
 * still parsing, before anything paints. That is the same technique
 * next-themes uses for the class itself, and it respects a manual override,
 * the system preference, and `prefers-reduced-motion` alike. React never owns
 * `src`: after hydration an effect keeps the same attributes in sync, so the
 * server markup and the client markup never disagree.
 *
 * ── PERFORMANCE ──────────────────────────────────────────────────────────
 * A video marked `eager` (a hero) gets `preload="metadata"` and its source at
 * parse time. Everything else has no source until it scrolls within 200px,
 * and pauses when it scrolls away. The counterpart file is only ever fetched
 * when the theme actually changes.
 *
 * ── FALLBACK ─────────────────────────────────────────────────────────────
 * If a light file is missing the page does not break: the element falls back
 * to the dark file on error and says so in the console in development.
 * `npm run check:media` is what catches it before it ships.
 */

/* The bootstrap. Classic script, so `document.currentScript` is the tag
   itself and `previousElementSibling` is the media element it belongs to.
   Kept tiny: it runs once per element, inline. */
const BOOTSTRAP =
  "(function(){var s=document.currentScript;if(!s)return;var e=s.previousElementSibling;if(!e||!e.dataset)return;" +
  "var d=e.dataset,light=document.documentElement.classList.contains('light');" +
  "var src=(light&&d.lightSrc)||d.darkSrc;" +
  "if(e.tagName==='VIDEO'){var p=(light&&d.lightPoster)||d.darkPoster;if(p)e.setAttribute('poster',p);e.muted=true;" +
  "var rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;" +
  "if(d.eager==='true'&&!rm&&src)e.setAttribute('src',src);}" +
  "else if(src)e.setAttribute('src',src);})();";

function Bootstrap() {
  return <script dangerouslySetInnerHTML={{ __html: BOOTSTRAP }} />;
}

/** True once mounted with the resolved theme; null means "not yet known". */
function useResolvedDark(): boolean | null {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return resolvedTheme !== "light";
}

function warnOnce(key: string, message: string) {
  if (process.env.NODE_ENV === "production") return;
  const w = window as Window & { __themeMediaWarned?: Set<string> };
  w.__themeMediaWarned ??= new Set();
  if (w.__themeMediaWarned.has(key)) return;
  w.__themeMediaWarned.add(key);
  console.warn(`[theme-media] ${message}`);
}

/* ── Video ────────────────────────────────────────────────────────────────── */

interface ThemeVideoCommon {
  className?: string;
  style?: CSSProperties;
  /** Above the fold: source chosen at parse time, `preload="metadata"`. Default: fetched when near the viewport. */
  eager?: boolean;
  /** External play gate (e.g. a collapsed panel). `undefined` means "play whenever visible". */
  active?: boolean;
  /** Accessible name. Without one the film is decorative and hidden from assistive tech. */
  label?: string;
}

type ThemeVideoSource =
  | { mediaKey: ThemeMediaKey }
  | { darkSrc: string; lightSrc?: string; posterDark?: string; posterLight?: string };

export type ThemeVideoProps = ThemeVideoCommon & ThemeVideoSource;

function videoEntry(props: ThemeVideoSource): ThemeMediaEntry {
  if ("mediaKey" in props) return themeMedia[props.mediaKey] as ThemeMediaEntry;
  return (
    themeMediaByDarkPath.get(props.darkSrc) ??
    themeMediaFromSources({
      type: "video",
      dark: props.darkSrc,
      light: props.lightSrc,
      posterDark: props.posterDark,
      posterLight: props.posterLight,
    })
  );
}

export function ThemeVideo(props: ThemeVideoProps) {
  const { className, style, eager = false, active, label } = props;
  const entry = videoEntry(props);
  const dark = resolveThemeMediaEntry(entry, true);
  const light = resolveThemeMediaEntry(entry, false);
  const darkSrc = assetPath(dark.src);
  const lightSrc = assetPath(light.src);
  const darkPoster = dark.poster ? assetPath(dark.poster) : undefined;
  const lightPoster = light.poster ? assetPath(light.poster) : undefined;

  const isDark = useResolvedDark();
  const reduceMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);
  /* null = the observer has not reported yet; do not pause an eager film
     before we know it is off-screen. */
  const [visible, setVisible] = useState<boolean | null>(null);
  const [near, setNear] = useState(eager);
  const [lightFailed, setLightFailed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        setVisible(hit);
        if (hit) setNear(true);
      },
      { rootMargin: "200px 0px", threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* Source and poster follow the theme. A swap keeps the playhead: both files
     have identical timing, so the same second means the same frame. */
  useEffect(() => {
    const node = ref.current;
    if (!node || isDark === null) return;
    const useDark = isDark || lightFailed;
    const poster = useDark ? darkPoster : lightPoster;
    if (poster && node.getAttribute("poster") !== poster) node.setAttribute("poster", poster);

    const target = near && !reduceMotion ? (useDark ? darkSrc : lightSrc) : "";
    const current = node.getAttribute("src") ?? "";
    if (current === target) return;

    if (!target) {
      node.removeAttribute("src");
      node.load();
      return;
    }
    /* Everything the visitor could perceive about playback survives the
       swap: playhead, playing/paused, muted, rate and loop. `load()` resets
       the rate to the default, so it is put back explicitly. */
    const resumeAt = node.currentTime;
    const wasPlaying = current !== "" && !node.paused && !node.ended;
    const rate = node.playbackRate;
    const muted = node.muted;
    const loop = node.loop;
    node.setAttribute("src", target);
    node.load();
    node.muted = muted;
    node.loop = loop;
    node.playbackRate = rate;
    if (resumeAt > 0 || wasPlaying) {
      /* Seek as soon as the duration is known. A host without Range support
         clamps that seek to what is buffered, so check again once the file
         can play and finish the seek if it fell short. */
      let target = 0;
      const seek = () => {
        const end = node.seekable.length ? node.seekable.end(node.seekable.length - 1) : 0;
        if (target > 0 && Math.abs(node.currentTime - target) > 0.25 && end >= target) {
          node.currentTime = target;
        }
      };
      const onMeta = () => {
        node.removeEventListener("loadedmetadata", onMeta);
        if (Number.isFinite(node.duration) && node.duration > 0) {
          target = resumeAt % node.duration;
          seek();
        }
        if (wasPlaying) void node.play().catch(() => {});
      };
      const onCanPlay = () => {
        node.removeEventListener("canplay", onCanPlay);
        seek();
      };
      node.addEventListener("loadedmetadata", onMeta);
      node.addEventListener("canplay", onCanPlay);
    }
  }, [isDark, near, reduceMotion, lightFailed, darkSrc, lightSrc, darkPoster, lightPoster]);

  /* Play only what can be seen. `autoplay` covers the very first start; this
     covers scrolling away and back, and an external gate. */
  useEffect(() => {
    const node = ref.current;
    if (!node || visible === null) return;
    const shouldPlay = visible && active !== false && !reduceMotion && node.hasAttribute("src");
    if (shouldPlay) void node.play().catch(() => {});
    else node.pause();
  }, [visible, active, reduceMotion, isDark, near, lightFailed]);

  useEffect(() => {
    if ("darkSrc" in props && !props.lightSrc && entry.kind === "island") {
      warnOnce(props.darkSrc, `No light source for ${props.darkSrc}; dark is shown in both themes. Register it in lib/theme-media.ts.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <video
        ref={ref}
        suppressHydrationWarning
        className={cn(className)}
        style={style}
        data-dark-src={darkSrc}
        data-light-src={lightSrc !== darkSrc ? lightSrc : undefined}
        data-dark-poster={darkPoster}
        data-light-poster={lightPoster !== darkPoster ? lightPoster : undefined}
        data-eager={eager ? "true" : undefined}
        autoPlay
        muted
        loop
        playsInline
        preload={eager ? "metadata" : "none"}
        width={entry.width}
        height={entry.height}
        aria-label={label || undefined}
        aria-hidden={label ? undefined : true}
        onError={() => {
          if (isDark === false && !lightFailed && lightSrc !== darkSrc) {
            warnOnce(lightSrc, `Light video failed to load, falling back to dark: ${lightSrc}`);
            setLightFailed(true);
          }
        }}
      />
      <Bootstrap />
    </>
  );
}

/* ── Image ────────────────────────────────────────────────────────────────── */

interface ThemeImageCommon {
  alt: string;
  className?: string;
  style?: CSSProperties;
  /** Fill the positioned parent, like next/image's `fill`. */
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  /** Above the fold: eager, high fetch priority. Default lazy. */
  priority?: boolean;
}

type ThemeImageSource = { mediaKey: ThemeMediaKey } | { darkSrc: string; lightSrc?: string };

export type ThemeImageProps = ThemeImageCommon & ThemeImageSource;

function imageEntry(props: ThemeImageSource): ThemeMediaEntry {
  if ("mediaKey" in props) return themeMedia[props.mediaKey] as ThemeMediaEntry;
  return (
    themeMediaByDarkPath.get(props.darkSrc) ??
    themeMediaFromSources({ type: "image", dark: props.darkSrc, light: props.lightSrc })
  );
}

export function ThemeImage(props: ThemeImageProps) {
  const { alt, className, style, fill, width, height, sizes, priority } = props;
  const entry = imageEntry(props);
  const darkSrc = assetPath(resolveThemeMediaEntry(entry, true).src);
  const lightSrc = assetPath(resolveThemeMediaEntry(entry, false).src);

  const isDark = useResolvedDark();
  const ref = useRef<HTMLImageElement>(null);
  const [lightFailed, setLightFailed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || isDark === null) return;
    const target = isDark || lightFailed ? darkSrc : lightSrc;
    if (node.getAttribute("src") !== target) node.setAttribute("src", target);
  }, [isDark, lightFailed, darkSrc, lightSrc]);

  const fillStyle: CSSProperties | undefined = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
    : undefined;

  return (
    <>
      <img
        ref={ref}
        suppressHydrationWarning
        alt={alt}
        className={cn(className)}
        style={{ ...fillStyle, ...style }}
        data-dark-src={darkSrc}
        data-light-src={lightSrc !== darkSrc ? lightSrc : undefined}
        width={fill ? undefined : width ?? entry.width}
        height={fill ? undefined : height ?? entry.height}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        // eslint-disable-next-line react/no-unknown-property
        fetchPriority={priority ? "high" : undefined}
        onError={() => {
          if (isDark === false && !lightFailed && lightSrc !== darkSrc) {
            warnOnce(lightSrc, `Light image failed to load, falling back to dark: ${lightSrc}`);
            setLightFailed(true);
          }
        }}
      />
      <Bootstrap />
    </>
  );
}

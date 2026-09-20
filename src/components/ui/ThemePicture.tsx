"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { assetPath } from "@/lib/paths";

/**
 * A THEME-AWARE RESPONSIVE PICTURE — one file fetched, chosen before paint.
 * =============================================================================
 * `ThemeImage` in ThemeMedia.tsx serves one file per theme. The hero's panels
 * need more: two formats (AVIF, then WebP) across a ladder of widths, so the
 * browser can pick the smallest file that is still sharp on the screen it is
 * actually on. That is a `<picture>` with `srcset`/`sizes`, and it has to
 * resolve the THEME before the first fetch, for exactly the reason ThemeMedia
 * documents: `display: none` does not cancel a request, so rendering both
 * themes and hiding one would download the hero twice.
 *
 * The theme is the site's own — the `light` / `dark` class next-themes keeps
 * on <html> — never `prefers-color-scheme`. A `<source media>` query would
 * follow the operating system and ignore the visitor's toggle.
 *
 * ── TWO PHASES, ONE ELEMENT ───────────────────────────────────────────────
 * 1. FIRST PAINT (server HTML, hydration). The server cannot read the theme,
 *    and waiting for hydration means either an empty hero — this is the LCP
 *    element — or the dark photograph flashing for a light visitor. So the
 *    markup carries both candidate srcsets in `data-*` attributes and NO
 *    `srcset`/`src` at all, and one tiny classic script directly after the
 *    `</picture>` sets them while the HTML is still parsing. The preload
 *    scanner has already gone past, but the parser has not: the fetch still
 *    starts during parsing, ahead of stylesheets and scripts further down.
 *    React never sees those attributes at hydration — the two elements the
 *    script writes to carry `suppressHydrationWarning`, which is how you tell
 *    React that an attribute appearing between render and hydration is the
 *    plan rather than a bug.
 *
 * 2. MOUNTED (every render after that). `resolvedTheme` alone decides which
 *    `srcset` and `src` are rendered — React owns them from here, and ONLY the
 *    active theme's candidates are ever in the DOM, so there is nothing for a
 *    browser to mis-select. The `<picture>` is keyed by theme: a toggle mounts
 *    a fresh element with the other theme's candidates rather than mutating
 *    `<source srcset>` in place and trusting each engine to re-run its
 *    selection algorithm. The mount itself does NOT remount: the key for the
 *    theme the bootstrap chose is the boot key, so React takes over the very
 *    element that is already loading and sets the same URLs on it — an
 *    identical `src` is not a new request in any engine.
 *
 * A theme is only trusted once mounted. next-themes reads localStorage inside
 * a state initialiser, so `resolvedTheme` is ALREADY the stored theme on the
 * first client render while the server rendered without one; branching on it
 * before mount would fail hydration (React #418). `useResolvedTheme` returns
 * null through hydration and the real theme one render later, the same
 * contract `useResolvedDark` keeps in ThemeMedia.tsx.
 *
 * ── NO LAYOUT SHIFT ───────────────────────────────────────────────────────
 * `width` and `height` are required and are the PHOTOGRAPH's intrinsic box, so
 * the element has its aspect ratio before a byte arrives. The hero's own
 * geometry sizes it from there; nothing here reflows on load.
 */

export interface ThemePictureSource {
  /** MIME type for the `<source>`, e.g. `image/avif`. Best first. */
  readonly type: string;
  readonly darkSrcSet: string;
  readonly lightSrcSet: string;
}

export interface ThemePictureProps {
  readonly sources: readonly ThemePictureSource[];
  /** The `<img>` fallback, for a browser that takes none of the sources. */
  readonly darkSrc: string;
  readonly lightSrc: string;
  readonly sizes: string;
  readonly alt: string;
  /** The photograph's intrinsic box, so the ratio is known before it loads. */
  readonly width: number;
  readonly height: number;
  /**
   * `true` for the LCP candidate: fetched eagerly at high priority and decoded
   * synchronously. Everything else is lazy at low priority.
   */
  readonly priority?: boolean;
  readonly className?: string;
  readonly style?: React.CSSProperties;
}

type Theme = "light" | "dark";

/* The bootstrap. A classic script, so `document.currentScript` is this tag and
   `previousElementSibling` is the <picture> it belongs to. It runs once per
   element, inline, and is deliberately tiny. It reads the same signal the
   mounted phase does — the theme class on <html> — never the OS preference. */
const BOOTSTRAP =
  "(function(){var s=document.currentScript;if(!s)return;" +
  "var p=s.previousElementSibling;if(!p)return;" +
  "var light=document.documentElement.classList.contains('light');" +
  "var k=light?'lightSrcset':'darkSrcset';" +
  "var ss=p.getElementsByTagName('source');" +
  "for(var i=0;i<ss.length;i++){var v=ss[i].dataset[k];if(v)ss[i].setAttribute('srcset',v);}" +
  "var im=p.getElementsByTagName('img')[0];" +
  "if(im){var f=light?im.dataset.lightSrc:im.dataset.darkSrc;if(f)im.setAttribute('src',f);}})();";

function Bootstrap() {
  return <script dangerouslySetInnerHTML={{ __html: BOOTSTRAP }} />;
}

/** The site theme once mounted; null while the server HTML is authoritative. */
function useResolvedTheme(): Theme | null {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return resolvedTheme === "light" ? "light" : "dark";
}

export function ThemePicture({
  sources,
  darkSrc,
  lightSrc,
  sizes,
  alt,
  width,
  height,
  priority = false,
  className,
  style,
}: ThemePictureProps) {
  const theme = useResolvedTheme();

  /* The theme React first sees after mount is the one the bootstrap already
     painted. Remember it so that state keeps the boot key and React adopts the
     loading element instead of replacing it. Lazy ref initialisation — written
     at most once, when the value first exists. */
  const bootTheme = useRef<Theme | null>(null);
  if (theme !== null && bootTheme.current === null) bootTheme.current = theme;

  const imgProps = {
    width,
    height,
    sizes,
    decoding: priority ? "sync" : "async",
    loading: priority ? "eager" : "lazy",
    fetchPriority: priority ? "high" : "low",
  } as const;

  if (theme === null) {
    return (
      <>
        <picture key="boot" className={className} style={style}>
          {sources.map((source) => (
            <source
              key={source.type}
              type={source.type}
              sizes={sizes}
              /* The bootstrap adds `srcset` before hydration, by design — tell
                 React so, or every render logs "Extra attributes from the
                 server: srcset". */
              suppressHydrationWarning
              data-dark-srcset={assetSrcSet(source.darkSrcSet)}
              data-light-srcset={assetSrcSet(source.lightSrcSet)}
            />
          ))}
          {/* eslint-disable-next-line @next/next/no-img-element -- the static
              export runs with `images.unoptimized`, so next/image adds nothing
              here and cannot express a theme-swapped srcset without fetching
              both. This is the whole point of the component. */}
          <img
            {...imgProps}
            alt={alt}
            suppressHydrationWarning
            data-dark-src={assetPath(darkSrc)}
            data-light-src={assetPath(lightSrc)}
          />
        </picture>
        <Bootstrap />
      </>
    );
  }

  /* Mounted: the theme is the single input. Only its candidates are rendered,
     and a change of theme is a change of key — a new <picture>, selected from
     scratch — except the boot theme, whose key is the boot picture's, so React
     adopts that element. Both phases return the same fragment shape for the
     same reason; the bootstrap script simply leaves after hydration. */
  const light = theme === "light";
  const activeSrc = assetPath(light ? lightSrc : darkSrc);
  return (
    <>
      <picture
        key={theme === bootTheme.current ? "boot" : theme}
        className={className}
        style={style}
        data-theme={theme}
      >
        {sources.map((source) => (
          <source
            key={source.type}
            type={source.type}
            sizes={sizes}
            srcSet={assetSrcSet(light ? source.lightSrcSet : source.darkSrcSet)}
          />
        ))}
        {/* eslint-disable-next-line @next/next/no-img-element -- see above. */}
        <img {...imgProps} alt={alt} src={activeSrc} />
      </picture>
    </>
  );
}

/** Run every candidate in a srcset through `assetPath`, descriptors intact. */
function assetSrcSet(srcSet: string): string {
  return srcSet
    .split(",")
    .map((candidate) => {
      const [url, ...rest] = candidate.trim().split(/\s+/);
      return [assetPath(url), ...rest].join(" ");
    })
    .join(", ");
}

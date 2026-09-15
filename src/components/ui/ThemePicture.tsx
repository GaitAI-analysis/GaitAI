"use client";

import { useEffect, useRef } from "react";
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
 * ── WHY THE INLINE SCRIPT ─────────────────────────────────────────────────
 * The theme lives in a class on <html> that next-themes writes before the body
 * renders. The server cannot read it, and waiting for hydration means either an
 * empty hero — this is the LCP element — or the dark photograph flashing for a
 * light visitor. So the markup carries both candidate srcsets in `data-*`
 * attributes and NO `srcset`/`src` at all, and one tiny classic script directly
 * after the `</picture>` sets them while the HTML is still parsing. The
 * preload scanner has already gone past, but the parser has not: the fetch
 * still starts during parsing, ahead of stylesheets and scripts further down.
 *
 * React never owns `srcset` or `src` — they are never passed as props — and the
 * two elements the script writes to carry `suppressHydrationWarning`, which is
 * how you tell React that an attribute appearing between render and hydration
 * is the plan rather than a bug. Without it every render logs "Extra attributes
 * from the server: srcset". An effect then keeps them in step when the visitor
 * toggles the theme, without a reload and without a second component tree.
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

/* The bootstrap. A classic script, so `document.currentScript` is this tag and
   `previousElementSibling` is the <picture> it belongs to. It runs once per
   element, inline, and is deliberately tiny. */
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
  const ref = useRef<HTMLPictureElement>(null);
  const { resolvedTheme } = useTheme();

  /* After hydration, follow the toggle. The bootstrap above owns the FIRST
     paint; this owns every change after it, and sets the same attributes, so
     the two can never disagree about which file is showing. */
  useEffect(() => {
    const picture = ref.current;
    if (!picture) return;
    const light = resolvedTheme === "light";
    for (const source of Array.from(picture.querySelectorAll("source"))) {
      const next = light ? source.dataset.lightSrcset : source.dataset.darkSrcset;
      if (next && source.getAttribute("srcset") !== next) {
        source.setAttribute("srcset", next);
      }
    }
    const img = picture.querySelector("img");
    if (img) {
      const next = light ? img.dataset.lightSrc : img.dataset.darkSrc;
      if (next && img.getAttribute("src") !== next) img.setAttribute("src", next);
    }
  }, [resolvedTheme]);

  return (
    <>
      <picture ref={ref} className={className} style={style}>
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
          alt={alt}
          suppressHydrationWarning
          width={width}
          height={height}
          sizes={sizes}
          decoding={priority ? "sync" : "async"}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          data-dark-src={assetPath(darkSrc)}
          data-light-src={assetPath(lightSrc)}
        />
      </picture>
      <Bootstrap />
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

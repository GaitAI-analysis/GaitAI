"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { assetPath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import {
  resolveThemeMedia,
  themeMedia,
  type ThemeMediaKey,
} from "@/lib/theme-media";

/**
 * Theme-aware media, resolved to ONE source before anything is fetched.
 *
 * WHY NOT `dark:hidden`. Rendering both variants and hiding one is the obvious
 * approach and the wrong one: `display: none` does not cancel a request, so
 * every visitor pays for both files. With a pair of wordmark PNGs that is
 * merely wasteful; with a pair of cinematic videos it doubles the weight of
 * the page for an asset that will never be seen. These components read the
 * resolved theme first and render a single element.
 *
 * WHAT THAT COSTS. Resolving the theme needs the client, so there is one frame
 * before hydration with nothing to show. Each component below holds the exact
 * box in that frame — same width, same height, same aspect — so nothing moves
 * when the media arrives, and fades it in over 200ms so a theme switch is a
 * crossfade rather than a flash. That is the trade the brief asks for: no
 * layout shift, no double download, and no black rectangle while waiting.
 */

/** True once mounted, with the resolved theme. Null theme means "not yet". */
function useResolvedDark(): boolean | null {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return resolvedTheme !== "light";
}

/* ── Images ───────────────────────────────────────────────────────────────── */

export function ThemeImage({
  mediaKey,
  alt,
  fill,
  width,
  height,
  sizes,
  className,
  priority,
}: {
  mediaKey: ThemeMediaKey;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  const isDark = useResolvedDark();

  /* Pre-hydration: the same box, empty. Not a dark placeholder — that is the
     flash this component exists to avoid. */
  if (isDark === null) {
    return fill ? (
      <span aria-hidden="true" className="absolute inset-0" />
    ) : (
      <span
        aria-hidden="true"
        className="inline-block"
        style={{ width, height }}
      />
    );
  }

  const { src } = resolveThemeMedia(mediaKey, isDark);

  return (
    <Image
      src={assetPath(src)}
      alt={alt}
      {...(fill ? { fill: true } : { width: width ?? 0, height: height ?? 0 })}
      sizes={sizes}
      priority={priority}
      className={cn("transition-opacity duration-200", className)}
    />
  );
}

/* ── Video, with an optional vector composition for light mode ────────────── */

/**
 * Plays the theme's own footage. Where a `vector-light` entry has no light
 * film, `lightVisual` is rendered instead and NO video is requested in light
 * mode at all — the cheapest possible light variant.
 *
 * `poster` is always the poster for the source actually being played, so a
 * dark poster never sits under a light film.
 */
export function ThemeVideo({
  mediaKey,
  className,
  lightVisual,
  reduceMotion,
  posterAlt = "",
  sizes,
}: {
  mediaKey: ThemeMediaKey;
  className?: string;
  lightVisual?: ReactNode;
  reduceMotion?: boolean;
  posterAlt?: string;
  sizes?: string;
}) {
  const isDark = useResolvedDark();
  const entry = themeMedia[mediaKey];

  if (isDark === null) {
    return <span aria-hidden="true" className="absolute inset-0" />;
  }

  /* Light mode with a vector stand-in: draw it, fetch nothing. */
  if (!isDark && entry.kind === "vector-light" && lightVisual) {
    return <>{lightVisual}</>;
  }

  const { src, poster } = resolveThemeMedia(mediaKey, isDark);

  /* Reduced motion gets the poster for the same source, never the other
     theme's poster. */
  if (reduceMotion) {
    return poster ? (
      <Image
        src={assetPath(poster)}
        alt={posterAlt}
        fill
        sizes={sizes}
        className={className}
      />
    ) : null;
  }

  return (
    <video
      key={src}
      className={cn("transition-opacity duration-200", className)}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster ? assetPath(poster) : undefined}
    >
      <source src={assetPath(src)} type="video/mp4" />
    </video>
  );
}

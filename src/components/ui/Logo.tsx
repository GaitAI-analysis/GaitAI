"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { assetPath } from "@/lib/paths";
import { ThemePicture } from "@/components/ui/ThemePicture";

type LogoVariant = "wordmark" | "icon" | "stacked";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  className?: string;
  /**
   * wordmark = horizontal lockup (icon + "GaitAI") — best for the navbar.
   * icon     = just the G + walker mark — for compact placements.
   * stacked  = vertical full lockup with tagline — best for footers / hero.
   */
  variant?: LogoVariant;
  size?: LogoSize;
  priority?: boolean;
}

/**
 * Premium brand mark for GaitAI.
 *
 * THE WORDMARK is the founder's approved light/dark pair (2026-09-25), each
 * its own file -- never one logo recoloured or inverted for the other theme.
 * They arrive with baked backgrounds; `scripts/brand/import-logos.py` removes
 * only that background colour (colour-to-alpha, verified to recomposite onto
 * the original) and trims the margin. It is a ThemePicture, so the theme's
 * file is chosen from the class on <html> before first paint: no empty box
 * until hydration and no flash of the other theme's logo.
 *
 * The icon and stacked variants still swap on `next-themes` after mount and
 * render a same-size placeholder until then, so nothing reflows.
 */
export function Logo({
  className,
  variant = "wordmark",
  size = "md",
  priority = false,
}: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme !== "light" : true;

  // ---- sizing tokens ----
  const dimensions: Record<
    LogoVariant,
    Record<LogoSize, { w: number; h: number }>
  > = {
    /* THE WORDMARK KEEPS ITS HEIGHTS (31 / 39 / 51), so the navbar and the
       footer are exactly as tall as before; the width is the approved art's
       own. The two files have slightly different proportions -- light
       1214:423 (2.870), dark 1069:403 (2.653) -- so the box is the light
       one's, the wider of the two, and each file is fitted to the box's
       height and set against its left edge. A theme toggle therefore moves
       nothing: the header does not re-flow when the logo changes. */
    wordmark: {
      sm: { w: 89, h: 31 },
      md: { w: 112, h: 39 },
      lg: { w: 146, h: 51 },
    },
    icon: {
      sm: { w: 32, h: 32 },
      md: { w: 40, h: 40 },
      lg: { w: 56, h: 56 },
    },
    stacked: {
      sm: { w: 120, h: 132 },
      md: { w: 160, h: 176 },
      lg: { w: 220, h: 240 },
    },
  };

  const { w, h } = dimensions[variant][size];

  // ---- source resolution ----
  // Use trimmed / transparent PNGs so the mark sits cleanly on any surface.
  const sources: Record<LogoVariant, { dark: string; light: string; alt: string }> = {
    wordmark: {
      /* Rendered by ThemePicture below; these are its fallback `src`s. */
      dark: "/assets/brand/gaitai-logo-dark-640.png",
      light: "/assets/brand/gaitai-logo-light-640.png",
      alt: "GaitAI",
    },
    icon: {
      dark: "/assets/brand/gaitai/gaitai-mark-dark.png",
      light: "/assets/brand/gaitai/gaitai-mark-light.png",
      alt: "GaitAI icon",
    },
    stacked: {
      // Use the themed full-art versions for the richest rendering.
      dark: "/brand/logo-dark.png",
      light: "/brand/logo-light.png",
      alt: "GaitAI — Intelligence in Motion",
    },
  };

  if (variant === "wordmark") {
    return (
      <div
        className={cn(
          "relative inline-flex shrink-0 select-none items-center",
          className
        )}
        style={{ width: w, height: h }}
      >
        <ThemePicture
          className="block h-full w-full [&>img]:h-full [&>img]:w-full [&>img]:object-contain [&>img]:object-left"
          sources={[
            {
              type: "image/png",
              /* 640w covers the navbar at 1x-3x and the footer at 1x-2x; the
                 full trim is there for a 3x footer. */
              lightSrcSet:
                "/assets/brand/gaitai-logo-light-640.png 640w, /assets/brand/gaitai-logo-light.png 1214w",
              darkSrcSet:
                "/assets/brand/gaitai-logo-dark-640.png 640w, /assets/brand/gaitai-logo-dark.png 1069w",
            },
          ]}
          lightSrc={sources.wordmark.light}
          darkSrc={sources.wordmark.dark}
          sizes={`${w}px`}
          alt={sources.wordmark.alt}
          width={w}
          height={h}
          priority={priority}
        />
      </div>
    );
  }

  const src = isDark ? sources[variant].dark : sources[variant].light;

  // Pre-hydration skeleton: same box dimensions, fully transparent.
  if (!mounted) {
    return (
      <div
        aria-hidden
        className={cn("inline-block", className)}
        style={{ width: w, height: h }}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 select-none items-center",
        className
      )}
      style={{ width: w, height: h }}
    >
      <Image
        src={assetPath(src)}
        alt={sources[variant].alt}
        /* Three times the display box, so a 2x or 3x screen downsamples
           from a high-DPI-sized source rather than from the full master. */
        width={w * 3}
        height={h * 3}
        priority={priority}
        sizes={`${w}px`}
        className={cn(
          "h-full w-full object-contain transition-opacity duration-300",
          // Subtle drop shadow only on the icon variants — keeps the wordmark crisp.
          variant === "icon" &&
            "drop-shadow-[0_4px_18px_rgba(37,99,255,0.35)] dark:drop-shadow-[0_4px_18px_rgba(79,209,255,0.25)]"
        )}
      />
    </div>
  );
}

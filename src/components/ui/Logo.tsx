"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { assetPath } from "@/lib/paths";

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
 * Renders crisp PNG art assets sourced from `/public/brand/*` and seamlessly
 * swaps between the dark-theme and light-theme variants using `next-themes`.
 *
 * Hydration-safe: while next-themes resolves the active theme we render a
 * neutral placeholder of the exact final dimensions so the navbar / footer
 * never reflow.
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
    /* THE WORDMARK'S BOX IS THE ARTWORK'S OWN RATIO, 1522:427 (3.5644).
       It used to be 138x42, a ratio of 3.286 against art of 3.159, so
       `object-contain` fitted by height and left 5px of the box empty — and
       the file itself carried 42px of transparent padding left and right and
       41px top and bottom, so the ink inside that box stood only 35 of the
       42 pixels tall. The mark was rendering about a tenth smaller than the
       layout implied, which is what made its gold lattice and the walker
       read soft. These are the same widths as before against the trimmed
       art, so the header's horizontal rhythm is untouched and the mark
       simply gets its own pixels back. */
    wordmark: {
      sm: { w: 110, h: 31 },
      md: { w: 138, h: 39 },
      lg: { w: 180, h: 51 },
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
      /* The official lockups with their transparent padding cropped away — a
         lossless crop of the same files, verified pixel-for-pixel against
         them, not a redraw and not a re-render. The gold in the mark and in
         "AI" is the artwork's own. */
      dark: "/brand/logo-horizontal-dark-trimmed.png",
      light: "/brand/logo-horizontal-transparent-trimmed.png",
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

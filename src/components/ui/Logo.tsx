"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

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
    wordmark: {
      sm: { w: 110, h: 34 },
      md: { w: 138, h: 42 },
      lg: { w: 180, h: 56 },
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
      dark: "/brand/logo-horizontal-dark.png",
      light: "/brand/logo-horizontal-transparent.png",
      alt: "GaitAI",
    },
    icon: {
      dark: "/brand/icon-mark-dark.png",
      light: "/brand/icon-mark.png",
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
        src={src}
        alt={sources[variant].alt}
        width={w * 2}
        height={h * 2}
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

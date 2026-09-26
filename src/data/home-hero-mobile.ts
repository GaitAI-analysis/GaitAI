/**
 * THE PHONE HERO, AS DATA (components/sections/HeroMobile.tsx)
 * =============================================================================
 * Below 1024px the homepage hero is not the desktop panorama made smaller —
 * at 390px that picture is 219px tall and its three pills collide. It is a
 * composition of its own, cut from the SAME approved artwork (nothing is
 * regenerated or substituted):
 *
 *   ┌──────────┬────────────┐
 *   │ Secure-  │            │   the public-space scene
 *   │ Vision   │  the       │
 *   ├──────────┤  walking   │
 *   │ Mobility │  engine    │   the clinical scene
 *   │ Care     │            │
 *   └──────────┴────────────┘
 *
 * The walker is the tall tile on purpose: Pose analysis is the shared engine
 * under both products, and he walks (leftwards: the framed shot is
 * mirrored) into the two scenes it powers.
 *
 * ── CROPS ARE PLATE PIXELS ────────────────────────────────────────────────
 * Each scene crop is `[x0, y0, width]` in the plate's own pixels (day plate
 * 1672x941, night plate 1759x894); the tile's height follows from its 4:5
 * box. The two scenes in each plate sit between 16-degree diagonals, so a
 * crop is chosen to stay inside its panel for its whole height: no sliver of
 * the neighbouring scene or of the painted divider shows in a corner.
 * Measured against the plates with a crop sheet; re-measure if a plate is
 * replaced.
 *
 * The walker's frame is in the same units (see `WalkFrame` in HeroWalker):
 * the window's left and right edges and its top, plus how far right of the
 * painted figure's place he walks, so the window holds only the ribbon field.
 */

import type { HeroOptionId } from "./home-hero";

export type Crop = readonly [x0: number, y0: number, width: number];

export const HERO_MOBILE = {
  /** The caption's one-line support, for a 2-3 second read on a phone. */
  support: "One engine that reads human movement — for clinical care and safer public spaces.",
  /** Shown until the visitor has opened a scene once. */
  hint: "Tap a scene to explore",
  /** Scene tiles: 4:5, both themes. */
  crops: {
    securevision: { light: [446, 420, 266], dark: [466, 380, 270] },
    mobilitycare: { light: [869, 420, 264], dark: [905, 370, 288] },
  } satisfies Record<"securevision" | "mobilitycare", Record<"light" | "dark", Crop>>,
  /** The engine tile's window on the walker, per theme. */
  walk: {
    /* The capture walks to the right, out of a right-hand tile. Mirrored,
       he walks left, into the two scenes he powers; his hips sit at ~40% of
       the plate window, which the mirror turns into ~60% of the tile, so the
       room is ahead of him. */
    light: { x0: 1290, x1: 1590, y0: 240, shift: 92, mirror: true },
    dark: { x0: 1352, x1: 1642, y0: 230, shift: 40, mirror: true },
  },
  ctas: {
    primary: { href: "/#contact", label: "Request a demo" },
    secondary: { href: "/products", label: "Explore products" },
  },
} as const;

/** What a tapped tile opens: a compact card, three readings and one link. */
export interface HeroMobileDetail {
  readonly id: HeroOptionId;
  /** On the tile. */
  readonly label: string;
  /** Under the label on the tile (the engine only). */
  readonly sub?: string;
  /** The card's kicker. */
  readonly kicker: string;
  readonly title: string;
  readonly line: string;
  readonly readings: readonly { readonly label: string; readonly value: string; readonly unit?: string }[];
  readonly link: { readonly href: string; readonly label: string };
}

/* The readings are the founder's approved resting figures (home-hero.ts
   HERO_OPTIONS / POSE_RAIL), three per card: at a glance, nothing more. */
export const HERO_MOBILE_DETAILS: Record<HeroOptionId, HeroMobileDetail> = {
  securevision: {
    id: "securevision",
    label: "SecureVision",
    kicker: "Application · Public spaces",
    title: "SecureVision",
    line: "Privacy-aware movement intelligence for safer public spaces.",
    readings: [
      { label: "Pedestrian flow", value: "12", unit: "/min" },
      { label: "Crowd flow", value: "Normal" },
      { label: "Privacy mode", value: "Active" },
    ],
    link: { href: "/securevision", label: "Explore SecureVision" },
  },
  mobilitycare: {
    id: "mobilitycare",
    label: "MobilityCare",
    kicker: "Application · Clinical care",
    title: "MobilityCare",
    line: "Clinical movement intelligence for assessment, recovery and fall risk.",
    readings: [
      { label: "Gait speed", value: "1.02", unit: "m/s" },
      { label: "Fall risk", value: "Low" },
      { label: "Recovery", value: "Improving" },
    ],
    link: { href: "/mobilitycare", label: "Explore MobilityCare" },
  },
  pose: {
    id: "pose",
    label: "Pose analysis",
    sub: "Shared engine",
    kicker: "Core engine · Powers both",
    title: "Pose analysis",
    line: "Full-body pose and gait read from ordinary video — the layer every product is built on.",
    readings: [
      { label: "Cadence", value: "102", unit: "/min" },
      { label: "Symmetry", value: "96", unit: "%" },
      { label: "Balance", value: "Stable" },
    ],
    link: { href: "/#technology", label: "See how it works" },
  },
};

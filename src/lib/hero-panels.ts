/**
 * THE HERO'S PANEL PHOTOGRAPHS — the registry, and the only raster in the hero
 * =============================================================================
 * The homepage hero is one panoramic composition of three panels. Everything in
 * it except the photography is now DOM and SVG, so this file describes the one
 * remaining raster layer: three photographs, one per panel, each in two themes
 * and two formats at a ladder of widths.
 *
 * ── WHY ONE FILE PER PANEL, NOT ONE PER HERO ──────────────────────────────
 * A single flattened banner had to be decoded at the full width of the hero
 * even though two thirds of it sat behind a diagonal, and it could not be
 * served at a width suited to the panel that actually needed detail. Three
 * photographs are each requested at their own panel's rendered width, and the
 * two that are not the LCP candidate can be fetched at a lower priority.
 *
 * ── THE BOX ───────────────────────────────────────────────────────────────
 * A panel's visible shape is a wedge between two diagonals, so its photograph
 * covers the smallest upright box that CONTAINS that wedge — from the leftmost
 * point of its left boundary to the rightmost point of its right boundary, full
 * canvas height. The overlap between neighbouring boxes is deliberate: it is
 * the bleed that sits under the divider, and it is why no panel's photograph
 * can show a seam.
 *
 *   gaitai        x    0 → 810   (810 x 887)
 *   mobilitycare  x  553 → 1358  (805 x 887)
 *   securevision  x 1106 → 1774  (668 x 887)
 *
 * ── THE WIDTH LADDER ──────────────────────────────────────────────────────
 * A panel's rendered CSS width is its box's share of the canvas, and the canvas
 * is the hero's width. So at a viewport of W the GaitAI panel is 810/1774 * W
 * CSS pixels wide, and on a 2x screen it needs twice that in device pixels:
 *
 *   viewport   canvas     gaitai      mobilitycare   securevision
 *   1366       1366        624 (2x 1248)  620 (1240)   514 (1029)
 *   1920       1920        877 (2x 1754)  871 (1743)   723 (1446)
 *   2560       2560       1169 (2x 2338) 1162 (2324)   964 (1928)
 *   3840       3840       1753 (2x 3507) 1743 (3486)  1446 (2892)
 *
 * The ladder below covers to 2560 at 2x, which is the largest case the retina
 * brief names, so its top step — 2400 — is also the MINIMUM WIDTH of a
 * replacement original. No step is ever upscaled: the encoder refuses a source
 * narrower than the widest step it is asked to emit rather than inventing
 * detail that is not in the file.
 *
 * ── HOW A PANEL IS CROPPED ────────────────────────────────────────────────
 * Every panel lays its photograph in with `object-fit: cover` and
 * `object-position: center`, and the pose overlay's SVG uses
 * `preserveAspectRatio="xMidYMid slice"` — the same rule spelled in SVG. Those
 * two are a matched pair, and there is deliberately no per-panel focal point:
 * SVG can align only to the start, middle or end of an axis, so an overlay
 * pinned to 50% over a photograph pinned to 58% would put the skeletons beside
 * the people rather than on them. Framing is adjusted through the panel's
 * HEIGHT in hero.module.css, which is the knob that cannot desynchronise the
 * two layers.
 *
 * ── REPLACING A PHOTOGRAPH ────────────────────────────────────────────────
 * Drop the original in `assets/hero/src/<panel>-<theme>.<ext>` and run
 * `npm run hero:panels`. It crops to the box's aspect ratio, encodes AVIF and
 * WebP at every step in the ladder, and writes the files this registry names.
 * Nothing else in the hero changes: the layout is driven by the box, not by the
 * file. See docs/hero-panels.md for the crop and resolution contract.
 */

import manifest from "@/data/hero-panels.generated.json";

export type HeroPanelId = "gaitai" | "mobilitycare" | "securevision";

export interface HeroPanelBox {
  /** Left edge of the photograph within the 1774x887 canvas. */
  readonly x0: number;
  /** Right edge, exclusive. */
  readonly x1: number;
}

export interface HeroPanelAsset {
  readonly id: HeroPanelId;
  readonly box: HeroPanelBox;
  /** Alternative text. The photograph is the panel's subject, not decoration. */
  readonly alt: string;
  /** The `sizes` attribute: this panel's share of the hero's width. */
  readonly sizes: string;
  /**
   * The TARGET ladder — what a full-resolution original should be encoded at.
   * What is actually on disk is whatever `hero:panels` could produce from the
   * source without upscaling, and that is what the `srcset` is built from; see
   * `heroPanelWidths`. The two differ exactly while a panel is still waiting
   * for a large enough original.
   */
  readonly widths: readonly number[];
}

/** The emitted formats, best first. Every panel emits all of them. */
export const HERO_PANEL_FORMATS = [
  { ext: "avif", type: "image/avif" },
  { ext: "webp", type: "image/webp" },
] as const;

/** Where the encoder writes, and where the browser reads. */
export const HERO_PANEL_DIR = "/images/hero/panels";

/**
 * The ladder. Two steps below 1366@1x for phones (where a panel is full-width,
 * so it needs MORE than its desktop share), then the desktop steps up to
 * 2560@2x. 2400 is within a hair of the 2338 the GaitAI panel wants there, and
 * shared by all three so a replacement original has one number to clear.
 */
const WIDTHS = [480, 720, 1024, 1280, 1600, 2000, 2400] as const;

export const HERO_PANEL_ASSETS: readonly HeroPanelAsset[] = [
  {
    id: "gaitai",
    box: { x0: 0, x1: 810 },
    alt: "A traveller walking through a glass airport concourse, seen from behind.",
    /* 810/1774 = 45.7vw on the desktop composition; full width once stacked. */
    sizes: "(max-width: 1023px) 100vw, 46vw",
    widths: WIDTHS,
  },
  {
    id: "mobilitycare",
    box: { x0: 553, x1: 1358 },
    alt: "A clinician steadying an older adult walking between parallel bars.",
    sizes: "(max-width: 1023px) 100vw, 46vw",
    widths: WIDTHS,
  },
  {
    id: "securevision",
    box: { x0: 1106, x1: 1774 },
    alt: "A security officer watching people cross a large public concourse.",
    /* 668/1774 = 37.7vw. */
    sizes: "(max-width: 1023px) 100vw, 38vw",
    widths: WIDTHS,
  },
] as const;

export const heroPanelById: Record<HeroPanelId, HeroPanelAsset> =
  Object.fromEntries(HERO_PANEL_ASSETS.map((a) => [a.id, a])) as Record<
    HeroPanelId,
    HeroPanelAsset
  >;

/** A panel's photograph is `<box width> x 887`; this is that ratio. */
export function heroPanelAspect(asset: HeroPanelAsset): number {
  return (asset.box.x1 - asset.box.x0) / 887;
}

/** `/images/hero/panels/gaitai-dark-1280.avif` */
export function heroPanelFile(
  id: HeroPanelId,
  theme: "dark" | "light",
  width: number,
  ext: string,
): string {
  return `${HERO_PANEL_DIR}/${id}-${theme}-${width}.${ext}`;
}

/**
 * THE WIDTHS THAT ACTUALLY EXIST, from the manifest `hero:panels` writes.
 *
 * The `srcset` is built from this and never from the target ladder, because a
 * candidate the encoder declined to produce would be a 404 — and the encoder
 * declines precisely when producing it would have meant upscaling. Falls back
 * to the target ladder if the manifest has no entry, which can only happen for
 * a panel added to the registry before its photographs were encoded.
 */
export function heroPanelWidths(
  asset: HeroPanelAsset,
  theme: "dark" | "light",
): readonly number[] {
  const entry = manifest.panels?.[asset.id]?.[theme];
  const widths = entry?.widths;
  return widths && widths.length > 0 ? widths : asset.widths;
}

/** The `srcset` for one panel, one theme, one format. */
export function heroPanelSrcSet(
  asset: HeroPanelAsset,
  theme: "dark" | "light",
  ext: string,
): string {
  return heroPanelWidths(asset, theme)
    .map((w) => `${heroPanelFile(asset.id, theme, w, ext)} ${w}w`)
    .join(", ");
}

/**
 * The plain `src` fallback, for a browser that takes neither AVIF nor WebP —
 * which in practice means it takes the `<img>` and nothing else. The widest
 * WebP on disk, so the one file it does fetch is the good one.
 */
export function heroPanelFallback(
  asset: HeroPanelAsset,
  theme: "dark" | "light",
): string {
  const widths = heroPanelWidths(asset, theme);
  return heroPanelFile(asset.id, theme, widths[widths.length - 1], "webp");
}

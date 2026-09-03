/**
 * CENTRAL THEME-MEDIA MAP
 *
 * One place that answers, for every substantial visual on the site: what does
 * dark mode show, what does light mode show, and if the answer is "the same
 * dark asset", is that deliberate?
 *
 * WHY A MAP RATHER THAN CONDITIONS AT EACH CALL SITE. Before this, theme
 * handling was scattered: the logo resolved a source in a hook, the vertical
 * cards rendered two `<Image>` elements and hid one with `dark:hidden`, and
 * the console footage was a single dark asset with a comment saying it was
 * "identical in light and dark mode". Nothing recorded which of those was a
 * decision and which was an omission. This does.
 *
 * ── ON THE THREE KINDS OF ENTRY ────────────────────────────────────────────
 *
 *   { dark, light }        Two assets. `ThemeMedia` resolves ONE and only
 *                          that one is fetched — see the note on double
 *                          downloads below.
 *
 *   { dark, lightVisual }  Dark mode plays the cinematic asset; light mode
 *                          renders a vector composition of the same subject
 *                          instead. Used where a light version of the footage
 *                          does not exist and a vector console says the same
 *                          thing better than a dimmed film would.
 *
 *   { dark, island: … }    One dark asset, shown in both themes on purpose.
 *                          `island` is the reason, and it is required: a dark
 *                          visual with no stated reason is an oversight, and
 *                          the type will not let one through silently.
 *
 * ── ON DOUBLE DOWNLOADS ────────────────────────────────────────────────────
 * `display: none` and `dark:hidden` do not stop a fetch. Two `<img>` elements
 * with one hidden still cost two requests, and two `<video>` elements cost two
 * video downloads, which is the expensive mistake. Every consumer of this map
 * resolves the active theme's source BEFORE rendering the element, so exactly
 * one asset is ever requested. `ThemeMedia` in `components/ui/ThemeMedia.tsx`
 * is the only thing that should read this map.
 *
 * ── ON DARK MODE ───────────────────────────────────────────────────────────
 * Dark is frozen. Every `dark` path below is the asset that shipped, byte for
 * byte, and no `light` entry may change what dark mode renders.
 */

export type ThemeMediaEntry =
  | { kind: "pair"; dark: string; light: string; poster?: { dark: string; light: string } }
  | { kind: "vector-light"; dark: string; darkPoster?: string; note: string }
  | { kind: "island"; dark: string; darkPoster?: string; island: string };

/**
 * WHAT STILL NEEDS ART.
 *
 * These are the assets a designer or a generation pass has to produce before
 * the entry below can become a `pair`. They are listed here rather than in a
 * ticket so the gap is visible in the code that renders them:
 *
 *   videos/platform/mobilitycare-intelligence-light.mp4  + -light-poster.jpg
 *   videos/platform/securevision-intelligence-light.mp4  + -light-poster.jpg
 *   videos/mobilitycare/mobilitycare-hero-v2-light.mp4   + -light-poster.jpg
 *   videos/securevision/securevision-hero-light.mp4      + -light-poster.jpg
 *   videos/workflow/stage-0{1..4}-*-light.mp4            + -light-poster.jpg
 *
 * Naming is `<existing-name>-light.<ext>`, so adding one is a two-line change
 * here and nothing else.
 */

export const themeMedia = {
  /**
   * The two homepage family consoles. Dark plays the cinematic render; light
   * draws the vector console for the same product, because a night-lit film
   * on a white page reads as a hole in the page and dimming it would only
   * make it a grey hole. Same subject, same frame, same aspect.
   */
  mobilityCareHome: {
    kind: "vector-light",
    dark: "/assets/videos/platform/mobilitycare-intelligence.mp4",
    darkPoster: "/assets/videos/platform/mobilitycare-intelligence-poster.jpg",
    note: "Light renders MobilityDashboardVisual: walking figure, pose dots, cadence trace, score ring, mobility panel.",
  },
  secureVisionHome: {
    kind: "vector-light",
    dark: "/assets/videos/platform/securevision-intelligence.mp4",
    darkPoster: "/assets/videos/platform/securevision-intelligence-poster.jpg",
    note: "Light renders SecureOperationsVisual: plan view, anonymous tracks, density zones, camera tiles.",
  },

  /**
   * The product heroes. Both sections already pin the dark colour tokens
   * inside themselves in light mode — see `.light .mobilitycare-hero` and
   * `.light .securevision-hero` in globals.css — so the whole hero is a
   * deliberate cinematic band, not a light section with a dark hole in it.
   * A light hero film would be a different composition and a different
   * decision; until someone makes that decision these stay as they are.
   */
  mobilityCareHero: {
    kind: "island",
    dark: "/assets/videos/mobilitycare/mobilitycare-hero-v2.mp4",
    darkPoster: "/assets/videos/mobilitycare/mobilitycare-hero-v2-poster.jpg",
    island:
      "The hero is a full-bleed cinematic band that keeps dark type tokens in both themes.",
  },
  secureVisionHero: {
    kind: "island",
    dark: "/assets/videos/securevision/securevision-hero.mp4",
    darkPoster: "/assets/videos/securevision/securevision-hero-poster.jpg",
    island:
      "The hero is a full-bleed cinematic band that keeps dark type tokens in both themes.",
  },

  /**
   * The four workflow films. Each is letterboxed with `object-fit: contain`
   * on a card that stays dark in both themes, so the footage never meets a
   * bright surface at its edge — the card is the frame, and the frame is the
   * point.
   */
  workflowCapture: {
    kind: "island",
    dark: "/assets/videos/workflow/stage-01-capture.mp4",
    darkPoster: "/assets/videos/workflow/stage-01-capture-poster.jpg",
    island: "Letterboxed inside a card that is dark in both themes.",
  },
  workflowAnalyze: {
    kind: "island",
    dark: "/assets/videos/workflow/stage-02-analyze.mp4",
    darkPoster: "/assets/videos/workflow/stage-02-analyze-poster.jpg",
    island: "Letterboxed inside a card that is dark in both themes.",
  },
  workflowReport: {
    kind: "island",
    dark: "/assets/videos/workflow/stage-03-report.mp4",
    darkPoster: "/assets/videos/workflow/stage-03-report-poster.jpg",
    island: "Letterboxed inside a card that is dark in both themes.",
  },
  workflowOutput: {
    kind: "island",
    dark: "/assets/videos/workflow/stage-04-output.mp4",
    darkPoster: "/assets/videos/workflow/stage-04-output-poster.jpg",
    island: "Letterboxed inside a card that is dark in both themes.",
  },

  /** Product wordmarks: real pairs, and the one case that already had both. */
  mobilityCareWordmark: {
    kind: "pair",
    dark: "/assets/brand/mobilitycare/mobilitycare-dark.png",
    light: "/assets/brand/mobilitycare/mobilitycare-light.png",
  },
  secureVisionWordmark: {
    kind: "pair",
    dark: "/assets/brand/securevision/securevision-dark.png",
    light: "/assets/brand/securevision/securevision-light.png",
  },
} as const satisfies Record<string, ThemeMediaEntry>;

export type ThemeMediaKey = keyof typeof themeMedia;

/** The source for a key in a theme, plus the poster where one applies. */
export function resolveThemeMedia(
  key: ThemeMediaKey,
  isDark: boolean,
): { src: string; poster?: string } {
  const entry = themeMedia[key] as ThemeMediaEntry;
  if (entry.kind === "pair") {
    return {
      src: isDark ? entry.dark : entry.light,
      poster: entry.poster ? (isDark ? entry.poster.dark : entry.poster.light) : undefined,
    };
  }
  return { src: entry.dark, poster: entry.darkPoster };
}

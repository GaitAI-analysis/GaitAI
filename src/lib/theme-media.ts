/**
 * CENTRAL THEME-MEDIA REGISTRY
 *
 * One place that answers, for every substantial visual on the site: what does
 * dark mode show, what does light mode show, and if the answer is "the same
 * dark asset", is that deliberate?
 *
 * ── THE RULE ──────────────────────────────────────────────────────────────
 * Dark is frozen. Every `dark` path below is the asset that shipped, byte for
 * byte. Light mode gets the SAME asset pushed once, offline, through the
 * colour transform in `scripts/theme-media/` and saved next to it with a
 * `-light` suffix — same frames, same timing, same composition. Nothing is
 * generated at visitor runtime, ever: the theme picks one of two files.
 *
 *   name.mp4          →  name-light.mp4
 *   name-poster.jpg   →  name-poster-light.jpg
 *   diagram.webp      →  diagram-light.webp
 *
 * ── THE TWO KINDS OF ENTRY ────────────────────────────────────────────────
 *
 *   { kind: "pair", dark, light }
 *       Two files. `ThemeVideo` / `ThemeImage` resolve ONE before anything is
 *       fetched. If the light file is missing on disk the page falls back to
 *       dark and `npm run check:media` says so loudly; the type does not let a
 *       pair exist without naming its light path.
 *
 *   { kind: "island", dark, island }
 *       One dark asset shown in both themes ON PURPOSE. `island` is the reason
 *       and it is required: a dark visual with no stated reason is an
 *       oversight, and the type will not let one through silently.
 *
 * ── HOW TO ADD A VIDEO ────────────────────────────────────────────────────
 * Drop the dark file under public/assets/videos/, render its companion with
 * scripts/theme-media/render_light.py, register it here, run
 * `npm run check:media`. The checker scans public/assets/videos and refuses an
 * unregistered file, so a new film cannot ship dark-only into light mode by
 * accident.
 *
 * ── ON DOUBLE DOWNLOADS ───────────────────────────────────────────────────
 * `display: none` and `dark:hidden` do not stop a fetch. Two `<video>`
 * elements with one hidden cost two video downloads. Every consumer resolves
 * the active theme's source BEFORE rendering the element, so exactly one file
 * is requested; `ThemeMedia.tsx` is the only thing that should read this map.
 */

export type ThemeMediaType = "video" | "image";

export interface ThemePosterPair {
  dark: string;
  light: string;
}

export interface ThemeMediaPair {
  kind: "pair";
  type: ThemeMediaType;
  dark: string;
  light: string;
  /** Video only: theme-matched poster frames, so a light visitor never sees a dark still. */
  poster?: ThemePosterPair;
  /** Optional narrow-screen variants. None exist today; the shape is here so they can. */
  mobile?: { dark: string; light: string };
  /**
   * `"own"` when the light film is a SEPARATE edit with its own length rather
   * than a re-grade of the dark frames: `check:media` then requires the same
   * dimensions but not the same frame count, and `ThemeVideo` resumes a swap
   * at the same second modulo the new film's duration. Default: identical
   * timing, frame for frame.
   */
  timing?: "own";
  /** Intrinsic size, for layout stability. */
  width?: number;
  height?: number;
}

export interface ThemeMediaIsland {
  kind: "island";
  type: ThemeMediaType;
  dark: string;
  darkPoster?: string;
  /** Why this stays dark in light mode. Required. */
  island: string;
  width?: number;
  height?: number;
}

export type ThemeMediaEntry = ThemeMediaPair | ThemeMediaIsland;

export const themeMedia = {
  /* ── Product heroes ─────────────────────────────────────────────────────── */

  /**
   * /mobilitycare/ — dark: the clinical gait report film (wireframe walkers,
   * no photographic people), frozen. Light: the founder's OWN daylight film
   * (2026-09-22, `gaitai_mobilitycare_hero_loop.mp4`, shipped byte for byte:
   * 1920×1080, 30 fps, 6 s, H.264 High, faststart), never a re-grade of the
   * dark frames — the earlier re-lit companion is retired. `timing: "own"`
   * because it is a separate edit: its own length and its own frame size at
   * the same 16:9 (check:media compares aspect, not box, for "own" pairs;
   * ThemeVideo resumes a swap modulo its duration). The poster is its first
   * frame. `width`/`height` stay the dark film's — they size the element's
   * box for layout, and both films fill it with `cover`.
   */
  mobilityCareHero: {
    kind: "pair",
    type: "video",
    dark: "/assets/videos/mobilitycare/mobilitycare-hero-v2.mp4",
    light: "/assets/videos/mobilitycare/mobilitycare-hero-light.mp4",
    poster: {
      dark: "/assets/videos/mobilitycare/mobilitycare-hero-v2-poster.jpg",
      light: "/assets/videos/mobilitycare/mobilitycare-hero-light-poster.jpg",
    },
    timing: "own",
    width: 1672,
    height: 942,
  },

  /** /securevision/ — concourse crowd with tracking HUD. */
  /**
   * /securevision/ — the night concourse film in dark; a SEPARATE daylight
   * film in light, never a re-grade of the night frames (a photographic crowd
   * cannot be relit, and the light hero is its own design brief: white and
   * warm-grey architecture, glass, side daylight, an officer in the right
   * third, quiet negative space on the left).
   *
   * `timing: "own"` because the two films are different edits with different
   * lengths. INTERIM PLATE: until the commissioned daylight film lands, the
   * light file is a fixed-camera, slow-parallax render of the reviewed
   * daylight airport photograph (use-case-image-manifest.json U015) — native
   * daylight, no filter, seamless 12s loop. Replace the two `-light` files and
   * nothing else needs to change.
   */
  secureVisionHero: {
    kind: "pair",
    type: "video",
    dark: "/assets/videos/securevision/securevision-hero.mp4",
    light: "/assets/videos/securevision/securevision-hero-light.mp4",
    poster: {
      dark: "/assets/videos/securevision/securevision-hero-poster.jpg",
      light: "/assets/videos/securevision/securevision-hero-poster-light.jpg",
    },
    timing: "own",
    width: 1280,
    height: 720,
  },
  /** Text corrections for labels baked into the NIGHT film only. The daylight film has its own intelligence layer (SecureVisionDaylightIntelligence); this is display:none in light. */
  secureVisionHeroLabels: {
    kind: "island",
    type: "image",
    dark: "/images/hero/securevision-operations-overlay.svg",
    island: "White type that corrects labels baked into the night footage. Hidden in light mode by CSS, where the daylight film carries no baked labels to correct.",
    width: 1600,
    height: 900,
  },

  /* ── Homepage family consoles (Verticals) and the Movement Lab ────────── */

  /* The light console films are the founder's own approved edits
     (2026-09-21, `*-light-no-overlap.mp4`): the same console, designed for
     paper, 5 s loops beside the dark films' 10 s — hence `timing: "own"`.
     They were supplied as MPEG-4 Part 2, which no Chromium or Firefox
     decodes, so what ships is the same frames transcoded to H.264 at the
     same 1280x720 / 24 fps / 120 frames (SSIM 0.999 to the supplied files);
     nothing was cropped, scaled, graded or regenerated. The dark films are
     untouched. The earlier re-graded companions are retired. */
  mobilityCareHome: {
    kind: "pair",
    type: "video",
    dark: "/assets/videos/platform/mobilitycare-intelligence.mp4",
    light: "/assets/videos/platform/mobilitycare-light-no-overlap.mp4",
    poster: {
      dark: "/assets/videos/platform/mobilitycare-intelligence-poster.jpg",
      light: "/assets/videos/platform/mobilitycare-light-no-overlap-poster.jpg",
    },
    timing: "own",
    width: 1280,
    height: 720,
  },
  secureVisionHome: {
    kind: "pair",
    type: "video",
    dark: "/assets/videos/platform/securevision-intelligence.mp4",
    light: "/assets/videos/platform/securevision-light-no-overlap.mp4",
    poster: {
      dark: "/assets/videos/platform/securevision-intelligence-poster.jpg",
      light: "/assets/videos/platform/securevision-light-no-overlap-poster.jpg",
    },
    timing: "own",
    width: 1280,
    height: 720,
  },

  /* ── The four workflow films (HowItWorks) ───────────────────────────────── */
  /* Dark plays all four. Light plays only stage 01's pair via `CaptureStill`;
     stages 02–04 show the founder's supplied stills in light
     (public/assets/images/workflow/stage-0N-*-light.webp, wired in
     HowItWorks `STAGE_LIGHT_STILLS`), so their light companions below are
     registered and on disk but no longer rendered. */

  workflowCapture: {
    kind: "pair",
    type: "video",
    dark: "/assets/videos/workflow/stage-01-capture.mp4",
    light: "/assets/videos/workflow/stage-01-capture-light.mp4",
    poster: {
      dark: "/assets/videos/workflow/stage-01-capture-poster.jpg",
      light: "/assets/videos/workflow/stage-01-capture-poster-light.jpg",
    },
    width: 966,
    height: 892,
  },
  workflowAnalyze: {
    kind: "pair",
    type: "video",
    dark: "/assets/videos/workflow/stage-02-analyze.mp4",
    light: "/assets/videos/workflow/stage-02-analyze-light.mp4",
    poster: {
      dark: "/assets/videos/workflow/stage-02-analyze-poster.jpg",
      light: "/assets/videos/workflow/stage-02-analyze-poster-light.jpg",
    },
    width: 1122,
    height: 996,
  },
  workflowReport: {
    kind: "pair",
    type: "video",
    dark: "/assets/videos/workflow/stage-03-report.mp4",
    light: "/assets/videos/workflow/stage-03-report-light.mp4",
    poster: {
      dark: "/assets/videos/workflow/stage-03-report-poster.jpg",
      light: "/assets/videos/workflow/stage-03-report-poster-light.jpg",
    },
    width: 1014,
    height: 864,
  },
  workflowOutput: {
    kind: "pair",
    type: "video",
    dark: "/assets/videos/workflow/stage-04-output.mp4",
    light: "/assets/videos/workflow/stage-04-output-light.mp4",
    poster: {
      dark: "/assets/videos/workflow/stage-04-output-poster.jpg",
      light: "/assets/videos/workflow/stage-04-output-poster-light.jpg",
    },
    width: 1016,
    height: 724,
  },

  /* ── Sample footage ─────────────────────────────────────────────────────── */

  /** The Movement Lab's demo clip: a real recording the pipeline analyses, not theme art. */
  recordedWalkSample: {
    kind: "island",
    type: "video",
    dark: "/assets/videos/samples/recorded-walk.mp4",
    darkPoster: "/assets/images/capture/sequence/poster.webp",
    island:
      "A photographic studio walk on a white ground (Pexels) that the pose pipeline analyses; it is already light and must stay byte-identical so the analysis is reproducible.",
    width: 960,
    height: 540,
  },

  /* ── Homepage hero ──────────────────────────────────────────────────────
     NOT HERE ANY MORE. The hero used to be one flattened 1774×887 PNG per
     theme registered as `platformHero`, with the headline, the three pills,
     the diagonals and the pose points all inside the picture — which is why
     it was soft on a Retina screen and why there were two files that had to
     agree about a layout.

     It is now assembled: type, buttons, dividers and pose overlays are DOM
     and SVG, and the only raster left is three photographs, one per panel.
     Those need a responsive `srcset` across two formats, which is more than
     a `pair` can express, so they have their own registry and their own
     theme-aware component:

         src/lib/hero-panels.ts          the boxes, the ladder, the srcsets
         src/components/ui/ThemePicture  <picture>, resolved before first paint
         scripts/hero-panels.mjs         the encoder  (npm run hero:panels)

     The rule this file exists to enforce still holds there: exactly one
     file per panel is ever fetched, and the theme picks it before paint. */

  /* ── Product wordmarks ──────────────────────────────────────────────────── */

  mobilityCareWordmark: {
    kind: "pair",
    type: "image",
    dark: "/assets/brand/mobilitycare/mobilitycare-dark.png",
    light: "/assets/brand/mobilitycare/mobilitycare-light.png",
  },
  secureVisionWordmark: {
    kind: "pair",
    type: "image",
    dark: "/assets/brand/securevision/securevision-dark.png",
    light: "/assets/brand/securevision/securevision-light.png",
  },

  /* ── Research artwork (PublicationPlate) ────────────────────────────────── *
   * Dark scientific diagrams; each has a re-inked companion. Consumers look
   * these up by their dark path (see `themeMediaByDarkPath`) because the
   * publication data names the artwork, not a key.                          */

  pubArtDeepLearningGait: publicationArt("deep-learning-gait-pattern-recognition"),
  pubArtEdgeGaitPatent: publicationArt("edge-gait-patent-402202"),
  pubArtGaitCovariatesReview: publicationArt("gait-covariates-review"),
  pubArtGaitIntraClass: publicationArt("gait-intra-class-variations"),
  pubArtGaitPreprocessing: publicationArt("gait-preprocessing-feature-selection"),
  pubArtMlVsDeepLearning: publicationArt("ml-vs-deep-learning-gait-comparison"),
  pubArtModelBasedGait: publicationArt("model-based-gait-recognition"),
  pubArtPoseCovariateInvariant: publicationArt("pose-covariate-invariant-gait"),
  pubArtPrivacyPreservingGait: publicationArt("privacy-preserving-gait-data"),
} as const satisfies Record<string, ThemeMediaEntry>;

function publicationArt(stem: string): ThemeMediaPair {
  return {
    kind: "pair",
    type: "image",
    dark: `/assets/images/publications/${stem}.webp`,
    light: `/assets/images/publications/${stem}-light.webp`,
    width: 481,
    height: 192,
  };
}

export type ThemeMediaKey = keyof typeof themeMedia;

/* ── LIGHT-ONLY FILMS ──────────────────────────────────────────────────────
 * A film that exists ONLY in light mode, because dark shows something else
 * entirely (not a dark edition of the same frames). It is not a `pair` — there
 * is no dark film to pair it with — and not an `island` — it is not a dark
 * asset shown in both themes. It gets its own list so every consumer of
 * `themeMedia` can keep assuming each entry has a dark file, and
 * `check:media` validates these too: files on disk, the reason filled in,
 * and (with ffprobe) both encodes the declared size and the same frames. */

export interface ThemeMediaLightOnly {
  kind: "light-only";
  type: "video";
  /** H.264 — plays everywhere, Safari included. */
  light: string;
  /** Optional VP9 edition of the SAME frames, preferred where supported. */
  lightAlt?: string;
  /** The film's first frame, exactly, so the still and the film are interchangeable. */
  poster: string;
  /** What dark mode shows instead, and why the film has no dark edition. Required. */
  darkShows: string;
  width: number;
  height: number;
}

/* Empty since 2026-09-24: the homepage hero loop that introduced this kind
   was replaced by the founder's final still. The kind and its check stay so
   the next light-only film is registered, not special-cased. */
export const lightOnlyMedia: Readonly<Record<string, ThemeMediaLightOnly>> = {};

/** Every entry, looked up by its dark path — for data that names a file rather than a key. */
export const themeMediaByDarkPath: ReadonlyMap<string, ThemeMediaEntry> = new Map(
  Object.values(themeMedia as Record<string, ThemeMediaEntry>).map((entry) => [entry.dark, entry]),
);

export interface ResolvedThemeMedia {
  src: string;
  poster?: string;
  /** True when light mode had to fall back to the dark file. */
  fellBack: boolean;
}

/** The source for an entry in a theme, plus the poster where one applies. */
export function resolveThemeMediaEntry(entry: ThemeMediaEntry, isDark: boolean): ResolvedThemeMedia {
  if (entry.kind === "pair") {
    const src = isDark ? entry.dark : entry.light;
    return {
      src,
      poster: entry.poster ? (isDark ? entry.poster.dark : entry.poster.light) : undefined,
      fellBack: false,
    };
  }
  return { src: entry.dark, poster: entry.darkPoster, fellBack: false };
}

export function resolveThemeMedia(key: ThemeMediaKey, isDark: boolean): ResolvedThemeMedia {
  return resolveThemeMediaEntry(themeMedia[key] as ThemeMediaEntry, isDark);
}

/**
 * Build an ad-hoc entry from explicit sources — for a consumer that has the
 * paths in hand rather than a registry key. A missing light source is a
 * deliberate fallback to dark (reported once in development), never a 404.
 */
export function themeMediaFromSources(sources: {
  type: ThemeMediaType;
  dark: string;
  light?: string;
  posterDark?: string;
  posterLight?: string;
}): ThemeMediaEntry {
  if (!sources.light) {
    return {
      kind: "island",
      type: sources.type,
      dark: sources.dark,
      darkPoster: sources.posterDark,
      island: "No light source supplied; dark is shown in both themes.",
    };
  }
  return {
    kind: "pair",
    type: sources.type,
    dark: sources.dark,
    light: sources.light,
    poster:
      sources.posterDark && sources.posterLight
        ? { dark: sources.posterDark, light: sources.posterLight }
        : undefined,
  };
}

/** Conventional companion path: `name.ext` → `name-light.ext`. Used by the checker and the renderer, not by components. */
export function lightCompanionPath(darkPath: string): string {
  return darkPath.replace(/(\.[a-z0-9]+)$/i, "-light$1");
}

/**
 * THE HOMEPAGE HERO, AS DATA
 * =============================================================================
 * The approved hero is one cinematic panoramic composition: three panels —
 * GaitAI | MobilityCare | SecureVision — separated by two diagonal boundaries,
 * with a headline over the first panel and an eyebrow, a message and a call to
 * action over each.
 *
 * It used to ship as one flattened 1774x887 PNG per theme. Everything in it —
 * the type, the pills, the diagonals, the cyan pose points — was pixels, so on
 * a Retina screen the whole hero was soft. Now only the PHOTOGRAPHS are raster
 * (see lib/hero-panels.ts). Type, buttons, dividers, pose overlays and
 * gradients are DOM and SVG, and stay sharp at any device pixel ratio.
 *
 * ── THE CANVAS IS THE UNIT OF MEASURE ─────────────────────────────────────
 * Every number in this file and in hero.module.css is a pixel of the approved
 * artwork's own 1774x887 canvas. The rendered hero holds that exact ratio at
 * every width, so the stylesheet turns one artwork pixel into one CSS length —
 * `--px` — and each position below is the number measured off the artwork.
 * Nothing here is a ratio to be re-derived by hand: to move something, change
 * its artwork pixel.
 *
 * The geometry is the DARK artwork's, which is the approved composition. The
 * light artwork was a separate generation whose panels sat a few pixels apart
 * and which broke "Movement, understood." over two lines; that divergence was
 * an artefact of maintaining two flattened files, and it is gone. There is one
 * composition, and the theme changes the photographs and the treatment, never
 * the layout.
 */

import type { HeroPanelId } from "@/lib/hero-panels";
import { lightOnlyMedia } from "@/lib/theme-media";

/** The approved artwork's canvas. The hero holds this ratio at every width. */
export const HERO_CANVAS = { width: 1774, height: 887 } as const;

/**
 * The light hero's artwork (approved 2026-09-23): the three-panel composition
 * with the people, the scenes, the diagonals and the painted gait dots, and
 * NO type of any kind — every word in the light hero is DOM again. Its native
 * size; a pixel-identical lossless master sits beside it as
 * `home-hero-light-clean-master.webp`. See HeroLightBanner.
 */
export const HERO_LIGHT_BANNER = {
  src: "/images/hero/home-hero-light-clean.webp",
  width: 1672,
  height: 941,
} as const;

/**
 * THE TWO DIAGONAL BOUNDARIES, as the x at which they cross the canvas's top
 * and bottom edges. Measured off the artwork by finding the lit ridge on rows
 * spread down the picture and fitting a line: both run 16.0 degrees off
 * vertical, leaning right at the top, within a pixel of each other.
 *
 * This is the only source of truth for the diagonals. The panels' clip paths
 * and the divider lines are both derived from it, so a boundary cannot drift
 * away from the edge of the photograph it cuts.
 */
export const HERO_DIVIDERS = [
  { top: 809.4, bottom: 553.0 },
  { top: 1357.4, bottom: 1106.0 },
] as const;

/* ── The pose overlay ───────────────────────────────────────────────────────
   The artwork painted cyan keypoints onto the people. They are SVG now, drawn
   from named joints over a shared topology: thin strokes, small discs, no neon
   skeleton. Coordinates are pixels of the PANEL'S OWN photograph (its box in
   lib/hero-panels.ts), not of the canvas — so a skeleton travels with the
   picture it belongs to, including on phones, where each panel crops its
   photograph independently and the overlay's SVG slices it exactly as
   `object-fit: cover` does.

   THIS IS THE ONE THING TO RE-TUNE when a panel's photograph is replaced: the
   joints say where the person IS, so a new frame means new numbers. The fit is
   checked the way it was established — render the hero and look at the overlay
   over the picture; see docs/hero-panels.md. */
export type PoseJoint =
  | "head" | "neck" | "chest" | "pelvis"
  | "shoulderL" | "shoulderR" | "elbowL" | "elbowR" | "wristL" | "wristR"
  | "hipL" | "hipR" | "kneeL" | "kneeR" | "ankleL" | "ankleR";

export interface PoseFigure {
  /** Why this person carries an overlay, for the next person reading this. */
  readonly note: string;
  /**
   * `"far"` for a background subject: the overlay draws them with smaller
   * joints, a thinner bone and lower opacity than the panel's main subject,
   * the way a tracker's confidence and a picture's depth both fall off with
   * distance. Omitted = the main subject.
   */
  readonly depth?: "far";
  readonly joints: Partial<Record<PoseJoint, readonly [number, number]>>;
}

/** The skeleton's bones. An edge is drawn only when both of its ends exist. */
export const POSE_EDGES: readonly (readonly [PoseJoint, PoseJoint])[] = [
  ["head", "neck"],
  ["neck", "chest"],
  ["chest", "pelvis"],
  ["neck", "shoulderL"],
  ["neck", "shoulderR"],
  ["shoulderL", "elbowL"],
  ["elbowL", "wristL"],
  ["shoulderR", "elbowR"],
  ["elbowR", "wristR"],
  ["pelvis", "hipL"],
  ["pelvis", "hipR"],
  ["hipL", "kneeL"],
  ["kneeL", "ankleL"],
  ["hipR", "kneeR"],
  ["kneeR", "ankleR"],
] as const;

export interface HeroPanel {
  readonly id: HeroPanelId;
  /** The product's name, set as the panel's eyebrow. */
  readonly eyebrow: string;
  /** The panel's message. One line per entry, exactly as approved. */
  readonly lines: readonly string[];
  readonly cta: { readonly href: string; readonly label: string };
  /** The people this panel reads. Empty is a deliberate answer — see SecureVision. */
  readonly pose: readonly PoseFigure[];
}

export const HERO_PANELS: readonly HeroPanel[] = [
  {
    id: "gaitai",
    eyebrow: "GaitAI",
    lines: ["Movement, understood."],
    cta: { href: "/#overview", label: "Explore GaitAI" },
    /* Box x0 = 0, so photograph pixels and canvas pixels are the same here. */
    pose: [
      {
        note: "The traveller walking away from camera — the platform's own subject.",
        joints: {
          head: [424, 399], neck: [423, 428], chest: [423, 456], pelvis: [422, 516],
          shoulderL: [383, 436], shoulderR: [464, 436],
          elbowL: [366, 488], elbowR: [479, 490],
          wristL: [354, 531], wristR: [491, 533],
          hipL: [398, 517], hipR: [445, 515],
          kneeL: [405, 637], kneeR: [442, 629],
          ankleL: [411, 742], ankleR: [438, 723],
        },
      },
    ],
  },
  {
    id: "mobilitycare",
    eyebrow: "MobilityCare",
    lines: ["Better movement.", "Better care."],
    cta: { href: "/mobilitycare/", label: "Explore MobilityCare" },
    /* Box x0 = 553, so canvas x 1071 is photograph x 518. */
    pose: [
      {
        note: "The patient walking the bars. The clinician carries no overlay — she is the care, not the measurement.",
        joints: {
          head: [518, 261], neck: [518, 292], chest: [518, 350], pelvis: [518, 449],
          shoulderL: [489, 300], shoulderR: [548, 298],
          elbowL: [477, 372], elbowR: [559, 370],
          wristL: [455, 445], wristR: [585, 440],
          hipL: [488, 449], hipR: [546, 449],
          kneeL: [490, 516], kneeR: [541, 523],
          ankleL: [496, 607], ankleR: [532, 610],
        },
      },
    ],
  },
  {
    id: "securevision",
    eyebrow: "SecureVision",
    lines: ["Safer spaces.", "Privacy-aware intelligence."],
    cta: { href: "/securevision/", label: "Explore SecureVision" },
    /* Box x0 = 1106.
       THE OFFICER CARRIES NO SKELETON. In the approved artwork the overlay is
       on the people crossing the space, never on the officer watching it, and
       that is the panel's whole argument — SecureVision reads movement in a
       public space, and the operator is not the subject of his own screen. Do
       not "complete" this by giving him one. */
    pose: [
      {
        note: "A pedestrian mid-stride, left of the officer.",
        depth: "far",
        joints: {
          head: [256, 390], neck: [256, 400], chest: [256, 412], pelvis: [256, 448],
          shoulderL: [245, 409], shoulderR: [267, 410],
          elbowL: [247, 426], elbowR: [263, 426],
          wristL: [227, 459], wristR: [281, 432],
          hipL: [244, 448], hipR: [269, 448],
          kneeL: [244, 467], kneeR: [267, 469],
          ankleL: [248, 498], ankleR: [264, 499],
        },
      },
      {
        note: "A second pedestrian, right of the officer, arm swinging clear of the body.",
        depth: "far",
        joints: {
          head: [601, 386], neck: [603, 400], chest: [603, 424], pelvis: [603, 453],
          shoulderL: [590, 414], shoulderR: [615, 414],
          elbowL: [588, 438], elbowR: [614, 438],
          wristL: [586, 486], wristR: [640, 472],
          hipL: [588, 453], hipR: [616, 454],
          kneeL: [590, 522], kneeR: [611, 522],
          ankleL: [594, 562], ankleR: [606, 565],
        },
      },
    ],
  },
] as const;

/**
 * THE HEADLINE, over the GaitAI panel. "One" is set in the foreground colour
 * and the rest in the accent, and the line breaks after "movement" — all three
 * are the approved composition, not a reflow the browser chose. The copy is
 * fixed.
 */
export const HERO_HEADLINE = {
  lead: "One",
  accentFirst: "movement",
  accentRest: "intelligence platform.",
  lede: "For health, safety and identity.",
  sub: "From everyday movement to meaningful insight.",
} as const;

/**
 * THE HERO SCENE. Dark: the night atrium photograph (2026-09-24), unchanged.
 * Light (2026-09-24, later): the founder's wide three-zone artwork — public
 * space (SecureVision), clinic (MobilityCare), and the walking model figure —
 * brought to life as an 8-second seamless loop. The still is the loop's first
 * frame exactly, so the picture and the film are interchangeable: the still
 * is the LCP element and the reduced-motion / narrow-screen answer, and the
 * film fades in over it only when it is actually playing.
 *
 * THE LIGHT ARTWORK IS WIDER THAN THE SUPPLIED FILE. The supplied picture is
 * 2043x770; the scene is 2403x770 because a 360px band of the picture's own
 * haze was extended to the left, so the copy has room without sitting on the
 * people. The band is the first thing a narrow crop gives up: the hero
 * anchors the picture to its RIGHT edge.
 *
 * Every word is real text (below); nothing is baked into the still or the film.
 * The source pipeline (warp frames, 3D walker, boards) lives outside the repo;
 * see Hero.tsx for what the film is and is not.
 */
export const HERO_SCENE = {
  lightSrc: "/images/hero/home-hero-motion-light-poster.webp",
  lightNarrowSrc: "/images/hero/home-hero-motion-light-poster-1200.webp",
  darkSrc: "/images/hero/home-hero-scene-dark.webp",
  darkNarrowSrc: "/images/hero/home-hero-scene-dark-1200.webp",
  width: 1672,
  height: 941,
  /** The light loop, registered in lib/theme-media.ts (`lightOnlyMedia`) so
      check:media tracks it. First frame = `lightSrc`. */
  lightMotion: lightOnlyMedia.homeHeroMotion,
  eyebrow: "Human movement intelligence",
  /* Each array is one sentence, one entry per approved line. The breaks are
     the founder's, not the browser's. */
  title: ["One movement", "intelligence platform."],
  accent: ["For health, safety", "and identity."],
  /* Two lines on the panoramic layout; free to wrap anywhere narrower. */
  support: [
    "Transforming human movement into actionable insight",
    "for healthier lives, safer communities and a more open world.",
  ],
  primary: { href: "/#overview", label: "Explore GaitAI" },
  secondary: { href: "/#technology", label: "See how it works" },
} as const;

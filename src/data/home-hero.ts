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
 * THE HERO SCENE (2026-09-24, final). ONE image in both themes: the
 * founder's approved artwork — public space, clinic, the walking model
 * figure — with its three option pills (SecureVision, MobilityCare, Pose
 * analysis) painted into the picture. It is used as supplied: not
 * regenerated, recoloured or re-cropped.
 *
 * The one edit: the supplied file also had the caption painted into its
 * left haze. The brief is that the caption is real HTML, so the painted
 * words (and the gold rule under them) were inpainted out of the haze, and
 * nothing else — every pixel outside those text lines is the supplied file's.
 * The caption below is set in the same place, in the site's own type.
 *
 * `pills` are the painted pills' boxes as fractions of the image, measured
 * off the file; the transparent hotspots sit exactly on them. Move a number
 * only if the picture changes.
 */
export const HERO_SCENE = {
  src: "/images/hero/home-hero-gaitai.webp",
  narrowSrc: "/images/hero/home-hero-gaitai-1200.webp",
  width: 1672,
  height: 941,
  title: "One movement intelligence platform.",
  accent: "For health, safety and identity.",
  support:
    "Turning human movement into meaningful insight — from clinical mobility to safer public spaces.",
  /**
   * DARK (2026-09-24): the founder's own night artwork, used as supplied
   * (`Downloads/7d3b8da5-79b7-4b98-975c-ddb25a864fa0.png`, 1759x894 — not
   * regenerated, recoloured or re-composed). It carries no painted pills and
   * no painted caption, so dark shows the HTML caption with its own copy
   * (and, by the founder's decision, no calls to action), and the pill
   * hotspots are light-only.
   */
  dark: {
    src: "/images/hero/home-hero-dark.webp",
    narrowSrc: "/images/hero/home-hero-dark-1200.webp",
    width: 1759,
    height: 894,
    eyebrow: "Human movement intelligence",
    support: [
      "Turning human movement into meaningful insight",
      "for healthier lives, safer communities and a more open world.",
    ],
  },
} as const;

export type HeroOptionId = "securevision" | "mobilitycare" | "pose";

export interface HeroOption {
  readonly id: HeroOptionId;
  readonly label: string;
  /** The painted pill: left, top, width, height as fractions of the image. */
  readonly pill: readonly [number, number, number, number];
  /**
   * The gold anchor dot painted at the foot of the pill's arc: x, y of its
   * centre as fractions of the image, measured off the file. The resting
   * hero is dot-led and each pill grows out of this point (HeroOptions).
   */
  readonly dot: readonly [number, number];
  /**
   * Pose analysis is the shared analysis layer under both products, not a
   * third product — its panel is deliberately smaller and quieter.
   */
  readonly tier: "product" | "layer";
  readonly metrics: readonly HeroMetric[];
  readonly footnote?: string;
}

/**
 * ONE ROW OF A HERO PANEL.
 *
 * The panels report continuously rather than printing a specification, so a
 * row is a definition of what may be read, not a fixed string. Three kinds,
 * because there are exactly three sorts of thing in these panels:
 *
 *   `reading`  a measurement that moves — a resting value, the clinical band
 *              it is allowed to wander inside, and the most one tick may move
 *              it. `scale` adds the hairline track (the band the track draws
 *              may be wider than the band the value walks: a mobility score
 *              walks 80–84 but is read against 0–100). `spark` keeps a short
 *              history and draws it.
 *   `state`    a word that changes rarely — Normal / Moderate. `settle` is the
 *              chance per tick of returning to the FIRST state, which is the
 *              resting one, so calm is the overwhelming majority of readings.
 *   `fixed`    a guarantee, not a measurement: privacy is active, access is
 *              authorised. These never move, because a privacy mode that
 *              flickered would be a different and much worse claim.
 *
 * The resting values are the founder's approved figures; the bands around
 * them were set to be clinically plausible rather than eye-catching. See
 * components/sections/useHeroTelemetry.ts for the walk itself.
 */
export type HeroMetric =
  | {
      readonly kind: "reading";
      readonly label: string;
      /** The approved value: printed on the server and returned to always. */
      readonly base: number;
      readonly min: number;
      readonly max: number;
      /** The largest change a single tick may make. */
      readonly step: number;
      readonly decimals: number;
      readonly unit?: string;
      /** Printed hard against the figure, for a reading that is a change
          rather than a level: "+22%". */
      readonly prefix?: string;
      /** Ends of the track, when the row draws one. */
      readonly scale?: readonly [number, number];
      readonly spark?: true;
      /** A gentle push per tick, for a reading that should trend. */
      readonly trend?: number;
    }
  | {
      readonly kind: "state";
      readonly label: string;
      /** The first entry is the resting state. */
      readonly states: readonly string[];
      readonly settle: number;
      readonly tone?: "gold";
    }
  | {
      readonly kind: "fixed";
      readonly label: string;
      readonly value: string;
      readonly tone?: "gold";
    };

export const HERO_OPTIONS: readonly HeroOption[] = [
  {
    id: "securevision",
    label: "SecureVision",
    pill: [653 / 1672, 175.5 / 941, 193 / 1672, 50 / 941],
    dot: [620 / 1672, 287 / 941],
    tier: "product",
    metrics: [
      {
        kind: "reading",
        label: "Pedestrian flow",
        base: 12,
        min: 9,
        max: 16,
        step: 0.9,
        decimals: 0,
        unit: "people/min",
        scale: [0, 30],
        spark: true,
      },
      {
        kind: "state",
        label: "Crowd flow",
        states: ["Normal", "Moderate"],
        settle: 0.72,
      },
      { kind: "fixed", label: "Anomaly status", value: "None detected" },
      { kind: "fixed", label: "Privacy mode", value: "Active", tone: "gold" },
      { kind: "fixed", label: "Identity matching", value: "Optional" },
      { kind: "fixed", label: "Access status", value: "Authorised", tone: "gold" },
      /* Seventh row, added on the founder's brief (2026-09-24). Plain, not
         gold: privacy and authorisation are the two assurances this panel
         makes, and a third highlight would flatten both. */
      { kind: "fixed", label: "Risk level", value: "Low" },
    ],
  },
  {
    id: "mobilitycare",
    label: "MobilityCare",
    pill: [999.5 / 1672, 175.5 / 941, 194.5 / 1672, 49 / 941],
    dot: [969 / 1672, 288 / 941],
    tier: "product",
    metrics: [
      {
        kind: "reading",
        label: "Mobility score",
        base: 82,
        min: 80,
        max: 84,
        step: 0.8,
        decimals: 0,
        scale: [0, 100],
        spark: true,
      },
      { kind: "fixed", label: "Fall risk", value: "Low" },
      {
        kind: "reading",
        label: "Gait speed",
        base: 1.02,
        min: 0.97,
        max: 1.09,
        step: 0.03,
        decimals: 2,
        unit: "m/s",
        scale: [0.4, 1.4],
        spark: true,
      },
      {
        kind: "reading",
        label: "Step symmetry",
        base: 96,
        min: 94,
        max: 98,
        step: 0.8,
        decimals: 0,
        unit: "%",
        scale: [80, 100],
      },
      {
        kind: "state",
        label: "Balance stability",
        states: ["Stable", "Slight variation"],
        settle: 0.78,
      },
      /* A direction, not a percentage. This was a climbing figure, which
         makes a claim the panel cannot support — 64% of what? — and the
         founder's brief and their reference both read "Improving". The one
         row here that reports a trajectory rather than a measurement. */
      { kind: "fixed", label: "Recovery progress", value: "Improving" },
    ],
  },
  {
    id: "pose",
    label: "Pose analysis",
    pill: [1379.5 / 1672, 176 / 941, 205.5 / 1672, 49.5 / 941],
    dot: [1352 / 1672, 286 / 941],
    tier: "layer",
    metrics: [
      {
        kind: "reading",
        label: "Gait speed",
        base: 1.02,
        min: 0.97,
        max: 1.09,
        step: 0.03,
        decimals: 2,
        unit: "m/s",
        spark: true,
      },
      {
        kind: "reading",
        label: "Cadence",
        base: 102,
        min: 99,
        max: 105,
        step: 1.1,
        decimals: 0,
        unit: "steps/min",
        spark: true,
      },
      {
        kind: "reading",
        label: "Step symmetry",
        base: 96,
        min: 94,
        max: 98,
        step: 0.8,
        decimals: 0,
        unit: "%",
      },
      {
        kind: "state",
        label: "Balance stability",
        states: ["Stable", "Slight variation"],
        settle: 0.8,
      },
      {
        kind: "reading",
        label: "Range of motion",
        base: 22,
        min: 20,
        max: 25,
        step: 0.7,
        decimals: 0,
        unit: "%",
        /* The sign is the reading: this is a gain against a baseline, not an
           absolute range, and 22% of absolute range would be a catastrophe
           rather than a result. */
        prefix: "+",
      },
      { kind: "fixed", label: "Identity", value: "Optional" },
    ],
    footnote: "Privacy by design",
  },
] as const;

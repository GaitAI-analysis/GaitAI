import type { GaitPhase, Pt } from "./gait-phases";
import { WALKER_MASK_BBOX, WALKER_MASK_PATH } from "./capture-mask";

/**
 * THE CAPTURE PLATE — one real frame, and everything the site derives from it.
 * =============================================================================
 * Wherever the site says CAPTURED FRAME, RGB, CAMERA VIDEO, RAW VIDEO or
 * ORIGINAL FRAME it has to show a photograph, and wherever it then says
 * SILHOUETTE, POSE, SKELETON or TRAJECTORY the thing shown has to be visibly
 * derived from THAT photograph — the same person, the same place in the frame,
 * losing information stage by stage. Four unrelated illustrations in a row do
 * not make that argument; one frame transformed does.
 *
 * This module is the single source of truth for that derivation:
 *
 *   PLATE          the two cuts of the site's one photoreal walking frame
 *                  (scripts/build-capture-plate.py); same frame, the portrait
 *                  cut is the wide cut cropped 142 px in from the left
 *   WALKER_MASK    the walker's foreground segmentation, traced from the
 *                  frame's own luminance (capture-mask.ts) — a mask, not a
 *                  drawing
 *   WALKER         the walker's joints, placed on the photograph by eye and
 *                  checked against it, in wide-plate pixels
 *   WALKER_PHASE   the same joints expressed as a `GaitPhase` — pelvis at the
 *                  origin, ground 48 units below — so every renderer built for
 *                  the gait keyframes (`PoseFrame`, the pose-error model, the
 *                  camera projection, the trajectory helpers) draws the
 *                  PHOTOGRAPHED pose without a line of special-casing
 *   plateFit()     the arithmetic of `preserveAspectRatio` for an <image>, so
 *                  overlays in plate pixels land on the walker whatever box
 *                  the plate is fitted into
 *
 * The photographed pose is, as it happens, a heel strike: the near leg
 * reaching forward, the far leg trailing, the arms in counter-swing. Compared
 * with the heel-strike keyframe in gait-phases.ts the joints fall within a
 * unit or two of each other, which is why the keyframe stride can be scaled to
 * this walker (`WALKER_UNIT`) and drawn as the trajectory the walker's own
 * ankle would trace — the one thing a single frame cannot show and the walk
 * cycle can.
 *
 * WHAT THIS IS NOT. Not a detection: the joints were placed by a person
 * looking at the frame, and every figure that draws them says "placed by eye"
 * or "illustrative" in its own words. Not anonymity: a mask and a skeleton
 * are what gait recognition works FROM. The figures that use this say so.
 */

export interface PlateCut {
  src: string;
  /** Intrinsic pixel size of the JPEG. */
  w: number;
  h: number;
  /** Where this cut's left edge sits in wide-plate pixels. */
  dx: number;
}

export const PLATE = {
  /** The full width of the frame. */
  wide: { src: "/assets/images/capture/capture-walk-wide.jpg", w: 688, h: 516, dx: 0 },
  /** The same frame, cropped to a portrait around the walker. */
  portrait: { src: "/assets/images/capture/cctv-walk-frame.jpg", w: 496, h: 516, dx: 142 },
} as const satisfies Record<string, PlateCut>;

export type PlateCutName = keyof typeof PLATE;

/* ── The walker, in wide-plate pixels ──────────────────────────────────── */

/** Pelvis centre: the origin the pose is measured from. */
export const WALKER_HIP: Pt = [374, 294];
/** Floor under the feet. */
export const WALKER_GROUND_Y = 508;
/** Pixels per local pose unit: the pelvis-to-ground distance is 48 units. */
export const WALKER_UNIT = (WALKER_GROUND_Y - WALKER_HIP[1]) / 48;
/** The head as the photograph has it, for a blur or a redaction block. */
export const WALKER_HEAD = { cx: 392, cy: 108, r: 28 } as const;

/** Joints, as read off the frame. N = near (towards the camera), F = far. */
export const WALKER = {
  headC: [392, 108],
  neck: [388, 158],
  shoulderN: [378, 180],
  shoulderF: [394, 182],
  elbowN: [356, 252],
  wristN: [329, 312],
  elbowF: [414, 256],
  wristF: [442, 318],
  hipN: [380, 292],
  hipF: [368, 296],
  kneeN: [424, 398],
  ankleN: [468, 478],
  toeN: [494, 500],
  kneeF: [356, 404],
  ankleF: [310, 490],
  toeF: [292, 506],
} as const satisfies Record<string, Pt>;

export const WALKER_MASK = { path: WALKER_MASK_PATH, bbox: WALKER_MASK_BBOX } as const;

/* ── The same joints as a GaitPhase ────────────────────────────────────── */

const local = ([x, y]: Pt): Pt => [
  Math.round(((x - WALKER_HIP[0]) / WALKER_UNIT) * 10) / 10,
  Math.round(((y - WALKER_HIP[1]) / WALKER_UNIT) * 10) / 10,
];

/**
 * The photographed pose in the keyframes' own units. `lift` is zero because
 * this frame IS the reference; `contacts` are where the front heel and the
 * back toe meet the floor.
 */
export const WALKER_PHASE: GaitPhase = {
  id: "captured-frame",
  lift: 0,
  nearArm: [local(WALKER.shoulderN), local(WALKER.elbowN), local(WALKER.wristN)],
  farArm: [local(WALKER.shoulderF), local(WALKER.elbowF), local(WALKER.wristF)],
  nearLeg: [local(WALKER.hipN), local(WALKER.kneeN), local(WALKER.ankleN)],
  farLeg: [local(WALKER.hipF), local(WALKER.kneeF), local(WALKER.ankleF)],
  nearFoot: [local(WALKER.ankleN), local(WALKER.toeN)],
  farFoot: [local(WALKER.ankleF), local(WALKER.toeF)],
  contacts: [local(WALKER.toeN)[0] - 5, local(WALKER.toeF)[0]],
};

/* ── Fitting the plate into a box ──────────────────────────────────────── */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlateFit {
  /** Box units per wide-plate pixel. */
  scale: number;
  /** Where wide-plate (0, 0) lands in box coordinates. */
  tx: number;
  ty: number;
  /** `translate(tx ty) scale(scale)` — wrap plate-pixel overlays in this. */
  transform: string;
  /** Map one wide-plate point into the box. */
  at: (pt: Pt) => Pt;
  /** The pelvis in box coordinates and the PoseFrame scale that fits it. */
  hip: Pt;
  poseScale: number;
}

/**
 * The arithmetic of `<image preserveAspectRatio="xMidYMid slice|meet">`.
 *
 * Draw the plate with exactly these attributes into `box`, wrap anything in
 * plate pixels — the mask, the joints, a redaction over the head — in
 * `fit.transform`, and it lands on the walker. The portrait cut's 142 px
 * offset is folded into `tx`, so callers work in one coordinate system
 * whichever cut they chose.
 */
export function plateFit(cut: PlateCutName, box: Box, mode: "slice" | "meet" = "slice"): PlateFit {
  const plate = PLATE[cut];
  const scale = mode === "slice" ? Math.max(box.w / plate.w, box.h / plate.h) : Math.min(box.w / plate.w, box.h / plate.h);
  const tx = box.x + (box.w - plate.w * scale) / 2 - plate.dx * scale;
  const ty = box.y + (box.h - plate.h * scale) / 2;
  const at = ([x, y]: Pt): Pt => [tx + x * scale, ty + y * scale];
  return {
    scale,
    tx,
    ty,
    transform: `translate(${round(tx)} ${round(ty)}) scale(${round(scale, 4)})`,
    at,
    hip: at(WALKER_HIP),
    poseScale: scale * WALKER_UNIT,
  };
}

/**
 * The keyframe stride, scaled to this walker and laid along the floor, for
 * the trajectory stages: earlier moments of the SAME walk ghosted behind the
 * photographed one, and the path a joint traces through them. `step` is the
 * spacing between moments in local units.
 */
export function walkerStride(fit: PlateFit, phases: readonly GaitPhase[], step = 6.5) {
  const s = fit.poseScale;
  const last = phases.length - 1;
  return phases.map((phase, i) => ({
    phase,
    x: fit.hip[0] - (last - i) * step * s,
    y: fit.hip[1] - phase.lift * s,
    scale: s,
    pick: (choose: (p: GaitPhase) => Pt): Pt => {
      const [jx, jy] = choose(phase);
      return [fit.hip[0] - (last - i) * step * s + jx * s, fit.hip[1] - phase.lift * s + jy * s];
    },
  }));
}

function round(n: number, places = 2) {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

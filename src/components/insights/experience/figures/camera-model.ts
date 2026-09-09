import type { GaitPhase, Pt } from "@/components/visuals/gait-phases";

/**
 * The camera-angle model shared by the article hero, the hub card and the
 * social card: eight positions around a walker, the projection each one
 * produces of the same stride, and what each movement signal becomes from
 * there — easier, harder or unavailable.
 *
 * ILLUSTRATIVE. The projection is a plan-view sketch, not a camera model with
 * a lens; the availability table is the engineering intuition the article
 * argues for, stated in three words, never as a percentage.
 */

export type CameraAngle = 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;
export const CAMERA_ANGLES: CameraAngle[] = [0, 45, 90, 135, 180, 225, 270, 315];

/** Where the camera stands, in the walker's own frame: 0 = beside the left
    side, 90 = in front, 180 = beside the right side, 270 = behind. */
export const ANGLE_LABEL: Record<CameraAngle, string> = {
  0: "Side (left)",
  45: "Front-left",
  90: "Front",
  135: "Front-right",
  180: "Side (right)",
  225: "Rear-right",
  270: "Rear",
  315: "Rear-left",
};

/** The analytics bucket, a closed word. */
export const ANGLE_BUCKET: Record<CameraAngle, string> = {
  0: "side",
  45: "oblique-front",
  90: "front",
  135: "oblique-front",
  180: "side",
  225: "oblique-rear",
  270: "rear",
  315: "oblique-rear",
};

export type Availability = "easier" | "harder" | "unavailable";

export const SIGNALS = [
  { id: "knee-flexion", label: "Knee flexion" },
  { id: "stride-width", label: "Stride width" },
  { id: "step-timing", label: "Step timing" },
  { id: "foot-trajectory", label: "Foot path" },
  { id: "body-path", label: "Body path" },
] as const;
export type CameraSignal = (typeof SIGNALS)[number]["id"];

/* What each view gives. A side view sees the sagittal plane — joint angles,
   stride length, the foot's arc. A front or rear view sees the coronal plane
   — width, sway, foot placement — and foreshortens everything along the walk.
   Oblique views see both, partially, with a scale that changes as the person
   approaches. */
const TABLE: Record<"side" | "front" | "rear" | "oblique-front" | "oblique-rear", Record<CameraSignal, Availability>> = {
  side: { "knee-flexion": "easier", "stride-width": "unavailable", "step-timing": "easier", "foot-trajectory": "easier", "body-path": "harder" },
  front: { "knee-flexion": "unavailable", "stride-width": "easier", "step-timing": "harder", "foot-trajectory": "harder", "body-path": "harder" },
  rear: { "knee-flexion": "unavailable", "stride-width": "easier", "step-timing": "harder", "foot-trajectory": "harder", "body-path": "harder" },
  "oblique-front": { "knee-flexion": "harder", "stride-width": "harder", "step-timing": "harder", "foot-trajectory": "harder", "body-path": "easier" },
  "oblique-rear": { "knee-flexion": "harder", "stride-width": "harder", "step-timing": "harder", "foot-trajectory": "harder", "body-path": "easier" },
};

export function availabilityAt(angle: CameraAngle): Record<CameraSignal, Availability> {
  return TABLE[ANGLE_BUCKET[angle] as keyof typeof TABLE];
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  easier: "Easier",
  harder: "Harder",
  unavailable: "Unavailable",
};

/**
 * Project a side-view keyframe as seen from `angle`. A plan-view sketch: the
 * walker's forward axis is compressed by |cos θ|, and the two legs separate
 * sideways by |sin θ| × a nominal stride width, so a front view shows a narrow
 * figure with the feet apart and a side view shows the full stride with the
 * legs in one plane. Enough to make the argument visible; not a camera.
 */
export function projectPhase(phase: GaitPhase, angle: CameraAngle, width = 7): GaitPhase {
  const theta = (angle * Math.PI) / 180;
  const along = Math.cos(theta);
  const across = Math.sin(theta);
  const mapChain = <T extends readonly Pt[]>(chain: T, side: -1 | 1): T =>
    chain.map(([x, y]) => [x * along + side * across * width, y] as const) as unknown as T;
  return {
    ...phase,
    nearArm: mapChain(phase.nearArm, 1),
    farArm: mapChain(phase.farArm, -1),
    nearLeg: mapChain(phase.nearLeg, 1),
    farLeg: mapChain(phase.farLeg, -1),
    nearFoot: mapChain(phase.nearFoot, 1),
    farFoot: mapChain(phase.farFoot, -1),
    contacts: phase.contacts.map((c) => c * along),
  };
}

export const isCameraAngle = (value: unknown): value is CameraAngle =>
  typeof value === "number" && (CAMERA_ANGLES as number[]).includes(value);

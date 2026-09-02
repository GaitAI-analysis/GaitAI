/**
 * One stride of a side-view walk, sampled at five canonical gait events.
 *
 * Coordinates are local to the figure: pelvis at (0,0), ground at y≈48,
 * walking direction +x. The near side is drawn in front; the far side sits
 * dimmer behind the torso. Opposite arm/leg swing, knee flexion, pelvic
 * vertical oscillation and trailing/leading foot contact are encoded in the
 * data — no limb is placed by a transform, so every frame is a real pose
 * rather than a rotated copy of one.
 *
 * Shared so more than one section can draw anatomically consistent walkers
 * from a single source of truth.
 */

export type Pt = readonly [number, number];

export type GaitPhase = {
  id: string;
  /** Pelvis drop below the mid-stance high point, in local px. */
  lift: number;
  /** shoulder → elbow → wrist */
  nearArm: readonly [Pt, Pt, Pt];
  farArm: readonly [Pt, Pt, Pt];
  /** hip → knee → ankle */
  nearLeg: readonly [Pt, Pt, Pt];
  farLeg: readonly [Pt, Pt, Pt];
  /** ankle → toe */
  nearFoot: readonly [Pt, Pt];
  farFoot: readonly [Pt, Pt];
  /** x positions of ground contact under the figure */
  contacts: readonly number[];
};

export const GAIT_PHASES: readonly GaitPhase[] = [
  {
    id: "heel-strike",
    lift: 1.5,
    nearArm: [[1.5, -33], [-6, -19], [-12, -5]],
    farArm: [[1.5, -33], [10, -19], [17, -6]],
    nearLeg: [[2, 0], [13, 23], [23, 46]],
    farLeg: [[-2, 0], [-11, 23], [-19, 42]],
    nearFoot: [[23, 46], [32, 43]],
    farFoot: [[-19, 42], [-12, 47]],
    contacts: [23, -12],
  },
  {
    id: "loading",
    lift: 1,
    nearArm: [[1.5, -33], [-4, -19], [-9, -4]],
    farArm: [[1.5, -33], [8, -19], [13, -5]],
    nearLeg: [[2, 0], [12, 24], [19, 45]],
    farLeg: [[-2, 0], [-9, 24], [-15, 43]],
    nearFoot: [[19, 45], [27, 47]],
    farFoot: [[-15, 43], [-9, 47]],
    contacts: [22, -9],
  },
  {
    id: "mid-stance",
    lift: 0,
    nearArm: [[1.5, -33], [0, -19], [-3, -5]],
    farArm: [[1.5, -33], [3, -19], [5, -5]],
    nearLeg: [[2, 0], [3, 25], [3, 47]],
    farLeg: [[-2, 0], [-3, 21], [-9, 35]],
    nearFoot: [[3, 47], [11, 48]],
    farFoot: [[-9, 35], [-4, 40]],
    contacts: [7],
  },
  {
    id: "toe-off",
    lift: 1.5,
    nearArm: [[1.5, -33], [9, -19], [16, -5]],
    farArm: [[1.5, -33], [-7, -19], [-13, -5]],
    nearLeg: [[-1, 0], [-10, 22], [-18, 41]],
    farLeg: [[2, 0], [12, 23], [21, 46]],
    nearFoot: [[-18, 41], [-11, 47]],
    farFoot: [[21, 46], [30, 43]],
    contacts: [-11, 21],
  },
  {
    id: "swing",
    lift: 0.5,
    nearArm: [[1.5, -33], [2, -19], [0, -4]],
    farArm: [[1.5, -33], [1, -19], [3, -5]],
    nearLeg: [[0, 0], [7, 19], [1, 34]],
    farLeg: [[-1, 0], [0, 25], [0, 47]],
    nearFoot: [[1, 34], [7, 38]],
    farFoot: [[0, 47], [8, 48]],
    contacts: [4],
  },
];

/** Base of the neck, where the spine meets the shoulder line. */
export const GAIT_NECK: Pt = [1.5, -34];
/** Head centre. */
export const GAIT_HEAD: Pt = [2, -42];

import type { GaitPhase, Pt } from "@/components/visuals/gait-phases";

/**
 * The pose-error model shared by the article hero, the hub card and the
 * social card: how each failure mode moves an estimated joint away from the
 * body, and which joint the comparison should point at.
 *
 * ILLUSTRATIVE. The displacements are drawn to make a failure mode visible at
 * card size; they are not measured from any estimator. Nothing here is a
 * number a reader could mistake for a result.
 */

export type PoseIssue = "none" | "occlusion" | "blur" | "cropped" | "crossing";
export type PoseView = "ai" | "original";

/** Which keyframe each issue is drawn at: the moment the failure happens. */
export const POSE_PHASE_FOR: Record<PoseIssue, number> = { none: 2, occlusion: 0, blur: 3, cropped: 0, crossing: 2 };

/** Local units: the frame ends here when the feet are cropped. */
export const POSE_CROP_Y = 36;

type Chain = readonly [Pt, Pt, Pt];
const shift = (chain: Chain, at: number[], dx: number, dy: number): Chain =>
  chain.map((point, index) => (at.includes(index) ? ([point[0] + dx, point[1] + dy] as const) : point)) as unknown as Chain;

/** The estimate the issue produces, from the actual pose. */
export function estimatePose(actual: GaitPhase, issue: PoseIssue): GaitPhase {
  switch (issue) {
    case "occlusion":
      return {
        ...actual,
        farLeg: shift(actual.farLeg, [1, 2], 6, -2),
        farFoot: [
          [actual.farFoot[0][0] + 6, actual.farFoot[0][1] - 2],
          [actual.farFoot[1][0] + 6, actual.farFoot[1][1] - 2],
        ],
      };
    case "blur":
      return {
        ...actual,
        nearLeg: shift(actual.nearLeg, [2], 10, 1),
        nearFoot: [
          [actual.nearFoot[0][0] + 10, actual.nearFoot[0][1] + 1],
          [actual.nearFoot[1][0] + 10, actual.nearFoot[1][1] + 1],
        ],
      };
    case "cropped": {
      const clamp = (chain: Chain): Chain =>
        chain.map((point, index) =>
          index === 2 ? ([point[0] * 0.85, Math.min(point[1], POSE_CROP_Y)] as const) : point,
        ) as unknown as Chain;
      return {
        ...actual,
        nearLeg: clamp(actual.nearLeg),
        farLeg: clamp(actual.farLeg),
        nearFoot: [[actual.nearLeg[2][0] * 0.85, POSE_CROP_Y], [actual.nearLeg[2][0] * 0.85 + 4, POSE_CROP_Y]],
        farFoot: [[actual.farLeg[2][0] * 0.85, POSE_CROP_Y], [actual.farLeg[2][0] * 0.85 + 4, POSE_CROP_Y]],
      };
    }
    case "crossing":
      /* The legs trade places: what is drawn near is the far leg, and back. */
      return {
        ...actual,
        nearLeg: actual.farLeg,
        farLeg: actual.nearLeg,
        nearFoot: actual.farFoot,
        farFoot: actual.nearFoot,
      };
    default:
      return actual;
  }
}

/** The one joint the comparison should point at, in local units. */
export function poseFocusJoint(
  actual: GaitPhase,
  est: GaitPhase,
  issue: PoseIssue,
): { name: string; actual: Pt; est: Pt } | null {
  switch (issue) {
    case "occlusion":
      return { name: "far knee", actual: actual.farLeg[1], est: est.farLeg[1] };
    case "blur":
      return { name: "swing ankle", actual: actual.nearLeg[2], est: est.nearLeg[2] };
    case "cropped":
      return { name: "ankle", actual: actual.nearLeg[2], est: est.nearLeg[2] };
    case "crossing":
      return { name: "near knee", actual: actual.nearLeg[1], est: est.nearLeg[1] };
    default:
      return null;
  }
}

export const isPoseIssue = (value: unknown): value is PoseIssue =>
  value === "none" || value === "occlusion" || value === "blur" || value === "cropped" || value === "crossing";
export const isPoseView = (value: unknown): value is PoseView => value === "ai" || value === "original";

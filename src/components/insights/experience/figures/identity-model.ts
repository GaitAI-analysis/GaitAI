/**
 * The identity-layers model shared by the article hero, the hub card and the
 * social card: five representations of a walking video, five kinds of
 * identifying information, and how two facts about the deployment — whether
 * the data is kept over time, whether it is linked to other data — change
 * what remains identifying.
 *
 * QUALITATIVE. Each cue is present, weakened or removed; the verdict is a
 * phrase. Nothing here is a re-identification rate, and the ledger is the
 * argument of the essay, not a measurement of anyone.
 */

export type Representation = "rgb" | "face-removed" | "silhouette" | "skeleton" | "trajectories";
export const REPRESENTATIONS: Representation[] = ["rgb", "face-removed", "silhouette", "skeleton", "trajectories"];

export const REPRESENTATION_LABEL: Record<Representation, string> = {
  rgb: "RGB",
  "face-removed": "Face removed",
  silhouette: "Silhouette",
  skeleton: "Skeleton",
  trajectories: "Joint trajectories",
};

export type IdentityCue = "face" | "appearance" | "shape" | "gait" | "context";
export const CUES: Array<{ id: IdentityCue; label: string }> = [
  { id: "face", label: "Face" },
  { id: "appearance", label: "Clothing & colour" },
  { id: "shape", label: "Build & proportions" },
  { id: "gait", label: "Gait pattern" },
  { id: "context", label: "Time & place" },
];

export type CueState = "present" | "weakened" | "removed";

export interface IdentityContext {
  /** Observations are kept and can be matched across days. */
  persisted: boolean;
  /** The data can be joined to something that names a person. */
  linked: boolean;
}

/* What the representation alone leaves of each cue. */
const BASE: Record<Representation, Record<IdentityCue, CueState>> = {
  rgb: { face: "present", appearance: "present", shape: "present", gait: "present", context: "present" },
  "face-removed": { face: "removed", appearance: "present", shape: "present", gait: "present", context: "present" },
  silhouette: { face: "removed", appearance: "removed", shape: "present", gait: "present", context: "present" },
  skeleton: { face: "removed", appearance: "removed", shape: "weakened", gait: "present", context: "present" },
  trajectories: { face: "removed", appearance: "removed", shape: "removed", gait: "weakened", context: "present" },
};

export function identityLedger(representation: Representation, context: IdentityContext): Record<IdentityCue, CueState> {
  const ledger = { ...BASE[representation] };
  /* Kept over time: a weakened gait pattern recurs, and recurrence is a signature. */
  if (context.persisted && ledger.gait === "weakened") ledger.gait = "present";
  /* Linked: time and place stop being context and start being a name. */
  if (!context.linked && !context.persisted) ledger.context = "weakened";
  return ledger;
}

export type Verdict = "identifiable" | "still-identifiable" | "identifiable-to-a-model" | "hard-to-identify-alone" | "identifiable-by-linkage" | "re-identifiable-by-pattern";

export const VERDICT_LABEL: Record<Verdict, string> = {
  identifiable: "Identifiable",
  "still-identifiable": "Still identifiable",
  "identifiable-to-a-model": "Identifiable to a model",
  "hard-to-identify-alone": "Hard to identify — alone",
  "identifiable-by-linkage": "Identifiable by linkage",
  "re-identifiable-by-pattern": "Re-identifiable by pattern",
};

export function identityVerdict(representation: Representation, context: IdentityContext): Verdict {
  if (representation === "rgb") return "identifiable";
  if (representation === "face-removed") return context.linked ? "identifiable" : "still-identifiable";
  if (context.linked) return "identifiable-by-linkage";
  if (representation === "trajectories") return context.persisted ? "re-identifiable-by-pattern" : "hard-to-identify-alone";
  return "identifiable-to-a-model";
}

/** The soft body outline around the mid-stance pose, as a path. */
export function bodyMassPath(x: number, y: number, s: number): string {
  return [
    `M${x - 9 * s} ${y - 33 * s}`,
    `C${x - 11 * s} ${y - 20 * s} ${x - 8 * s} ${y - 6 * s} ${x - 7 * s} ${y + 4 * s}`,
    `L${x - 10 * s} ${y + 44 * s} L${x - 2 * s} ${y + 46 * s} L${x} ${y + 14 * s}`,
    `L${x + 3 * s} ${y + 46 * s} L${x + 11 * s} ${y + 45 * s} L${x + 7 * s} ${y + 4 * s}`,
    `C${x + 9 * s} ${y - 6 * s} ${x + 12 * s} ${y - 20 * s} ${x + 9 * s} ${y - 33 * s}`,
    `C${x + 6 * s} ${y - 36 * s} ${x - 6 * s} ${y - 36 * s} ${x - 9 * s} ${y - 33 * s} Z`,
  ].join(" ");
}

export const isRepresentation = (value: unknown): value is Representation =>
  typeof value === "string" && (REPRESENTATIONS as string[]).includes(value);

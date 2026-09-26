import { openAtlas } from "@/components/atlas/atlas-event";
import type { LabAction } from "@/data/experiments";

/**
 * What an `action` lab does when a reader activates it.
 *
 * `data/experiments.ts` names the actions; this maps each name to the ONE existing
 * mechanism it stands for. `open-atlas` is the same `openAtlas()` the navbar
 * glyph and the location strip call, so the experiments row, the search palette and
 * the header all open the same overlay with the same state — there is no
 * second Atlas, and nothing here to keep in step with the first.
 *
 * `Record<LabAction, …>` is deliberate: adding a name to `LAB_ACTIONS`
 * without a runner here is a type error, not a row that does nothing.
 */
const RUN: Record<LabAction, () => void> = {
  "open-atlas": openAtlas,
};

export function runExperimentAction(action: LabAction) {
  RUN[action]();
}

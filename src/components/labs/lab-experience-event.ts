/**
 * The one channel that opens the interactive lab.
 *
 * A custom event, matching how the Atlas and the search palette are opened:
 * the cover's button on /labs asks for the room without owning it, and the
 * viewer — mounted once on the page — is the single owner of its state.
 */
export const LAB_EXPERIENCE_EVENT = "gaitai:enter-lab";

export function enterLab() {
  window.dispatchEvent(new CustomEvent(LAB_EXPERIENCE_EVENT));
}

/**
 * Asset progress, from the scene chunk to the shell. The shell must not import
 * the 3D library just to read a loading counter — that would put it in the
 * page bundle — so the scene reports what it is fetching through this event.
 */
export const LAB_PROGRESS_EVENT = "gaitai:lab-progress";

export interface LabProgress {
  /** 0–100, from the loaders actually running. */
  progress: number;
  loaded: number;
  total: number;
  /** The URL being fetched right now. */
  item: string;
}

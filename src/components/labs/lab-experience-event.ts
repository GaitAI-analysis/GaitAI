/**
 * The one channel that opens the interactive lab.
 *
 * A custom event, matching how the Atlas and the search palette are opened:
 * the cover's button on /labs asks for the room without owning it, and the
 * viewer — mounted once on the page — is the single owner of its state.
 *
 * The event may carry the cover photograph's rectangle, so the viewer can
 * open by expanding that same photograph rather than cutting to it.
 */
export const LAB_EXPERIENCE_EVENT = "gaitai:enter-lab";

export interface EnterLabDetail {
  /** The cover image's bounding rectangle at the moment of the click. */
  from?: DOMRect;
}

export function enterLab(detail: EnterLabDetail = {}) {
  window.dispatchEvent(new CustomEvent<EnterLabDetail>(LAB_EXPERIENCE_EVENT, { detail }));
}

/**
 * Asset progress, from the digital-twin chunk to the shell. The shell must
 * not import the 3D library just to read a loading counter — that would put
 * it in the page bundle — so the scene reports what it is fetching through
 * this event.
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

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

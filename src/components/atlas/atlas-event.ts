/**
 * The one channel that opens the Atlas.
 *
 * A custom event rather than lifted state or a context, matching how the
 * search palette is opened (`SEARCH_EVENT`): the navbar and the location
 * trail can both ask for the map without either of them owning it or
 * re-rendering when it opens.
 */
export const ATLAS_EVENT = "gaitai:open-atlas";

/**
 * Ask for the map. Every way in — the navbar glyph, the location strip's
 * button, GaitScape's text link and the Atlas row in the Movement Intelligence
 * Lab's experiments list — calls this one
 * function, so there is exactly one place that knows how the overlay is
 * opened and no copy of the dispatch to drift.
 */
export function openAtlas() {
  window.dispatchEvent(new CustomEvent(ATLAS_EVENT));
}

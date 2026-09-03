/**
 * The one channel that opens the Atlas.
 *
 * A custom event rather than lifted state or a context, matching how the
 * search palette is opened (`SEARCH_EVENT`): the navbar and the location
 * trail can both ask for the map without either of them owning it or
 * re-rendering when it opens.
 */
export const ATLAS_EVENT = "gaitai:open-atlas";

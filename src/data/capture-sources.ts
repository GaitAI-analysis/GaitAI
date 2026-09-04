// ============================================================================
// CAPTURE SOURCES — THE VOCABULARY, AND NOTHING ELSE
// ----------------------------------------------------------------------------
// What a reader might already have: a clip, an existing camera feed, a watch,
// a phone, a pose stream, or several of those together.
//
// WHY THIS FILE HAS NO IMPORTS, AND MUST NOT ACQUIRE ANY. The vocabulary is
// needed by `products.ts` (each module declares the sources it can also work
// from), by `gaitscape/graph.ts` (which turns them into map nodes and derives
// the primary ones), and by half a dozen client components. products.ts sits
// UPSTREAM of the graph, so the type cannot live in the graph without a cycle.
//
// And there is a bundle reason as well as a typing one. The derivation used to
// read each module's `tech.inputs` prose out of product-details.ts, which
// meant graph.ts imported 1,500 lines of product copy — and graph.ts is
// reachable from the client bundle of seven routes, so /use-cases,
// /research/talks and /gaitscape each grew about 25 kB for data they never
// render. Anything imported here would land in the same seven bundles. Keep it
// at zero.
//
// The prose is still the source of truth for what a module accepts; it is just
// read at BUILD time now. `validate:gaitai` cross-checks every module's
// declared `supportingSources` against the sentences in its own `tech.inputs`
// and fails if they disagree, which is where a regex over English prose
// belongs — in a check that runs once, not in a bundle that ships.
// ============================================================================

export type CaptureSource =
  | "video"
  | "cctv"
  | "wearable"
  | "mobile"
  | "pose"
  | "multi";

export interface CaptureSourceDef {
  id: CaptureSource;
  label: string;
  /** What the reader actually has to hand. */
  note: string;
}

export const CAPTURE_SOURCES: CaptureSourceDef[] = [
  {
    id: "video",
    label: "Walking video",
    note: "A short clip from any standard camera",
  },
  {
    id: "cctv",
    label: "CCTV / fixed camera",
    note: "An existing camera feed in the space",
  },
  { id: "wearable", label: "Wearable", note: "Smartwatch or IMU signals" },
  {
    id: "mobile",
    label: "Mobile",
    note: "Capture on a phone, review on mobile",
  },
  {
    id: "pose",
    label: "Pose stream",
    note: "Skeleton landmarks rather than pixels",
  },
  {
    id: "multi",
    label: "Multiple sources",
    note: "More than one of the above, together",
  },
];

export const CAPTURE_SOURCE_LABEL: Record<CaptureSource, string> =
  Object.fromEntries(
    CAPTURE_SOURCES.map((source) => [source.id, source.label]),
  ) as Record<CaptureSource, string>;

/** Stable order, for any list of sources that needs one. */
export const sortCaptureSources = (sources: readonly CaptureSource[]) =>
  CAPTURE_SOURCES.map((source) => source.id).filter((id) =>
    sources.includes(id),
  );

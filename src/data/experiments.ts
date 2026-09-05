// ============================================================================
// MOVEMENT INTELLIGENCE LAB — THE EXPERIMENTS
// ----------------------------------------------------------------------------
// The interactive experiments, in one place, so the Movement Intelligence Lab's
// "Explore the lab" section, the search palette, the assistant's corpus and the
// site map cannot disagree about what exists.
//
// WHAT THIS FILE IS NOT. It is not GaitAI Labs. GaitAI Labs (`data/labs.ts`,
// /labs) is the home of the gait RESEARCH assets — the gait dataset and the
// gait biometrics lab. The records below are general movement-intelligence
// experiments: ways of poking at the pipeline, the signals, the privacy path
// and the inputs. They belong to the Movement Intelligence Lab, are listed at
// the foot of /movement-lab, and used to be listed on /labs before that route
// was given to the research assets. The two are kept apart on purpose.
//
// THE RULE THIS FILE ENFORCES: every record here points at an interface that
// is BUILT AND WORKING TODAY. An experiment that is planned, sketched or
// half-wired does not get a record, because the section renders this list
// verbatim and a placeholder on it would be exactly the fake demo the list
// exists to avoid. Experiments arrive here on the day they run and not
// before, which is why this list grew rather than being written all at once —
// every entry below was added by the commit that made it work.
//
// Some of these live at their own route and some are instruments INSIDE a
// longer page, reached by anchor. That distinction is carried in `home` and
// shown in the list, so a reader knows whether a link is a destination or a
// place on a page they may already have read.
//
// ONE OF THEM IS NOT A PLACE AT ALL. The Atlas is a site-wide overlay with no
// route of its own; it opens over whatever page you are on. A record can
// therefore be one of two `kind`s — a `route`, which navigates to `href`, or
// an `action`, which runs a named thing the site already knows how to do.
// Consumers switch on `kind`; nobody reaches for `href` on an action record
// and nobody invents a fake URL to make one look like a page.
//
// ORDER IS THE ARRAY. The numbers a reader sees are 01, 02, … in the order
// the records appear below, derived at render time. There is no `index` field
// to keep in step with a reorder.
// ============================================================================

export type LabBasis =
  /** Runs a real model, in the reader's browser, on their own input. */
  | "live-model"
  /** Real relationship data from the product and capability records. */
  | "real-relationships"
  /** Example values, labelled as such wherever a reading appears. */
  | "illustrative";

/**
 * A NOTE ON THE HREFS BELOW. Every one carries a trailing slash before its
 * anchor — `/mobilitycare/#time-machine`, not `/mobilitycare#time-machine`.
 * `next.config.mjs` sets `trailingSlash`, so the slashless form works under
 * client-side navigation and 404s on a hard load or a copied link. The
 * validator now checks this, which is how the three anchored labs were caught.
 */
/**
 * The things an `action` record can do. Every name here maps to ONE existing
 * mechanism on the site — `open-atlas` fires the same `ATLAS_EVENT` the
 * navbar glyph and the location strip fire — so an action experiment is never
 * a second implementation of anything. The runner lives with the components
 * (`components/experiments/experiment-actions.ts`); this file only names the
 * actions so the validator can refuse a record that points at one that does
 * not exist.
 */
export const LAB_ACTIONS = ["open-atlas"] as const;
export type LabAction = (typeof LAB_ACTIONS)[number];

interface ExperimentBase {
  id: string;
  name: string;
  /** One line, under the name. */
  strap: string;
  /** What a reader can actually do, in one sentence. */
  body: string;
  /** Where it lives, when that is not simply "its own page". */
  home?: string;
  basis: LabBasis;
}

/** An experiment that is a place: its own route, or an anchor inside a longer page. */
export interface RouteExperiment extends ExperimentBase {
  kind: "route";
  href: string;
}

/** An experiment that is a thing the site does: an overlay opened in place. */
export interface ActionExperiment extends ExperimentBase {
  kind: "action";
  action: LabAction;
}

export type ExperimentRecord = RouteExperiment | ActionExperiment;

/**
 * The section that lists the experiments, at the foot of /movement-lab.
 * Search and the assistant's corpus quote these, so they are stated once.
 */
export const EXPERIMENTS_ANCHOR = "/movement-lab/#experiments";
export const EXPERIMENTS_EYEBROW = "Explore the lab";
export const EXPERIMENTS_TITLE_LEAD = "Explore the";
export const EXPERIMENTS_TITLE_ACCENT = "Movement Intelligence Lab.";
export const EXPERIMENTS_BLURB =
  "Interactive experiments for exploring how GaitAI interprets movement, signals, privacy, trajectories and multimodal inputs.";

/**
 * What every experiment has in common, stated once above the list rather than
 * repeated per entry. It is not a disclaimer for the whole page — the analyzer
 * runs a genuine pose model — so it says precisely which part is illustrative.
 */
export const EXPERIMENTS_BOUNDARY =
  "These are exploratory interfaces, not product output. Where an experiment shows a reading it is an example value, and the experiment says so at the point it appears.";

export const LAB_BASIS_LABEL: Record<LabBasis, string> = {
  "live-model": "Live model, in your browser",
  "real-relationships": "Real product and capability records",
  illustrative: "Illustrative data",
};

export const experiments: ExperimentRecord[] = [
  {
    /* THE ATLAS IS FIRST because it is the one experiment that applies to
       every other: the whole website as a tree you can walk, with the page
       you are on lit. It is not a page — it opens over this one — so it is
       an `action` record and the row that renders it is a button, not a
       link. Copy below is the overlay's own: its title and subtitle, what
       the tree holds (`data/site-map.ts`), the find-a-page filter and the
       GaitScape hand-off in its footer. Nothing here claims a thing the
       Atlas does not do. */
    id: "gaitai-atlas",
    kind: "action",
    action: "open-atlas",
    name: "GaitAI Atlas",
    strap: "The whole website, and where you are in it",
    body:
      "Open the site map over the page you are on: every section, module, environment, article and paper as one tree with your current location lit, a find-a-page filter that reveals matches in place, and a step across to GaitScape for how the intelligence connects.",
    home: "An overlay on every page, also from the navbar",
    basis: "real-relationships",
  },
  {
    /* The staged walkthrough. When this list lived on /labs the record
       pointed at /movement-lab/ as a whole; now that the list is ON that
       page, it points at the walkthrough itself so the row is never a link
       back to the page the reader is already on. */
    id: "movement-lab",
    kind: "route",
    name: "Pipeline Walkthrough",
    strap: "Capture → pose → signal → intelligence",
    body:
      "The whole pipeline as one staged walkthrough: a clip becomes body landmarks, landmarks become temporal channels, and channels become the features a module reads — in a MobilityCare mode and an identity-free SecureVision mode.",
    href: "/movement-lab/#walkthrough",
    home: "Inside the Movement Intelligence Lab",
    basis: "illustrative",
  },
  {
    id: "gaitscape",
    kind: "route",
    name: "GaitScape",
    strap: "Explore the GaitAI ecosystem visually",
    body:
      "Inputs, capabilities, product families, modules and the research behind them as one navigable landscape — select any node and the parts of the system it touches light up.",
    href: "/gaitscape/",
    basis: "real-relationships",
  },
  {
    id: "signal-inspector",
    kind: "route",
    name: "Signal Inspector",
    strap: "Explore how different inputs become movement features",
    body:
      "Change the capture source and the chain redraws: the signals read from it, the capabilities that process them, the modules built on those capabilities, and what each one produces.",
    href: "/movement-lab/#signal-chain",
    home: "Inside the Movement Intelligence Lab",
    basis: "real-relationships",
  },
  {
    id: "footage-check",
    kind: "route",
    name: "Footage Check",
    strap: "See what GaitAI could read from what you already have",
    body:
      "Describe the footage you have — camera height, distance, crowding, duration — and every module is rated against what its own record says it needs, with the reasons listed.",
    href: "/movement-lab/#footage",
    home: "Inside the Movement Intelligence Lab",
    basis: "real-relationships",
  },
  {
    id: "movement-xray",
    kind: "route",
    name: "Movement X-Ray",
    strap: "Human view / AI view of the same walk",
    body:
      "Switch between the body a person sees and the channels a model reads off it — landmarks, ground contact, joint trajectories and temporal traces. Both views draw the same stride data, so it is provably one walk read two ways.",
    href: "/mobilitycare/#x-ray",
    home: "Inside MobilityCare and SecureVision",
    basis: "illustrative",
  },
  {
    id: "privacy-lens",
    kind: "route",
    name: "Privacy Lens",
    strap: "Sensing → privacy transformed → movement intelligence",
    body:
      "Step through the three processing stages of the identity-free path and see what each one carries forward and what stops being available — one figure, losing information, with the scope of the claim stated on screen.",
    href: "/securevision/#privacy-lens",
    home: "Inside SecureVision",
    basis: "illustrative",
  },
  {
    id: "fusion-sandbox",
    kind: "route",
    name: "Fusion Sandbox",
    strap: "A missing input is a known unknown. A corrupted one is not.",
    body:
      "Set video, pose, wearable and trajectory to available, missing or corrupted. A missing input makes the read-out shorter; a corrupted one leaves it exactly the same size, which is why it is the more dangerous failure.",
    href: "/movement-lab/#fusion",
    home: "Inside the Movement Intelligence Lab",
    basis: "real-relationships",
  },
  {
    id: "time-machine",
    kind: "route",
    name: "Mobility Time Machine",
    strap: "One walk is a snapshot. Five is a trajectory.",
    body:
      "Scrub five illustrative sessions and watch symmetry, cadence and movement variability change — including the interval where one signal stalls while another keeps moving, which is the whole reason a repeated record is read signal by signal.",
    href: "/mobilitycare/#time-machine",
    home: "Inside MobilityCare",
    basis: "illustrative",
  },
];


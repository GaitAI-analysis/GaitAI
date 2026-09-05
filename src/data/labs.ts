// ============================================================================
// GAITAI LABS
// ----------------------------------------------------------------------------
// The experimental surfaces, in one place, so /labs, the Explore menu, the
// search palette and the site map cannot disagree about what exists.
//
// THE RULE THIS FILE ENFORCES: every record here points at an interface that
// is BUILT AND WORKING TODAY. A lab that is planned, sketched or half-wired
// does not get a record, because the page renders this list verbatim and a
// placeholder on it would be exactly the fake demo the Labs page exists to
// avoid. Experiments named in the Labs brief arrive here on the day they run
// and not before, which is why this list grew rather than being written all
// at once — every entry below was added by the commit that made it work.
//
// Some of these live at their own route and some are instruments INSIDE a
// longer page, reached by anchor. That distinction is carried in `home` and
// shown on the page, so a reader knows whether a link is a destination or a
// place on a page they may already have read.
//
// ONE OF THEM IS NOT A PLACE AT ALL. The Atlas is a site-wide overlay with no
// route of its own; it opens over whatever page you are on. A record can
// therefore be one of two `kind`s — a `route`, which navigates to `href`, or
// an `action`, which runs a named thing the site already knows how to do.
// Consumers switch on `kind`; nobody reaches for `href` on an action record
// and nobody invents a fake URL to make one look like a page.
//
// ORDER IS THE ARRAY. The numbers a reader sees on /labs are 01, 02, … in the
// order the records appear below, derived at render time. There is no `index`
// field to keep in step with a reorder.
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
 * navbar glyph and the location strip fire — so an action lab is never a
 * second implementation of anything. The runner lives with the components
 * (`components/labs/lab-actions.ts`); this file only names the actions so the
 * validator can refuse a record that points at one that does not exist.
 */
export const LAB_ACTIONS = ["open-atlas"] as const;
export type LabAction = (typeof LAB_ACTIONS)[number];

interface LabBase {
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

/** A lab that is a place: its own route, or an anchor inside a longer page. */
export interface RouteLab extends LabBase {
  kind: "route";
  href: string;
}

/** A lab that is a thing the site does: an overlay opened in place. */
export interface ActionLab extends LabBase {
  kind: "action";
  action: LabAction;
}

export type LabRecord = RouteLab | ActionLab;

export const LABS_EYEBROW = "GaitAI Labs";
export const LABS_TITLE_LEAD = "Explore movement";
export const LABS_TITLE_ACCENT = "before deploying it.";
export const LABS_BLURB =
  "Interactive experiments that make GaitAI's movement-intelligence pipeline easier to understand.";

/**
 * What every lab has in common, stated once on the page rather than repeated
 * per entry. It is not a disclaimer for the whole page — the analyzer runs a
 * genuine pose model — so it says precisely which part is illustrative.
 */
export const LABS_BOUNDARY =
  "These are exploratory interfaces, not product output. Where a lab shows a reading it is an example value, and the lab says so at the point it appears.";

export const LAB_BASIS_LABEL: Record<LabBasis, string> = {
  "live-model": "Live model, in your browser",
  "real-relationships": "Real product and capability records",
  illustrative: "Illustrative data",
};

export const labs: LabRecord[] = [
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
    id: "movement-lab",
    kind: "route",
    name: "Movement Intelligence Lab",
    strap: "Capture → pose → signal → intelligence",
    body:
      "The whole pipeline as one walkthrough: a clip becomes body landmarks, landmarks become temporal channels, and channels become the features a module reads.",
    href: "/movement-lab/",
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

/** The analyzer that takes a clip apart, linked from the Labs hero. */
export const LABS_PRIMARY_HREF = "/movement-lab/#analyze";

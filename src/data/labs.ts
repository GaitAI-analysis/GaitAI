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
// and not before — the privacy lens and the fusion sandbox are still absent
// for exactly that reason.
//
// Some of these live at their own route and some are instruments INSIDE a
// longer page, reached by anchor. That distinction is carried in `home` and
// shown on the page, so a reader knows whether a link is a destination or a
// place on a page they may already have read.
// ============================================================================

export type LabBasis =
  /** Runs a real model, in the reader's browser, on their own input. */
  | "live-model"
  /** Real relationship data from the product and capability records. */
  | "real-relationships"
  /** Example values, labelled as such wherever a reading appears. */
  | "illustrative";

export interface LabRecord {
  id: string;
  /** Display index — the page shows these as 01, 02, … in order. */
  index: number;
  name: string;
  /** One line, under the name. */
  strap: string;
  /** What a reader can actually do, in one sentence. */
  body: string;
  href: string;
  /** Where it lives, when that is not simply "its own page". */
  home?: string;
  basis: LabBasis;
}

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
    id: "movement-lab",
    index: 1,
    name: "Movement Intelligence Lab",
    strap: "Capture → pose → signal → intelligence",
    body:
      "The whole pipeline as one walkthrough: a clip becomes body landmarks, landmarks become temporal channels, and channels become the features a module reads.",
    href: "/movement-lab",
    basis: "illustrative",
  },
  {
    id: "gaitscape",
    index: 2,
    name: "GaitScape",
    strap: "Explore the GaitAI ecosystem visually",
    body:
      "Inputs, capabilities, product families, modules and the research behind them as one navigable landscape — select any node and the parts of the system it touches light up.",
    href: "/gaitscape",
    basis: "real-relationships",
  },
  {
    id: "signal-inspector",
    index: 3,
    name: "Signal Inspector",
    strap: "Explore how different inputs become movement features",
    body:
      "Change the capture source and the chain redraws: the signals read from it, the capabilities that process them, the modules built on those capabilities, and what each one produces.",
    href: "/movement-lab#signal-chain",
    home: "Inside the Movement Intelligence Lab",
    basis: "real-relationships",
  },
  {
    id: "footage-check",
    index: 4,
    name: "Footage Check",
    strap: "See what GaitAI could read from what you already have",
    body:
      "Describe the footage you have — camera height, distance, crowding, duration — and every module is rated against what its own record says it needs, with the reasons listed.",
    href: "/movement-lab#footage",
    home: "Inside the Movement Intelligence Lab",
    basis: "real-relationships",
  },
  {
    id: "movement-xray",
    index: 5,
    name: "Movement X-Ray",
    strap: "Human view / AI view of the same walk",
    body:
      "Switch between the body a person sees and the channels a model reads off it — landmarks, ground contact, joint trajectories and temporal traces. Both views draw the same stride data, so it is provably one walk read two ways.",
    href: "/mobilitycare#x-ray",
    home: "Inside MobilityCare and SecureVision",
    basis: "illustrative",
  },
  {
    id: "time-machine",
    index: 6,
    name: "Mobility Time Machine",
    strap: "One walk is a snapshot. Five is a trajectory.",
    body:
      "Scrub five illustrative sessions and watch symmetry, cadence and movement variability change — including the interval where one signal stalls while another keeps moving, which is the whole reason a repeated record is read signal by signal.",
    href: "/mobilitycare#time-machine",
    home: "Inside MobilityCare",
    basis: "illustrative",
  },
];

/** The analyzer that takes a clip apart, linked from the Labs hero. */
export const LABS_PRIMARY_HREF = "/movement-lab#analyze";

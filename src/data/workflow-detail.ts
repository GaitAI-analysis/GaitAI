// ============================================================================
// WHAT EACH WORKFLOW STAGE OPENS ONTO
// ----------------------------------------------------------------------------
// The home page's four workflow stages say what happens. This is the
// vocabulary behind each one, for a reader who wants to see it — and every
// entry is READ from the taxonomy that already describes the platform
// site-wide. Nothing is written here.
//
//   01 Capture Movement             → the capture sources it works from
//   02 AI Understands Movement      → the AI capabilities applied to them
//   03 Insight, Report or Dashboard → the movement signals a report is built on
//   04 Clinician / Operator Acts    → the outcomes those reports support
//
// That is the site's own declared chain, read at the layer each stage sits on:
//
//   MOVEMENT SIGNAL → AI CAPABILITY → PRODUCT → APPLICATION DOMAIN → OUTCOME
//
// (see data/taxonomy.ts, which is a read layer over data/gaitscape/graph.ts —
// the single source of truth for every entity on the site).
//
// NOTHING IS DECLARED HERE, AND THAT IS THE POINT. Add a signal, capability or
// outcome to the graph and the stage that lists it grows with it; reword one
// and the wording here changes too. This file cannot drift from what the rest
// of the site says, because it holds no copy of its own — only a mapping from
// stage index to taxonomy layer.
//
// The four labels below are the plain plurals of the graph's own
// `NODE_TYPE_LABEL` entries ("Capture source", "AI capability", "Movement
// signal", "Outcome"), so the panel names these things exactly as GaitScape,
// the product pages and the use cases already name them.
//
// BUNDLE NOTE. `taxonomy.ts` reads `gaitscape/graph.ts`, which the home page
// ALREADY loads on the client for the capture-chain teaser (MovementTeaser →
// data/analytics → graph). So these lists cost the home page essentially
// nothing beyond what it ships today. Importing them into a component that is
// not already on that path would not be free — check before doing it.
// ============================================================================

import { CAPTURE_SOURCES } from "@/data/capture-sources";
import type { GaitscapeNode } from "@/data/gaitscape/types";
import { aiCapabilities, movementSignals, outcomes } from "@/data/taxonomy";

/** One named thing, with the one-line description the graph already gives it. */
export interface StageDetailItem {
  title: string;
  note: string;
}

export interface StageDetail {
  /** The taxonomy layer this stage opens onto. */
  label: string;
  items: StageDetailItem[];
}

const fromNodes = (nodes: GaitscapeNode[]): StageDetailItem[] =>
  nodes.map((node) => ({ title: node.title, note: node.shortDescription }));

/** Indexed to match `workflowStages` in data/products.ts, stage for stage. */
export const workflowStageDetails: StageDetail[] = [
  {
    label: "Capture sources",
    items: CAPTURE_SOURCES.map((source) => ({
      title: source.label,
      note: source.note,
    })),
  },
  { label: "AI capabilities applied", items: fromNodes(aiCapabilities) },
  { label: "Movement signals measured", items: fromNodes(movementSignals) },
  { label: "Outcomes supported", items: fromNodes(outcomes) },
];

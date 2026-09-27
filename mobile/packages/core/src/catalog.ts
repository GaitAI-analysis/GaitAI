/**
 * The in-app product catalogue. Only products whose analysis really runs are
 * `available`; the rest are `coming-soon` and cannot be started. See
 * docs/mobile-product-capability-matrix.md for the audit behind each row.
 */
import type { AnalysisProductId, ProductId } from "./schema";

export type Availability = "available" | "coming-soon";

export interface CatalogEntry {
  id: AnalysisProductId;
  product: ProductId;
  name: string;
  /** One line under the name. */
  promise: string;
  /** What the user provides. */
  input: string;
  /** What the analysis really measures, in one sentence. */
  measures: string;
  availability: Availability;
  /** Route inside the app. */
  route: string;
  freeMetricLabels: string[];
  premiumMetricLabels: string[];
  /** Why it is not available yet, shown on the coming-soon card. */
  reason?: string;
}

export const CATALOG: CatalogEntry[] = [
  {
    id: "walkscan", product: "mobilitycare", name: "WalkScan",
    promise: "Read your walk from a short video.",
    input: "10–20 s walking video, side view preferred",
    measures: "Foot-contact timing from body landmarks: cadence, step-time balance, variability, regularity and trunk sway.",
    availability: "available", route: "/analyze/walkscan",
    freeMetricLabels: ["Cadence", "Step-time balance"],
    premiumMetricLabels: ["Step-time variability", "Stride regularity", "Trunk sway", "Left / right step timing", "Contact timeline", "Quality report", "Trend vs previous scan", "Detailed report"],
  },
  {
    id: "rehabtrack", product: "mobilitycare", name: "RehabTrack",
    promise: "Compare a new scan with your baseline.",
    input: "Two or more WalkScan sessions",
    measures: "Metric-by-metric change between sessions, in the same units they were measured in.",
    availability: "available", route: "/analyze/rehabtrack",
    freeMetricLabels: ["Cadence change", "Balance change"],
    premiumMetricLabels: ["Full metric comparison", "Trend graph", "Side-by-side timelines", "Consistency across sessions", "Notes", "Report"],
  },
  {
    id: "balance", product: "mobilitycare", name: "Balance",
    promise: "Stability indicators while standing.",
    input: "10–20 s standing-still video",
    measures: "Trunk and hip displacement over time from body landmarks.",
    availability: "coming-soon", route: "/analyze/balance",
    freeMetricLabels: ["Sway summary"], premiumMetricLabels: ["Sway timeline", "Per-axis breakdown"],
    reason: "The measurement exists; the guided still-standing capture and result screen are not built yet.",
  },
  {
    id: "sportsmotion", product: "mobilitycare", name: "SportsMotion",
    promise: "Movement analysis for training.",
    input: "Movement video",
    measures: "Joint-angle timelines are computable; no sport-specific interpretation exists yet.",
    availability: "coming-soon", route: "/analyze/sportsmotion",
    freeMetricLabels: [], premiumMetricLabels: [],
    reason: "No sport-specific analysis pipeline exists in GaitAI yet.",
  },
  {
    id: "crowdsense", product: "securevision", name: "CrowdSense",
    promise: "How many people, and when.",
    input: "Video of a space you are authorised to analyse",
    measures: "People visible to an on-device person detector, per sampled frame.",
    availability: "available", route: "/analyze/crowdsense",
    freeMetricLabels: ["Current count", "Average count", "Peak count"],
    premiumMetricLabels: ["Density timeline", "Per-frame counts", "Detection review", "Export"],
  },
  {
    id: "zone", product: "securevision", name: "Zone & occupancy",
    promise: "Draw a zone. Count what crosses it.",
    input: "Same video, plus a zone you draw on a frame",
    measures: "Detections whose foot point falls in your zone; entries, exits and dwell from frame-to-frame tracking (estimates).",
    availability: "available", route: "/analyze/zone",
    freeMetricLabels: ["Total entries", "Current occupancy"],
    premiumMetricLabels: ["Event list with timestamps", "Occupancy timeline", "Dwell distribution", "Export"],
  },
  {
    id: "motion", product: "securevision", name: "Motion analysis",
    promise: "Where and when movement happens.",
    input: "Video",
    measures: "Frame-difference motion energy over time.",
    availability: "coming-soon", route: "/analyze/motion",
    freeMetricLabels: ["Motion timeline"], premiumMetricLabels: ["Per-zone motion"],
    reason: "Not in the first build.",
  },
];

export const catalogFor = (product: ProductId) => CATALOG.filter((c) => c.product === product);
export const catalogEntry = (id: AnalysisProductId) => CATALOG.find((c) => c.id === id)!;

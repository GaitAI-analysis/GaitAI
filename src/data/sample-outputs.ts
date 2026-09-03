// ============================================================================
// SAMPLE OUTPUTS — SYNTHETIC, AND SAID SO
// ----------------------------------------------------------------------------
// What a module's output actually looks like, so a reader can see the shape of
// the deliverable instead of reading a description of it.
//
// EVERY NUMBER IN THIS FILE IS INVENTED. None of it comes from an assessment,
// a camera, a study or a customer. That is why:
//
//   · each record carries `synthetic: true` and the viewer renders
//     SyntheticDataBadge unconditionally — there is no code path that shows
//     these figures without the label
//   · values are plausible-but-round, never precise-looking (94%, not 93.7%),
//     so they read as illustration rather than measurement
//   · nothing is framed as an outcome, a probability, a diagnosis or a
//     benchmark. A fall-risk sample shows a screening CATEGORY and its
//     contributing signals, never a percentage chance of falling
//   · no accuracy, latency, false-positive rate or confidence score appears
//     anywhere, because none is published
//
// The metric NAMES, output NAMES and field names are not invented — they come
// from each module's documented `outputs` in products.ts and its detail record
// in product-details*.ts. Only the illustrative values are synthetic.
//
// Modules without an entry simply have no sample viewer; evidence-status.ts
// reads that absence and reports "interactive demo — not yet published" rather
// than implying one exists.
// ============================================================================

/** A single labelled figure. `hint` explains what it measures, on demand. */
export interface SampleMetric {
  label: string;
  value: string;
  unit?: string;
  /** What this measures — plain language, no diagnostic framing. */
  hint: string;
}

/** A named series for a sparkline. Values are unitless illustration. */
export interface SampleSeries {
  label: string;
  points: number[];
  hint: string;
}

export interface SampleRow {
  label: string;
  value: string;
}

export interface SampleTab {
  id: string;
  label: string;
  /** One line stating what this view answers. */
  lead: string;
  metrics?: SampleMetric[];
  series?: SampleSeries[];
  rows?: SampleRow[];
  /** Ordered phases, for a gait-cycle or event timeline. */
  phases?: { label: string; share: number; hint: string }[];
  /** Bulleted observations — movement characteristics, never conclusions. */
  notes?: string[];
}

export interface SampleOutput {
  productId: string;
  /** The CTA label on the product page. */
  action: string;
  /** What this artefact is, in the module's own vocabulary. */
  kind: string;
  /** Always true. Kept explicit so the viewer cannot be used without it. */
  synthetic: true;
  /** The boundary this artefact must always carry. */
  boundary: string;
  tabs: SampleTab[];
}

// ----------------------------------------------------------------------------
// MOBILITYCARE
// ----------------------------------------------------------------------------

const walkscan: SampleOutput = {
  productId: "walkscan",
  action: "View sample movement report",
  kind: "Movement report",
  synthetic: true,
  boundary:
    "A structured movement report for clinician review. It does not diagnose, and it does not replace clinical judgement.",
  tabs: [
    {
      id: "summary",
      label: "Summary",
      lead: "The measurements a single walking capture produces.",
      metrics: [
        {
          label: "Cadence",
          value: "112",
          unit: "steps/min",
          hint: "Steps completed per minute across the captured walk.",
        },
        {
          label: "Walking speed",
          value: "1.14",
          unit: "m/s",
          hint: "Distance covered per second over the measured segment.",
        },
        {
          label: "Step asymmetry",
          value: "6",
          unit: "%",
          hint: "Difference between the selected left and right temporal gait characteristics.",
        },
        {
          label: "Symmetry index",
          value: "94",
          unit: "%",
          hint: "How closely the two sides match on the measured temporal characteristics.",
        },
      ],
      notes: [
        "Capture quality passed the automated checks for frame rate and full-body visibility.",
        "Measurements describe this capture only; comparison requires a second session.",
      ],
    },
    {
      id: "gait-cycle",
      label: "Gait cycle",
      lead: "How the captured stride divides into its phases.",
      phases: [
        { label: "Heel strike", share: 8, hint: "Initial contact of the foot with the ground." },
        { label: "Stance", share: 52, hint: "The period the foot remains loaded." },
        { label: "Toe-off", share: 12, hint: "The push-off that ends the loaded period." },
        { label: "Swing", share: 28, hint: "The period the foot travels without contact." },
      ],
      notes: [
        "Phase shares are proportions of one detected cycle, averaged across the capture.",
      ],
    },
    {
      id: "symmetry",
      label: "Symmetry",
      lead: "Left and right compared on the same temporal characteristics.",
      rows: [
        { label: "Step time · left", value: "0.54 s" },
        { label: "Step time · right", value: "0.57 s" },
        { label: "Stance share · left", value: "51%" },
        { label: "Stance share · right", value: "53%" },
        { label: "Swing share · left", value: "29%" },
        { label: "Swing share · right", value: "27%" },
      ],
      notes: [
        "A side difference is a measurement, not a finding. Interpretation stays with the clinician.",
      ],
    },
    {
      id: "temporal",
      label: "Temporal metrics",
      lead: "Step-to-step consistency within the capture.",
      series: [
        {
          label: "Step time variability",
          points: [4, 5, 4, 6, 5, 7, 5, 6, 5, 5, 6, 5],
          hint: "Spread of step durations across the capture — lower is more consistent.",
        },
        {
          label: "Cadence across segment",
          points: [108, 110, 112, 113, 112, 111, 113, 114, 112, 112, 111, 112],
          hint: "Cadence sampled across the walk, to show whether it held steady.",
        },
      ],
    },
    {
      id: "pose",
      label: "Pose",
      lead: "The postural characteristics extracted from the capture.",
      rows: [
        { label: "Trunk inclination", value: "4° forward" },
        { label: "Shoulder level difference", value: "2°" },
        { label: "Pelvic level difference", value: "3°" },
        { label: "Head position", value: "Neutral" },
      ],
      notes: [
        "Angles are derived from estimated body landmarks and depend on capture geometry.",
      ],
    },
    {
      id: "trend",
      label: "Trend",
      lead: "How this session compares with earlier sessions, once several exist.",
      series: [
        {
          label: "Walking speed across sessions",
          points: [1.02, 1.05, 1.06, 1.1, 1.09, 1.12, 1.14],
          hint: "One point per assessment, oldest first. Trend needs repeated captures.",
        },
        {
          label: "Symmetry index across sessions",
          points: [88, 89, 90, 91, 92, 93, 94],
          hint: "The same symmetry measurement, session over session.",
        },
      ],
      notes: [
        "A trend is only readable when captures follow a consistent protocol.",
      ],
    },
  ],
};

const fallrisk: SampleOutput = {
  productId: "fallrisk",
  action: "View sample screening summary",
  kind: "Screening summary",
  synthetic: true,
  boundary:
    "Screening support for care teams — not a prediction that a specific individual will fall.",
  tabs: [
    {
      id: "indicator",
      label: "Screening indicator",
      lead: "A category with the signals that placed it there.",
      metrics: [
        {
          label: "Screening category",
          value: "Medium",
          hint: "A low / medium / high band derived from the movement signals listed below.",
        },
        {
          label: "Contributing signals",
          value: "3",
          hint: "How many measured signals moved away from this person's own baseline.",
        },
        {
          label: "Change since last review",
          value: "−0.08",
          unit: "m/s",
          hint: "Difference in walking speed against the previous assessment.",
        },
      ],
      notes: [
        "The category is a review-prioritisation aid. It is not a probability, and it is not a clinical finding.",
      ],
    },
    {
      id: "contributors",
      label: "Contributing signals",
      lead: "Which measurements moved, and in which direction.",
      rows: [
        { label: "Stride variability", value: "Increased" },
        { label: "Step asymmetry", value: "Increased" },
        { label: "Walking speed", value: "Decreased" },
        { label: "Cadence", value: "Unchanged" },
        { label: "Postural stability indicator", value: "Unchanged" },
      ],
      notes: [
        "Every category shows its drivers, so a reviewer can sanity-check the call rather than trust a number.",
      ],
    },
    {
      id: "trend",
      label: "Mobility trend",
      lead: "The longitudinal view the category is computed against.",
      series: [
        {
          label: "Walking speed",
          points: [1.24, 1.22, 1.2, 1.18, 1.15, 1.14, 1.12],
          hint: "One point per monthly screening, oldest first.",
        },
        {
          label: "Stride variability",
          points: [5, 5, 6, 6, 7, 8, 9],
          hint: "Step-to-step spread over the same screenings — rising means less consistent.",
        },
      ],
      notes: [
        "Risk is always computed against the individual's own baseline, so a naturally slow walker is not read as high risk.",
      ],
    },
  ],
};

const rehabtrack: SampleOutput = {
  productId: "rehabtrack",
  action: "View longitudinal comparison",
  kind: "Recovery comparison",
  synthetic: true,
  boundary:
    "A measured comparison across sessions. Recovery interpretation stays with the therapist.",
  tabs: [
    {
      id: "progress",
      label: "Session comparison",
      lead: "The same measurements, aligned across a therapy course.",
      series: [
        {
          label: "Symmetry index",
          points: [72, 75, 79, 82, 84, 87, 89],
          hint: "Left/right agreement on temporal characteristics, session over session.",
        },
        {
          label: "Walking speed",
          points: [0.72, 0.78, 0.85, 0.9, 0.96, 1.0, 1.05],
          hint: "Measured speed per session, oldest first.",
        },
      ],
    },
    {
      id: "sessions",
      label: "Per session",
      lead: "Intake against the most recent reassessment.",
      rows: [
        { label: "Sessions compared", value: "7" },
        { label: "Symmetry index · intake", value: "72%" },
        { label: "Symmetry index · latest", value: "89%" },
        { label: "Walking speed · intake", value: "0.72 m/s" },
        { label: "Walking speed · latest", value: "1.05 m/s" },
        { label: "Unresolved asymmetry", value: "Present, reducing" },
      ],
      notes: [
        "Comparability depends on every session following the same capture protocol.",
      ],
    },
  ],
};

const sportsmotion: SampleOutput = {
  productId: "sportsmotion",
  action: "View movement-performance analysis",
  kind: "Movement-performance analysis",
  synthetic: true,
  boundary:
    "Movement-quality measurement for coaching review. Not an injury prediction.",
  tabs: [
    {
      id: "mechanics",
      label: "Running mechanics",
      lead: "The characteristics measured from a running capture.",
      metrics: [
        { label: "Cadence", value: "168", unit: "steps/min", hint: "Steps per minute at the captured pace." },
        { label: "Contact time", value: "212", unit: "ms", hint: "How long each foot stays loaded." },
        { label: "Limb imbalance", value: "4", unit: "%", hint: "Difference between limbs on the measured characteristics." },
        { label: "Vertical oscillation", value: "8.4", unit: "cm", hint: "Vertical travel of the body centre per stride." },
      ],
    },
    {
      id: "fatigue",
      label: "Within-session change",
      lead: "How mechanics shifted across the session.",
      series: [
        {
          label: "Contact time",
          points: [206, 208, 209, 211, 212, 215, 218, 221],
          hint: "Sampled through the session — a rise indicates mechanics changing under load.",
        },
        {
          label: "Limb imbalance",
          points: [3, 3, 4, 4, 4, 5, 5, 6],
          hint: "Side difference across the same samples.",
        },
      ],
      notes: [
        "Within-session change describes this session under this load. It is not a readiness score.",
      ],
    },
  ],
};

// ----------------------------------------------------------------------------
// SECUREVISION — identity-free by default
// ----------------------------------------------------------------------------

const crowdsense: SampleOutput = {
  productId: "crowdsense",
  action: "View sample crowd-flow dashboard",
  kind: "Crowd-flow dashboard",
  synthetic: true,
  boundary:
    "Aggregate movement analytics. No individual is identified, and figures are illustrative.",
  tabs: [
    {
      id: "density",
      label: "Density & flow",
      lead: "Aggregate occupancy and direction across configured zones.",
      metrics: [
        { label: "Zone occupancy · concourse", value: "68", unit: "%", hint: "Share of the zone's configured capacity currently occupied." },
        { label: "Dominant flow", value: "North-east", hint: "The direction most movement is travelling in this zone." },
        { label: "Queue length · gate B", value: "24", unit: "people", hint: "Aggregate count in the configured queue area." },
        { label: "Bottleneck indicator", value: "Watch", hint: "Whether flow through a zone has slowed against its configured norm." },
      ],
      notes: [
        "All figures are aggregate. The pipeline is designed to operate on movement features rather than identity.",
      ],
    },
    {
      id: "zones",
      label: "Zone occupancy",
      lead: "Each configured zone against its own norm.",
      rows: [
        { label: "Concourse", value: "68% · rising" },
        { label: "Gate B queue", value: "24 people · rising" },
        { label: "Gate C queue", value: "9 people · steady" },
        { label: "Escalator north", value: "41% · steady" },
        { label: "Retail spine", value: "22% · falling" },
      ],
    },
    {
      id: "trend",
      label: "Occupancy trend",
      lead: "How the concourse filled across the observed window.",
      series: [
        {
          label: "Concourse occupancy",
          points: [22, 28, 34, 41, 49, 55, 61, 68],
          hint: "Aggregate occupancy sampled across the window.",
        },
      ],
    },
  ],
};

const suspiciousmotion: SampleOutput = {
  productId: "suspiciousmotion",
  action: "View candidate-event packet",
  kind: "Candidate-event packet",
  synthetic: true,
  boundary:
    "A candidate movement event for trained operator review. Not a determination that anything occurred.",
  tabs: [
    {
      id: "event",
      label: "Candidate event",
      lead: "What was surfaced, and on what movement characteristics.",
      rows: [
        { label: "Event class candidate", value: "Extended dwell" },
        { label: "Zone", value: "Loading corridor · restricted" },
        { label: "Observed dwell duration", value: "6 min 40 s" },
        { label: "Zone transitions", value: "4" },
        { label: "Direction changes", value: "3" },
        { label: "Operator disposition", value: "Awaiting review" },
      ],
      notes: [
        "The packet reports observed movement characteristics. Intent is not inferred, and no identity is attached.",
      ],
    },
    {
      id: "timeline",
      label: "Event timeline",
      lead: "The sequence that produced the candidate.",
      phases: [
        { label: "Entry", share: 12, hint: "First appearance in the configured zone." },
        { label: "Dwell", share: 54, hint: "Sustained presence beyond the configured threshold." },
        { label: "Transitions", share: 22, hint: "Repeated movement between adjacent zones." },
        { label: "Exit", share: 12, hint: "Departure from the zone." },
      ],
    },
  ],
};

const industrialsafety: SampleOutput = {
  productId: "industrialsafety",
  action: "View candidate-event packet",
  kind: "Candidate-event packet",
  synthetic: true,
  boundary:
    "A candidate movement-safety event for EHS operator review. Not an incident record.",
  tabs: [
    {
      id: "event",
      label: "Candidate event",
      lead: "The event class the movement pattern matched, and where.",
      rows: [
        { label: "Event class candidate", value: "Fall-consistent movement" },
        { label: "Zone", value: "Line 3 · walkway" },
        { label: "Movement evidence", value: "Rapid vertical descent, then static" },
        { label: "Static duration after event", value: "18 s" },
        { label: "Escalation", value: "Meets configured criteria" },
        { label: "Operator disposition", value: "Awaiting review" },
      ],
      notes: [
        "The module flags movement patterns associated with falls and slips. Confirmation is the operator's.",
      ],
    },
    {
      id: "timeline",
      label: "Timeline",
      lead: "The movement sequence, in order.",
      phases: [
        { label: "Walking", share: 44, hint: "Normal gait through the configured walkway." },
        { label: "Descent", share: 8, hint: "Rapid change in vertical position." },
        { label: "Static", share: 34, hint: "No movement detected after the descent." },
        { label: "Movement resumes", share: 14, hint: "Motion detected again in the zone." },
      ],
    },
  ],
};

const forensicsearch: SampleOutput = {
  productId: "forensicsearch",
  action: "View investigation timeline",
  kind: "Investigation timeline",
  synthetic: true,
  boundary:
    "Candidate correspondences across cameras for authorized post-event review — never proof of identity.",
  tabs: [
    {
      id: "timeline",
      label: "Timeline",
      lead: "Candidate appearances assembled from uploaded footage.",
      rows: [
        { label: "Camera 04 · north entrance", value: "T+00:00 · candidate" },
        { label: "Camera 11 · concourse", value: "T+01:24 · candidate" },
        { label: "Camera 11 · concourse", value: "T+03:08 · candidate" },
        { label: "Camera 17 · east corridor", value: "T+06:52 · candidate" },
        { label: "Camera 04 · north entrance", value: "T+11:30 · candidate" },
      ],
      notes: [
        "Every row is a candidate correspondence for trained review under lawful authority, not a confirmed match.",
        "Coverage and camera placement bound what a timeline can assemble.",
      ],
    },
    {
      id: "basis",
      label: "Search basis",
      lead: "What the search was run on.",
      rows: [
        { label: "Search input", value: "Uploaded footage segment" },
        { label: "Matching basis", value: "Movement and body-level characteristics" },
        { label: "Cameras searched", value: "23" },
        { label: "Candidates returned", value: "5" },
        { label: "Adjudication", value: "Mandatory, human" },
      ],
    },
  ],
};

// ----------------------------------------------------------------------------
// LOOKUP
// ----------------------------------------------------------------------------

export const sampleOutputs: SampleOutput[] = [
  walkscan,
  fallrisk,
  rehabtrack,
  sportsmotion,
  crowdsense,
  suspiciousmotion,
  industrialsafety,
  forensicsearch,
];

const byProduct = new Map(sampleOutputs.map((s) => [s.productId, s]));

export const sampleOutputFor = (productId: string): SampleOutput | undefined =>
  byProduct.get(productId);

export const hasSampleOutput = (productId: string): boolean =>
  byProduct.has(productId);

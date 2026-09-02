import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Bandage,
  Baby,
  Brain,
  Building2,
  ClipboardCheck,
  Construction,
  Dumbbell,
  Eye,
  FileText,
  Fingerprint,
  Flag,
  Footprints,
  GraduationCap,
  Heart,
  HeartPulse,
  Home,
  Hospital,
  KeyRound,
  Lock,
  Microscope,
  Plane,
  RadioTower,
  Route,
  Search,
  ShieldCheck,
  ShieldPlus,
  ShoppingBag,
  Siren,
  Stethoscope,
  Trophy,
  University,
  UsersRound,
  Waves,
  Watch,
  Workflow,
  Wrench,
} from "lucide-react";

// ============================================================================
// PRODUCT TYPES — full GaitAI product ecosystem
// ============================================================================

export type Vertical = "mobilitycare" | "securevision";

/**
 * Commercial / technical maturity of a product module.
 *
 * DELIBERATELY UNSET on every record. The repository contains no deployment
 * record, pilot log, validation study or release note that would establish
 * maturity for any of the 23 modules, and maturity must never be inferred
 * from how much detail a product page happens to carry. The field exists so
 * that when real evidence lands it has one canonical home — and so that no
 * page has to imply maturity in prose.
 *
 * Set a value only when a documented source supports it.
 */
export type ProductStatus =
  | "production"
  | "pilot-ready"
  | "research-validated"
  | "prototype"
  | "in-development";

export interface GaitProduct {
  id: string;
  name: string; // e.g. "GaitAI WalkScan"
  short: string; // e.g. "WalkScan"
  label: string; // professional one-line label
  headline: string; // marketing-friendly hero line
  description: string; // 1–2 sentence what-it-does
  users: string[]; // primary user types
  outputs: string[]; // metric / artifact names
  icon: LucideIcon;
  vertical: Vertical;
  featured: boolean; // surface on the homepage strip
  flagship: boolean; // earns a dedicated visual block
  accent: "teal" | "blue" | "violet" | "cyan" | "gold" | "emerald";
  /** Maturity — see ProductStatus. Unset until evidence exists. */
  status?: ProductStatus;
}

// ----------------------------------------------------------------------------
// MOBILITYCARE — clinical, sports, wearable & rehab movement intelligence
// ----------------------------------------------------------------------------

export const mobilityProducts: GaitProduct[] = [
  {
    id: "walkscan",
    name: "GaitAI WalkScan",
    short: "WalkScan",
    label: "Camera-based gait assessment report",
    headline: "Turn a walking video into a clinician-ready movement report.",
    description:
      "Analyzes a short walking video and turns it into gait and mobility metrics — ready as a downloadable PDF.",
    users: [
      "Physiotherapy clinics",
      "Rehab centers",
      "Orthopedic clinics",
      "Neurology clinics",
      "Sports clinics",
    ],
    outputs: [
      "Walking speed",
      "Cadence",
      "Step / stride pattern",
      "Asymmetry",
      "Posture markers",
      "Mobility score",
      "Downloadable PDF report",
    ],
    icon: Footprints,
    vertical: "mobilitycare",
    featured: true,
    flagship: true,
    accent: "teal",
  },
  {
    id: "fallrisk",
    name: "GaitAI FallRisk",
    short: "FallRisk",
    label: "Fall-risk screening & mobility intelligence",
    headline: "Surface mobility decline and fall-risk indicators early.",
    description:
      "Uses gait, balance, variability, posture and longitudinal movement trends to sort elderly and at-risk patients into low / medium / high screening categories for clinician review.",
    users: [
      "Elderly-care centers",
      "Hospitals",
      "Home-care agencies",
      "Community health programs",
      "Family caregivers",
    ],
    outputs: [
      "Low / medium / high risk",
      "Risk contributors",
      "Monthly trend",
      "Caregiver recommendations",
      "Clinician summary",
    ],
    icon: AlertTriangle,
    vertical: "mobilitycare",
    featured: true,
    flagship: true,
    accent: "gold",
  },
  {
    id: "rehabtrack",
    name: "GaitAI RehabTrack",
    short: "RehabTrack",
    label: "Rehabilitation progress monitoring",
    headline: "Show objective recovery progress — before, during, after.",
    description:
      "Compares movement across therapy sessions to make rehabilitation progress visible and motivating for both clinician and patient.",
    users: [
      "Physiotherapists",
      "Rehab hospitals",
      "Orthopedic doctors",
      "Sports injury centers",
    ],
    outputs: [
      "Progress percentage",
      "Pre / post comparison",
      "Asymmetry reduction",
      "Range-of-motion trends",
      "Therapy dashboard",
    ],
    icon: Activity,
    vertical: "mobilitycare",
    featured: true,
    flagship: false,
    accent: "teal",
  },
  {
    id: "sportsmotion",
    name: "GaitAI SportsMotion",
    short: "SportsMotion",
    label: "Sports gait, running & injury-risk analytics",
    headline: "Athlete movement, asymmetry and fatigue — measured.",
    description:
      "Analyzes walking and running mechanics to surface asymmetry, imbalance and fatigue-related change, supporting return-to-play review with longitudinal movement evidence.",
    users: [
      "Sports academies",
      "Runners",
      "Cricket / football / tennis academies",
      "Fitness centers",
      "Sports medicine clinics",
    ],
    outputs: [
      "Running symmetry",
      "Limb imbalance",
      "Knee / hip movement markers",
      "Fatigue trend",
      "Injury-risk indicators",
      "Return-to-play review summary",
      "Performance report",
    ],
    icon: Trophy,
    vertical: "mobilitycare",
    featured: true,
    flagship: true,
    accent: "cyan",
  },
  {
    id: "watchcare",
    name: "GaitAI WatchCare",
    short: "WatchCare",
    label: "Smartwatch & wearable-based mobility monitoring",
    headline: "Continuous movement intelligence from the wrist.",
    description:
      "Combines smartwatch, mobile and wearable sensor data to estimate daily mobility and activity patterns, gait variability and longitudinal fall-risk indicators for clinician, caregiver or remote-care review.",
    users: [
      "Elderly users",
      "Caregivers",
      "Remote-care teams",
      "Physiotherapy patients",
      "Insurance wellness",
      "Corporate wellness",
    ],
    outputs: [
      "Daily mobility score",
      "Step / cadence trend",
      "Activity decline alert",
      "Fall-risk trend",
      "Caregiver notification",
      "Remote monitoring dashboard",
    ],
    icon: Watch,
    vertical: "mobilitycare",
    featured: true,
    flagship: true,
    accent: "gold",
  },
  {
    id: "neuromotion",
    name: "GaitAI NeuroMotion",
    short: "NeuroMotion",
    label: "Neurological gait monitoring",
    headline: "Monitor Parkinsonian, stroke, ataxia & MS gait patterns.",
    description:
      "Supports ongoing monitoring of gait patterns linked to neurological movement difficulties, including freezing, shuffling and turning instability.",
    users: ["Neurologists", "Neurorehab centers", "Hospitals", "Research labs"],
    outputs: [
      "Shuffling indicator",
      "Freezing-like event marker",
      "Asymmetry",
      "Turning difficulty",
      "Balance instability",
      "Progression trend",
    ],
    icon: Brain,
    vertical: "mobilitycare",
    featured: false,
    flagship: false,
    accent: "violet",
  },
  {
    id: "orthomotion",
    name: "GaitAI OrthoMotion",
    short: "OrthoMotion",
    label: "Orthopedic & musculoskeletal gait analysis",
    headline: "Joint, limb, posture & post-surgical mobility — measured.",
    description:
      "Evaluates gait changes related to joint, bone, muscle, foot, spine and post-surgical conditions.",
    users: [
      "Orthopedic surgeons",
      "Physiotherapists",
      "Sports medicine doctors",
      "Rehab centers",
    ],
    outputs: [
      "Limp score",
      "Limb-loading proxy",
      "Posture angle",
      "Joint movement proxy",
      "Recovery report",
    ],
    icon: Bandage,
    vertical: "mobilitycare",
    featured: false,
    flagship: false,
    accent: "teal",
  },
  {
    id: "seniorcare",
    name: "GaitAI SeniorCare",
    short: "SeniorCare",
    label: "Elderly mobility & frailty monitoring",
    headline: "Monthly mobility, frailty trends, caregiver summaries.",
    description:
      "Runs periodic mobility assessments for senior citizens and surfaces longitudinal mobility changes and decline indicators for caregiver or clinician review.",
    users: [
      "Assisted-living homes",
      "Senior-care chains",
      "Families",
      "Geriatric clinics",
    ],
    outputs: [
      "Monthly mobility score",
      "Decline alert",
      "Balance score",
      "Gait speed trend",
      "Caregiver summary",
    ],
    icon: Heart,
    vertical: "mobilitycare",
    featured: false,
    flagship: false,
    accent: "gold",
  },
  {
    id: "pediatricmotion",
    name: "GaitAI PediatricMotion",
    short: "PediatricMotion",
    label: "Pediatric gait & developmental movement support",
    headline: "Movement screening for developing children.",
    description:
      "Assists with child gait observation and longitudinal monitoring for developmental or orthopedic concerns including CP and toe-walking.",
    users: [
      "Pediatric physiotherapists",
      "Pediatric orthopedic clinics",
      "Schools",
      "Rehab centers",
    ],
    outputs: [
      "Toe-walking indicator",
      "Asymmetry",
      "Walking pattern summary",
      "Longitudinal development trend",
    ],
    icon: Baby,
    vertical: "mobilitycare",
    featured: false,
    flagship: false,
    accent: "cyan",
  },
  {
    id: "prostheticfit",
    name: "GaitAI ProstheticFit",
    short: "ProstheticFit",
    label: "Prosthetic & orthotic fitting intelligence",
    headline: "How well does the device walk?",
    description:
      "Quantifies movement changes associated with prosthetic or orthotic use — symmetry, cadence, gait timing, posture and loading proxies, compared before and after a fitting change.",
    users: [
      "Prosthetic / orthotic clinics",
      "Rehab hospitals",
      "Assistive-device companies",
    ],
    outputs: [
      "Device-fit comparison",
      "Before / after walking report",
      "Loading asymmetry proxy",
      "Mobility improvement score",
    ],
    icon: Wrench,
    vertical: "mobilitycare",
    featured: false,
    flagship: false,
    accent: "teal",
  },
  {
    id: "remotecare",
    name: "GaitAI RemoteCare",
    short: "RemoteCare",
    label: "Home-based remote gait monitoring",
    headline: "Walk at home. Turn movement into a clinician-ready report.",
    description:
      "Patients upload guided walking videos from home; clinicians receive AI-generated progress reports and review them on a unified dashboard.",
    users: [
      "Telehealth providers",
      "Physiotherapy clinics",
      "Hospitals",
      "Home-care teams",
    ],
    outputs: [
      "Remote gait report",
      "Clinician dashboard",
      "Patient progress timeline",
      "Automated reminders",
    ],
    icon: Home,
    vertical: "mobilitycare",
    featured: false,
    flagship: false,
    accent: "emerald",
  },
  {
    id: "clinicaltrials",
    name: "GaitAI ClinicalTrials",
    short: "ClinicalTrials",
    label: "Digital gait measures for research",
    headline: "Standardized movement outputs for research workflows.",
    description:
      "Provides measurable gait and movement outputs for research studies, trials and device-evaluation workflows.",
    users: ["Pharma", "CROs", "Universities", "Hospitals", "Medical-device companies"],
    outputs: [
      "Study dashboard",
      "Gait measure export",
      "Cohort trends",
      "Protocol-based reports",
    ],
    icon: ClipboardCheck,
    vertical: "mobilitycare",
    featured: false,
    flagship: false,
    accent: "violet",
  },
];

// ----------------------------------------------------------------------------
// SECUREVISION — privacy-aware movement intelligence for safer spaces
// ----------------------------------------------------------------------------

export const secureProducts: GaitProduct[] = [
  {
    id: "suspiciousmotion",
    name: "GaitAI SuspiciousMotion",
    short: "SuspiciousMotion",
    label: "Suspicious movement & anomaly detection",
    headline: "Anomalies surfaced — without identifying anyone first.",
    description:
      "Surfaces candidate movement events — loitering, running, restricted-zone entry, tailgating-like patterns and perimeter events — for operator review, without requiring identity recognition.",
    users: [
      "Campuses",
      "Offices",
      "Malls",
      "Hospitals",
      "Transport hubs",
      "Factories",
      "Security teams",
    ],
    outputs: [
      "Loitering alert",
      "Running alert",
      "Restricted-zone alert",
      "Tailgating indicator",
      "Event timeline",
    ],
    icon: Siren,
    vertical: "securevision",
    featured: true,
    flagship: true,
    accent: "blue",
  },
  {
    id: "crowdsense",
    name: "GaitAI CrowdSense",
    short: "CrowdSense",
    label: "Crowd flow, density, queue & public-space analytics",
    headline: "See crowd flow, bottlenecks and density-risk indicators.",
    description:
      "Analyzes crowd movement, density, queues, bottlenecks, flow direction and abnormal crowd-motion indicators for smart-city scale public spaces.",
    users: [
      "Smart cities",
      "Stadiums",
      "Malls",
      "Religious events",
      "Airports",
      "Metro stations",
      "Universities",
    ],
    outputs: [
      "Crowd heatmap",
      "Density score",
      "Queue length",
      "Bottleneck alert",
      "Evacuation movement summary",
    ],
    icon: UsersRound,
    vertical: "securevision",
    featured: true,
    flagship: true,
    accent: "blue",
  },
  {
    id: "industrialsafety",
    name: "GaitAI IndustrialSafety",
    short: "IndustrialSafety",
    label: "Worker movement & fall/slip safety analytics",
    headline: "Worker movement safety — measured, monitored, flagged.",
    description:
      "Flags movement patterns associated with falls, slips, restricted-zone entry, fatigue-like movement and emergency movement events across industrial sites.",
    users: [
      "Factories",
      "Warehouses",
      "Construction",
      "Mining",
      "Power plants",
      "Oil & gas",
      "Telecom field ops",
    ],
    outputs: [
      "Fall / slip alert",
      "Restricted-zone alert",
      "Worker safety dashboard",
      "Emergency status",
    ],
    icon: Construction,
    vertical: "securevision",
    featured: true,
    flagship: true,
    accent: "blue",
  },
  {
    id: "privacyguard",
    name: "GaitAI PrivacyGuard",
    short: "PrivacyGuard",
    label: "Privacy-preserving movement analytics",
    headline: "Movement intelligence — without invasive surveillance.",
    description:
      "The architectural privacy layer for GaitAI: designed to support skeleton-only analytics, face blur, role-based access, configurable retention and audit logs in privacy-sensitive environments.",
    users: ["All security customers", "Enterprises", "Public-sector deployments"],
    outputs: [
      "Privacy mode",
      "Audit logs",
      "Retention controls",
      "Privacy-aware aggregated heatmaps",
    ],
    icon: Lock,
    vertical: "securevision",
    featured: true,
    flagship: true,
    accent: "emerald",
  },
  {
    id: "campusshield",
    name: "GaitAI CampusShield",
    short: "CampusShield",
    label: "Campus & workplace movement safety",
    headline: "Quiet, intelligent safety for the spaces people work and learn.",
    description:
      "Surfaces movement-safety events across office parks, universities, hospitals and corporate campuses for operator review.",
    users: [
      "Universities",
      "IT parks",
      "Hospitals",
      "Industrial campuses",
      "Corporate offices",
    ],
    outputs: [
      "Visitor movement timeline",
      "Night movement alert",
      "Fall detection",
      "Restricted-area alert",
    ],
    icon: University,
    vertical: "securevision",
    featured: true,
    flagship: false,
    accent: "blue",
  },
  {
    id: "forensicsearch",
    name: "GaitAI ForensicSearch",
    short: "ForensicSearch",
    label: "Post-event video investigation",
    headline: "Search recorded CCTV by movement, timeline and event path.",
    description:
      "Searches uploaded CCTV footage for a person, movement pattern, timeline, or event path after an incident.",
    users: [
      "Security agencies",
      "Enterprise security teams",
      "Campuses",
      "Malls",
      "Transport hubs",
    ],
    outputs: [
      "Search results",
      "Incident timeline",
      "Camera-wise movement trail",
      "Evidence review pack",
    ],
    icon: Search,
    vertical: "securevision",
    featured: true,
    flagship: false,
    accent: "violet",
  },
  {
    id: "reid",
    name: "GaitAI ReID",
    short: "ReID",
    label: "Person re-identification across cameras",
    headline: "Cross-camera movement correspondence, by gait.",
    description:
      "Produces confidence-based candidate matches across multiple camera feeds using movement and body-level signatures rather than face-only matching. Candidates are for trained review — never proof of identity.",
    users: [
      "Airports",
      "Railway stations",
      "Campuses",
      "Large enterprises",
      "Investigation teams",
    ],
    outputs: [
      "Cross-camera trail",
      "Confidence score",
      "Timeline",
      "Path reconstruction",
    ],
    icon: Route,
    vertical: "securevision",
    featured: false,
    flagship: false,
    accent: "blue",
  },
  {
    id: "accessmotion",
    name: "GaitAI AccessMotion",
    short: "AccessMotion",
    label: "Gait-enhanced access control",
    headline: "A passive second factor — your walk.",
    description:
      "Contributes a passive gait-consistency signal alongside card, face or mobile authentication in high-security spaces. It supports an existing credential rather than replacing it.",
    users: [
      "Data centers",
      "R&D labs",
      "Defense campuses",
      "High-security offices",
    ],
    outputs: [
      "Access confidence",
      "Identity consistency signal",
      "Tailgating alert",
      "Access audit log",
    ],
    icon: KeyRound,
    vertical: "securevision",
    featured: false,
    flagship: false,
    accent: "blue",
  },
  {
    id: "eventshield",
    name: "GaitAI EventShield",
    short: "EventShield",
    label: "Large-event movement & crowd-risk intelligence",
    headline: "Stadium, concert, conference — crowd-movement indicators.",
    description:
      "Provides crowd-movement indicators for high-density public events: stadiums, conferences, religious gatherings, concerts, rallies, exhibitions.",
    users: [
      "Event organizers",
      "Stadiums",
      "Police",
      "Civic bodies",
      "Conference centers",
    ],
    outputs: [
      "Entry / exit flow",
      "Density risk",
      "Sudden-dispersal movement alert",
      "Queue overload",
      "Evacuation support",
    ],
    icon: Flag,
    vertical: "securevision",
    featured: false,
    flagship: false,
    accent: "blue",
  },
  {
    id: "retailguard",
    name: "GaitAI RetailGuard",
    short: "RetailGuard",
    label: "Retail movement & loss-prevention support",
    headline: "Movement intelligence for the modern retail floor.",
    description:
      "Surfaces unusual movement, loitering, queue congestion, staff-safety and emergency-flow indicators inside retail environments for operator review.",
    users: ["Retail chains", "Malls", "Big-box stores"],
    outputs: [
      "Loitering alert",
      "Queue analytics",
      "Emergency flow",
      "Staff safety",
      "Crowd heatmaps",
    ],
    icon: ShoppingBag,
    vertical: "securevision",
    featured: false,
    flagship: false,
    accent: "violet",
  },
  {
    id: "watchlist",
    name: "GaitAI Watchlist",
    short: "Watchlist",
    label: "Policy-governed watchlist matching for authorized deployments",
    headline: "Policy-governed matching, authorized environments only.",
    description:
      "Policy-governed candidate matching against an authorized list, with confidence scoring, access controls and audit history. Restricted to environments with lawful authority — not offered for general-public surveillance.",
    users: [
      "Authorized law enforcement",
      "Defense agencies",
      "Critical infrastructure (where lawful)",
    ],
    outputs: [
      "Watchlist match candidates",
      "Confidence score",
      "Policy + consent logs",
      "Audit trail",
    ],
    icon: Fingerprint,
    vertical: "securevision",
    featured: false,
    flagship: false,
    accent: "blue",
  },
];

// ----------------------------------------------------------------------------
// LOOKUPS
// ----------------------------------------------------------------------------

export const allProducts: GaitProduct[] = [
  ...mobilityProducts,
  ...secureProducts,
];

export const featuredProducts = allProducts.filter((p) => p.featured);
export const flagshipProducts = allProducts.filter((p) => p.flagship);

export const productById = (id: string) =>
  allProducts.find((p) => p.id === id);

// ----------------------------------------------------------------------------
// THE PRODUCT PROPOSITION
// ----------------------------------------------------------------------------
// One place to phrase "how many products, and what kind". The count is always
// derived from the arrays above, and the wording describes the architecture —
// modular products on one Movement Intelligence Platform — without implying that all
// of them are equally mature, shipped or deployed. See ProductStatus.
// ----------------------------------------------------------------------------

export const productCount = allProducts.length;

/** e.g. "23 modular movement-intelligence products" */
export const productProposition =
  `${productCount} modular movement-intelligence products`;

/** e.g. "23 modular products across two verticals" */
export const productPropositionShort =
  `${productCount} modular products across two verticals`;

// ============================================================================
// INDUSTRY USE CASES (cross-vertical map)
// ============================================================================

export interface UseCaseEntry {
  id: string;
  industry: string;
  icon: LucideIcon;
  vertical: Vertical;
  problem: string;
  productIds: string[];
  /**
   * What the product mix PRODUCES in this environment — reports, alerts,
   * measures. Rendered under an "Outputs" label, never "Outcome": nothing in
   * this repository documents a measured real-world outcome for any
   * environment, so the copy must not imply one.
   */
  outcome: string;
  accent: "teal" | "blue" | "gold" | "cyan" | "violet" | "emerald";
}

export const industryUseCases: UseCaseEntry[] = [
  {
    id: "physio",
    industry: "Physiotherapy clinics",
    icon: Activity,
    vertical: "mobilitycare",
    problem:
      "Therapists need objective evidence that therapy is working — beyond subjective observation.",
    productIds: ["walkscan", "rehabtrack", "sportsmotion"],
    outcome:
      "Objective gait reports, rehab progress and clearer longitudinal progress communication.",
    accent: "teal",
  },
  {
    id: "hospitals",
    industry: "Hospitals",
    icon: Hospital,
    vertical: "mobilitycare",
    problem:
      "Ward fall-risk and post-surgery recovery often rely on manual assessment that doesn't scale.",
    productIds: ["fallrisk", "neuromotion", "orthomotion"],
    outcome:
      "Mobility assessment, ward fall-risk, post-surgery recovery, discharge planning.",
    accent: "teal",
  },
  {
    id: "sports",
    industry: "Sports academies",
    icon: Trophy,
    vertical: "mobilitycare",
    problem:
      "Injury-risk screening and return-to-play review are inconsistent without measurable movement data.",
    productIds: ["sportsmotion", "watchcare", "rehabtrack"],
    outcome:
      "Performance movement analytics, injury-risk indicators and return-to-play review evidence.",
    accent: "cyan",
  },
  {
    id: "elderly",
    industry: "Elderly-care centers",
    icon: Heart,
    vertical: "mobilitycare",
    problem:
      "Monthly screenings can miss gradual mobility changes associated with elevated fall risk.",
    productIds: ["fallrisk", "seniorcare", "watchcare"],
    outcome:
      "Monthly screening, fall-risk trend, caregiver alerts, mobility decline reports.",
    accent: "gold",
  },
  {
    id: "neuro",
    industry: "Neurology clinics",
    icon: Brain,
    vertical: "mobilitycare",
    problem:
      "Subtle changes in Parkinsonian, post-stroke and ataxic gait are hard to quantify in-clinic.",
    productIds: ["neuromotion", "walkscan", "watchcare"],
    outcome:
      "Stroke rehab, Parkinsonian gait, neuropathy and ataxia movement monitoring.",
    accent: "violet",
  },
  {
    id: "homecare",
    industry: "Home care & telehealth",
    icon: Home,
    vertical: "mobilitycare",
    problem:
      "Between visits, remote patients are hard to follow — and mobility decline can go unnoticed.",
    productIds: ["remotecare", "watchcare", "fallrisk"],
    outcome:
      "Remote monitoring, daily mobility trend, family + caregiver dashboard.",
    accent: "emerald",
  },
  {
    id: "airports",
    industry: "Airports, metro & rail",
    icon: Plane,
    vertical: "securevision",
    problem:
      "Crowded transport hubs need anomaly + flow intelligence — without invasive identification.",
    productIds: ["crowdsense", "reid", "suspiciousmotion"],
    outcome:
      "Passenger-flow indicators, authorized post-event cross-camera investigation support and candidate movement-event alerts.",
    accent: "blue",
  },
  {
    id: "smartcities",
    industry: "Smart cities",
    icon: Building2,
    vertical: "securevision",
    problem:
      "Public spaces need crowd intelligence designed for real-time operational workflows, with privacy respected by default.",
    productIds: ["crowdsense", "forensicsearch", "privacyguard"],
    outcome:
      "Public-space movement, crowd-risk alerts, privacy-aware (aggregated) analytics.",
    accent: "blue",
  },
  {
    id: "campuses",
    industry: "Corporate & university campuses",
    icon: University,
    vertical: "securevision",
    problem:
      "Campuses need quiet, privacy-aware safety monitoring across many sites.",
    productIds: ["campusshield", "accessmotion", "suspiciousmotion"],
    outcome:
      "Workplace safety, after-hours alerts, tailgating, access consistency.",
    accent: "blue",
  },
  {
    id: "factories",
    industry: "Factories & warehouses",
    icon: Workflow,
    vertical: "securevision",
    problem:
      "Worker falls and unsafe-zone entries can be difficult to spot in time.",
    productIds: ["industrialsafety", "suspiciousmotion"],
    outcome:
      "Worker fall / slip indicators, restricted-zone entry, evacuation movement summaries and fatigue-like movement trend.",
    accent: "blue",
  },
  {
    id: "retail",
    industry: "Malls & retail",
    icon: ShoppingBag,
    vertical: "securevision",
    problem:
      "Loss-prevention, queue management and staff safety on one floor — without invasive cameras.",
    productIds: ["retailguard", "crowdsense", "suspiciousmotion"],
    outcome:
      "Loitering alerts, queue analytics, emergency flow, staff safety, crowd heatmaps.",
    accent: "violet",
  },
  {
    id: "events",
    industry: "Large events & stadiums",
    icon: Flag,
    vertical: "securevision",
    problem:
      "High-density events need crowd-movement awareness during the event, not after the news cycle.",
    productIds: ["eventshield", "crowdsense"],
    outcome:
      "Crowd-density indicators, bottleneck alerts, entry/exit flow, sudden-dispersal movement alerts and evacuation-flow summaries.",
    accent: "blue",
  },
  {
    id: "fitness",
    industry: "Fitness centers & wellness",
    icon: Dumbbell,
    vertical: "mobilitycare",
    problem:
      "Fitness and wellness centers are looking for a screening layer that turns movement quality into a member benefit.",
    productIds: ["sportsmotion", "walkscan"],
    outcome:
      "Movement baseline, posture and gait screening, premium wellness reports.",
    accent: "cyan",
  },
  {
    id: "schools",
    industry: "Schools & academies",
    icon: GraduationCap,
    vertical: "mobilitycare",
    problem:
      "Children's developmental movement and sports injury-risk screening is rarely measured early.",
    productIds: ["pediatricmotion", "sportsmotion"],
    outcome:
      "Child movement screening, sports injury-risk screening support and posture awareness for educators.",
    accent: "teal",
  },
  {
    id: "prosthetics",
    industry: "Prosthetic & orthotic clinics",
    icon: Wrench,
    vertical: "mobilitycare",
    problem:
      "Device-fit quality is often judged by observation, with symmetry and loading data missing from the loop.",
    productIds: ["prostheticfit", "walkscan"],
    outcome:
      "Assistive-device fit comparison, walking symmetry, longitudinal mobility improvement.",
    accent: "teal",
  },
  {
    id: "insurance",
    industry: "Insurance & wellness programs",
    icon: ShieldPlus,
    vertical: "mobilitycare",
    problem:
      "Preventive-health programs need ongoing mobility intelligence — not annual screenings.",
    productIds: ["watchcare", "fallrisk", "seniorcare"],
    outcome:
      "Preventive health, wellness monitoring, remote mobility trend across cohorts.",
    accent: "gold",
  },
  {
    id: "trials",
    industry: "Research & clinical trials",
    icon: Microscope,
    vertical: "mobilitycare",
    problem:
      "Pharma and CROs need objective, exportable movement endpoints across study cohorts.",
    productIds: ["clinicaltrials", "walkscan", "watchcare"],
    outcome:
      "Movement-derived endpoints, study cohorts, exportable metrics and protocol-based reports.",
    accent: "violet",
  },
];

// ============================================================================
// AI PIPELINE (modular intelligence architecture)
// ============================================================================

export const aiPipeline = [
  {
    id: "pose",
    icon: Eye,
    title: "Pose Estimation",
    desc: "Detect body landmarks from walking & running videos. Skeleton signals captured at frame rate.",
  },
  {
    id: "gait",
    icon: Footprints,
    title: "Gait Feature Extraction",
    desc: "Cadence, stride rhythm, speed, step timing, asymmetry, posture, balance, variability.",
  },
  {
    id: "fusion",
    icon: Waves,
    title: "Sensor Fusion",
    desc: "Smartwatch and mobile IMU signals fused with video features for resilient, all-day intelligence.",
  },
  {
    id: "fallrisk-model",
    icon: AlertTriangle,
    title: "Fall-Risk Model",
    desc: "Combines variability, slow speed, instability and posture into fall-risk screening indicators.",
  },
  {
    id: "rehab-model",
    icon: Activity,
    title: "Rehab Progress Model",
    desc: "Quantifies before / after improvement and recovery trends across therapy sessions.",
  },
  {
    id: "sports-model",
    icon: Dumbbell,
    title: "Sports Injury-Risk Model",
    desc: "Surfaces landing imbalance, asymmetry and fatigue-like patterns for athlete review.",
  },
  {
    id: "watchcare-model",
    icon: Watch,
    title: "WatchCare Sensor Model",
    desc: "Daily mobility, activity decline and fall-risk trends from accelerometer + gyroscope.",
  },
  {
    id: "anomaly",
    icon: RadioTower,
    title: "Anomaly Detection",
    desc: "Surfaces unusual movement patterns — loitering, falls, tailgating — without identifying anyone first.",
  },
  {
    id: "report",
    icon: FileText,
    title: "Clinical Report Generator",
    desc: "Turns AI outputs into doctor- and operator-friendly PDF reports with trend charts.",
  },
  {
    id: "privacy",
    icon: Lock,
    title: "Privacy & Consent Layer",
    desc: "Skeleton-only analytics, face blur, role-based access, audit logs, configurable retention.",
  },
];

// ============================================================================
// WATCHCARE FEATURE GRID
// ============================================================================

export const watchcareFeatures = [
  {
    title: "Daily Mobility Score",
    desc: "A trendline of walking rhythm, activity and mobility consistency — every day.",
    icon: Activity,
    audience: "Elderly care · Caregivers · Wellness",
  },
  {
    title: "Activity Decline Alert",
    desc: "Flags unusual reductions in activity or walking confidence over time.",
    icon: AlertTriangle,
    audience: "Caregivers · Clinicians",
  },
  {
    title: "Fall-Risk Trend",
    desc: "Tracks gradual gait changes associated with elevated fall risk.",
    icon: HeartPulse,
    audience: "Senior care · Hospitals",
  },
  {
    title: "Rehab Adherence",
    desc: "Estimates daily mobility and activity patterns during recovery for clinician and caregiver review.",
    icon: ClipboardCheck,
    audience: "Physio clinics · Rehab centers",
  },
  {
    title: "Sports Recovery",
    desc: "Tracks return-to-activity and symmetry trend after a sports injury.",
    icon: Trophy,
    audience: "Sports clinics · Athletes",
  },
  {
    title: "Caregiver Dashboard",
    desc: "A simple mobile + web dashboard for family and care teams.",
    icon: UsersRound,
    audience: "Families · Home-care agencies",
  },
];

// ============================================================================
// HOW IT WORKS (Capture → Understand → Insight → Act)
// ----------------------------------------------------------------------------
// Platform-level language: the same four stages must read correctly for
// MobilityCare (clinical gait from video and wearables) and for SecureVision
// (CCTV, crowds, human activity, safety events). Gait-specific wording lives
// on the product pages where gait genuinely is the subject.
// ============================================================================

export const workflowStages = [
  {
    step: "01",
    title: "Capture Movement",
    desc: "A short walking video, CCTV feed, or smartwatch signal — captured wherever the person is, contactless.",
  },
  {
    step: "02",
    title: "AI Understands Movement",
    desc: "Pose estimation, gait and activity feature extraction and sensor-fusion models translate motion into measurable signals.",
  },
  {
    step: "03",
    title: "Insight, Report or Dashboard",
    desc: "Movement reports, mobility scores, operator dashboards or safety alerts are generated automatically.",
  },
  {
    step: "04",
    title: "Clinician / Operator Acts",
    desc: "The right person — clinician, therapist, caregiver or security operator — receives the right signal, with the movement evidence behind it.",
  },
];

// ============================================================================
// RESEARCH CREDIBILITY
// ============================================================================

// Wording policy: each pillar states what the published record covers or what
// the architecture provides. No pillar claims validation studies, named
// collaborators or clinical approval — none are documented in this repository.
//
// Currently unrendered: this was the "What that record grounds" block on the
// home page, removed because /research covers the same ground in more depth
// (its method commitments, and the per-area evidence map that names the
// peer-reviewed gait-recognition and pose work directly). Kept here so the
// content is not lost if a page wants it again.
export const researchPillars = [
  {
    title: "Peer-reviewed gait recognition",
    desc: "Founder-authored journal work on deep-learning gait recognition and gait biometrics under covariates.",
    icon: Footprints,
  },
  {
    title: "Pose-based movement analysis",
    desc: "Published work on covariate-invariant gait recognition built on pose features, plus a granted edge-analytics patent.",
    icon: Eye,
  },
  {
    title: "Designed for clinical workflows",
    desc: "Outputs are framed as assessment, monitoring and decision support — never diagnosis — so they fit how clinicians already work.",
    icon: Stethoscope,
  },
  {
    title: "Responsible AI by architecture",
    desc: "Privacy-first design: skeleton-only modes, face blur, role-based access, audit logs and configurable retention.",
    icon: ShieldCheck,
  },
];

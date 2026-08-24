import {
  Activity,
  BellRing,
  Camera,
  ChartNoAxesCombined,
  Cpu,
  Eye,
  FileText,
  Fingerprint,
  Footprints,
  Gauge,
  GitBranch,
  HeartPulse,
  ScanLine,
  ShieldAlert,
  Smartphone,
  Users,
  Video,
  Watch,
  Waves,
} from "lucide-react";

export const movementCapabilities = [
  {
    id: "identity",
    label: "Identity",
    icon: Fingerprint,
    description: "Gait recognition as a non-contact biometric signal.",
    evidence: "Gait recognition research and granted patent",
  },
  {
    id: "mobility",
    label: "Mobility",
    icon: Footprints,
    description: "Walking speed, cadence, stride patterns and longitudinal change.",
    evidence: "WalkScan, WatchCare and RemoteCare",
  },
  {
    id: "balance",
    label: "Balance",
    icon: Activity,
    description: "Posture, stability and left/right movement relationships.",
    evidence: "FallRisk, RehabTrack and NeuroMotion",
  },
  {
    id: "risk",
    label: "Risk",
    icon: ShieldAlert,
    description: "Movement signals that can support fall, safety and anomaly review.",
    evidence: "FallRisk, IndustrialSafety and SuspiciousMotion",
  },
  {
    id: "behavior",
    label: "Behavior",
    icon: Eye,
    description: "Temporal movement patterns, events and unusual motion.",
    evidence: "SuspiciousMotion and CampusShield",
  },
  {
    id: "flow",
    label: "Flow",
    icon: Users,
    description: "Crowd direction, density, queues and bottlenecks.",
    evidence: "CrowdSense and EventShield",
  },
  {
    id: "performance",
    label: "Performance",
    icon: Gauge,
    description: "Movement mechanics, symmetry and change through recovery.",
    evidence: "SportsMotion and RehabTrack",
  },
] as const;

export const movementEngineStages = [
  {
    id: "capture",
    step: "01",
    label: "Capture",
    icon: Camera,
    description: "Movement enters the platform through the sources already represented across GaitAI products.",
    items: [
      { label: "Video", icon: Video },
      { label: "CCTV", icon: Camera },
      { label: "Wearables", icon: Watch },
      { label: "Mobile sensors", icon: Smartphone },
    ],
  },
  {
    id: "perceive",
    step: "02",
    label: "Perceive",
    icon: ScanLine,
    description: "Body landmarks and temporal motion signals create a machine-readable representation of movement.",
    items: [
      { label: "Pose", icon: ScanLine },
      { label: "Skeleton", icon: GitBranch },
      { label: "Motion signals", icon: Waves },
    ],
  },
  {
    id: "understand",
    step: "03",
    label: "Understand",
    icon: Cpu,
    description: "Specialized models organize movement into gait, mobility, behavior and crowd-flow information.",
    items: [
      { label: "Gait", icon: Footprints },
      { label: "Mobility", icon: HeartPulse },
      { label: "Behavior", icon: Eye },
      { label: "Crowd flow", icon: Users },
    ],
  },
  {
    id: "interpret",
    step: "04",
    label: "Interpret",
    icon: ChartNoAxesCombined,
    description: "The platform connects measured signals to the decision context of each GaitAI module.",
    items: [
      { label: "Risk", icon: ShieldAlert },
      { label: "Identity", icon: Fingerprint },
      { label: "Performance", icon: Gauge },
      { label: "Anomaly", icon: Activity },
    ],
  },
  {
    id: "act",
    step: "05",
    label: "Act",
    icon: BellRing,
    description: "Inspectable outputs are delivered in formats intended for clinicians, caregivers and operators.",
    items: [
      { label: "Analytics", icon: ChartNoAxesCombined },
      { label: "Reports", icon: FileText },
      { label: "Alerts", icon: BellRing },
      { label: "Decision support", icon: Cpu },
    ],
  },
] as const;

export const flagshipCapabilityIds = {
  mobilitycare: ["walkscan", "fallrisk", "watchcare"],
  securevision: ["crowdsense", "suspiciousmotion", "privacyguard"],
} as const;

export type ProductMaturity =
  | "Available"
  | "Pilot"
  | "Validation"
  | "Research"
  | "Roadmap";

export interface BenchmarkRecord {
  title: string;
  dataset?: string;
  sampleSize?: string;
  subjects?: string;
  evaluationProtocol?: string;
  model?: string;
  modelVersion?: string;
  metric?: string;
  hardware?: string;
  result?: string;
  evaluationDate?: string;
  publicationUrl?: string;
}

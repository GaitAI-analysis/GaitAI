import {
  Activity,
  Building2,
  Brain,
  Camera,
  Cpu,
  Eye,
  Heart,
  HeartPulse,
  Home,
  LineChart,
  Plane,
  ShieldCheck,
  Sparkles,
  Users,
  Waypoints,
} from "lucide-react";

export const secureFeatures = [
  {
    icon: Eye,
    title: "Gait-based identification",
    desc: "Non-contact biometric recognition when face, fingerprint or voice fall short.",
  },
  {
    icon: ShieldCheck,
    title: "Suspicious movement detection",
    desc: "Behavioral signal intelligence that surfaces anomalies in real time.",
  },
  {
    icon: Plane,
    title: "Airports & high-security zones",
    desc: "Continuous identity & risk awareness across terminals, campuses and offices.",
  },
  {
    icon: Users,
    title: "Crowd & pedestrian analytics",
    desc: "Movement flow modeling for smart cities and public infrastructure.",
  },
];

export const careFeatures = [
  {
    icon: HeartPulse,
    title: "Fall-risk prediction",
    desc: "Detect instability and balance decline long before a fall occurs.",
  },
  {
    icon: Brain,
    title: "Neurological screening",
    desc: "Early indicators for Parkinsonian patterns, stroke recovery and more.",
  },
  {
    icon: Activity,
    title: "Rehabilitation tracking",
    desc: "Objective gait analytics for therapists, doctors and recovery programs.",
  },
  {
    icon: Heart,
    title: "Silent guardian at home",
    desc: "Quietly monitor elderly mobility — alert families before emergencies.",
  },
];

export const howItWorks = [
  {
    step: "01",
    icon: Camera,
    title: "Sense",
    desc: "Cameras, depth and inertial sensors capture how a person moves — anywhere, anytime, contactless.",
  },
  {
    step: "02",
    icon: Cpu,
    title: "Understand",
    desc: "Our pose-estimation and gait-biometrics models extract identity, balance, symmetry and risk signatures.",
  },
  {
    step: "03",
    icon: LineChart,
    title: "Predict",
    desc: "Multimodal AI translates movement into actionable insight — risk scores, alerts and longitudinal trends.",
  },
  {
    step: "04",
    icon: Sparkles,
    title: "Protect",
    desc: "Explainable outputs help families, clinicians and operators act before harm happens.",
  },
];

export const useCases = [
  { icon: Home, title: "Homes", desc: "Silent guardian for elderly independence." },
  { icon: HeartPulse, title: "Hospitals", desc: "Objective gait analytics for clinicians." },
  { icon: Plane, title: "Airports", desc: "Non-contact biometric & risk intelligence." },
  { icon: Building2, title: "Smart Cities", desc: "Pedestrian flow and public-space safety." },
  { icon: ShieldCheck, title: "Enterprises", desc: "Movement-based access and awareness." },
  { icon: Waypoints, title: "Research Labs", desc: "Movement analytics for medical research." },
];

export const stats = [
  { value: "10+", label: "Years of gait research" },
  { value: "50+", label: "Founder publications" },
  { value: "1", label: "Granted patent highlighted" },
];

// Flat top-nav tabs — consumed by both desktop & mobile.
// About leads the row; Products closes the brief's all-products-page gap.
export const navLinks = [
  { label: "About", href: "/about" },
  { label: "MobilityCare", href: "/mobilitycare" },
  { label: "SecureVision", href: "/securevision" },
  { label: "Products", href: "/products" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Insights", href: "/insights" },
  { label: "Publications", href: "/publications" },
];

export const navGroups = [
  {
    label: "Platform",
    items: [
      { label: "Technology", href: "/#movement-platform", description: "One shared movement engine" },
      { label: "How it works", href: "/#how", description: "Capture through action" },
      { label: "Movement Engine", href: "/research", description: "Research and architecture" },
      { label: "Capabilities", href: "/products", description: "Complete product portfolio" },
    ],
  },
  {
    label: "Solutions",
    items: [
      { label: "MobilityCare", href: "/mobilitycare", description: "Health and performance" },
      { label: "SecureVision", href: "/securevision", description: "Safety and operations" },
      { label: "Use cases", href: "/use-cases", description: "Intended environments" },
    ],
  },
  {
    label: "Research",
    items: [
      { label: "Publications", href: "/publications", description: "Peer-reviewed work" },
      { label: "Granted patent", href: "/publications#patent", description: "Indian Patent No. 402202" },
      { label: "Research story", href: "/research", description: "Research to product" },
      { label: "Responsible AI", href: "/legal/responsible-ai", description: "Privacy and oversight" },
      { label: "Insights", href: "/insights", description: "Company updates" },
    ],
  },
  {
    label: "Company",
    items: [
      { label: "About", href: "/about", description: "Mission and company" },
      { label: "Founder", href: "/about#founder", description: "Dr. Anubha Parashar" },
      { label: "Investors", href: "/about#investors", description: "Why movement intelligence" },
      { label: "Contact", href: "/#contact", description: "Start a conversation" },
    ],
  },
] as const;

export const heroStats = [
  { value: "10+", label: "Years of gait research" },
  { value: "50+", label: "Founder publications" },
  { value: "1", label: "Granted patent highlighted" },
];

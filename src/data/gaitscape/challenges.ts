import type { GaitscapeChallenge } from "./types";

/**
 * The Challenges layer — GaitScape organized around real problem statements.
 * Every chain references only nodes that exist in graph.ts, and only
 * product / research links that are documented there.
 */
export const gaitscapeChallenges: GaitscapeChallenge[] = [
  {
    id: "ch-decline",
    question: "How can mobility decline be detected earlier?",
    summary:
      "Everyday walking carries early evidence of decline — long before an incident. Longitudinal movement trends make it visible.",
    signalIds: ["sig-mobility-decline", "sig-walking-speed", "sig-stride-variability"],
    capabilityIds: ["cap-temporal", "cap-risk"],
    productIds: ["fallrisk", "seniorcare", "watchcare"],
    researchIds: ["res-gait-biometrics"],
    outcomeId: "out-early-risk",
  },
  {
    id: "ch-rehab",
    question: "How can rehabilitation progress be measured objectively?",
    summary:
      "Recovery decisions deserve more than observation. Session-over-session gait comparison turns therapy into measurable progress.",
    signalIds: ["sig-rehab-progress", "sig-step-symmetry"],
    capabilityIds: ["cap-gait", "cap-explain"],
    productIds: ["rehabtrack", "walkscan", "remotecare"],
    researchIds: ["res-pose-gait"],
    outcomeId: "out-rehab",
  },
  {
    id: "ch-fall",
    question: "How can fall risk be surfaced from movement?",
    summary:
      "Balance, variability and slowing gait quietly raise risk. Combining them produces fall-risk context care teams can act on.",
    signalIds: ["sig-balance", "sig-fall-risk", "sig-stride-variability"],
    capabilityIds: ["cap-risk", "cap-fusion"],
    productIds: ["fallrisk", "watchcare", "industrialsafety"],
    researchIds: ["res-gait-biometrics"],
    outcomeId: "out-fall-awareness",
  },
  {
    id: "ch-identity",
    question: "How can people be recognized without relying solely on faces?",
    summary:
      "Gait is a non-contact biometric that works where face, fingerprint or iris fall short — at distance, in motion, across cameras.",
    signalIds: ["sig-gait-identity"],
    capabilityIds: ["cap-biometrics", "cap-reid"],
    productIds: ["reid", "accessmotion", "watchlist"],
    researchIds: ["res-gait-biometrics", "res-edge"],
    outcomeId: "out-identity",
  },
  {
    id: "ch-privacy",
    question:
      "How can public-space movement be understood while protecting privacy?",
    summary:
      "Skeleton-only analytics, face blur and audit controls let operators understand movement without watching individuals.",
    signalIds: ["sig-crowd-flow", "sig-behaviour"],
    capabilityIds: ["cap-privacy", "cap-anomaly"],
    productIds: ["privacyguard", "crowdsense", "campusshield"],
    researchIds: ["res-privacy"],
    outcomeId: "out-privacy",
  },
  {
    id: "ch-anomaly",
    question: "How can abnormal movement become an actionable safety signal?",
    summary:
      "Loitering, running, falls and restricted-zone entry become operator alerts for review — without identifying anyone first.",
    signalIds: ["sig-behaviour", "sig-trajectory"],
    capabilityIds: ["cap-anomaly", "cap-har", "cap-edge"],
    productIds: ["suspiciousmotion", "eventshield", "retailguard"],
    researchIds: ["res-edge"],
    outcomeId: "out-realtime",
  },
];

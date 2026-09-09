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
      "A conceptual care workflow: comparable walking observations can help a care team review changes in mobility. Earlier detection is an intended use, not an established outcome here.",
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
      "A conceptual rehabilitation workflow: compare movement features across sessions, then review them with the clinician. Capture consistency and clinical context matter.",
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
      "A conceptual care workflow: balance, variability and walking speed can contribute context for fall-risk review. These signals alone do not establish a validated prediction.",
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
      "Gait recognition research explores movement as a biometric. Recognition across cameras or at distance depends on the specific method and validation conditions; it is not a general guarantee.",
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
      "A conceptual spatial workflow: configured representations, face blur, retention and access controls can reduce unnecessary identity exposure. Their implementation must be verified for each deployment.",
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
      "A conceptual spatial workflow: movement events such as running or zone entry can be surfaced for operator review. An event does not establish intention or wrongdoing.",
    signalIds: ["sig-behaviour", "sig-trajectory"],
    capabilityIds: ["cap-anomaly", "cap-har", "cap-edge"],
    productIds: ["suspiciousmotion", "eventshield", "retailguard"],
    researchIds: ["res-edge"],
    outcomeId: "out-realtime",
  },
];

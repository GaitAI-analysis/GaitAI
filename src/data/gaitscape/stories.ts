import { nodeById } from "./graph";

export interface GaitscapeStoryStep {
  nodeId: string;
  explanation: string;
}

export interface GaitscapeStory {
  id: string;
  title: string;
  context: string;
  steps: readonly GaitscapeStoryStep[];
}

/** Editorial walks through existing nodes, never additional evidence edges. */
export const gaitscapeStories: readonly GaitscapeStory[] = [
  {
    id: "rehabilitation",
    title: "From walking video to rehabilitation insight",
    context: "A conceptual care workflow. Product-specific clinical validation is not established by the research connections shown here.",
    steps: [
      { nodeId: "in-video", explanation: "A short walking clip is one documented starting point. Camera position and visibility affect which movement features can be observed." },
      { nodeId: "cap-pose", explanation: "Pose estimation represents visible body landmarks. A landmark is an observation, not a diagnosis." },
      { nodeId: "sig-step-symmetry", explanation: "Left and right movement patterns can be compared when the capture and method support that comparison." },
      { nodeId: "cap-temporal", explanation: "Comparable sessions provide the context for examining change over time. Capture differences must also be considered." },
      { nodeId: "rehabtrack", explanation: "RehabTrack's documented role is to organise movement features and session comparisons for rehabilitation review." },
      { nodeId: "out-rehab", explanation: "The intended outcome is rehabilitation monitoring that informs a clinician's review. Clinical conclusions remain with the care team." },
    ],
  },
  {
    id: "privacy",
    title: "Understand movement with less identity exposure",
    context: "A conceptual spatial workflow. Privacy controls depend on deployment; skeletons and trajectories can still carry personal information.",
    steps: [
      { nodeId: "in-cctv", explanation: "An existing fixed camera can be a capture source for compatible SecureVision modules. Use requires an appropriate purpose and governance." },
      { nodeId: "sig-trajectory", explanation: "Paths describe movement through a space. A trajectory alone does not establish identity, intention or wrongdoing." },
      { nodeId: "cap-privacy", explanation: "Minimising unnecessary identity exposure is a design principle. The published gait-data research does not validate every implementation control." },
      { nodeId: "privacyguard", explanation: "PrivacyGuard describes controls such as configured representations and retention. Their availability and settings must be confirmed for a deployment." },
      { nodeId: "suspiciousmotion", explanation: "Documented movement events can be surfaced for operator review. An unusual pattern is a prompt for context, not a verdict." },
      { nodeId: "out-privacy", explanation: "The intended outcome is monitoring with proportionate data use and human oversight. Privacy is not guaranteed by a visualisation." },
    ],
  },
  {
    id: "research",
    title: "How research informs a GaitAI capability",
    context: "Research provenance, not product validation. Directly informed and architectural connections remain distinct in the evidence index.",
    steps: [
      { nodeId: "res-pose-gait", explanation: "The linked IET Biometrics publication studies pose-based gait recognition. Its published subject sets the scope of this connection." },
      { nodeId: "cap-pose", explanation: "Pose estimation is a capability informed by that research area. GaitAI's implementation is a subsequent platform build." },
      { nodeId: "walkscan", explanation: "WalkScan draws on pose and gait capabilities. This is a documented capability connection, not evidence of clinical accuracy." },
      { nodeId: "sig-step-symmetry", explanation: "Step symmetry is among WalkScan's documented signals. A research connection alone does not establish a validated symmetry measurement." },
      { nodeId: "out-assessment", explanation: "Movement assessment is the intended decision-support context. Inspect the product's evidence and limitations before applying an output." },
    ],
  },
  {
    id: "motion-dna",
    title: "One movement, multiple intelligences",
    context: "Motion DNA is an abstract movement signature. The dimensions shown are applications of movement, not a medical or identity score.",
    steps: [
      { nodeId: "core", explanation: "Human movement provides a shared vocabulary for the platform: structure, signals, interpretation and human decisions." },
      { nodeId: "sig-step-symmetry", explanation: "Symmetry connects to both functional movement assessment and rehabilitation comparison, with different questions and contexts." },
      { nodeId: "mobilitycare", explanation: "MobilityCare brings movement signals into mobility, rehabilitation and care workflows. Evidence must be assessed for each use." },
      { nodeId: "sig-trajectory", explanation: "Trajectories bring spatial context: where movement occurs and how paths change. They do not explain a person's intention." },
      { nodeId: "securevision", explanation: "SecureVision connects movement to spatial and safety applications, with reviewable events and deployment-specific privacy controls." },
      { nodeId: "sig-gait-identity", explanation: "Identity-related movement signatures are a separate research and application area. General movement analysis is not proof of identity." },
    ],
  },
];

export const storyById = new Map(gaitscapeStories.map((story) => [story.id, story]));

/** Canonical titles and routes stay in the graph; the stories only order them. */
export function storyNode(step: GaitscapeStoryStep) {
  return nodeById.get(step.nodeId);
}

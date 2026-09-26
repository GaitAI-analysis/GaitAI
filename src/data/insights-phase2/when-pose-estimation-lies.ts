import type { InsightArticle } from "../insights";

/**
 * AI UNDER STRESS · 01 — When Pose Estimation Lies
 *
 * Thesis: a skeleton can look plausible while the keypoint estimate under it
 * is wrong, and every gait measurement downstream inherits the error without
 * knowing. Educational and research-aware: the failure modes are the ones the
 * gait-recognition literature calls covariates (occlusion, clothing, view,
 * carrying), read here from the measurement side rather than the identity
 * side. Nothing in this record claims a GaitAI production figure; the hero
 * and every state in it are labelled illustrative.
 */
export const whenPoseEstimationLies: InsightArticle = {
  slug: "when-pose-estimation-lies",
  title: "When Pose Estimation Lies",
  titleAccent: "Lies",
  subtitle: "A skeleton can look right while the joints underneath it are wrong",
  deck:
    "Pose estimators return a full skeleton on almost every frame, and most of the time it is a good one. The failures that matter are the ones that still look like a person — an ankle a few pixels off, two legs that trade places, a foot that quietly disappears — because every gait measurement downstream inherits them without being told.",
  postType: "essay",
  category: "AI Under Stress",
  topics: ["movement-intelligence", "engineering", "research"],
  date: "2026-09-09",
  excerpt:
    "Pose estimators almost always return a plausible skeleton. The failures that matter are the ones that still look like a person: a misplaced ankle, crossed legs, a foot that vanishes — and every gait measure downstream inherits them.",
  question: "If the skeleton looks fine, how can the measurement be wrong?",
  ctaLabel: "See how a skeleton fails",
  hooks: [
    "Why a plausible skeleton is the most dangerous kind of wrong",
    "Seven ways a keypoint goes astray, from occlusion to a left/right swap",
    "How a few pixels of error become a wrong symmetry reading",
  ],
  openingHook:
    "Before you scroll: one frame, two views — what the model believes it saw, and what the camera actually captured.",
  twoMinute: [
    "A pose estimator is built to return a skeleton. It will return one for a partly hidden, blurred or cropped body too — and it will usually look plausible.",
    "The failures that matter are not the frames where the skeleton is obviously broken. They are the frames where it looks fine and is wrong by a joint or a side.",
    "Occlusion, overlapping legs, motion blur, loose clothing, cropped joints, poor contrast and temporary left/right swaps each move a keypoint in a characteristic way.",
    "A confidence score describes how sure the model is, not how right it is. Estimators can be confidently wrong, and often are exactly where the image is hardest.",
    "A misplaced ankle is a small image error and a large measurement error: step timing, stride length, joint angles and symmetry all read from that ankle.",
    "A system can defend itself by checking consistency over time, against anatomy and across sensors — and by withholding the measures a bad frame cannot support.",
  ],
  series: "AI Under Stress",
  seriesStep: 1,
  seriesOrder: 1,
  seriesTitle: "When the skeleton looks right but isn't",
  evidenceLevel: "research-informed",
  relatedSignals: ["cap-pose", "sig-step-symmetry", "sig-cadence"],
  memorableInteraction:
    "Flip a plausible skeleton back to its source frame and catch the misplaced ankle, the swapped legs, the foot that was never there.",
  hero: {
    src: "/assets/images/insights/social/when-pose-estimation-lies.png",
    alt: "GaitAI Insights social card: a plausible skeleton beside the original frame that reveals its misplaced ankle",
    width: 1200,
    height: 630,
  },
  cover: {
    concept: "pose-error",
    alt: "A walking skeleton beside the camera frame it was read from, with one estimated joint sitting off the body.",
  },
  tags: ["Pose Estimation", "Robustness", "Occlusion", "Gait Analysis", "AI Under Stress"],
  seo: {
    title: "When Pose Estimation Lies: Why a Plausible Skeleton Can Still Break a Gait Measurement",
    description:
      "Pose estimators return a skeleton for almost every frame, and a wrong one can look right. How occlusion, blur, clothing, cropping and left/right swaps move keypoints — and what that does to gait metrics.",
  },
  intro: [
    {
      type: "lead",
      text: "Show a pose estimator a frame of someone walking and it will hand back a skeleton: a dozen or so joints, connected in the right order, roughly where a body should be. It will do this for a clean frame. It will also do this for a frame where one leg is behind a bin, the swing foot is a smear of motion blur, or the feet were never in the picture at all.",
    },
    {
      type: "p",
      text: "That is the property this essay is about. Pose estimation does not fail by refusing. It fails by answering — with a skeleton that is anatomically plausible, drawn with confidence, and wrong in a place you would have to look twice to notice.",
    },
    {
      type: "p",
      text: "For a research demo the difference between a plausible skeleton and a correct one is cosmetic. For a movement measurement it is everything, because the ankle the estimator placed is the ankle the step timing is read from, the knee it placed is the knee whose angle is computed, and the side it labelled left is the side the symmetry score believes.",
    },
    {
      type: "note",
      text: "The figures in this essay are illustrative. They are drawn from GaitAI's own gait keyframes to make the failure modes visible; they are not measurements from any model, dataset or deployment, and no accuracy is claimed for any system.",
    },
  ],
  sections: [
    {
      id: "plausible-is-not-correct",
      number: "01",
      navLabel: "Plausible",
      title: "Plausible is not the same as correct",
      blocks: [
        {
          type: "p",
          text: "A pose model is trained to produce skeletons that look like the skeletons in its training data. That is what makes it useful — and what makes its failures quiet. When the evidence in a frame is poor, the model does not output a warning shape. It outputs the most likely body given what it can see, filled in with what bodies usually look like.",
        },
        {
          type: "p",
          text: "So a hidden knee is placed where knees usually are. A blurred ankle is placed somewhere along the blur. Feet that were cropped out of the image are placed at the bottom edge, because a body has feet. The result passes every test a glance can apply: right number of joints, right proportions, a person walking.",
        },
        {
          type: "quote",
          text: "The skeleton that looks obviously broken is the safe one. The one that looks fine is the one that reaches the measurement.",
        },
        {
          type: "p",
          text: "This is why the hero figure above has two views. **AI view** is the skeleton as the estimator returned it. **Original frame** is what the camera captured, with the estimate laid over it. Nothing in the AI view says which joints are guesses; only the comparison does.",
        },
      ],
    },
    {
      id: "where-keypoints-go-wrong",
      number: "02",
      navLabel: "Failure modes",
      title: "Where keypoints go wrong",
      blocks: [
        {
          type: "p",
          text: "The gait-recognition literature has a word for the conditions that change how a walk looks without changing the walk: **covariates**. Clothing, carried objects, viewing angle, occlusion and walking surface are the classic ones, studied because they defeat identity models. Read from the measurement side, the same list is a catalogue of the ways a keypoint can be moved off the body.",
        },
        {
          type: "states",
          caption: "Seven ways a keypoint goes astray, and what each one does to the estimate. Illustrative — the pattern of the error, not its size.",
          items: [
            { label: "01", name: "Occlusion", note: "A pillar, a bin, another person. The hidden joint is filled in from typical anatomy and reported anyway." },
            { label: "02", name: "Overlapping legs", note: "At mid-stance in a side view the legs cross. The estimator can assign the near knee to the far leg for a few frames, then swap back." },
            { label: "03", name: "Motion blur", note: "The swing foot moves fastest and blurs most. Its ankle lands somewhere along the streak, biased in the direction of travel." },
            { label: "04", name: "Loose clothing", note: "A long coat or wide trousers hide the knee. The joint is placed at the fabric's fold rather than the leg's bend." },
            { label: "05", name: "Cropped joints", note: "Feet below the frame, head above it. The estimator produces a plausible foot at the edge — a joint that was never observed." },
            { label: "06", name: "Poor contrast", note: "Dark trousers against a dark floor, or backlighting. Edges vanish and joints drift toward the middle of whatever region remains." },
            { label: "07", name: "Temporary swaps", note: "Left and right exchange for a stretch of frames and return. Each frame looks correct; the sequence is not." },
          ],
        },
        {
          type: "p",
          text: "Two things are true of every item on that list. The estimator still returns a complete skeleton, and the error is local: one joint, one side, one span of frames. Locality is what keeps the skeleton plausible. It is also what decides which measurements are damaged.",
        },
      ],
    },
    {
      id: "confidence-is-not-correctness",
      number: "03",
      navLabel: "Confidence",
      title: "Confidence is not correctness",
      blocks: [
        {
          type: "p",
          text: "Most estimators attach a confidence score to each keypoint. It is tempting to read that score as a probability of being right. It is closer to a statement about how strongly the model's internal evidence pointed at that location — which is not the same thing, and diverges most exactly where the image is hardest.",
        },
        {
          type: "list",
          tone: "cyan",
          items: [
            "**A filled-in joint can score high.** When a knee is occluded, the model's prior about where knees go can be sharp and unanimous. The score reports that sharpness, not the missing evidence.",
            "**A swapped side scores as well as a correct one.** Left and right are both legs. If the model has committed to the wrong assignment, nothing in its confidence says so.",
            "**Confidence is per joint, per frame.** Temporal errors — a swap that lasts twelve frames — have no natural place to be reported at all.",
            "**Calibration varies by condition.** A score of 0.9 under studio lighting and a score of 0.9 in a dim corridor are not the same claim, unless the model was explicitly calibrated across both.",
          ],
        },
        {
          type: "callout",
          tone: "violet",
          title: "The quiet consequence",
          text: "A pipeline that filters keypoints by confidence removes the failures the model knows about and keeps the ones it does not. That is better than nothing. It is not the same as knowing the skeleton is right.",
        },
      ],
    },
    {
      id: "what-the-error-does-downstream",
      number: "04",
      navLabel: "Downstream",
      title: "What a small error does downstream",
      blocks: [
        {
          type: "p",
          text: "A few pixels of ankle error sounds like a rounding problem. Follow it through the pipeline and it is not. Gait measures are built from joints in a chain, and each link amplifies a particular kind of error.",
        },
        {
          type: "flow",
          layout: "stack",
          steps: [
            "Keypoint — an ankle, placed a few pixels off",
            "Joint angle — the knee angle that ankle defines is now wrong",
            "Gait event — heel strike is detected early or late, or twice",
            "Temporal measures — step time, stance and swing duration shift",
            "Comparative measures — left/right symmetry compares a real leg with a guessed one",
            "Interpretation — a trend or an asymmetry that is in the estimate, not in the person",
          ],
          caption: "How a frame-level error becomes a sequence-level measurement error. Illustrative chain, not a quantified propagation.",
        },
        {
          type: "compare",
          caption: "The same error, seen at the two levels that matter.",
          columns: [
            {
              label: "In the frame",
              title: "Small, local, plausible",
              tone: "cyan",
              points: [
                "One joint moved by a small fraction of body height",
                "Skeleton still anatomically valid",
                "Confidence for the joint may be unchanged",
                "Invisible without the original frame",
              ],
            },
            {
              label: "In the measurement",
              title: "Large, structural, persistent",
              tone: "violet",
              points: [
                "Knee angle, step timing and stride length read from that joint",
                "A left/right swap inverts symmetry for the affected span",
                "A cropped foot removes the heel-strike event entirely",
                "The error survives averaging if it recurs at the same gait phase",
              ],
            },
          ],
        },
        {
          type: "matters",
          text: "The measurements most often used to describe mobility — cadence, step timing, stride length, symmetry — are exactly the ones that depend on the joints most often estimated wrongly: the feet and knees, at the moments they move fastest or overlap. The failure is not random noise on top of the signal; it lands on the signal's most informative parts.",
        },
      ],
    },
    {
      id: "seeing-the-lie",
      number: "05",
      navLabel: "Detecting",
      title: "How a system can tell it is being lied to",
      blocks: [
        {
          type: "p",
          text: "No single frame can reveal a plausible error, which is why the defences all live outside the frame. A movement-intelligence system has four sources of evidence a pose estimator does not use when it draws a skeleton.",
        },
        {
          type: "list",
          tone: "violet",
          items: [
            "**Time.** Ankles do not teleport. A joint that moves further between two frames than a body can move is an estimate, not an observation — and a left/right swap shows up as two legs exchanging trajectories.",
            "**Anatomy.** Limb lengths are constant for one person within one capture. A shin that grows by a third when the foot is occluded has been filled in.",
            "**Other sensors.** A wearable that records a heel strike the video did not, or a second camera angle where the hidden leg is visible, is independent evidence the estimator never had.",
            "**The capture itself.** Framing, contrast, motion and occlusion can be judged before any joint is placed. A frame that fails those checks should not be allowed to contribute a measurement, whatever skeleton it yields.",
          ],
        },
        {
          type: "p",
          text: "None of these makes the estimator better. They make the system honest about the estimator: the wrong frames are found, and the measures that depend on them are withheld or flagged rather than averaged in. The first Foundation called this **signal-quality control**; this essay is the closest look at why it is needed.",
        },
        {
          type: "callout",
          tone: "cyan",
          title: "Withhold, don't smooth",
          text: "Smoothing a keypoint trajectory hides an error inside a plausible curve. Withholding the affected measure keeps the error visible as an absence — which a clinician or operator can see, and a downstream model can be told about.",
        },
      ],
    },
    {
      id: "what-this-means",
      number: "06",
      navLabel: "Implications",
      title: "What this means for movement intelligence",
      blocks: [
        {
          type: "p",
          text: "It means the skeleton is an intermediate, not an answer. A system that shows a stick figure and a number is showing the least informative part of its work. What matters is whether it knows which joints it observed and which it inferred, and whether the numbers it produced were allowed to depend on the second kind.",
        },
        {
          type: "p",
          text: "It means robustness has to be tested where it fails. A benchmark of well-lit, full-body, side-view walking will report excellent pose accuracy and say nothing about a corridor, a coat or a waste bin. The conditions above are not edge cases in a care home or a station; they are Tuesday.",
        },
        {
          type: "p",
          text: "And it means the output of movement intelligence is **decision support**: a reading, with its capture quality attached, offered to a person who can look at the frame if the number is surprising. A plausible skeleton is where the argument for that stance begins.",
        },
      ],
    },
  ],
  closing: [
    {
      type: "p",
      text: "Pose estimation is the step that turns pixels into geometry, and it is remarkably good at it. The point of this essay is not that it fails often. It is that when it fails, it fails by looking right — and a system that measures movement has to be built as if that is true on every frame, because it cannot tell from the skeleton alone which frames it is.",
    },
    {
      type: "p",
      text: "The next stories in AI Under Stress take the same stance to the other places the world stops cooperating: a person disappearing behind another, half a body out of view, a foot below the frame.",
    },
  ],
  cta: { label: "See how GaitAI gates capture quality", href: "/products" },
  related: ["from-walking-video-to-movement-intelligence", "when-fusion-looks-better-than-it-is"],
};

import type { InsightArticle } from "../insights";

/**
 * ENGINEERING GAITAI · 01 — Camera Angle Changes What AI Sees
 *
 * Thesis: a camera is a projection, and the angle it takes decides which
 * movement signals survive the flattening — some become easier, some harder,
 * some are simply not in the image. Engineering, not marketing: the article
 * names the tradeoffs a deployment has to make and never quotes a performance
 * figure for any of them.
 */
export const cameraAngleChangesWhatAiSees: InsightArticle = {
  slug: "camera-angle-changes-what-ai-sees",
  title: "Camera Angle Changes What AI Sees",
  titleAccent: "What AI Sees",
  subtitle: "The same walk, flattened eight different ways",
  deck:
    "A camera does not record a walk; it records a projection of one. Which direction it flattens away decides which signals survive: a side view keeps the swing of the knee and loses the width of the stride, a front view does the reverse, and an oblique view keeps a little of everything while the scale changes under the person's feet. This is what that means for a system that has to measure movement from wherever the camera happens to be.",
  postType: "engineering",
  category: "Engineering GaitAI",
  topics: ["engineering", "movement-intelligence", "research"],
  date: "2026-09-23",
  excerpt:
    "A camera records a projection of a walk, not the walk. The angle decides which signals survive the flattening — knee flexion, stride width, timing, foot trajectory, body path — and a movement system has to be honest about which it has.",
  question: "Why does the same walk give a different answer from a different corner of the room?",
  ctaLabel: "Walk around the camera",
  hooks: [
    "What a side view sees that a front view cannot, and vice versa",
    "Why oblique cameras are the common case and the hard one",
    "How height, distance and lens quietly change the measurement",
  ],
  openingHook:
    "Before you scroll: one walker, one stride, and a camera you can carry around them — watch which signals light up and which go dark.",
  twoMinute: [
    "A camera flattens three dimensions into two. Whatever moves along the line of sight is lost; whatever moves across it is kept.",
    "A side view keeps the sagittal plane — knee flexion, stride length, the foot's arc, heel-strike timing — and cannot see stride width at all.",
    "A front or rear view keeps the coronal plane — stride width, sway, foot placement — and foreshortens everything along the walk, hiding knee angles.",
    "Oblique views, the common case for a mounted camera, see both planes partially, with a scale that changes as the person approaches or recedes.",
    "Camera height, distance and lens decide how many pixels a limb gets, which bounds how precisely any joint can be placed.",
    "A robust system declares what each view makes unavailable, favours features that survive the view it has, and never reports a measurement the geometry did not support.",
  ],
  series: "Engineering GaitAI",
  seriesStep: 1,
  seriesOrder: 1,
  seriesTitle: "What the angle takes away",
  evidenceLevel: "research-informed",
  relatedSignals: ["cap-pose", "sig-step-symmetry", "sig-trajectory"],
  memorableInteraction: "Carry the camera around a walker and watch knee flexion go dark as stride width lights up.",
  hero: {
    src: "/assets/images/insights/social/camera-angle-changes-what-ai-sees.png",
    alt: "GaitAI Insights social card: a camera orbiting a walker seen from above, with the signals each angle keeps or loses",
    width: 1200,
    height: 630,
  },
  cover: {
    concept: "viewpoint",
    alt: "A camera orbiting a walker seen from above, with the movement signals each angle keeps, weakens or loses.",
  },
  tags: ["Camera Geometry", "Pose Estimation", "Deployment", "Engineering GaitAI"],
  seo: {
    title: "Camera Angle Changes What AI Sees: Which Movement Signals Survive the View",
    description:
      "A camera records a projection of a walk. How side, front, rear and oblique views change which gait signals are measurable — knee flexion, stride width, timing, foot trajectory, body path — and how to engineer for the angle you have.",
  },
  intro: [
    {
      type: "lead",
      text: "Put the same person on the same corridor and film them from the side, from the front, and from the corner where the building happens to have a camera. Three recordings of one walk — and a movement system will find three different sets of things it can measure well, measure badly, or not measure at all.",
    },
    {
      type: "p",
      text: "Nothing has changed about the walk. What changed is the direction the camera flattened it in. This is the most basic fact about video-based movement analysis and one of the least discussed, because in a research setting the camera is put where the measurement wants it. In a deployment it is put where the wall is.",
    },
    {
      type: "note",
      text: "The figures in this article are illustrative: a plan-view sketch of a walker and a camera, drawn to show which plane each angle sees. They are not a camera model, and the availability of each signal is stated in words — easier, harder, unavailable — never as a number.",
    },
  ],
  sections: [
    {
      id: "a-camera-is-a-projection",
      number: "01",
      navLabel: "Projection",
      title: "A camera is a projection",
      blocks: [
        {
          type: "p",
          text: "A body moves in three dimensions. An image has two. Every camera resolves that by discarding one direction — the one along its line of sight — and keeping the two across it. Movement along the line of sight does not vanish entirely; it appears as a change in apparent size. But a change in size is a much weaker signal than a change in position, and it is entangled with distance.",
        },
        {
          type: "p",
          text: "So the question for any camera is not \"can it see the person\" but \"which plane of the person's movement is it looking across\". Gait analysts name two planes: the **sagittal** plane, the side-on slice in which the legs swing forward and back, and the **coronal** plane, the front-on slice in which the body sways and the feet are placed left and right. A camera sees one of them well, the other badly, or both partially.",
        },
        {
          type: "quote",
          text: "The camera does not choose what to measure. Its angle already has.",
        },
      ],
    },
    {
      id: "what-a-side-view-gives",
      number: "02",
      navLabel: "Side view",
      title: "What a side view gives, and what it cannot",
      blocks: [
        {
          type: "p",
          text: "Beside the walker, the camera looks across the sagittal plane. This is the textbook view, and for good reason: the knee's flexion and extension, the stride length, the arc the foot describes and the exact instant the heel meets the ground are all laid out across the image. Temporal measures read cleanly from here, because the events that define them — heel strike, toe-off — are unambiguous.",
        },
        {
          type: "p",
          text: "What the side view cannot see is anything that happens across the walk. Stride width — how far apart the feet are placed — is along its line of sight and collapses to nothing. Lateral sway is a small change in size. And the two legs overlap for part of every cycle, which is exactly the condition under which a pose estimator swaps left and right, as the first story in AI Under Stress showed.",
        },
        {
          type: "callout",
          tone: "cyan",
          title: "Best for",
          text: "Joint angles in the plane of walking, stride length, the timing of gait events, the shape of the foot's path. Weak or absent: stride width, sway, foot placement.",
        },
      ],
    },
    {
      id: "what-a-front-view-gives",
      number: "03",
      navLabel: "Front view",
      title: "What a front or rear view gives",
      blocks: [
        {
          type: "p",
          text: "Turn the camera to face the walker and the picture inverts. Now the coronal plane is across the image: stride width, the side-to-side sway of the trunk, whether the feet land in line or splayed, whether one shoulder drops. These are the signals that describe balance and support, and the side view could not give them.",
        },
        {
          type: "p",
          text: "The cost is everything along the walk. Stride length is foreshortened to a change in scale. Knee flexion — a rotation in the plane the camera is looking along — is nearly invisible. Heel strike is harder to place in time, because the event that marks it is a vertical motion seen at a shallow angle, and the person's apparent size grows every frame as they approach, so nothing can be compared frame to frame without correcting for it.",
        },
        {
          type: "compare",
          caption: "The two canonical views, and what each keeps.",
          columns: [
            {
              label: "Side",
              title: "Sagittal plane",
              tone: "cyan",
              points: ["Knee and hip angles", "Stride length and foot arc", "Heel strike and toe-off timing", "Stride width: unavailable"],
            },
            {
              label: "Front / rear",
              title: "Coronal plane",
              tone: "violet",
              points: ["Stride width and foot placement", "Trunk sway and shoulder drop", "Scale changes every frame", "Knee flexion: unavailable"],
            },
          ],
        },
      ],
    },
    {
      id: "oblique-angles-and-foreshortening",
      number: "04",
      navLabel: "Oblique",
      title: "Oblique angles: the common case",
      blocks: [
        {
          type: "p",
          text: "Almost no deployed camera is a side view or a front view. Cameras are mounted high in corners, looking down and across a space, and the people in that space walk in whichever direction they were going. The typical view is oblique: somewhere around forty-five degrees to the walk, from above.",
        },
        {
          type: "p",
          text: "An oblique view sees both planes — partially. Knee flexion is visible but compressed; stride width is visible but mixed with stride length; the foot's arc is a slanted ellipse. Every one of these can be recovered in principle, if the geometry is known. In practice the geometry is often not known precisely, and it changes as the person walks: a stride at the near end of the corridor covers many more pixels than the same stride at the far end.",
        },
        {
          type: "states",
          caption: "What an oblique camera does to each signal, compared with the view that measures it best. Illustrative.",
          items: [
            { label: "01", name: "Knee flexion", note: "Visible but compressed; recoverable only with a good estimate of the viewing angle." },
            { label: "02", name: "Stride width", note: "Mixed with stride length in the image; the two cannot be separated without the geometry." },
            { label: "03", name: "Step timing", note: "Available — the rhythm survives any view — but heel strike is placed less precisely." },
            { label: "04", name: "Foot trajectory", note: "A slanted, shrinking ellipse; its shape depends on where in the frame the foot is." },
            { label: "05", name: "Body path", note: "Actually improves: an elevated oblique view sees where a person goes in the room, which neither canonical view does well.", ok: true },
          ],
        },
        {
          type: "matters",
          text: "The oblique view is not a degraded side view; it is a different instrument with a different strength — spatial context — and a different weakness — every joint angle. A system designed for the side view and deployed on a corner camera will be confidently measuring things the image does not contain.",
        },
      ],
    },
    {
      id: "height-distance-and-lens",
      number: "05",
      navLabel: "Height & lens",
      title: "Height, distance and lens",
      blocks: [
        {
          type: "p",
          text: "Angle is the largest of the camera's choices but not the only one. Three quieter ones set the floor under everything a pose estimator can do.",
        },
        {
          type: "list",
          tone: "violet",
          items: [
            "**Height.** A camera above head height looks down on the walker, so vertical motion — the foot lifting and landing — is seen at an angle and the ground plane is tilted in the image. Heel strike timing gets harder to place; body path gets easier to read.",
            "**Distance.** Further away, the person occupies fewer pixels. A shin that is thirty pixels long can carry a knee that is right to within a pixel or two; a shin that is eight pixels long cannot. Precision is bounded by pixels per limb before any model is involved.",
            "**Lens.** A wide lens covers the room and bends straight lines near its edges; a long lens sees a narrow slice with less distortion. The same walk at the edge of a wide frame is not the same shape as at its centre.",
          ],
        },
        {
          type: "p",
          text: "None of these are properties of the person and all of them change the measurement. A recording made from a different mount, or after a camera was moved by a few centimetres, is not directly comparable to the one before — which is why a longitudinal reading has to record its capture geometry alongside its values.",
        },
      ],
    },
    {
      id: "designing-for-the-angle-you-have",
      number: "06",
      navLabel: "Designing for it",
      title: "Designing for the angle you have",
      blocks: [
        {
          type: "p",
          text: "An engineering team cannot move the walls. What it can do is treat the view as a first-class input rather than a nuisance.",
        },
        {
          type: "list",
          tone: "cyan",
          items: [
            "**Declare what is unavailable.** If the geometry does not support knee flexion, do not compute it. A withheld measure is honest; a foreshortened one is a wrong number with a confident label.",
            "**Prefer signals that survive the view.** Rhythm, cadence and step-to-step variability are properties of timing, and timing survives almost any angle. Lean on them where the geometry is poor.",
            "**Estimate the geometry, and say how well.** A known camera height and angle turns an oblique view back into measurements; an unknown one should lower the confidence of every spatial value, explicitly.",
            "**Use a second sensor for what the view cannot see.** A wearable measures heel strike in the body's frame, not the camera's. The fifth Foundation's caution applies: fusion adds coverage only when the streams are honest about their own quality.",
            "**Compare like with like.** Two recordings from different mounts are two instruments. A trend is only a trend if the capture geometry was the same, or was corrected for.",
          ],
        },
        {
          type: "p",
          text: "The view-invariance literature in gait recognition spent a decade on exactly this problem, for identity; the covariate surveys in the evidence below are where that work is collected. Movement measurement inherits both the problem and the tools, and adds one requirement the identity work did not have: the output is a number a person will act on, so the geometry it came from has to be part of the answer.",
        },
      ],
    },
  ],
  closing: [
    {
      type: "p",
      text: "A camera angle is not a detail of installation. It is a decision about which plane of human movement will be measured and which will be inferred — made, usually, by whoever mounted the bracket. A movement-intelligence system that knows this can be deployed on the camera a building already has. One that does not will measure the corridor's geometry and call it a person's gait.",
    },
    {
      type: "p",
      text: "Engineering GaitAI continues with the gap between a good model and a good system: the camera, the network, the alert and the person at the end of it.",
    },
  ],
  cta: { label: "See how GaitAI approaches deployment", href: "/products" },
  related: ["when-pose-estimation-lies", "from-walking-video-to-movement-intelligence"],
};

/**
 * THE HERO'S STORY LAYER, AS DATA (HeroSignals)
 * =============================================================================
 * The founder's brief (2026-09-26): the three panels must read in two or three
 * seconds as TWO APPLICATIONS and ONE CORE:
 *   SecureVision   gait / movement intelligence in public spaces
 *   MobilityCare   gait / movement intelligence in clinical care and recovery
 *   Pose analysis  the gait-analysis engine that powers both
 *
 * Everything here is measured off the two plates, in each plate's own pixels
 * (day 1672 x 941, night 1759 x 894). The people differ between the two
 * pictures, so each theme has its own numbers. The engine's end of the thread
 * is the walker's own placement (HERO_WALK), and the role tags hang from the
 * anchor dots (HERO_OPTIONS), so neither can drift from what it labels.
 *
 * TO RE-TUNE after a plate changes: render the hero, look at the overlay over
 * the picture, and move the numbers. Feet are where the sole meets the floor;
 * boxes are the painted tracking boxes; `vp` is where the corridor's walkers
 * are heading (the flow's vanishing point on the floor).
 */

export type XY = readonly [number, number];

/** A full-body pose: the major keypoints of a standard pose estimate. */
export type Pose = Readonly<Record<
  | "head" | "neck" | "shoulderL" | "shoulderR" | "elbowL" | "elbowR" | "wristL" | "wristR"
  | "pelvis" | "hipL" | "hipR" | "kneeL" | "kneeR" | "ankleL" | "ankleR",
  XY
>>;

export type Pedestrian = {
  /** The tracking box painted into the plate: x0, y0, x1, y1. */
  box: readonly [number, number, number, number];
  /** Track label a visitor can read ("Person 14"; founder, 2026-09-26 — was "Anon 14") and walking speed. The track stays anonymous: a number, never an identity. */
  id: string;
  speed: string;
  /** Pelvis and the two feet: the same markers the engine draws on the walker. */
  pelvis: XY;
  feet: readonly [XY, XY];
  /** Walking away from the camera with the flow, or against it (the flagged one). */
  flow: "with" | "against";
  /** false: no label above the box (where it would run into the caption). */
  label?: boolean;
  /** The one primary tracked subject carries a full-body pose (founder,
      2026-09-26: never partial lower-body points, never on everyone).
      Keypoints read off the plate at 3x, seen from behind. */
  pose?: Pose;
};

export type SignalTheme = {
  plate: readonly [number, number];
  secure: {
    vp: XY;
    people: readonly Pedestrian[];
    /** Top-left of the SecureVision read-out, on the open floor under the caption. */
    chip: XY;
  };
  care: {
    /** Named joints of the patient, for the same skeleton the engine draws. */
    joints: Pose;
    /** The gait ring on the floor under the patient: centre and radii. */
    ring: readonly [number, number, number, number];
    /** His last two footfalls, behind him (nearer the camera). */
    steps: readonly [XY, XY];
    /** The clinician's tablet, which the read-out is tied to. */
    tablet: XY;
    /** Bottom-left of the MobilityCare read-out, above the patient's head. */
    chip: XY;
  };
  /** The floor thread, engine to applications: walker, patient, pedestrians. */
  thread: readonly XY[];
  /** Thread points (indices) that carry a direction chevron: entering each application. */
  chevrons: readonly number[];
};

export const HERO_SIGNALS: Record<"light" | "dark", SignalTheme> = {
  light: {
    plate: [1672, 941],
    secure: {
      vp: [700, 592],
      people: [
        { box: [519, 491, 589, 660], id: "Person 14", speed: "1.2 m/s", pelvis: [554, 585], feet: [[548, 656], [560, 651]], flow: "with" },
        {
          box: [625, 449, 721, 721], id: "Person 09", speed: "1.4 m/s", pelvis: [672, 598], feet: [[660, 709], [679, 714]], flow: "with",
          pose: {
            head: [677, 477], neck: [676, 497], shoulderL: [644, 508], shoulderR: [707, 510],
            elbowL: [635, 552], elbowR: [713, 552], wristL: [633, 593], wristR: [711, 595],
            pelvis: [675, 597], hipL: [658, 597], hipR: [692, 597],
            kneeL: [658, 643], kneeR: [687, 643], ankleL: [663, 687], ankleR: [677, 693],
          },
        },
        { box: [753, 497, 819, 657], id: "Person 21", speed: "0.9 m/s", pelvis: [782, 580], feet: [[775, 649], [790, 646]], flow: "against" },
      ],
      chip: [318, 626],
    },
    care: {
      joints: {
        head: [975, 470], neck: [971, 488], shoulderL: [928, 499], shoulderR: [1000, 503],
        elbowL: [914, 562], elbowR: [1008, 556], wristL: [919, 606], wristR: [1014, 604],
        pelvis: [964, 596], hipL: [937, 594], hipR: [991, 598],
        kneeL: [944, 666], kneeR: [975, 666], ankleL: [948, 739], ankleR: [973, 744],
      },
      ring: [961, 757, 48, 10],
      steps: [[947, 781], [973, 798]],
      tablet: [1048, 532],
      chip: [893, 440],
    },
    thread: [[1336, 780], [1296, 781], [1200, 790], [1100, 784], [1030, 770], [961, 758], [870, 752], [764, 742], [700, 724], [669, 713], [600, 684], [556, 657]],
    chevrons: [3, 8],
  },
  dark: {
    plate: [1759, 894],
    secure: {
      vp: [700, 562],
      people: [
        { box: [466, 444, 552, 665], id: "Person 14", speed: "1.2 m/s", pelvis: [510, 565], feet: [[504, 661], [517, 657]], flow: "with", label: false },
        {
          box: [622, 402, 729, 696], id: "Person 09", speed: "1.4 m/s", pelvis: [675, 580], feet: [[659, 689], [679, 691]], flow: "with",
          pose: {
            head: [676, 433], neck: [676, 455], shoulderL: [637, 468], shoulderR: [713, 468],
            elbowL: [628, 518], elbowR: [720, 518], wristL: [631, 567], wristR: [717, 568],
            pelvis: [676, 573], hipL: [655, 573], hipR: [697, 573],
            kneeL: [657, 625], kneeR: [687, 625], ankleL: [660, 672], ankleR: [678, 682],
          },
        },
        { box: [766, 460, 838, 636], id: "Person 21", speed: "0.9 m/s", pelvis: [802, 560], feet: [[795, 632], [808, 629]], flow: "against" },
      ],
      chip: [300, 628],
    },
    care: {
      joints: {
        head: [1015, 412], neck: [1011, 436], shoulderL: [961, 448], shoulderR: [1045, 453],
        elbowL: [945, 516], elbowR: [1052, 512], wristL: [950, 566], wristR: [1061, 571],
        pelvis: [1004, 558], hipL: [972, 557], hipR: [1036, 560],
        kneeL: [981, 635], kneeR: [1018, 635], ankleL: [988, 705], ankleR: [1015, 710],
      },
      ring: [1002, 726, 50, 11],
      steps: [[989, 751], [1015, 768]],
      tablet: [1104, 489],
      // Beside the role tag, not under it: the night patient stands higher, leaving no room above his head.
      chip: [1140, 392],
    },
    thread: [[1440, 786], [1410, 787], [1300, 792], [1180, 770], [1080, 742], [1002, 727], [900, 735], [776, 732], [700, 706], [669, 690], [580, 676], [511, 660]],
    chevrons: [4, 8],
  },
};

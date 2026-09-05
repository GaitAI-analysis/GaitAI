/**
 * THE PHOTOGRAPH, ANNOTATED.
 *
 * The interactive lab is the real room: the cover photograph, full-screen and
 * sharp, with the intelligence drawn over it. Everything drawn — the twelve
 * capture cameras, the subject's joints, the capture zone, the walking line —
 * is placed in the photograph's own pixel space (1672 × 941) so it stays
 * registered to the picture at every viewport. Positions were read off the
 * photograph by hand; correcting one is a number here.
 */

export const LAB_PHOTO = {
  src: "/assets/images/labs/lab-cover.jpg",
  width: 1672,
  height: 941,
  alt: "The GaitAI biometrics capture room: Anubha Parashar standing at the centre of a bright hall with louvered windows, ringed by twelve tripod-mounted capture cameras.",
} as const;

/** The cover photograph: the founder sitting at work in the same room. */
export const LAB_SITTING_PHOTO = {
  src: "/assets/images/labs/lab-cover-sitting.jpg",
  width: 1672,
  height: 941,
} as const;

export interface PhotoCamera {
  id: string;
  /** Lens position in photograph pixels. */
  x: number;
  y: number;
  /** Where it stands, in a few words. */
  place: string;
  /** What it sees of the subject, who faces the far wall. */
  view: string;
}

/** The twelve cameras visible in the photograph, left to right around the room. */
export const PHOTO_CAMERAS: PhotoCamera[] = [
  { id: "01", x: 40, y: 170, place: "Left, near, elevated", view: "Rear-left, from above eye level" },
  { id: "02", x: 195, y: 305, place: "Left wall, mid-room", view: "Left side, oblique from behind" },
  { id: "03", x: 340, y: 315, place: "Left wall, toward the far end", view: "Left side" },
  { id: "04", x: 455, y: 330, place: "Far-left corner", view: "Front-left oblique" },
  { id: "05", x: 580, y: 345, place: "Far wall, left", view: "Front-left" },
  { id: "06", x: 688, y: 350, place: "Far wall, just left of centre", view: "Frontal, slightly left" },
  { id: "07", x: 985, y: 350, place: "Far wall, just right of centre", view: "Frontal, slightly right" },
  { id: "08", x: 1150, y: 345, place: "Far wall, right", view: "Front-right" },
  { id: "09", x: 1270, y: 325, place: "Far-right corner", view: "Front-right oblique" },
  { id: "10", x: 1435, y: 315, place: "Right wall, toward the far end", view: "Right side" },
  { id: "11", x: 1585, y: 315, place: "Right wall, mid-room", view: "Right side, oblique from behind" },
  { id: "12", x: 1640, y: 170, place: "Right, near, elevated", view: "Rear-right, from above eye level" },
];

/** The point every camera is aimed at: the subject's chest. */
export const PHOTO_SUBJECT = { x: 830, y: 420 } as const;

/** Her joints, as a pose model would report them, in photograph pixels. */
export const PHOTO_POSE: Record<string, [number, number]> = {
  head: [828, 305],
  neck: [830, 367],
  lShoulder: [762, 372],
  rShoulder: [887, 372],
  lElbow: [757, 465],
  rElbow: [897, 465],
  lWrist: [757, 545],
  rWrist: [895, 545],
  lHip: [800, 530],
  rHip: [860, 530],
  lKnee: [800, 640],
  rKnee: [855, 640],
  lAnkle: [792, 730],
  rAnkle: [852, 730],
};

export const PHOTO_BONES: [string, string][] = [
  ["head", "neck"], ["neck", "lShoulder"], ["neck", "rShoulder"],
  ["lShoulder", "lElbow"], ["lElbow", "lWrist"], ["rShoulder", "rElbow"], ["rElbow", "rWrist"],
  ["lShoulder", "lHip"], ["rShoulder", "rHip"], ["lHip", "rHip"],
  ["lHip", "lKnee"], ["lKnee", "lAnkle"], ["rHip", "rKnee"], ["rKnee", "rAnkle"],
];

/** The capture zone on the floor: a perspective ellipse around where she stands. */
export const PHOTO_CAPTURE_ZONE = { cx: 830, cy: 790, rx: 300, ry: 56 } as const;

/**
 * The walking line: the path a subject takes through the capture zone toward
 * the far wall, in photograph pixels, with foot-strike marks along it.
 */
export const PHOTO_WALK_PATH = "M 830 935 C 826 880, 836 840, 830 790 C 826 760, 833 735, 830 705";
export const PHOTO_FOOTSTEPS: [number, number][] = [[818, 915], [842, 885], [820, 855], [842, 825], [822, 795], [840, 768], [824, 742]];

/**
 * A stride signal, one gait cycle repeated: heel-strike peaks, the swing
 * trough, the small double-support notch. Dimensionless — it illustrates the
 * shape of the signal the cameras produce, not a measurement.
 */
export const GAIT_SIGNAL: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < 96; i += 1) {
    const t = (i / 96) * Math.PI * 4;
    out.push(0.5 + 0.3 * Math.sin(t) + 0.12 * Math.sin(t * 2 + 0.6) + 0.04 * Math.sin(t * 5));
  }
  return out;
})();

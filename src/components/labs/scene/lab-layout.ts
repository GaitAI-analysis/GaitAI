/**
 * THE ROOM, AS NUMBERS.
 *
 * Everything the scene builds is measured from here, so the shell and the
 * scene agree on how many cameras there are and where the subject stands.
 * The room is the GaitAI biometrics capture room in the reference
 * photographs: a long hall with pilasters between high louvered windows over
 * lower glazed ones, pale yellow painted plaster, ceiling beams with tube
 * lights and fans, a polished white vitrified-tile floor with a darker joint
 * line every few tiles, a row of workstations along one side, and a ring of
 * camera tripods around a clear capture floor. Dimensions are estimated from
 * the photographs, not surveyed; the layout is faithful, the metres are
 * approximate, and this file is the one place to correct them.
 *
 * Axes: +x runs along the room's length (the workstations are at -x), +y is
 * up, +z is toward the entrance wall — the viewpoint of the cover photograph,
 * looking down the room at the subject's back.
 */

export const ROOM = {
  /** Length, along x. */
  width: 15,
  /** Depth, along z. */
  depth: 13,
  height: 4.2,
  /** Tile pitch on the floor, metres. */
  tile: 0.6,
  /** The floor texture covers this many tiles per repeat (4 × 4). */
  tilesPerTexture: 4,
} as const;

/** Where the subject stands, and the height the cameras aim at (the chest). */
export const SUBJECT = { x: 0, z: 0, aimHeight: 1.15 } as const;

/** The eye's opening position and the point it orbits: her back, as on the cover. */
export const OVERVIEW = {
  position: [0.8, 1.7, 5.4] as [number, number, number],
  target: [SUBJECT.x, 1.05, SUBJECT.z] as [number, number, number],
} as const;

export interface CaptureCamera {
  /** Bearing around the subject, degrees; 0 is +z (the entrance side). */
  bearing: number;
  /** Distance from the subject, metres. */
  radius: number;
  /** Lens height, metres. Heights vary as they do in the photograph. */
  height: number;
}

/**
 * Fourteen tripods around a clear floor, as in the cover photograph: two
 * close on either side of the viewpoint, a spread along the far wall, and a
 * stand near each corner. Bearings are spaced unevenly on purpose — a
 * perfectly regular ring reads as a diagram, not a room. Every camera is
 * aimed at the subject by `lookAt`, never by hand.
 */
export const CAPTURE_CAMERAS: CaptureCamera[] = [
  { bearing: 24, radius: 5.6, height: 1.72 },
  { bearing: 54, radius: 5.4, height: 1.32 },
  { bearing: 86, radius: 5.5, height: 1.58 },
  { bearing: 114, radius: 5.0, height: 1.28 },
  { bearing: 143, radius: 4.7, height: 1.48 },
  { bearing: 163, radius: 4.6, height: 1.22 },
  { bearing: 180, radius: 4.8, height: 1.44 },
  { bearing: 197, radius: 4.6, height: 1.28 },
  { bearing: 218, radius: 4.7, height: 1.54 },
  { bearing: 247, radius: 5.0, height: 1.3 },
  { bearing: 275, radius: 5.5, height: 1.62 },
  { bearing: 307, radius: 5.4, height: 1.38 },
  { bearing: 337, radius: 5.6, height: 1.78 },
  { bearing: 2, radius: 5.9, height: 1.5 },
];

export const CAPTURE_CAMERA_COUNT = CAPTURE_CAMERAS.length;

/** The lens position of a capture camera, in room coordinates. */
export function cameraPosition(camera: CaptureCamera): [number, number, number] {
  const a = (camera.bearing * Math.PI) / 180;
  return [SUBJECT.x + Math.sin(a) * camera.radius, camera.height, SUBJECT.z + Math.cos(a) * camera.radius];
}

/** Where the assets live. One prefix, so a CDN move is one line. */
export const LAB_ASSETS = "/labs";
export const LAB_URLS = {
  hdri: `${LAB_ASSETS}/hdri/lebombo_1k.hdr`,
  draco: `${LAB_ASSETS}/draco/`,
  avatar: `${LAB_ASSETS}/avatar/anubha.glb`,
  fan: `${LAB_ASSETS}/models/ceiling-fan.glb`,
  tubeLight: `${LAB_ASSETS}/models/fluorescent-light.glb`,
  plant: `${LAB_ASSETS}/models/potted-plant.glb`,
  tex: (name: string) => `${LAB_ASSETS}/textures/${name}`,
} as const;

/** The photographs the twin is built from, for the comparison mode. */
export const LAB_PHOTOS = [
  { id: "ring", src: "/assets/images/labs/lab-cover.jpg", label: "The capture ring", caption: "Standing at the centre of the camera ring." },
  { id: "room", src: "/assets/images/labs/lab-room.jpg", label: "Workstations", caption: "The workstation side of the room, cameras behind." },
] as const;

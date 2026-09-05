/**
 * THE ROOM, AS NUMBERS.
 *
 * Everything the scene builds is measured from here, so the shell and the
 * scene agree on how many cameras there are and where the subject stands.
 * The room is the GaitAI biometrics capture room in the two reference
 * photographs: a long hall with high louvered windows over lower ones,
 * yellow walls, a polished white tiled floor, ceiling fans, a row of
 * workstations along one side, and a ring of camera tripods around a clear
 * capture floor. Dimensions are estimated from the photographs, not
 * surveyed; the layout is faithful, the metres are approximate.
 *
 * Axes: +x runs along the room's length (the workstations are at -x),
 * +y is up, +z is toward the entrance wall — the viewpoint of the cover
 * photograph, looking down the room at the subject's back.
 */

export const ROOM = {
  /** Length, along x. */
  width: 18,
  /** Depth, along z. */
  depth: 15,
  height: 4.4,
  /** Tile pitch on the floor, metres. */
  tile: 0.6,
} as const;

/** Where the subject stands, and the height the cameras aim at (the chest). */
export const SUBJECT = { x: 0, z: 0, aimHeight: 1.15 } as const;

/** The camera's opening position and the point it orbits. */
export const OVERVIEW = {
  position: [0.9, 1.8, 5.9] as [number, number, number],
  target: [SUBJECT.x, SUBJECT.aimHeight, SUBJECT.z] as [number, number, number],
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
 * close on either side of the viewpoint, a spread along the far wall, and
 * a stand near each corner. Bearings are spaced unevenly on purpose — a
 * perfectly regular ring reads as a diagram, not a room.
 */
export const CAPTURE_CAMERAS: CaptureCamera[] = [
  { bearing: 22, radius: 6.4, height: 1.75 },
  { bearing: 52, radius: 6.2, height: 1.35 },
  { bearing: 84, radius: 6.0, height: 1.6 },
  { bearing: 112, radius: 5.4, height: 1.3 },
  { bearing: 142, radius: 5.0, height: 1.5 },
  { bearing: 163, radius: 4.9, height: 1.25 },
  { bearing: 180, radius: 5.1, height: 1.45 },
  { bearing: 197, radius: 4.9, height: 1.3 },
  { bearing: 218, radius: 5.0, height: 1.55 },
  { bearing: 248, radius: 5.4, height: 1.3 },
  { bearing: 276, radius: 6.0, height: 1.65 },
  { bearing: 308, radius: 6.2, height: 1.4 },
  { bearing: 338, radius: 6.4, height: 1.8 },
  { bearing: 2, radius: 6.9, height: 1.5 },
];

export const CAPTURE_CAMERA_COUNT = CAPTURE_CAMERAS.length;

/** The lens position of a capture camera, in room coordinates. */
export function cameraPosition(camera: CaptureCamera): [number, number, number] {
  const a = (camera.bearing * Math.PI) / 180;
  return [SUBJECT.x + Math.sin(a) * camera.radius, camera.height, SUBJECT.z + Math.cos(a) * camera.radius];
}

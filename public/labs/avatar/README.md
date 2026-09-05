# The capture subject

`anubha.glb` is the figure standing at the centre of the interactive lab
(`src/components/labs/scene/LabScene.tsx`, `Avatar`). It is a **stand-in**,
not a scan: a realistic rigged human with a Mixamo skeleton, dressed to match
the reference photographs (red-and-black plaid under a black vest, jeans,
dark shoes), with long hair and glasses added by the scene on the head bone.
It is posed, given its idle presence, and read by the pose overlay entirely
through its bones.

**Source and licence.** Derived from the "Michelle" character distributed with
the three.js examples (Adobe Mixamo character, permitted for use in projects;
not for standalone redistribution). The dance clip was removed, the base
colour atlas recoloured, and the file Draco-compressed with WebP textures
(215 KB, 13.7k vertices). Poly Haven textures used elsewhere in the room are
CC0.

## Replacing it with a personalised avatar

Drop a new file at this path with the **same skeleton naming** (Mixamo:
`mixamorig:Hips`, `Spine`, `Spine1`, `Spine2`, `Neck`, `Head`,
`Left/RightArm`, `Left/RightForeArm`, `Left/RightHand`, `Left/RightUpLeg`,
`Left/RightLeg`, `Left/RightFoot`) and nothing else in the room changes: the
pose, the idle motion, the head-mounted hair and glasses, the pose overlay and
the camera aim all resolve bones by name at load.

Requirements for the file:

- glTF binary, Y-up, metres, facing +Z, feet at y = 0, ~1.6–1.7 m tall.
- Rest pose T- or A-pose (the scene lowers the arms itself).
- Draco compression and 512–1024 px WebP/JPEG textures; aim for < 2 MB.
- If the avatar carries its own hair and glasses, remove the procedural ones
  in `Avatar` (the `headAnchor` group).

Ways to produce one:

- **A. Photogrammetry** — 40–80 photographs around the standing subject in
  even light (or a phone scanning app), cleaned and retopologised, then
  auto-rigged to the Mixamo skeleton (Mixamo's uploader does this) and
  exported as GLB.
- **B. 360° body video** — a slow turn on the spot, 20–30 s, processed by a
  video-to-mesh service, then rigged as above.
- **C. An external realistic avatar** — a service that outputs a rigged GLB
  (Mixamo-compatible), exported wearing the plaid shirt, vest and jeans.

Run `npx @gltf-transform/cli optimize in.glb anubha.glb --compress draco
--texture-compress webp --texture-size 1024` before committing.

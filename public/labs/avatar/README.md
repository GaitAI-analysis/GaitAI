# The capture subject — a 3D human representation

`anubha.glb` is the figure standing at the centre of the interactive lab's
DIGITAL TWIN mode (`src/components/labs/scene/LabScene.tsx`, `Avatar`). It is
a **stand-in**, not a scan and not a 4D capture: a rigged character with the
Mixamo skeleton, used exactly as authored — mesh, skin weights and inverse
bind matrices untouched — cloned with `SkeletonUtils.clone`, placed by one
root transform, posed standing by two verified bone rotations, and left
still. The pose overlay reads its bones with `getWorldPosition` every frame.

**Source and licence.** Derived from the "Michelle" character distributed with
the three.js examples (an Adobe Mixamo character, permitted for use in
projects; not for standalone redistribution). Changes to the asset: the two
animation clips were removed; the character's hair puffs, headphones and
sunglass lenses were removed from the mesh — the accessories by their texture
region (they live on red atlas pixels, the face does not), the hair volume by
a skull ellipsoid that never reaches the face — leaving the scalp, the face
and thin frames that read as glasses; the base-colour atlas was recoloured
(trousers to denim blue, red to charcoal, skin lightened toward the
photographs); Draco compression with 512 px WebP textures, no
simplification. 65 bones, 19,647 triangles, one 512² base colour, one 512²
normal, one 512² metallic-roughness texture; 194 KB. The room adds natural
straight hair as fitted surfaces placed from the bones (`buildHair` in
`LabScene.tsx`).

**What does not match the founder yet, and is not pretended to:** the body
and face are the source character's (stylised, long-limbed), and she wears a
grey crop top rather than the red-and-black checked shirt. The likeness comes
from the personalised asset below; the pipeline is ready for it.

## Replacing it with a personalised avatar

Drop a new file at this path with the **same skeleton naming** (Mixamo:
`mixamorig:Hips`, `Spine`, `Spine1`, `Spine2`, `Neck`, `Head`,
`HeadTop_End`, `Left/RightArm`, `Left/RightForeArm`, `Left/RightHand`,
`Left/RightUpLeg`, `Left/RightLeg`, `Left/RightFoot`) and nothing else in
the room changes: the standing pose, the pose overlay and the camera aim all
resolve bones by name at load.

Requirements for the file:

- glTF binary, Y-up, metres, facing +Z, feet at y = 0, about 1.6–1.7 m tall.
- Rest pose T-pose (the scene lowers the arms itself) — or set
  `STANDING` in `LabScene.tsx` to zero if the asset is already posed.
- Clothing, hair and glasses skinned as part of the same rig; realistic
  proportions; normals and UVs exported clean.
- Draco compression and 512–1024 px WebP/JPEG textures; aim for under 2 MB.

Ways to produce one:

- **A. Photogrammetry** — 40–80 photographs around the standing subject in
  even light (or a phone scanning app), cleaned and retopologised, then
  auto-rigged to the Mixamo skeleton (Mixamo's uploader does this) and
  exported as GLB.
- **B. 360° body video** — a slow turn on the spot, 20–30 s, processed by a
  video-to-mesh service, then rigged as above.
- **C. Professional avatar capture or an external realistic avatar service**
  that outputs a rigged, Mixamo-compatible GLB, exported wearing the plaid
  shirt and jeans.

Validate before committing:

```
npx @gltf-transform/cli optimize in.glb anubha.glb --simplify false --compress draco --texture-compress webp --texture-size 1024
```

and load the result in an independent viewer (gltf.report, the Babylon
sandbox, or the three.js editor) from the front, back, both sides and above
before opening it in the room.

# Hero walker: the Pose-analysis digital human, always walking

This is the offline asset pipeline for `src/components/sections/HeroWalker.tsx`. It is not part
of the build. Its outputs are committed:
- `public/images/hero/walk/*`
- `src/data/hero-walk.ts`
- the figure-free hero plates: `public/images/hero/home-hero-gaitai(.webp|-1200.webp)` and
  `home-hero-dark(.webp|-1200.webp)`

## What it makes

- **The man.** A real motion capture of a NATURAL walk, CMU Graphics Lab Motion Capture
  Database trial **07_03** (Motionbuilder-friendly BVH conversion by B. Hahne, mirrored at
  github.com/una-dinosauria/cmu-mocap, `data/007/07_03.bvh`). The terms read: "This data is
  free for use in research and commercial projects worldwide" (credit line, if wanted: "The
  data used in this project was obtained from mocap.cs.cmu.edu. The database was created with
  funding from NSF EIA-0196217."). `render.html`'s `loadBVH` cuts ONE gait cycle, right heel
  strike to right heel strike (the middle one of the trial), removes the actor's heading and
  the hips' steady travel (keeping the sway), and spreads the small end-to-start mismatch over
  the cycle so the loop closes exactly. Subject 07 was chosen by measuring every candidate:
  full knee extension, a 68-73 degree swing peak, symmetric, and a 1.233 s cycle (97 steps/min,
  played at 1.176 s = 102). The Xbot `walk` it replaces was a stylised game walk: crouched
  knees (never under 21 degrees in stance), and on its toes on this rig.
  It is retargeted in world space onto a male body built from **MakeHuman's CC0 assets**
  (github.com/makehumancommunity/makehuman, `LICENSE.ASSETS.md`: CC0 1.0) by `build_mh.py`,
  with no MakeHuman or Blender install:
  - `3dobjs/base.obj` (the neutral base mesh, body group only) plus the male macro targets
    (young male, muscle 0.8, weight 0.48, a little height and ideal proportions) and a few
    shaping targets: shoulder width, V-shape, pectorals, lats and chest depth up; hips and
    glutes down
  - the joints come from `rigs/default.mhskel` (vertex-group means on the same, shaped mesh), and
    the skinning from `rigs/default_weights.mhw`; the split MakeHuman bones are merged into a
    UE-style set (pelvis, spine_01-03, thigh_l, calf_l and so on), so `alias()` maps it
  - retargeting (`align=1&alignset=Shoulder,Arm,ForeArm,UpLeg,Leg,Foot`): the arms, thighs,
    shanks and feet copy the capture's bone DIRECTIONS (so the knee angle is the captured knee
    angle); `anklefixL=4.5&anklefixR=6` pitches the feet so a flat captured foot lands flat
    (calibrated on the heel and toe-tip rest heights at mid stance); `toefix=1` bends the toe
    up at the ball at push-off instead of letting the tip sink; the floor is the PLANTED
    foot's sole (median over the cycle), never the global minimum; `nohand=1` keeps the hands
    rigid to the forearm and `palm=1` curls each finger about its own flexion axis
  - matte graphite skin with subtle segmentation where the skin weights change, a Fresnel rim,
    and "body-scan" contours (`scan`): level lines of the rest-pose height painted on the skin
  - a floor reflection
  - no nodes, lines or constellation are baked in: the page draws the analysis layer itself,
    from the per-frame joints `pack.py` exports (see `HeroWalker.tsx`)

  It is rendered to 48 frames of ONE gait cycle with alpha. The loop is that cycle end to
  start, so there is no reset. (Rejected on 2026-09-25: Mesh2Motion's `male.glb`/`female.glb`,
  slimmed by bone scaling, which read as a female/androgynous metallic mannequin.)
- **Foot lock.** `solve()` in `render.html` measures, per frame, the root travel that keeps the
  stance foot still. The page moves the ground grain by exactly that (`root`).
- **Plates.** `erase.py` removes the painted figure, its reflection and its glow from each
  ORIGINAL plate, using LaMa (`lama_fp32.onnx`, Carve/LaMa-ONNX) and a u2net matte (rembg).
  Point `HERO_ORIG` at the pre-erase plates, which are in git history before the walker commit.
- **Backdrop.** `tile2.py` takes the real panel plus a 72px LaMa outpaint past the right edge,
  with the floor softened into its reflection. It also makes the floor's grain as a seamless
  128-neutral tile. The page drifts the backdrop slowly, dissolving a new pass in from the start
  each time, and runs the grain with `hard-light` at the ground's speed per row.
- `divider.py` fits the panel's diagonal divider, which becomes the canvas clip.
- **Gait analysis.** `gait.py` finds the events on the rendered body's own kinematics (the
  per-frame `K` rows: floor-relative heel and toe-tip heights, clinical hip / knee / ankle
  angles, shank angle, ankle travel, pelvis height and obliquity): initial contact, the
  other foot's toe-off, heel rise, the other foot's contact, toe-off; swing in thirds. That
  gives Perry's eight phases per foot, stance, the centre of pressure along the sole, and the
  event list, exported as `HERO_GAIT`. The page draws nothing it did not measure.
- `pack.py` builds the hi and lo WebP atlases (and the poster). `emit.py` writes `src/data/hero-walk.ts`.

## Run

Python needs pillow, numpy, scipy, onnxruntime and rembg. Node needs `puppeteer-core`
(install it in a scratch folder and set `NODE_PATH`) and a local Chrome.

    # models/: Xbot.glb (three.js r169 examples/models/gltf),
    #          m2m-male.glb (github.com/Mesh2Motion/mesh2motion-app static/models-variation/human/male.glb),
    #          lama_fp32.onnx
    python erase.py light && python erase.py dark        # -> clean-<theme>.png, mask-<theme>.png
    # MakeHuman sources, fetched from the repo's makehuman/data/ into a work folder:
    #   3dobjs/base.obj, rigs/default.mhskel, rigs/default_weights.mhw and the targets
    #   build_mh.py names (macrodetails/, measure/, torso/, stomach/, buttocks/)
    python build_mh.py models/mh-male.glb                  # run in that folder
    BASE="body=mh-male.glb&anim=cmu/07_03.bvh&w=600&h=1070&top=2.04&below=0.42&cx=-0.05&yaw=16&soleh=-1&align=1&alignset=Shoulder,Arm,ForeArm,UpLeg,Leg,Foot&anklefixL=4.5&anklefixR=6&toefix=1&nohand=1&palm=1&curl=1.0&handtwist=70&curlsign=-1&node=0&lines=0&extra=0&const=0&seg=0.35&rough=0.58&metal=0.02&coat=0.08&scan=0.3&scanf=50"
    node run-render.mjs out/GL "$BASE&skin=%231e232d&shoe=%23262a33&rim=2.6&key=0.9&hemi=0.25&fill=0.3&env=0.35&exposure=0.9&reflop=0.28&glowk=0.25&glow=%23ffe2b0&scanc=%23c9a25e" cycle 48
    node run-render.mjs out/GD "$BASE&skin=%23141820&shoe=%231c2029&rim=4.0&rimc=%23ffd49a&key=0.55&hemi=0.12&fill=0.2&env=0.18&exposure=0.85&reflop=0.3&glowk=0.18&glow=%23ffcf8a&scanc=%23e9cf98" cycle 48
    node kin.mjs "$BASE" kin.json     # the cycle's kinematics, for checking a new capture
    BODY_H=1.904 python pack.py out/GL light out/pack4 && BODY_H=1.904 python pack.py out/GD dark out/pack4   # runs gait.py
    python tile2.py && python emit.py        # then copy out/pack4/walk-*-hi/lo.webp to public/images/hero/walk/
    node still.mjs cmp/x.png "$BASE&..." 0,0.25   # single frames for inspection   # old painted figure vs heel strike / mid-stance / toe-off

`tile2.py` and `emit.py` read `out/divider.json`, which holds the `divider.py` fits:
`{"light":{"b":1375.78,"m":-0.3319},"dark":{"b":1424.13,"m":-0.3218}}`.

## Dressed (2026-09-26)

The founder rejected the bare body as "a naked 3D dummy", so he now wears real garments, fitted to
this exact body. They come from MakeHuman's CC0 system-asset pack
(files2.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip):
- `male_casualsuit02`: a fitted long-sleeve top and trousers
- `shoes06`: low trainers
- `short01`: a short crew cut

`build_mh.py clothes=...` fits each `.mhclo` the way MakeHuman does. Every garment vertex is a
barycentric point on three base-mesh vertices, plus an offset scaled by the body's own
dimensions. Skin weights carry over through the same references. Body faces under clothing are
dropped, but their vertices are kept.

- **Tailoring (`taper=1`):** the offsets are scaled by height, so the trousers come out tapered
  (close at the shin) and the top fitted, instead of the stock loose shirt and straight jeans.
- **Colours:** `render.html` (GARMENT) re-dresses everything in the hero palette: deep navy top
  with a faint champagne seam piping, graphite trousers, graphite trainers on a warm pale
  midsole, dark hair. Only the suit's normal map is used. The stock colour art is not used,
  which also keeps out its logo and the shoe's brand mark.
- **Contact:** foot contact is still measured on the bare foot inside the shoe, lowered by the
  sole thickness (`__soleT`). This keeps HERO_GAIT identical to the undressed measurement
  (65% stance, the same events). Probing the shoe's curved toe gave false events.

    python dress_textures.py <assets dir> models/clothes
    MH_ASSETS=<assets dir> python build_mh.py models/mh-dressed.glb clothes=male_casualsuit02,shoes06,short01 taper=1
    DRESS_L="body=mh-dressed.glb&hair=short01&accentk=0.35&topc=%231a2440&pantc=%232c2d31&pantsheen=%238a8a8e"
    DRESS_D="body=mh-dressed.glb&hair=short01&accentk=0.4&accent=%23c9ad76&topc=%23202a47&pantc=%23303134&pantsheen=%238a8a8e&shoec=%2320242c&solec=%23b9b09c"
    # render with $BASE (drop scan=0.3, and let DRESS_* override body=) plus each theme's light params, then pack/emit as above

**Body and posture (2026-09-26, third brief).** The founder rejected the broad version ("gym-bro",
"neck almost missing", "hunched") and asked for a lean technical male.
- **Body:** `build_mh.py clothes=male_casualsuit02,shoes06,short01 taper=1 muscle=0.58 weight=0.4
  shoulder=0 shouldernarrow=0.15 vshape=0.3 pecs=0.2 dorsi=0.15 necklong=0.8 torsonarrow=0.3
  armslim=0.2 fit_torso=0.6`. The extra targets come from the repo's `makehuman/data/targets/`
  (measure, torso, armslegs, neck).
- **Posture:** `render.html` takes `upright=9&neckfix=0&headfix=-2&clav=8&clavdn=8`. That is
  thoracic extension, a level head, and the shoulders back and down so the neck reads. These are
  constant corrections in the body's axes on top of the capture; legs and arm swing are untouched,
  and HERO_GAIT is unchanged.
- **Trap:** CMU has no spine_03, so a correction applied to a bone the capture does not drive
  ACCUMULATES frame by frame. `fromBind()` resets those bones first. Also check the `.q` query
  files for stray `&`: a `sed` append once swallowed them and the posture silently never applied.
- **When verifying in a mirror:** copy `src/data/hero-walk.ts` together with the atlases. New
  frames with old joint tables put the skeleton overlay off the body.

**The London executive (2026-09-26, fourth brief).** The founder asked for a polished London
business executive walking briskly and confidently: a tailored suit, fitted blazer, crisp shirt,
formal shoes, a visible neck, natural shoulders, upright, "not a mannequin".
- **Garments:** `male_elegantsuit01` (a two-piece suit with shirt collar, cuffs and tie in one
  mesh), `shoes04` (black leather lace-ups), `short01`. `dress_textures.py` turns the suit's stock
  art into a MASK (R = the cloth's own weave, lapel and pocket lines; G = shirt; B = tie, 1.0 on
  its stripe) plus a normal map baked from it. `render.html` (`cloth=male_elegantsuit01`) colours
  it: deep navy by day (#1b2233), charcoal by night (#26282e), off-white shirt, navy tie with a
  champagne stripe, polished black shoes (`shoenrm`, `shoecoat`). No stock colour and no logo.
- **Cut:** `taper=1 fit_torso=0.95 fit_thigh=0.72 fit_shin=0.9 fit_jacket=0.95`. The stock
  trousers are baggy, so a cut under 1 tailors them; the jacket never cuts closer than
  `fit_jacket`, so its skirt hangs over the seat. **Trap (fixed):** `fit_torso`/`fit_thigh`/
  `fit_shin` used to be parsed as per-garment `fit_<asset>` keys and silently ignored, so every
  earlier build ran the default cut.
- `shoecap=0.14` drops shoes04's 22 cm sock sleeve, which only ever showed poking through the hem.
- `under=1` keeps the body under the suit as an inner layer in the suit colour (slot `under`), and
  the jacket's back faces are its lining (`liningc`, given in sRGB because it is written after
  the colour-space step). Without them the armhole and the back vent showed the backdrop.
- **Skin:** natural (`skin=%237a5d4e`, `seg=0`), not graphite; the graphite read as a mannequin.
  Hands are relaxed (`curl=0.6`).
- **Walk:** CMU **07_07**, the same subject walking briskly: 102 steps/min natively (1.175 s,
  exactly the page's `STRIDE_MS` and the rail's founder figure, so there is no time-warp),
  a 1.72 m stride (1.47 m/s), full knee extension at heel strike, 70 degree swing knee,
  pelvis rotation about 15 degrees with thoracic counter-rotation, 5 cm head travel. Its feet need
  `anklefixL=7.6&anklefixR=2` to land flat (heel minus toe at mid stance +0.6 cm, the rest value).
  Measured: stance 62/62%, heel rise at 44%, the opposite heel strike at 50%. 07_09/07_10
  (114 steps/min) look brisker but would contradict the rail's 102.
- The full render queries are `executive-light.q` and `executive-dark.q`; pack with `BODY_H=1.931`.

      python dress_textures.py <assets dir> models/clothes
      MH_ASSETS=<assets dir> python build_mh.py models/mh-exec.glb clothes=male_elegantsuit01,shoes04,short01         taper=1 muscle=0.58 weight=0.4 shoulder=0 shouldernarrow=0.15 vshape=0.3 pecs=0.2 dorsi=0.15         necklong=0.8 torsonarrow=0.3 armslim=0.2 fit_torso=0.95 fit_thigh=0.72 fit_shin=0.9         fit_jacket=0.95 shoecap=0.14 under=1
      node run-render.mjs out/XL "$(cat executive-light.q)" cycle 48
      node run-render.mjs out/XD "$(cat executive-dark.q)" cycle 48
      BODY_H=1.931 python pack.py out/XL light out/pack4 && BODY_H=1.931 python pack.py out/XD dark out/pack4
      python emit.py

**Placement:** `emit.py` puts the soles at 82% of the day plate, level with the clinic figures,
with figH 427 by day and 449 at night. The night value gives the same size and foot line on
screen. The homepage frame (homehero.module.css) keeps that line inside the hero at every
desktop height.

## Rules paid for

- The site never ships three.js for this: frames only, and only the active theme's set,
  prefetched while the HTML is still being parsed.
- A true-speed walk crosses the panel in under a second. So it is a tracking shot: the man
  drifts a little, the ground grain carries the foot speed, and the backdrop (and its reflection
  in the floor) drifts slowly. A moving floor under a still backdrop reads as a treadmill.
- An infinitely tiling backdrop cannot be made from this painting: the ribbon fan is one sweep,
  and a LaMa-synthesized period showed as a flat haze column. Hence the drifting passes that
  dissolve into each other.
- Never alpha WebM (Safari drops VP9 alpha).
- CDP screencast (and the trace filmstrip) pause for ~250ms whenever a hero card opens. The
  display does not: Display::DrawAndSwap keeps running at 60fps, and in-page rAF shows no long
  frames. Judge smoothness by those, not by the capture.

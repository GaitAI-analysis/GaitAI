"""Build a rigged male GLB from MakeHuman's CC0 assets, without MakeHuman or Blender.

base.obj (neutral base mesh) + male macro/measure targets -> body shape
default.mhskel joints (vertex-group means on the SAME mesh)   -> skeleton that fits it
default_weights.mhw (per-vertex weights on the SAME mesh)     -> skinning
Weights of MakeHuman's split bones are merged into a UE-style bone set so the
walker renderer's alias() maps it like any Mixamo/UE rig.

DRESS: clothes=<asset>,<asset>...  fits MakeHuman CC0 clothing proxies (.mhclo, from the
makehuman_system_assets_cc0 pack, folder MH_ASSETS) to the SHAPED body the way MakeHuman does:
every garment vertex is a barycentric point on three base-mesh vertices plus an offset scaled by
the body's own dimensions. Skin weights are carried over through the same references, the body
faces a garment declares hidden (delete_verts) are dropped so skin never shows through, and each
garment is split into material slots (top / pants / shoe / sole / hair) by its UV islands.
fit_<asset>=<k> scales that garment's offsets (k < 1 = closer to the body).

Usage: python build_mh.py <out.glb> [key=value ...]   (see PARAMS)
"""
import json, os, struct, sys
import numpy as np

PARAMS = dict(muscle=0.8, weight=0.48, height=0.62, prop=0.85,
              shoulder=0.5, vshape=0.45, pecs=0.5, dorsi=0.55, waist=0.1, hips=0.6, belly=0.3,
              glutes=0.6, chest=0.3)
out = sys.argv[1]
CLOTHES, FIT = [], {}
for a in sys.argv[2:]:
    k, v = a.split("=")
    if k == "clothes": CLOTHES = [c for c in v.split(",") if c]
    # fit_shin / fit_thigh / fit_torso are the taper=1 cut, not a garment's own fit_<asset>.
    elif k.startswith("fit_") and k not in ("fit_shin", "fit_thigh", "fit_torso"): FIT[k[4:]] = float(v)
    else: PARAMS[k] = float(v)
P = PARAMS

# ---------------------------------------------------------------- mesh
V, F = [], []
group = None
for line in open("3dobjs/base.obj"):
    if line.startswith("v "):
        V.append([float(x) for x in line.split()[1:4]])
    elif line.startswith("g "):
        group = line.split()[1]
    elif line.startswith("f ") and group == "body":
        F.append([int(t.split("/")[0]) - 1 for t in line.split()[1:]])
V = np.array(V, dtype=np.float64)
print("verts", len(V), "body faces", len(F))

def target(path, w):
    if not w: return
    for line in open("targets/" + path + ".target"):
        if line[0] in "#\n": continue
        p = line.split()
        V[int(p[0])] += w * np.array([float(p[1]), float(p[2]), float(p[3])])

# Macro: male, young. muscle/weight in [0,1] with 0.5 = average.
def split(x, lo, hi):
    return {lo: max(0, (0.5 - x) * 2), "average" + hi: 1 - abs(x - 0.5) * 2, "max" + hi: max(0, (x - 0.5) * 2)}
mus = {"minmuscle": max(0, (0.5 - P["muscle"]) * 2), "averagemuscle": 1 - abs(P["muscle"] - 0.5) * 2, "maxmuscle": max(0, (P["muscle"] - 0.5) * 2)}
wt = {"minweight": max(0, (0.5 - P["weight"]) * 2), "averageweight": 1 - abs(P["weight"] - 0.5) * 2, "maxweight": max(0, (P["weight"] - 0.5) * 2)}
for race in ("caucasian", "african", "asian"):
    target(f"macrodetails/{race}-male-young", 1 / 3)
for m, mw in mus.items():
    for w, ww in wt.items():
        k = mw * ww
        if not k: continue
        if not (m == "averagemuscle" and w == "averageweight"):
            target(f"macrodetails/universal-male-young-{m}-{w}", k)
        if P["height"] > 0.5: target(f"macrodetails/height/male-young-{m}-{w}-maxheight", k * (P["height"] - 0.5) * 2)
        if P["prop"] > 0.5: target(f"macrodetails/proportions/male-young-{m}-{w}-idealproportions", k * (P["prop"] - 0.5) * 2)
target("measure/measure-shoulder-dist-incr", P["shoulder"])
target("torso/torso-vshape-incr", P["vshape"])
target("torso/torso-muscle-pectoral-incr", P["pecs"])
target("torso/torso-muscle-dorsi-incr", P["dorsi"])
target("measure/measure-waist-circ-decr", P["waist"])
target("measure/measure-hips-circ-decr", P["hips"])
target("stomach/stomach-pregnant-decr", P["belly"])
target("buttocks/buttocks-volume-decr", P["glutes"])
target("torso/torso-scale-depth-incr", P["chest"])
# SHOULDERS AND NECK (2026-09-26, founder: "shoulders look awkward and low-quality"). The base
# male has sloped, narrow shoulders with no deltoid and a long thin neck, which is what read as a
# mannequin. These are MakeHuman's own shaping targets (CC0), all default 0 so older builds match.
for side in "lr":
    target(f"armslegs/{side}-upperarm-shoulder-muscle-incr", P.get("deltoid", 0))
    target(f"armslegs/{side}-upperarm-muscle-incr", P.get("armmus", 0))
target("measure/measure-neck-height-decr", P.get("neckshort", 0))
target("measure/measure-neck-circ-incr", P.get("neckthick", 0))
target("neck/neck-scale-depth-incr", P.get("neckdepth", 0))
target("bodyshapes/bodyshapes-elvs-man-trapezoid", P.get("trapezoid", 0))
target("bodyshapes/bodyshapes-elvs-man-invert-triangle", P.get("invtri", 0))
target("torso/torso-scale-horiz-incr", P.get("torsow", 0))
# LEANER (2026-09-26, third brief: "shoulders too broad and bulky", "neck almost missing").
target("measure/measure-neck-height-incr", P.get("necklong", 0))
target("measure/measure-shoulder-dist-decr", P.get("shouldernarrow", 0))
target("torso/torso-scale-horiz-decr", P.get("torsonarrow", 0))
target("measure/measure-upperarm-circ-decr", P.get("armslim", 0))

# ---------------------------------------------------------------- skeleton
sk = json.load(open("rigs/default.mhskel"))
J = {k: V[v].mean(0) for k, v in sk["joints"].items()}
head = lambda b: J[sk["bones"][b]["head"]]
tail = lambda b: J[sk["bones"][b]["tail"]]

FACE = ("jaw", "eye", "oris", "levator", "oculi", "orbicularis", "risorius", "temporalis", "tongue", "special")
FING = {"1": "thumb", "2": "index", "3": "middle", "4": "ring", "5": "pinky"}
def target_bone(mh):
    s = "l" if mh.endswith(".L") else "r" if mh.endswith(".R") else ""
    b = mh.split(".")[0]
    if b in ("root",) or b == "pelvis": return "pelvis"
    if b in ("spine05", "spine04"): return "spine_01"
    if b == "spine03": return "spine_02"
    if b in ("spine02", "spine01", "breast"): return "spine_03"
    if b.startswith("neck"): return "neck_01"
    if b == "head" or b.startswith(FACE): return "head"
    if b in ("clavicle", "shoulder01"): return "clavicle_" + s
    if b.startswith("upperarm"): return "upperarm_" + s
    if b.startswith("lowerarm"): return "lowerarm_" + s
    if b in ("wrist",) or b.startswith("metacarpal"): return "hand_" + s
    if b.startswith("finger"):
        f, n = b[6:].split("-"); return f"{FING[f]}_0{n}_{s}"
    if b.startswith("upperleg"): return "thigh_" + s
    if b.startswith("lowerleg"): return "calf_" + s
    if b == "foot": return "foot_" + s
    if b.startswith("toe"): return "ball_" + s
    raise KeyError(mh)

# UE-style bones: name -> (parent, head position)
B = {}
def add(n, parent, pos): B[n] = (parent, np.asarray(pos, float))
add("pelvis", None, head("root"))
add("spine_01", "pelvis", head("spine05"))
add("spine_02", "spine_01", head("spine03"))
add("spine_03", "spine_02", head("spine02"))
add("neck_01", "spine_03", head("neck01"))
add("head", "neck_01", head("head"))
add("head_leaf", "head", tail("head"))
for S, s in (("L", "l"), ("R", "r")):
    add("clavicle_" + s, "spine_03", head("clavicle." + S))
    add("upperarm_" + s, "clavicle_" + s, head("upperarm01." + S))
    add("lowerarm_" + s, "upperarm_" + s, head("lowerarm01." + S))
    add("hand_" + s, "lowerarm_" + s, head("wrist." + S))
    for f, name in FING.items():
        par = "hand_" + s
        for n in (1, 2, 3):
            add(f"{name}_0{n}_{s}", par, head(f"finger{f}-{n}.{S}")); par = f"{name}_0{n}_{s}"
        add(f"{name}_leaf_{s}", par, tail(f"finger{f}-3.{S}"))
    add("thigh_" + s, "pelvis", head("upperleg01." + S))
    add("calf_" + s, "thigh_" + s, head("lowerleg01." + S))
    add("foot_" + s, "calf_" + s, head("foot." + S))
    add("ball_" + s, "foot_" + s, np.mean([head(f"toe{t}-1.{S}") for t in "12345"], 0))
    add("ball_leaf_" + s, "ball_" + s, np.mean([tail(f"toe{t}-{3 if t != '1' else 2}.{S}") for t in "12345"], 0))

# ---------------------------------------------------------------- weights
names = list(B)
idx = {n: i for i, n in enumerate(names)}
W = np.zeros((len(V), len(names)))
for mh, lst in json.load(open("rigs/default_weights.mhw"))["weights"].items():
    t = idx[target_bone(mh)]
    for vi, w in lst: W[vi, t] += w

# ---------------------------------------------------------------- clothes (DRESS)
ASSETS = os.environ.get("MH_ASSETS", "assets")

def garment_slot(name, u, v, h=1.0):
    """Material slot of one face, from its UV centroid (OBJ v: 0 = bottom of the texture)
    and its height above the shoe's lowest point (h, metres)."""
    if name.startswith("shoes") and h < P.get("midsole", 0.022):
        return "sole"
    if name.startswith("male_casualsuit"):
        return "pants" if (u < 0.72 and v < 0.58) else "top"
    if name.startswith("male_elegantsuit"):  # trousers: the two big panels, lower left
        return "pants" if (u < 0.74 and v < 0.53) else "top"
    if name.startswith("shoes"):
        return "sole" if v > 0.76 else "shoe"
    if name.startswith(("short", "hair")):
        return "hair"
    return "top"

def load_garment(name):
    for kind in ("clothes", "hair"):
        d = os.path.join(ASSETS, kind, name)
        if os.path.isdir(d): break
    else:
        raise FileNotFoundError(name)
    hdr, refs, dele, mode = {}, [], set(), None
    for line in open(os.path.join(d, name + ".mhclo"), encoding="utf-8"):
        t = line.split()
        if not t or t[0].startswith("#"): continue
        if t[0] == "verts": mode = "v"; continue
        if t[0] == "delete_verts": mode = "d"; continue
        if mode == "v":
            try: refs.append([float(x) for x in t]); continue
            except ValueError: pass  # a header line inside the block (shoes put `material` here)
        if mode == "d":
            try:
                nums = [x for x in t if x != "-"]
                if "-" in t:
                    i = 0
                    while i < len(t):
                        if i + 2 < len(t) and t[i + 1] == "-": dele.update(range(int(t[i]), int(t[i + 2]) + 1)); i += 3
                        else: dele.add(int(t[i])); i += 1
                else: dele.update(int(x) for x in nums)
                continue
            except ValueError: pass
        hdr[t[0]] = t[1:]
    # The body's own scale along each axis, against the scale the garment was fitted at.
    sc = np.ones(3)
    for ax, key in enumerate(("x_scale", "y_scale", "z_scale")):
        if key in hdr:
            a, b, dist = int(hdr[key][0]), int(hdr[key][1]), float(hdr[key][2])
            sc[ax] = abs(V[a, ax] - V[b, ax]) / dist
    k = FIT.get(name, 1.0)
    # The TAILORED CUT (taper=1): the stock suit is a loose shirt over straight jeans. Its
    # offsets are how far each garment point stands off the skin, so scaling them by height
    # tailors it: close through the shin and ankle (tapered), easing up the thigh and seat,
    # fitted but not painted-on across the chest and arms. Heights are rest-pose, in the
    # base mesh's decimetres, against the body's own knee and hip joints.
    kneeY, hipY = J[sk["bones"]["lowerleg01.L"]["head"]][1], J[sk["bones"]["upperleg01.L"]["head"]][1]
    footY = V[:, 1].min()
    def cut(y):
        if not P.get("taper"): return 1.0
        lo, mid, hi = P.get("fit_shin", 0.35), P.get("fit_thigh", 0.6), P.get("fit_torso", 0.72)
        if y <= kneeY: return lo + (mid - lo) * max(0.0, (y - footY) / (kneeY - footY)) ** 2
        if y <= hipY: return mid + (hi - mid) * (y - kneeY) / (hipY - kneeY)
        return hi
    ov, vt, faces = [], [], []
    for line in open(os.path.join(d, hdr["obj_file"][0]), encoding="utf-8"):
        if line.startswith("v "): ov.append(1)
        elif line.startswith("vt "): vt.append([float(x) for x in line.split()[1:3]])
        elif line.startswith("f "):
            faces.append([(int(q.split("/")[0]) - 1, int(q.split("/")[1]) - 1) for q in line.split()[1:]])
    assert len(ov) == len(refs), (name, len(ov), len(refs))
    vt = np.array(vt)
    # shoecap=<m> (shoes): drop any separate piece of the shoe that rises higher than this above
    # its sole. shoes04 carries a sock-like ankle sleeve (22 cm) that is always under the trouser
    # leg and only ever shows where it pokes through the hem.
    if name.startswith("shoes") and P.get("shoecap"):
        oy = np.array([[float(x) for x in l.split()[1:4]] for l in open(os.path.join(d, hdr["obj_file"][0]), encoding="utf-8") if l.startswith("v ")])[:, 1]
        par = list(range(len(oy)))
        def fd(a):
            while par[a] != a: par[a] = par[par[a]]; a = par[a]
            return a
        for f in faces:
            for q in f[1:]: par[fd(q[0])] = fd(f[0][0])
        top = {}
        for f in faces:
            r = fd(f[0][0]); top[r] = max(top.get(r, -1e9), max(oy[q[0]] for q in f))
        cap = oy.min() + P["shoecap"] * 10  # the obj is in decimetres
        n0 = len(faces); faces = [f for f in faces if top[fd(f[0][0])] <= cap]
        print(f"  {name}: shoecap dropped {n0 - len(faces)} faces")
    # A SUIT JACKET (fit_jacket, male_elegantsuit): the jacket's skirt hangs over the seat, so
    # its points never cut closer than fit_jacket, while the trousers under it follow the taper.
    jacket = set()
    if name.startswith("male_elegantsuit") and P.get("fit_jacket"):
        for f in faces:
            uvc = vt[[q[1] for q in f]].mean(0)
            if garment_slot(name, uvc[0], uvc[1]) == "top": jacket.update(q[0] for q in f)
    gp = np.zeros((len(refs), 3)); gw = np.zeros((len(refs), W.shape[1]))
    for i, r in enumerate(refs):
        if len(r) == 1:
            gp[i] = V[int(r[0])]; gw[i] = W[int(r[0])]
        else:
            v1, v2, v3 = int(r[0]), int(r[1]), int(r[2]); w = r[3:6]; off = np.array(r[6:9])
            base = w[0] * V[v1] + w[1] * V[v2] + w[2] * V[v3]
            c = cut(base[1]) if name.startswith(("male_casualsuit", "male_elegantsuit")) else 1.0
            if i in jacket: c = max(c, P["fit_jacket"])
            gp[i] = base + off * sc * k * c
            gw[i] = w[0] * W[v1] + w[1] * W[v2] + w[2] * W[v3]
    return dict(name=name, pos=gp, w=gw, uv=vt, faces=faces, dele=dele, z=int(hdr.get("z_depth", ["0"])[0]))

GARMENTS = [load_garment(c) for c in CLOTHES]
hidden = set().union(*[g["dele"] for g in GARMENTS]) if GARMENTS else set()
F_ALL = F
if hidden:
    n0 = len(F); F = [f for f in F if not any(i in hidden for i in f)]
    print(f"clothes {CLOTHES}: body faces {n0} -> {len(F)} (hidden under clothing)")
# under=1 (a full suit): the body faces under the clothes come back as an INNER LAYER in the
# suit's colour (material slot "under"), so a glimpse through the armhole or the back vent, or a
# point of the body pressing through the cloth, reads as suit, never as backdrop or skin. The
# feet (inside the shoes) and the scalp (under the hair) are left out.
UNDER = []
if hidden and P.get("under"):
    def heavy(names_):
        c = [idx[n] for n in names if n.startswith(names_)]
        return W[:, c].sum(1) > 0.3 * np.maximum(W.sum(1), 1e-9)
    skip = heavy(("foot", "ball", "head"))
    UNDER = [f for f in F_ALL if any(i in hidden for i in f) and not any(skip[i] for i in f)]
    print(f"under: {len(UNDER)} inner faces")
# hidebody=1 (a full suit): also drop the body faces that are skinned entirely to bones the suit
# always covers (trunk, arms to the cuff, legs, feet). Garments leave small gaps (the jacket's
# back vent, the cuffs in motion) where skin would otherwise flash through. Head, neck and hands stay.
if GARMENTS and P.get("hidebody"):
    cov = [idx[n] for n in names if n in ("pelvis", "spine_01", "spine_02", "spine_03") or n.startswith(("clavicle", "upperarm", "lowerarm", "thigh", "calf", "foot", "ball"))]
    covered = W[:, cov].sum(1) >= 0.98 * np.maximum(W.sum(1), 1e-9)
    n0 = len(F); F = [f for f in F if not all(covered[i] for i in f)]
    print(f"hidebody: body faces {n0} -> {len(F)}")

# ---------------------------------------------------------------- compact to body verts, units, floor
# Vertices under clothing stay in the mesh without faces: the renderer measures foot contact
# on the bare foot inside the shoe (the same probe as the undressed body), and never draws them.
used = sorted({i for f in F_ALL for i in f})
remap = {o: n for n, o in enumerate(used)}
pos = V[used] * 0.1  # MakeHuman decimetres -> metres
Wb = W[used]
floor = min([pos[:, 1].min()] + [g["pos"][:, 1].min() * 0.1 for g in GARMENTS])
pos[:, 1] -= floor
for n in B: B[n] = (B[n][0], B[n][1] * 0.1 - np.array([0, floor, 0]))
tris = []
for f in F:
    f = [remap[i] for i in f]
    tris += [[f[0], f[1], f[2]]] + ([[f[0], f[2], f[3]]] if len(f) == 4 else [])
tris = np.array(tris, dtype=np.uint32)
utris = []
for f in UNDER:
    f = [remap[i] for i in f]
    utris += [[f[0], f[1], f[2]]] + ([[f[0], f[2], f[3]]] if len(f) == 4 else [])

# Eyes: the base body has open sockets; the eyeballs are a separate MakeHuman proxy.
def sphere(c, r, n=10):
    vs, ts = [], []
    for i in range(n + 1):
        th = np.pi * i / n
        for j in range(n * 2):
            ph = 2 * np.pi * j / (n * 2)
            vs.append(c + r * np.array([np.sin(th) * np.cos(ph), np.cos(th), np.sin(th) * np.sin(ph)]))
    for i in range(n):
        for j in range(n * 2):
            a = i * n * 2 + j; b = i * n * 2 + (j + 1) % (n * 2); c2 = a + n * 2; d = b + n * 2
            ts += [[a, c2, b], [b, c2, d]]
    return np.array(vs), np.array(ts)
for S in "LR":
    c = (J[sk["bones"]["eye." + S]["head"]] * 0.1) - np.array([0, floor, 0])
    sv, st = sphere(c, 0.0118)
    st = st + len(pos); pos = np.vstack([pos, sv]); tris = np.vstack([tris, st])
    ew = np.zeros((len(sv), len(names))); ew[:, idx["head"]] = 1; Wb = np.vstack([Wb, ew])

# Top-4 influences
order = np.argsort(-Wb, 1)[:, :4]
w4 = np.take_along_axis(Wb, order, 1)
w4[w4.sum(1) == 0, 0] = 1
w4 /= w4.sum(1, keepdims=True)
j4 = order.astype(np.uint16)
unweighted = int((Wb.sum(1) == 0).sum())

# Smooth normals
nrm = np.zeros_like(pos)
fn = np.cross(pos[tris[:, 1]] - pos[tris[:, 0]], pos[tris[:, 2]] - pos[tris[:, 0]])
for k in range(3): np.add.at(nrm, tris[:, k], fn)
nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-12

# ---------------------------------------------------------------- GLB
buf = bytearray(); views = []; accs = []
def blob(arr, target=None, comp=5126, typ="VEC3", mm=False):
    global buf
    while len(buf) % 4: buf += b"\0"
    data = arr.tobytes(); off = len(buf); buf += data
    views.append({"buffer": 0, "byteOffset": off, "byteLength": len(data), **({"target": target} if target else {})})
    a = {"bufferView": len(views) - 1, "componentType": comp, "count": len(arr), "type": typ}
    if mm: a["min"] = arr.min(0).tolist(); a["max"] = arr.max(0).tolist()
    accs.append(a); return len(accs) - 1
aP = blob(pos.astype(np.float32), 34962, mm=True)
aN = blob(nrm.astype(np.float32), 34962)
aJ = blob(j4, 34962, 5123, "VEC4")
aW = blob(w4.astype(np.float32), 34962, 5126, "VEC4")
aI = blob(tris.astype(np.uint32).reshape(-1), 34963, 5125, "SCALAR")
ibm = np.stack([np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [-B[n][1][0], -B[n][1][1], -B[n][1][2], 1]], np.float32).reshape(-1) for n in names])
aB = blob(ibm, None, 5126, "MAT4")
SLOTS = ["skin", "top", "pants", "shoe", "sole", "hair", "under"]
aU = blob(np.array(utris, dtype=np.uint32).reshape(-1), 34963, 5125, "SCALAR") if utris else None
gmeshes = []
for g in GARMENTS:
    gp = g["pos"] * 0.1 - np.array([0, floor, 0])
    # Smooth normals on the garment's own vertices (before UV seams split them).
    gtris = []
    for f in g["faces"]:
        idx3 = [q[0] for q in f]
        gtris += [[idx3[0], idx3[1], idx3[2]]] + ([[idx3[0], idx3[2], idx3[3]]] if len(idx3) == 4 else [])
    gtris = np.array(gtris)
    gn = np.zeros_like(gp)
    fn2 = np.cross(gp[gtris[:, 1]] - gp[gtris[:, 0]], gp[gtris[:, 2]] - gp[gtris[:, 0]])
    for kk in range(3): np.add.at(gn, gtris[:, kk], fn2)
    gn /= np.linalg.norm(gn, axis=1, keepdims=True) + 1e-12
    order_g = np.argsort(-g["w"], 1)[:, :4]
    gw4 = np.take_along_axis(g["w"], order_g, 1); gw4[gw4.sum(1) == 0, 0] = 1; gw4 /= gw4.sum(1, keepdims=True)
    prims = {}
    for f in g["faces"]:
        uvc = g["uv"][[q[1] for q in f]].mean(0)
        hc = gp[[q[0] for q in f], 1].mean() - gp[:, 1].min()
        slot = garment_slot(g["name"], uvc[0], uvc[1], hc)
        prims.setdefault(slot, []).append(f)
    out_prims = []
    for slot, fl in prims.items():
        keymap, vi_list, ti_list, tl = {}, [], [], []
        for f in fl:
            ids = []
            for (vi, ti) in f:
                if (vi, ti) not in keymap: keymap[(vi, ti)] = len(vi_list); vi_list.append(vi); ti_list.append(ti)
                ids.append(keymap[(vi, ti)])
            tl += [[ids[0], ids[1], ids[2]]] + ([[ids[0], ids[2], ids[3]]] if len(ids) == 4 else [])
        vi_a = np.array(vi_list); uv = g["uv"][np.array(ti_list)].copy(); uv[:, 1] = 1 - uv[:, 1]
        attrs = {"POSITION": blob(gp[vi_a].astype(np.float32), 34962, mm=True),
                 "NORMAL": blob(gn[vi_a].astype(np.float32), 34962),
                 "TEXCOORD_0": blob(uv.astype(np.float32), 34962, 5126, "VEC2"),
                 "JOINTS_0": blob(order_g[vi_a].astype(np.uint16), 34962, 5123, "VEC4"),
                 "WEIGHTS_0": blob(gw4[vi_a].astype(np.float32), 34962, 5126, "VEC4")}
        out_prims.append({"attributes": attrs, "indices": blob(np.array(tl, dtype=np.uint32).reshape(-1), 34963, 5125, "SCALAR"), "material": SLOTS.index(slot)})
        print(f"  {g['name']} -> {slot}: {len(vi_a)} verts {len(tl)} tris")
    gmeshes.append({"name": g["name"], "primitives": out_prims})
nodes = []
for n in names:
    par, p = B[n]
    t = p - (B[par][1] if par else 0)
    nodes.append({"name": n, "translation": [float(x) for x in t]})
for i, n in enumerate(names):
    ch = [j for j, m in enumerate(names) if B[m][0] == n]
    if ch: nodes[i]["children"] = ch
mesh_node = len(nodes)
nodes.append({"name": "body", "mesh": 0, "skin": 0})
gnodes = []
for gi, gm in enumerate(gmeshes):
    gnodes.append(len(nodes)); nodes.append({"name": gm["name"], "mesh": 1 + gi, "skin": 0})
root_node = len(nodes)
nodes.append({"name": "MakeHumanMale", "children": [idx["pelvis"], mesh_node] + gnodes})
gltf = {
    "asset": {"version": "2.0", "generator": "GaitAI build_mh.py (MakeHuman CC0 assets)", "copyright": "MakeHuman assets CC0 1.0"},
    "scene": 0, "scenes": [{"nodes": [root_node]}], "nodes": nodes,
    "meshes": [{"name": "body", "primitives": [{"attributes": {"POSITION": aP, "NORMAL": aN, "JOINTS_0": aJ, "WEIGHTS_0": aW}, "indices": aI, "material": 0}] + ([{"attributes": {"POSITION": aP, "NORMAL": aN, "JOINTS_0": aJ, "WEIGHTS_0": aW}, "indices": aU, "material": SLOTS.index("under")}] if aU is not None else [])}] + gmeshes,
    "materials": [{"name": m, "pbrMetallicRoughness": {"baseColorFactor": [0.25, 0.27, 0.32, 1], "metallicFactor": 0.1, "roughnessFactor": 0.5}} for m in SLOTS],
    "skins": [{"joints": list(range(len(names))), "inverseBindMatrices": aB, "skeleton": idx["pelvis"]}],
    "accessors": accs, "bufferViews": views, "buffers": [{"byteLength": len(buf)}],
}
js = json.dumps(gltf, separators=(",", ":")).encode()
while len(js) % 4: js += b" "
while len(buf) % 4: buf += b"\0"
with open(out, "wb") as fh:
    fh.write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(buf)))
    fh.write(struct.pack("<II", len(js), 0x4E4F534A)); fh.write(js)
    fh.write(struct.pack("<II", len(buf), 0x004E4942)); fh.write(buf)
h = pos[:, 1].max()
sh = np.linalg.norm(B["upperarm_l"][1] - B["upperarm_r"][1]); hp = np.linalg.norm(B["thigh_l"][1] - B["thigh_r"][1])
xs = pos[:, 0]; ys = pos[:, 1]
def width(y0, y1): m = (ys > y0 * h) & (ys < y1 * h) & (np.abs(xs) < 0.25); return xs[m].max() - xs[m].min()
print(f"wrote {out}: {len(pos)} verts {len(tris)} tris {len(names)} bones, height {h:.3f} m, unweighted {unweighted}")
if not GARMENTS: print(f"shoulder joints {sh:.3f} m, hip joints {hp:.3f} m, ratio {sh / hp:.2f}; body width chest {width(0.70, 0.74):.3f} waist {width(0.58, 0.61):.3f} hips {width(0.49, 0.52):.3f}")
print("arm rest dir L", ((B["lowerarm_l"][1] - B["upperarm_l"][1]) / np.linalg.norm(B["lowerarm_l"][1] - B["upperarm_l"][1])).round(3))

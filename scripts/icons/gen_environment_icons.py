"""GaitAI LIGHT environment icon family — SVG masters (512x512, transparent).

Pipeline: this → rasterize_icons.mjs (Chromium, transparent PNG) → export_icons.py
(WebP 512 master + 128 rung into public/assets/icons/light/environments/) →
contact_sheet.py (docs/icons/environment-icons-contact-sheet.png).

One construction for all eighteen: a pearl "glass" body with a graphite
outline and a specular highlight, one movement cue in cyan/teal/sapphire
(a path, an arc, joint nodes), a restrained violet or champagne detail where
the environment earns it, and one soft blue-grey ground shadow. Objects fill
~70% of the canvas so they read at 40-56px.
"""
import sys
from pathlib import Path

# Usage: python scripts/icons/gen_environment_icons.py [out-dir]   (default tmp/icons/svg)
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "tmp/icons/svg")
OUT.mkdir(parents=True, exist_ok=True)

PEARL, PEARL_DEEP = "#F8FBFF", "#DCE6F2"
GRAPHITE, GRAPHITE_2 = "#122033", "#172238"
CYAN, TEAL, SAPPHIRE, VIOLET, GOLD = "#19C6E8", "#17B8B1", "#2E6BF6", "#7557E8", "#C8A24A"
SW = 8  # graphite outline at 512 → ~0.75px at 48
OL = f'stroke="{GRAPHITE_2}" stroke-width="{SW}" stroke-opacity="0.72"'

DEFS = f"""
<defs>
  <linearGradient id="pearl" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.45" stop-color="{PEARL}"/><stop offset="1" stop-color="#D6E1EF"/>
  </linearGradient>
  <linearGradient id="innerShade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#9FB3CC" stop-opacity="0"/><stop offset="0.55" stop-color="#9FB3CC" stop-opacity="0"/><stop offset="1" stop-color="#8FA5C2" stop-opacity="0.45"/>
  </linearGradient>
  <linearGradient id="edgeCyan" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="{CYAN}" stop-opacity="0"/><stop offset="0.5" stop-color="{CYAN}" stop-opacity="0.9"/><stop offset="1" stop-color="{CYAN}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="pearlSide" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#EDF3FA"/><stop offset="1" stop-color="{PEARL_DEEP}"/>
  </linearGradient>
  <linearGradient id="pearlTop" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F1F6FC"/>
  </linearGradient>
  <linearGradient id="cyan" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="{CYAN}"/><stop offset="1" stop-color="{TEAL}"/>
  </linearGradient>
  <linearGradient id="sapphire" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#4C86FF"/><stop offset="1" stop-color="{SAPPHIRE}"/>
  </linearGradient>
  <linearGradient id="violet" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#8F76F2"/><stop offset="1" stop-color="{VIOLET}"/>
  </linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#E7CF86"/><stop offset="1" stop-color="{GOLD}"/>
  </linearGradient>
  <linearGradient id="graphite" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0" stop-color="#2A3B58"/><stop offset="1" stop-color="{GRAPHITE}"/>
  </linearGradient>
  <linearGradient id="spec" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="ground" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#1E3A8A" stop-opacity="0.3"/><stop offset="1" stop-color="#1E3A8A" stop-opacity="0"/>
  </radialGradient>
  <filter id="drop" x="-20%" y="-20%" width="140%" height="150%">
    <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#1E3A8A" flood-opacity="0.18"/>
  </filter>
  <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="9"/>
  </filter>
</defs>
"""

def svg(body, ground=(256, 452, 150, 22)):
    gx, gy, rx, ry = ground
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">{DEFS}
<ellipse cx="{gx}" cy="{gy}" rx="{rx}" ry="{ry}" fill="url(#ground)"/>
<g filter="url(#drop)">
{body}
</g>
</svg>"""

# ── primitives ──────────────────────────────────────────────────────────────
def glass(x, y, w, h, r=26, fill="url(#pearl)"):
    """A pearl slab: gradient body, bottom inner shade, soft outline, specular top edge, cyan edge glint."""
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" {OL}/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="url(#innerShade)"/>'
            f'<rect x="{x+14}" y="{y+8}" width="{w-28}" height="{min(h*0.42, 70)}" rx="{max(r-10, 6)}" fill="url(#spec)" opacity="0.85"/>'
            f'<rect x="{x+r}" y="{y-2}" width="{w-2*r}" height="5" rx="2.5" fill="url(#edgeCyan)" opacity="0.7"/>')

def box3d(x, y, w, h, d=34, r=16):
    """An extruded pearl block: front face, top face, right face."""
    top = f'<path d="M{x} {y} L{x+d} {y-d} L{x+w+d} {y-d} L{x+w} {y} Z" fill="url(#pearlTop)" {OL} stroke-linejoin="round"/>'
    side = f'<path d="M{x+w} {y} L{x+w+d} {y-d} L{x+w+d} {y+h-d} L{x+w} {y+h} Z" fill="url(#pearlSide)" {OL} stroke-linejoin="round"/>'
    front = (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="url(#pearl)" {OL}/>'
             f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="url(#innerShade)"/>')
    spec = f'<rect x="{x+16}" y="{y+10}" width="{w-32}" height="46" rx="10" fill="url(#spec)" opacity="0.75"/>'
    edge = f'<rect x="{x+r}" y="{y-2}" width="{w-2*r}" height="5" rx="2.5" fill="url(#edgeCyan)" opacity="0.7"/>'
    return side + top + front + spec + edge

def windows(x, y, cols, rows, cw=26, ch=30, gap=16, fill=GRAPHITE_2, op=0.85):
    out = []
    for r in range(rows):
        for c in range(cols):
            out.append(f'<rect x="{x + c*(cw+gap)}" y="{y + r*(ch+gap)}" width="{cw}" height="{ch}" rx="5" fill="{fill}" opacity="{op}"/>')
    return "".join(out)

def cue(d, stroke="url(#cyan)", w=16, glowc=CYAN, dash=None):
    """A movement cue: a stroked path with a soft glow beneath it."""
    da = f' stroke-dasharray="{dash}"' if dash else ""
    return (f'<path d="{d}" fill="none" stroke="{glowc}" stroke-width="{w+16}" stroke-linecap="round" opacity="0.28" filter="url(#glow)"/>'
            f'<path d="{d}" fill="none" stroke="{stroke}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"{da}/>')

def node(cx, cy, r=15, fill="url(#cyan)"):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r+9}" fill="{CYAN}" opacity="0.22"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="#FFFFFF" stroke-width="5"/>')

def figure(x, y, s=1.0, fill="url(#graphite)", joints=True, lean=0, stride=1.0):
    """A walking person: head, torso pill, two legs. Joint nodes in cyan."""
    body = (f'<circle cx="0" cy="-118" r="26" fill="{fill}"/>'
            f'<rect x="-24" y="-88" width="48" height="96" rx="24" fill="{fill}"/>'
            f'<path d="M-10 6 L{-34*stride} 92" stroke="{fill}" stroke-width="26" stroke-linecap="round"/>'
            f'<path d="M12 6 L{36*stride} 78 L{48*stride} 96" stroke="{fill}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
            f'<path d="M-18 -70 L-46 -12" stroke="{fill}" stroke-width="20" stroke-linecap="round"/>'
            f'<path d="M18 -70 L44 -20" stroke="{fill}" stroke-width="20" stroke-linecap="round"/>')
    if joints:
        body += (f'<circle cx="0" cy="0" r="11" fill="{CYAN}" stroke="#fff" stroke-width="4"/>'
                 f'<circle cx="{36*stride}" cy="78" r="9" fill="{CYAN}" stroke="#fff" stroke-width="4"/>'
                 f'<circle cx="{-34*stride}" cy="92" r="9" fill="{CYAN}" stroke="#fff" stroke-width="4"/>')
    return f'<g transform="translate({x} {y}) scale({s}) rotate({lean})">{body}</g>'

def shield_path(cx, cy, w, h):
    return (f"M{cx} {cy-h/2} L{cx+w/2} {cy-h/2+h*0.18} V{cy+h*0.08} "
            f"C{cx+w/2} {cy+h*0.32} {cx+w*0.22} {cy+h*0.44} {cx} {cy+h/2} "
            f"C{cx-w*0.22} {cy+h*0.44} {cx-w/2} {cy+h*0.32} {cx-w/2} {cy+h*0.08} V{cy-h/2+h*0.18} Z")

# ── the eighteen ────────────────────────────────────────────────────────────
ICONS = {}

# MobilityCare ---------------------------------------------------------------
ICONS["physio"] = svg(
    glass(64, 276, 384, 60, r=18) +
    f'<rect x="100" y="336" width="24" height="88" rx="8" fill="url(#graphite)"/>'
    f'<rect x="388" y="336" width="24" height="88" rx="8" fill="url(#graphite)"/>'
    f'<rect x="76" y="238" width="150" height="48" rx="22" fill="url(#pearlSide)" {OL}/>'
    f'<rect x="90" y="246" width="100" height="18" rx="9" fill="url(#spec)" opacity="0.85"/>'
    f'<path d="M232 268 L322 176" stroke="url(#graphite)" stroke-width="44" stroke-linecap="round"/>'
    f'<path d="M322 176 L420 246" stroke="url(#graphite)" stroke-width="38" stroke-linecap="round"/>'
    f'<path d="M420 246 L466 226" stroke="url(#graphite)" stroke-width="28" stroke-linecap="round"/>'
    + cue("M214 134 C262 78 372 82 428 136", w=14)
    + node(232, 268, 14) + node(322, 176, 15) + node(420, 246, 12),
    ground=(256, 448, 200, 20))

ICONS["hospitals"] = svg(
    box3d(96, 178, 280, 250, d=38, r=14) +
    windows(130, 226, 4, 2, cw=30, ch=34, gap=22) +
    f'<rect x="212" y="356" width="48" height="72" rx="10" fill="url(#cyan)"/>'           # entrance
    f'<rect x="150" y="332" width="172" height="16" rx="8" fill="{GRAPHITE_2}" opacity="0.9"/>'  # canopy
    f'<rect x="120" y="112" width="96" height="96" rx="22" fill="url(#pearl)" {OL}/>'
    f'<rect x="158" y="132" width="20" height="56" rx="6" fill="url(#sapphire)"/>'
    f'<rect x="140" y="150" width="56" height="20" rx="6" fill="url(#sapphire)"/>'
    + cue("M392 420 C420 372 444 340 470 320", w=12) + node(470, 318, 11),
    ground=(256, 452, 200, 22))

ICONS["sports"] = svg(
    cue("M78 300 C140 190 250 130 420 160", w=16) +
    figure(268, 300, s=1.15, lean=-14, stride=1.35) +
    f'<path d="M96 388 L200 388 M236 388 L300 388" {OL} stroke-linecap="round" opacity="0.5"/>'
    + node(420, 160, 14, fill="url(#gold)"),
    ground=(256, 448, 170, 22))

ICONS["elderly"] = svg(
    cue("M120 400 C190 330 320 330 392 400", stroke="url(#cyan)", w=14) +
    figure(198, 292, s=1.05, stride=0.7) +
    f'<path d="M262 220 L262 396" stroke="{GRAPHITE_2}" stroke-width="16" stroke-linecap="round"/>'  # cane
    f'<path d="M244 222 L282 222" stroke="{GRAPHITE_2}" stroke-width="16" stroke-linecap="round"/>'
    # caregiver: pearl figure with graphite outline, hand at the senior's shoulder
    f'<g transform="translate(336 296) scale(1.0)">'
    f'<circle cx="0" cy="-118" r="26" fill="url(#pearl)" {OL}/>'
    f'<rect x="-24" y="-88" width="48" height="96" rx="24" fill="url(#pearl)" {OL}/>'
    f'<path d="M-10 6 L-22 96 M12 6 L28 96" stroke="{GRAPHITE_2}" stroke-width="{SW+8}" stroke-linecap="round"/>'
    f'<path d="M-18 -70 L-92 -40" stroke="{GRAPHITE_2}" stroke-width="{SW+8}" stroke-linecap="round"/>'
    f'</g>'
    + f'<path d="M262 152 C262 130 290 130 290 152 C290 170 262 186 262 186 C262 186 234 170 234 152 C234 130 262 130 262 152 Z" fill="url(#violet)" transform="translate(150 -74) scale(0.9)"/>',
    ground=(266, 452, 170, 22))

ICONS["neuro"] = svg(
    f'<path d="M150 236 C112 236 100 190 130 168 C118 130 160 100 196 116 C214 84 268 84 284 112 C322 92 372 116 366 158 C404 170 408 226 372 246 C378 288 336 314 300 296 L300 322 C300 344 272 356 250 344 L212 322 C184 334 150 318 150 290 C122 286 110 254 150 236 Z" fill="url(#pearl)" {OL} stroke-linejoin="round"/>'
    f'<path d="M150 236 C112 236 100 190 130 168 C118 130 160 100 196 116 C214 84 268 84 284 112 C322 92 372 116 366 158 C404 170 408 226 372 246 C378 288 336 314 300 296 L300 322 C300 344 272 356 250 344 L212 322 C184 334 150 318 150 290 C122 286 110 254 150 236 Z" fill="url(#innerShade)"/>'
    f'<path d="M256 104 C240 150 244 200 258 236 C268 266 262 300 256 340" fill="none" stroke="{GRAPHITE_2}" stroke-width="{SW-1}" stroke-linecap="round" opacity="0.72"/>'
    f'<path d="M172 176 C196 168 212 190 200 214 M186 262 C208 250 230 268 226 292 M336 176 C312 168 296 190 308 214 M322 262 C300 250 280 268 284 292" fill="none" stroke="{GRAPHITE_2}" stroke-width="{SW-2}" stroke-linecap="round" opacity="0.6"/>'
    f'<rect x="176" y="112" width="96" height="30" rx="15" fill="url(#spec)" opacity="0.85"/>'
    + cue("M312 384 L364 410 L424 356 L474 402", stroke="url(#cyan)", w=12)
    + node(312, 384, 12) + node(364, 410, 12) + node(424, 356, 12, fill="url(#violet)") + node(474, 402, 12),
    ground=(256, 452, 170, 22))

ICONS["homecare"] = svg(
    f'<path d="M100 250 L256 116 L412 250 Z" fill="url(#pearlTop)" {OL} stroke-linejoin="round"/>'
    + glass(132, 246, 248, 174, r=16) +
    f'<rect x="230" y="342" width="52" height="78" rx="10" fill="url(#cyan)"/>'
    # telehealth screen with a pulse
    f'<rect x="156" y="270" width="200" height="60" rx="12" fill="#FFFFFF" stroke="{GRAPHITE_2}" stroke-width="{SW-2}"/>'
    + cue("M170 300 L210 300 L226 280 L244 320 L262 292 L280 306 L296 300 L340 300", stroke="url(#cyan)", w=9)
    + cue("M424 232 C448 232 466 250 466 274", stroke="url(#sapphire)", w=10, glowc=SAPPHIRE)
    + cue("M424 196 C470 196 502 228 502 274", stroke="url(#sapphire)", w=10, glowc=SAPPHIRE)
    + node(424, 274, 11, fill="url(#sapphire)"),
    ground=(256, 452, 190, 22))

ICONS["fitness"] = svg(
    f'<rect x="118" y="246" width="276" height="26" rx="13" fill="url(#graphite)"/>'
    + glass(60, 196, 74, 126, r=18) + glass(378, 196, 74, 126, r=18)
    + f'<rect x="90" y="176" width="52" height="166" rx="16" fill="url(#pearlSide)" {OL}/>'
    + f'<rect x="370" y="176" width="52" height="166" rx="16" fill="url(#pearlSide)" {OL}/>'
    + f'<rect x="60" y="196" width="74" height="12" rx="6" fill="url(#sapphire)"/><rect x="378" y="196" width="74" height="12" rx="6" fill="url(#sapphire)"/>'
    + cue("M120 384 L196 384 L222 350 L250 412 L278 370 L300 392 L392 392", stroke="url(#cyan)", w=12),
    ground=(256, 452, 200, 22))

ICONS["schools"] = svg(
    cue("M96 396 C170 360 300 360 416 300", stroke="url(#violet)", w=13, glowc=VIOLET) +
    figure(212, 318, s=0.92, stride=1.1) +
    f'<circle cx="352" cy="346" r="40" fill="url(#pearl)" {OL}/>'
    f'<path d="M318 330 C340 322 364 322 386 330 M318 362 C340 370 364 370 386 362" fill="none" stroke="{GRAPHITE_2}" stroke-width="{SW-3}" opacity="0.8"/>'
    f'<path d="M352 306 L352 386" stroke="{GRAPHITE_2}" stroke-width="{SW-3}" opacity="0.8"/>'
    + node(416, 300, 13, fill="url(#gold)"),
    ground=(256, 448, 180, 22))

ICONS["prosthetics"] = svg(
    # socket (pearl), pylon (graphite), knee node, foot plate
    f'<path d="M198 120 L318 120 L300 230 L216 230 Z" fill="url(#pearl)" {OL} stroke-linejoin="round"/>'
    f'<rect x="212" y="128" width="88" height="26" rx="10" fill="url(#spec)" opacity="0.8"/>'
    f'<rect x="242" y="228" width="32" height="150" rx="10" fill="url(#graphite)"/>'
    f'<path d="M258 378 L258 404 L338 404" stroke="url(#graphite)" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
    f'<rect x="222" y="392" width="140" height="26" rx="12" fill="url(#pearlSide)" {OL}/>'
    + cue("M330 176 C400 200 430 260 402 330", stroke="url(#sapphire)", w=12, glowc=SAPPHIRE)
    + node(258, 236, 16) + node(258, 380, 12) + node(402, 330, 11, fill="url(#sapphire)"),
    ground=(276, 452, 150, 20))

ICONS["insurance"] = svg(
    f'<path d="{shield_path(256, 260, 300, 340)}" fill="url(#pearl)" {OL} stroke-linejoin="round"/>'
    f'<path d="{shield_path(256, 260, 300, 340)}" fill="none" stroke="url(#sapphire)" stroke-width="8" opacity="0.65" transform="translate(256 260) scale(0.86) translate(-256 -260)"/>'
    f'<rect x="150" y="112" width="212" height="52" rx="18" fill="url(#spec)" opacity="0.75"/>'
    + cue("M150 322 L206 300 L256 318 L306 270 L362 236", stroke="url(#cyan)", w=13)
    + node(150, 322, 11) + node(256, 318, 11) + node(362, 236, 13, fill="url(#sapphire)"),
    ground=(256, 452, 160, 22))

ICONS["trials"] = svg(
    # microscope: base, arm, tube, stage, lens glow
    f'<rect x="140" y="386" width="230" height="34" rx="16" fill="url(#graphite)"/>'
    f'<path d="M318 386 C356 320 352 250 300 206" stroke="url(#graphite)" stroke-width="32" stroke-linecap="round" fill="none"/>'
    f'<rect x="196" y="98" width="70" height="186" rx="24" fill="url(#pearl)" {OL} transform="rotate(-18 231 190)"/>'
    f'<rect x="206" y="108" width="40" height="40" rx="14" fill="url(#spec)" opacity="0.8" transform="rotate(-18 231 190)"/>'
    f'<rect x="150" y="300" width="170" height="26" rx="12" fill="url(#pearlSide)" {OL}/>'  # stage
    f'<circle cx="290" cy="288" r="26" fill="{CYAN}" opacity="0.3" filter="url(#glow)"/>'
    + node(290, 288, 14)
    + cue("M372 150 L404 150 M372 184 L436 184 M372 218 L420 218", stroke="url(#sapphire)", w=10, glowc=SAPPHIRE),
    ground=(256, 452, 190, 22))

# SecureVision ---------------------------------------------------------------
ICONS["airports"] = svg(
    cue("M80 400 C160 320 300 300 440 200", stroke="url(#cyan)", w=13, dash="26 22") +
    # runway
    f'<path d="M70 424 L440 424" {OL} stroke-linecap="round" opacity="0.55" stroke-dasharray="34 22"/>'
    # airplane body + wings + tail
    f'<g transform="translate(256 210) rotate(-22)">'
    f'<path d="M-160 0 C-160 -28 -130 -34 -100 -34 L120 -34 C160 -34 190 -10 190 0 C190 10 160 34 120 34 L-100 34 C-130 34 -160 28 -160 0 Z" fill="url(#pearl)" {OL}/>'
    f'<path d="M-10 -30 L-90 -130 L-40 -130 L60 -30 Z" fill="url(#pearlSide)" {OL} stroke-linejoin="round"/>'
    f'<path d="M-10 30 L-90 130 L-40 130 L60 30 Z" fill="url(#pearlSide)" {OL} stroke-linejoin="round"/>'
    f'<path d="M-160 -8 L-206 -70 L-172 -70 L-120 -8 Z" fill="url(#sapphire)" {OL} stroke-linejoin="round"/>'
    f'<rect x="-60" y="-26" width="150" height="16" rx="8" fill="url(#spec)" opacity="0.8"/>'
    f'<rect x="120" y="-10" width="52" height="20" rx="10" fill="{GRAPHITE_2}" opacity="0.85"/>'
    f'</g>'
    + node(440, 200, 13),
    ground=(256, 452, 200, 20))

ICONS["smartcities"] = svg(
    box3d(72, 250, 96, 176, d=26, r=10) + windows(92, 274, 2, 3, cw=24, ch=26, gap=16) +
    box3d(212, 150, 110, 276, d=30, r=10) + windows(236, 178, 2, 5, cw=26, ch=28, gap=18) +
    box3d(372, 216, 84, 210, d=24, r=10) + windows(390, 244, 2, 4, cw=22, ch=26, gap=14) +
    cue("M60 462 C150 430 210 470 300 440 C360 420 400 450 470 420", stroke="url(#cyan)", w=12) +
    node(150, 452, 10) + node(300, 440, 10) + node(470, 420, 12, fill="url(#sapphire)"),
    ground=(256, 470, 220, 14))

ICONS["campuses"] = svg(
    # academic building: podium, columns, pediment, sapphire dome
    f'<rect x="96" y="360" width="320" height="50" rx="14" fill="url(#pearlSide)" {OL}/>'
    + "".join(f'<rect x="{x}" y="236" width="34" height="128" rx="10" fill="url(#pearl)" {OL}/>' for x in (130, 200, 278, 348))
    + f'<path d="M104 240 L256 150 L408 240 Z" fill="url(#pearlTop)" {OL} stroke-linejoin="round"/>'
    + f'<path d="M206 150 A50 50 0 0 1 306 150 Z" fill="url(#sapphire)" {OL}/>'
    + f'<rect x="120" y="222" width="272" height="16" rx="8" fill="{GRAPHITE_2}" opacity="0.85"/>'
    + cue("M64 452 C160 436 220 470 300 448 C360 432 420 452 468 440", stroke="url(#cyan)", w=11, dash="24 18")
    + node(300, 448, 10),
    ground=(256, 466, 220, 14))

ICONS["factories"] = svg(
    # facility: extruded base with a sawtooth roof, a chimney, teal worker cue
    f'<path d="M78 250 L78 420 L426 420 L426 250 L340 200 L340 250 L254 200 L254 250 L168 200 L168 250 Z" fill="url(#pearl)" {OL} stroke-linejoin="round"/>'
    f'<path d="M426 250 L462 226 L462 396 L426 420 Z" fill="url(#pearlSide)" {OL} stroke-linejoin="round"/>'
    f'<rect x="96" y="262" width="150" height="28" rx="10" fill="url(#spec)" opacity="0.75"/>'
    f'<rect x="372" y="120" width="40" height="120" rx="10" fill="url(#pearlSide)" {OL}/>'
    + windows(110, 300, 3, 1, cw=44, ch=40, gap=22, fill=GRAPHITE_2, op=0.8)
    + figure(330, 338, s=0.7, fill="url(#cyan)", joints=False, stride=1.0)
    + cue("M96 452 L300 452", stroke="url(#sapphire)", w=10, glowc=SAPPHIRE, dash="22 18")
    + f'<circle cx="300" cy="452" r="14" fill="{VIOLET}" opacity="0.28" filter="url(#glow)"/>'
    + node(300, 452, 10, fill="url(#violet)"),
    ground=(256, 470, 220, 14))

ICONS["retail"] = svg(
    glass(96, 236, 320, 184, r=18) +
    # awning: sapphire/pearl stripes
    f'<path d="M80 240 L96 176 L416 176 L432 240 Z" fill="url(#pearl)" {OL} stroke-linejoin="round"/>'
    + "".join(f'<path d="M{x} 178 L{x+40} 178 L{x+46} 238 L{x+6} 238 Z" fill="url(#sapphire)" opacity="0.9"/>' for x in (100, 180, 260, 340))
    + f'<rect x="130" y="272" width="112" height="86" rx="12" fill="#FFFFFF" stroke="{GRAPHITE_2}" stroke-width="{SW-2}"/>'
    + f'<rect x="286" y="272" width="70" height="148" rx="12" fill="url(#cyan)"/>'
    + f'<rect x="400" y="136" width="34" height="100" rx="12" fill="url(#pearlSide)" {OL}/>'
    + cue("M60 450 C150 424 240 470 330 446 L440 424", stroke="url(#cyan)", w=11)
    + f'<path d="M410 412 L444 424 L418 452" fill="none" stroke="url(#cyan)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>',
    ground=(256, 466, 210, 14))

ICONS["events"] = svg(
    # stadium bowl: outer ring extruded, inner field
    f'<ellipse cx="256" cy="300" rx="212" ry="112" fill="url(#pearlSide)" {OL}/>'
    f'<ellipse cx="256" cy="270" rx="212" ry="112" fill="url(#pearl)" {OL}/>'
    f'<ellipse cx="256" cy="270" rx="126" ry="60" fill="url(#cyan)" opacity="0.28"/>'
    f'<ellipse cx="256" cy="270" rx="126" ry="60" fill="none" stroke="{GRAPHITE_2}" stroke-width="{SW-2}" opacity="0.8"/>'
    f'<ellipse cx="200" cy="196" rx="90" ry="22" fill="url(#spec)" opacity="0.8"/>'
    # crowd-flow arcs converging on the gates
    + cue("M96 150 C150 210 200 230 256 232", stroke="url(#sapphire)", w=11, glowc=SAPPHIRE)
    + cue("M416 150 C362 210 312 230 256 232", stroke="url(#violet)", w=11, glowc=VIOLET)
    + node(96, 150, 11, fill="url(#sapphire)") + node(416, 150, 11, fill="url(#violet)") + node(256, 232, 13),
    ground=(256, 452, 230, 20))

ICONS["defence"] = svg(
    f'<path d="{shield_path(256, 256, 300, 340)}" fill="url(#pearl)" {OL} stroke-linejoin="round"/>'
    f'<path d="M256 150 L332 180 V250 C332 300 300 336 256 356 C212 336 180 300 180 250 V180 Z" fill="none" stroke="url(#gold)" stroke-width="8" opacity="0.9"/>'
    f'<rect x="150" y="108" width="212" height="52" rx="18" fill="url(#spec)" opacity="0.75"/>'
    # chevron and radar arcs (readiness, not surveillance)
    f'<path d="M204 262 L256 224 L308 262" fill="none" stroke="{GRAPHITE_2}" stroke-width="{SW+6}" stroke-linecap="round" stroke-linejoin="round"/>'
    + cue("M196 306 C226 280 286 280 316 306", stroke="url(#cyan)", w=10)
    + cue("M174 336 C222 292 290 292 338 336", stroke="url(#cyan)", w=10)
    + node(256, 224, 12, fill="url(#gold)"),
    ground=(256, 452, 160, 22))

for name, markup in ICONS.items():
    (OUT / f"{name}.svg").write_text(markup, encoding="utf-8", newline="\n")
print(f"wrote {len(ICONS)} svgs to {OUT}")

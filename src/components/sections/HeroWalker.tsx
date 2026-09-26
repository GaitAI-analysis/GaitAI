"use client";
/* eslint-disable @next/next/no-img-element -- the poster must sit in plate fractions over its own canvas */

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { HERO_GAIT, HERO_WALK, WALK_JOINTS, type WalkTheme } from "@/data/hero-walk";
import { publishGait } from "@/lib/gaitBus";
import { assetPath } from "@/lib/paths";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import styles from "./herowalker.module.css";

/**
 * THE POSE-ANALYSIS DIGITAL HUMAN — ALWAYS WALKING.
 * =============================================================================
 * The third panel's figure is a male digital human who walks continuously
 * for as long as the hero is on screen (founder, 2026-09-25). He is part of
 * the hero, not an introduction: the dots, cards and the Pose rail open and
 * close around him and never stop him. The painted figure is gone from both
 * plates for good, so there is nothing for him to hand back to.
 *
 * ── THE WALK ──────────────────────────────────────────────────────────────
 * Motion capture of a natural walk (CMU Graphics Lab, trial 07_03: heel
 * strike, loading, foot-flat stance, heel rise, toe-off, knee flexion in
 * swing, arm counter-swing, pelvis and shoulder counter-rotation, the
 * vertical bob) retargeted onto a rigged anatomical male body and rendered offline to 48 frames of ONE gait
 * cycle — right heel strike to right heel strike. The loop is that cycle
 * played end to start, so there is no reset: frame 47 is followed by frame 0
 * exactly as frame 0 is followed by frame 1. The site ships images, never a
 * 3D engine; the frames and every number below are generated, see
 * src/data/hero-walk.ts and scripts/hero-walker/.
 *
 * ── A TRACKING SHOT, NOT A TREADMILL ──────────────────────────────────────
 * A real stride (~1.4m) is about the width of the panel, so a man walking
 * through it forever needs the camera to travel with him. What moves, and at
 * what speed, is what makes that read as a camera rather than a conveyor:
 *
 *   the man      drifts slowly ahead of the camera and falls back again
 *                (`drift`), the way a tracking operator never quite holds a
 *                subject still;
 *   the ground   its grain (grid, glints) runs back at exactly the speed the
 *                planted foot needs — read per frame from the capture
 *                (`root`), so a foot on the floor never slides — and faster in
 *                the rows nearer the camera (perspective about `horizon`);
 *   the backdrop the ribbon field, and its soft reflection in the floor, drift
 *                past far more slowly, because they are further away. It is
 *                the real painting; when it has drifted as far as the painting
 *                reaches (`ext`), the next pass dissolves in over it from the
 *                start, so no invented scenery is ever shown.
 *
 * ── TIMING ────────────────────────────────────────────────────────────────
 * One stride is 1176ms, the rail's `--stride` (102 steps/min). The clock
 * only runs while the hero is visible and the tab is in front, and resumes
 * where it stopped. Reduced motion shows him standing mid-stride, still.
 * Decorative: `aria-hidden`, no pointer events.
 */

const STRIDE_MS = 1176;
/** The backdrop's drift, in plate px per second, and its pass dissolve. */
const BACKDROP_SPEED = 14;
const DISSOLVE_MS = 1600;
/** One slow drift of the man against the camera. */
const DRIFT_MS = 9000;

type Theme = "light" | "dark";

type Assets = {
  theme: Theme;
  atlas: HTMLImageElement;
  backdrop: HTMLImageElement;
  grain: HTMLImageElement;
  hi: boolean;
};

function load(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => img.decode().then(() => resolve(img), () => resolve(img));
    img.onerror = reject;
    img.src = assetPath(src);
  });
}

/** Which frame set this screen gets. The same rule runs in PREFETCH, before
    hydration, so the load below finds the atlas already on its way. */
function wantsHi(t: WalkTheme) {
  // The man's height on screen: the stage spans the viewport's width.
  const cssH = (window.innerWidth * t.figH) / t.plate[0];
  // The low set is ~360px tall: use it only where he shows smaller than that.
  return cssH * (window.devicePixelRatio || 1) > 360;
}

/* Starts the fetch while the HTML is still being parsed, for the theme the
   page is actually in, so he is walking in the first view rather than
   arriving a few seconds into it. */
const PREFETCH = (() => {
  const pick = (t: WalkTheme) =>
    JSON.stringify({ r: t.figH / t.plate[0], hi: assetPath(t.scales.hi.src), lo: assetPath(t.scales.lo.src), b: assetPath(t.backdrop.src), g: assetPath(t.grain.src) });
  return (
    "(function(){try{var L=" + pick(HERO_WALK.light) + ",D=" + pick(HERO_WALK.dark) + ";" +
    "var t=document.documentElement.classList.contains('light')?L:D;" +
    "var h=innerWidth*t.r*(window.devicePixelRatio||1)>360;" +
    "[h?t.hi:t.lo,t.b,t.g].forEach(function(u){var i=new Image();i.src=u;});}catch(e){}})();"
  );
})();

function currentTheme(): Theme {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

/** The canvas box: the whole panel, with its left edge along the divider. */
function boxStyle(t: WalkTheme): CSSProperties {
  const [W, H] = t.plate;
  const [x0, y0, x1, y1] = t.box;
  const bw = x1 - x0;
  // 3px right of the painted divider, so the white line stays on top.
  const at = (y: number) => ((t.divider.b + t.divider.m * y + 3 - x0) / bw) * 100;
  return {
    left: `${(x0 / W) * 100}%`,
    top: `${(y0 / H) * 100}%`,
    width: `${(bw / W) * 100}%`,
    height: `${((y1 - y0) / H) * 100}%`,
    clipPath: `polygon(${at(y0).toFixed(2)}% 0, 100% 0, 100% 100%, ${at(y1).toFixed(2)}% 100%)`,
  };
}

/** The poster (the start frame) inside the canvas box, in the box's own fractions:
    exactly where paint() draws that frame at tau 0. */
function posterStyle(t: WalkTheme): CSSProperties {
  const [x0, y0, x1, y1] = t.box;
  const k = t.figH / t.bodyH / t.framePpm;
  const left = t.hipX - t.frameHipX * k + t.poster.x * k;
  const top = t.feetY - t.frameFloorY * k + t.poster.y * k;
  const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;
  return {
    position: "absolute",
    left: pct(left - x0, x1 - x0),
    top: pct(top - y0, y1 - y0),
    width: pct(t.poster.w * k, x1 - x0),
    height: pct(t.poster.h * k, y1 - y0),
  };
}

const smooth = (x: number) => {
  const c = Math.min(Math.max(x, 0), 1);
  return c * c * (3 - 2 * c);
};

/* ── THE ANALYSIS LAYER ────────────────────────────────────────────────────
   Drawn on the page over the body, from what was MEASURED on it: the joints
   (hero-walk.ts `joints`) and the gait tables (HERO_GAIT: phases, stance,
   centre of pressure, hip / knee / ankle angles and events, all derived from
   the rig's own transforms by scripts/hero-walker/gait.py). Nothing here is
   generated or random.
     joints     shoulder, elbow, wrist, pelvis, hip, knee, ankle; thin lines
     angles     hip flexion, knee flexion and ankle angle of the near (right)
                leg, on leaders beside the joints
     contact    under a planted foot: the path from the heel to the centre of
                pressure, which travels heel -> midfoot -> forefoot through
                stance; a ring where the heel lands
     events     "R Heel strike", "L Toe off"... beside the foot, then fading
   `level` runs 0 (resting: quiet) to 1 (Pose open, or the introduction). */
type JointName = (typeof WALK_JOINTS)[number];
const J = Object.fromEntries(WALK_JOINTS.map((n, i) => [n, i])) as Record<JointName, number>;
const BONES: readonly (readonly [JointName, JointName, boolean])[] = [
  ["Head", "Neck", true], ["Neck", "Spine1", true], ["Spine1", "Hips", true],
  ["Neck", "RightArm", true], ["RightArm", "RightForeArm", true], ["RightForeArm", "RightHand", true],
  ["Neck", "LeftArm", false], ["LeftArm", "LeftForeArm", false], ["LeftForeArm", "LeftHand", false],
  ["Hips", "RightUpLeg", true], ["RightUpLeg", "RightLeg", true], ["RightLeg", "RightFoot", true], ["RightFoot", "RightToeBase", true],
  ["Hips", "LeftUpLeg", false], ["LeftUpLeg", "LeftLeg", false], ["LeftLeg", "LeftFoot", false], ["LeftFoot", "LeftToeBase", false],
];
const NODES: readonly JointName[] = ["RightArm", "LeftArm", "RightForeArm", "LeftForeArm", "RightHand", "LeftHand", "Hips", "RightUpLeg", "LeftUpLeg", "RightLeg", "LeftLeg", "RightFoot", "LeftFoot"];
const ANGLES = [
  ["Hip flexion", "RightUpLeg", 3],
  ["Knee flexion", "RightLeg", 4],
  ["Ankle", "RightFoot", 5],
] as const;
const EVENT_MS = 900;

function analysis(
  ctx: CanvasRenderingContext2D,
  t: WalkTheme,
  theme: Theme,
  i: number,
  f: number,
  place: { fx: number; fy: number; k: number },
  px: number,
  L: number,
) {
  const N = t.joints.length;
  // Deep bronze on the pale day plate, warm champagne on the night one: both
  // hold ~4.5:1 against their ribbon field, so the read-outs never dissolve.
  const rgb = theme === "light" ? "112,80,26" : "242,224,184";
  const ink = (a: number) => `rgba(${rgb},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
  // Type sits on a soft halo of the plate's own tone (pearl by day, deep navy
  // by night) so it stays legible over the ribbons and the body alike.
  const halo = theme === "light" ? "rgba(250,248,242,0.95)" : "rgba(5,9,22,0.9)";
  // shadowBlur ignores the transform: it is in device pixels.
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const text = (s: string, x: number, y: number) => {
    ctx.save();
    ctx.shadowColor = halo;
    ctx.shadowBlur = 5 * dpr;
    ctx.strokeStyle = halo;
    ctx.lineWidth = 2.6 * px;
    ctx.lineJoin = "round";
    ctx.strokeText(s, x, y);
    ctx.shadowBlur = 0;
    ctx.fillText(s, x, y);
    ctx.restore();
  };
  const at = (fr: readonly number[], n: JointName): [number, number] => [
    place.fx + fr[J[n] * 2] * place.k,
    place.fy + fr[J[n] * 2 + 1] * place.k,
  ];
  const cur = t.joints[i];
  const frameMs = STRIDE_MS / N;

  // Joints: the near side full, the far side dimmer.
  ctx.lineCap = "round";
  ctx.lineWidth = px * (1.2 + 0.2 * L);
  for (const [p, q, near] of BONES) {
    const [x0, y0] = at(cur, p);
    const [x1, y1] = at(cur, q);
    ctx.strokeStyle = ink(near ? 0.62 + 0.3 * L : 0.34 + 0.24 * L);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  for (const n of NODES) {
    const [x, y] = at(cur, n);
    const near = !n.startsWith("Left");
    const dim = near ? 1 : 0.55;
    const r = px * (near ? 2.1 + 0.7 * L : 1.5 + 0.4 * L);
    const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
    halo.addColorStop(0, ink((0.46 + 0.3 * L) * dim));
    halo.addColorStop(1, ink(0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = theme === "light" ? ink(dim) : `rgba(255,246,226,${((0.9 + 0.1 * L) * dim).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Foot contact: heel -> centre of pressure along the sole, on the floor.
  for (const [side, k] of [["Left", 0], ["Right", 1]] as const) {
    const c = HERO_GAIT.cop[i][k];
    if (c === null) continue;
    const [hx, hy] = at(cur, `${side}Heel`);
    const [tx, ty] = at(cur, `${side}ToeTip`);
    const y0 = Math.max(hy, ty) + 1.5 * px;
    const px0 = hx + (tx - hx) * c;
    const near = side === "Right";
    ctx.strokeStyle = ink((near ? 0.75 : 0.5) * (0.75 + 0.25 * L));
    ctx.lineWidth = px * 1.6;
    ctx.beginPath();
    ctx.moveTo(hx, y0);
    ctx.lineTo(px0, y0);
    ctx.stroke();
    const g = ctx.createRadialGradient(px0, y0, 0, px0, y0, 6 * px);
    g.addColorStop(0, ink(0.9 * (0.8 + 0.2 * L)));
    g.addColorStop(1, ink(0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(px0, y0, 6 * px, 2.4 * px, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Events: a word beside the foot when it happens, then fading; the landing
  // heel also rings once.
  ctx.font = `600 ${(10 * px).toFixed(2)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "left";
  // One word per foot: the newest event replaces the one before it, so two
  // readings never print over each other in the same place.
  const newest: Record<string, number> = {};
  for (const [e, s] of HERO_GAIT.events) {
    const ago = (((f - e) % N) + N) % N;
    newest[s] = Math.min(newest[s] ?? Infinity, ago);
  }
  for (const [e, s, type] of HERO_GAIT.events) {
    const ago = (((f - e) % N) + N) % N; // frames since this event last happened
    const ms = ago * frameMs;
    if (ms > EVENT_MS || ago !== newest[s]) continue;
    const side = s === "l" ? "Left" : "Right";
    const a = (1 - ms / EVENT_MS) ** 1.4;
    const [ax, ay] = at(cur, `${side}Foot`);
    const lift = (ms / EVENT_MS) * 6 * px;
    const y = ay - (s === "l" ? 30 : 18) * px - lift;
    ctx.fillStyle = ink((0.88 + 0.12 * L) * a);
    text(`${s.toUpperCase()}  ${type.toUpperCase()}`, ax + 10 * px, y);
    if (type === "Heel strike" && ms < 360) {
      const g = ms / 360;
      const [hx, hy] = at(t.joints[e], `${side}Heel`);
      ctx.strokeStyle = ink((0.85 + 0.15 * L) * (1 - g));
      ctx.lineWidth = 1.3 * px;
      ctx.beginPath();
      ctx.ellipse(hx, hy + 1.5 * px, (3 + 12 * g) * px, (1.2 + 3.5 * g) * px, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Angles of the near leg: a small fixed block behind his hips, a leader
  // from each reading to its joint.
  const A = HERO_GAIT.angles[i];
  const al = 0.86 + 0.14 * L;
  const by = t.feetY - t.figH * 0.52;
  const step = 33 * px;
  // The block's right edge, pushed right only as far as it takes for the
  // widest label to clear the panel's divider (the canvas is clipped there).
  ctx.font = `600 ${(9.5 * px).toFixed(2)}px ui-sans-serif, system-ui, sans-serif`;
  const widest = Math.max(...ANGLES.map(([label]) => ctx.measureText(label.toUpperCase()).width));
  const edge = (y: number) => t.divider.b + t.divider.m * y + 3;
  const clear = Math.max(edge(by - 20 * px), edge(by + 2 * step + 5 * px)) + 10 * px;
  const bx = Math.max(t.hipX + (place.fx - (t.hipX - t.frameHipX * place.k)) - t.figH * 0.15, clear + widest);
  ctx.textAlign = "right";
  ANGLES.forEach(([label, joint, idx], n) => {
    const y = by + n * step;
    const [x, jy] = at(cur, joint);
    ctx.strokeStyle = ink(al * 0.62);
    ctx.lineWidth = px;
    ctx.beginPath();
    ctx.moveTo(bx + 4 * px, y - 4 * px);
    ctx.lineTo(bx + 10 * px, y - 4 * px);
    ctx.lineTo(x - 4 * px, jy);
    ctx.stroke();
    // The leader's joint end: a small tick ring, so the reading is anchored.
    ctx.beginPath();
    ctx.arc(x - 4 * px, jy, 1.6 * px, 0, Math.PI * 2);
    ctx.fillStyle = ink(al * 0.8);
    ctx.fill();
    ctx.font = `600 ${(9.5 * px).toFixed(2)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = ink(al * 0.85);
    text(label.toUpperCase(), bx, y - 11 * px);
    ctx.font = `700 ${(13 * px).toFixed(2)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = ink(al);
    text(`${A[idx]}°`, bx, y + 3 * px);
  });
  ctx.textAlign = "left";
}

/** Draw one frame of the shot at `tau` ms of walking. */
function paint(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, a: Assets, tau: number, level = 0) {
  const t = HERO_WALK[a.theme];
  const scale = a.hi ? t.scales.hi : t.scales.lo;
  const N = scale.frames.length;
  const START = t.strikes.right;
  const [bx0, by0, bx1] = t.box;
  const P = t.figH / t.bodyH; // plate px per metre
  const k = P / t.framePpm; // plate px per full-size frame px

  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(r.width * dpr));
  const h = Math.max(1, Math.round(r.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const s = w / (bx1 - bx0); // canvas px per plate px

  const f = START + (tau / STRIDE_MS) * N;
  const i = Math.floor(f) % N;
  const cycles = Math.floor(f / N);
  // Metres walked, pinned to the stance foot by the capture itself.
  const metres = cycles * t.stride + t.root[i] - t.root[START];
  const drift = t.drift * Math.sin((2 * Math.PI * tau) / DRIFT_MS);
  const ground = metres * P - drift; // plate px the ground has run back at the feet

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, w, h);
  ctx.setTransform(s, 0, 0, s, -bx0 * s, -by0 * s); // plate pixels from here on

  // 1. The backdrop: passes that drift left and dissolve into the next.
  const bd = t.backdrop;
  const reach = bd.ext - 2;
  const life = (reach / BACKDROP_SPEED) * 1000; // ms one pass can drift
  const every = life - DISSOLVE_MS; // a new pass starts this often
  const n = Math.floor(tau / every);
  const u = tau - n * every;
  const pass = (age: number, alpha: number) => {
    ctx.globalAlpha = alpha;
    ctx.drawImage(a.backdrop, bd.x0 - (age / 1000) * BACKDROP_SPEED, 0, bd.w, bd.h);
  };
  if (n > 0 && u < DISSOLVE_MS) pass(u + every, 1);
  pass(u, n > 0 ? smooth(u / DISSOLVE_MS) : 1);
  ctx.globalAlpha = 1;

  // 2. The ground's own grain, row by row at its depth's speed.
  const g = t.grain;
  ctx.globalCompositeOperation = "hard-light";
  const band = 3;
  for (let y = 0; y < g.h; y += band) {
    const row = g.top + y;
    const depth = (row - t.horizon) / (t.feetY - t.horizon);
    let x = bx0 - (((ground * depth) % g.w) + g.w) % g.w;
    for (; x < bx1; x += g.w) ctx.drawImage(a.grain, 0, y, g.w, band, x, row, g.w, band);
  }
  ctx.globalCompositeOperation = "source-over";

  // 3. The man: hips where the painted figure's were, soles on its floor.
  const [ax, ay, aw, ah, ox, oy] = scale.frames[i];
  const fx = t.hipX + drift - t.frameHipX * k;
  const fy = t.feetY - t.frameFloorY * k;
  const q = k / scale.scale;
  ctx.drawImage(a.atlas, ax, ay, aw, ah, fx + ox * q, fy + oy * q, aw * q, ah * q);

  // 4. The analysis layer over him; `dpr / s` is one CSS pixel in plate px.
  analysis(ctx, t, a.theme, i, f % N, { fx, fy, k }, dpr / s, level);
  publishGait({ i, f: f % N });
}

export function HeroWalker({ analysis: open = false }: { analysis?: boolean }) {
  const reduced = usePrefersReducedMotion();
  const want = useRef(open ? 1 : 0);
  useEffect(() => {
    want.current = open ? 1 : 0;
  }, [open]);
  const light = useRef<HTMLCanvasElement>(null);
  const dark = useRef<HTMLCanvasElement>(null);
  const [assets, setAssets] = useState<Assets | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);

  /* Follow the site theme. */
  useEffect(() => {
    setTheme(currentTheme());
    const watch = new MutationObserver(() => setTheme(currentTheme()));
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => watch.disconnect();
  }, []);

  /* This theme's frames, straight away — he is part of the first view. */
  useEffect(() => {
    if (!theme || assets?.theme === theme) return;
    let gone = false;
    const t = HERO_WALK[theme];
    const hi = wantsHi(t);
    Promise.all([load((hi ? t.scales.hi : t.scales.lo).src), load(t.backdrop.src), load(t.grain.src)])
      .then(([atlas, backdrop, grain]) => {
        if (!gone) setAssets({ theme, atlas, backdrop, grain, hi });
      })
      .catch(() => undefined);
    return () => {
      gone = true;
    };
  }, [theme, assets]);

  const ready = !!assets && assets.theme === theme;

  /* The walk: runs while the hero is on screen and the tab is in front, and
     picks up where it stopped. */
  useEffect(() => {
    if (!ready || !assets) return;
    const canvas = (assets.theme === "light" ? light : dark).current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (reduced) {
      const still = () => paint(ctx, canvas, assets, 0, want.current);
      still();
      const onResize = still;
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    let raf = 0;
    let walked = 0; // ms of walking so far
    let last = 0;
    let seen = true;
    let level = want.current;
    const frame = (now: number) => {
      const dt = last ? Math.min(now - last, 100) : 0;
      walked += dt;
      last = now;
      // The analysis layer eases between quiet and prominent in ~300ms.
      level += (want.current - level) * Math.min(1, dt / 300);
      paint(ctx, canvas, assets, walked, level);
      raf = requestAnimationFrame(frame);
    };
    const run = () => {
      const go = seen && document.visibilityState === "visible";
      if (go && !raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      } else if (!go && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      run();
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", run);
    run();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", run);
      cancelAnimationFrame(raf);
    };
  }, [ready, assets, reduced]);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: PREFETCH }} />
      {/* He is in the first paint: the start frame as a still, in the server
          markup, until the walking canvas (which starts on that very frame)
          has taken over. */}
      {(["light", "dark"] as const).map((th) => (
        <div
          key={th}
          aria-hidden="true"
          className={`${styles.poster} ${styles[th]}`}
          style={boxStyle(HERO_WALK[th])}
          data-gone={ready && theme === th ? "true" : undefined}
        >
          <img
            src={assetPath(HERO_WALK[th].poster.src)}
            alt=""
            decoding="async"
            style={posterStyle(HERO_WALK[th])}
          />
        </div>
      ))}
      <canvas
        ref={light}
        aria-hidden="true"
        className={`${styles.walker} ${styles.light}`}
        style={boxStyle(HERO_WALK.light)}
        data-show={ready && theme === "light" ? "true" : undefined}
      />
      <canvas
        ref={dark}
        aria-hidden="true"
        className={`${styles.walker} ${styles.dark}`}
        style={boxStyle(HERO_WALK.dark)}
        data-show={ready && theme === "dark" ? "true" : undefined}
      />
    </>
  );
}

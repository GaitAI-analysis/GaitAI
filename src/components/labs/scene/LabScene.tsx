"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Line, MeshReflectorMaterial, OrbitControls, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { CAPTURE_CAMERAS, LAB_URLS, OVERVIEW, ROOM, SUBJECT, cameraPosition, type CaptureCamera } from "./lab-layout";

/**
 * THE GAITAI BIOMETRICS LAB — a digital twin, in three dimensions.
 *
 * A reconstruction of the capture room in the reference photographs, built
 * to be believable rather than pristine: pale yellow painted plaster with its
 * marks, pilasters between louvered windows over glazed ones, ceiling beams
 * carrying tube lights and fans, a polished white vitrified-tile floor with
 * the darker joint line every fourth tile, workstations with monitors and a
 * laptop along one side, a whiteboard with gait sketches, electrical boxes
 * and conduit on the walls, and fourteen tripod-mounted capture cameras with
 * their cables, every lens aimed at the subject on the clear floor.
 *
 * MATERIALS AND LIGHT ARE PHYSICAL. Every surface is a MeshStandard or
 * MeshPhysical material with real maps — CC0 plaster, denim, veneer and
 * marble from Poly Haven, sized for the web — lit by an interior HDRI for
 * bounced light, one shadow-casting sun through the left windows, and the
 * tube fixtures as point lights. ACES tone mapping, sRGB output. Nothing
 * here is a flat colour on a box.
 *
 * THE SUBJECT IS A STAND-IN, AND SAYS SO. `LAB_URLS.avatar` is a realistic
 * rigged human (see public/labs/avatar/README.md) dressed in her clothes —
 * red-and-black plaid under a black vest, jeans, dark shoes — with her long
 * hair and glasses added on the head bone. It is posed and given its idle
 * presence through its bones, and the pose overlay reads those same bones,
 * so replacing the file with a scanned, personalised avatar that uses the
 * Mixamo skeleton changes nothing else.
 */

export type LabView = { kind: "orbit" } | { kind: "camera"; index: number };
export type LabQuality = "high" | "low";

export interface LabSceneProps {
  view: LabView;
  showPose: boolean;
  showSightlines: boolean;
  quality: LabQuality;
  reducedMotion: boolean;
  onReady?: () => void;
}

const AIM = new THREE.Vector3(SUBJECT.x, SUBJECT.aimHeight, SUBJECT.z);
const UP = new THREE.Vector3(0, 1, 0);
const SIGNAL = "#4fd1ff";

/* ─────────────────────────────────────────────────────────────────────────────
   Textures
   ───────────────────────────────────────────────────────────────────────────── */

function prep(texture: THREE.Texture, repeat: [number, number], srgb: boolean) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 8;
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** A PBR set from /labs/textures, repeated to a physical size. */
function usePbr(names: { map: string; roughnessMap?: string; normalMap?: string }, repeat: [number, number]) {
  const urls = [names.map, names.roughnessMap, names.normalMap].filter(Boolean).map((n) => LAB_URLS.tex(n as string));
  const textures = useTexture(urls) as THREE.Texture[];
  return useMemo(() => {
    const [map, second, third] = textures;
    prep(map, repeat, true);
    const out: { map: THREE.Texture; roughnessMap?: THREE.Texture; normalMap?: THREE.Texture } = { map };
    let i = 1;
    if (names.roughnessMap) out.roughnessMap = prep(textures[i++], repeat, false);
    if (names.normalMap) out.normalMap = prep(textures[i++], repeat, false);
    void second; void third;
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textures]);
}

function useCanvasTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number, repeat: [number, number] = [1, 1]) {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    draw(ctx, w, h);
    return prep(new THREE.CanvasTexture(canvas), repeat, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Daylight beyond the glass: bright sky, the trees outside, softened. */
function drawOutside(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#fbf3dc");
  sky.addColorStop(0.5, "#f1e9cf");
  sky.addColorStop(1, "#cfd6bf");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const rng = seeded(3);
  for (let i = 0; i < 26; i += 1) {
    const x = rng() * w;
    const y = h * 0.4 + rng() * h * 0.55;
    const r = w * (0.06 + rng() * 0.12);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(112,138,84,0.5)");
    g.addColorStop(1, "rgba(112,138,84,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  const haze = ctx.createLinearGradient(0, 0, 0, h);
  haze.addColorStop(0, "rgba(255,255,255,0.3)");
  haze.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, w, h);
}

/** The whiteboard, with the gait stick-figure sketches from the photograph. */
function drawWhiteboard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#f4f5f3";
  ctx.fillRect(0, 0, w, h);
  const rng = seeded(11);
  for (let i = 0; i < 30; i += 1) {
    ctx.fillStyle = `rgba(120,125,135,${0.03 + rng() * 0.05})`;
    ctx.beginPath(); ctx.ellipse(rng() * w, rng() * h, 30 + rng() * 90, 6 + rng() * 20, rng() * Math.PI, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = "#2b3f8f";
  ctx.lineWidth = Math.max(1.2, w / 190);
  ctx.lineCap = "round";
  const figure = (x: number, y: number, s: number, lean: number) => {
    ctx.beginPath(); ctx.arc(x, y, s * 0.1, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.1); ctx.lineTo(x, y + s * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.5); ctx.lineTo(x - s * 0.18 * lean, y + s * 0.86); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.5); ctx.lineTo(x + s * 0.2, y + s * 0.86); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.2); ctx.lineTo(x - s * 0.22, y + s * 0.42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.2); ctx.lineTo(x + s * 0.2 * lean, y + s * 0.38); ctx.stroke();
  };
  figure(w * 0.2, h * 0.16, h * 0.5, 1);
  figure(w * 0.5, h * 0.18, h * 0.5, 0.4);
  figure(w * 0.8, h * 0.16, h * 0.5, -0.8);
  ctx.strokeStyle = "rgba(43,63,143,0.55)";
  ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.84); ctx.lineTo(w * 0.9, h * 0.84); ctx.stroke();
  ctx.strokeStyle = "rgba(200,40,60,0.6)";
  ctx.beginPath(); ctx.moveTo(w * 0.12, h * 0.76); ctx.lineTo(w * 0.4, h * 0.7); ctx.lineTo(w * 0.62, h * 0.74); ctx.lineTo(w * 0.88, h * 0.66); ctx.stroke();
}

/** A monitor showing the pose pipeline: a skeleton and a trace on a dark UI. */
function drawScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#0b1119";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#111a26";
  ctx.fillRect(0, 0, w, h * 0.09);
  ctx.fillStyle = "#0f1722";
  ctx.fillRect(w * 0.62, h * 0.09, w * 0.38, h * 0.91);
  ctx.strokeStyle = "#4fd1ff";
  ctx.lineWidth = Math.max(1, w / 220);
  ctx.lineCap = "round";
  const cx = w * 0.31, top = h * 0.2, s = h * 0.62;
  const p = (x: number, y: number): [number, number] => [cx + x * s, top + y * s];
  const joints: [number, number][] = [p(0, 0), p(0, 0.12), p(-0.14, 0.14), p(0.14, 0.14), p(-0.2, 0.36), p(0.2, 0.34), p(-0.23, 0.55), p(0.23, 0.52), p(-0.07, 0.5), p(0.07, 0.5), p(-0.1, 0.76), p(0.09, 0.75), p(-0.1, 1), p(0.1, 1)];
  const bones: [number, number][] = [[0, 1], [1, 2], [1, 3], [2, 4], [4, 6], [3, 5], [5, 7], [2, 8], [3, 9], [8, 9], [8, 10], [10, 12], [9, 11], [11, 13]];
  bones.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(...joints[a]); ctx.lineTo(...joints[b]); ctx.stroke(); });
  ctx.fillStyle = "#9be4ff";
  joints.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, w / 150, 0, Math.PI * 2); ctx.fill(); });
  const trace = (y0: number, colour: string, f: number) => {
    ctx.strokeStyle = colour;
    ctx.beginPath();
    for (let i = 0; i <= 40; i += 1) {
      const x = w * 0.65 + (w * 0.32 * i) / 40;
      const y = y0 + Math.sin(i * f) * h * 0.035 + Math.sin(i * f * 2.3) * h * 0.012;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  trace(h * 0.3, "#4fd1ff", 0.45);
  trace(h * 0.55, "#9c64f1", 0.6);
  trace(h * 0.8, "#5587ff", 0.35);
}

function seeded(seed: number) {
  let s = seed * 9301 + 49297;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Shared materials
   ───────────────────────────────────────────────────────────────────────────── */

function useMaterials() {
  return useMemo(() => {
    const black = new THREE.MeshStandardMaterial({ color: "#151719", roughness: 0.42, metalness: 0.55 });
    const rubber = new THREE.MeshStandardMaterial({ color: "#0f1012", roughness: 0.92, metalness: 0 });
    const anodised = new THREE.MeshStandardMaterial({ color: "#101318", roughness: 0.35, metalness: 0.6 });
    const lensGlass = new THREE.MeshPhysicalMaterial({ color: "#05070c", roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, reflectivity: 1 });
    const lensRing = new THREE.MeshStandardMaterial({ color: "#3b82f6", emissive: "#3b82f6", emissiveIntensity: 1.6, roughness: 0.4 });
    const led = new THREE.MeshStandardMaterial({ color: "#6fb7ff", emissive: "#6fb7ff", emissiveIntensity: 2.2 });
    const cable = new THREE.MeshStandardMaterial({ color: "#111214", roughness: 0.8, metalness: 0.05 });
    const paintWhite = new THREE.MeshStandardMaterial({ color: "#f3f1ea", roughness: 0.55, metalness: 0.05 });
    const aluminium = new THREE.MeshStandardMaterial({ color: "#c9ccd1", roughness: 0.35, metalness: 0.8 });
    const steelGrey = new THREE.MeshStandardMaterial({ color: "#7d838c", roughness: 0.45, metalness: 0.7 });
    const chrome = new THREE.MeshStandardMaterial({ color: "#d8dbe0", roughness: 0.18, metalness: 0.95 });
    const plastic = new THREE.MeshStandardMaterial({ color: "#1c1f26", roughness: 0.6, metalness: 0.05 });
    const mesh = new THREE.MeshStandardMaterial({ color: "#161a22", roughness: 0.85, metalness: 0, transparent: true, opacity: 0.86 });
    const screenBezel = new THREE.MeshStandardMaterial({ color: "#0d0f13", roughness: 0.35, metalness: 0.3 });
    const conduit = new THREE.MeshStandardMaterial({ color: "#b9b6ad", roughness: 0.6, metalness: 0.2 });
    const boxGrey = new THREE.MeshStandardMaterial({ color: "#8e9096", roughness: 0.55, metalness: 0.5 });
    return { black, rubber, anodised, lensGlass, lensRing, led, cable, paintWhite, aluminium, steelGrey, chrome, plastic, mesh, screenBezel, conduit, boxGrey };
  }, []);
}
type Materials = ReturnType<typeof useMaterials>;

/* ─────────────────────────────────────────────────────────────────────────────
   The room
   ───────────────────────────────────────────────────────────────────────────── */

function Wall({ position, rotation, size, pbr }: { position: [number, number, number]; rotation: [number, number, number]; size: [number, number]; pbr: ReturnType<typeof usePbr> }) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial map={pbr.map} roughnessMap={pbr.roughnessMap} normalMap={pbr.normalMap} normalScale={new THREE.Vector2(0.6, 0.6)} roughness={1} metalness={0} />
    </mesh>
  );
}

/**
 * A window in its wall frame: a painted frame with depth and a sill, glazing
 * bars on the lower windows, white aluminium louvres on the upper ones, and
 * daylight beyond the glass. The group sits in the wall's own frame with +z
 * into the room.
 */
function Window({ position, rotation, width, height, louvered = false, outside, mats }: {
  position: [number, number, number]; rotation: [number, number, number]; width: number; height: number; louvered?: boolean; outside: THREE.Texture | null; mats: Materials;
}) {
  const f = 0.08;
  const depth = 0.14;
  const slats = louvered ? Math.max(4, Math.round(height / 0.15)) : 0;
  return (
    <group position={position} rotation={rotation}>
      {/* the glass, set back into the wall */}
      <mesh position={[0, 0, -depth + 0.02]}>
        <planeGeometry args={[width - f, height - f]} />
        <meshPhysicalMaterial map={outside ?? undefined} emissive="#ffffff" emissiveMap={outside ?? undefined} emissiveIntensity={0.9} roughness={0.08} metalness={0} clearcoat={0.6} />
      </mesh>
      {/* the reveal — the wall's thickness around the opening */}
      {([[0, height / 2, width, f, 0], [0, -height / 2, width, f, 0], [-width / 2, 0, f, height, 0], [width / 2, 0, f, height, 0]] as const).map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, -depth / 2]} castShadow receiveShadow material={mats.paintWhite}>
          <boxGeometry args={[w + f, h + f, depth]} />
        </mesh>
      ))}
      {/* sill */}
      <mesh position={[0, -height / 2 - f * 0.9, 0.04]} castShadow material={mats.paintWhite}>
        <boxGeometry args={[width + f * 2.4, 0.05, 0.16]} />
      </mesh>
      {louvered
        ? Array.from({ length: slats }, (_, i) => (
            <mesh key={i} position={[0, -height / 2 + f + ((height - f * 2) / slats) * (i + 0.5), -0.04]} rotation={[0.55, 0, 0]} material={mats.paintWhite} castShadow>
              <boxGeometry args={[width - f * 1.5, 0.03, 0.14]} />
            </mesh>
          ))
        : (
          <>
            {[-width / 4, 0, width / 4].map((x) => (
              <mesh key={x} position={[x, 0, -depth + 0.045]} material={mats.paintWhite}>
                <boxGeometry args={[0.04, height - f, 0.05]} />
              </mesh>
            ))}
            <mesh position={[0, height * 0.14, -depth + 0.045]} material={mats.paintWhite}>
              <boxGeometry args={[width - f, 0.04, 0.05]} />
            </mesh>
          </>
        )}
    </group>
  );
}

function Pilaster({ position, rotation, pbr }: { position: [number, number, number]; rotation: number; pbr: ReturnType<typeof usePbr> }) {
  return (
    <mesh position={position} rotation={[0, rotation, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.55, ROOM.height, 0.3]} />
      <meshStandardMaterial map={pbr.map} roughnessMap={pbr.roughnessMap} normalMap={pbr.normalMap} normalScale={new THREE.Vector2(0.6, 0.6)} roughness={1} />
    </mesh>
  );
}

/** An electrical box with its conduit running up to the beam line. */
function Conduit({ position, rotation, mats }: { position: [number, number, number]; rotation: number; mats: Materials }) {
  const rise = ROOM.height - 0.55 - position[1];
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0, 0.05]} castShadow material={mats.boxGrey}>
        <boxGeometry args={[0.26, 0.32, 0.1]} />
      </mesh>
      <mesh position={[0, 0.16 + rise / 2, 0.03]} material={mats.conduit}>
        <cylinderGeometry args={[0.013, 0.013, rise, 8]} />
      </mesh>
      <mesh position={[0, -0.16 - 0.4, 0.03]} material={mats.conduit}>
        <cylinderGeometry args={[0.013, 0.013, 0.8, 8]} />
      </mesh>
    </group>
  );
}

function Fixture({ url, position, rotation = [0, 0, 0], scale = 1 }: { url: string; position: [number, number, number]; rotation?: [number, number, number]; scale?: number }) {
  const { scene } = useGLTF(url, LAB_URLS.draco);
  const object = useMemo(() => {
    const o = scene.clone(true);
    o.traverse((n) => {
      if ((n as THREE.Mesh).isMesh) {
        n.castShadow = true;
        n.receiveShadow = true;
      }
    });
    return o;
  }, [scene]);
  return <primitive object={object} position={position} rotation={rotation} scale={scale} />;
}

function Fan({ position, reducedMotion }: { position: [number, number, number]; reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (reducedMotion || !ref.current) return;
    ref.current.rotation.y += dt * 2.1;
  });
  return (
    <group ref={ref} position={position}>
      <Fixture url={LAB_URLS.fan} position={[0, 0, 0]} />
    </group>
  );
}

function Room({ quality, reducedMotion, mats }: { quality: LabQuality; reducedMotion: boolean; mats: Materials }) {
  const { width: W, depth: D, height: H } = ROOM;
  const wall = usePbr({ map: "wall_diff.jpg", roughnessMap: "wall_rough.jpg", normalMap: "wall_nor.jpg" }, [W / 2.2, H / 2.2]);
  const floor = usePbr({ map: "floor_diff.jpg", roughnessMap: "floor_rough.jpg", normalMap: "floor_nor.jpg" }, [W / (ROOM.tile * ROOM.tilesPerTexture), D / (ROOM.tile * ROOM.tilesPerTexture)]);
  const veneer = usePbr({ map: "veneer_diff.jpg", roughnessMap: "veneer_rough.jpg" }, [1, 1]);
  const outside = useCanvasTexture(drawOutside, 256, 256);
  const board = useCanvasTexture(drawWhiteboard, 640, 400);

  return (
    <group>
      {/* Floor: polished vitrified tiles, reflective on a desktop. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        {quality === "high" ? (
          <MeshReflectorMaterial
            map={floor.map}
            roughnessMap={floor.roughnessMap}
            normalMap={floor.normalMap}
            normalScale={new THREE.Vector2(0.5, 0.5)}
            blur={[420, 160]}
            resolution={1024}
            mixBlur={1}
            mixStrength={0.9}
            mirror={0.32}
            roughness={1}
            metalness={0.02}
            depthScale={1.1}
            minDepthThreshold={0.6}
            maxDepthThreshold={1.6}
            envMapIntensity={0.7}
          />
        ) : (
          <meshStandardMaterial map={floor.map} roughnessMap={floor.roughnessMap} normalMap={floor.normalMap} normalScale={new THREE.Vector2(0.5, 0.5)} roughness={1} metalness={0.05} envMapIntensity={0.9} />
        )}
      </mesh>

      {/* Ceiling, beams, and the light fixtures on them. */}
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#f1efe8" roughnessMap={wall.roughnessMap} roughness={1} />
      </mesh>
      {[-3.9, 0, 3.9].map((z) => (
        <mesh key={z} position={[0, H - 0.2, z]} castShadow receiveShadow>
          <boxGeometry args={[W, 0.4, 0.32]} />
          <meshStandardMaterial color="#ece9e0" roughnessMap={wall.roughnessMap} roughness={1} />
        </mesh>
      ))}
      {[[-4.8, -1.95], [0.3, -1.95], [5.2, -1.95], [-4.8, 1.95], [0.3, 1.95], [5.2, 1.95]].map(([x, z], i) => (
        <Fixture key={i} url={LAB_URLS.tubeLight} position={[x, H - 0.002, z]} scale={1.15} />
      ))}
      <Fan position={[-4.6, H - 0.01, -1.4]} reducedMotion={reducedMotion} />
      <Fan position={[0.4, H - 0.01, 1.9]} reducedMotion={reducedMotion} />
      <Fan position={[5.1, H - 0.01, -1.2]} reducedMotion={reducedMotion} />

      {/* Walls, each facing into the room. */}
      <Wall position={[0, H / 2, -D / 2]} rotation={[0, 0, 0]} size={[W, H]} pbr={wall} />
      <Wall position={[0, H / 2, D / 2]} rotation={[0, Math.PI, 0]} size={[W, H]} pbr={wall} />
      <Wall position={[-W / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]} size={[D, H]} pbr={wall} />
      <Wall position={[W / 2, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} size={[D, H]} pbr={wall} />

      {/* Pilasters between the windows, and the plaster band under the ceiling. */}
      <Pilaster position={[0, H / 2, -D / 2 + 0.15]} rotation={0} pbr={wall} />
      <Pilaster position={[-W / 2 + 0.15, H / 2, -0.8]} rotation={Math.PI / 2} pbr={wall} />
      <Pilaster position={[-W / 2 + 0.15, H / 2, 4.6]} rotation={Math.PI / 2} pbr={wall} />
      <Pilaster position={[W / 2 - 0.15, H / 2, -0.8]} rotation={Math.PI / 2} pbr={wall} />
      <Pilaster position={[W / 2 - 0.15, H / 2, 4.6]} rotation={Math.PI / 2} pbr={wall} />
      {([
        [[0, H - 0.5, -D / 2 + 0.035], [W, 0.18, 0.07]],
        [[0, H - 0.5, D / 2 - 0.035], [W, 0.18, 0.07]],
        [[-W / 2 + 0.035, H - 0.5, 0], [0.07, 0.18, D]],
        [[W / 2 - 0.035, H - 0.5, 0], [0.07, 0.18, D]],
      ] as const).map(([p, s], i) => (
        <mesh key={i} position={[p[0], p[1], p[2]]} material={mats.paintWhite} castShadow>
          <boxGeometry args={[s[0], s[1], s[2]]} />
        </mesh>
      ))}
      {/* Skirting: the dark tile line at the foot of every wall. */}
      {([
        [[0, 0.06, -D / 2 + 0.012], [W, 0.12, 0.024]],
        [[0, 0.06, D / 2 - 0.012], [W, 0.12, 0.024]],
        [[-W / 2 + 0.012, 0.06, 0], [0.024, 0.12, D]],
        [[W / 2 - 0.012, 0.06, 0], [0.024, 0.12, D]],
      ] as const).map(([p, s], i) => (
        <mesh key={i} position={[p[0], p[1], p[2]]}>
          <boxGeometry args={[s[0], s[1], s[2]]} />
          <meshStandardMaterial color="#2a2c2f" roughness={0.3} metalness={0.05} />
        </mesh>
      ))}

      {/* Windows. Back wall: two glazed windows under two louvered ones. */}
      {[-3.7, 3.7].map((x) => (
        <group key={x}>
          <Window position={[x, 2.05, -D / 2]} rotation={[0, 0, 0]} width={3.3} height={1.7} outside={outside} mats={mats} />
          <Window position={[x, 3.42, -D / 2]} rotation={[0, 0, 0]} width={3.3} height={0.9} louvered outside={outside} mats={mats} />
        </group>
      ))}
      {/* Left wall, the sunlit side. */}
      {[-3.5, 1.9].map((z) => (
        <group key={z}>
          <Window position={[-W / 2, 2.05, z]} rotation={[0, Math.PI / 2, 0]} width={3.1} height={1.7} outside={outside} mats={mats} />
          <Window position={[-W / 2, 3.42, z]} rotation={[0, Math.PI / 2, 0]} width={3.1} height={0.9} louvered outside={outside} mats={mats} />
        </group>
      ))}
      {/* Right wall: one pair, then the whiteboard. */}
      <Window position={[W / 2, 2.05, -3.6]} rotation={[0, -Math.PI / 2, 0]} width={3.0} height={1.7} outside={outside} mats={mats} />
      <Window position={[W / 2, 3.42, -3.6]} rotation={[0, -Math.PI / 2, 0]} width={3.0} height={0.9} louvered outside={outside} mats={mats} />
      <group position={[W / 2 - 0.035, 1.9, 2.2]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh material={mats.aluminium} castShadow>
          <boxGeometry args={[2.1, 1.3, 0.035]} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[2.0, 1.2]} />
          <meshStandardMaterial map={board ?? undefined} roughness={0.25} metalness={0} />
        </mesh>
      </group>
      {/* Front wall: a louvered window high up, and the door. */}
      <Window position={[-3.4, 3.42, D / 2]} rotation={[0, Math.PI, 0]} width={3.1} height={0.9} louvered outside={outside} mats={mats} />
      <group position={[5.4, 1.08, D / 2 - 0.05]}>
        <mesh castShadow>
          <boxGeometry args={[1.0, 2.16, 0.06]} />
          <meshStandardMaterial map={veneer.map} roughnessMap={veneer.roughnessMap} color="#9a7a55" roughness={1} />
        </mesh>
        <mesh position={[0, 0.02, -0.02]} material={mats.paintWhite}>
          <boxGeometry args={[1.12, 2.24, 0.05]} />
        </mesh>
        <mesh position={[0.38, -0.04, 0.05]} material={mats.chrome}>
          <boxGeometry args={[0.03, 0.03, 0.12]} />
        </mesh>
      </group>

      {/* Electrical boxes and conduit, where the photographs show them. */}
      <Conduit position={[-1.6, 2.3, -D / 2 + 0.01]} rotation={0} mats={mats} />
      <Conduit position={[5.8, 2.3, -D / 2 + 0.01]} rotation={0} mats={mats} />
      <Conduit position={[W / 2 - 0.01, 2.3, 0.4]} rotation={-Math.PI / 2} mats={mats} />
      <Conduit position={[-W / 2 + 0.01, 2.3, -0.75]} rotation={Math.PI / 2} mats={mats} />
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Furniture — the workstation side of the room
   ───────────────────────────────────────────────────────────────────────────── */

function OfficeChair({ position, rotation = 0, mats }: { position: [number, number, number]; rotation?: number; mats: Materials }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.47, 0]} castShadow material={mats.plastic}>
        <boxGeometry args={[0.48, 0.07, 0.48]} />
      </mesh>
      <mesh position={[0, 0.8, -0.22]} rotation={[-0.08, 0, 0]} castShadow material={mats.mesh}>
        <boxGeometry args={[0.46, 0.58, 0.035]} />
      </mesh>
      <mesh position={[0, 0.8, -0.245]} rotation={[-0.08, 0, 0]} material={mats.plastic}>
        <boxGeometry args={[0.48, 0.6, 0.012]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.27, 0.66, -0.02]} material={mats.plastic}>
            <boxGeometry args={[0.04, 0.03, 0.3]} />
          </mesh>
          <mesh position={[s * 0.27, 0.57, 0.05]} material={mats.plastic}>
            <boxGeometry args={[0.03, 0.18, 0.03]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.27, 0]} material={mats.chrome}>
        <cylinderGeometry args={[0.025, 0.03, 0.36, 12]} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} rotation={[0, (i * Math.PI * 2) / 5, 0]}>
          <mesh position={[0.16, 0.05, 0]} rotation={[0, 0, 0.12]} material={mats.plastic}>
            <boxGeometry args={[0.32, 0.03, 0.04]} />
          </mesh>
          <mesh position={[0.31, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.rubber}>
            <cylinderGeometry args={[0.03, 0.03, 0.025, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Monitor({ position, rotation = 0, screen, mats }: { position: [number, number, number]; rotation?: number; screen: THREE.Texture | null; mats: Materials }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.02, 0]} material={mats.screenBezel}>
        <cylinderGeometry args={[0.11, 0.13, 0.02, 20]} />
      </mesh>
      <mesh position={[0, 0.16, 0]} material={mats.screenBezel}>
        <boxGeometry args={[0.05, 0.28, 0.04]} />
      </mesh>
      <mesh position={[0, 0.42, 0]} rotation={[-0.06, 0, 0]} castShadow material={mats.screenBezel}>
        <boxGeometry args={[0.6, 0.36, 0.03]} />
      </mesh>
      <mesh position={[0, 0.42, 0.017]} rotation={[-0.06, 0, 0]}>
        <planeGeometry args={[0.57, 0.33]} />
        <meshPhysicalMaterial map={screen ?? undefined} emissive="#ffffff" emissiveMap={screen ?? undefined} emissiveIntensity={0.55} roughness={0.12} metalness={0} clearcoat={1} clearcoatRoughness={0.1} color="#0b0f16" />
      </mesh>
    </group>
  );
}

function Laptop({ position, rotation = 0, screen, mats }: { position: [number, number, number]; rotation?: number; screen: THREE.Texture | null; mats: Materials }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.008, 0]} castShadow material={mats.aluminium}>
        <boxGeometry args={[0.33, 0.016, 0.23]} />
      </mesh>
      <mesh position={[0, 0.017, 0.02]} material={mats.plastic}>
        <boxGeometry args={[0.28, 0.003, 0.11]} />
      </mesh>
      <group position={[0, 0.016, -0.115]} rotation={[-1.25, 0, 0]}>
        <mesh position={[0, 0.11, 0]} castShadow material={mats.aluminium}>
          <boxGeometry args={[0.33, 0.22, 0.008]} />
        </mesh>
        <mesh position={[0, 0.11, 0.0045]}>
          <planeGeometry args={[0.3, 0.19]} />
          <meshPhysicalMaterial map={screen ?? undefined} emissive="#ffffff" emissiveMap={screen ?? undefined} emissiveIntensity={0.6} roughness={0.1} clearcoat={1} color="#0b0f16" />
        </mesh>
      </group>
    </group>
  );
}

function Desk({ position, rotation = 0, veneer, mats, children }: { position: [number, number, number]; rotation?: number; veneer: ReturnType<typeof usePbr>; mats: Materials; children?: React.ReactNode }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.035, 0.75]} />
        <meshStandardMaterial map={veneer.map} roughnessMap={veneer.roughnessMap} roughness={1} />
      </mesh>
      {[[-0.75, -0.34], [0.75, -0.34], [-0.75, 0.34], [0.75, 0.34]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]} material={mats.steelGrey}>
          <boxGeometry args={[0.045, 0.72, 0.045]} />
        </mesh>
      ))}
      <mesh position={[0, 0.12, -0.34]} material={mats.steelGrey}>
        <boxGeometry args={[1.5, 0.03, 0.03]} />
      </mesh>
      <group position={[0, 0.757, 0]}>{children}</group>
    </group>
  );
}

function RoundTable({ position, veneer, mats }: { position: [number, number, number]; veneer: ReturnType<typeof usePbr>; mats: Materials }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.035, 40]} />
        <meshStandardMaterial map={veneer.map} roughnessMap={veneer.roughnessMap} roughness={1} />
      </mesh>
      <mesh position={[0, 0.37, 0]} material={mats.chrome}>
        <cylinderGeometry args={[0.035, 0.035, 0.72, 16]} />
      </mesh>
      <mesh position={[0, 0.015, 0]} material={mats.chrome}>
        <cylinderGeometry args={[0.3, 0.34, 0.03, 32]} />
      </mesh>
      <OfficeChair position={[0, 0, 0.98]} rotation={Math.PI} mats={mats} />
      <OfficeChair position={[-0.92, 0, -0.35]} rotation={Math.PI / 2 + 0.35} mats={mats} />
    </group>
  );
}

function Furniture({ mats }: { mats: Materials }) {
  const { width: W, depth: D } = ROOM;
  const veneer = usePbr({ map: "veneer_diff.jpg", roughnessMap: "veneer_rough.jpg" }, [1.2, 0.6]);
  const screen = useCanvasTexture(drawScreen, 512, 288);
  return (
    <group>
      {/* Workstations along the far side, facing the room. */}
      {[-3.7, -1.9, -0.1].map((z, i) => (
        <group key={z}>
          <Desk position={[-W / 2 + 1.05, 0, z]} rotation={Math.PI / 2} veneer={veneer} mats={mats}>
            <Monitor position={[i === 1 ? -0.15 : 0, 0, -0.2]} rotation={0.05 * (i - 1)} screen={screen} mats={mats} />
            {i === 1 && <Laptop position={[0.45, 0, 0.05]} rotation={-0.25} screen={screen} mats={mats} />}
          </Desk>
          <OfficeChair position={[-W / 2 + 1.75, 0, z + 0.05]} rotation={-Math.PI / 2 + 0.1 * (i - 1)} mats={mats} />
        </group>
      ))}
      {/* The round tables by the entrance side, one with the laptop from the photograph. */}
      <RoundTable position={[-4.4, 0, 4.2]} veneer={veneer} mats={mats} />
      <group position={[-4.4, 0.757, 4.2]}>
        <Laptop position={[0.1, 0, 0.15]} rotation={0.4} screen={screen} mats={mats} />
      </group>
      <RoundTable position={[-1.0, 0, 5.2]} veneer={veneer} mats={mats} />
      {/* Plants: a real model, placed as in the photographs. */}
      <Fixture url={LAB_URLS.plant} position={[-W / 2 + 0.7, 0, -D / 2 + 0.8]} scale={1.15} />
      <Fixture url={LAB_URLS.plant} position={[W / 2 - 0.7, 0, -D / 2 + 0.8]} rotation={[0, 1.2, 0]} scale={1.0} />
      <Fixture url={LAB_URLS.plant} position={[0.4, 0, -D / 2 + 0.6]} rotation={[0, 2.4, 0]} scale={0.85} />
      <Fixture url={LAB_URLS.plant} position={[W / 2 - 0.7, 0, 4.4]} rotation={[0, 0.6, 0]} scale={1.1} />
      <Fixture url={LAB_URLS.plant} position={[-W / 2 + 0.7, 0, 5.6]} rotation={[0, 3.0, 0]} scale={0.95} />
      {/* Speakers on stands along the far wall. */}
      {[-6.0, 6.3].map((x) => (
        <group key={x} position={[x, 0, -D / 2 + 0.65]}>
          <mesh position={[0, 0.6, 0]} material={mats.black}>
            <cylinderGeometry args={[0.014, 0.016, 1.2, 10]} />
          </mesh>
          <mesh position={[0, 0.015, 0]} material={mats.black}>
            <cylinderGeometry args={[0.17, 0.17, 0.03, 16]} />
          </mesh>
          <mesh position={[0, 1.36, 0]} castShadow material={mats.plastic}>
            <boxGeometry args={[0.25, 0.34, 0.24]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   The capture ring — fourteen tripod stations, built once and cloned, every
   camera aimed at the subject with lookAt.
   ───────────────────────────────────────────────────────────────────────────── */

const LEG_SEGMENTS = 3;

/** One station: tripod, head, camera. Geometry and materials are shared by every clone. */
function buildStation(mats: Materials, height: number): THREE.Group {
  const g = new THREE.Group();
  const hubY = height - 0.34;
  // legs: two-section tubes with locks and rubber feet
  for (let i = 0; i < LEG_SEGMENTS; i += 1) {
    const a = (i * Math.PI * 2) / 3 + Math.PI / 6;
    const foot = new THREE.Vector3(Math.sin(a) * 0.5, 0, Math.cos(a) * 0.5);
    const top = new THREE.Vector3(Math.sin(a) * 0.05, hubY, Math.cos(a) * 0.05);
    const dir = top.clone().sub(foot);
    const len = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, len * 0.52, 10), mats.black);
    upper.position.copy(foot.clone().add(dir.clone().multiplyScalar(0.74)));
    upper.quaternion.copy(q);
    upper.castShadow = true;
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, len * 0.5, 10), mats.black);
    lower.position.copy(foot.clone().add(dir.clone().multiplyScalar(0.25)));
    lower.quaternion.copy(q);
    lower.castShadow = true;
    const lock = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.05, 12), mats.rubber);
    lock.position.copy(foot.clone().add(dir.clone().multiplyScalar(0.5)));
    lock.quaternion.copy(q);
    const rubber = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.035, 10), mats.rubber);
    rubber.position.copy(foot.clone().add(new THREE.Vector3(0, 0.017, 0)));
    g.add(upper, lower, lock, rubber);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.06, 16), mats.black);
  hub.position.y = hubY;
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, height - hubY - 0.02, 12), mats.anodised);
  column.position.y = hubY + (height - hubY - 0.02) / 2;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.04, 14), mats.rubber);
  collar.position.y = hubY + 0.05;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.05, 0.075), mats.black);
  head.position.y = height - 0.045;
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.06, 10), mats.rubber);
  knob.rotation.z = Math.PI / 2;
  knob.position.set(0.055, height - 0.045, 0);
  g.add(hub, column, collar, head, knob);

  // the camera, on a plate, with its lens on +z so lookAt aims it
  const cam = new THREE.Group();
  cam.name = "cameraHead";
  cam.position.y = height;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.008, 0.07), mats.anodised);
  plate.position.y = -0.026;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.058, 0.052), mats.anodised);
  body.castShadow = true;
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.117, 0.03, 0.03), mats.rubber);
  grip.position.z = -0.014;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.021, 0.026, 24), mats.anodised);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(-0.025, 0, 0.036);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.015, 24), mats.lensGlass);
  glass.position.set(-0.025, 0, 0.0495);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0175, 0.0018, 8, 32), mats.lensRing);
  ring.position.set(-0.025, 0, 0.0495);
  const ir = new THREE.Mesh(new THREE.CircleGeometry(0.008, 16), mats.lensGlass);
  ir.position.set(0.03, 0, 0.0265);
  const irRim = new THREE.Mesh(new THREE.TorusGeometry(0.009, 0.0012, 6, 20), mats.black);
  irRim.position.set(0.03, 0, 0.0265);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 8), mats.led);
  led.position.set(0.045, 0.031, 0.0);
  cam.add(plate, body, grip, barrel, glass, ring, ir, irRim, led);
  g.add(cam);
  return g;
}

/** A cable from the camera down the column and across the floor toward the nearest wall. */
function buildCable(station: THREE.Vector3, height: number, mats: Materials): THREE.Mesh {
  const { width: W, depth: D } = ROOM;
  const toWall = new THREE.Vector3(
    Math.abs(station.x) / (W / 2) > Math.abs(station.z) / (D / 2) ? Math.sign(station.x) * (W / 2 - 0.05) : station.x,
    0.01,
    Math.abs(station.x) / (W / 2) > Math.abs(station.z) / (D / 2) ? station.z : Math.sign(station.z || 1) * (D / 2 - 0.05),
  );
  const pts = [
    new THREE.Vector3(station.x, height - 0.02, station.z),
    new THREE.Vector3(station.x + 0.03, height - 0.3, station.z + 0.02),
    new THREE.Vector3(station.x + 0.02, 0.6, station.z),
    new THREE.Vector3(station.x + 0.15, 0.012, station.z + 0.1),
    station.clone().lerp(toWall, 0.5).setY(0.012).add(new THREE.Vector3(0.2, 0, -0.15)),
    toWall,
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.005, 6, false), mats.cable);
  mesh.castShadow = true;
  return mesh;
}

function CaptureRing({ showSightlines, mats }: { showSightlines: boolean; mats: Materials }) {
  const stations = useMemo(
    () =>
      CAPTURE_CAMERAS.map((camera: CaptureCamera) => {
        const [x, h, z] = cameraPosition(camera);
        const station = buildStation(mats, h);
        station.position.set(x, 0, z);
        station.updateMatrixWorld(true);
        /* Aim the camera head at the subject. Object3D.lookAt points +z at
           the target, and the lens is built on +z. */
        const head = station.getObjectByName("cameraHead") as THREE.Group;
        head.lookAt(AIM);
        const cable = buildCable(new THREE.Vector3(x, 0, z), h, mats);
        const lens = new THREE.Vector3(x, h, z).add(AIM.clone().sub(new THREE.Vector3(x, h, z)).normalize().multiplyScalar(0.06));
        return { station, cable, lens };
      }),
    [mats],
  );
  return (
    <group>
      {stations.map(({ station, cable }, i) => (
        <group key={i}>
          <primitive object={station} />
          <primitive object={cable} />
        </group>
      ))}
      {showSightlines &&
        stations.map(({ lens }, i) => (
          <Line key={i} points={[lens, AIM]} color={SIGNAL} lineWidth={1} transparent opacity={0.16} depthWrite={false} />
        ))}
      {/* A hairline on the floor around the capture volume. */}
      <mesh position={[SUBJECT.x, 0.012, SUBJECT.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.012, 96]} />
        <meshBasicMaterial color={SIGNAL} transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   The subject — a realistic rigged stand-in, posed and animated by her bones
   ───────────────────────────────────────────────────────────────────────────── */

const BONE = {
  hips: /Hips$/,
  spine: /Spine$/,
  spine1: /Spine1$/,
  spine2: /Spine2$/,
  neck: /Neck$/,
  head: /Head$/,
  lArm: /LeftArm$/,
  rArm: /RightArm$/,
  lForeArm: /LeftForeArm$/,
  rForeArm: /RightForeArm$/,
  lHand: /LeftHand$/,
  rHand: /RightHand$/,
  lUpLeg: /LeftUpLeg$/,
  rUpLeg: /RightUpLeg$/,
  lLeg: /LeftLeg$/,
  rLeg: /RightLeg$/,
  lFoot: /LeftFoot$/,
  rFoot: /RightFoot$/,
} as const;
type BoneKey = keyof typeof BONE;

/** The overlay's landmarks, in order, and the bones between them. */
const LANDMARK_KEYS: BoneKey[] = ["head", "neck", "lArm", "rArm", "lForeArm", "rForeArm", "lHand", "rHand", "lUpLeg", "rUpLeg", "lLeg", "rLeg", "lFoot", "rFoot"];
const LANDMARK_BONES: [BoneKey, BoneKey][] = [
  ["head", "neck"], ["neck", "lArm"], ["neck", "rArm"],
  ["lArm", "lForeArm"], ["lForeArm", "lHand"], ["rArm", "rForeArm"], ["rForeArm", "rHand"],
  ["lArm", "lUpLeg"], ["rArm", "rUpLeg"], ["lUpLeg", "rUpLeg"],
  ["lUpLeg", "lLeg"], ["lLeg", "lFoot"], ["rUpLeg", "rLeg"], ["rLeg", "rFoot"],
];

/**
 * Turn a bone so the direction to its child points along `target` (world).
 * Works for any rig convention, because it reads the child's actual offset.
 */
function aimBone(bone: THREE.Object3D, child: THREE.Object3D, target: THREE.Vector3) {
  bone.updateWorldMatrix(true, false);
  const wq = new THREE.Quaternion();
  bone.getWorldQuaternion(wq);
  const childDir = child.position.clone().normalize();
  const desiredLocal = target.clone().normalize().applyQuaternion(wq.clone().invert());
  const q = new THREE.Quaternion().setFromUnitVectors(childDir, desiredLocal);
  bone.quaternion.multiply(q);
}

interface Rest { hips: THREE.Quaternion; spine1: THREE.Quaternion; head: THREE.Quaternion; hipsPos: THREE.Vector3 }

const FIT_DIR = new THREE.Vector3();
/**
 * Stretch a unit-length cylinder between two world points, extended by `pad`
 * at each end, and place it in the parent group's frame. The clothes and the
 * bones share a parent, so world → parent is one inverse transform.
 */
function fitSegment(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3, pad: number) {
  const parent = mesh.parent;
  if (!parent) return;
  FIT_DIR.copy(b).sub(a);
  const len = FIT_DIR.length() + pad * 2;
  FIT_DIR.normalize();
  const mid = a.clone().add(b).multiplyScalar(0.5);
  parent.worldToLocal(mid);
  mesh.position.copy(mid);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, FIT_DIR);
  const pq = new THREE.Quaternion();
  parent.getWorldQuaternion(pq);
  mesh.quaternion.copy(pq.invert().multiply(q));
  mesh.scale.set(1, Math.max(0.05, len), 1);
}

function Avatar({ showPose, reducedMotion, mats }: { showPose: boolean; reducedMotion: boolean; mats: Materials }) {
  const { scene } = useGLTF(LAB_URLS.avatar, LAB_URLS.draco);
  const [plaid, plaidNormal] = useTexture([LAB_URLS.tex("plaid_diff.jpg"), LAB_URLS.tex("fabric_nor.jpg")]) as THREE.Texture[];
  const torsoPlaid = useMemo(() => {
    prep(plaid, [3, 3], true);
    prep(plaidNormal, [3, 3], false);
    const map = plaid.clone();
    const normalMap = plaidNormal.clone();
    prep(map, [5, 2], true);
    prep(normalMap, [5, 2], false);
    return { map, normalMap };
  }, [plaid, plaidNormal]);

  const model = useMemo(() => cloneSkeleton(scene) as THREE.Group, [scene]);
  const bones = useMemo(() => {
    const found: Partial<Record<BoneKey, THREE.Object3D>> = {};
    model.traverse((n) => {
      (Object.keys(BONE) as BoneKey[]).forEach((k) => {
        if (!found[k] && BONE[k].test(n.name)) found[k] = n;
      });
    });
    return found;
  }, [model]);
  const rest = useRef<Rest | null>(null);
  const group = useRef<THREE.Group>(null);
  const headAnchor = useRef<THREE.Group>(null);
  const headYaw = useRef(0);
  const sleeves = useRef<(THREE.Mesh | null)[]>([null, null, null, null]);
  const elbows = useRef<(THREE.Mesh | null)[]>([null, null]);
  const collar = useRef<THREE.Mesh>(null);
  const vest = useRef<THREE.Mesh>(null);
  const tmpA = useMemo(() => new THREE.Vector3(), []);
  const tmpB = useMemo(() => new THREE.Vector3(), []);
  const landmarks = useRef<THREE.Vector3[]>(LANDMARK_KEYS.map(() => new THREE.Vector3()));

  useLayoutEffect(() => {
    model.traverse((n) => {
      const m = n as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        m.frustumCulled = false;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat && "roughness" in mat) {
          mat.roughness = 0.82;
          mat.metalness = 0;
          mat.envMapIntensity = 0.6;
        }
      }
    });
    /* From the rest pose (arms out), stand naturally: upper arms down and a
       little outward, forearms slightly forward, hands relaxed. */
    const { lArm, rArm, lForeArm, rForeArm, lHand, rHand, hips, spine1, head } = bones;
    if (lArm && lForeArm) aimBone(lArm, lForeArm, new THREE.Vector3(0.2, -1, 0.08));
    if (rArm && rForeArm) aimBone(rArm, rForeArm, new THREE.Vector3(-0.2, -1, 0.08));
    if (lForeArm && lHand) aimBone(lForeArm, lHand, new THREE.Vector3(0.16, -1, 0.3));
    if (rForeArm && rHand) aimBone(rForeArm, rHand, new THREE.Vector3(-0.16, -1, 0.3));
    if (hips && spine1 && head) {
      rest.current = { hips: hips.quaternion.clone(), spine1: spine1.quaternion.clone(), head: head.quaternion.clone(), hipsPos: hips.position.clone() };
    }
  }, [model, bones]);

  /* Idle presence and the overlay's landmarks, from the bones themselves. */
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const { hips, spine1, head } = bones;
    const r = rest.current;
    if (r && hips && spine1 && head && !reducedMotion) {
      const breath = Math.sin(t * 1.1);
      spine1.quaternion.copy(r.spine1).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(breath * 0.012, Math.sin(t * 0.27) * 0.02, 0)));
      headYaw.current = Math.sin(t * 0.37) * 0.16 + Math.sin(t * 0.9) * 0.03;
      head.quaternion.copy(r.head).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(t * 0.6) * 0.03, headYaw.current, Math.sin(t * 0.45) * 0.015)));
      hips.quaternion.copy(r.hips).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.sin(t * 0.23) * 0.03, Math.sin(t * 0.29) * 0.012)));
      hips.position.copy(r.hipsPos).add(new THREE.Vector3(Math.sin(t * 0.29) * 0.012, breath * 0.004, 0));
    }
    if (head && headAnchor.current && group.current) {
      head.getWorldPosition(tmpA);
      group.current.worldToLocal(tmpA);
      headAnchor.current.position.copy(tmpA);
      headAnchor.current.rotation.set(0, headYaw.current, 0);
    }
    LANDMARK_KEYS.forEach((k, i) => {
      const b = bones[k];
      if (b) b.getWorldPosition(landmarks.current[i]);
    });
    /* Her clothes ride on the skeleton: the plaid shirt from hips to neck with
       the black vest over it, and a plaid sleeve on each arm segment with a
       rounded elbow. */
    const { hips: hp, neck: nk, lArm, lForeArm, lHand, rArm, rForeArm, rHand } = bones;
    if (hp && nk && collar.current && vest.current && group.current) {
      hp.getWorldPosition(tmpA); nk.getWorldPosition(tmpB);
      tmpA.y += 0.02;
      tmpB.y -= 0.075;
      fitSegment(vest.current, tmpA, tmpB, 0);
      tmpA.copy(tmpB); tmpB.y += 0.11;
      fitSegment(collar.current, tmpA, tmpB, 0);
    }
    const segs: [THREE.Object3D | undefined, THREE.Object3D | undefined][] = [[lArm, lForeArm], [lForeArm, lHand], [rArm, rForeArm], [rForeArm, rHand]];
    segs.forEach(([a, b], i) => {
      const m = sleeves.current[i];
      if (!a || !b || !m) return;
      a.getWorldPosition(tmpA); b.getWorldPosition(tmpB);
      fitSegment(m, tmpA, tmpB, i % 2 === 0 ? 0.018 : 0.012);
    });
    [lForeArm, rForeArm].forEach((b, i) => {
      const m = elbows.current[i];
      if (!b || !m || !group.current) return;
      b.getWorldPosition(tmpA);
      group.current.worldToLocal(tmpA);
      m.position.copy(tmpA);
    });
  });

  return (
    <group ref={group} position={[SUBJECT.x, 0, SUBJECT.z]} rotation={[0, Math.PI, 0]}>
      <primitive object={model} />
      {/* Her clothes, over the body: fitted to the bones every frame (see useFrame). */}
      <mesh ref={vest} castShadow>
        <cylinderGeometry args={[0.128, 0.138, 1, 24, 1, true]} />
        <meshStandardMaterial color="#15171d" roughness={0.92} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={collar} castShadow>
        <cylinderGeometry args={[0.07, 0.126, 1, 22, 1, true]} />
        <meshStandardMaterial map={torsoPlaid.map} normalMap={torsoPlaid.normalMap} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} ref={(el) => { sleeves.current[i] = el; }} castShadow>
          <cylinderGeometry args={i % 2 === 0 ? [0.046, 0.052, 1, 16] : [0.038, 0.046, 1, 16]} />
          <meshStandardMaterial map={plaid} normalMap={plaidNormal} roughness={0.9} />
        </mesh>
      ))}
      {[0, 1].map((i) => (
        <mesh key={i} ref={(el) => { elbows.current[i] = el; }} castShadow>
          <sphereGeometry args={[0.046, 14, 12]} />
          <meshStandardMaterial map={plaid} normalMap={plaidNormal} roughness={0.9} />
        </mesh>
      ))}
      {/* Long hair and glasses: positioned from the head bone, oriented in her own
          frame (up is up, +z is her front) plus the head's turn. The head bone
          origin is at the top of the neck; the skull centre is ~9 cm above it. */}
      <group ref={headAnchor}>
        {/* the crown: the very top of the head, matte */}
        <mesh position={[0, 0.07, -0.012]} castShadow>
          <sphereGeometry args={[0.098, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.36]} />
          <meshStandardMaterial color="#17100d" roughness={0.86} metalness={0} />
        </mesh>
        {/* the fall: one flat sheet of hair from the crown down the back to the shoulder blades */}
        <mesh position={[0, -0.05, -0.072]} rotation={[-0.04, 0, 0]} scale={[1.5, 1, 0.22]} castShadow>
          <capsuleGeometry args={[0.052, 0.3, 6, 16]} />
          <meshStandardMaterial color="#17100d" roughness={0.86} metalness={0} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.031, 0.095, 0.094]} material={mats.black}>
            <torusGeometry args={[0.024, 0.0022, 8, 24]} />
          </mesh>
        ))}
        <mesh position={[0, 0.097, 0.096]} material={mats.black}>
          <boxGeometry args={[0.018, 0.003, 0.003]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.072, 0.097, 0.04]} material={mats.black}>
            <boxGeometry args={[0.003, 0.003, 0.11]} />
          </mesh>
        ))}
      </group>
      {showPose && <PoseOverlay landmarks={landmarks} />}
    </group>
  );
}

/**
 * Research-grade pose overlay: hairline bones, small nodes, restrained cyan,
 * drawn over the body from the same bone positions the idle animates. The
 * geometry is in world space (the landmarks are world positions), so it is
 * rendered outside the avatar's rotated group.
 */
function PoseOverlay({ landmarks }: { landmarks: React.MutableRefObject<THREE.Vector3[]> }) {
  const lines = useRef<THREE.LineSegments>(null);
  const nodes = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(LANDMARK_BONES.length * 2 * 3), 3));
    return g;
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    LANDMARK_BONES.forEach(([a, b], i) => {
      const pa = landmarks.current[LANDMARK_KEYS.indexOf(a)];
      const pb = landmarks.current[LANDMARK_KEYS.indexOf(b)];
      pos.setXYZ(i * 2, pa.x, pa.y, pa.z);
      pos.setXYZ(i * 2 + 1, pb.x, pb.y, pb.z);
    });
    pos.needsUpdate = true;
    geometry.computeBoundingSphere();
    if (nodes.current) {
      landmarks.current.forEach((p, i) => {
        dummy.position.copy(p);
        dummy.updateMatrix();
        nodes.current!.setMatrixAt(i, dummy.matrix);
      });
      nodes.current.instanceMatrix.needsUpdate = true;
    }
  });
  /* World space: undo the avatar group's rotation/position by rendering at the root. */
  return (
    <group rotation={[0, Math.PI, 0]} position={[-SUBJECT.x, 0, -SUBJECT.z]}>
      <lineSegments ref={lines} geometry={geometry} renderOrder={20} frustumCulled={false}>
        <lineBasicMaterial color={SIGNAL} transparent opacity={0.55} depthTest={false} depthWrite={false} />
      </lineSegments>
      <instancedMesh ref={nodes} args={[undefined, undefined, LANDMARK_KEYS.length]} renderOrder={21} frustumCulled={false}>
        <sphereGeometry args={[0.011, 10, 10]} />
        <meshBasicMaterial color="#9fe6ff" transparent opacity={0.8} depthTest={false} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Light, camera, readiness
   ───────────────────────────────────────────────────────────────────────────── */

function Lights({ quality }: { quality: LabQuality }) {
  const shadow = quality === "high" ? 2048 : 1024;
  return (
    <>
      {/* Bounced daylight from an interior HDRI — the soft ambient the photographs have. */}
      <Environment files={LAB_URLS.hdri} environmentIntensity={quality === "high" ? 0.55 : 0.5} />
      <ambientLight intensity={0.12} color="#fff4e4" />
      {/* Sun through the left windows: the one shadow-casting light. */}
      <directionalLight
        position={[-8, 6.2, -2.5]}
        intensity={2.4}
        color="#ffd7a1"
        castShadow
        shadow-mapSize={[shadow, shadow]}
        shadow-camera-near={1}
        shadow-camera-far={34}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.00035}
        shadow-normalBias={0.025}
        shadow-radius={quality === "high" ? 3 : 2}
      />
      {/* The tube fixtures, as light: cool-white, falling off quickly. */}
      {[[-4.8, -1.95], [0.3, -1.95], [5.2, -1.95], [-4.8, 1.95], [0.3, 1.95], [5.2, 1.95]].map(([x, z], i) => (
        <pointLight key={i} position={[x, ROOM.height - 0.25, z]} intensity={quality === "high" ? 7 : 5} distance={9} decay={2} color="#f3f6ff" />
      ))}
    </>
  );
}

type ControlsRef = React.ElementRef<typeof OrbitControls>;

function Rig({ view, reducedMotion }: { view: LabView; reducedMotion: boolean }) {
  const controls = useRef<ControlsRef>(null);
  const { camera } = useThree();
  const [interacted, setInteracted] = useState(false);
  const goal = useRef<THREE.Vector3 | null>(null);
  const aim = useMemo(() => new THREE.Vector3(...OVERVIEW.target), []);

  /* A new view sets a goal; the frame loop glides there and hands control
     back. From a capture camera the eye sits at the front of that lens — what
     the camera sees, its own body behind the eye and out of frame. Positions
     come from the same layout that places the visible cameras. */
  useEffect(() => {
    if (view.kind === "camera") {
      const lens = new THREE.Vector3(...cameraPosition(CAPTURE_CAMERAS[view.index]));
      const forward = AIM.clone().sub(lens).normalize().multiplyScalar(0.12);
      goal.current = lens.add(forward);
    } else {
      goal.current = new THREE.Vector3(...OVERVIEW.position);
    }
  }, [view]);

  useFrame((_, dt) => {
    const target = goal.current;
    if (!target) return;
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 3.4);
    camera.position.lerp(target, k);
    controls.current?.target.lerp(view.kind === "camera" ? AIM : aim, k);
    controls.current?.update();
    if (camera.position.distanceTo(target) < 0.008) goal.current = null;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={OVERVIEW.target}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.55}
      zoomSpeed={0.65}
      minDistance={1.4}
      maxDistance={6.2}
      minPolarAngle={0.25}
      maxPolarAngle={1.5}
      autoRotate={!interacted && !reducedMotion && view.kind === "orbit"}
      autoRotateSpeed={0.28}
      onStart={() => {
        setInteracted(true);
        goal.current = null;
      }}
    />
  );
}

/** Reports the first frames drawn after every asset has loaded; in development also
 *  publishes the renderer's draw-call and triangle counts for inspection. */
function Ready({ onReady }: { onReady?: () => void }) {
  const frames = useRef(0);
  const { gl } = useThree();
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") gl.info.autoReset = false;
  }, [gl]);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 2) onReady?.();
    if (process.env.NODE_ENV !== "production" && frames.current % 5 === 0) {
      const r = gl.info.render;
      (window as Window & { __gaitaiLab?: unknown }).__gaitaiLab = { callsPerFrame: Math.round(r.calls / 5), trianglesPerFrame: Math.round(r.triangles / 5), geometries: gl.info.memory.geometries, textures: gl.info.memory.textures };
      gl.info.reset();
    }
  });
  return null;
}

function Scene({ view, showPose, showSightlines, quality, reducedMotion, onReady }: LabSceneProps) {
  const mats = useMaterials();
  return (
    <Suspense fallback={null}>
      <Lights quality={quality} />
      <Room quality={quality} reducedMotion={reducedMotion} mats={mats} />
      <Furniture mats={mats} />
      <CaptureRing showSightlines={showSightlines} mats={mats} />
      <Avatar showPose={showPose} reducedMotion={reducedMotion} mats={mats} />
      <Rig view={view} reducedMotion={reducedMotion} />
      <Ready onReady={onReady} />
    </Suspense>
  );
}

export default function LabScene(props: LabSceneProps) {
  return (
    <Canvas
      shadows="soft"
      dpr={props.quality === "high" ? [1, 1.6] : [1, 1.2]}
      camera={{ position: OVERVIEW.position, fov: 50, near: 0.05, far: 60 }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0, outputColorSpace: THREE.SRGBColorSpace }}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={["#0a0e17"]} />
      <Scene {...props} />
    </Canvas>
  );
}

useGLTF.preload(LAB_URLS.avatar, LAB_URLS.draco);

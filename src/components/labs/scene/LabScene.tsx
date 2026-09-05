"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, MeshReflectorMaterial, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { CAPTURE_CAMERAS, OVERVIEW, ROOM, SUBJECT, cameraPosition, type CaptureCamera } from "./lab-layout";

/**
 * THE GAITAI BIOMETRICS LAB, IN THREE DIMENSIONS.
 *
 * A stylised but spatially faithful reconstruction of the capture room in the
 * two reference photographs: the long yellow hall, the louvered windows over
 * the lower ones with daylight coming through, the polished white tiles, the
 * ceiling fans, the workstations along one side, the whiteboard, the plants —
 * and the ring of fourteen camera tripods, every one aimed at the subject
 * standing on the clear floor in the middle.
 *
 * WHAT IS REAL AND WHAT IS STYLISED. The layout, the count of cameras, the
 * materials and the light are taken from the photographs. The geometry is
 * built from primitives rather than scanned, and the figure at the centre is
 * a representation — her build, hair, glasses, the black vest over the red
 * plaid shirt, the jeans — not a likeness. She breathes, shifts her weight
 * and looks around a little, and a pose overlay reads her joints the way the
 * cameras do, which is the whole point of the room.
 *
 * PERFORMANCE. One shadow-casting light. A reflective floor only at "high"
 * quality (desktop). Every tripod is a handful of primitives, and the
 * sightlines are one line object each. Nothing here fetches a model or a
 * texture over the network — the two textures are drawn on canvases at
 * mount.
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

const C = {
  wall: "#e2cb6a",
  ceiling: "#f2f0e8",
  trim: "#f7f5ef",
  floor: "#eceae4",
  grout: "#cbc8bf",
  glass: "#fff1c9",
  metal: "#15171a",
  cameraBody: "#0e1013",
  lens: "#3f7dff",
  desk: "#d9c59d",
  deskLeg: "#8b8f96",
  chair: "#1b1e25",
  screen: "#0b1220",
  plant: "#3d7a39",
  plantDark: "#2f5f2c",
  pot: "#7f858d",
  door: "#8a6a45",
  skin: "#b98a62",
  hair: "#1a120e",
  vest: "#171a21",
  plaidRed: "#b1202c",
  plaidDark: "#1b1b20",
  jeans: "#4a6ea6",
  shoe: "#15171a",
  signal: "#4fd1ff",
} as const;

const AIM = new THREE.Vector3(SUBJECT.x, SUBJECT.aimHeight, SUBJECT.z);
const UP = new THREE.Vector3(0, 1, 0);

/* ─────────────────────────────────────────────────────────────────────────────
   Textures, drawn at mount. Nothing is fetched.
   ───────────────────────────────────────────────────────────────────────────── */

function useCanvasTexture(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size: number, repeat: [number, number]) {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    draw(ctx, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
    texture.anisotropy = 8;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** One polished tile, repeated at the room's tile pitch. */
function drawTile(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = C.floor;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 36; i += 1) {
    ctx.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.05})`;
    ctx.beginPath();
    ctx.ellipse(Math.random() * size, Math.random() * size, 40 + Math.random() * 140, 8 + Math.random() * 26, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = C.grout;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, size - 4, size - 4);
}

/** Daylight through a window: warm sky at the top, the green of the trees
 *  outside lower down, softened as a louvered pane would soften it. */
function drawGlass(ctx: CanvasRenderingContext2D, size: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, size);
  sky.addColorStop(0, "#fff6dc");
  sky.addColorStop(0.45, "#f6ecc8");
  sky.addColorStop(1, "#d9dfc0");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 14; i += 1) {
    const x = Math.random() * size;
    const y = size * 0.45 + Math.random() * size * 0.5;
    const r = size * (0.08 + Math.random() * 0.14);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(128,150,92,0.42)");
    g.addColorStop(1, "rgba(128,150,92,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  const haze = ctx.createLinearGradient(0, 0, 0, size);
  haze.addColorStop(0, "rgba(255,255,255,0.25)");
  haze.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, size, size);
}

/** Red and black plaid, for the shirt. */
function drawPlaid(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = C.plaidRed;
  ctx.fillRect(0, 0, size, size);
  const band = size / 4;
  ctx.fillStyle = "rgba(20,20,24,0.78)";
  for (let i = 0; i < 2; i += 1) {
    ctx.fillRect(i * band * 2 + band * 0.55, 0, band * 0.9, size);
    ctx.fillRect(0, i * band * 2 + band * 0.55, size, band * 0.9);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = Math.max(1, size / 128);
  for (let i = 0; i < 2; i += 1) {
    const at = i * band * 2 + band * 1.7;
    ctx.beginPath(); ctx.moveTo(at, 0); ctx.lineTo(at, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, at); ctx.lineTo(size, at); ctx.stroke();
  }
}

/** The whiteboard, with the stick-figure gait sketches from the photograph. */
function drawWhiteboard(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = "#f7f8f7";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#2b3a7a";
  ctx.lineWidth = size / 170;
  ctx.lineCap = "round";
  const figure = (x: number, y: number, s: number, lean: number) => {
    ctx.beginPath(); ctx.arc(x, y, s * 0.11, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.11); ctx.lineTo(x, y + s * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.5); ctx.lineTo(x - s * 0.18 * lean, y + s * 0.85); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.5); ctx.lineTo(x + s * 0.2, y + s * 0.85); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.2); ctx.lineTo(x - s * 0.22, y + s * 0.42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.2); ctx.lineTo(x + s * 0.2 * lean, y + s * 0.38); ctx.stroke();
  };
  figure(size * 0.22, size * 0.18, size * 0.5, 1);
  figure(size * 0.5, size * 0.2, size * 0.5, 0.4);
  figure(size * 0.78, size * 0.18, size * 0.5, -0.8);
  ctx.strokeStyle = "rgba(43,58,122,0.5)";
  ctx.beginPath(); ctx.moveTo(size * 0.1, size * 0.82); ctx.lineTo(size * 0.9, size * 0.82); ctx.stroke();
}

/* ─────────────────────────────────────────────────────────────────────────────
   The room
   ───────────────────────────────────────────────────────────────────────────── */

function Wall({ position, rotation, size }: { position: [number, number, number]; rotation: [number, number, number]; size: [number, number] }) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={C.wall} roughness={0.92} />
    </mesh>
  );
}

/**
 * A window in a wall. The group is placed in the wall's own frame (its +z
 * points into the room), so every window is the same component whichever
 * wall it is on. Louvered ones carry slats instead of glazing bars.
 */
function Window({ position, rotation, width, height, louvered = false, glow, glass }: {
  position: [number, number, number]; rotation: [number, number, number]; width: number; height: number; louvered?: boolean; glow: number; glass: THREE.Texture | null;
}) {
  const frame = 0.07;
  const slats = louvered ? Math.max(4, Math.round(height / 0.13)) : 0;
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[width - frame, height - frame]} />
        <meshStandardMaterial
          map={glass ?? undefined}
          color={glass ? "#ffffff" : C.glass}
          emissive="#ffffff"
          emissiveMap={glass ?? undefined}
          emissiveIntensity={glass ? glow * 0.75 : glow}
          roughness={0.15}
          metalness={0.05}
        />
      </mesh>
      {/* frame */}
      {([
        [0, height / 2, width, frame],
        [0, -height / 2, width, frame],
        [-width / 2, 0, frame, height],
        [width / 2, 0, frame, height],
      ] as const).map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.03]}>
          <boxGeometry args={[w + frame, h + frame, 0.06]} />
          <meshStandardMaterial color={C.trim} roughness={0.7} />
        </mesh>
      ))}
      {louvered
        ? Array.from({ length: slats }, (_, i) => (
            <mesh key={i} position={[0, -height / 2 + frame + ((height - frame * 2) / slats) * (i + 0.5), 0.02]} rotation={[0.5, 0, 0]}>
              <boxGeometry args={[width - frame * 1.6, 0.012, 0.11]} />
              <meshStandardMaterial color={C.trim} roughness={0.7} />
            </mesh>
          ))
        : (
          <>
            <mesh position={[0, 0, 0.02]}><boxGeometry args={[0.035, height - frame, 0.03]} /><meshStandardMaterial color={C.trim} roughness={0.7} /></mesh>
            <mesh position={[0, height * 0.12, 0.02]}><boxGeometry args={[width - frame, 0.035, 0.03]} /><meshStandardMaterial color={C.trim} roughness={0.7} /></mesh>
          </>
        )}
    </group>
  );
}

function CeilingFan({ position, reducedMotion }: { position: [number, number, number]; reducedMotion: boolean }) {
  const blades = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (reducedMotion || !blades.current) return;
    blades.current.rotation.y += dt * 2.4;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.02, 0.02, 0.32, 8]} /><meshStandardMaterial color="#d9dad6" roughness={0.5} metalness={0.4} /></mesh>
      <mesh><cylinderGeometry args={[0.13, 0.15, 0.1, 16]} /><meshStandardMaterial color="#d9dad6" roughness={0.5} metalness={0.4} /></mesh>
      <group ref={blades} position={[0, -0.03, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
            <boxGeometry args={[1.25, 0.012, 0.14]} />
            <meshStandardMaterial color="#cfd1cc" roughness={0.6} metalness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Room({ quality, reducedMotion }: { quality: LabQuality; reducedMotion: boolean }) {
  const { width: W, depth: D, height: H } = ROOM;
  const tiles = useCanvasTexture(drawTile, 512, [W / ROOM.tile, D / ROOM.tile]);
  const board = useCanvasTexture(drawWhiteboard, 512, [1, 1]);
  const glass = useCanvasTexture(drawGlass, 256, [1, 1]);
  const glow = quality === "high" ? 1.15 : 0.95;

  return (
    <group>
      {/* Floor: polished tiles, reflective on a desktop. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        {quality === "high" ? (
          <MeshReflectorMaterial
            map={tiles ?? undefined}
            color="#ffffff"
            blur={[380, 130]}
            resolution={1024}
            mixBlur={1}
            mixStrength={0.6}
            mirror={0.38}
            roughness={0.4}
            metalness={0.04}
            depthScale={0.9}
            minDepthThreshold={0.5}
            maxDepthThreshold={1.5}
          />
        ) : (
          <meshStandardMaterial map={tiles ?? undefined} roughness={0.3} metalness={0.05} />
        )}
      </mesh>

      {/* Ceiling and its fittings. */}
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={C.ceiling} roughness={0.95} />
      </mesh>
      {[[-5.6, -2.2], [-1.4, 2.6], [3.2, -2.4], [6.4, 2.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, H - 0.03, z]}>
          <boxGeometry args={[1.25, 0.05, 0.16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.4} />
        </mesh>
      ))}
      <CeilingFan position={[-4.6, H - 0.42, -0.6]} reducedMotion={reducedMotion} />
      <CeilingFan position={[0.4, H - 0.42, 1.4]} reducedMotion={reducedMotion} />
      <CeilingFan position={[5.2, H - 0.42, -0.8]} reducedMotion={reducedMotion} />

      {/* Walls, each facing into the room. */}
      <Wall position={[0, H / 2, -D / 2]} rotation={[0, 0, 0]} size={[W, H]} />
      <Wall position={[0, H / 2, D / 2]} rotation={[0, Math.PI, 0]} size={[W, H]} />
      <Wall position={[-W / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]} size={[D, H]} />
      <Wall position={[W / 2, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} size={[D, H]} />

      {/* The white beam line under the ceiling and the skirting at the floor —
          the two horizontals that make the photograph's walls read as a room. */}
      {([
        [[0, H - 0.5, -D / 2 + 0.03], [W, 0.16, 0.06]],
        [[0, H - 0.5, D / 2 - 0.03], [W, 0.16, 0.06]],
        [[-W / 2 + 0.03, H - 0.5, 0], [0.06, 0.16, D]],
        [[W / 2 - 0.03, H - 0.5, 0], [0.06, 0.16, D]],
        [[0, 0.06, -D / 2 + 0.02], [W, 0.12, 0.04]],
        [[0, 0.06, D / 2 - 0.02], [W, 0.12, 0.04]],
        [[-W / 2 + 0.02, 0.06, 0], [0.04, 0.12, D]],
        [[W / 2 - 0.02, 0.06, 0], [0.04, 0.12, D]],
      ] as const).map(([p, s], i) => (
        <mesh key={i} position={[p[0], p[1], p[2]]}>
          <boxGeometry args={[s[0], s[1], s[2]]} />
          <meshStandardMaterial color={C.trim} roughness={0.8} />
        </mesh>
      ))}

      {/* Windows. Back wall: two lower windows under two louvered ones. */}
      {[-3.6, 3.6].map((x) => (
        <group key={x}>
          <Window position={[x, 2.1, -D / 2 + 0.01]} rotation={[0, 0, 0]} width={3.4} height={1.7} glow={glow} glass={glass} />
          <Window position={[x, 3.55, -D / 2 + 0.01]} rotation={[0, 0, 0]} width={3.4} height={0.95} louvered glow={glow} glass={glass} />
        </group>
      ))}
      {/* Left wall (the sunlit side): two pairs. */}
      {[-3.4, 1.8].map((z) => (
        <group key={z}>
          <Window position={[-W / 2 + 0.01, 2.1, z]} rotation={[0, Math.PI / 2, 0]} width={3.2} height={1.7} glow={glow * 1.1} glass={glass} />
          <Window position={[-W / 2 + 0.01, 3.55, z]} rotation={[0, Math.PI / 2, 0]} width={3.2} height={0.95} louvered glow={glow * 1.1} glass={glass} />
        </group>
      ))}
      {/* Right wall: one pair and the whiteboard. */}
      <Window position={[W / 2 - 0.01, 2.1, -3.6]} rotation={[0, -Math.PI / 2, 0]} width={3.0} height={1.7} glow={glow * 0.9} glass={glass} />
      <Window position={[W / 2 - 0.01, 3.55, -3.6]} rotation={[0, -Math.PI / 2, 0]} width={3.0} height={0.95} louvered glow={glow * 0.9} glass={glass} />
      <group position={[W / 2 - 0.03, 1.95, 2.4]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh><boxGeometry args={[2.0, 1.25, 0.04]} /><meshStandardMaterial color="#b9bcc2" roughness={0.6} metalness={0.3} /></mesh>
        <mesh position={[0, 0, 0.025]}><planeGeometry args={[1.9, 1.15]} /><meshStandardMaterial map={board ?? undefined} roughness={0.35} /></mesh>
      </group>
      {/* Front wall: a louvered window high up and the door. */}
      <Window position={[-3.2, 3.55, D / 2 - 0.01]} rotation={[0, Math.PI, 0]} width={3.2} height={0.95} louvered glow={glow * 0.8} glass={glass} />
      <mesh position={[5.6, 1.08, D / 2 - 0.04]}>
        <boxGeometry args={[1.0, 2.16, 0.06]} />
        <meshStandardMaterial color={C.door} roughness={0.7} />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Furniture — the workstations along the far side, tables, chairs, plants,
   speakers. Enough to read as the room, none of it in the capture floor.
   ───────────────────────────────────────────────────────────────────────────── */

function Chair({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.46, 0]} castShadow><boxGeometry args={[0.46, 0.06, 0.46]} /><meshStandardMaterial color={C.chair} roughness={0.8} /></mesh>
      <mesh position={[0, 0.75, -0.21]} castShadow><boxGeometry args={[0.44, 0.52, 0.05]} /><meshStandardMaterial color={C.chair} roughness={0.8} /></mesh>
      <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.025, 0.025, 0.4, 8]} /><meshStandardMaterial color="#6b7079" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.3, 0.3, 0.03, 12]} /><meshStandardMaterial color={C.chair} roughness={0.7} /></mesh>
    </group>
  );
}

function Workstation({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.74, 0]} castShadow receiveShadow><boxGeometry args={[1.6, 0.04, 0.75]} /><meshStandardMaterial color={C.desk} roughness={0.6} /></mesh>
      {[[-0.74, -0.33], [0.74, -0.33], [-0.74, 0.33], [0.74, 0.33]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]}><boxGeometry args={[0.05, 0.72, 0.05]} /><meshStandardMaterial color={C.deskLeg} metalness={0.5} roughness={0.5} /></mesh>
      ))}
      {/* monitor */}
      <mesh position={[0, 0.83, -0.2]}><cylinderGeometry args={[0.08, 0.1, 0.14, 12]} /><meshStandardMaterial color="#2a2d33" /></mesh>
      <mesh position={[0, 1.08, -0.2]} castShadow>
        <boxGeometry args={[0.56, 0.34, 0.03]} />
        <meshStandardMaterial color="#111318" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.08, -0.18]}>
        <planeGeometry args={[0.52, 0.3]} />
        <meshStandardMaterial color={C.screen} emissive="#1d2f57" emissiveIntensity={0.7} roughness={0.2} />
      </mesh>
      {/* keyboard */}
      <mesh position={[0, 0.77, 0.12]}><boxGeometry args={[0.42, 0.02, 0.14]} /><meshStandardMaterial color="#1e2128" /></mesh>
      <Chair position={[0, 0, 0.6]} rotation={Math.PI} />
    </group>
  );
}

function RoundTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.74, 0]} castShadow receiveShadow><cylinderGeometry args={[0.72, 0.72, 0.04, 32]} /><meshStandardMaterial color={C.desk} roughness={0.6} /></mesh>
      <mesh position={[0, 0.37, 0]}><cylinderGeometry args={[0.04, 0.04, 0.72, 12]} /><meshStandardMaterial color="#9aa0a8" metalness={0.7} roughness={0.35} /></mesh>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.32, 0.36, 0.04, 24]} /><meshStandardMaterial color="#9aa0a8" metalness={0.7} roughness={0.35} /></mesh>
      <Chair position={[0, 0, 1.0]} rotation={Math.PI} />
      <Chair position={[-0.95, 0, -0.3]} rotation={Math.PI / 2 + 0.3} />
      <Chair position={[0.95, 0, -0.35]} rotation={-Math.PI / 2 - 0.3} />
    </group>
  );
}

function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.17, 0]} castShadow><cylinderGeometry args={[0.17, 0.14, 0.34, 16]} /><meshStandardMaterial color={C.pot} roughness={0.7} /></mesh>
      <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.02, 0.03, 0.4, 6]} /><meshStandardMaterial color="#4a3a24" /></mesh>
      {[[0, 0.82, 0, 0.3], [0.2, 0.7, 0.1, 0.22], [-0.2, 0.72, -0.05, 0.22], [0.05, 0.62, 0.22, 0.2], [-0.08, 0.66, -0.22, 0.2]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[r, 10, 8]} />
          <meshStandardMaterial color={i % 2 ? C.plantDark : C.plant} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Speaker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.014, 0.014, 1.1, 8]} /><meshStandardMaterial color={C.metal} /></mesh>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.16, 0.16, 0.03, 12]} /><meshStandardMaterial color={C.metal} /></mesh>
      <mesh position={[0, 1.25, 0]} castShadow><boxGeometry args={[0.24, 0.32, 0.22]} /><meshStandardMaterial color="#111318" roughness={0.6} /></mesh>
    </group>
  );
}

function Furniture() {
  const { width: W, depth: D } = ROOM;
  return (
    <group>
      {/* Workstations along the far side, facing the room. */}
      <Workstation position={[-W / 2 + 1.1, 0, -3.6]} rotation={Math.PI / 2} />
      <Workstation position={[-W / 2 + 1.1, 0, -1.8]} rotation={Math.PI / 2} />
      <Workstation position={[-W / 2 + 1.1, 0, 0.0]} rotation={Math.PI / 2} />
      {/* Two round tables near the entrance side, where the laptop sits in the photograph. */}
      <RoundTable position={[-4.6, 0, 4.4]} />
      <RoundTable position={[-1.2, 0, 5.4]} />
      {/* Plants in the corners and between the windows. */}
      <Plant position={[-W / 2 + 0.6, 0, -D / 2 + 0.7]} />
      <Plant position={[W / 2 - 0.6, 0, -D / 2 + 0.7]} scale={0.9} />
      <Plant position={[0.2, 0, -D / 2 + 0.55]} scale={0.8} />
      <Plant position={[W / 2 - 0.6, 0, 4.6]} />
      <Plant position={[-W / 2 + 0.6, 0, 5.6]} scale={0.85} />
      {/* Speakers on stands along the far wall. */}
      <Speaker position={[-6.2, 0, -D / 2 + 0.6]} />
      <Speaker position={[6.6, 0, -D / 2 + 0.6]} />
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   The capture ring — fourteen tripods, every camera aimed at the subject.
   ───────────────────────────────────────────────────────────────────────────── */

function Tripod({ camera }: { camera: CaptureCamera }) {
  const [x, h, z] = cameraPosition(camera);
  const head = useRef<THREE.Group>(null);

  /* Aim the head at the subject's chest. Object3D.lookAt points the object's
     +z at the target, so the camera body is built with its lens on +z. */
  useLayoutEffect(() => {
    head.current?.lookAt(AIM);
  }, []);

  const legs = useMemo(() => {
    const top = new THREE.Vector3(0, h - 0.3, 0);
    return [0, 1, 2].map((i) => {
      const a = (i * Math.PI * 2) / 3 + Math.PI / 6;
      const foot = new THREE.Vector3(Math.sin(a) * 0.46, 0, Math.cos(a) * 0.46);
      const mid = foot.clone().add(top).multiplyScalar(0.5);
      const dir = top.clone().sub(foot);
      const length = dir.length();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
      return { mid, length, quaternion };
    });
  }, [h]);

  return (
    <group position={[x, 0, z]}>
      {legs.map((leg, i) => (
        <mesh key={i} position={leg.mid} quaternion={leg.quaternion} castShadow>
          <cylinderGeometry args={[0.011, 0.014, leg.length, 8]} />
          <meshStandardMaterial color={C.metal} metalness={0.6} roughness={0.45} />
        </mesh>
      ))}
      {/* centre column and head */}
      <mesh position={[0, h - 0.15, 0]}>
        <cylinderGeometry args={[0.016, 0.016, 0.34, 8]} />
        <meshStandardMaterial color={C.metal} metalness={0.6} roughness={0.45} />
      </mesh>
      <mesh position={[0, h - 0.06, 0]}>
        <boxGeometry args={[0.09, 0.06, 0.09]} />
        <meshStandardMaterial color={C.metal} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* the camera, lens on +z, aimed at the subject */}
      <group ref={head} position={[0, h, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.13, 0.09, 0.17]} />
          <meshStandardMaterial color={C.cameraBody} roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.036, 0.06, 20]} />
          <meshStandardMaterial color="#0a0b0e" roughness={0.35} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.141]}>
          <circleGeometry args={[0.022, 20]} />
          <meshBasicMaterial color={C.lens} />
        </mesh>
        <mesh position={[0, 0, 0.142]}>
          <ringGeometry args={[0.024, 0.03, 24]} />
          <meshBasicMaterial color="#9ec2ff" transparent opacity={0.85} />
        </mesh>
        {/* a small status light on top, blue like the photograph */}
        <mesh position={[0.04, 0.052, 0.02]}>
          <sphereGeometry args={[0.007, 8, 8]} />
          <meshBasicMaterial color="#5b9bff" />
        </mesh>
      </group>
    </group>
  );
}

function CaptureRing({ showSightlines }: { showSightlines: boolean }) {
  const sightlines = useMemo(
    () =>
      CAPTURE_CAMERAS.map((camera) => {
        const lens = new THREE.Vector3(...cameraPosition(camera));
        const toward = AIM.clone().sub(lens).normalize();
        return [lens.add(toward.multiplyScalar(0.16)), AIM.clone()] as [THREE.Vector3, THREE.Vector3];
      }),
    [],
  );
  return (
    <group>
      {CAPTURE_CAMERAS.map((camera, i) => (
        <Tripod key={i} camera={camera} />
      ))}
      {showSightlines &&
        sightlines.map((points, i) => (
          <Line key={i} points={points} color={C.signal} lineWidth={1} transparent opacity={0.1} depthWrite={false} />
        ))}
      {/* the capture floor: two hairline rings around the subject */}
      <mesh position={[SUBJECT.x, 0.012, SUBJECT.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 0.945, 72]} />
        <meshBasicMaterial color={C.signal} transparent opacity={0.42} depthWrite={false} />
      </mesh>
      <mesh position={[SUBJECT.x, 0.011, SUBJECT.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.9, 1.915, 96]} />
        <meshBasicMaterial color={C.signal} transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   The subject — a representation, alive at rest, read by a pose overlay.
   ───────────────────────────────────────────────────────────────────────────── */

/** Landmarks in the figure's own space, and the bones between them. */
const LANDMARKS: Record<string, [number, number, number]> = {
  head: [0, 1.7, 0.02],
  neck: [0, 1.5, 0],
  lShoulder: [-0.22, 1.42, 0],
  rShoulder: [0.22, 1.42, 0],
  lElbow: [-0.26, 1.13, 0.01],
  rElbow: [0.26, 1.13, 0.01],
  lWrist: [-0.27, 0.86, 0.04],
  rWrist: [0.27, 0.86, 0.04],
  lHip: [-0.1, 0.93, 0],
  rHip: [0.1, 0.93, 0],
  lKnee: [-0.1, 0.5, 0.01],
  rKnee: [0.1, 0.5, 0.01],
  lAnkle: [-0.1, 0.09, 0],
  rAnkle: [0.1, 0.09, 0],
};
const BONES: [string, string][] = [
  ["head", "neck"], ["neck", "lShoulder"], ["neck", "rShoulder"],
  ["lShoulder", "lElbow"], ["lElbow", "lWrist"], ["rShoulder", "rElbow"], ["rElbow", "rWrist"],
  ["lShoulder", "lHip"], ["rShoulder", "rHip"], ["lHip", "rHip"],
  ["lHip", "lKnee"], ["lKnee", "lAnkle"], ["rHip", "rKnee"], ["rKnee", "rAnkle"],
];

function PoseOverlay({ reducedMotion }: { reducedMotion: boolean }) {
  const dots = useRef<THREE.MeshBasicMaterial>(null);
  const segments = useMemo(() => BONES.flatMap(([a, b]) => [LANDMARKS[a], LANDMARKS[b]]), []);
  useFrame(({ clock }) => {
    if (!dots.current) return;
    dots.current.opacity = reducedMotion ? 0.85 : 0.6 + 0.3 * (0.5 + 0.5 * Math.sin(clock.getElapsedTime() * 1.6));
  });
  return (
    <group renderOrder={20}>
      <Line points={segments} segments color={C.signal} lineWidth={1.3} transparent opacity={0.75} depthTest={false} depthWrite={false} />
      {Object.values(LANDMARKS).map((p, i) => (
        <mesh key={i} position={p} renderOrder={21}>
          <sphereGeometry args={[0.02, 10, 10]} />
          <meshBasicMaterial ref={i === 0 ? dots : undefined} color={C.signal} transparent opacity={0.85} depthTest={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Subject({ showPose, reducedMotion }: { showPose: boolean; reducedMotion: boolean }) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const hair = useRef<THREE.Mesh>(null);
  const lArm = useRef<THREE.Group>(null);
  const rArm = useRef<THREE.Group>(null);
  const plaid = useCanvasTexture(drawPlaid, 256, [2, 3]);

  /* Idle presence: breath, a slow weight shift, a glance. Amplitudes are
     small enough that a viewer registers "alive" without seeing a loop. */
  useFrame(({ clock }) => {
    if (reducedMotion || !root.current) return;
    const t = clock.getElapsedTime();
    root.current.rotation.y = Math.sin(t * 0.23) * 0.06;
    root.current.rotation.z = Math.sin(t * 0.29) * 0.008;
    root.current.position.x = SUBJECT.x + Math.sin(t * 0.29) * 0.012;
    root.current.position.y = Math.sin(t * 1.15) * 0.004;
    if (torso.current) {
      const breath = 1 + 0.012 * Math.sin(t * 1.15);
      torso.current.scale.set(1, breath, 1 + 0.01 * Math.sin(t * 1.15));
    }
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.37) * 0.16 + Math.sin(t * 0.91) * 0.03;
      head.current.rotation.x = Math.sin(t * 0.61) * 0.025;
    }
    if (hair.current) hair.current.rotation.x = Math.sin(t * 1.2) * 0.02;
    if (lArm.current) lArm.current.rotation.x = Math.sin(t * 0.5) * 0.02;
    if (rArm.current) rArm.current.rotation.x = Math.sin(t * 0.5 + 1.3) * 0.02;
  });

  const skin = <meshStandardMaterial color={C.skin} roughness={0.75} />;
  const arm = (side: -1 | 1, ref: React.RefObject<THREE.Group>) => (
    <group ref={ref} position={[side * 0.23, 1.42, 0]} rotation={[0, 0, side * -0.09]}>
      <mesh position={[0, -0.3, 0]} castShadow>
        <capsuleGeometry args={[0.056, 0.5, 4, 12]} />
        <meshStandardMaterial map={plaid ?? undefined} color={plaid ? "#ffffff" : C.plaidRed} roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.63, 0.02]} castShadow>
        <sphereGeometry args={[0.055, 12, 12]} />
        {skin}
      </mesh>
    </group>
  );

  return (
    <group ref={root} position={[SUBJECT.x, 0, SUBJECT.z]}>
      {/* shoes */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.1, 0.04, 0.03]} castShadow>
          <boxGeometry args={[0.11, 0.08, 0.27]} />
          <meshStandardMaterial color={C.shoe} roughness={0.6} />
        </mesh>
      ))}
      {/* legs — jeans */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.1, 0.52, 0]} castShadow>
          <capsuleGeometry args={[0.085, 0.72, 4, 12]} />
          <meshStandardMaterial color={C.jeans} roughness={0.9} />
        </mesh>
      ))}
      {/* torso — the black vest, with the plaid shirt showing at the collar */}
      <group ref={torso} position={[0, 1.17, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.17, 0.36, 6, 16]} />
          <meshStandardMaterial color={C.vest} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.16, 0.175, 0.09, 16]} />
          <meshStandardMaterial map={plaid ?? undefined} color={plaid ? "#ffffff" : C.plaidRed} roughness={0.85} />
        </mesh>
      </group>
      {arm(-1, lArm)}
      {arm(1, rArm)}
      {/* neck and head */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.05, 0.055, 0.09, 12]} />
        {skin}
      </mesh>
      <group ref={head} position={[0, 1.7, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.115, 24, 20]} />
          {skin}
        </mesh>
        {/* hair: a cap, and the long fall down the back */}
        <mesh position={[0, 0.03, -0.028]}>
          <sphereGeometry args={[0.126, 24, 20]} />
          <meshStandardMaterial color={C.hair} roughness={0.55} />
        </mesh>
        <mesh ref={hair} position={[0, -0.24, -0.1]} scale={[1.35, 1, 0.55]} castShadow>
          <capsuleGeometry args={[0.09, 0.36, 4, 12]} />
          <meshStandardMaterial color={C.hair} roughness={0.55} />
        </mesh>
        {/* glasses */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.046, 0.018, 0.106]}>
            <torusGeometry args={[0.032, 0.004, 8, 20]} />
            <meshStandardMaterial color="#1b1d22" metalness={0.4} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 0.02, 0.112]}>
          <boxGeometry args={[0.028, 0.005, 0.005]} />
          <meshStandardMaterial color="#1b1d22" metalness={0.4} roughness={0.4} />
        </mesh>
      </group>

      {showPose && <PoseOverlay reducedMotion={reducedMotion} />}
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
      <ambientLight intensity={0.32} />
      <hemisphereLight args={["#fff6e2", "#9a8746", 0.55]} />
      {/* Daylight through the left-side windows: the one shadow-casting light. */}
      <directionalLight
        position={[-7, 6.5, -3]}
        intensity={2.6}
        color="#ffd9a4"
        castShadow
        shadow-mapSize={[shadow, shadow]}
        shadow-camera-near={1}
        shadow-camera-far={34}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[7, 5, 6]} intensity={0.45} color="#e3ecff" />
      {/* The ceiling strips, as light. */}
      {[[-5.6, -2.2], [-1.4, 2.6], [3.2, -2.4], [6.4, 2.2]].map(([x, z], i) => (
        <pointLight key={i} position={[x, ROOM.height - 0.25, z]} intensity={14} distance={11} decay={2} color="#fff3df" />
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

  /* A new view sets a goal; the frame loop glides there and hands control
     back. From a capture camera the eye sits at the front of its lens — what
     that camera sees, with its own body behind the eye and out of frame. */
  useEffect(() => {
    if (view.kind === "camera") {
      const lens = new THREE.Vector3(...cameraPosition(CAPTURE_CAMERAS[view.index]));
      const forward = AIM.clone().sub(lens).normalize().multiplyScalar(0.17);
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
    controls.current?.target.lerp(AIM, k);
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
      minDistance={1.5}
      maxDistance={7.3}
      minPolarAngle={0.28}
      maxPolarAngle={1.53}
      autoRotate={!interacted && !reducedMotion && view.kind === "orbit"}
      autoRotateSpeed={0.32}
      onStart={() => {
        setInteracted(true);
        goal.current = null;
      }}
    />
  );
}

/** Reports the first frames drawn, so the shell can lift its veil. */
function Ready({ onReady }: { onReady?: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    if (frames.current > 2) return;
    frames.current += 1;
    if (frames.current === 2) onReady?.();
  });
  return null;
}

export default function LabScene({ view, showPose, showSightlines, quality, reducedMotion, onReady }: LabSceneProps) {
  return (
    <Canvas
      shadows
      dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
      camera={{ position: OVERVIEW.position, fov: 50, near: 0.05, far: 80 }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={["#0a0e17"]} />
      <Suspense fallback={null}>
        <Lights quality={quality} />
        <Room quality={quality} reducedMotion={reducedMotion} />
        <Furniture />
        <CaptureRing showSightlines={showSightlines} />
        <Subject showPose={showPose} reducedMotion={reducedMotion} />
        <Rig view={view} reducedMotion={reducedMotion} />
        <Ready onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}

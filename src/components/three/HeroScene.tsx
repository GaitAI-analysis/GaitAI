"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

/* ---------- Skeletal walking figures rendered as glowing line art ---------- */

type SkeletonKeyframe = number[][]; // 13 joints, each [x, y]

/**
 * Full bilateral gait cycle — 8 keyframes, one complete stride.
 *
 * Joints (13):
 *   0 head | 1 neck | 2 lShoulder | 3 rShoulder
 *   4 lElbow | 5 rElbow | 6 lHand | 7 rHand
 *   8 hip | 9 lKnee | 10 rKnee | 11 lFoot | 12 rFoot
 *
 * Phase sequence:
 *   0 heel-strike-R  1 loading-R  2 mid-stance-R  3 terminal-stance-R
 *   4 heel-strike-L  5 loading-L  6 mid-stance-L  7 terminal-stance-L
 *
 * Key gait signals encoded:
 *   • Feet lift off the ground during swing phase (Y rises to +0.08)
 *   • High-knee moment at mid-swing (frames 2 & 6)
 *   • Contralateral arm/leg swing (right leg fwd ↔ left arm fwd)
 *   • Bilateral mirror symmetry between frames 0–3 and 4–7
 */
const skeletonFrames: SkeletonKeyframe[] = [
  // Frame 0: Right heel strike / Left toe-off
  [
    [0,    1.62], [0,    1.26], [-0.27, 1.2], [0.27, 1.2],
    [-0.18, 0.87], [0.42, 0.88],  // lElbow fwd, rElbow back
    [-0.05, 0.58], [0.54, 0.65],  // lHand fwd, rHand back
    [0.02, 0.55],
    [-0.15, 0.2],  [0.32, 0.18],  // lKnee trailing, rKnee fwd
    [-0.18, -0.28],[0.42, -0.3],  // lFoot behind, rFoot contact
  ],
  // Frame 1: Right loading / Left swing initiation
  [
    [0.02, 1.61], [0.02, 1.26], [-0.27, 1.2], [0.27, 1.2],
    [-0.32, 0.9],  [0.28, 0.87],
    [-0.42, 0.68], [0.38, 0.6],
    [0.02, 0.55],
    [-0.28, 0.32], [0.22, 0.12],  // lKnee lifting, rKnee absorbing
    [-0.12, -0.1], [0.35, -0.3],  // lFoot rising, rFoot flat
  ],
  // Frame 2: Right mid-stance / Left swing peak (foot lifted)
  [
    [0,    1.62], [0,    1.26], [-0.26, 1.2], [0.26, 1.2],
    [-0.4,  0.9],  [0.22, 0.87],  // lElbow fully back, rElbow fwd
    [-0.5,  0.65], [0.3,  0.58],
    [0, 0.56],
    [-0.08, 0.38], [0.05, 0.14],  // lKnee HIGH swing, rKnee supporting
    [0.02,  0.08], [0.05, -0.32], // lFoot lifted off ground, rFoot under body
  ],
  // Frame 3: Right terminal stance / Left swing forward
  [
    [-0.02, 1.61], [-0.02, 1.26], [-0.27, 1.2], [0.27, 1.2],
    [-0.25, 0.88], [0.18, 0.9],
    [-0.15, 0.6],  [0.3,  0.68],
    [-0.02, 0.55],
    [-0.1,  0.2],  [-0.05, 0.16], // lKnee swinging fwd, rKnee trailing
    [0.25, -0.12], [-0.2,  -0.3], // lFoot coming down, rFoot behind
  ],
  // Frame 4: Left heel strike / Right toe-off (bilateral mirror of Frame 0)
  [
    [0,    1.62], [0,    1.26], [-0.27, 1.2], [0.27, 1.2],
    [-0.42, 0.88], [0.18, 0.87],  // lElbow back, rElbow fwd
    [-0.54, 0.65], [0.05, 0.58],  // lHand back, rHand fwd
    [-0.02, 0.55],
    [-0.32, 0.18], [0.15, 0.2],   // lKnee fwd, rKnee trailing
    [-0.42, -0.3], [0.18, -0.28], // lFoot contact, rFoot behind
  ],
  // Frame 5: Left loading / Right swing initiation (mirror of Frame 1)
  [
    [-0.02, 1.61], [-0.02, 1.26], [-0.27, 1.2], [0.27, 1.2],
    [-0.28, 0.87], [0.32, 0.9],
    [-0.38, 0.6],  [0.42, 0.68],
    [-0.02, 0.55],
    [-0.22, 0.12], [0.28, 0.32],  // lKnee absorbing, rKnee lifting
    [-0.35, -0.3], [0.12, -0.1],  // lFoot flat, rFoot rising
  ],
  // Frame 6: Left mid-stance / Right swing peak (foot lifted, mirror of Frame 2)
  [
    [0,    1.62], [0,    1.26], [-0.26, 1.2], [0.26, 1.2],
    [-0.22, 0.87], [0.4,  0.9],   // lElbow fwd, rElbow fully back
    [-0.3,  0.58], [0.5,  0.65],
    [0, 0.56],
    [-0.05, 0.14], [0.08, 0.38],  // lKnee supporting, rKnee HIGH swing
    [-0.05, -0.32],[-0.02, 0.08], // lFoot under body, rFoot lifted off ground
  ],
  // Frame 7: Left terminal stance / Right swing forward (mirror of Frame 3)
  [
    [0.02, 1.61], [0.02, 1.26], [-0.27, 1.2], [0.27, 1.2],
    [-0.18, 0.9],  [0.25, 0.88],
    [-0.3,  0.68], [0.15, 0.6],
    [0.02, 0.55],
    [0.05,  0.16], [0.1,  0.2],   // lKnee trailing, rKnee swinging fwd
    [0.2,  -0.3],  [-0.25, -0.12],// lFoot behind, rFoot coming down
  ],
];

// All 12 bones reference only valid joint indices 0–12 (13 joints total).
const bones: [number, number][] = [
  [0, 1],   // head -> neck
  [1, 2],   // neck -> lShoulder
  [1, 3],   // neck -> rShoulder
  [2, 4],   // lShoulder -> lElbow
  [3, 5],   // rShoulder -> rElbow
  [4, 6],   // lElbow -> lHand
  [5, 7],   // rElbow -> rHand
  [1, 8],   // neck -> hip
  [8, 9],   // hip -> lKnee
  [8, 10],  // hip -> rKnee
  [9, 11],  // lKnee -> lFoot
  [10, 12], // rKnee -> rFoot
];

/** Smoothstep easing — produces organic, biomechanical joint deceleration between keyframes. */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function interpolateFrame(t: number): SkeletonKeyframe {
  const total = skeletonFrames.length;
  const scaled = (t % 1) * total;
  const idx = Math.floor(scaled);
  const next = (idx + 1) % total;
  const a = skeletonFrames[idx];
  const b = skeletonFrames[next];
  const k = smoothstep(scaled - idx);
  return a.map((p, i) => [
    p[0] + (b[i][0] - p[0]) * k,
    p[1] + (b[i][1] - p[1]) * k,
  ]);
}

function WalkingFigure({
  offsetX = 0,
  z = 0,
  opacity = 0.85,
  color = "#4FD1FF",
  speed = 0.35,
  phase = 0,
}: {
  offsetX?: number;
  z?: number;
  opacity?: number;
  color?: string;
  speed?: number;
  phase?: number;
}) {
  const linesRef = useRef<THREE.LineSegments>(null);
  const jointsRef = useRef<THREE.Points>(null);

  const lineGeometry = useMemo(() => new THREE.BufferGeometry(), []);
  const jointsGeometry = useMemo(() => new THREE.BufferGeometry(), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed + phase;
    const frame = interpolateFrame(t);

    // Build line positions from bones
    const linePos = new Float32Array(bones.length * 2 * 3);
    bones.forEach(([a, b], i) => {
      const [ax, ay] = frame[a];
      const [bx, by] = frame[b];
      linePos.set([ax + offsetX, ay, z, bx + offsetX, by, z], i * 6);
    });
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    lineGeometry.attributes.position.needsUpdate = true;

    // Joint positions
    const jointsPos = new Float32Array(frame.length * 3);
    frame.forEach(([x, y], i) => {
      jointsPos.set([x + offsetX, y, z], i * 3);
    });
    jointsGeometry.setAttribute("position", new THREE.BufferAttribute(jointsPos, 3));
    jointsGeometry.attributes.position.needsUpdate = true;
  });

  return (
    <group>
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          linewidth={2}
          toneMapped={false}
        />
      </lineSegments>
      <points ref={jointsRef} geometry={jointsGeometry}>
        <pointsMaterial
          color={color}
          size={0.06}
          sizeAttenuation
          transparent
          opacity={opacity}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

/* ---------- Background particle field ---------- */

function ParticleField({ count = 1800 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 6 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.45;
      arr[i * 3 + 2] = r * Math.cos(phi) - 3;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.04;
    ref.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.1;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled>
      <PointMaterial
        transparent
        color="#5587FF"
        size={0.03}
        sizeAttenuation
        depthWrite={false}
        opacity={0.7}
      />
    </Points>
  );
}

/* ---------- Motion rings ---------- */

function MotionRing({
  radius = 3,
  color = "#2563FF",
  rotation = [Math.PI / 2.4, 0, 0] as [number, number, number],
  opacity = 0.18,
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.getElapsedTime() * 0.1;
  });
  return (
    <mesh ref={ref} rotation={rotation}>
      <torusGeometry args={[radius, 0.008, 16, 200]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} />
    </mesh>
  );
}

/* ---------- Mouse parallax ---------- */

function MouseParallax() {
  const { camera, mouse } = useThree();
  useFrame(() => {
    camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.05;
    camera.position.y += (-mouse.y * 0.3 - camera.position.y) * 0.05;
    camera.lookAt(0, 0.4, 0);
  });
  return null;
}

/* ---------- The scene ---------- */

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 4.2], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#4FD1FF" />
        <pointLight position={[-5, -3, 4]} intensity={0.8} color="#7C3AED" />

        <ParticleField count={1600} />

        <MotionRing radius={2.3} color="#4FD1FF" opacity={0.22} />
        <MotionRing radius={3} color="#2563FF" opacity={0.16} rotation={[Math.PI / 2.6, 0.3, 0]} />
        <MotionRing radius={3.7} color="#7C3AED" opacity={0.12} rotation={[Math.PI / 2.2, -0.2, 0.2]} />

        <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3}>
          <group>
            <WalkingFigure offsetX={-2.4} z={-1.5} opacity={0.35} color="#7C3AED" speed={0.38} phase={0.2} />
            <WalkingFigure offsetX={-1.2} z={-0.6} opacity={0.55} color="#4FD1FF" speed={0.42} phase={0.4} />
            <WalkingFigure offsetX={0}    z={0}    opacity={1}    color="#2563FF" speed={0.46} phase={0.6} />
            <WalkingFigure offsetX={1.2}  z={-0.6} opacity={0.55} color="#4FD1FF" speed={0.42} phase={0.8} />
            <WalkingFigure offsetX={2.4}  z={-1.5} opacity={0.35} color="#2563FF" speed={0.38} phase={1.0} />
          </group>
        </Float>

        <MouseParallax />
      </Suspense>
    </Canvas>
  );
}

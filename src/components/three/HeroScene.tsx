"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

/* ---------- Skeletal walking figures rendered as glowing line art ---------- */

type SkeletonKeyframe = number[][]; // 13 joints, each [x, y]

/* ── Biomechanical gait model ─────────────────────────────────────────────────
 *
 * Poses are NOT stored as joint positions. Instead, 8 explicit gait keyframes
 * store JOINT ANGLES (hip flexion/extension, knee flexion), and positions are
 * computed every frame via forward kinematics from FIXED segment lengths.
 * Consequences, by construction:
 *
 *   • Limb lengths are constant — bones cannot stretch, ever.
 *   • The left leg is the right-leg angle table shifted by half a cycle
 *     (4 of 8 frames), so bilateral timing is exact.
 *   • Each arm's swing is derived from the OPPOSITE leg's hip angle
 *     (left arm ∝ right hip, right arm ∝ left hip), so contralateral
 *     arm–leg coordination can never desynchronise.
 *   • Pelvis/shoulders stay stable; only a subtle vertical bob (±0.02,
 *     two peaks per cycle at the two mid-stances) moves the torso.
 *
 * Joints (13): 0 head | 1 neck | 2 lShoulder | 3 rShoulder | 4 lElbow
 * | 5 rElbow | 6 lHand | 7 rHand | 8 hip | 9 lKnee | 10 rKnee | 11 lFoot
 * | 12 rFoot.  View is sagittal: +x = direction of walk, +y = up.
 */

/** Fixed segment lengths — the skeleton's bones. Never interpolated. */
const SEG = {
  head: 0.36,      // neck -> head centre
  torso: 0.71,     // hip -> neck
  shoulderX: 0.26, // lateral shoulder offset from neck (stylised width)
  shoulderY: 0.06, // shoulders sit slightly below the neck joint
  upperArm: 0.35,  // shoulder -> elbow
  forearm: 0.3,    // elbow -> hand
  thigh: 0.42,     // hip -> knee
  shank: 0.44,     // knee -> foot
};

const DEG = Math.PI / 180;

/** Arm swing amplitude as a fraction of the opposite hip's angle. */
const ARM_COUPLING = 0.75;

/**
 * 8 explicit keyframes over one full stride, RIGHT leg reference.
 *   hip   — thigh angle from vertical, degrees (+ = forward)
 *   knee  — knee flexion, degrees (0 = straight; always ≥ 0, so the knee
 *           can only bend backwards, like a real knee)
 *   hipY  — pelvis height (vertical bob: low at double support, high at
 *           mid-stance — twice per cycle)
 *
 * Rancho Los Amigos phases for the right leg:
 */
const gaitKeys = [
  /* 0 initial contact (heel strike): leg forward, knee nearly extended */
  { hip: 25, knee: 5, hipY: 0.53 },
  /* 1 loading response: knee flexes slightly to absorb weight          */
  { hip: 12, knee: 18, hipY: 0.55 },
  /* 2 mid-stance: torso passes over the planted foot, leg near-vertical */
  { hip: -3, knee: 8, hipY: 0.57 },
  /* 3 terminal stance: leg extends behind, heel beginning to rise       */
  { hip: -18, knee: 12, hipY: 0.55 },
  /* 4 pre-swing / toe-off (= LEFT heel strike): max trailing extension  */
  { hip: -25, knee: 40, hipY: 0.53 },
  /* 5 initial swing: knee flexes to maximum so the foot clears ground   */
  { hip: -5, knee: 65, hipY: 0.55 },
  /* 6 mid swing: thigh advances, knee begins extending                  */
  { hip: 15, knee: 30, hipY: 0.57 },
  /* 7 terminal swing: knee extends, preparing for the next heel strike  */
  { hip: 25, knee: 8, hipY: 0.55 },
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

/** Smoothstep easing — organic joint deceleration between gait keyframes. */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Sample the gait keyframe table at a cycle phase in [0, 1). */
function sampleGait(phase: number): { hip: number; knee: number; hipY: number } {
  const total = gaitKeys.length;
  const scaled = ((phase % 1) + 1) % 1 * total;
  const idx = Math.floor(scaled);
  const next = (idx + 1) % total;
  const a = gaitKeys[idx];
  const b = gaitKeys[next];
  const k = smoothstep(scaled - idx);
  return {
    hip: a.hip + (b.hip - a.hip) * k,
    knee: a.knee + (b.knee - a.knee) * k,
    hipY: a.hipY + (b.hipY - a.hipY) * k,
  };
}

/**
 * Build the 13 joint positions for a given cycle phase via forward kinematics.
 * Right leg samples the table at `phase`; left leg samples the SAME table at
 * `phase + 0.5` (half a stride later). Arms are computed from the opposite
 * leg's hip angle — contralateral coordination is structural.
 */
function interpolateFrame(t: number): SkeletonKeyframe {
  const r = sampleGait(t);       // right leg
  const l = sampleGait(t + 0.5); // left leg — exactly antiphase

  // ── torso: stable pelvis + subtle bob, slight forward lean ──
  const hipX = 0;
  const hipY = r.hipY; // bob table is half-cycle symmetric, so r/l agree
  const neckX = hipX + 0.02;
  const neckY = hipY + SEG.torso;
  const headX = neckX + 0.01;
  const headY = neckY + SEG.head;

  // ── arms: driven by the OPPOSITE hip (left arm ∝ right hip, and vice versa),
  //    swinging from the shoulder with slight elbow flexion (more when forward) ──
  const lArm = ARM_COUPLING * r.hip * DEG; // left arm follows RIGHT leg
  const rArm = ARM_COUPLING * l.hip * DEG; // right arm follows LEFT leg
  const lElbowFlex = Math.max(10, 25 + 0.35 * ARM_COUPLING * r.hip) * DEG;
  const rElbowFlex = Math.max(10, 25 + 0.35 * ARM_COUPLING * l.hip) * DEG;

  const lShoulderX = neckX - SEG.shoulderX;
  const rShoulderX = neckX + SEG.shoulderX;
  const shoulderY = neckY - SEG.shoulderY;

  const lElbowX = lShoulderX + SEG.upperArm * Math.sin(lArm);
  const lElbowY = shoulderY - SEG.upperArm * Math.cos(lArm);
  const rElbowX = rShoulderX + SEG.upperArm * Math.sin(rArm);
  const rElbowY = shoulderY - SEG.upperArm * Math.cos(rArm);

  // Elbow flexion carries the forearm forward of the upper-arm line.
  const lHandX = lElbowX + SEG.forearm * Math.sin(lArm + lElbowFlex);
  const lHandY = lElbowY - SEG.forearm * Math.cos(lArm + lElbowFlex);
  const rHandX = rElbowX + SEG.forearm * Math.sin(rArm + rElbowFlex);
  const rHandY = rElbowY - SEG.forearm * Math.cos(rArm + rElbowFlex);

  // ── legs: thigh from hip angle, shank from hip angle minus knee flexion
  //    (knee can only flex backwards — never hyperextends) ──
  const lHip = l.hip * DEG;
  const rHip = r.hip * DEG;
  const lShank = lHip - l.knee * DEG;
  const rShank = rHip - r.knee * DEG;

  const lKneeX = hipX + SEG.thigh * Math.sin(lHip);
  const lKneeY = hipY - SEG.thigh * Math.cos(lHip);
  const rKneeX = hipX + SEG.thigh * Math.sin(rHip);
  const rKneeY = hipY - SEG.thigh * Math.cos(rHip);

  const lFootX = lKneeX + SEG.shank * Math.sin(lShank);
  const lFootY = lKneeY - SEG.shank * Math.cos(lShank);
  const rFootX = rKneeX + SEG.shank * Math.sin(rShank);
  const rFootY = rKneeY - SEG.shank * Math.cos(rShank);

  return [
    [headX, headY],           // 0 head
    [neckX, neckY],           // 1 neck
    [lShoulderX, shoulderY],  // 2 lShoulder
    [rShoulderX, shoulderY],  // 3 rShoulder
    [lElbowX, lElbowY],       // 4 lElbow
    [rElbowX, rElbowY],       // 5 rElbow
    [lHandX, lHandY],         // 6 lHand
    [rHandX, rHandY],         // 7 rHand
    [hipX, hipY],             // 8 hip
    [lKneeX, lKneeY],         // 9 lKnee
    [rKneeX, rKneeY],         // 10 rKnee
    [lFootX, lFootY],         // 11 lFoot
    [rFootX, rFootY],         // 12 rFoot
  ];
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
            {/* One shared gait cycle, staggered phase offsets — reads left-to-right
                as a gait analysis sequence. speed ≈ cycles/second: 0.72 ≈ 1.4 s
                per stride (within the 1.2–1.6 s observable-walk window). */}
            <WalkingFigure offsetX={-2.4} z={-1.5} opacity={0.35} color="#7C3AED" speed={0.66} phase={0.0} />
            <WalkingFigure offsetX={-1.2} z={-0.6} opacity={0.55} color="#4FD1FF" speed={0.7}  phase={0.2} />
            <WalkingFigure offsetX={0}    z={0}    opacity={1}    color="#2563FF" speed={0.72} phase={0.4} />
            <WalkingFigure offsetX={1.2}  z={-0.6} opacity={0.55} color="#4FD1FF" speed={0.7}  phase={0.6} />
            <WalkingFigure offsetX={2.4}  z={-1.5} opacity={0.35} color="#2563FF" speed={0.66} phase={0.8} />
          </group>
        </Float>

        <MouseParallax />
      </Suspense>
    </Canvas>
  );
}

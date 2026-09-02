import type { ReactNode } from "react";

/**
 * One hand-drawn scene per environment — 44×32 monochrome line art, keyed by
 * the `industryUseCases` id.
 *
 * These are scenes, not icons: each one has a ground plane, a piece of the
 * actual setting (parallel bars, a ward bed, a sawtooth factory roof, a
 * stadium bowl) and, where a person belongs in the frame, a small movement
 * figure standing in it. Drawn in `currentColor` so each panel's accent —
 * teal/cyan for MobilityCare, royal/violet for SecureVision — carries through,
 * and deliberately not photography: no stock imagery stands in for a
 * deployment this platform has not made.
 */

const BASE = {
  viewBox: "0 0 44 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.05,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function Scene({ children }: { children: ReactNode }) {
  return (
    <svg {...BASE} className="env-scene-art">
      {children}
    </svg>
  );
}

/** Dashed ground plane every scene stands on. */
function Ground({ from = 4, to = 40, y = 27 }: { from?: number; to?: number; y?: number }) {
  return <line className="env-scene-ground" x1={from} y1={y} x2={to} y2={y} />;
}

/** A small standing/walking figure, ~10px tall, feet on `y`. */
function Figure({
  x,
  y = 27,
  stride = 1,
  scale = 1,
}: {
  x: number;
  y?: number;
  /** 0 = standing, 1 = mid-stride. */
  stride?: number;
  scale?: number;
}) {
  const s = 1.9 * stride;
  return (
    <g
      className="env-scene-figure"
      transform={`translate(${x} ${y})${scale === 1 ? "" : ` scale(${scale})`}`}
    >
      <circle cx="0" cy="-9.4" r="1.45" />
      <path d="M0 -7.9 L0 -4" />
      <path d={`M0 -6.9 L${-1.6 - s * 0.3} ${-4.8} M0 -6.9 L${1.8 + s * 0.3} ${-5.2}`} />
      <path d={`M0 -4 L${-s} 0 M0 -4 L${s * 1.1} 0`} />
    </g>
  );
}

/* ─────────────────────────── MobilityCare scenes ─────────────────────────── */

/** Physiotherapy — parallel bars with a patient walking between them. */
function Physio() {
  return (
    <Scene>
      <Ground />
      <path className="env-scene-far" d="M7 12 H37" />
      <path d="M7 16 H37" />
      <path d="M9 16 V27 M22 16 V27 M35 16 V27" />
      <Figure x={22} stride={1.1} />
    </Scene>
  );
}

/** Hospital ward — bed, headboard and an IV stand. */
function Hospitals() {
  return (
    <Scene>
      <Ground />
      <path d="M8 27 V21 H29 V27" />
      <path d="M8 21 H29" />
      <path d="M7 21 V13" />
      <path className="env-scene-far" d="M10 21 C11 18.4 15 18.4 16 21" />
      <path d="M34 27 V9" />
      <path d="M32 9 H37 V13 H32 Z" />
      <path className="env-scene-far" d="M34.5 13 C34.5 15.5 31 16 31 18.6" />
      <circle className="env-scene-node" cx="34" cy="27" r="0.9" />
    </Scene>
  );
}

/** Sports academy — a running track bend with an athlete on it. */
function Sports() {
  return (
    <Scene>
      <Ground />
      <path d="M3 27 C8 14 36 14 41 27" />
      <path className="env-scene-far" d="M9 27 C13 19 31 19 35 27" />
      <g className="env-scene-figure" transform="translate(22 22)">
        <circle cx="1.6" cy="-9.6" r="1.45" />
        <path d="M1.2 -8.1 L-0.4 -4.2" />
        <path d="M0.9 -7 L4 -6 M0.9 -7 L-1.8 -8.4" />
        <path d="M-0.4 -4.2 L2.6 -1.6 M-0.4 -4.2 L-3.4 -1" />
      </g>
    </Scene>
  );
}

/** Elderly care — a resident with a cane, and a chair to return to. */
function Elderly() {
  return (
    <Scene>
      <Ground />
      <Figure x={15} stride={0.55} />
      <path d="M19.6 18.4 L20.8 27" />
      <path className="env-scene-far" d="M18.4 18 H20.8" />
      <path d="M29 27 V18 H36 V27" />
      <path d="M36 18 V9.5 H30.4" />
      <circle className="env-scene-node" cx="20.8" cy="27" r="0.9" />
    </Scene>
  );
}

/** Neurology — head profile carrying a movement waveform. */
function Neuro() {
  return (
    <Scene>
      <Ground from={8} to={36} />
      <path d="M27 24 V21.4 C31.5 19.4 33 14.6 31.4 11 C29.6 6.8 24.4 5 20 6.4 C15.2 8 12.6 12.6 14 17 C14.6 19 16 20.4 16 22 V24" />
      <path
        className="env-scene-signal"
        d="M17.6 15.6 C19 12.6 20.6 18.4 22 15.6 C23.4 12.8 25 18 26.6 14.6"
      />
      <circle className="env-scene-node" cx="17.6" cy="15.6" r="0.9" />
      <circle className="env-scene-node" cx="26.6" cy="14.6" r="0.9" />
    </Scene>
  );
}

/** Home care — a house, and someone moving inside it. */
function Homecare() {
  return (
    <Scene>
      <Ground />
      <path d="M9 16.4 L23 7 L37 16.4" />
      <path d="M12 15 V27 M34 15 V27" />
      <path d="M27 27 V19.6 H32 V27" />
      <path className="env-scene-far" d="M15 19 H20 V23 H15 Z" />
      <Figure x={22.5} stride={0.9} />
    </Scene>
  );
}

/** Fitness — treadmill deck with a member on it, and a loaded bar. */
function Fitness() {
  return (
    <Scene>
      <Ground />
      <path d="M6 24.6 H24" />
      <path className="env-scene-far" d="M6 24.6 C6 26.4 24 26.4 24 24.6" />
      <path d="M24 24.6 L28 13.6 H33" />
      <g className="env-scene-figure" transform="translate(14 24.6)">
        <circle cx="0.8" cy="-9.4" r="1.45" />
        <path d="M0.6 -7.9 L-0.4 -4.2" />
        <path d="M0.4 -6.9 L3.2 -6.2 M0.4 -6.9 L-2 -8" />
        <path d="M-0.4 -4.2 L2 -1.2 M-0.4 -4.2 L-2.8 -0.6" />
      </g>
      <path d="M35 20 H42" />
      <path d="M36.2 17.4 V22.6 M40.8 17.4 V22.6" />
    </Scene>
  );
}

/** School — a school building with a flag and two children. */
function Schools() {
  return (
    <Scene>
      <Ground />
      <path d="M10 15 L22 8.6 L34 15" />
      <path d="M12.4 15 V27 H31.6 V15" />
      <path d="M19.4 27 V20.4 H24.6 V27" />
      <path className="env-scene-far" d="M14.6 17.6 H17.6 M26.4 17.6 H29.4" />
      <path d="M37.6 27 V7.6" />
      <path d="M37.6 7.6 H42 V10.6 H37.6" />
      <Figure x={6.6} stride={0.9} scale={0.78} />
    </Scene>
  );
}

/** Prosthetic & orthotic — a limb with a pylon, on its alignment axis. */
function Prosthetics() {
  return (
    <Scene>
      <Ground from={12} to={38} />
      <path className="env-scene-signal" d="M17 5 V29" />
      <path d="M23 6 L24 15" />
      <circle cx="24.2" cy="16.4" r="1.7" />
      <path d="M24.2 18.2 V24.4" />
      <path className="env-scene-far" d="M22.6 19.6 V23.6 M25.8 19.6 V23.6" />
      <path d="M24.2 24.4 H30.6" />
      <path className="env-scene-far" d="M17 11 H21 M17 21.4 H21.4" />
      <circle className="env-scene-node" cx="24.2" cy="16.4" r="0.85" />
    </Scene>
  );
}

/** Insurance & wellness — a cohort shield carrying a movement trace. */
function Insurance() {
  return (
    <Scene>
      <Ground from={10} to={34} />
      <path d="M22 5.6 L31.4 9.6 V17.6 C31.4 22.6 26.8 26 22 27 C17.2 26 12.6 22.6 12.6 17.6 V9.6 Z" />
      <path
        className="env-scene-signal"
        d="M15.6 17.4 H18 L19.6 13.8 L21.6 20.4 L23.4 16 H28.4"
      />
      <circle className="env-scene-node" cx="28.4" cy="16" r="0.9" />
    </Scene>
  );
}

/** Clinical trials — a microscope beside a cohort trend. */
function Trials() {
  return (
    <Scene>
      <Ground />
      <path d="M6 27 H19" />
      <path d="M11 27 C9 20.6 12.6 16.6 14.6 15.2" />
      <path d="M14.6 15.2 L19 9.4" />
      <path d="M18 8.2 L21.6 11" />
      <path d="M10.6 20.6 H16.6" />
      <path className="env-scene-far" d="M28 27 V13.4 M28 27 H40.6" />
      <path className="env-scene-signal" d="M29.4 24.4 C32.4 24.4 33.4 18 39.4 15.6" />
      <circle className="env-scene-node" cx="39.4" cy="15.6" r="0.9" />
    </Scene>
  );
}

/* ─────────────────────────── SecureVision scenes ─────────────────────────── */

/** Airport / metro — a concourse window band with an aircraft above it. */
function Airports() {
  return (
    <Scene>
      <Ground />
      <path d="M10 11.6 H30" />
      <path d="M30 11.6 C32.6 11.6 33.6 12.4 34.6 11.6" />
      <path d="M18 11.6 L24 6.6 M18 11.6 L24 16.6" />
      <path d="M28.6 11.6 L31.6 8" />
      <path d="M4 21.4 H40" />
      <path className="env-scene-far" d="M8 21.4 V25 M14 21.4 V25 M20 21.4 V25 M26 21.4 V25 M32 21.4 V25 M38 21.4 V25" />
      <Figure x={16} stride={1.2} scale={0.62} />
      <Figure x={29} stride={0.7} scale={0.62} />
    </Scene>
  );
}

/** Smart city — a block skyline with a sensing node above it. */
function Smartcities() {
  return (
    <Scene>
      <Ground />
      <path d="M5 27 V18.4 H10 V27" />
      <path d="M12 27 V11.6 H18 V27" />
      <path d="M20 27 V20.6 H25 V27" />
      <path d="M27 27 V14.6 H33 V27" />
      <path className="env-scene-far" d="M14 15 H16 M29 18 H31" />
      <circle className="env-scene-node" cx="37.6" cy="9.6" r="1.5" />
      <path className="env-scene-signal" d="M35 12.4 C33.6 11 33.6 8.2 35 6.8" />
      <path className="env-scene-signal" d="M40.2 12.4 C41.6 11 41.6 8.2 40.2 6.8" />
      <path d="M37.6 11.4 V27" />
    </Scene>
  );
}

/** Campus — a pillared block with people crossing the walkway. */
function Campuses() {
  return (
    <Scene>
      <Ground />
      <path d="M12 13.6 L24 7.6 L36 13.6" />
      <path d="M14.6 13.6 V23.6 M19 13.6 V23.6 M24 13.6 V23.6 M29 13.6 V23.6 M33.4 13.6 V23.6" />
      <path d="M12.6 23.6 H35.4" />
      <Figure x={6.4} stride={1.1} scale={0.72} />
      <circle className="env-scene-node" cx="39.6" cy="24.6" r="0.9" />
    </Scene>
  );
}

/** Factory — a sawtooth roof, a stack and a worker on the floor. */
function Factories() {
  return (
    <Scene>
      <Ground />
      <path d="M5 18.4 L9 13.4 V18.4 L13 13.4 V18.4 L17 13.4 V18.4 L21 13.4 V18.4" />
      <path d="M5 18.4 V27 H25 V18.4" />
      <path d="M30 27 V9.6 H34.4 V27" />
      <path className="env-scene-signal" d="M32.2 7.6 C30.6 6 33.8 4.6 32.2 3" />
      <path className="env-scene-far" d="M8 22.4 H12 M16 22.4 H20" />
      <Figure x={38} stride={0.9} scale={0.7} />
    </Scene>
  );
}

/** Retail — an awning, a shopfront and a shopper. */
function Retail() {
  return (
    <Scene>
      <Ground />
      <path d="M7 12 H29 L27 16.4 H9 Z" />
      <path d="M9 16.4 V27 H27 V16.4" />
      <path d="M15 27 V20 H21 V27" />
      <path className="env-scene-far" d="M11.4 19 H13.4" />
      <path d="M32 20.4 H38.6 V27 H32 Z" />
      <path className="env-scene-far" d="M33.6 20.4 C33.6 18 37 18 37 20.4" />
      <Figure x={30} stride={0.8} scale={0.66} />
    </Scene>
  );
}

/** Stadium — the bowl, a floodlight and the crowd on the rake. */
function Events() {
  return (
    <Scene>
      <Ground />
      <path d="M5 25.4 C5 14.4 39 14.4 39 25.4" />
      <path className="env-scene-far" d="M10.6 25.4 C10.6 18.4 33.4 18.4 33.4 25.4" />
      <path d="M35.6 14.6 V6.6" />
      <path d="M32.6 4 H38.6 V6.6 H32.6 Z" />
      {[13, 17.5, 22, 26.5, 31].map((cx, i) => (
        <circle
          key={cx}
          className="env-scene-node"
          cx={cx}
          cy={i % 2 === 0 ? 20.6 : 19.4}
          r="0.9"
        />
      ))}
    </Scene>
  );
}

/* ────────────────────────────────── registry ────────────────────────────── */

const SCENES: Record<string, () => JSX.Element> = {
  physio: Physio,
  hospitals: Hospitals,
  sports: Sports,
  elderly: Elderly,
  neuro: Neuro,
  homecare: Homecare,
  fitness: Fitness,
  schools: Schools,
  prosthetics: Prosthetics,
  insurance: Insurance,
  trials: Trials,
  airports: Airports,
  smartcities: Smartcities,
  campuses: Campuses,
  factories: Factories,
  retail: Retail,
  events: Events,
};

/**
 * Scene for an environment id. A new environment with no scene yet falls back
 * to a bare movement figure on a ground plane rather than to a stock glyph.
 */
export function EnvironmentScene({ id }: { id: string }) {
  const Drawn = SCENES[id];
  if (Drawn) return <Drawn />;
  return (
    <Scene>
      <Ground />
      <Figure x={22} stride={1} />
    </Scene>
  );
}

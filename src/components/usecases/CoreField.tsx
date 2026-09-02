import styles from "./constellation.module.css";

/**
 * The radial field behind the system map.
 *
 * The map's core already had rings and sample ticks, but it sat as a small
 * disc between two rails on flat black — the reference's nucleus is the
 * brightest thing on the page and its light reaches across the whole
 * composition. This is that reach: one wide element centred on the core,
 * spanning the full map, carrying the spoke-and-point field that the reference
 * draws around its nucleus.
 *
 * It sits BEHIND the rails and fades out before it reaches them, so the rows
 * stay readable — the field is depth, not decoration on top of content.
 *
 * WHY THIS AND NOT A MEASURED FAN TO EVERY ROW
 * A curve from the nucleus to each of the seventeen rows needs each row's
 * pixel centre, which depends on how its output line wraps; the rails already
 * solve that with per-row leads and nodes. So the nucleus reaches outward with
 * a radial field instead, and the rails carry the wiring. The two together
 * read as the reference's composition without either of them being fragile.
 *
 * Geometry is deterministic: spokes at fixed angles, points at fixed radii.
 */

const W = 1200;
const H = 760;
const CX = W / 2;
const CY = H / 2;

const r1 = (n: number) => Math.round(n * 10) / 10;

/** 0–1 from an integer — the same generator the shared field uses. */
const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export function CoreField() {
  /** 72 spokes; every third one runs long. */
  const spokes = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    const long = i % 3 === 0;
    const r0 = 118;
    const r2 = r0 + (long ? 132 : 58) + rnd(i) * 46;
    return {
      x1: r1(CX + Math.cos(a) * r0 * 1.55),
      y1: r1(CY + Math.sin(a) * r0),
      x2: r1(CX + Math.cos(a) * r2 * 1.55),
      y2: r1(CY + Math.sin(a) * r2),
      long,
    };
  });

  /** Points scattered along the spokes — the reference's dust field. */
  const points = Array.from({ length: 190 }, (_, i) => {
    const a = rnd(i * 3 + 5) * Math.PI * 2;
    const rad = 122 + Math.pow(rnd(i * 7 + 11), 0.55) * 260;
    const tone = rnd(i * 13 + 3);
    return {
      x: r1(CX + Math.cos(a) * rad * 1.62),
      y: r1(CY + Math.sin(a) * rad),
      r: r1(0.9 + rnd(i * 5 + 2) * 1.5),
      tone,
    };
  });

  /** Three concentric arc rings, drawn as dashed ellipses. */
  const rings = [188, 252, 318];

  return (
    <span aria-hidden="true" className={styles.coreField}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className={styles.coreFieldSvg}
      >
        <defs>
          <radialGradient id="uc-field-fade">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.45" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="uc-field-mask">
            <rect x="0" y="0" width={W} height={H} fill="url(#uc-field-fade)" />
          </mask>
        </defs>

        <g mask="url(#uc-field-mask)">
          {rings.map((r, i) => (
            <ellipse
              key={r}
              className={i === 1 ? styles.coreRingMid : styles.coreRing}
              cx={CX}
              cy={CY}
              rx={r1(r * 1.6)}
              ry={r}
            />
          ))}

          {spokes.map((spoke, i) => (
            <line
              key={i}
              className={spoke.long ? styles.coreSpokeLong : styles.coreSpoke}
              x1={spoke.x1}
              y1={spoke.y1}
              x2={spoke.x2}
              y2={spoke.y2}
            />
          ))}

          {points.map((point, i) => (
            <circle
              key={i}
              className={
                point.tone > 0.78
                  ? styles.corePointBright
                  : point.tone > 0.45
                    ? styles.corePointWarm
                    : styles.corePoint
              }
              cx={point.x}
              cy={point.y}
              r={point.r}
            />
          ))}
        </g>
      </svg>
    </span>
  );
}

import { analyticsEnvironments } from "@/data/analytics";
import styles from "./constellation.module.css";

/**
 * The deployment constellation — the /use-cases hero's right-hand half.
 *
 * The hero was a headline on an empty half-page. The reference fills that half
 * with the thing the page is about: environments scattered across a survey
 * field, each on a light trail back to one origin. This draws exactly that,
 * from the real records — nine of the seventeen environments, named by their
 * own `shortName`, cyan where the question is about a person and violet where
 * it is about a space.
 *
 * The origin sits at the lower left of the frame, which is where the system
 * map's core sits in the section immediately below: the hero and the map read
 * as one diagram continuing down the page rather than two illustrations.
 *
 * WHY TRAILS AND NOT LINES
 * A straight spoke diagram says "connected". A curve that leaves the origin
 * heading outward and arrives at the pin from the side says "reaches" — which
 * is the actual claim: one platform extending into places that are nothing
 * like each other. Each trail carries a dash of brighter stroke at its far end
 * so the direction of travel reads without an arrowhead.
 *
 * Every coordinate is fixed data, so the composition is identical on the
 * server, on the client and in a screenshot.
 */

const W = 560;
const H = 440;
const ORIGIN: [number, number] = [58, 386];

/** Where each pin sits, and which family it belongs to. */
const PINS: { id: string; x: number; y: number }[] = [
  { id: "hospitals", x: 196, y: 60 },
  { id: "elderly", x: 96, y: 148 },
  { id: "physio", x: 250, y: 208 },
  { id: "homecare", x: 138, y: 268 },
  { id: "airports", x: 402, y: 40 },
  { id: "smartcities", x: 470, y: 128 },
  { id: "events", x: 372, y: 176 },
  { id: "campuses", x: 452, y: 246 },
  { id: "factories", x: 330, y: 304 },
];

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * A trail from the origin to a pin: out along the origin's own direction
 * first, then in toward the pin from its left.
 */
function trail([x, y]: [number, number]): string {
  const [ox, oy] = ORIGIN;
  const dx = x - ox;
  const dy = y - oy;
  const c1x = ox + dx * 0.1 + 40;
  const c1y = oy + dy * 0.62;
  const c2x = ox + dx * 0.42;
  const c2y = y + Math.sign(dy) * 18;
  return `M ${ox} ${oy} C ${r1(c1x)} ${r1(c1y)} ${r1(c2x)} ${r1(c2y)} ${x} ${y}`;
}

export function DeploymentConstellation() {
  const pins = PINS.flatMap((pin) => {
    const environment = analyticsEnvironments.find((item) => item.id === pin.id);
    return environment
      ? [{ ...pin, name: environment.shortName, family: environment.family }]
      : [];
  });

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        role="img"
        aria-label={`Nine of GaitAI's ${analyticsEnvironments.length} documented environments, each connected back to one shared movement-intelligence platform.`}
      >
        <defs>
          <radialGradient id="uc-origin">
            <stop offset="0" stopColor="#DFF3FF" stopOpacity="0.72" />
            <stop offset="0.35" stopColor="#4FD1FF" stopOpacity="0.34" />
            <stop offset="1" stopColor="#2563FF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="uc-trail-care" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#4FD1FF" stopOpacity="0.55" />
            <stop offset="1" stopColor="#4FD1FF" stopOpacity="0.14" />
          </linearGradient>
          <linearGradient id="uc-trail-secure" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#5587FF" stopOpacity="0.5" />
            <stop offset="1" stopColor="#A78BFA" stopOpacity="0.16" />
          </linearGradient>
        </defs>

        {/* A local survey grid, tighter than the section field, so the pins
            sit on measured ground rather than in space. */}
        <g className={styles.grid}>
          {Array.from({ length: 15 }, (_, i) => (
            <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={H} />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 40} x2={W} y2={i * 40} />
          ))}
        </g>

        {/* Trails, drawn under everything else. */}
        {pins.map((pin) => (
          <path
            key={`t${pin.id}`}
            className={styles.trail}
            stroke={
              pin.family === "securevision"
                ? "url(#uc-trail-secure)"
                : "url(#uc-trail-care)"
            }
            d={trail([pin.x, pin.y])}
          />
        ))}

        {/* The origin: one platform. */}
        <circle cx={ORIGIN[0]} cy={ORIGIN[1]} r={92} fill="url(#uc-origin)" />
        <circle className={styles.originRing} cx={ORIGIN[0]} cy={ORIGIN[1]} r={26} />
        <circle className={styles.originCore} cx={ORIGIN[0]} cy={ORIGIN[1]} r={7} />
        {/* Radial sample ticks — the site's Motion DNA mark, at the source. */}
        <g className={styles.originTicks}>
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i / 36) * Math.PI * 2;
            const r0 = 32;
            const r2 = r0 + (i % 3 === 0 ? 8 : 4);
            return (
              <line
                key={i}
                x1={r1(ORIGIN[0] + Math.cos(a) * r0)}
                y1={r1(ORIGIN[1] + Math.sin(a) * r0)}
                x2={r1(ORIGIN[0] + Math.cos(a) * r2)}
                y2={r1(ORIGIN[1] + Math.sin(a) * r2)}
              />
            );
          })}
        </g>

        {/* Pins. A hairline ring with a lit centre — a marker, not an icon. */}
        {pins.map((pin) => {
          const secure = pin.family === "securevision";
          const anchor = pin.x > W * 0.72 ? "end" : "start";
          const labelX = anchor === "end" ? pin.x - 14 : pin.x + 14;
          return (
            <g
              key={pin.id}
              className={secure ? styles.pinSecure : styles.pinCare}
            >
              <circle className={styles.pinHalo} cx={pin.x} cy={pin.y} r={13} />
              <circle className={styles.pinRing} cx={pin.x} cy={pin.y} r={7} />
              <circle className={styles.pinDot} cx={pin.x} cy={pin.y} r={2.4} />
              <text
                className={styles.pinLabel}
                x={labelX}
                y={pin.y + 3.5}
                textAnchor={anchor}
              >
                {pin.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
